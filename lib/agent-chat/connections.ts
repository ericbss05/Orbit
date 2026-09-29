import { db, Tools } from "@/db";
import { eq } from "drizzle-orm";
import { setAgentToolConnection } from "@/lib/agent-tools";
import { getActiveConnectedAccounts, getOrCreateAgentSession } from "@/lib/composio/service";
import { includesCatalogTool } from "./patterns";

export type ToolContext = Awaited<ReturnType<typeof loadToolContext>>;

const excludedChatTools = new Set([
    "COMPOSIO_MANAGE_CONNECTIONS",
    "COMPOSIO_WAIT_FOR_CONNECTIONS",
    "COMPOSIO_REMOTE_BASH_TOOL",
    "COMPOSIO_REMOTE_WORKBENCH",
]);
const readOnlyAction = /(?:^|_)(?:GET|LIST|FETCH|SEARCH|FIND|READ|RETRIEVE|LOOKUP|QUERY|CHECK|VIEW)(?:_|$)/i;
const mutatingAction = /(?:^|_)(?:SEND|POST|CREATE|DELETE|REMOVE|UPDATE|EDIT|WRITE|REPLY|INVITE|PUBLISH|UPLOAD|MOVE|ARCHIVE|CANCEL)(?:_|$)/i;

function withApprovalRules(sessionTools: any[]) {
    return sessionTools
        .filter((tool: { name?: string }) => !excludedChatTools.has(tool.name ?? ""))
        .map((tool: { name?: string }) => {
            const toolName = tool.name ?? "";
            if (toolName === "COMPOSIO_MULTI_EXECUTE_TOOL") {
                return {
                    ...tool,
                    needsApproval: async (_ctx: unknown, args: { tools?: Array<{ tool_slug?: string }> }) =>
                        (args.tools ?? []).some(({ tool_slug = "" }) =>
                            mutatingAction.test(tool_slug) || !readOnlyAction.test(tool_slug)
                        ),
                };
            }
            return mutatingAction.test(toolName) || !readOnlyAction.test(toolName)
                ? { ...tool, needsApproval: true }
                : tool;
        });
}

/** Le provider est la source de vérité : on découvre les comptes actifs, on lie à l'agent, on prépare les tools. */
export async function loadToolContext(agentConfig: any, agentId: string, userEmail: string) {
    const tools = await db.select().from(Tools).where(eq(Tools.isActive, true));
    const activeAccounts = await getActiveConnectedAccounts(userEmail, tools.map((t) => t.slug));
    const connectedToolSlugs = tools
        .map((t) => t.slug)
        .filter((slug) => Boolean(activeAccounts[slug.toLowerCase()]?.length));

    await Promise.all(
        connectedToolSlugs.map((slug) => setAgentToolConnection(agentId, userEmail, slug, true))
    );

    let agentComposioTools: any[] = [];
    let agentComposioSession: any = null;
    if (connectedToolSlugs.length > 0) {
        agentComposioSession = await getOrCreateAgentSession(
            { ...agentConfig, tools: connectedToolSlugs },
            userEmail,
            connectedToolSlugs
        );
        agentComposioTools = withApprovalRules(await agentComposioSession.tools());
    }

    return { tools, activeAccounts, connectedToolSlugs, agentComposioTools, agentComposioSession };
}

/** Si l'utilisateur dit "connecte Notion", on répond directement sans appeler le LLM. */
export function buildExplicitConnectionResponse(latestUserText: string, ctx: ToolContext) {
    if (!/\b(?:connect|link|authorize)\b/i.test(latestUserText)) return null;

    const mentioned = ctx.tools.filter((t) => includesCatalogTool(latestUserText, t.slug, t.name));
    if (mentioned.length === 0) return null;

    const isConnected = (slug: string) => Boolean(ctx.activeAccounts[slug.toLowerCase()]?.length);
    const allConnected = mentioned.every((t) => isConnected(t.slug));

    return {
        type: allConnected ? ("message" as const) : ("tool_connection" as const),
        intent: "immediate_action" as const,
        message: allConnected
            ? `${mentioned.map((t) => t.name).join(", ")} is already connected and available to this agent.`
            : `Connect ${mentioned.filter((t) => !isConnected(t.slug)).map((t) => t.name).join(", ")} below to give this agent access.`,
        questions: [],
        suggestedTools: mentioned.map((t) => ({
            slug: t.slug,
            name: t.name,
            description: t.description,
            reason: `Connect ${t.name} so this agent can use it on your behalf.`,
            icon: "",
            isConnected: false,
            isEnabled: true,
        })),
        routine: null,
        confirmation: null,
    };
}