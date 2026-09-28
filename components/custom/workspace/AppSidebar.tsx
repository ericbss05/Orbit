"use client"

import {
  ChevronUpIcon,
  CheckCircle2Icon,
  LoaderCircleIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  StoreIcon,
  WrenchIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { AgentConfigType } from "@/type/Agent"
import { usePathname } from "next/navigation"
import type { ToolSuggestionCardData } from "@/type/Message"
import { ToolSuggestionCard } from "@/components/custom/agent-space/ToolSuggestionCard"

// Extend the base agent type with the two extra fields the new
// "conversation list" look needs. Populated by /api/agent via a
// left join on agent_chat_history — null when the agent has no
// conversation yet.
type AgentListItem = AgentConfigType & {
  lastMessage?: string | null
  lastMessageTime?: string | null
}

// Cycle through the shadcn chart palette (--chart-1 .. --chart-5)
// so the list reads as lively / hand-picked rather than one
// repeated template, without introducing any custom colors.
const AVATAR_STYLES: { bg: string; shape: string }[] = [
  { bg: "bg-chart-1", shape: "rounded-full" },
  { bg: "bg-chart-2", shape: "rounded-full" },
  { bg: "bg-chart-3", shape: "rounded-2xl" },
  { bg: "bg-chart-4", shape: "rounded-full" },
  { bg: "bg-chart-5", shape: "rounded-full" },
]

function avatarStyleFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_STYLES[hash % AVATAR_STYLES.length]
}

// Formats a timestamp the way a chat app would: "À l'instant", "5m",
// "3h", "Hier", "3j", then a short date once it's old enough that a
// relative label stops being useful.
function formatRelativeTime(value?: string | Date | null) {
  if (!value) return undefined

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `${diffMin}m`

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`

  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return "Hier"
  if (diffD < 7) return `${diffD}j`

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
}

function AgentAvatar({ agent }: { agent: AgentListItem }) {
  const { bg, shape } = avatarStyleFor(agent.agentId)

  if (agent.agentImage) {
    return (
      <Avatar className={`size-9 shrink-0 ${shape}`}>
        <AvatarImage src={agent.agentImage} alt={agent.name} />
        <AvatarFallback className={`${bg} ${shape} text-primary-foreground`}>
          {agent.name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Simple friendly "face" fallback (two dots), echoing the
  // blob-style avatars in the reference design.
  return (
    <Avatar className={`size-9 shrink-0 ${shape}`}>
      <AvatarFallback className={`${bg} ${shape} text-primary-foreground`}>
        <span className="flex gap-1.5">
          <span className="size-1 rounded-full bg-black/40" />
          <span className="size-1 rounded-full bg-black/40" />
        </span>
      </AvatarFallback>
    </Avatar>
  )
}

// Placeholder row matching the exact shape of a real SidebarMenuButton
// agent row (avatar + name/time line + message line), so the skeleton
// doesn't cause a layout shift once real data lands.
function AgentRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-6" />
        </div>
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

function AppSidebar() {
  const [agents, setAgents] = useState<AgentListItem[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [search, setSearch] = useState("")

  const { data } = useSession()
  const path = usePathname()
  const currentAgentId = getAgentIdFromPath(path)

  const userInitials = data?.user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  useEffect(() => {
    GetUserAgents()
  }, [path])

  const GetUserAgents = async () => {
    setIsLoadingAgents(true)
    try {
      const result = await axios.get("/api/agent")
      setAgents(result.data)
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/sign-in" })
  }

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return agents
    const q = search.toLowerCase()
    return agents.filter((agent) => agent.name?.toLowerCase().includes(q))
  }, [agents, search])

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="gap-3 px-3 py-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="logo" width={28} height={28} />
            <p className="font-semibold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
              Orbit
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
          >
            <Link href="/workspace/create" aria-label="Create new agent">
              <PlusIcon className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="relative group-data-[collapsible=icon]:hidden">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-9 pl-8"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {isLoadingAgents ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <AgentRowSkeleton key={i} />
                ))
              ) : (
                <>
                  {filteredAgents.map((agent) => {
                    const isActive = agent.agentId === currentAgentId
                    const relativeTime = formatRelativeTime(agent.lastMessageTime)

                    return (
                      <Link href={"/workspace/" + agent.agentId} key={agent.agentId}>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={agent.name}
                            className={`h-auto gap-2.5 rounded-lg px-2 py-2 hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
                          >
                            <AgentAvatar agent={agent} />
                            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-medium text-sidebar-foreground">
                                  {agent.name}
                                </span>
                                {relativeTime && (
                                  <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {relativeTime}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {agent.lastMessage || "Aucun message pour le moment"}
                              </p>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </Link>
                    )
                  })}

                  {filteredAgents.length === 0 && (
                    <div className="px-2 py-6 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                      No agents found.
                    </div>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <MarketplaceDialog agentId={currentAgentId} />
          </SidebarMenuItem>
        </SidebarMenu>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                aria-label="Open user menu"
                className="flex h-auto w-full items-center justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left font-normal hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              />
            }
          >
            {data?.user ? (
              <Avatar className="size-7">
                <AvatarImage
                  src={data?.user?.image ?? ""}
                  alt={data?.user?.name ?? "User"}
                />
                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Skeleton className="size-7 rounded-full" />
            )}
            {data?.user ? (
              <span className="min-w-0 flex-1 truncate text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                {data?.user?.name}
              </span>
            ) : (
              <Skeleton className="h-3.5 w-20 group-data-[collapsible=icon]:hidden" />
            )}
          </PopoverTrigger>

          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-60 gap-2 border-border bg-popover p-2"
          >
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-popover-foreground">
                {data?.user?.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {data?.user?.email}
              </p>
            </div>
            <div className="h-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isSigningOut}
              onClick={handleSignOut}
            >
              {isSigningOut ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <LogOutIcon className="size-4" />
              )}
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  )
}

