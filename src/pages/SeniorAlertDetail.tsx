import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, ShieldCheck, CheckCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EscalationLadder from "@/components/EscalationLadder";

const DEMO = {
  name: "Dorothy Wilson", age: 75, phone: "+1 (555) 987-6543", initials: "DW",
  dueTime: "9:00 AM", overdueText: "1h 45min", lastCheckIn: "Yesterday, Feb 26 at 8:03 AM",
  steps: [
    { level: 1, contactName: "Sarah Johnson", relationship: "Daughter", channels: ["sms", "email"] as ("sms" | "email")[], status: "active" as const, timeSent: "9:45 AM", countdownText: "Escalates to Contact #2 in 14 min" },
    { level: 2, contactName: "James Ross", relationship: "Son", channels: ["sms"] as ("sms" | "email")[], status: "pending" as const, scheduledTime: "10:15 AM" },
    { level: 3, contactName: "Dr. Patel", relationship: "Physician", channels: ["email"] as ("sms" | "email")[], status: "pending" as const, scheduledTime: "10:45 AM" },
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
  const [resolved, setResolvedLocal] = useState<null | "handling" | "safe">(() => {
    const stored = sessionStorage.getItem(`alert-resolved-${id}`);
    return stored as null | "handling" | "safe";
  });

  const setResolved = (value: "handling" | "safe") => {
    setResolvedLocal(value);
    sessionStorage.setItem(`alert-resolved-${id}`, value);
    const existing = JSON.parse(sessionStorage.getItem("resolved-alerts") || "[]");
    if (!existing.includes(id)) { existing.push(id); sessionStorage.setItem("resolved-alerts", JSON.stringify(existing)); }
  };
  const resolvedTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground font-bold">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </button>

      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-black leading-tight">Alert: {d.name}</h1>
          <span className="px-3 py-1 rounded-full text-xs font-black" style={{
            background: resolved ? "hsl(var(--status-checked) / 0.12)" : "hsl(var(--status-alert) / 0.12)",
            color: resolved ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))",
          }}>
            {resolved ? (resolved === "safe" ? "MARKED SAFE" : "HANDLING") : "MISSED CHECK-IN"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {resolved ? `${today} · Resolved at ${resolvedTime}` : `${today} · Due ${d.dueTime} · Now ${d.overdueText} overdue`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0" style={{
              background: resolved ? "hsl(var(--status-checked) / 0.12)" : "hsl(var(--status-alert) / 0.12)",
              color: resolved ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))",
            }}>{d.initials}</div>
            <div>
              <p className="font-black text-xl">{d.name}, {d.age}</p>
              <p className="text-sm text-muted-foreground">{d.phone}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Last check-in</span><span className="font-bold">{d.lastCheckIn}</span></div>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={resolved ? { background: "hsl(var(--status-checked) / 0.12)", color: "hsl(var(--status-checked))" } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                {resolved ? "Safe" : "Missed"}
              </span>
            </div>
          </div>
        </div>
        <EscalationLadder steps={resolved ? d.steps.map(s => ({ ...s, status: "stopped" as const })) : d.steps} />
      </div>

      {resolved ? (
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(var(--status-checked) / 0.12)", animation: "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
            {resolved === "handling" ? <ShieldCheck className="w-8 h-8" style={{ color: "hsl(var(--status-checked))" }} /> : <CheckCircle className="w-8 h-8" style={{ color: "hsl(var(--status-checked))" }} />}
          </div>
          <h2 className="text-xl font-black">{resolved === "handling" ? "You're Handling This" : "Marked as Safe"}</h2>
          <p className="text-sm text-muted-foreground">{resolved === "handling" ? `All automated alerts stopped. Logged ${resolvedTime}.` : `${d.name} marked safe. Logged ${resolvedTime}.`}</p>
          <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`} className="block">
            <Button variant="outline" className="w-full h-14 font-black rounded-xl text-base"><Phone className="w-5 h-5 mr-2" />Call {d.name.split(" ")[0]} Now</Button>
          </a>
          <Button variant="ghost" className="w-full font-black rounded-xl" onClick={() => navigate("/dashboard")}>← Back to Dashboard</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button className="w-full h-14 font-black rounded-xl border-0 text-base" style={{ background: "hsl(var(--status-checked))", color: "#fff" }} onClick={() => setResolved("handling")}>
            <ShieldCheck className="w-5 h-5 mr-2" />I'm Handling This — Stop All Alerts
          </Button>
          <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`} className="block">
            <Button variant="outline" className="w-full h-14 font-black rounded-xl text-base"><Phone className="w-5 h-5 mr-2" />Call {d.name.split(" ")[0]} Now</Button>
          </a>
          <Button variant="ghost" className="w-full h-12 font-black rounded-xl text-base" onClick={() => setResolved("safe")}>
            <CheckCircle className="w-5 h-5 mr-2" />Mark as Safe
          </Button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <p className="font-black text-base mb-4">Incident Timeline</p>
        <div className="space-y-0">
          {(resolved
            ? [...d.timeline.map(e => ({ ...e, past: true, resolved: false })), { time: resolvedTime, label: resolved === "safe" ? "Marked as Safe — alerts stopped" : "Caregiver handling — alerts stopped", past: true, resolved: true }]
            : d.timeline.map(e => ({ ...e, resolved: false }))
          ).map((event, i, arr) => (
            <div key={i} className="flex gap-3 relative">
              {i < arr.length - 1 && (
                <div className="absolute left-[5px] top-[14px] w-0.5 h-full" style={{
                  background: event.past ? (event.resolved ? "hsl(var(--status-checked) / 0.3)" : "hsl(var(--status-alert) / 0.3)") : "hsl(var(--border))",
                }} />
              )}
              <div className="shrink-0 mt-1.5 z-10">
                <div className="w-3 h-3 rounded-full" style={{ background: event.resolved ? "hsl(var(--status-checked))" : event.past ? "hsl(var(--status-alert))" : "hsl(var(--muted))" }} />
              </div>
              <div className="pb-4 min-w-0">
                <p className={`text-sm font-bold ${event.past ? "" : "text-muted-foreground"}`}>{event.time}</p>
                <p className={`text-sm ${event.resolved ? "font-black" : event.past ? "" : "text-muted-foreground italic"}`} style={event.resolved ? { color: "hsl(var(--status-checked))" } : undefined}>{event.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
