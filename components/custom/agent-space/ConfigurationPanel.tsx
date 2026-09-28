"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScheduleTab } from "./ScheduleTab"
import { VMDesktop } from "./VMDesktop"
import { AgentConfigDialog } from "./AgentConfigDialog"
import { useState } from "react"

type ConfigurationPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigurationPanel({ open, onOpenChange }: ConfigurationPanelProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[350px]">
          <SheetHeader className="h-[72px] shrink-0 flex-row items-center justify-between space-y-0 border-b pl-5 pr-14">
            <div>
              <SheetTitle>Agent Configuration</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Customize how your agent works
              </SheetDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label="Open agent configuration"
                      className="size-9 shrink-0 rounded-full bg-white/10 text-foreground hover:bg-white/15"
                      onClick={() => setIsConfigDialogOpen(true)}
                      size="icon"
                      variant="ghost"
                    />
                  }
                >
                  <Settings className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Configure</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-5">
              <VMDesktop />
              <ScheduleTab />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AgentConfigDialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen} />
    </>
  )
}