import { AgentWorkflows, db } from "@/db";
import { agentResponseSchema } from "@/lib/openai/agent-response-schema";

export function summarizeApprovalActions(actions: Array<{ tool: string; arguments: string }>) {
    return actions.flatMap((action) => {
        try {
            const parsed = JSON.parse(action.arguments);
            if (Array.isArray(parsed?.tools)) {
                return parsed.tools.map((item: { tool_slug?: string; arguments?: unknown }) => ({
                    tool: item.tool_slug ?? action.tool,
                    summary: JSON.stringify(item.arguments ?? {}),
                }));
            }
        } catch {
            // On ne divulgue pas l'état non parsé.
        }
        return [{ tool: action.tool, summary: "Exécuter cette action externe." }];
    });
}

/** Persiste le workflow en attente et renvoie la réponse "confirmation". */
export async function createApprovalResponse(params: {
    pendingApproval: { state: unknown; actions: Array<{ tool: string; arguments: string }> };
    agentId: string;
    userEmail: string;
    timezone: string;
}) {
    const { pendingApproval, agentId, userEmail, timezone } = params;
    const workflowId = crypto.randomUUID();
    const actions = summarizeApprovalActions(pendingApproval.actions);

    await db.insert(AgentWorkflows).values({
        id: workflowId,
        agentId,
        userEmail,
        status: "pending_approval",
        state: { snapshot: pendingApproval.state, actions, timezone },
    });

    return agentResponseSchema.parse({
        type: "confirmation",
        intent: "immediate_action",
        message: "Vérifiez cette action avant que je l'exécute.",
        questions: [],
        suggestedTools: [],
        routine: null,
        confirmation: {
            workflowId,
            title: "Confirmer l'action externe",
            description: "Aucune donnée n'a encore été envoyée et aucune modification n'a été effectuée.",
            actions,
        },
    });
}