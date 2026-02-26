import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Users, Shield, BarChart2 } from "lucide-react";

interface LandingOrganizationsProps {
  onGetStarted: () => void;
}

const features = [
  "Manage unlimited seniors from one screen",
  "Multiple staff logins with role-based access",
  "Automated escalation — no staff needed to monitor",
  "Weekly compliance reports for auditing",
  "White-label with your organization's branding",
];

export default function LandingOrganizations({ onGetStarted }: LandingOrganizationsProps) {
  return (
    <section id="organizations" className="py-16 md:py-24 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Left text */}
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">
              Built for care teams too
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mt-4 leading-relaxed">
              Senior living communities, home care agencies, churches, and nonprofits use Daily Guardian to replace daily manual welfare checks — at a fraction of the cost.
            </p>

            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-base text-foreground">
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                  {f}
                </li>
              ))}
            </ul>

            <Button onClick={onGetStarted} className="mt-8 h-12 px-8 font-black rounded-xl text-base" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
              Talk to Our Team <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Right illustration placeholder */}
          <div className="flex-1 hidden lg:block">
            <div className="bg-card rounded-2xl border border-border shadow-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-primary" />
                <span className="font-black text-foreground">Organization Dashboard</span>
              </div>
              <div className="space-y-3">
                {["Margaret W.", "Harold P.", "Ruth S.", "James B."].map((name, i) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      i < 3 ? "bg-[hsl(var(--status-checked)/0.12)] text-[hsl(var(--status-checked))]" : "bg-[hsl(var(--status-pending)/0.12)] text-[hsl(var(--status-pending))]"
                    }`}>
                      {i < 3 ? "✓ Safe" : "⏳ Pending"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
                <BarChart2 className="w-4 h-4" />
                <span>Weekly report: 96% check-in rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
