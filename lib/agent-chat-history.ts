import { AgentChatHistory, db } from "@/db";
import { and, eq, sql } from "drizzle-orm";

type ChatRole = "user" | "agent" | "assistant";

type StoredMessage = {
  id?: string;
  role?: string;
  content?: unknown;
  response?: unknown;
  toolCards?: unknown;
  editingRoutineId?: string;
  [key: string]: unknown;
};

type SaveAgentChatHistoryInput = {
  agentId: string;
  userEmail: string;
  messages: unknown[];
  timezone?: string | null;
  editingRoutineId?: string | null;
  response?: unknown;
  toolCards?: unknown;
  status?: "completed" | "failed";
  error?: string | null;
};

type AppendAgentChatHistoryMessageInput = {
  agentId: string;
  userEmail: string;
  content: string;
  timezone?: string | null;
  editingRoutineId?: string | null;
  response?: unknown;
  toolCards?: unknown;
  status?: "completed" | "failed";
  error?: string | null;
};

type TruncateAgentChatHistoryInput = {
  agentId: string;
  userEmail: string;
  /** Identifiant du message utilisateur à éditer (prioritaire). */
  messageId?: string;
  /** Repli si le message n'a pas d'id. */
  messageIndex?: number;
};

export type TruncateAgentChatHistoryResult =
  | { error: "not_found" | "not_user_message" }
  | {
      messages: unknown[];
      timezone: string | null;
      removedCount: number;
      editedContent: string;
    };

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function latestTextMessage(messages: unknown[], role: ChatRole) {
  const message = [...messages]
    .reverse()
    .find((item) => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as { role?: unknown; content?: unknown };
      return candidate.role === role && typeof candidate.content === "string";
    }) as { content?: string } | undefined;

  return message?.content ?? null;
}

function asMessageArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function getResponseMessage(response: unknown) {
  if (!response || typeof response !== "object") return null;
  const message = (response as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

function isAgentRole(role: unknown) {
  return role === "agent" || role === "assistant";
}

/**
 * Garantit que chaque message possède un id stable. Les messages utilisateur
 * viennent du client : sans id, l'édition par messageId serait impossible.
 */
function ensureMessageIds(messages: unknown[]) {
  return messages.map((message) => {
    if (!message || typeof message !== "object") return message;
    const candidate = message as StoredMessage;
    return typeof candidate.id === "string" && candidate.id
      ? candidate
      : { ...candidate, id: crypto.randomUUID() };
  });
}

function lastAgentMessage(messages: unknown[]) {
  return [...messages]
    .reverse()
    .find((message) => {
      if (!message || typeof message !== "object") return false;
      return isAgentRole((message as StoredMessage).role);
    }) as StoredMessage | undefined;
}

async function purgeExpiredHistories() {
  await db.delete(AgentChatHistory).where(
    sql`${AgentChatHistory.updatedAt} < now() - interval '3 days'`
  );
}

function buildStoredMessages({
  messages,
  response,
  toolCards,
  editingRoutineId,
}: {
  messages: unknown[];
  response?: unknown;
  toolCards?: unknown;
  editingRoutineId?: string | null;
}) {
  const messagesWithIds = ensureMessageIds(messages);

  if (!response || typeof response !== "object") {
    return messagesWithIds;
  }

  const agentMessage = getResponseMessage(response);

  return [
    ...messagesWithIds,
    {
      id: crypto.randomUUID(),
      role: "agent",
      content: agentMessage ?? "",
      response,
      toolCards: toolCards ?? [],
      editingRoutineId: editingRoutineId || undefined,
      time: new Date().toISOString(),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                                    Save                                    */
/* -------------------------------------------------------------------------- */

export async function saveAgentChatHistory({
  agentId,
  userEmail,
  messages,
  timezone,
  editingRoutineId,
  response,
  toolCards,
  status = "completed",
  error = null,
}: SaveAgentChatHistoryInput) {
  await purgeExpiredHistories();

  const storedMessages = buildStoredMessages({
    messages,
    response,
    toolCards,
    editingRoutineId,
  });
  const now = new Date();

  const values = {
    timezone: timezone || null,
    editingRoutineId: editingRoutineId || null,
    latestUserMessage: latestTextMessage(storedMessages, "user"),
    agentMessage: getResponseMessage(response) ?? latestTextMessage(storedMessages, "agent"),
    requestMessages: storedMessages,
    response: response ?? null,
    toolCards: toolCards ?? null,
    status,
    error,
    updatedAt: now,
  };

  await db
    .insert(AgentChatHistory)
    .values({
      id: crypto.randomUUID(),
      agentId,
      userEmail,
      ...values,
    })
    .onConflictDoUpdate({
      target: [AgentChatHistory.agentId, AgentChatHistory.userEmail],
      set: values,
    });
}

/* -------------------------------------------------------------------------- */
/*                                   Append                                   */
/* -------------------------------------------------------------------------- */

export async function appendAgentChatHistoryMessage({
  agentId,
  userEmail,
  content,
  timezone,
  editingRoutineId,
  response,
  toolCards,
  status = "completed",
  error = null,
}: AppendAgentChatHistoryMessageInput) {
  await purgeExpiredHistories();

  const now = new Date();
  const [history] = await db
    .select({ requestMessages: AgentChatHistory.requestMessages })
    .from(AgentChatHistory)
    .where(
      and(
        eq(AgentChatHistory.agentId, agentId),
        eq(AgentChatHistory.userEmail, userEmail)
      )
    )
    .limit(1);

  const storedMessages = [
    ...ensureMessageIds(asMessageArray(history?.requestMessages)),
    {
      id: crypto.randomUUID(),
      role: "agent",
      content,
      response,
      toolCards: toolCards ?? [],
      editingRoutineId: editingRoutineId || undefined,
      time: now.toISOString(),
    },
  ];

  const values = {
    timezone: timezone || null,
    editingRoutineId: editingRoutineId || null,
    latestUserMessage: latestTextMessage(storedMessages, "user"),
    agentMessage: content,
    requestMessages: storedMessages,
    response: response ?? null,
    toolCards: toolCards ?? null,
    status,
    error,
    updatedAt: now,
  };

  await db
    .insert(AgentChatHistory)
    .values({
      id: crypto.randomUUID(),
      agentId,
      userEmail,
      ...values,
    })
    .onConflictDoUpdate({
      target: [AgentChatHistory.agentId, AgentChatHistory.userEmail],
      set: values,
    });
}

/* -------------------------------------------------------------------------- */
/*                                     Get                                    */
/* -------------------------------------------------------------------------- */

export async function getAgentChatHistory(agentId: string, userEmail: string) {
  await purgeExpiredHistories();

  const [history] = await db
    .select()
    .from(AgentChatHistory)
    .where(
      and(
        eq(AgentChatHistory.agentId, agentId),
        eq(AgentChatHistory.userEmail, userEmail)
      )
    )
    .limit(1);

  return history ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                  Truncate                                  */
/* -------------------------------------------------------------------------- */

/**
 * Supprime le message utilisateur ciblé et tous ceux qui le suivent, puis
 * resynchronise les colonnes dénormalisées (latestUserMessage, agentMessage,
 * response, toolCards, editingRoutineId).
 */
export async function truncateAgentChatHistory({
  agentId,
  userEmail,
  messageId,
  messageIndex,
}: TruncateAgentChatHistoryInput): Promise<TruncateAgentChatHistoryResult> {
  const history = await getAgentChatHistory(agentId, userEmail);
  if (!history) return { error: "not_found" };

  const messages = ensureMessageIds(
    asMessageArray(history.requestMessages)
  ) as StoredMessage[];

  const fromIndex = messageId
    ? messages.findIndex((message) => message?.id === messageId)
    : typeof messageIndex === "number"
      ? messageIndex
      : -1;

  if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= messages.length) {
    return { error: "not_found" };
  }

  const target = messages[fromIndex];
  if (target?.role !== "user") {
    return { error: "not_user_message" };
  }

  const kept = messages.slice(0, fromIndex);
  const previousAgent = lastAgentMessage(kept);

  await db
    .update(AgentChatHistory)
    .set({
      requestMessages: kept,
      latestUserMessage: latestTextMessage(kept, "user"),
      agentMessage: latestTextMessage(kept, "agent"),
      response: previousAgent?.response ?? null,
      toolCards: previousAgent?.toolCards ?? null,
      editingRoutineId: previousAgent?.editingRoutineId ?? null,
      status: "completed",
      error: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(AgentChatHistory.agentId, agentId),
        eq(AgentChatHistory.userEmail, userEmail)
      )
    );

  return {
    messages: kept,
    timezone: history.timezone ?? null,
    removedCount: messages.length - fromIndex,
    editedContent: typeof target.content === "string" ? target.content : "",
  };
}