import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface LandingPricingProps {
  onGetStarted: () => void;
}

const features = [
  "Daily SMS check-ins",
  "Medication tracking & daily reminders",
  "Up to 3 emergency contacts",
  "Smart escalation alerts",
  "Mood tracking & weekly reports",
  "Brain games — Word Scramble & Memory Match",
  "Calming sounds & nature ambiance",
];

export default function LandingPricing({ onGetStarted }: LandingPricingProps) {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="pricing" className="py-20 sm:py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Free for Edward Creation Customers
          </h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            As an{" "}
            <a href="https://www.edwardcreation.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2 hover:no-underline">Edward Creation</a>
            {" "}customer, you get full access at no cost. No credit card required.
          </p>
        </div>

        <div
          className={`fade-up mt-12 sm:mt-16 max-w-lg mx-auto ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "120ms" }}
        >
          <div className="rounded-xl overflow-hidden border border-border/60 shadow-card">
            {/* Warm accent strip */}
            <div className="h-1.5" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--status-checked)))" }} />

            {/* Price header */}
            <div className="p-6 sm:p-8 text-center">
              <p className="text-sm font-semibold text-primary">Edward Creation Exclusive</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground line-through">$15/mo</span>
                <span className="text-5xl font-black text-foreground">Free</span>
              </div>
              <p className="mt-1 text-base text-muted-foreground">Free with your Edward Creation order number</p>
            </div>

            <hr className="border-border/60 mx-6 sm:mx-8 border-dashed" />

            {/* Feature list */}
            <div className="p-6 sm:p-8">
              <ul className="space-y-4">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base sm:text-lg text-foreground">
                    <Check className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <Button
                onClick={onGetStarted}
                className="w-full h-14 text-base font-bold rounded-lg cursor-pointer shadow-btn"
                style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                Get Free Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="mt-3 text-sm text-center text-muted-foreground">
                No credit card required — just your order number
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
