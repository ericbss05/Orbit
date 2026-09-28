"use client"

import { ArrowUp, X, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { agent } from "./agent-data"
import { MessageType } from "@/type/Message"
import type { RoutineEditEventDetail, SavedRoutine } from "@/type/Routine"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "@/components/ui/toast"
import { AgentConfigContext } from "@/context/AgentConfigContext"
import { AgentResponseView } from "./AgentResponseView"
import { ConfigurationPanel } from "./ConfigurationPanel"

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const THINKING_STEPS = [
  "Reading your message",
  "Thinking it through",
  "Checking available tools",
  "Preparing the answer",
]

// Long unbroken strings (URLs, hashes…) wrap instead of overflowing.
const WRAP = "break-words [overflow-wrap:anywhere] min-w-0"

// Agent: soft grey bubble, blue links. User: solid black bubble (inverts in dark mode).
const AGENT_BUBBLE = `${WRAP} max-w-[88%] rounded-[20px] bg-muted px-4 py-3 text-[15px] leading-[22px] text-foreground [&_a]:text-[#3b82f6] [&_a]:no-underline [&_a:hover]:underline`
const USER_BUBBLE = `${WRAP} max-w-[78%] rounded-[20px] bg-foreground px-4 py-3 text-[15px] leading-[22px] text-background`

// Markdown styling for the black user bubble (colors are inverted: text-background).
const USER_MD = [
  "[&_p]:whitespace-pre-wrap [&_p+*]:mt-2 [&_*+p]:mt-2",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5",
  "[&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:leading-snug",
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_code]:rounded [&_code]:bg-background/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/15 [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-background/40 [&_blockquote]:pl-3 [&_blockquote]:opacity-90",
  "[&_hr]:border-background/30",
].join(" ")

function UserMarkdown({ children }: { children: string }) {
  return (
    <div className={USER_MD}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

type MessageGroup = { role: MessageType["role"]; items: MessageType[] }

function groupMessages(messages: MessageType[]): MessageGroup[] {
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

// ---------------------------------------------------------------------------
// Thinking bubble
// ---------------------------------------------------------------------------

// A calm grey bubble: a breathing orb, a shimmering label that cross-fades
// between steps, and a discreet elapsed timer.
function ThinkingBubble() {
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const s = window.setInterval(() => setStep((v) => Math.min(v + 1, THINKING_STEPS.length - 1)), 2400)
    const c = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => {
      window.clearInterval(s)
      window.clearInterval(c)
    }
  }, [])

  return (
    <div className="flex flex-col items-start animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <style>{`
        @keyframes think-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
        @keyframes think-breathe { 0%,100% { transform: scale(.85); opacity: .55 } 50% { transform: scale(1.1); opacity: 1 } }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-[20px] bg-muted px-4 py-3"
      >
        <span className="relative flex size-3 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-foreground/25 motion-reduce:hidden"
            style={{ animation: "think-breathe 1.6s ease-in-out infinite" }}
          />
          <span className="relative size-1.5 rounded-full bg-foreground" />
        </span>

        <span
          key={step}
          className="animate-in fade-in-0 slide-in-from-bottom-1 bg-clip-text text-[15px] leading-[22px] text-transparent duration-500 motion-reduce:text-muted-foreground"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%, var(--muted-foreground) 100%)",
            backgroundSize: "200% 100%",
            animation: "think-shimmer 2.2s linear infinite",
          }}
        >
          {THINKING_STEPS[step]}…
        </span>

        <span className="text-xs tabular-nums text-muted-foreground/70">{elapsed}s</span>
      </div>
    </div>
  )
}

