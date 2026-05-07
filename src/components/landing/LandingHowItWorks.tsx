import { UserPlus, MessageSquare, Bell } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    num: 1,
    icon: UserPlus,
    title: "Create your account",
    desc: "Sign up with your name, phone, and email. Add emergency contacts, set your check-in time, and add your medications — all during onboarding.",
    color: "hsl(var(--primary))",
  },
  {
    num: 2,
    icon: MessageSquare,
    title: "Get your daily text",
    desc: "Each morning, you get a medication reminder. At your chosen time, a check-in text asks how you're feeling. Reply YES, OK, or NO — all three count as a check-in.",
    color: "hsl(var(--status-checked))",
  },
  {
    num: 3,
    icon: Bell,
    title: "Contacts stay informed",
    desc: "If you don't respond within the grace period, your emergency contacts are alerted automatically in order.",
    color: "hsl(200 70% 45%)",
  },
];

export default function LandingHowItWorks() {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section id="how-it-works" className="py-20 sm:py-24 md:py-32">
      <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            How It Works
          </h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground" style={{ lineHeight: "1.6" }}>
            Three steps. Two minutes. Peace of mind.
          </p>
        </div>

        <div className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`fade-up relative text-center p-6 sm:p-8 rounded-xl border border-border/60 bg-card transition-shadow duration-200 hover:shadow-card ${isVisible ? "visible" : ""}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Number badge on icon */}
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${step.color}10` }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                </div>
                <span
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-sm"
                  style={{ background: step.color }}
                >
                  {step.num}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-base text-muted-foreground" style={{ lineHeight: "1.7" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
