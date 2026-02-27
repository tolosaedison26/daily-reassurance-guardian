import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Mail, AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WeeklyStatsRow from "@/components/WeeklyStatsRow";
import CheckinRatesCard from "@/components/CheckinRatesCard";
import MoodTrendsCard from "@/components/MoodTrendsCard";
import SeniorSummaryCard from "@/components/SeniorSummaryCard";

// --- Mock data ---
function getSeniorRates(offset: number) {
  const jitter = Math.abs(offset) % 5;
  return [
    { name: "Margaret Ross", rate: Math.min(100, 95 - jitter * 3), mood: jitter > 2 ? "😐" : "😊", email: "margaret.ross@email.com" },
    { name: "Frank Johnson", rate: Math.min(100, 86 + jitter * 2), mood: "😐", email: "frank.johnson@email.com" },
    { name: "Harold Chen", rate: Math.min(100, 71 - jitter * 5), mood: jitter > 1 ? "😔" : "😐", email: "harold.chen@email.com" },
    { name: "Dorothy Wilson", rate: Math.min(100, 43 + jitter * 8), mood: jitter > 3 ? "😐" : "😔", email: "dorothy.wilson@email.com" },
  ];
}

type MoodValue = "great" | "okay" | "bad" | null;

const moodData: { name: string; days: MoodValue[]; trending: string; trendEmoji: string }[] = [
  { name: "Margaret Ross", days: ["great", "great", "great", "okay", "great", "great", null], trending: "Trending", trendEmoji: "😊" },
  { name: "Frank Johnson", days: ["great", "okay", "great", "great", "okay", "great", "great"], trending: "Trending", trendEmoji: "😊" },
  { name: "Harold Chen", days: ["okay", null, "great", "okay", "okay", null, "okay"], trending: "Trending", trendEmoji: "😐" },
  { name: "Dorothy Wilson", days: ["bad", null, "bad", "okay", "bad", null, "bad"], trending: "Trending", trendEmoji: "😔" },
];

type DayStatus = "checked" | "missed" | "none";

const seniorSummaries: {
  name: string; age: number; initials: string; streak: number; weekRate: number;
  days: DayStatus[]; avgResponseTime: string; avgMoodScore: string;
}[] = [
  { name: "Margaret Ross", age: 78, initials: "MR", streak: 47, weekRate: 95, days: ["checked", "checked", "checked", "checked", "checked", "checked", "none"], avgResponseTime: "2 min", avgMoodScore: "😊 1.1 avg mood score this week" },
  { name: "Frank Johnson", age: 82, initials: "FJ", streak: 12, weekRate: 86, days: ["checked", "checked", "checked", "checked", "missed", "checked", "checked"], avgResponseTime: "6 min", avgMoodScore: "😊 1.3 avg mood score this week" },
  { name: "Harold Chen", age: 75, initials: "HC", streak: 3, weekRate: 71, days: ["checked", "none", "checked", "checked", "missed", "none", "checked"], avgResponseTime: "11 min", avgMoodScore: "😐 2.0 avg mood score this week" },
  { name: "Dorothy Wilson", age: 75, initials: "DW", streak: 0, weekRate: 43, days: ["checked", "missed", "checked", "missed", "missed", "missed", "missed"], avgResponseTime: "—", avgMoodScore: "😔 2.7 avg mood score this week" },
];

