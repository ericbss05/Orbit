"use client"

import { Loader2, Check } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Palette de couleurs de fond pour l'avatar
const AVATAR_COLORS = [
  "8b5e3c",
  "ef4444",
  "f97316",
  "f5b942",
  "22c55e",
  "14b8a6",
  "3b82f6",
  "a78bfa",
  "ec4899",
  "9ca3af",
]

// Seeds préréglés pour proposer différents avatars
const AVATAR_SEEDS = ["nova", "pixel", "bloom", "drift", "echo", "flux", "glow", "tide"]

const AVATAR_STYLE = "glass"

function buildAvatarUrl(seed: string, backgroundColor?: string) {
  const params = new URLSearchParams({ seed })
  if (backgroundColor) params.set("backgroundColor", backgroundColor)
  return `https://api.dicebear.com/10.x/${AVATAR_STYLE}/svg?${params.toString()}`
}

function CreateAgent() {
  const [name, setName] = useState("")
  const [avatarSeed, setAvatarSeed] = useState<string>(AVATAR_SEEDS[6])
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[7])
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const avatarUrl = buildAvatarUrl(avatarSeed, avatarColor)

  const onClickCreateAgent = async () => {
    if (isLoading || !name) return
    setIsLoading(true)

    try {
      const newAgentId = crypto.randomUUID()

      await axios.post("/api/agent", {
        name,
        description: "",
        agentImage: avatarUrl,
        agentId: newAgentId,
      })

      router.push("/workspace/" + newAgentId)
    } catch (e) {
      console.log("Error creating agent: ", e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      {/* Header */}
      <header className="flex items-center gap-2 border-b bg-background px-6 py-4">
        <Avatar className="h-6 w-6">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback>{name.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">New Bot</span>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 border shadow-sm">
              <AvatarImage src={avatarUrl} alt="Agent avatar" />
              <AvatarFallback>{name.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-xl">Create your agent</CardTitle>
            <CardDescription>Pick a look and give it a name to get started.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Color picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    aria-label={`Choisir la couleur ${color}`}
                    aria-pressed={avatarColor === color}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110",
                      avatarColor === color && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: `#${color}` }}
                  >
                    {avatarColor === color && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar picker */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setAvatarSeed(seed)}
                    aria-label={`Choisir l'avatar ${seed}`}
                    aria-pressed={avatarSeed === seed}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border bg-background transition hover:scale-105",
                      avatarSeed === seed && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={buildAvatarUrl(seed, avatarColor)} alt="" />
                      <AvatarFallback>{seed.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>

            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                name="name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="LinkedIn manager"
              />
            </div>

            {/* Submit */}
            <Button
              type="button"
              onClick={onClickCreateAgent}
              disabled={isLoading || !name}
              className="w-full"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Get started
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default CreateAgent