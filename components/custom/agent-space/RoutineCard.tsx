"use client"

import type { RoutineDraft } from "@/lib/openai/agent-response-schema"
import type { ToolSuggestionCardData } from "@/type/Message"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import axios, { AxiosError } from "axios"
import { CalendarDays, CheckCircle2, Clock3, Globe2, Loader2, Repeat2, Sparkles } from "lucide-react"
import { useState } from "react"
import { ToolSuggestionCard } from "./ToolSuggestionCard"

type RoutineCardProps = {
  agentId: string
  routine: RoutineDraft
  toolCards: ToolSuggestionCardData[]
  routineId?: string
  messageId?: string
  savedRoutineId?: string
  onSaved?: () => void
}

const weekDayLabels: Record<RoutineDraft["schedule"]["weekDays"][number], string> = {
  MO: "Lun",
  TU: "Mar",
  WE: "Mer",
  TH: "Jeu",
  FR: "Ven",
  SA: "Sam",
  SU: "Dim",
}

function displayToolName(slug: string) {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function isValidRoutineTime(value: string) {
  const trimmed = value.trim()

  return Boolean(
    /^\d{2}:\d{2}$/.test(trimmed)
    || /^(?:0?[1-9]|1[0-2]):[0-5]\d\s?[AP]M$/i.test(trimmed)
  )
}

export function RoutineCard({
  agentId,
  routine,
  toolCards,
  routineId,
  messageId,
  savedRoutineId,
  onSaved,
}: RoutineCardProps) {
  const [tools, setTools] = useState(toolCards)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreated, setIsCreated] = useState(Boolean(savedRoutineId))
  const [createdId, setCreatedId] = useState(savedRoutineId)
  const cardsBySlug = new Map(
    tools.map((tool) => [tool.slug.toLowerCase(), tool])
  )
  const requiredTools = routine.tools.flatMap((suggestion) => {
    const card = cardsBySlug.get(suggestion.slug.toLowerCase())

    if (!card) return []

    return [{ ...card, reason: suggestion.reason }]
  })
  const allConnected = requiredTools.length === 0 || requiredTools.every(
    (tool) => tool.isEnabled && tool.isConnected
  )
  const normalizedStartDate = routine.schedule.startDate.trim()
  const normalizedTime = routine.schedule.time.trim()
  const normalizedTimezone = routine.schedule.timezone.trim()
  const hasCompleteDetails = Boolean(
    routine.name.trim()
    && routine.goal.trim()
    && routine.instructions.trim()
    && /^\d{4}-\d{2}-\d{2}$/.test(normalizedStartDate)
    && isValidRoutineTime(normalizedTime)
    && normalizedTimezone
    && (routine.schedule.frequency !== "weekly" || routine.schedule.weekDays.length > 0)
  )
  const isReady = hasCompleteDetails && allConnected

  const updateConnection = (slug: string, isConnected: boolean) => {
    setTools((current) =>
      current.map((tool) =>
        tool.slug.toLowerCase() === slug.toLowerCase()
          ? { ...tool, isConnected }
          : tool
      )
    )
  }

  const createRoutine = async () => {
    setIsCreating(true)

    try {
      const targetId = routineId ?? createdId

      if (targetId) {
        await axios.patch("/api/routines", { agentId, routineId: targetId, routine })
      } else {
        const { data } = await axios.post("/api/routines", { agentId, routine, messageId })
        setCreatedId(data.routine.id)
      }

      setIsCreated(true)
      window.dispatchEvent(new CustomEvent("routines-changed", { detail: { agentId } }))
      onSaved?.()

      toast.add({
        title: routineId ? "Routine mise à jour" : "Routine créée",
        description: `Votre agent exécutera ${routineId ? "la routine mise à jour" : "cette routine"} à l'heure prévue.`,
        type: "success",
      })
    } catch (error) {
      const description = error instanceof AxiosError
        && typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : `Impossible de ${routineId ? "mettre à jour" : "créer"} cette routine.`

      toast.add({
        title: `Impossible de ${routineId ? "mettre à jour" : "créer"} la routine`,
        description,
        type: "error",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
      <div className="border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          Routine suggérée
        </div>

        <h3 className="mt-2 text-base font-semibold leading-6">{routine.name}</h3>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {routine.goal}
        </p>
      </div>

      <div className="space-y-5 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Instructions
          </p>

          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
            {routine.instructions}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ScheduleDetail icon={CalendarDays} label="Début" value={routine.schedule.startDate} />
          <ScheduleDetail icon={Clock3} label="Heure" value={routine.schedule.time} />
          <ScheduleDetail icon={Repeat2} label="Fréquence" value={routine.schedule.frequency} />
          <ScheduleDetail icon={Globe2} label="Fuseau horaire" value={routine.schedule.timezone} />
        </div>

        {routine.schedule.weekDays.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {routine.schedule.weekDays.map((day) => (
              <Badge key={day} variant="secondary">
                {weekDayLabels[day]}
              </Badge>
            ))}
          </div>
        )}

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Outils requis
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Suggérés en fonction des besoins de la routine
              </p>
            </div>

            {requiredTools.length > 0 && allConnected && (
              <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 data-icon="inline-start" /> Prêt
              </Badge>
            )}
          </div>

          {requiredTools.length > 0 ? (
            <div className="space-y-2.5">
              {requiredTools.map((tool) => (
                <ToolSuggestionCard
                  key={tool.slug}
                  agentId={agentId}
                  tool={tool}
                  onConnectionChange={updateConnection}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
              Cette routine ne nécessite aucun outil externe.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs leading-5 text-muted-foreground">
            {isCreated
              ? "Cette routine est active et programmée."
              : isReady
                ? "Vérifiez les détails, puis confirmez cette automatisation."
                : !hasCompleteDetails
                  ? "L'agent a encore besoin de détails complets sur la planification."
                  : "Connectez tous les outils requis pour continuer."}
          </p>

          <Button
            className="shrink-0"
            disabled={!isReady || isCreating || isCreated}
            onClick={createRoutine}
          >
            {isCreating ? (
              <Loader2 className="animate-spin" />
            ) : isCreated ? (
              <CheckCircle2 />
            ) : (
              <Sparkles />
            )}

            {isCreating
              ? routineId ? "Mise à jour..." : "Création..."
              : isCreated
                ? routineId ? "Mise à jour effectuée" : "Créée"
                : routineId ? "Mettre à jour" : "Créer la routine"}
          </Button>
        </div>
      </div>
    </section>
  )
}

type ScheduleDetailProps = {
  icon: typeof CalendarDays
  label: string
  value: string
}

function ScheduleDetail({ icon: Icon, label, value }: ScheduleDetailProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>

        <p className="truncate text-xs font-medium capitalize">
          {value}
        </p>
      </div>
    </div>
  )
}