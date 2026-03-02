import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

interface LandingPricingProps {
  onGetStarted: () => void;
}

const features = [
  "Up to 3 seniors monitored",
  "Daily SMS check-ins",
  "Emergency contact alerts",
  "Mood tracking & weekly reports",
  "Founding user benefits locked in",
];

export default function LandingPricing({ onGetStarted }: LandingPricingProps) {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">Simple Pricing — Free to Get Started</h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">No credit card required. No hidden fees. Just peace of mind.</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-2xl p-6 md:p-8 border border-primary shadow-lg ring-2 ring-primary/20 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
              🎉 Early Access
            </span>

            <h3 className="text-lg font-black text-foreground mt-2">FREE</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Free during our launch period</p>

            <ul className="space-y-3 flex-1">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={onGetStarted}
              className="w-full mt-6 h-12 font-black rounded-xl text-base border-0"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Get Free Access <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">Founding users get early access benefits forever</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Join families already using Daily Guardian — free during early launch.
        </p>
      </div>
    </section>
  );
}
