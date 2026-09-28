"use client"

import { Settings, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScheduleTab } from "./ScheduleTab"
import { VMDesktop } from "./VMDesktop"
import { AgentConfigDialog } from "./AgentConfigDialog"
import { useState } from "react"

type ConfigurationPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigurationPanel({
  open,
  onOpenChange,
}: ConfigurationPanelProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  return (
    <>
      <aside
        className={`
          fixed right-0 top-0 z-40 flex h-screen w-[350px] flex-col
          border-l bg-background
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b pl-5 pr-4">
          <div>
            <h2 className="text-sm font-semibold">
              Agent Configuration
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customize how your agent works
            </p>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Open agent configuration"
                      className="size-9 shrink-0 rounded-full"
                      onClick={() => setIsConfigDialogOpen(true)}
                      size="icon"
                      variant="ghost"
                    />
                  }
                >
                  <Settings className="size-4" />
                </TooltipTrigger>

                <TooltipContent>
                  Configure
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Collapse */}
            <Button
              aria-label="Close configuration"
              size="icon"
              variant="ghost"
              className="size-9"
              onClick={() => onOpenChange(false)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <VMDesktop />
            <ScheduleTab />
          </div>
        </div>
      </aside>

      <AgentConfigDialog
        open={isConfigDialogOpen}
        onOpenChange={setIsConfigDialogOpen}
      />
    </>
  )
}