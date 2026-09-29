import { RefObject, useEffect, useMemo, useState } from "react"
import type { MessageType } from "@/type/Message"

/** Édition d'un message déjà envoyé (supprime ce message et les suivants à l'envoi). */
export function useMessageEdit(params: {
  agentId: string | string[] | undefined
  messages: MessageType[]
  loading: boolean
  setUserInput: (value: string) => void
  inputRef: RefObject<HTMLTextAreaElement | null>
}) {
  const { agentId, messages, loading, setUserInput, inputRef } = params
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  // Changer d'agent annule l'édition en cours.
  useEffect(() => setEditingMessageId(null), [agentId])

  // Ids supprimés à l'envoi : le message édité + tout ce qui suit.
  const pendingRemovalIds = useMemo(() => {
    if (!editingMessageId) return new Set<string>()
    const index = messages.findIndex((m) => m.id === editingMessageId)
    if (index < 0) return new Set<string>()
    return new Set(messages.slice(index).map((m) => m.id))
  }, [editingMessageId, messages])

  const startMessageEdit = (message: MessageType) => {
    if (loading) return
    setEditingMessageId(message.id)
    setUserInput(message.content)
    window.setTimeout(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }, 0)
  }

  const cancelMessageEdit = () => {
    setEditingMessageId(null)
    setUserInput("")
  }

  return { editingMessageId, setEditingMessageId, pendingRemovalIds, startMessageEdit, cancelMessageEdit }
} 