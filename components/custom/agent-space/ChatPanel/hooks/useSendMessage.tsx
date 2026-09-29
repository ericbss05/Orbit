import { Dispatch, SetStateAction } from "react"
import axios from "axios"
import { toast } from "@/components/ui/toast"
import type { MessageType } from "@/type/Message"
import type { SavedRoutine } from "@/type/Routine"
import { getErrorDescription, getWelcomeMessages } from "../utils"

type Params = {
  agentId: string | string[] | undefined
  messages: MessageType[]
  setMessages: Dispatch<SetStateAction<MessageType[]>>
  userInput: string
  setUserInput: (value: string) => void
  loading: boolean
  setLoading: (value: boolean) => void
  editingMessageId: string | null
  setEditingMessageId: (id: string | null) => void
  editingRoutine: SavedRoutine | null
  setEditingRoutine: (routine: SavedRoutine | null) => void
}

/** Envoi d'un message : gère la troncature (édition), le POST et les erreurs. */
export function useSendMessage(p: Params) {
  const {
    agentId, messages, setMessages, userInput, setUserInput, loading, setLoading,
    editingMessageId, setEditingMessageId, editingRoutine, setEditingRoutine,
  } = p

  /** Supprime le message édité côté serveur. Retourne false si l'envoi doit être annulé. */
  const deleteEditedMessage = async () => {
    try {
      await axios.patch("/api/agent/chat/edit", { agentId, messageId: editingMessageId })
      return true
    } catch (error) {
      // 404 : rien de sauvegardé côté serveur, la troncature locale suffit.
      if (axios.isAxiosError(error) && error.response?.status === 404) return true
      toast.add({ type: "error", title: "Unable to edit message", description: getErrorDescription(error) })
      return false
    }
  }

  const handleMessageSend = async () => {
    const trimmed = userInput.trim()
    if (!trimmed || !agentId || loading) return

    setLoading(true)

    let baseMessages = messages
    let activeRoutineId = editingRoutine?.id

    if (editingMessageId) {
      const index = messages.findIndex((m) => m.id === editingMessageId)

      if (index >= 0) {
        if (!(await deleteEditedMessage())) {
          setLoading(false)
          return
        }

        const kept = messages.slice(0, index)
        baseMessages = kept.length > 0 ? kept : getWelcomeMessages()

        // Le message d'accueil de l'édition de routine a peut-être été supprimé.
        if (editingRoutine && !baseMessages.some((m) => m.editingRoutineId === editingRoutine.id)) {
          setEditingRoutine(null)
          activeRoutineId = undefined
        }
      }

      setEditingMessageId(null)
    }

    const userMsg: MessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      time: new Date().toISOString(),
    }
    const updated = [...baseMessages, userMsg]
    setMessages(updated)
    setUserInput("")

    try {
      const result = await axios.post("/api/agent/chat", {
        agentId,
        messages: updated,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        editingRoutineId: activeRoutineId,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: result.data.response?.message,
          response: result.data.response,
          toolCards: result.data?.toolCards,
          editingRoutineId: activeRoutineId,
          time: new Date().toISOString(),
        },
      ])
    } catch (error) {
      toast.add({ type: "error", title: "Unable to send message", description: getErrorDescription(error) })
      setUserInput(trimmed)
    } finally {
      setLoading(false)
    }
  }

  return { handleMessageSend }
}