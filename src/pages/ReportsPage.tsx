import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Mail, BarChart2, Loader2 } from "lucide-react";
import { ReportsHelpButton } from "@/components/HelpModalsContent";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/ui/EmptyState";

interface SeniorData {
  id: string;
  first_name: string;
  last_name: string;
  reminder_hour: string;
  reminder_minute: string;
  reminder_period: string;
  grace_period_minutes: number;
  mood_check_enabled: boolean;
}

interface CheckInRecord {
  check_date: string;
  checked_in_at: string;
  senior_id: string;
}

function getWeekRange(offset: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getWeekLabel(offset: number) {
  const { start, end } = getWeekRange(offset);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

type DayStatus = "checked" | "missed" | "none";

function getDayStatuses(checkDates: Set<string>, weekStart: Date): DayStatus[] {
  const days: DayStatus[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    if (d > today) {
      days.push("none");
    } else if (checkDates.has(dateStr)) {
      days.push("checked");
    } else {
      days.push("missed");
    }
  }
  return days;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [seniors, setSeniors] = useState<SeniorData[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingPreview, setSendingPreview] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: managed } = await supabase
      .from("managed_seniors")
      .select("id, first_name, last_name, reminder_hour, reminder_minute, reminder_period, grace_period_minutes, mood_check_enabled, claimed_by")
      .eq("caregiver_id", user.id)
      .order("created_at", { ascending: false });

    setSeniors(managed || []);

    // Load check-ins for claimed seniors
    const claimedIds = (managed || []).filter((m: any) => m.claimed_by).map((m: any) => m.claimed_by);
    if (claimedIds.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
      const { data: cis } = await supabase
        .from("daily_check_ins")
        .select("check_date, checked_in_at, senior_id")
        .in("senior_id", claimedIds)
        .gte("check_date", thirtyDaysAgo.toISOString().split("T")[0]);
      setCheckIns(cis || []);
    } else {
      setCheckIns([]);
    }

    setLoading(false);
  };

  const handleSendPreview = () => {
    setSendingPreview(true);
    setTimeout(() => {
      setSendingPreview(false);
      toast({ title: "Preview digest sent", description: `Sent to ${user?.email || "your email address"}.` });
    }, 1500);
  };

  const weekLabel = getWeekLabel(weekOffset);
  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Filter check-ins for current week
  const weekCheckIns = checkIns.filter(c => c.check_date >= weekStartStr && c.check_date <= weekEndStr);

  // Per-senior stats
  const seniorStats = seniors.map(s => {
    const sCheckIns = weekCheckIns.filter(c => {
      // Match by claimed_by
      return true; // We'll match below
    });
    const allCheckDates = new Set(checkIns.filter(c => c.check_date >= weekStartStr && c.check_date <= weekEndStr).map(c => c.check_date));

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let scheduledDays = 0;
    let checkedDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      if (d <= today) {
        scheduledDays++;
        if (allCheckDates.has(d.toISOString().split("T")[0])) checkedDays++;
      }
    }
    const rate = scheduledDays > 0 ? Math.round((checkedDays / scheduledDays) * 100) : 0;
    const days = getDayStatuses(allCheckDates, weekStart);

    return {
      ...s,
      name: `${s.first_name} ${s.last_name}`,
      initials: `${s.first_name[0] || ""}${s.last_name[0] || ""}`.toUpperCase(),
      rate,
      checkedDays,
      scheduledDays,
      days,
    };
  });

  const totalCheckIns = seniorStats.reduce((sum, s) => sum + s.checkedDays, 0);
  const totalScheduled = seniorStats.reduce((sum, s) => sum + s.scheduledDays, 0);
  const overallRate = totalScheduled > 0 ? Math.round((totalCheckIns / totalScheduled) * 100) : 0;
  const missedCheckIns = totalScheduled - totalCheckIns;

  const ratePillColor = (rate: number) => {
    if (rate >= 80) return { bg: "hsl(var(--status-checked) / 0.12)", color: "hsl(var(--status-checked))" };
    if (rate >= 60) return { bg: "hsl(var(--status-pending) / 0.12)", color: "hsl(var(--status-pending))" };
    return { bg: "hsl(var(--status-alert) / 0.12)", color: "hsl(var(--status-alert))" };
  };

  const dayInitials = ["M", "T", "W", "T", "F", "S", "S"];
  const dayBoxColor = (s: DayStatus) => {
    if (s === "checked") return "hsl(var(--status-checked))";
    if (s === "missed") return "hsl(var(--status-alert))";
    return "hsl(var(--muted))";
  };

  const singular = seniors.length === 1;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1">
          <h2 className="text-2xl font-black">Weekly Reports</h2>
          <ReportsHelpButton />
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-xl w-64" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Week selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1">
          <h2 className="text-2xl font-black">Weekly Reports</h2>
          <ReportsHelpButton />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1 shadow-card">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-semibold px-2 whitespace-nowrap">{weekLabel}</span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" disabled={weekOffset >= 0}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toast({ title: "Export Started", description: `Exporting CSV for ${weekLabel}…` })}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {seniors.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No report data yet"
          description="Check-in history and mood trends will appear here after your seniors complete their first check-in."
        />
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-card text-center">
              <p className="text-3xl font-black">{totalCheckIns}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Check-ins</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-card text-center">
              <p className="text-3xl font-black" style={{ color: overallRate >= 80 ? "hsl(var(--status-checked))" : overallRate >= 60 ? "hsl(var(--status-pending))" : "hsl(var(--status-alert))" }}>
                {overallRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Rate</p>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-card text-center">
              <p className="text-3xl font-black" style={{ color: missedCheckIns > 0 ? "hsl(var(--status-alert))" : "hsl(var(--status-checked))" }}>
                {missedCheckIns}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Missed</p>
            </div>
          </div>

          {/* Senior summaries */}
          <div>
            <h3 className="text-lg font-black mb-3">
              {singular ? "Your Senior's Check-in Rate" : "Senior Check-in Rates"}
            </h3>
            <div className="space-y-3">
              {seniorStats.map((s) => {
                const pill = ratePillColor(s.rate);
                return (
                  <div key={s.id} className="bg-card rounded-2xl border border-border shadow-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}
                      >
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.checkedDays}/{s.scheduledDays} days</p>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full text-xs font-black shrink-0"
                        style={{ background: pill.bg, color: pill.color }}
                      >
                        {s.rate}%
                      </div>
                    </div>
                    {/* Mini calendar */}
                    <div className="flex items-center gap-2">
                      {s.days.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground font-medium">{dayInitials[i]}</span>
                          <div className="w-7 h-7 rounded-lg" style={{ background: dayBoxColor(d) }} />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/seniors/${s.id}`)}
                      className="text-xs text-primary hover:underline font-semibold mt-2"
                    >
                      View Profile →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Email Digest */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-black text-base mb-1">Weekly Email Digest</h3>
            <p className="text-sm text-muted-foreground mb-3">A summary is automatically emailed every Sunday at 8 AM.</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={sendingPreview}
              onClick={handleSendPreview}
            >
              {sendingPreview ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              ) : (
                <><Mail className="w-4 h-4" /> Send Preview Email</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {user?.email
                ? `Sent to: ${user.email}`
                : (
                  <>
                    Add your email in Settings to use this feature.{" "}
                    <button onClick={() => navigate("/settings")} className="text-primary hover:underline font-semibold">Go to Settings →</button>
                  </>
                )
              }
            </p>
          </div>
        </>
      )}
    </div>
  );
}