function getWeekLabel(offset: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [attentionDismissed, setAttentionDismissed] = useState(false);
  const seniorRates = getSeniorRates(weekOffset);
  const overallRate = Math.round(seniorRates.reduce((s, r) => s + r.rate, 0) / seniorRates.length);
  const jitter = Math.abs(weekOffset) % 5;
  const totalCheckIns = Math.max(10, 26 - jitter * 3);
  const checkInRate = overallRate;
  const missedCheckIns = Math.max(0, 6 + jitter * 2);

  // Determine if Dorothy needs attention (rate < 50% this week)
  const dorothyRate = seniorRates.find(s => s.name === "Dorothy Wilson")?.rate ?? 0;
  const showAttention = weekOffset === 0 && dorothyRate < 50 && !attentionDismissed;

  const handleSendEmail = async (name: string, email: string) => {
    setSendingEmail(name);
    // Simulate sending email
    await new Promise(r => setTimeout(r, 1200));
    setSendingEmail(null);
    toast({
      title: "Report Emailed",
      description: `Weekly report sent to ${name} (${email}).`,
    });
  };

  const handleMarkSafeFromReport = () => {
    setAttentionDismissed(true);
    // Also sync to sessionStorage for cross-page consistency
    const existing = JSON.parse(sessionStorage.getItem("resolved-alerts") || "[]");
    if (!existing.includes("dorothy-attention")) {
      existing.push("dorothy-attention");
      sessionStorage.setItem("resolved-alerts", JSON.stringify(existing));
    }
    toast({ title: "Dorothy Wilson marked safe", description: "Attention alert dismissed." });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-black">Weekly Reports</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1 shadow-card">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <span className="text-sm font-semibold px-2 whitespace-nowrap">{getWeekLabel(weekOffset)}</span>
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" disabled={weekOffset >= 0}>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toast({ title: "Export Started", description: `Exporting CSV for ${getWeekLabel(weekOffset)}…` })}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Section 1: Stats */}
        <WeeklyStatsRow totalCheckIns={totalCheckIns} checkInRate={checkInRate} rateDelta={4 - jitter} missedCheckIns={missedCheckIns} activeAlerts={weekOffset === 0 && !attentionDismissed ? 1 : 0} />

        {/* Section 2 & 4: Check-in Rates + Mood Trends side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CheckinRatesCard seniors={seniorRates} overallRate={overallRate} lastWeekRate={overallRate - 3} seniorCount={4} />
          <MoodTrendsCard seniors={moodData} />
        </div>

        {/* Section 3: Attention Needed — synced with safe status */}
        {showAttention && (
          <div
            className="rounded-2xl p-5 border shadow-card"
            style={{
              background: "hsl(var(--status-alert) / 0.06)",
              borderColor: "hsl(var(--status-alert) / 0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" style={{ color: "hsl(var(--status-alert))" }} />
              <h3 className="font-black text-base" style={{ color: "hsl(var(--status-alert))" }}>
                Attention Needed
              </h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              Dorothy Wilson checked in only 3 of 7 days this week and reported "Not great" mood 4 times. Consider a wellness call.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="outline" size="sm" className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => navigate("/")}>
                View Dorothy's Profile →
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 font-bold"
                style={{ borderColor: "hsl(var(--status-checked) / 0.4)", color: "hsl(var(--status-checked))" }}
                onClick={handleMarkSafeFromReport}
              >
                ✓ Mark Safe
              </Button>
            </div>
          </div>
        )}

        {/* Section 5: Individual Senior Summaries with Send Email */}
        <div>
          <h3 className="text-lg font-black mb-3">Senior Summaries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {seniorSummaries.map((s) => {
              const sr = seniorRates.find(r => r.name === s.name);
              return (
                <div key={s.name} className="space-y-2">
                  <SeniorSummaryCard {...s} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl font-bold text-xs gap-1.5"
                    disabled={sendingEmail === s.name}
                    onClick={() => handleSendEmail(s.name, sr?.email || "contact@email.com")}
                  >
                    {sendingEmail === s.name ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Send Report to {s.name.split(" ")[0]}</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 6: Weekly Digest Preview */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <h3 className="font-black text-base mb-1">Weekly Email Digest</h3>
          <p className="text-sm text-muted-foreground mb-2">
            A summary like this is automatically emailed to you every Sunday at 8 AM.
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Next digest: Sunday, Mar 1 at 8:00 AM
          </p>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => toast({ title: "Preview Sent", description: "A preview digest email has been sent to your inbox." })}>
            <Mail className="w-4 h-4" /> Send Preview Email
          </Button>
        </div>
      </div>
    </div>
  );
}
