import { useState } from "react";
import { CheckCircle, XCircle, Bell, AlertTriangle, Shield, FileText, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday } from "date-fns";
import { generateTimelineEvents, type TimelineEvent } from "./mock-data";

const iconMap: Record<TimelineEvent["type"], { icon: typeof CheckCircle; color: string }> = {
  checkin: { icon: CheckCircle, color: "hsl(var(--status-checked))" },
  missed: { icon: XCircle, color: "hsl(var(--status-alert))" },
  reminder: { icon: Bell, color: "hsl(var(--status-pending))" },
  escalation: { icon: AlertTriangle, color: "hsl(var(--status-alert))" },
  safe: { icon: Shield, color: "hsl(var(--status-checked))" },
  note: { icon: FileText, color: "hsl(var(--muted-foreground))" },
  edit: { icon: Pencil, color: "hsl(var(--primary))" },
  started: { icon: Play, color: "hsl(var(--status-checked))" },
};

function formatTimestamp(d: Date) {
  const time = format(d, "h:mm a");
  if (isToday(d)) return `Today ${time}`;
  if (isYesterday(d)) return `Yesterday ${time}`;
  return `${format(d, "MMM d")} · ${time}`;
}

export default function ActivityTimeline() {
  const [events] = useState(generateTimelineEvents);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? events : events.slice(0, 10);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <h3 className="text-lg font-black mb-1">Recent Activity</h3>
      <p className="text-xs text-muted-foreground mb-4">All events in the last 30 days</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-0">
          {visible.map((event) => {
            const { icon: Icon, color } = iconMap[event.type];
            return (
              <div key={event.id} className="flex items-start gap-3 py-2.5 relative">
                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 bg-card z-10 border border-border">
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{event.label}</p>
                  {event.subText && <p className="text-xs text-muted-foreground mt-0.5">{event.subText}</p>}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">{formatTimestamp(event.timestamp)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!showAll && events.length > 10 && (
        <Button variant="ghost" className="w-full mt-2 font-bold text-sm" onClick={() => setShowAll(true)}>
          Load more
        </Button>
      )}
    </div>
  );
}
