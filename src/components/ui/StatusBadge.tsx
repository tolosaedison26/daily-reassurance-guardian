import { cn } from "@/lib/utils";

export type StatusType = "safe" | "pending" | "missed" | "paused";

const STATUS_CONFIG: Record<StatusType, { label: string; icon: string; bgVar: string; textVar: string }> = {
  safe: { label: "Safe", icon: "✓", bgVar: "--status-checked", textVar: "--status-checked" },
  pending: { label: "Awaiting", icon: "⏳", bgVar: "--status-pending", textVar: "--status-pending" },
  missed: { label: "Missed", icon: "⚠️", bgVar: "--status-alert", textVar: "--status-alert" },
  paused: { label: "Paused", icon: "—", bgVar: "--status-none", textVar: "--status-none" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
        className
      )}
      style={{
        background: `hsl(var(${config.bgVar}) / 0.12)`,
        color: `hsl(var(${config.textVar}))`,
      }}
    >
      {config.icon} {config.label}
    </span>
  );
}
