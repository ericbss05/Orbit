import { useEffect, useMemo, useRef } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MessageType } from "@/type/Message"
import { AgentResponseView } from "../AgentResponseView"
import { AGENT_BUBBLE, USER_BUBBLE } from "./constants"
import { ChatHistorySkeleton } from "./ChatHistorySkeleton"
import { ThinkingBubble } from "./ThinkingBubble"
import { UserMarkdown } from "./UserMarkdown"
import { computeStamps, groupMessages } from "./utils"

type Props = {
  agentId: string
  messages: MessageType[]
  loading: boolean
  historyLoading: boolean
  pendingRemovalIds: Set<string>
  onEditMessage: (message: MessageType) => void
  onSuggestedReply: (text: string) => void
  onRoutineSaved: (routineId?: string) => void
  onWorkflowResult: (result: { response?: any; toolCards?: any[] }) => void
}

export function MessageList({
  agentId,
  messages,
  loading,
  historyLoading,
  pendingRemovalIds,
  onEditMessage,
  onSuggestedReply,
  onRoutineSaved,
  onWorkflowResult,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const groups = useMemo(() => groupMessages(messages), [messages])
  const stamps = useMemo(() => computeStamps(groups), [groups])

  // Keep the latest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-6 pt-2 sm:px-8">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4">
        {historyLoading ? (
          <ChatHistorySkeleton />
        ) : (
          <>
            {groups.map((group, groupIndex) => {
              const isUser = group.role === "user"
              return (
                <div key={groupIndex} className="flex min-w-0 flex-col gap-4">
                  {stamps[groupIndex] && (
                    <p className="text-center text-xs text-muted-foreground">{stamps[groupIndex]}</p>
                  )}
                  <div className={`flex min-w-0 flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                    {group.items.map((msg) => {
                      const fade = pendingRemovalIds.has(msg.id)
                        ? "opacity-40 transition-opacity"
                        : "transition-opacity"

                      return isUser ? (
                        <div
                          key={msg.id}
                          className={`group flex w-full min-w-0 items-center justify-end gap-1.5 ${fade}`}
                        >
                          {!loading && (
                            <Button
                              aria-label="Edit message"
                              className="size-7 shrink-0 rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                              onClick={() => onEditMessage(msg)}
                              size="icon"
                              variant="ghost"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          <div className={USER_BUBBLE}>
                            <UserMarkdown>{msg.content}</UserMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className={`${AGENT_BUBBLE} ${fade}`}>
                          <AgentResponseView
                            message={msg}
                            agentId={agentId}
                            onSuggestedReply={onSuggestedReply}
                            onRoutineSaved={onRoutineSaved}
                            onWorkflowResult={onWorkflowResult}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {loading && <ThinkingBubble />}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}