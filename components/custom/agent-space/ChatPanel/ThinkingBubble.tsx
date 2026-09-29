import { useEffect, useState } from "react"
import { THINKING_STEPS } from "./constants"

// A calm grey bubble: a breathing orb, a shimmering label that cross-fades
// between steps, and a discreet elapsed timer.
export function ThinkingBubble() {
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const s = window.setInterval(() => setStep((v) => Math.min(v + 1, THINKING_STEPS.length - 1)), 2400)
    const c = window.setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => {
      window.clearInterval(s)
      window.clearInterval(c)
    }
  }, [])

  return (
    <div className="flex flex-col items-start animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <style>{`
        @keyframes think-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
        @keyframes think-breathe { 0%,100% { transform: scale(.85); opacity: .55 } 50% { transform: scale(1.1); opacity: 1 } }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-[20px] bg-muted px-4 py-3"
      >
        <span className="relative flex size-3 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-foreground/25 motion-reduce:hidden"
            style={{ animation: "think-breathe 1.6s ease-in-out infinite" }}
          />
          <span className="relative size-1.5 rounded-full bg-foreground" />
        </span>

        <span
          key={step}
          className="animate-in fade-in-0 slide-in-from-bottom-1 bg-clip-text text-[15px] leading-[22px] text-transparent duration-500 motion-reduce:text-muted-foreground"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--muted-foreground) 0%, var(--muted-foreground) 35%, var(--foreground) 50%, var(--muted-foreground) 65%, var(--muted-foreground) 100%)",
            backgroundSize: "200% 100%",
            animation: "think-shimmer 2.2s linear infinite",
          }}
        >
          {THINKING_STEPS[step]}…
        </span>

        <span className="text-xs tabular-nums text-muted-foreground/70">{elapsed}s</span>
      </div>
    </div>
  )
}