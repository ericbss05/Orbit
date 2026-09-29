import type { MessageType } from "@/type/Message"

export type MessageGroup = { role: MessageType["role"]; items: MessageType[] }

export function getWelcomeMessages(): MessageType[] {
  return [
    {
      id: "welcome",
      role: "agent",
      content: `Hello! I am Agent, How can I help you today?`,
      time: new Date().toISOString(),
    },
  ]
}

export function groupMessages(messages: MessageType[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  for (const msg of messages) {
    const last = groups[groups.length - 1]
    if (last && last.role === msg.role) last.items.push(msg)
    else groups.push({ role: msg.role, items: [msg] })
  }
  return groups
}

function parseTime(value?: string) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatStamp(d: Date) {
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  if (d.toDateString() === new Date().toDateString()) return time
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`
}

/** Label horaire centré au-dessus d'un groupe : au début du chat ou après 10 min de pause. */
export function computeStamps(groups: MessageGroup[]): (string | null)[] {
  let previousTime: Date | null = null
  return groups.map((group) => {
    const current = parseTime(group.items[0].time)
    const show = !!current && (!previousTime || current.getTime() - previousTime.getTime() > 10 * 60 * 1000)
    const last = parseTime(group.items[group.items.length - 1].time)
    previousTime = last ?? current ?? previousTime
    return show && current ? formatStamp(current) : null
  })
}

export function getErrorDescription(error: unknown, fallback = "Please try again in a moment.") {
  // Import axios côté appelant : ici on lit la forme standard d'une erreur axios.
  const data = (error as { response?: { data?: { error?: unknown } } })?.response?.data
  return typeof data?.error === "string" ? data.error : fallback
}