function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-1">
        <Skeleton className="h-16 w-2/3 rounded-[20px]" />
        <Skeleton className="h-10 w-1/2 rounded-[20px]" />
      </div>
      <div className="flex flex-col items-end">
        <Skeleton className="h-10 w-1/3 rounded-[20px]" />
      </div>
      <div className="flex flex-col items-start">
        <Skeleton className="h-12 w-3/5 rounded-[20px]" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ChatPanel() {
  const [userInput, setUserInput] = useState("")
  const { agentId } = useParams()
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [editingRoutine, setEditingRoutine] = useState<SavedRoutine | null>(null)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { agentConfig } = useContext(AgentConfigContext)

  const getWelcomeMessages = (): MessageType[] => [
    {
      id: "welcome",
      role: "agent",
      content: `Hello! I am Agent, How can I help you today?`,
      time: new Date().toISOString(),
    },
  ]
  const [messages, setMessages] = useState<MessageType[]>(getWelcomeMessages)
  const messageGroups = useMemo(() => groupMessages(messages), [messages])

  // Load history
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

  // Routine edit requests
  useEffect(() => {
    const startRoutineEdit = (event: Event) => {
      const detail = (event as CustomEvent<RoutineEditEventDetail>).detail
      if (!detail || detail.agentId !== String(agentId)) return

      const routine = detail.routine
      setEditingRoutine(routine)
      setUserInput("")
      setMessages((current) => [
        ...current,
        {
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
        },
      ])
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }

    window.addEventListener("routine-edit-requested", startRoutineEdit)
    return () => window.removeEventListener("routine-edit-requested", startRoutineEdit)
  }, [agentId])

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [userInput])

  // Keep the latest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  const handleMessageSend = async () => {
    const trimmed = userInput.trim()
    if (!trimmed || !agentId || loading) return

    setLoading(true)
    const userMsg: MessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      time: new Date().toISOString(),
    }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setUserInput("")

    try {
      const result = await axios.post("/api/agent/chat", {
        agentId,
        messages: updated,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        editingRoutineId: editingRoutine?.id,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "agent",
          content: result.data.response?.message,
          response: result.data.response,
          toolCards: result.data?.toolCards,
          editingRoutineId: editingRoutine?.id,
          time: new Date().toISOString(),
        },
      ])
    } catch (error) {
      const description = axios.isAxiosError(error)
        ? typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : "Please try again in a moment."
        : "Please try again in a moment."
      toast.add({ type: "error", title: "Unable to send message", description })
      setUserInput(trimmed)
    } finally {
      setLoading(false)
    }
  }

  // Centered time label above a group when it starts the chat or after a pause.
  let previousTime: Date | null = null
  const stampFor = (group: MessageGroup) => {
    const current = parseTime(group.items[0].time)
    const show = !!current && (!previousTime || current.getTime() - previousTime.getTime() > 10 * 60 * 1000)
    const last = parseTime(group.items[group.items.length - 1].time)
    previousTime = last ?? current ?? previousTime
    return show && current ? formatStamp(current) : null
  }

  return (
    <section
  className={`flex min-h-[620px] min-w-0 flex-col bg-background transition-[margin-right] duration-300 ease-in-out lg:h-svh lg:min-h-0 ${
    isConfigPanelOpen ? "mr-[350px]" : "mr-0"
  }`}
>
      <header className="flex h-[64px] shrink-0 items-center justify-between px-5 sm:px-7">
  <div className="flex min-w-0 items-center gap-3">
    {agentConfig?.agentImage ? (
      <img
        src={agentConfig.agentImage}
        alt="agent"
        className="size-9 rounded-full object-cover"
      />
    ) : (
      <Skeleton className="size-9 rounded-full" />
    )}

    <div className="min-w-0">
      {agentConfig?.name ? (
        <h1 className="truncate text-[15px] font-semibold leading-5">
          {agentConfig.name}
        </h1>
      ) : (
        <Skeleton className="h-4 w-32" />
      )}

      {agentConfig ? (
        <p className="truncate text-xs text-muted-foreground">
          {agentConfig.description}
        </p>
      ) : (
        <Skeleton className="mt-1 h-3 w-44" />
      )}
    </div>
  </div>

  <Button
    aria-label="Open agent configuration"
    className="size-9 rounded-full"
    onClick={() => setIsConfigPanelOpen((prev) => !prev)}
    size="icon"
    variant="ghost"
  >
    <Monitor className="size-4" />
  </Button>
</header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-6 pt-2 sm:px-8">
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4">
          {historyLoading ? (
            <ChatHistorySkeleton />
          ) : (
            <>
              {messageGroups.map((group, groupIndex) => {
                const stamp = stampFor(group)
                const isUser = group.role === "user"
                return (
                  <div key={groupIndex} className="flex min-w-0 flex-col gap-4">
                    {stamp && <p className="text-center text-xs text-muted-foreground">{stamp}</p>}
                    <div className={`flex min-w-0 flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                      {group.items.map((msg) =>
                        isUser ? (
                          <div key={msg.id} className={USER_BUBBLE}>
                            <UserMarkdown>{msg.content}</UserMarkdown>
                          </div>
                        ) : (
                          <div key={msg.id} className={AGENT_BUBBLE}>
                            <AgentResponseView
                              message={msg}
                              agentId={String(agentId)}
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
                          </div>
                        )
                      )}
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

      <div className="shrink-0 bg-background px-5 pb-4 pt-2 sm:px-7">
        <div className="mx-auto max-w-3xl">
          {editingRoutine && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-full bg-muted py-1 pl-4 pr-1.5 text-xs">
              <span className="truncate">
                Editing <strong>{editingRoutine.name}</strong>
              </span>
              <Button
                aria-label="Cancel routine edit"
                className="size-7 shrink-0 rounded-full"
                onClick={() => setEditingRoutine(null)}
                size="icon"
                variant="ghost"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-[26px] bg-muted py-1.5 pl-5 pr-1.5 transition-shadow focus-within:ring-1 focus-within:ring-foreground/20">
            <textarea
              ref={inputRef}
              aria-label={`Message ${agentConfig?.name ?? agent.name}`}
              rows={1}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleMessageSend()
                }
              }}
              placeholder={editingRoutine ? "Describe the changes to this routine" : "Ask your agent anything"}
              className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
            />
            <Button
              aria-label="Send message"
              onClick={handleMessageSend}
              disabled={loading || !userInput.trim()}
              size="icon"
              className="size-9 shrink-0 rounded-full bg-foreground text-background transition-opacity hover:bg-foreground/85 disabled:opacity-30"
            >
              <ArrowUp className="size-[18px]" />
            </Button>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {agent.name} can make mistakes. Check important information.
          </p>
        </div>
      </div>

      <ConfigurationPanel open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen} />
    </section>
  )
}