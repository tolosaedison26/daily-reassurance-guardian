import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center gap-4", className)}>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Icon
          className="w-8 h-8"
          style={{ color: iconColor || "hsl(var(--muted-foreground))" }}
        />
      </div>
      <div>
        <p className="font-bold text-lg">{title}</p>
        <p className="text-muted-foreground text-sm mt-1 max-w-[280px] mx-auto">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="rounded-xl font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
