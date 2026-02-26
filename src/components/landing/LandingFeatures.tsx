import { SmartphoneNfc, GitBranch, LayoutDashboard, Heart, Clock, BarChart2 } from "lucide-react";

const features = [
  {
    icon: SmartphoneNfc,
    title: "No App Required",
    desc: "Seniors reply to a text or tap one link. Works on any phone — even basic cell phones. No smartphone skills needed.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.12)",
  },
  {
    icon: GitBranch,
    title: "Smart Escalation Ladder",
    desc: "Alerts go to Contact 1 first. If they don't respond in 30 minutes, Contact 2 is notified. Then Contact 3. Stops when someone acknowledges.",
    color: "hsl(var(--status-checked))",
    bg: "hsl(var(--status-checked) / 0.12)",
  },
  {
    icon: LayoutDashboard,
    title: "Caregiver Dashboard",
    desc: "See all your seniors' check-in status in real time. One screen. Perfect for families managing multiple parents or care organizations.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.12)",
  },
  {
    icon: Heart,
    title: "Wellness Mood Tracking",
    desc: "After check-in, seniors can share how they're feeling (Great / Okay / Not great). Weekly trends help you spot problems before they become emergencies.",
    color: "hsl(var(--status-alert))",
    bg: "hsl(var(--status-alert) / 0.12)",
  },
  {
    icon: Clock,
    title: "Adaptive Timing",
    desc: "Daily Guardian learns when your senior naturally responds and suggests the optimal check-in window — reducing false alarms and caregiver fatigue.",
    color: "hsl(var(--status-pending))",
    bg: "hsl(var(--status-pending) / 0.12)",
  },
  {
    icon: BarChart2,
    title: "Weekly Digest Reports",
    desc: "Every Sunday, get a summary of check-in rates, mood trends, streaks, and any seniors who need attention. Automatically. No work required.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.12)",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">Built different</h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">Everything you need for daily senior safety — and nothing you don't.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                <f.icon className="w-7 h-7" style={{ color: f.color }} />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">{f.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
