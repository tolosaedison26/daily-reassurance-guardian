import { cn } from "@/lib/utils";

interface SkeletonLineProps {
  className?: string;
}

function SkeletonLine({ className }: SkeletonLineProps) {
  return <div className={cn("h-4 rounded bg-muted animate-pulse", className)} />;
}

export function SeniorListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-32 h-4" />
            <SkeletonLine className="w-20 h-3" />
          </div>
          <SkeletonLine className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function StatsStripSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border p-4 h-24 animate-pulse" />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
      <SkeletonLine className="w-24 h-5 mb-3" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="w-full aspect-square rounded bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonLine className="w-48 h-8" />
      <StatsStripSkeleton />
      <SeniorListSkeleton />
    </div>
  );
}
