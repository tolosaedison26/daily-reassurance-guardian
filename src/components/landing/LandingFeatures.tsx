import { SmartphoneNfc, GitBranch, Heart, Pill, Bell, Shield } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const iconColors = [
  { bg: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" },
  { bg: "hsl(142 60% 40% / 0.1)", color: "hsl(142 60% 40%)" },
  { bg: "hsl(200 70% 45% / 0.1)", color: "hsl(200 70% 45%)" },
];

const features = [
  {
    icon: SmartphoneNfc,
    title: "SMS Check-Ins",
    desc: "Every day at your chosen time, we send a simple text. Just reply to confirm you're safe. Works on any phone — no app needed.",
    ci: 0,
  },
  {
    icon: Shield,
    title: "Emergency Contacts",
    desc: "Add up to 3 emergency contacts. If you miss a check-in, they're notified automatically so someone can check on you.",
    ci: 1,
  },
  {
    icon: GitBranch,
    title: "Smart Escalation",
    desc: "Alerts go to Contact 1 first. If no response, Contact 2 is notified. Then Contact 3. Stops when someone acknowledges.",
    ci: 2,
  },
  {
    icon: Heart,
    title: "Mood Tracking",
    desc: "Share how you're feeling each day — Great, Okay, or Not Great. Your mood is tracked with each check-in so you can see patterns over time.",
    ci: 0,
  },
  {
    icon: Pill,
    title: "Medication Tracking",
    desc: "Add your daily medications, set dose times, and track each one with a tap. Get a daily morning SMS reminder to check your schedule.",
    ci: 1,
  },
  {
    icon: Bell,
    title: "Weekly Summaries",
    desc: "Your emergency contacts receive a weekly SMS with your check-in summary. Keeps everyone in the loop without daily notifications.",
    ci: 2,
  },
];

export default function LandingFeatures() {
  const { ref, isVisible } = useInView(0.05);

  return (
    <section
      id="features"
      className="py-20 sm:py-24 md:py-32 bg-section-alt"
    >
      <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Everything you need
          </h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground" style={{ lineHeight: "1.6" }}>
            Simple daily safety check-ins. Nothing more, nothing less.
          </p>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => {
            const colors = iconColors[f.ci];
            return (
              <div
                key={f.title}
                className={`fade-up bg-card border border-border/60 rounded-xl p-5 sm:p-6 transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 ${isVisible ? "visible" : ""}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: colors.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: colors.color }} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-base text-muted-foreground" style={{ lineHeight: "1.7" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
