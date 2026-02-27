import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; iconSize: number }> = {
  sm: { container: "w-7 h-7", text: "text-[10px]", iconSize: 14 },
  md: { container: "w-10 h-10", text: "text-xs", iconSize: 18 },
  lg: { container: "w-[72px] h-[72px]", text: "text-xl", iconSize: 28 },
  xl: { container: "w-[88px] h-[88px]", text: "text-2xl", iconSize: 32 },
};

interface AvatarCircleProps {
  name?: string;
  size?: AvatarSize;
  className?: string;
}

export default function AvatarCircle({ name, size = "md", className }: AvatarCircleProps) {
  const s = SIZE_MAP[size];
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : null;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        s.container,
        className
      )}
      style={{
        background: initials ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
        color: initials ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      }}
      aria-hidden="true"
    >
      {initials ? (
        <span className={s.text}>{initials}</span>
      ) : (
        <User style={{ width: s.iconSize, height: s.iconSize }} />
      )}
    </div>
  );
}
