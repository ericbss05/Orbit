"use client"

import axios from "axios"
import { useContext, useEffect, useRef, useState } from "react"
import { Compass, LoaderCircle, Mail, Maximize2, Monitor, Power, RotateCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { AgentConfigContext } from "@/context/AgentConfigContext"
import { cn } from "cn"

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000

// Swap this for any wallpaper you like — drop the file in /public/wallpapers.
const DEFAULT_WALLPAPER_SRC = "/wallpapers/vm-desktop-default.jpg"

const CARD_BACKGROUND_URL =
  "https://img.magnific.com/free-vector/monochrome-realistic-liquid-effect-background_474888-7310.jpg?semt=ais_hybrid&w=740&q=80"

type VmStatus = "active" | "inactive" | "paused" | "unconfigured" | "error"

export function VMDesktop() {
  const { agentConfig, setAgentConfig } = useContext(AgentConfigContext)
  const [status, setStatus] = useState<VmStatus>("inactive")
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const agentId = agentConfig?.agentId
  const hasSandbox = Boolean(agentConfig?.e2bSandboxId)

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }

  const pauseVm = async () => {
    if (!agentId || status !== "active") return

    try {
      const result = await axios.post("/api/agent/vm", {
        agentId,
        action: "pause",
      })
      setStatus(result.data.status ?? "paused")
      setStreamUrl(null)
      setIsOpen(false)

      if (result.data.agentConfig) {
        setAgentConfig(result.data.agentConfig)
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error?.response?.data?.error ?? "Unable to pause VM desktop.")
    }
  }

  const scheduleIdlePause = () => {
    clearIdleTimer()

    if (isOpen || status !== "active") return

    idleTimerRef.current = setTimeout(() => {
      pauseVm()
    }, INACTIVITY_TIMEOUT_MS)
  }

  const loadStatus = async () => {
    if (!agentId) return

    try {
      const result = await axios.get(`/api/agent/vm?agentId=${agentId}`)
      const nextStatus = result.data.status ?? "inactive"
      setStatus(nextStatus)

      if (result.data.configured === false) {
        setStatus("unconfigured")
      }

      if (nextStatus === "active" && !streamUrl) {
        activateVm({ openFullscreen: false })
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error?.response?.data?.error ?? "Unable to load VM status.")
    }
  }

  const activateVm = async ({ openFullscreen = true } = {}) => {
    if (!agentId || isLoading) return

    clearIdleTimer()
    setIsLoading(true)
    setMessage(null)

    try {
      const result = await axios.post("/api/agent/vm", {
        agentId,
        action: "activate",
      })

      setStatus(result.data.status ?? "active")
      setStreamUrl(result.data.streamUrl)
      setIsOpen(openFullscreen)

      if (result.data.agentConfig) {
        setAgentConfig(result.data.agentConfig)
      }
    } catch (error: any) {
      setStatus(error?.response?.data?.configured === false ? "unconfigured" : "error")
      setMessage(error?.response?.data?.error ?? "Unable to activate VM desktop.")
    } finally {
      setIsLoading(false)
    }
  }

  const closeDesktop = () => {
    setIsOpen(false)
    scheduleIdlePause()
  }

  const openDesktop = () => {
    if (streamUrl && status === "active") {
      clearIdleTimer()
      setIsOpen(true)
      return
    }

    activateVm()
  }

  useEffect(() => {
    loadStatus()

    return clearIdleTimer
  }, [agentId])

  useEffect(() => {
    scheduleIdlePause()

    return clearIdleTimer
  }, [isOpen, status, agentId])

  const statusLabel =
    status === "active"
      ? "Active"
      : status === "paused"
        ? "Paused"
        : status === "unconfigured"
          ? "Setup needed"
          : status === "error"
            ? "Error"
            : "Inactive"

  const badgeVariant = status === "active" ? "default" : status === "error" ? "destructive" : "outline"

  const showingLive = Boolean(streamUrl && status === "active")

  return (
    <>
      <button
        type="button"
        onClick={openDesktop}
        className={cn(
          "group relative block h-44 w-full overflow-hidden rounded-2xl border text-left transition hover:border-primary/40",
          isLoading && "cursor-wait"
        )}
        style={{
          backgroundImage: `url('${CARD_BACKGROUND_URL}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* background scene: live stream, or a wallpaper with a mocked-up desktop */}
        <div className="absolute inset-0">
          {showingLive && !isOpen ? (
            <iframe
              title="Agent VM Desktop Preview"
              src={streamUrl ?? undefined}
              className="pointer-events-none h-full w-full border-0"
              tabIndex={-1}
              allow="clipboard-read; clipboard-write"
            />
          ) : showingLive ? (
            // Dialog ouvert : on ne charge pas une seconde connexion au même flux
            <div className="h-full w-full bg-black" />
          ) : (
            <div className="relative h-full w-full">
              {/* wallpaper photo */}
              <img
                src={DEFAULT_WALLPAPER_SRC}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* slight darken so the glass windows stay legible on any photo */}
              <div className="absolute inset-0 bg-black/10" />

              {/* back window */}
              <div className="absolute left-[16%] top-[16%] w-[54%] overflow-hidden rounded-[10px] border border-white/15 bg-black/40 shadow-lg backdrop-blur-2xl">
                <div className="flex h-4 items-center gap-1 border-b border-white/10 px-1.5">
                  <span className="size-1.5 rounded-full bg-[#ff5f57]/70" />
                  <span className="size-1.5 rounded-full bg-[#febc2e]/70" />
                  <span className="size-1.5 rounded-full bg-[#28c840]/70" />
                </div>
                <div className="space-y-1.5 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/70" />
                      <span
                        className="block h-1 rounded-full bg-white/15"
                        style={{ width: `${55 + ((i * 13) % 35)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* front window: mocked outreach/queue list */}
              <div className="absolute left-[30%] top-[30%] w-[62%] overflow-hidden rounded-[10px] border border-white/20 bg-black/55 shadow-xl backdrop-blur-2xl">
                <div className="flex h-4 items-center gap-1 border-b border-white/10 px-1.5">
                  <span className="size-1.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-1.5 rounded-full bg-[#febc2e]" />
                  <span className="size-1.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="space-y-1.5 p-2">
                  <span className="block h-1 w-1/3 rounded-full bg-white/25" />
                  {["Priya N.", "Marcus W.", "Elena S."].map((name, i) => (
                    <div key={name} className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="size-2.5 shrink-0 rounded-full bg-white/20" />
                        <span
                          className="block h-1 rounded-full bg-white/15"
                          style={{ width: `${34 + i * 10}px` }}
                        />
                      </div>
                      <span className="shrink-0 rounded border border-white/20 px-1 text-[6px] font-medium text-white/60">
                        Draft
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* dock */}
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-white/15 bg-black/35 px-1.5 py-1 shadow-lg backdrop-blur-2xl">
                <span className="flex size-4 items-center justify-center rounded-[5px] bg-gradient-to-br from-sky-400 to-blue-600 shadow-sm">
                  <Compass className="size-2.5 text-white" />
                </span>
                <span className="flex size-4 items-center justify-center rounded-[5px] bg-gradient-to-br from-sky-300 to-indigo-500 shadow-sm">
                  <Mail className="size-2.5 text-white" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* title overlay: text + icon floating on the scene, with a subtle top scrim */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/45 to-transparent px-3 pb-6 pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white backdrop-blur-md">
              {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Monitor className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">VM Desktop</p>
              <p className="truncate text-xs text-white/70">
                {status === "active"
                  ? "Click preview to open full screen"
                  : hasSandbox
                    ? "Reconnect to this agent VM"
                    : "Click to activate this agent VM"}
              </p>
            </div>
          </div>
          <Badge variant={badgeVariant} className="border-white/20 bg-white/10 text-white backdrop-blur-md">
            {statusLabel}
          </Badge>
        </div>

        {showingLive ? (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
            <Maximize2 className="size-3" />
            Open
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-lg px-4 py-3 text-center">
              {/* Liquid Glass badge */}
              <Badge
                variant="outline"
                className="
                  relative overflow-hidden rounded-full px-4 py-1.5
                  border border-white/30
                  bg-white/10 dark:bg-white/5
                  text-white
                  backdrop-blur-xl backdrop-saturate-[1.8]
                  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),inset_0_-1px_0_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.12)]
                  transition-all duration-300 ease-out
                  group-hover:bg-white/20 group-hover:scale-[1.03]
                  group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.18)]
                  group-active:scale-[0.98]
                  before:pointer-events-none before:absolute before:inset-0 before:rounded-full
                  before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent
                  before:opacity-70
                "
              >
                <span className="relative text-sm font-medium drop-shadow-sm">
                  {isLoading ? "Activating VM" : hasSandbox ? "Reactivate VM" : "Activate VM"}
                </span>
              </Badge>
            </div>
          </div>
        )}
      </button>

      {message && <p className="text-xs leading-5 text-destructive">{message}</p>}

      <Dialog
        open={isOpen}
        // évite de fermer le bureau par un clic accidentel à côté (Base UI)
        disablePointerDismissal
        onOpenChange={(open) => {
          if (!open) closeDesktop()
        }}
      >
        <DialogContent className="flex h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[95vw]">
          {/* pr-12 laisse la place à la croix native du Dialog */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b pl-4 pr-12">
            <div className="flex items-center gap-2">
              <Monitor className="size-4 text-muted-foreground" />
              <DialogTitle className="text-sm font-medium">VM Desktop</DialogTitle>
              <Badge variant={badgeVariant}>{statusLabel}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => activateVm()} disabled={isLoading}>
                {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
                Reconnect
              </Button>
              <Button size="sm" variant="outline" onClick={pauseVm}>
                <Power className="size-4" />
                Pause
              </Button>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Bureau distant de la machine virtuelle de l&apos;agent
          </DialogDescription>

          <div className="min-h-0 flex-1 bg-black">
            {streamUrl ? (
              <iframe
                title="Agent VM Desktop"
                src={streamUrl}
                className="h-full w-full border-0"
                allow="clipboard-read; clipboard-write; fullscreen"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isLoading ? "Starting VM desktop..." : "Reactivate the VM desktop to continue."}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}