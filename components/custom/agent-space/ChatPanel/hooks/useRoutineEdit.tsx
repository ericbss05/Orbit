import { Dispatch, RefObject, SetStateAction, useEffect, useState } from "react"
import type { MessageType } from "@/type/Message"
import type { RoutineEditEventDetail, SavedRoutine } from "@/type/Routine"

function buildRoutineGreeting(routine: SavedRoutine): MessageType {
  return {
    id: crypto.randomUUID(),
    role: "agent",
    content: [
      `I’m ready to edit **${routine.name}**.`,
      "",
      `- Goal: ${routine.goal}`,
      `- Instructions: ${routine.instructions}`,
      `- Schedule: ${routine.schedule.frequency} at ${routine.schedule.time} (${routine.schedule.timezone}), starting ${routine.schedule.startDate}`,
      routine.schedule.weekDays.length > 0 ? `- Days: ${routine.schedule.weekDays.join(", ")}` : null,
      routine.tools.length > 0
        ? `- Tools: ${routine.tools.map((tool) => tool.name || tool.slug).join(", ")}`
        : "- Tools: None",
      "",
      "What would you like to change?",
    ]
      .filter(Boolean)
      .join("\n"),
    time: new Date().toISOString(),
    editingRoutineId: routine.id,
  }
}

/** Écoute l'évènement "routine-edit-requested" et gère la routine en cours d'édition. */
export function useRoutineEdit(params: {
  agentId: string | string[] | undefined
  setMessages: Dispatch<SetStateAction<MessageType[]>>
  setUserInput: (value: string) => void
  setEditingMessageId: (id: string | null) => void
  inputRef: RefObject<HTMLTextAreaElement | null>
}) {
  const { agentId, setMessages, setUserInput, setEditingMessageId, inputRef } = params
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null)

  useEffect(() => {
    const startRoutineEdit = (event: Event) => {
      const detail = (event as CustomEvent<RoutineEditEventDetail>).detail
      if (!detail || detail.agentId !== String(agentId)) return

      setEditingRoutine(detail.routine)
      setEditingMessageId(null)
      setUserInput("")
      setMessages((current) => [...current, buildRoutineGreeting(detail.routine)])
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }

    window.addEventListener("routine-edit-requested", startRoutineEdit)
    return () => window.removeEventListener("routine-edit-requested", startRoutineEdit)
  }, [agentId])

  return { editingRoutine, setEditingRoutine }
}