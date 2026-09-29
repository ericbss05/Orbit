import { useEffect, useState } from "react"
import axios from "axios"
import type { MessageType } from "@/type/Message"
import { getWelcomeMessages } from "../utils"

/** Possède la liste des messages et la charge depuis l'historique serveur. */
export function useChatHistory(agentId: string | string[] | undefined) {
  const [messages, setMessages] = useState<MessageType[]>(getWelcomeMessages)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    if (!agentId) return
    let ignore = false
    setHistoryLoading(true)
    axios
      .get<{ history: { messages: MessageType[] } | null }>("/api/agent/chat", { params: { agentId } })
      .then(({ data }) => {
        if (ignore) return
        const saved = Array.isArray(data.history?.messages) ? data.history.messages : []
        setMessages(saved.length > 0 ? saved : getWelcomeMessages())
      })
      .catch(() => {
        if (!ignore) setMessages(getWelcomeMessages())
      })
      .finally(() => {
        if (!ignore) setHistoryLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [agentId])

  return { messages, setMessages, historyLoading }
}