import { and, eq } from "drizzle-orm";
import { AgentConfig, db, Routines } from "@/db";
import { executeAgentChat } from "@/lib/openai/openai-agent";
import { routineSchema } from "@/lib/openai/agent-response-schema";
import { getAnsweredClarificationIds } from "@/lib/openai/clarification-context";
import { getAgentChatHistory, saveAgentChatHistory } from "@/lib/agent-chat-history";
import { createApprovalResponse } from "./approval";
import { buildExplicitConnectionResponse, loadToolContext } from "./connections";
import { finalizeAgentResponse } from "./finalize-response";
import {
    getLatestUserText, isRoutinePlanningConversation, requiresVmDesktopForRequest, runRoutineLanguage,
} from "./patterns";
import { handleRunRoutine } from "./run-routine";
import { handleSlackDestination } from "./slack";

export type ChatResult = { status: number; body: any };
const fail = (status: number, error: string): ChatResult => ({ status, body: { error } });

async function getOwnedAgent(agentId: string, userEmail: string) {
    const [agent] = await db.select().from(AgentConfig)
        .where(and(eq(AgentConfig.agentId, agentId), eq(AgentConfig.userEmail, userEmail)))
        .limit(1);
    return agent ?? null;
}

async function loadEditingRoutine(routineId: unknown, agentId: string, userEmail: string) {
    if (typeof routineId !== "string" || !routineId) return { routine: null, notFound: false };

    const [saved] = await db.select().from(Routines)
        .where(and(eq(Routines.id, routineId), eq(Routines.agentId, agentId), eq(Routines.userEmail, userEmail)))
        .limit(1);
    if (!saved) return { routine: null, notFound: true };

    return {
        notFound: false,
        routine: routineSchema.parse({
            name: saved.name,
            goal: saved.goal,
            instructions: saved.instructions,
            schedule: saved.schedule,
            tools: saved.tools,
        }),
    };
}

export async function getChatHistory(userEmail: string | null | undefined, agentId: string | null): Promise<ChatResult> {
    if (!userEmail) return fail(401, "Unauthorized");
    if (!agentId) return fail(400, "Missing agentId");
    if (!(await getOwnedAgent(agentId, userEmail))) return fail(404, "Agent not found");

    const history = await getAgentChatHistory(agentId, userEmail);
    return {
        status: 200,
        body: {
            history: history
                ? { messages: history.requestMessages, timezone: history.timezone, updatedAt: history.updatedAt }
                : null,
        },
    };
}

export async function handleChatPost(userEmail: string | null | undefined, payload: any): Promise<ChatResult> {
    if (!userEmail) return fail(401, "Unauthorized");

    const { agentId, messages, timezone, editingRoutineId } = payload ?? {};
    if (!agentId || !Array.isArray(messages)) return fail(400, "Missing agentId or messages");

    const agentConfig = await getOwnedAgent(agentId, userEmail);
    if (!agentConfig) return fail(404, "Agent not found");

    const requestTimezone = typeof timezone === "string" && timezone ? timezone : "UTC";

    const respond = async (response: unknown, toolCards: unknown = []): Promise<ChatResult> => {
        try {
            await saveAgentChatHistory({
                agentId,
                userEmail,
                messages,
                timezone: requestTimezone,
                editingRoutineId: typeof editingRoutineId === "string" ? editingRoutineId : null,
                response,
                toolCards,
            });
        } catch (error) {
            console.error("Failed to save agent chat history", error);
        }
        return { status: 200, body: { response, toolCards } };
    };

    const latestUserText = getLatestUserText(messages);

    // 1. "Lance la routine X"
    if (runRoutineLanguage.test(latestUserText)) {
        return respond(await handleRunRoutine({ agentId, userEmail, latestUserText }));
    }

    // 2. Routine en cours d'édition
    const { routine: editingRoutine, notFound } = await loadEditingRoutine(editingRoutineId, agentId, userEmail);
    if (notFound) return fail(404, "Routine not found");

    const planningOnly = Boolean(editingRoutine) || isRoutinePlanningConversation(messages);

    // 3. Outils connectés
    const ctx = await loadToolContext(agentConfig, agentId, userEmail);

    // 4. Slack sans destination
    const slackResponse = await handleSlackDestination({ latestUserText, messages, ctx, planningOnly, requestTimezone });
    if (slackResponse) return respond(slackResponse);

    // 5. Exécution (connexion explicite ou LLM)
    const explicit = buildExplicitConnectionResponse(latestUserText, ctx);
    const execution: any = explicit
        ? { response: explicit, pendingApproval: null }
        : await executeAgentChat(
            agentConfig.name,
            agentConfig?.description ?? "",
            messages,
            ctx.agentComposioTools,
            ctx.tools,
            ctx.connectedToolSlugs,
            requestTimezone,
            planningOnly,
            editingRoutine,
            requiresVmDesktopForRequest(latestUserText) ? { agentId, userEmail } : null,
             userEmail
        );

    // 6. Approbation en attente
    const agentResponse = execution.pendingApproval
        ? await createApprovalResponse({
            pendingApproval: execution.pendingApproval,
            agentId,
            userEmail,
            timezone: requestTimezone,
        })
        : execution.response;

    if (!agentResponse) return fail(502, "Agent returned no response");

    // 7. Normalisation finale
    const { response, toolCards } = await finalizeAgentResponse({
        agentResponse,
        messages,
        latestUserText,
        ctx,
        editingRoutine,
        requestTimezone,
        answeredClarificationIds: getAnsweredClarificationIds(messages),
        agentId,
        userEmail,
    });

    return respond(response, toolCards);
}