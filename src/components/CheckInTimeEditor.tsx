import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Set to false to disable once-per-week restriction
const ENFORCE_WEEKLY_LIMIT = true;
const CHANGE_COOLDOWN_DAYS = 7;

function getStorageKey(userId: string) {
  return `checkin_time_changed_at_${userId}`;
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function to24h(hour: number, minute: number, period: "AM" | "PM"): string {
  let h = hour;
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parse12h(time24: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const [h, m] = time24.split(":").map(Number);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour, minute: m, period };
}

interface CheckInTimeEditorProps {
  seniorId: string;
  compact?: boolean;
}

export default function CheckInTimeEditor({ seniorId, compact = false }: CheckInTimeEditorProps) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editable fields
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Weekly limit
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);
  const [canChange, setCanChange] = useState(true);
  const [nextChangeDate, setNextChangeDate] = useState<string | null>(null);

  useEffect(() => {
    loadTime();
  }, [seniorId]);

  useEffect(() => {
    if (!user || !ENFORCE_WEEKLY_LIMIT) {
      setCanChange(true);
      return;
    }
    const stored = localStorage.getItem(getStorageKey(user.id));
    if (stored) {
      const lastDate = new Date(stored);
      setLastChangedAt(lastDate);
      const nextAllowed = new Date(lastDate.getTime() + CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() < nextAllowed) {
        setCanChange(false);
        setNextChangeDate(nextAllowed.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
      } else {
        setCanChange(true);
      }
    }
  }, [user]);

  const loadTime = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seniors")
      .select("check_in_time")
      .eq("id", seniorId)
      .maybeSingle();

    const time = data?.check_in_time || "18:00";
    setCurrentTime(time);
    const parsed = parse12h(time);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;

    if (ENFORCE_WEEKLY_LIMIT && !canChange) {
      toast({
        title: "Cannot change yet",
        description: `You can change your check-in time again on ${nextChangeDate}.`,
        variant: "destructive",
      });
      return;
    }

    const newTime = to24h(hour, minute, period);
    if (newTime === currentTime) {
      setEditing(false);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("seniors")
      .update({ check_in_time: newTime })
      .eq("id", seniorId);

    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      setCurrentTime(newTime);
      if (ENFORCE_WEEKLY_LIMIT) {
        localStorage.setItem(getStorageKey(user.id), new Date().toISOString());
        setLastChangedAt(new Date());
        const nextAllowed = new Date(Date.now() + CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
        setCanChange(false);
        setNextChangeDate(nextAllowed.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
      }
      toast({ title: "Check-in time updated", description: `Your new check-in time is ${formatTime12h(newTime)}. It takes effect tomorrow.` });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card flex items-center justify-center min-h-[80px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Compact mode for dashboard
  if (compact && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card text-left"
        style={{ minHeight: "64px" }}
      >
        <div
          className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Clock className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold" style={{ fontSize: "18px" }}>Check-In Time</p>
          <p className="text-muted-foreground" style={{ fontSize: "16px" }}>
            {currentTime ? formatTime12h(currentTime) : "Not set"} daily
          </p>
        </div>
        <span className="text-muted-foreground text-base font-semibold shrink-0">Change</span>
      </button>
    );
  }

  // Edit mode (or full settings mode)
  if (editing || !compact) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-base">Check-In Time</h2>
        </div>

        {currentTime && (
          <p className="text-muted-foreground" style={{ fontSize: "15px" }}>
            Current time: <span className="font-bold text-foreground">{formatTime12h(currentTime)}</span>
          </p>
        )}

        {/* Time selector */}
        <div className="flex items-center gap-2">
          {/* Hour */}
          <select
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="h-12 rounded-xl border border-border bg-background text-base font-semibold px-3 flex-1 min-w-0"
            style={{ fontSize: "18px" }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>

          <span className="text-xl font-bold text-muted-foreground">:</span>

          {/* Minute */}
          <select
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            className="h-12 rounded-xl border border-border bg-background text-base font-semibold px-3 flex-1 min-w-0"
            style={{ fontSize: "18px" }}
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>

          {/* AM/PM */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
            className="h-12 rounded-xl border border-border bg-background text-base font-bold px-3 flex-1 min-w-0"
            style={{ fontSize: "18px" }}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>

        {/* Weekly limit notice */}
        {ENFORCE_WEEKLY_LIMIT && !canChange && (
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "hsl(var(--status-pending) / 0.08)", border: "1px solid hsl(var(--status-pending) / 0.2)" }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
            <p className="text-sm" style={{ color: "hsl(var(--status-pending))" }}>
              You can change your check-in time once per week. Next change available: <span className="font-bold">{nextChangeDate}</span>
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Your new time will take effect the next day.
          {ENFORCE_WEEKLY_LIMIT && canChange && " You can change this once per week."}
        </p>

        <div className="flex gap-3">
          {compact && (
            <Button
              variant="outline"
              onClick={() => {
                if (currentTime) {
                  const parsed = parse12h(currentTime);
                  setHour(parsed.hour);
                  setMinute(parsed.minute);
                  setPeriod(parsed.period);
                }
                setEditing(false);
              }}
              className="flex-1 h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || (!canChange && ENFORCE_WEEKLY_LIMIT) || to24h(hour, minute, period) === currentTime}
            className="flex-1 h-12 rounded-xl font-bold border-0"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Time"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
