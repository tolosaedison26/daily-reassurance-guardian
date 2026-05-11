import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Check, Pill, CheckCircle2, SkipForward } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface LandingHeroProps {
  onGetStarted: () => void;
}

type PhoneView = "checkin" | "meds";

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  const { ref: textRef, isVisible: textVisible } = useInView(0.1);
  const { ref: mockupRef, isVisible: mockupVisible } = useInView(0.1);
  const [view, setView] = useState<PhoneView>("checkin");
  const [paused, setPaused] = useState(false);

  // Demo medication slots
  const [slots, setSlots] = useState([
    { name: "Lisinopril", dosage: "10mg", time: "8:00 AM", status: "pending" as const },
    { name: "Metformin", dosage: "500mg", time: "8:00 AM", status: "pending" as const },
    { name: "Atorvastatin", dosage: "20mg", time: "8:00 PM", status: "pending" as const },
  ]);

  const resetSlots = useCallback(() => {
    setSlots([
      { name: "Lisinopril", dosage: "10mg", time: "8:00 AM", status: "pending" },
      { name: "Metformin", dosage: "500mg", time: "8:00 AM", status: "pending" },
      { name: "Atorvastatin", dosage: "20mg", time: "8:00 PM", status: "pending" },
    ]);
  }, []);

  // Auto-cycle between views
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setView((prev) => {
        const next = prev === "checkin" ? "meds" : "checkin";
        if (next === "meds") resetSlots();
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [paused, resetSlots]);

  const handleViewSwitch = (v: PhoneView) => {
    setView(v);
    if (v === "meds") resetSlots();
    setPaused(true);
    // Resume auto-cycle after 12s of inactivity
    setTimeout(() => setPaused(false), 12000);
  };

  const handleSlotAction = (index: number, action: "taken" | "skipped") => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, status: action } : s)));
    setPaused(true);
    setTimeout(() => setPaused(false), 12000);
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.05)", filter: "blur(80px)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left — Text content */}
          <div
            ref={textRef}
            className={`fade-up text-center md:text-left ${textVisible ? "visible" : ""}`}
          >
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground"
              style={{ letterSpacing: "-0.04em", lineHeight: "1.08" }}
            >
              A daily text{" "}
              <span className="text-primary">that keeps you safe</span>{" "}
              <span className="text-foreground">and on track.</span>
            </h1>

            <p
              className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0"
              style={{ lineHeight: "1.6" }}
            >
              A daily text checks in on you. Reply to say you're okay — if we don't
              hear back, your emergency contacts are gently notified so someone can
              reach out. Plus a morning nudge for your medications.
            </p>
            <p className="mt-2 text-base sm:text-lg font-semibold text-foreground">
              Works on any phone. No app needed.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <Button
                onClick={onGetStarted}
                className="w-full sm:w-auto h-14 px-10 text-base sm:text-lg font-bold rounded-xl cursor-pointer shadow-btn"
                style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-base sm:text-lg font-medium rounded-xl cursor-pointer"
                onClick={() =>
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See How It Works
              </Button>
            </div>

            {/* Trust line */}
            <p className="mt-4 text-sm font-semibold text-primary">
              Free exclusively for{" "}
              <a href="https://www.edwardcreation.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:no-underline">Edward Creation</a>
              {" "}customers
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                2-minute setup
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                Medication tracking included
              </span>
            </div>
          </div>

          {/* Right — Phone mockup with cycling views */}
          <div
            ref={mockupRef}
            className={`fade-up mx-auto md:ml-auto md:mr-0 w-full max-w-xs ${mockupVisible ? "visible" : ""}`}
            style={{ transitionDelay: "150ms" }}
          >
            <div className="bg-card rounded-[2rem] border-2 border-border/60 shadow-soft overflow-hidden">
              {/* Status bar */}
              <div className="px-6 pt-4 pb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{view === "checkin" ? "9:41 AM" : "8:00 AM"}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-2 rounded-sm border border-muted-foreground/50">
                    <div className="w-2 h-full rounded-sm bg-muted-foreground/50" />
                  </div>
                </div>
              </div>

              {/* View tabs */}
              <div className="px-4 pb-1 flex gap-1">
                <button
                  onClick={() => handleViewSwitch("checkin")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: view === "checkin" ? "hsl(var(--primary) / 0.1)" : "transparent",
                    color: view === "checkin" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Check-in
                </button>
                <button
                  onClick={() => handleViewSwitch("meds")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: view === "meds" ? "hsl(200 70% 45% / 0.1)" : "transparent",
                    color: view === "meds" ? "hsl(200 70% 45%)" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Pill className="w-3.5 h-3.5" />
                  Medications
                </button>
              </div>

              <div className="border-t border-border/40">
                {/* ===== CHECK-IN VIEW ===== */}
                {view === "checkin" && (
                  <div className="px-4 py-5 space-y-3 min-h-[220px] animate-slide-up" style={{ animationDuration: "0.3s" }}>
                    <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%]">
                      <p className="text-sm text-foreground leading-relaxed">
                        Good morning, Margaret! Time for your daily check-in. How are you feeling?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Reply: YES (Great) / OK (Okay) / NO (Unwell)
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <div
                        className="rounded-2xl rounded-tr-md px-4 py-2.5"
                        style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
                      >
                        <p className="text-sm font-semibold">YES</p>
                      </div>
                    </div>

                    <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%]">
                      <p className="text-sm text-foreground leading-relaxed flex items-start gap-1.5">
                        <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-checked))" }} />
                        <span>Glad you're doing great, Margaret! You're checked in for today.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ===== MEDICATIONS VIEW ===== */}
                {view === "meds" && (
                  <div className="min-h-[220px] animate-slide-up" style={{ animationDuration: "0.3s" }}>
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Today's Schedule
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {slots.filter((s) => s.status === "taken").length} of {slots.length} taken
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mx-4 mb-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${(slots.filter((s) => s.status !== "pending").length / slots.length) * 100}%`,
                            background: slots.every((s) => s.status !== "pending")
                              ? "hsl(var(--status-checked))"
                              : "hsl(200 70% 45%)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-border/60">
                      {slots.map((slot, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 px-4 py-3 transition-colors duration-300"
                          style={{
                            background:
                              slot.status === "taken"
                                ? "hsl(var(--status-checked) / 0.04)"
                                : slot.status === "skipped"
                                ? "hsl(var(--muted) / 0.3)"
                                : "transparent",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background:
                                i === 0 ? "hsl(200 70% 50%)" : i === 1 ? "hsl(142 60% 40%)" : "hsl(270 50% 55%)",
                            }}
                          />
                          <span className="text-xs font-bold text-foreground w-[58px] shrink-0">{slot.time}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-foreground">{slot.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">{slot.dosage}</span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            {slot.status === "taken" ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 animate-bounce-in">
                                <CheckCircle2 className="w-3 h-3" /> Taken
                              </span>
                            ) : slot.status === "skipped" ? (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground animate-bounce-in">
                                <SkipForward className="w-3 h-3" /> Skipped
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSlotAction(i, "taken")}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white transition-all hover:opacity-90 active:scale-95"
                                  style={{ background: "hsl(var(--status-checked))" }}
                                >
                                  Take
                                </button>
                                <button
                                  onClick={() => handleSlotAction(i, "skipped")}
                                  className="text-[10px] font-bold px-2 py-1 rounded-full text-muted-foreground hover:bg-muted transition-all active:scale-95"
                                >
                                  Skip
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {slots.every((s) => s.status !== "pending") && (
                      <div
                        className="px-4 py-3 text-center animate-bounce-in"
                        style={{ background: "hsl(var(--status-checked) / 0.06)" }}
                      >
                        <p className="text-xs font-bold" style={{ color: "hsl(var(--status-checked))" }}>
                          All done for today
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dot indicators */}
              <div className="flex items-center justify-center gap-2 py-3">
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: view === "checkin" ? "hsl(var(--primary))" : "hsl(var(--border))",
                    transform: view === "checkin" ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: view === "meds" ? "hsl(200 70% 45%)" : "hsl(var(--border))",
                    transform: view === "meds" ? "scale(1.3)" : "scale(1)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
