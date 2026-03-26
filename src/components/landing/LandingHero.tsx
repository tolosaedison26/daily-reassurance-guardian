import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Check } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface LandingHeroProps {
  onGetStarted: () => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  const { ref: textRef, isVisible: textVisible } = useInView(0.1);
  const { ref: mockupRef, isVisible: mockupVisible } = useInView(0.1);

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Warm glow — single color, not AI gradient blob */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.05)", filter: "blur(80px)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 lg:py-36">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
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
              <span className="text-primary">that keeps you safe.</span>
            </h1>

            <p
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0"
              style={{ lineHeight: "1.6" }}
            >
              Every day you get a simple text message. Reply to confirm you're okay.
              If you don't respond, your emergency contacts are notified automatically.
            </p>
            <p className="mt-3 text-base sm:text-lg font-semibold text-foreground">
              Once set up, works on any phone. No app needed.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
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
            <div className="mt-6 flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                2-minute setup
              </span>
            </div>
          </div>

          {/* Right — SMS phone mockup */}
          <div
            ref={mockupRef}
            className={`fade-up mx-auto md:ml-auto md:mr-0 w-full max-w-xs ${mockupVisible ? "visible" : ""}`}
            style={{ transitionDelay: "150ms" }}
          >
            <div className="bg-card rounded-[2rem] border-2 border-border/60 shadow-soft overflow-hidden">
              {/* Status bar */}
              <div className="px-6 pt-4 pb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-2 rounded-sm border border-muted-foreground/50">
                    <div className="w-2 h-full rounded-sm bg-muted-foreground/50" />
                  </div>
                </div>
              </div>

              {/* Chat header */}
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}
                >
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground block leading-tight">Daily Guardian</span>
                  <span className="text-xs text-muted-foreground">SMS</span>
                </div>
              </div>

              {/* Messages */}
              <div className="px-4 py-5 space-y-3 min-h-[200px]">
                {/* Incoming */}
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%]">
                  <p className="text-sm text-foreground leading-relaxed">
                    Good morning, Margaret! Time for your daily check-in. How are you feeling?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Reply: YES (Great) / OK (Okay) / NO (Unwell)
                  </p>
                </div>

                {/* Outgoing */}
                <div className="flex justify-end">
                  <div
                    className="rounded-2xl rounded-tr-md px-4 py-2.5"
                    style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
                  >
                    <p className="text-sm font-semibold">YES</p>
                  </div>
                </div>

                {/* Confirmation */}
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%]">
                  <p className="text-sm text-foreground leading-relaxed flex items-start gap-1.5">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-checked))" }} />
                    <span>Glad you're doing great, Margaret! You're checked in for today.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
