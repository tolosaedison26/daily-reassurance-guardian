import { Shield, Mail, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-lg font-black tracking-tight text-primary">Daily Guardian</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-foreground">Contact Us</h1>
          <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
            Have a question, feedback, or need help? We'd love to hear from you.
          </p>
        </div>

        {/* Email card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Mail className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="font-bold text-base">Email Us</p>
              <a
                href="mailto:support@daily-guardian.com"
                className="text-primary font-semibold text-sm hover:underline underline-offset-4"
              >
                support@daily-guardian.com
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We typically respond within 24 hours. For urgent safety concerns, please contact your local emergency services.
          </p>
        </div>

        {/* Phone card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-checked) / 0.1)" }}>
              <Phone className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
            </div>
            <div>
              <p className="font-bold text-base">Call or Text</p>
              <a
                href="tel:+17432107677"
                className="text-primary font-semibold text-sm hover:underline underline-offset-4"
              >
                +1 (743) 210-7677
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is also the number your daily check-in texts come from.
          </p>
        </div>

        {/* FAQ link */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card text-center">
          <h3 className="font-bold text-base mb-2">Looking for answers?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check our frequently asked questions on the home page.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }}
            className="rounded-xl font-bold cursor-pointer"
          >
            View FAQ
          </Button>
        </div>
      </div>
    </div>
  );
}
