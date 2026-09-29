import { agentResponseSchema } from "@/lib/openai/agent-response-schema";
import { getAllUserText, includesCatalogTool, timePattern } from "./patterns";
import type { ToolContext } from "./connections";

async function listSlackChannelOptions(session: any) {
    try {
        const result = await session.execute("SLACK_LIST_CONVERSATIONS", {
            types: "public_channel,private_channel",
            exclude_archived: true,
            limit: 100,
        });
        const channels = Array.isArray(result?.data?.channels) ? result.data.channels : [];
        return channels
            .filter((c: any) => c?.id && c?.name)
            .map((c: any) => ({
                label: `#${c.name}`,
                value: `Use Slack channel #${c.name} (ID: ${c.id})`,
                description: c.is_private ? "Private channel" : "Public channel",
            }));
    } catch (error) {
        console.error("Unable to list Slack channels", error);
        return [];
    }
}

/** Retourne une réponse si la demande vise Slack sans destination, sinon null. */
export async function handleSlackDestination(params: {
    latestUserText: string;
    messages: any[];
    ctx: ToolContext;
    planningOnly: boolean;
    requestTimezone: string;
}) {
    const { latestUserText, messages, ctx, planningOnly, requestTimezone } = params;

    const requestsSlackDelivery =
        /\b(?:send|post|share|publish)\b[\s\S]{0,100}\bslack\b/i.test(latestUserText)
        || /\bslack\b[\s\S]{0,100}\b(?:send|post|share|publish)\b/i.test(latestUserText);
    const hasSlackDestination =
        /#[a-z0-9_-]+|\bC[A-Z0-9]{8,}\b|slack\s+channel(?:\s+named)?\s+(?:["'][^"']+["']|[a-z0-9_-]+)/i
            .test(latestUserText);

    if (!requestsSlackDelivery || hasSlackDestination) return null;

    const { tools, activeAccounts, agentComposioSession } = ctx;
    const disconnectedTools = tools
        .filter((t) => includesCatalogTool(latestUserText, t.slug, t.name))
        .filter((t) => !activeAccounts[t.slug.toLowerCase()]?.length);
    const slackConnected = Boolean(activeAccounts.slack?.length);

    const channelOptions = slackConnected && agentComposioSession
        ? await listSlackChannelOptions(agentComposioSession)
        : [];

    const questions: any[] = [];
    if (slackConnected) {
        questions.push({
            id: "slack_channel",
            question: channelOptions.length > 0
                ? "Which Slack channel should receive the message?"
                : "What is the Slack channel name or ID?",
            options: channelOptions,
        });
    }
    if (planningOnly && !timePattern.test(getAllUserText(messages))) {
        questions.push({
            id: "run_time",
            question: `What time should this routine run in ${requestTimezone || "your timezone"}?`,
            options: [],
        });
    }

    return agentResponseSchema.parse({
        type: disconnectedTools.length > 0 && questions.length === 0 ? "tool_connection" : "clarification",
        intent: planningOnly ? "routine" : "immediate_action",
        message: disconnectedTools.length > 0
            ? "Connect the required apps and provide the missing destination details."
            : "Choose the destination before I prepare anything for delivery.",
        questions,
        suggestedTools: disconnectedTools.map((t) => ({
            slug: t.slug,
            name: t.name,
            description: t.description,
            reason: `Connect ${t.name} so this agent can complete the requested workflow.`,
            icon: t.icon,
            isConnected: false,
            isEnabled: t.isActive !== false,
        })),
        routine: null,
        confirmation: null,
    });
}