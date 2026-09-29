import { Skeleton } from "@/components/ui/skeleton"

export function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-1">
        <Skeleton className="h-16 w-2/3 rounded-[20px]" />
        <Skeleton className="h-10 w-1/2 rounded-[20px]" />
      </div>
      <div className="flex flex-col items-end">
        <Skeleton className="h-10 w-1/3 rounded-[20px]" />
      </div>
      <div className="flex flex-col items-start">
        <Skeleton className="h-12 w-3/5 rounded-[20px]" />
      </div>
    </div>
  )
}