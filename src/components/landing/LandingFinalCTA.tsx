import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Heart } from "lucide-react";

interface LandingFinalCTAProps {
  onGetStarted: () => void;
}

export default function LandingFinalCTA({ onGetStarted }: LandingFinalCTAProps) {
  return (
    <section className="py-20 md:py-28" style={{ background: "hsl(var(--foreground))" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-primary-foreground">
          Start protecting the people you love.{" "}
          <span className="text-primary">Today.</span>
        </h2>
        <p className="text-base md:text-lg mt-4 max-w-md mx-auto" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Takes 5 minutes. Free forever for one senior.
        </p>

        <Button onClick={onGetStarted} className="mt-8 h-14 px-10 text-base md:text-lg font-black rounded-2xl shadow-btn" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
          Create Your Free Account <ArrowRight className="w-5 h-5 ml-1" />
        </Button>

        <p className="text-sm mt-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          No credit card required · Cancel anytime · Free plan available forever
        </p>

        <div className="flex items-center justify-center gap-8 mt-10">
          {[
            { icon: Shield, label: "Secure" },
            { icon: Lock, label: "Private" },
            { icon: Heart, label: "Reliable" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <t.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