function getAgentIdFromPath(path: string | null) {
  const match = path?.match(/^\/workspace\/([^/]+)/)
  const agentId = match?.[1]

  if (!agentId || agentId === "create" || agentId === "create-agent") return null

  return decodeURIComponent(agentId)
}

// Placeholder card matching ToolSuggestionCard's "compact" footprint
// (icon + title line + subtitle line + trailing action), so the grid
// doesn't jump when real tools replace the skeletons.
function ToolCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-7 w-16 shrink-0 rounded-md" />
    </div>
  )
}

function MarketplaceDialog({ agentId }: { agentId: string | null }) {
  const [tools, setTools] = useState<ToolSuggestionCardData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !agentId) return

    let isMounted = true
    setIsLoading(true)

    axios
      .get<{ tools: ToolSuggestionCardData[] }>("/api/tools/status", {
        params: { agentId },
      })
      .then(({ data }) => {
        if (isMounted) setTools(data.tools)
      })
      .catch(() => {
        if (isMounted) setTools([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [agentId, open])

  const updateConnection = (slug: string, isConnected: boolean) => {
    setTools((current) =>
      current.map((tool) =>
        tool.slug.toLowerCase() === slug.toLowerCase()
          ? { ...tool, isConnected }
          : tool
      )
    )
  }

  const connectedTools = tools.filter((tool) => tool.isConnected)
  const availableTools = tools.filter((tool) => !tool.isConnected)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <SidebarMenuButton
            className="h-9 gap-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            tooltip="Marketplace"
          />
        }
      >
        <StoreIcon className="size-4" />
        <span>Marketplace</span>
      </DialogTrigger>

      <DialogContent className="max-h-[86vh] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="size-5" />
            Marketplace
          </DialogTitle>
          <DialogDescription>
            Connect tools this agent can use, or disconnect accounts you no longer want available.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(86vh-112px)] overflow-y-auto px-5 py-5 sm:px-6">
          {!agentId ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              Open an agent to manage marketplace tools for it.
            </div>
          ) : isLoading ? (
            <div className="space-y-8">
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ToolCardSkeleton key={i} />
                  ))}
                </div>
              </section>
              <section>
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ToolCardSkeleton key={i} />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8">
              <MarketplaceSection
                title="Connected tools"
                description="Accounts currently connected and ready for this agent."
                emptyIcon={CheckCircle2Icon}
                emptyText="No tools are connected yet."
                agentId={agentId}
                tools={connectedTools}
                onConnectionChange={updateConnection}
              />
              <MarketplaceSection
                title="Available tools"
                description="Connect additional apps and services to expand what this agent can do."
                emptyIcon={WrenchIcon}
                emptyText="No additional tools are available."
                agentId={agentId}
                tools={availableTools}
                onConnectionChange={updateConnection}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MarketplaceSection({
  title,
  description,
  emptyIcon: EmptyIcon,
  emptyText,
  agentId,
  tools,
  onConnectionChange,
}: {
  title: string
  description: string
  emptyIcon: typeof WrenchIcon
  emptyText: string
  agentId: string
  tools: ToolSuggestionCardData[]
  onConnectionChange: (slug: string, isConnected: boolean) => void
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          {tools.length}
        </span>
      </div>

      {tools.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          <EmptyIcon className="size-4" />
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolSuggestionCard
              key={tool.slug}
              agentId={agentId}
              tool={tool}
              onConnectionChange={onConnectionChange}
              variant="compact"
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default AppSidebar