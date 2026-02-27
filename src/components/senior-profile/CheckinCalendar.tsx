import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, getDay, getDaysInMonth, isToday, addMonths, subMonths } from "date-fns";
import { generateMonthData, type DayData, type CheckinStatus } from "./mock-data";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusStyles: Record<CheckinStatus, { bg: string; border?: string }> = {
  checked: { bg: "hsl(var(--status-checked))" },
  missed: { bg: "hsl(var(--status-alert))" },
  late: { bg: "hsl(var(--status-pending))" },
  none: { bg: "transparent", border: "hsl(var(--border))" },
  future: { bg: "transparent" },
};

function moodEmoji(mood: string | null | undefined) {
  if (mood === "great") return "😊";
  if (mood === "okay") return "😐";
  if (mood === "bad") return "😟";
  return "—";
}

export default function CheckinCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = useMemo(() => generateMonthData(year, month), [year, month]);
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black">Check-in History</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold min-w-[120px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day, i) => {
          const s = statusStyles[day.status];
          const today = isToday(day.date);
          const isSelected = selectedDay?.date.getTime() === day.date.getTime();
          return (
            <button
              key={i}
              onClick={() => {
                if (day.status === "future") return;
                setSelectedDay(isSelected ? null : day);
              }}
              className={`aspect-square rounded-full flex items-center justify-center text-xs font-bold transition-all relative
                ${day.status === "future" ? "opacity-30 cursor-default" : "cursor-pointer hover:scale-110"}
                ${today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                ${isSelected ? "scale-110" : ""}
              `}
              style={{
                background: s.bg,
                border: s.border ? `2px solid ${s.border}` : undefined,
                color: day.status === "checked" || day.status === "missed" || day.status === "late" ? "#fff" : undefined,
              }}
              title={day.time ? `${format(day.date, "MMM d")} — ${day.time}` : format(day.date, "MMM d")}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && selectedDay.status !== "future" && selectedDay.status !== "none" && (
        <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border animate-bounce-in">
          <p className="text-sm font-black">{format(selectedDay.date, "EEEE, MMM d")}</p>
          {selectedDay.status === "checked" && (
            <>
              <p className="text-sm mt-1">✓ Checked in at {selectedDay.time} {selectedDay.responseMinutes ? `(${selectedDay.responseMinutes} min after reminder)` : ""}</p>
              <p className="text-sm mt-0.5">Mood: {moodEmoji(selectedDay.mood)} {selectedDay.mood === "great" ? "Great" : selectedDay.mood === "okay" ? "Okay" : "Not great"}</p>
              {selectedDay.note && <p className="text-sm text-muted-foreground mt-0.5 italic">"{selectedDay.note}"</p>}
            </>
          )}
          {selectedDay.status === "missed" && <p className="text-sm mt-1" style={{ color: "hsl(var(--status-alert))" }}>✗ Missed check-in</p>}
          {selectedDay.status === "late" && (
            <>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--status-pending))" }}>Late check-in at {selectedDay.time}</p>
              {selectedDay.mood && <p className="text-sm mt-0.5">Mood: {moodEmoji(selectedDay.mood)}</p>}
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: "Checked in", color: "hsl(var(--status-checked))" },
          { label: "Missed", color: "hsl(var(--status-alert))" },
          { label: "Late", color: "hsl(var(--status-pending))" },
          { label: "No schedule", color: "transparent", border: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: l.color, border: l.border ? "2px solid hsl(var(--border))" : undefined }}
            />
            <span className="text-[11px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
