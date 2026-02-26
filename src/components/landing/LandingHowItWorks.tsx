import { Settings, MessageSquare, Bell } from "lucide-react";

const steps = [
  {
    num: 1,
    icon: Settings,
    title: "You set it up (once)",
    desc: "Enter your senior's name, phone number, and check-in time. Add up to 3 emergency contacts in priority order. Takes 5 minutes.",
  },
  {
    num: 2,
    icon: MessageSquare,
    title: "They get a daily text",
    desc: "Each morning at their chosen time, Daily Guardian texts your parent: \"Good morning, Margaret! Reply OK or tap your link to confirm you're safe.\"",
  },
  {
    num: 3,
    icon: Bell,
    title: "You're notified if anything's wrong",
    desc: "If they don't respond, their contacts are alerted automatically — in order. Contact 1 first. Then Contact 2. Then Contact 3. Stops when someone responds.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">How It Works</h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">Three steps. Five minutes. Done forever.</p>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-8 lg:gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex-1 flex flex-col items-center text-center relative">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+36px)] w-[calc(100%-72px)] h-0.5 border-t-2 border-dashed border-border" />
              )}

              {/* Step number badge */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                  <step.icon className="w-9 h-9 text-primary" />
                </div>
                <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                  {step.num}
                </span>
              </div>

              <h3 className="text-lg font-black text-foreground mb-2">{step.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed max-w-[280px]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
