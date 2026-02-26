import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

interface LandingPricingProps {
  onGetStarted: () => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    sub: "Forever free",
    badge: null,
    features: [
      { text: "1 senior", included: true },
      { text: "Daily SMS check-in", included: true },
      { text: "Up to 3 emergency contacts", included: true },
      { text: "Escalation alerts", included: true },
      { text: "Check-in history", included: true },
      { text: "Wellness mood tracking", included: false },
      { text: "Weekly digest report", included: false },
      { text: "Multiple caregivers", included: false },
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    sub: "Billed monthly",
    badge: "Most Popular",
    features: [
      { text: "Up to 5 seniors", included: true },
      { text: "Everything in Free", included: true },
      { text: "Wellness mood tracking", included: true },
      { text: "Weekly digest reports", included: true },
      { text: "Adaptive timing suggestions", included: true },
      { text: "Check-in history export", included: true },
      { text: "Unlimited seniors", included: false },
      { text: "Team access", included: false },
    ],
    cta: "Start Pro Free Trial",
    ctaVariant: "default" as const,
    note: "14-day free trial. Cancel anytime.",
    highlight: true,
  },
  {
    name: "Organization",
    price: "$49",
    sub: "Billed monthly",
    badge: null,
    features: [
      { text: "Unlimited seniors", included: true },
      { text: "Everything in Pro", included: true },
      { text: "Multiple caregiver logins", included: true },
      { text: "Team management", included: true },
      { text: "White-label option", included: true },
      { text: "Priority support", included: true },
      { text: "Onboarding assistance", included: true },
    ],
    cta: "Contact Us",
    ctaVariant: "outline" as const,
    highlight: false,
  },
];

export default function LandingPricing({ onGetStarted }: LandingPricingProps) {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">Simple, honest pricing</h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">Start free. Upgrade when you're ready.</p>
        </div>

        {/* On mobile show Pro first */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`bg-card rounded-2xl p-6 md:p-8 border flex flex-col relative ${
                p.highlight
                  ? "border-primary shadow-lg ring-2 ring-primary/20 order-first md:order-none"
                  : "border-border shadow-card"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black bg-primary text-primary-foreground">
                  {p.badge}
                </span>
              )}

              <h3 className="text-lg font-black text-foreground">{p.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-4xl font-black text-foreground">{p.price}</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{p.sub}</p>

              <ul className="space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                    {f.included ? (
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                    ) : (
                      <X className="w-4 h-4 shrink-0 text-muted-foreground/40" />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              <Button
                onClick={onGetStarted}
                variant={p.ctaVariant}
                className={`w-full mt-6 h-12 font-black rounded-xl text-base ${
                  p.highlight ? "border-0" : ""
                }`}
                style={p.highlight ? { background: "hsl(var(--status-checked))", color: "#fff" } : undefined}
              >
                {p.cta}
              </Button>
              {p.note && <p className="text-xs text-center text-muted-foreground mt-2">{p.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
