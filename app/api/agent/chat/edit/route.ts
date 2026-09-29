import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { AgentConfig, AgentWorkflows, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { truncateAgentChatHistory } from "@/lib/agent-chat-history";

/**
 * PATCH /chat/edit
 * Body : { agentId: string, messageId?: string, messageIndex?: number }
 *
 * Supprime le message utilisateur ciblé et tout ce qui le suit.
 * Renvoie l'historique tronqué et le contenu original du message, pour que le
 * client pré-remplisse l'input. Le nouveau message est ensuite envoyé via la
 * route POST existante avec [...messages, nouveauMessage].
 */
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    let body: { agentId?: unknown; messageId?: unknown; messageIndex?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { agentId, messageId, messageIndex } = body;

    const hasMessageId = typeof messageId === "string" && messageId.length > 0;
    const hasMessageIndex = Number.isInteger(messageIndex) && (messageIndex as number) >= 0;

    if (typeof agentId !== "string" || !agentId || (!hasMessageId && !hasMessageIndex)) {
        return NextResponse.json(
            { error: "Missing agentId and messageId/messageIndex" },
            { status: 400 }
        );
    }

    // L'agent doit appartenir à l'utilisateur connecté
    const [agentConfig] = await db
        .select({ agentId: AgentConfig.agentId })
        .from(AgentConfig)
        .where(
            and(
                eq(AgentConfig.agentId, agentId),
                eq(AgentConfig.userEmail, userEmail)
            )
        )
        .limit(1);

    if (!agentConfig) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const result = await truncateAgentChatHistory({
        agentId,
        userEmail,
        messageId: hasMessageId ? (messageId as string) : undefined,
        messageIndex: hasMessageIndex ? (messageIndex as number) : undefined,
    });

    if ("error" in result) {
        return result.error === "not_user_message"
            ? NextResponse.json({ error: "Only user messages can be edited" }, { status: 400 })
            : NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Les approbations en attente appartenaient à des messages supprimés :
    // on les annule pour qu'elles ne puissent plus être confirmées.
    await db
        .update(AgentWorkflows)
        .set({ status: "cancelled" })
        .where(
            and(
                eq(AgentWorkflows.agentId, agentId),
                eq(AgentWorkflows.userEmail, userEmail),
                eq(AgentWorkflows.status, "pending_approval")
            )
        );

    return NextResponse.json({
        messages: result.messages,
        timezone: result.timezone,
        removedCount: result.removedCount,
        editedContent: result.editedContent,
    });
}