"use client"

import { useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ConfigurationPanel } from "../ConfigurationPanel"
import { ChatComposer } from "./ChatComposer"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { useChatHistory } from "./hooks/useChatHistory"
import { useMessageEdit } from "./hooks/useMessageEdit"
import { useRoutineEdit } from "./hooks/useRoutineEdit"
import { useSendMessage } from "./hooks/useSendMessage"

export function ChatPanel() {
  const { agentId } = useParams()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)

  const { messages, setMessages, historyLoading } = useChatHistory(agentId)

  const { editingMessageId, setEditingMessageId, pendingRemovalIds, startMessageEdit, cancelMessageEdit } =
    useMessageEdit({ agentId, messages, loading, setUserInput, inputRef })

  const { editingRoutine, setEditingRoutine } = useRoutineEdit({
    agentId, setMessages, setUserInput, setEditingMessageId, inputRef,
  })

  const { handleMessageSend } = useSendMessage({
    agentId, messages, setMessages, userInput, setUserInput, loading, setLoading,
    editingMessageId, setEditingMessageId, editingRoutine, setEditingRoutine,
  })

  return (
    <section
      className={`flex min-h-[620px] min-w-0 flex-col bg-background transition-[margin-right] duration-300 ease-in-out lg:h-svh lg:min-h-0 ${
        isConfigPanelOpen ? "mr-[350px]" : "mr-0"
      }`}
    >
      <ChatHeader onToggleConfig={() => setIsConfigPanelOpen((prev) => !prev)} />

      <MessageList
        agentId={String(agentId)}
        messages={messages}
        loading={loading}
        historyLoading={historyLoading}
        pendingRemovalIds={pendingRemovalIds}
        onEditMessage={startMessageEdit}
        onSuggestedReply={setUserInput}
        onRoutineSaved={(routineId) => {
          if (routineId === editingRoutine?.id) setEditingRoutine(null)
        }}
        onWorkflowResult={(result) => {
          if (!result.response) return
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "agent",
              content: result.response?.message ?? "",
              response: result.response,
              toolCards: result.toolCards ?? [],
              time: new Date().toISOString(),
            },
          ])
        }}
      />

      <ChatComposer
        inputRef={inputRef}
        userInput={userInput}
        onChange={setUserInput}
        loading={loading}
        editingMessageId={editingMessageId}
        editingRoutine={editingRoutine}
        onSend={handleMessageSend}
        onCancelMessageEdit={cancelMessageEdit}
        onCancelRoutineEdit={() => setEditingRoutine(null)}
      />

      <ConfigurationPanel open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen} />
    </section>
  )
}