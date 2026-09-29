// app/api/agents/chat/route.ts  (adapte le chemin à ton projet)
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getChatHistory, handleChatPost } from "@/lib/agent-chat/handle-chat";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const { status, body } = await getChatHistory(
        session?.user?.email,
        req.nextUrl.searchParams.get("agentId")
    );
    return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const payload = await req.json();
    const { status, body } = await handleChatPost(session?.user?.email, payload);
    return NextResponse.json(body, { status });
}