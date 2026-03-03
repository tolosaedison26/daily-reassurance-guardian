import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, getDay, getDaysInMonth, isToday, addMonths, subMonths, isFuture } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

type CheckinStatus = "checked" | "missed" | "none" | "future";

interface DayData {
  date: Date;
  status: CheckinStatus;
  time?: string;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusStyles: Record<CheckinStatus, { bg: string; border?: string }> = {
  checked: { bg: "hsl(var(--status-checked))" },
  missed: { bg: "hsl(var(--status-alert))" },
  none: { bg: "transparent", border: "hsl(var(--border))" },
  future: { bg: "transparent" },
};

interface CheckinCalendarProps {
  seniorUserId?: string | null;
}

export default function CheckinCalendar({ seniorUserId }: CheckinCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [checkInDates, setCheckInDates] = useState<Map<string, string>>(new Map());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    if (!seniorUserId) return;
    const startDate = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
    const endDate = format(new Date(year, month, getDaysInMonth(new Date(year, month))), "yyyy-MM-dd");

    supabase
      .from("check_ins")
      .select("check_date, checked_in_at")
      .eq("senior_id", seniorUserId)
      .eq("status", "SAFE")
      .gte("check_date", startDate)
      .lte("check_date", endDate)
      .then(({ data }) => {
        const map = new Map<string, string>();
        (data || []).forEach((ci: any) => {
          map.set(ci.check_date, ci.checked_in_at);
        });
        setCheckInDates(map);
      });
  }, [seniorUserId, year, month]);

  const days = useMemo(() => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(new Date(year, month));
    const result: DayData[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (isFuture(date) && !isToday(date)) {
        result.push({ date, status: "future" });
        continue;
      }
      const dateStr = format(date, "yyyy-MM-dd");
      const checkedAt = checkInDates.get(dateStr);
      if (checkedAt) {
        const t = new Date(checkedAt);
        result.push({
          date,
          status: "checked",
          time: format(t, "h:mm a"),
        });
      } else if (isToday(date)) {
        result.push({ date, status: "none" });
      } else {
        result.push({ date, status: "missed" });
      }
    }
    return result;
  }, [year, month, checkInDates]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
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

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
                color: day.status === "checked" || day.status === "missed" ? "#fff" : undefined,
              }}
              title={day.time ? `${format(day.date, "MMM d")} — ${day.time}` : format(day.date, "MMM d")}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDay && selectedDay.status !== "future" && selectedDay.status !== "none" && (
        <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border animate-bounce-in">
          <p className="text-sm font-black">{format(selectedDay.date, "EEEE, MMM d")}</p>
          {selectedDay.status === "checked" && (
            <p className="text-sm mt-1">✓ Checked in at {selectedDay.time}</p>
          )}
          {selectedDay.status === "missed" && (
            <p className="text-sm mt-1" style={{ color: "hsl(var(--status-alert))" }}>✗ Missed check-in</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: "Checked in", color: "hsl(var(--status-checked))" },
          { label: "Missed", color: "hsl(var(--status-alert))" },
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
