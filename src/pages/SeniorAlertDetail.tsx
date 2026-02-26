import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, ShieldCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EscalationLadder from "@/components/EscalationLadder";

// Demo data
const DEMO = {
  name: "Dorothy Wilson",
  age: 75,
  phone: "+1 (555) 987-6543",
  initials: "DW",
  dueTime: "9:00 AM",
  overdueText: "1h 45min",
  lastCheckIn: "Yesterday, Feb 26 at 8:03 AM",
  steps: [
    {
      level: 1,
      contactName: "Sarah Johnson",
      relationship: "Daughter",
      channels: ["sms", "email"] as ("sms" | "email")[],
      status: "active" as const,
      timeSent: "9:45 AM",
      countdownText: "Escalates to Contact #2 in 14 min",
    },
    {
      level: 2,
      contactName: "James Ross",
      relationship: "Son",
      channels: ["sms"] as ("sms" | "email")[],
      status: "pending" as const,
      scheduledTime: "10:15 AM",
    },
    {
      level: 3,
      contactName: "Dr. Patel",
      relationship: "Physician",
      channels: ["email"] as ("sms" | "email")[],
      status: "pending" as const,
      scheduledTime: "10:45 AM",
    },
  ],
  timeline: [
    { time: "9:00 AM", label: "Check-in due (missed)", past: true },
    { time: "9:00 AM", label: "Reminder SMS sent", past: true },
    { time: "9:45 AM", label: "Alert sent to Contact #1", past: true },
    { time: "10:15 AM", label: "Escalate to Contact #2", past: false },
  ],
};

export default function SeniorAlertDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const d = DEMO;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-10">
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground font-bold mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-black leading-tight">Alert: {d.name}</h1>
          <span
            className="px-3 py-1 rounded-full text-xs font-black"
            style={{
              background: "hsl(var(--status-alert) / 0.12)",
              color: "hsl(var(--status-alert))",
            }}
          >
            MISSED CHECK-IN
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {today} · Due {d.dueTime} · Now {d.overdueText} overdue
        </p>
      </div>

      <div className="px-5 space-y-5">
        {/* Two-column on tablet+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Senior Info Card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
                style={{
                  background: "hsl(var(--status-alert) / 0.12)",
                  color: "hsl(var(--status-alert))",
                }}
              >
                {d.initials}
              </div>
              <div>
                <p className="font-black text-xl">{d.name}, {d.age}</p>
                <p className="text-sm text-muted-foreground">{d.phone}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last check-in</span>
                <span className="font-bold">{d.lastCheckIn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Streak</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                >
                  Broken
                </span>
              </div>
            </div>
          </div>

          {/* Escalation Ladder */}
          <EscalationLadder steps={d.steps} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 font-black rounded-xl border-0 text-base"
            style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            I'm Handling This — Stop All Alerts
          </Button>
          <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`} className="block">
            <Button variant="outline" className="w-full h-14 font-black rounded-xl text-base">
              <Phone className="w-5 h-5 mr-2" />
              Call {d.name.split(" ")[0]} Now
            </Button>
          </a>
          <Button variant="ghost" className="w-full h-12 font-black rounded-xl text-base">
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark as Safe
          </Button>
        </div>

        {/* Incident Timeline */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <p className="font-black text-base mb-4">Incident Timeline</p>
          <div className="space-y-0">
            {d.timeline.map((event, i) => (
              <div key={i} className="flex gap-3 relative">
                {i < d.timeline.length - 1 && (
                  <div
                    className="absolute left-[5px] top-[14px] w-0.5 h-full"
                    style={{
                      background: event.past ? "hsl(var(--status-alert) / 0.3)" : "hsl(var(--border))",
                    }}
                  />
                )}
                <div className="shrink-0 mt-1.5 z-10">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: event.past ? "hsl(var(--status-alert))" : "hsl(var(--muted))",
                    }}
                  />
                </div>
                <div className="pb-4 min-w-0">
                  <p className={`text-sm font-bold ${event.past ? "" : "text-muted-foreground"}`}>
                    {event.time}
                  </p>
                  <p className={`text-sm ${event.past ? "" : "text-muted-foreground italic"}`}>
                    {event.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
