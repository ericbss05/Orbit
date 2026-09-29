import { RefObject, useContext, useEffect } from "react"
import { ArrowUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgentConfigContext } from "@/context/AgentConfigContext"
import type { SavedRoutine } from "@/type/Routine"
import { agent } from "../agent-data"

type Props = {
  inputRef: RefObject<HTMLTextAreaElement | null>
  userInput: string
  onChange: (value: string) => void
  loading: boolean
  editingMessageId: string | null
  editingRoutine: SavedRoutine | null
  onSend: () => void
  onCancelMessageEdit: () => void
  onCancelRoutineEdit: () => void
}

function EditBanner({ children, label, onCancel }: { children: React.ReactNode; label: string; onCancel: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 rounded-full bg-muted py-1 pl-4 pr-1.5 text-xs">
      <span className="truncate">{children}</span>
      <Button aria-label={label} className="size-7 shrink-0 rounded-full" onClick={onCancel} size="icon" variant="ghost">
        <X className="size-4" />
      </Button>
    </div>
  )
}

export function ChatComposer({
  inputRef, userInput, onChange, loading, editingMessageId, editingRoutine,
  onSend, onCancelMessageEdit, onCancelRoutineEdit,
}: Props) {
  const { agentConfig } = useContext(AgentConfigContext)

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [userInput, inputRef])

  return (
    <div className="shrink-0 bg-background px-5 pb-4 pt-2 sm:px-7">
      <div className="mx-auto max-w-3xl">
        {editingMessageId && (
          <EditBanner label="Cancel message edit" onCancel={onCancelMessageEdit}>
            Editing a message — the following messages will be deleted when you send
          </EditBanner>
        )}

        {editingRoutine && (
          <EditBanner label="Cancel routine edit" onCancel={onCancelRoutineEdit}>
            Editing <strong>{editingRoutine.name}</strong>
          </EditBanner>
        )}

        <div className="flex items-end gap-2 rounded-[26px] bg-muted py-1.5 pl-5 pr-1.5 transition-shadow focus-within:ring-1 focus-within:ring-foreground/20">
          <textarea
            ref={inputRef}
            aria-label={`Message ${agentConfig?.name ?? agent.name}`}
            rows={1}
            value={userInput}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && editingMessageId) {
                e.preventDefault()
                onCancelMessageEdit()
                return
              }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                onSend()
              }
            }}
            placeholder={
              editingMessageId
                ? "Rewrite your message"
                : editingRoutine
                  ? "Describe the changes to this routine"
                  : "Ask your agent anything"
            }
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
          />
          <Button
            aria-label="Send message"
            onClick={onSend}
            disabled={loading || !userInput.trim()}
            size="icon"
            className="size-9 shrink-0 rounded-full bg-foreground text-background transition-opacity hover:bg-foreground/85 disabled:opacity-30"
          >
            <ArrowUp className="size-[18px]" />
          </Button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Orbit can make mistakes. Check important information.
        </p>
      </div>
    </div>
  )
}