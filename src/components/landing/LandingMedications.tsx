import { useState, useCallback } from "react";
import { CheckCircle2, SkipForward, RotateCcw, MessageSquare, Clock, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface DemoSlot {
  time: string;
  name: string;
  dosage: string;
  color: string;
  status: "pending" | "taken" | "skipped";
}

const INITIAL_SLOTS: DemoSlot[] = [
  { time: "8:00 AM", name: "Lisinopril", dosage: "10mg", color: "bg-blue-500", status: "pending" },
  { time: "8:00 AM", name: "Metformin", dosage: "500mg", color: "bg-emerald-500", status: "pending" },
  { time: "1:00 PM", name: "Metformin", dosage: "500mg", color: "bg-emerald-500", status: "pending" },
  { time: "8:00 PM", name: "Atorvastatin", dosage: "20mg", color: "bg-purple-500", status: "pending" },
];

export default function LandingMedications() {
  const { ref, isVisible } = useInView(0.08);
  const [slots, setSlots] = useState<DemoSlot[]>(INITIAL_SLOTS);

  const takenCount = slots.filter((s) => s.status === "taken").length;
  const doneCount = slots.filter((s) => s.status !== "pending").length;
  const allDone = doneCount === slots.length;

  const handleAction = useCallback((index: number, action: "taken" | "skipped") => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, status: action } : s)));
  }, []);

  const handleReset = useCallback(() => {
    setSlots(INITIAL_SLOTS);
  }, []);

  const progressPct = (doneCount / slots.length) * 100;

  return (
    <section
      className="py-16 sm:py-20 md:py-24 relative overflow-hidden"
      style={{ background: "hsl(var(--section-meds))" }}
    >
      <div
        className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: "hsl(200 70% 50% / 0.06)", filter: "blur(60px)" }}
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}
          >
            Pill reminders, built right in.
          </h2>

          <p
            className="mt-4 text-base sm:text-lg text-muted-foreground mx-auto max-w-xl"
            style={{ lineHeight: "1.7" }}
          >
            Every account includes medication tracking and a daily SMS reminder — no extra cost, no separate app.
            Add your medications, and each morning we text you to check your schedule.
          </p>
        </div>

        {/* Interactive demo */}
        <div
          className={`fade-up mt-10 sm:mt-12 mx-auto max-w-md ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "150ms" }}
        >
          <div
            className="bg-card rounded-2xl border border-border/60 overflow-hidden"
            style={{ boxShadow: "0 8px 32px -8px hsl(220 30% 20% / 0.12)" }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Today's Schedule
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {allDone ? "All done for today" : `${takenCount} of ${slots.length} taken`}
                </p>
              </div>
              {doneCount > 0 && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
                  aria-label="Reset demo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            <div className="mx-5 mb-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: allDone
                      ? "hsl(var(--status-checked))"
                      : "hsl(200 70% 45%)",
                  }}
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 min-h-[56px] transition-colors duration-300"
                  style={{
                    background: slot.status === "taken"
                      ? "hsl(var(--status-checked) / 0.04)"
                      : slot.status === "skipped"
                      ? "hsl(var(--muted) / 0.3)"
                      : "transparent",
                  }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${slot.color}`} />
                  <span className="text-sm font-bold text-foreground w-[72px] shrink-0">
                    {slot.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{slot.name}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">{slot.dosage}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {slot.status === "taken" ? (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 animate-bounce-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                      </span>
                    ) : slot.status === "skipped" ? (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-muted text-muted-foreground animate-bounce-in">
                        <SkipForward className="w-3.5 h-3.5" /> Skipped
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(i, "taken")}
                          className="text-xs font-bold px-3 py-1.5 rounded-full text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: "hsl(var(--status-checked))" }}
                        >
                          Take
                        </button>
                        <button
                          onClick={() => handleAction(i, "skipped")}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-full text-muted-foreground hover:bg-muted transition-all active:scale-95"
                        >
                          Skip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {allDone && (
              <div
                className="px-5 py-4 text-center animate-bounce-in"
                style={{ background: "hsl(var(--status-checked) / 0.06)" }}
              >
                <p className="text-sm font-bold" style={{ color: "hsl(var(--status-checked))" }}>
                  All medications tracked for today
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Try it — tap the buttons above
          </p>
        </div>

        {/* Feature cards */}
        <div
          className={`fade-up mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "300ms" }}
        >
          {/* SMS reminders */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(200 70% 45% / 0.1)" }}
            >
              <MessageSquare className="w-5 h-5" style={{ color: "hsl(200 70% 45%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Daily morning reminder</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.5" }}>
                Every morning, we send you one text to check your medication schedule for the day.
              </p>
            </div>
          </div>

          {/* Quick setup */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.1)" }}
            >
              <Zap className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Ready in seconds</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.5" }}>
                Pick from common presets like blood pressure or diabetes meds, or add your own.
              </p>
            </div>
          </div>

          {/* Flexible schedules */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--status-checked) / 0.1)" }}
            >
              <Clock className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Fits your routine</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.5" }}>
                Once daily, twice, three times, weekly, or as needed — set it once and forget.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
