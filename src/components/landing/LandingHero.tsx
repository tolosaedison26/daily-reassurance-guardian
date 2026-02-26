import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface LandingHeroProps {
  onGetStarted: () => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden" style={{ background: "hsl(var(--foreground))" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36 text-center">
        <div className="max-w-[720px] mx-auto">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold mb-8" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
            ✦ Zero App Download Required
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] text-primary-foreground">
            Your parent stays safe.{" "}
            <span className="text-primary">Every single day.</span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl mt-6 max-w-[600px] mx-auto leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            Daily Guardian sends your elderly parent a simple text message each morning.
            If they don't respond, you're automatically notified — before you even have time to worry.
            <span className="block mt-2 font-semibold" style={{ color: "hsl(var(--primary))" }}>No app. No setup for them. Just peace of mind.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Button onClick={onGetStarted} className="h-14 px-8 text-base md:text-lg font-black rounded-2xl shadow-btn" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
              Start Free — Add Your First Senior <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button variant="outline" className="h-14 px-8 text-base font-bold rounded-2xl border-2" style={{ borderColor: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100% / 0.85)", background: "transparent" }} onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              See How It Works ↓
            </Button>
          </div>

          <p className="text-sm mt-6" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
            Free forever for 1 senior. No credit card required.
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: "hsl(220 18% 8%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { value: "0", label: "Apps to download" },
              { value: "10s", label: "Time for seniors to check in" },
              { value: "3", label: "Emergency contacts per senior" },
              { value: "5min", label: "Setup time for caregivers" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-black text-primary">{s.value}</p>
                <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
