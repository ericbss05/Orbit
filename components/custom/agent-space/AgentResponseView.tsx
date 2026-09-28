"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import type { MessageType } from "@/type/Message"
import axios from "axios"
import { Check, Loader2, ShieldCheck, X, ChevronDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState } from "react"
import { RoutineCard } from "./RoutineCard"
import { ToolSuggestionCard } from "./ToolSuggestionCard"
import { cn } from "@/lib/utils"

type AgentResponseViewProps = {
  message: MessageType
  agentId: string
  onSuggestedReply?: (value: string) => void
  onWorkflowResult?: (result: { response: MessageType["response"], toolCards?: MessageType["toolCards"] }) => void
  onRoutineSaved?: (routineId?: string) => void
}

export function AgentResponseView({
  message,
  agentId,
  onSuggestedReply,
  onWorkflowResult,
  onRoutineSaved,
}: AgentResponseViewProps) {
  const response = message.response

  if (!response) {
    return <MarkdownMessage>{message.content}</MarkdownMessage>
  }

  return (
    <div className="space-y-3">
      <MarkdownMessage>{response.message}</MarkdownMessage>
      {response.questions.length > 0 && (
        <div className="space-y-2">
          <ul className="list-disc space-y-1 pl-5">
            {response.questions.map((question) => (
              <li key={question.id}>
                {question.question}
                {question.options.length > 0 && (
                  <div className="mt-2 grid gap-2">
                    {question.options.map((option) => (
                      <Button
                        className="h-auto justify-start whitespace-normal py-2 text-left"
                        key={option.value}
                        onClick={() => onSuggestedReply?.(option.value)}
                        variant="outline"
                      >
                        <span>
                          <span className="block font-medium">{option.label}</span>
                          {option.description && (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {response?.suggestedTools?.map((tool, index) => (
        <div key={`${tool.slug}-${index}`}>
          <ToolSuggestionCard agentId={agentId} onConnectionChange={() => console.log("CONNECTION")}
            tool={tool}
          />
        </div>
      ))}
      {response.routine && (
        <RoutineCard
          agentId={agentId}
          routine={response.routine}
          toolCards={message.toolCards ?? []}
          routineId={message.editingRoutineId}
          onSaved={() => onRoutineSaved?.(message.editingRoutineId)}
        />
      )}
      {response.confirmation && (
        <ConfirmationCard
          confirmation={response.confirmation}
          onResult={onWorkflowResult}
        />
      )}
    </div>
  )
}

function formatToolName(tool: string) {
  // "GMAIL_SEND_EMAIL" ou "gmail-send-email" -> "Gmail send email"
  const text = tool.replace(/[_-]+/g, " ").trim().toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ConfirmationCard({
  confirmation,
  onResult,
}: {
  confirmation: NonNullable<NonNullable<MessageType["response"]>["confirmation"]>
  onResult?: AgentResponseViewProps["onWorkflowResult"]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null)
  const [open, setOpen] = useState(false)

  const decide = async (approved: boolean) => {
    setIsSubmitting(true)
    try {
      const { data } = await axios.post("/api/agent/workflows", {
        workflowId: confirmation.workflowId,
        approved,
      })
      setDecision(approved ? "approved" : "rejected")
      onResult?.(data)
    } catch {
      toast.add({
        title: "Unable to process confirmation",
        description: "The action was not executed. Please try again.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border bg-card px-4 py-3.5 transition-opacity",
        decision && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{confirmation.title}</p>
          {confirmation.description && (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {confirmation.description}
            </p>
          )}

          {confirmation.actions.length > 0 && (
            <>
              {/* Noms des tools, toujours visibles */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {confirmation.actions.map((action, index) => (
                  <span
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    key={`${action.tool}-${index}`}
                  >
                    {formatToolName(action.tool)}
                  </span>
                ))}
              </div>

              {/* Dépliant : uniquement le détail */}
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                aria-expanded={open}
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform", open && "rotate-180")}
                />
                {open ? "Masquer les détails" : "Voir les détails"}
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <ul className="mt-2 space-y-2 border-l pl-3">
                    {confirmation.actions.map((action, index) => (
                      <li key={`${action.tool}-${index}`}>
                        <p className="text-[11px] font-medium">
                          {formatToolName(action.tool)}
                        </p>
                        <p className="break-words font-mono text-[11px] leading-5 text-muted-foreground">
                          {action.summary}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        {decision ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {decision === "approved" ? (
              <Check className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
            {decision === "approved" ? "Approved" : "Cancelled"}
          </span>
        ) : (
          <>
            <Button
              disabled={isSubmitting}
              onClick={() => decide(false)}
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => decide(true)}
              size="sm"
              className="rounded-full px-4"
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Confirm
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

function MarkdownMessage({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1.5 mt-3 font-semibold first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="my-2 leading-6 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
        blockquote: ({ children }) => <blockquote className="my-2 border-l-2 pl-3 text-muted-foreground">{children}</blockquote>,
        a: ({ children, href }) => <a className="font-medium text-primary underline underline-offset-4" href={href} target="_blank" rel="noreferrer">{children}</a>,
        code: ({ children, className }) => className ? (
          <code className={className}>{children}</code>
        ) : (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
        ),
        pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{children}</pre>,
        table: ({ children }) => <div className="my-3 overflow-x-auto"><table className="w-full border-collapse text-left text-xs">{children}</table></div>,
        th: ({ children }) => <th className="border px-2 py-1.5 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border px-2 py-1.5 align-top">{children}</td>,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
