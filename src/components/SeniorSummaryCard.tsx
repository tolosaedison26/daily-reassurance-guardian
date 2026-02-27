import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type DayStatus = "checked" | "missed" | "none";

interface SeniorSummaryCardProps {
  name: string;
  age: number;
  initials: string;
  streak: number;
  weekRate: number;
  days: DayStatus[];
  avgResponseTime: string;
  avgMoodScore: string;
  onViewProfile?: () => void;
}

const dayInitials = ["M", "T", "W", "T", "F", "S", "S"];

function ratePillColor(rate: number) {
  if (rate >= 80) return { bg: "hsl(var(--status-checked) / 0.12)", color: "hsl(var(--status-checked))" };
  if (rate >= 60) return { bg: "hsl(var(--status-pending) / 0.12)", color: "hsl(var(--status-pending))" };
  return { bg: "hsl(var(--status-alert) / 0.12)", color: "hsl(var(--status-alert))" };
}

function dayBoxColor(s: DayStatus) {
  if (s === "checked") return "hsl(var(--status-checked))";
  if (s === "missed") return "hsl(var(--status-alert))";
  return "hsl(var(--muted))";
}

export default function SeniorSummaryCard({
  name, age, initials, streak, weekRate, days, avgResponseTime, avgMoodScore, onViewProfile,
}: SeniorSummaryCardProps) {
  const [open, setOpen] = useState(false);
  const pill = ratePillColor(weekRate);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black shrink-0"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm truncate">{name}, {age}</p>
          <p className="text-xs text-muted-foreground">🔥 {streak}-day streak</p>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-black shrink-0"
          style={{ background: pill.bg, color: pill.color }}
        >
          {weekRate}%
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
          {/* Mini calendar */}
          <div className="flex items-center gap-2 pt-3">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">{dayInitials[i]}</span>
                <div
                  className="w-7 h-7 rounded-lg"
                  style={{ background: dayBoxColor(d) }}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Avg: {avgResponseTime} after reminder · {avgMoodScore}
          </p>

          <Textarea placeholder="Add a note about this senior..." className="text-sm min-h-[60px] rounded-xl" />

          <Button variant="ghost" size="sm" className="text-xs px-0" onClick={onViewProfile}>
            View Full Profile →
          </Button>
        </div>
      )}
    </div>
  );
}
