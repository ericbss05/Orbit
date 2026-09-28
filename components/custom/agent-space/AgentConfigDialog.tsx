"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { History, Save, Settings2, Shuffle, SlidersHorizontal, Wrench, X, type LucideIcon } from "lucide-react"
import { AgentSettingsTab } from "./AgentSettingsTab"
import { SettingsTab } from "./SettingsTab"
import { ToolsTab } from "./ToolsTab"
import { RoutineExecutionHistoryTab } from "./RoutineExecutionHistoryTab"
import { useContext, useState } from "react"
import { AgentConfigContext } from "@/context/AgentConfigContext"
import { toast } from "@/components/ui/toast"
import axios from "axios"

const sections = [
  { value: "settings", label: "Settings", icon: Settings2 },
  { value: "tools", label: "Tools", icon: Wrench },
  { value: "routine-history", label: "History", icon: History },
  { value: "agent-settings", label: "Agent", icon: SlidersHorizontal },
] as const

type SectionValue = typeof sections[number]["value"]

interface AgentConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function IconCircleButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
}) {
  return (
    <Button
      aria-label={label}
      className="size-9 rounded-full bg-white/10 text-white hover:bg-white/15"
      onClick={onClick}
      size="icon"
      variant="ghost"
    >
      <Icon className="size-4" />
    </Button>
  )
}

export function AgentConfigDialog({ open, onOpenChange }: AgentConfigDialogProps) {
  const { agentConfig, setAgentConfig } = useContext(AgentConfigContext)
  const [activeSection, setActiveSection] = useState<SectionValue>("settings")

  const shuffleAvatar = () => {
    const randomSeed = crypto.randomUUID()
    const newAvatarUrl = `https://api.dicebear.com/10.x/glass/svg?tags=animation&seed=` + randomSeed
    setAgentConfig((prevConfig: any) => ({
      ...prevConfig,
      agentImage: newAvatarUrl,
    }))
  }

  const saveAgentConfig = async () => {
    toast.add({
      title: "Saving Agent Configuration",
      description: "Your agent configuration is being saved.",
      type: "info",
    })
    try {
      const result = await axios.put('/api/agent', agentConfig)
      console.log(result.data)

      toast.add({
        title: "Agent Configuration Saved",
        description: "Your agent configuration has been saved successfully.",
        type: "success",
      })
    } catch (error) {
      console.error("Failed to save agent configuration", error)
      toast.add({
        title: "Unable to Save Agent Configuration",
        description: "Please try again in a moment.",
        type: "error",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] max-w-2xl overflow-hidden rounded-3xl border-white/10 bg-neutral-950 p-0 text-white sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">Agent Configuration</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your agent's identity and configuration.
        </DialogDescription>

        <div className="flex items-center justify-between gap-2 p-4 pb-2">
          <IconCircleButton icon={Save} label="Save" onClick={saveAgentConfig} />
          <IconCircleButton icon={X} label="Close" onClick={() => onOpenChange(false)} />
        </div>

        <div className="max-h-[calc(86vh-72px)] overflow-y-auto px-5 pb-6">
          {/* Identity Persistent Header */}
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
            <img src={agentConfig?.agentImage} alt="Agent Avatar" className="size-16 rounded-full" />
            <div>
              <p className="text-sm font-medium">Agent avatar</p>
              <p className="mt-0.5 text-xs text-white/50">Give your agent a distinct look.</p>
              <Button
                onClick={shuffleAvatar}
                className="mt-2.5 border-white/15 bg-transparent text-white hover:bg-white/10"
                size="sm"
                variant="outline"
              >
                <Shuffle className="size-3.5" />Shuffle Avatar
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="agent-name" className="text-white/70">Agent Name</Label>
            <Input
              id="agent-name"
              className="h-9 border-white/10 bg-white/5 text-white placeholder:text-white/40"
              defaultValue={agentConfig?.name}
              onChange={(event) => setAgentConfig((prevConfig: any) => ({
                ...prevConfig,
                name: event.target.value
              }))}
            />
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeSection} onValueChange={(val) => setActiveSection(val as SectionValue)} className="mt-6 w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 p-1 text-white/70">
              {sections.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 text-xs data-[state=active]:bg-white/20 data-[state=active]:text-white"
                >
                  <tab.icon className="size-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-3 rounded-2xl bg-white/5 p-4">
              <TabsContent value="settings" className="mt-0 focus-visible:outline-none">
                <SettingsTab />
              </TabsContent>
              <TabsContent value="tools" className="mt-0 focus-visible:outline-none">
                <ToolsTab />
              </TabsContent>
              <TabsContent value="routine-history" className="mt-0 focus-visible:outline-none">
                <RoutineExecutionHistoryTab />
              </TabsContent>
              <TabsContent value="agent-settings" className="mt-0 focus-visible:outline-none">
                <AgentSettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}