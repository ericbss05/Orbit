export const THINKING_STEPS = [
  "Reading your message",
  "Thinking it through",
  "Checking available tools",
  "Preparing the answer",
]

// Long unbroken strings (URLs, hashes…) wrap instead of overflowing.
export const WRAP = "break-words [overflow-wrap:anywhere] min-w-0"

// Agent: soft grey bubble, blue links. User: solid black bubble (inverts in dark mode).
export const AGENT_BUBBLE = `${WRAP} max-w-[88%] rounded-[20px] bg-muted px-4 py-3 text-[15px] leading-[22px] text-foreground [&_a]:text-[#3b82f6] [&_a]:no-underline [&_a:hover]:underline`
export const USER_BUBBLE = `${WRAP} max-w-[78%] rounded-[20px] bg-foreground px-4 py-3 text-[15px] leading-[22px] text-background`

// Markdown styling for the black user bubble (colors are inverted: text-background).
export const USER_MD = [
  "[&_p]:whitespace-pre-wrap [&_p+*]:mt-2 [&_*+p]:mt-2",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5",
  "[&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:leading-snug",
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_code]:rounded [&_code]:bg-background/15 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/15 [&_pre]:p-3",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-background/40 [&_blockquote]:pl-3 [&_blockquote]:opacity-90",
  "[&_hr]:border-background/30",
].join(" ")