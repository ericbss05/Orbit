import { setAgentToolConnection } from "@/lib/agent-tools";
import { dedupeSuggestions, getAllUserText, includesCatalogTool, timePattern } from "./patterns";
import type { ToolContext } from "./connections";

type Tool = ToolContext["tools"][number];

const toSuggestion = (tool: Tool, reason: string) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    reason,
    icon: "",
    isConnected: false,
    isEnabled: true,
});

const toolNameOf = (tools: Tool[], slug: string) =>
    tools.find((t) => t.slug.toLowerCase() === slug.toLowerCase())?.name ?? slug;

/** Ajoute les questions manquantes (heure, canal Slack) pour les routines. */
function buildRoutineQuestions(p: {
    agentResponse: any;
    inferredRoutineTools: ReturnType<typeof toSuggestion>[];
    userRequestText: string;
    editingRoutine: unknown;
    requestTimezone: string;
    answeredClarificationIds: Set<string>;
}) {
    const { agentResponse, inferredRoutineTools, userRequestText, editingRoutine, requestTimezone, answeredClarificationIds } = p;
    const questions = [...agentResponse.questions];
    const isRoutine = agentResponse.intent === "routine";

    const hasExplicitTime = Boolean(editingRoutine) || timePattern.test(userRequestText);
    if (isRoutine && !hasExplicitTime
        && !answeredClarificationIds.has("run_time")
        && !questions.some((q) => /\btime\b|what hour/i.test(q.question))) {
        questions.push({
            id: "run_time",
            question: `What time should this routine run in ${requestTimezone || "your timezone"}?`,
            options: [],
        });
    }

    const requiresSlackChannel = isRoutine
        && inferredRoutineTools.some((t) => t.slug.toLowerCase() === "slack")
        && !editingRoutine
        && !/#[-\w]+|slack\s+channel(?:\s+named)?\s+(?:["'][^"']+["']|[a-z0-9_-]+)/i.test(userRequestText)
        && !answeredClarificationIds.has("slack_channel");
    if (requiresSlackChannel && !questions.some((q) => /slack|channel/i.test(q.question))) {
        questions.push({
            id: "slack_channel",
            question: "Which Slack channel should receive the routine's output?",
            options: [],
        });
    }
    return questions;
}

export async function finalizeAgentResponse(p: {
    agentResponse: any;
    messages: any[];
    latestUserText: string;
    ctx: ToolContext;
    editingRoutine: unknown;
    requestTimezone: string;
    answeredClarificationIds: Set<string>;
    agentId: string;
    userEmail: string;
}) {
    const { agentResponse, messages, latestUserText, ctx, editingRoutine, requestTimezone,
        answeredClarificationIds, agentId, userEmail } = p;
    const { tools, activeAccounts } = ctx;
    const userRequestText = getAllUserText(messages);
    const isConnected = (slug: string) => Boolean(activeAccounts[slug.toLowerCase()]?.length);

    // 1. Inférence des tools
    const inferredRoutineTools = agentResponse.intent === "routine"
        ? tools
            .filter((t) => includesCatalogTool(userRequestText, t.slug, t.name))
            .map((t) => toSuggestion(t, `Required for this routine's ${t.name} step.`))
        : [];

    const responseRequestsConnection = agentResponse.type === "tool_connection"
        || /\b(?:connect|link|authorize)\b.{0,80}\b(?:account|app|integration|tool|slack|reddit|gmail|outlook|notion|calendar|github)\b/i
            .test(agentResponse.message);

    const inferredConnectionTools = agentResponse.intent !== "routine" && responseRequestsConnection
        ? tools
            .filter((t) => includesCatalogTool(`${latestUserText}\n${agentResponse.message}`, t.slug, t.name))
            .map((t) => toSuggestion(t, `Connect ${t.name} so this agent can use it on your behalf.`))
        : [];

    // 2. Questions de clarification pour les routines
    const routineQuestions = buildRoutineQuestions({
        agentResponse, inferredRoutineTools, userRequestText, editingRoutine, requestTimezone, answeredClarificationIds,
    });
    const mustClarifyRoutine = agentResponse.intent === "routine" && routineQuestions.length > 0;

    const responseBeforeConnectionStatus = mustClarifyRoutine
        ? {
            ...agentResponse,
            type: "clarification" as const,
            message: agentResponse.type === "routine"
                ? "I can set up that routine after you provide the missing details."
                : agentResponse.message,
            questions: routineQuestions,
            suggestedTools: dedupeSuggestions([
                ...agentResponse.suggestedTools,
                ...(agentResponse.routine?.tools ?? []),
                ...inferredRoutineTools,
            ]),
            routine: null,
        }
        : {
            ...agentResponse,
            questions: routineQuestions,
            suggestedTools: agentResponse.routine
                ? agentResponse.suggestedTools
                : dedupeSuggestions([
                    ...agentResponse.suggestedTools,
                    ...inferredRoutineTools,
                    ...inferredConnectionTools,
                ]),
            routine: agentResponse.routine
                ? { ...agentResponse.routine, tools: dedupeSuggestions([...agentResponse.routine.tools, ...inferredRoutineTools]) }
                : null,
        };

    // 3. Statut de connexion
    const connectionSuggestions = responseBeforeConnectionStatus.suggestedTools.filter((s: any) =>
        inferredConnectionTools.some((t) => t.slug.toLowerCase() === s.slug.toLowerCase())
    );
    const disconnected = connectionSuggestions.filter((s: any) => !isConnected(s.slug));

    const response = connectionSuggestions.length > 0
        ? {
            ...responseBeforeConnectionStatus,
            type: disconnected.length > 0 ? ("tool_connection" as const) : ("message" as const),
            message: disconnected.length > 0
                ? `Connect ${disconnected.map((t: any) => toolNameOf(tools, t.slug)).join(", ")} below to give this agent access.`
                : `${connectionSuggestions.map((t: any) => toolNameOf(tools, t.slug)).join(", ")} is already connected and available to this agent.`,
            suggestedTools: disconnected,
        }
        : responseBeforeConnectionStatus;

    // 4. Cartes d'outils + liaison à l'agent
    const toolsBySlug = new Map(tools.map((t) => [t.slug.toLowerCase(), t]));
    const inCatalog = (s: { slug: string }) => toolsBySlug.has(s.slug.toLowerCase());

    const directSuggestions = response.suggestedTools.filter(inCatalog);
    const routineSuggestions = (response.routine?.tools ?? []).filter(inCatalog);

    const requestedSlugs = [...new Set(
        [...directSuggestions, ...routineSuggestions].map((s: any) => toolsBySlug.get(s.slug.toLowerCase())!.slug)
    )];

    await Promise.all(
        requestedSlugs
            .filter(isConnected)
            .map((slug) => setAgentToolConnection(agentId, userEmail, slug, true))
    );

    const createToolCard = (s: { slug: string; reason: string }) => {
        const tool = toolsBySlug.get(s.slug.toLowerCase())!;
        return {
            slug: tool.slug,
            name: tool.name,
            description: tool.description,
            reason: s.reason,
            icon: tool.icon,
            isConnected: isConnected(tool.slug),
            isEnabled: tool.isActive !== false,
        };
    };

    return {
        response: {
            ...response,
            suggestedTools: directSuggestions.map(createToolCard).filter((t: any) => !t.isConnected),
            routine: response.routine ? { ...response.routine, tools: routineSuggestions } : null,
        },
        toolCards: routineSuggestions.map(createToolCard),
    };
}