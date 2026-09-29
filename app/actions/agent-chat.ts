"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getChatHistory, handleChatPost } from "@/lib/agent-chat/handle-chat";

/** Server Action : historique du chat. Lève une erreur si non OK. */
export async function getAgentChatHistoryAction(agentId: string) {
    const session = await getServerSession(authOptions);
    const { status, body } = await getChatHistory(session?.user?.email, agentId);
    if (status !== 200) throw new Error(body.error);
    return body;
}

/** Server Action : envoie un message à l'agent. */
export async function sendAgentMessageAction(input: {
    agentId: string;
    messages: any[];
    timezone?: string;
    editingRoutineId?: string | null;
}) {
    const session = await getServerSession(authOptions);
    const { status, body } = await handleChatPost(session?.user?.email, input);
    if (status !== 200) throw new Error(body.error);
    return body;
}