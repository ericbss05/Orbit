import { useContext } from "react"
import { Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentConfigContext } from "@/context/AgentConfigContext"

export function ChatHeader({ onToggleConfig }: { onToggleConfig: () => void }) {
  const { agentConfig } = useContext(AgentConfigContext)

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between px-5 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        {agentConfig?.agentImage ? (
          <img src={agentConfig.agentImage} alt="agent" className="size-9 rounded-full object-cover" />
        ) : (
          <Skeleton className="size-9 rounded-full" />
        )}

        <div className="min-w-0">
          {agentConfig?.name ? (
            <h1 className="truncate text-[15px] font-semibold leading-5">{agentConfig.name}</h1>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}

          {agentConfig ? (
            <p className="truncate text-xs text-muted-foreground">{agentConfig.description}</p>
          ) : (
            <Skeleton className="mt-1 h-3 w-44" />
          )}
        </div>
      </div>

      <Button
        aria-label="Open agent configuration"
        className="size-9 rounded-full"
        onClick={onToggleConfig}
        size="icon"
        variant="ghost"
      >
        <Monitor className="size-4" />
      </Button>
    </header>
  )
}