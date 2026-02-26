import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, Clock, Users, Heart, Bell, ArrowRight, Menu, X, Star } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☀️</span>
            <span className="text-lg font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
              Daily Guardian
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#organizations" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">For Organizations</a>
          </div>

          <div className="hidden md:block">
            <Button
              onClick={onGetStarted}
              className="h-11 px-6 font-black rounded-xl border-0 text-sm"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Get Started Free
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3 animate-slide-up">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-base font-semibold text-foreground py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-base font-semibold text-foreground py-2">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-base font-semibold text-foreground py-2">Pricing</a>
            <a href="#organizations" onClick={() => setMobileMenuOpen(false)} className="block text-base font-semibold text-foreground py-2">For Organizations</a>
            <Button
              onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
              className="w-full h-12 font-black rounded-xl border-0 text-base mt-2"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Get Started Free
            </Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 text-center">
          <div className="max-w-[680px] mx-auto">
            <span className="text-6xl md:text-7xl mb-6 block">☀️</span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight text-foreground">
              Peace of mind,{" "}
              <span style={{ color: "hsl(var(--primary))" }}>one tap</span>{" "}
              at a time
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mt-4 md:mt-6 max-w-[560px] mx-auto leading-relaxed">
              Daily Guardian helps seniors check in with family every day — a simple tap that says "I'm okay." No complicated apps, no learning curve.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 md:mt-10">
              <Button
                onClick={onGetStarted}
                className="h-14 md:h-14 px-8 text-base md:text-lg font-black rounded-2xl border-0 shadow-btn"
                style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                variant="outline"
                className="h-14 md:h-14 px-8 text-base font-bold rounded-2xl"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                See How It Works
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-14 md:mt-20 max-w-4xl mx-auto">
            {[
              { value: "10K+", label: "Daily check-ins" },
              { value: "2,500+", label: "Families connected" },
              { value: "99.9%", label: "Uptime" },
              { value: "< 30s", label: "Avg check-in time" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-black" style={{ color: "hsl(var(--primary))" }}>
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">
              Everything you need for daily safety
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
              Built specifically for seniors and their families — simple, reliable, and caring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <CheckCircle className="w-7 h-7" style={{ color: "hsl(var(--status-checked))" }} />,
                bg: "hsl(var(--status-checked) / 0.12)",
                title: "One-Tap Check-In",
                desc: "Seniors tap a single big button every morning. That's it — no complicated menus or settings.",
              },
              {
                icon: <Bell className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />,
                bg: "hsl(var(--primary) / 0.12)",
                title: "Smart Alerts",
                desc: "If a check-in is missed, family members get notified automatically with escalation steps.",
              },
              {
                icon: <Shield className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />,
                bg: "hsl(var(--primary) / 0.12)",
                title: "Emergency Access",
                desc: "One-tap 911 calling and customizable emergency contacts always within reach.",
              },
              {
                icon: <Users className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />,
                bg: "hsl(var(--primary) / 0.12)",
                title: "Family Dashboard",
                desc: "Caregivers see all their loved ones in one place — who's safe, who's pending, who needs attention.",
              },
              {
                icon: <Heart className="w-7 h-7" style={{ color: "hsl(var(--status-alert))" }} />,
                bg: "hsl(var(--status-alert) / 0.12)",
                title: "Mood Tracking",
                desc: "Simple mood check-ins help families understand trends and spot early signs of concern.",
              },
              {
                icon: <Clock className="w-7 h-7" style={{ color: "hsl(var(--status-pending))" }} />,
                bg: "hsl(var(--status-pending) / 0.12)",
                title: "Flexible Reminders",
                desc: "Customizable reminder times so the check-in fits naturally into their routine.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: feature.bg }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black text-foreground mb-2">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-20" style={{ background: "hsl(var(--secondary))" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">
              Get started in under 2 minutes — no tech skills required.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-0">
            {[
              { step: 1, title: "Create an account", desc: "Sign up as a senior or caregiver. It takes 30 seconds." },
              { step: 2, title: "Connect family", desc: "Share an invite code with your loved ones to link accounts." },
              { step: 3, title: "Daily check-in", desc: "Seniors tap the big green button each morning. That's the whole routine." },
              { step: 4, title: "Stay informed", desc: "Caregivers get real-time updates and alerts if a check-in is missed." },
            ].map((item, i) => (
              <div key={item.step} className="flex-1 flex flex-col items-center text-center relative">
                {/* Connecting line (desktop only) */}
                {i < 3 && (
                  <div
                    className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5"
                    style={{ background: "hsl(var(--border))" }}
                  />
                )}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0 relative z-10"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-black text-foreground mt-4 mb-2">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-[240px]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">
            Free for families
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">
            Daily Guardian is free for individual families. Organization plans available for care facilities.
          </p>
          <div className="mt-10 max-w-sm mx-auto bg-card rounded-2xl p-8 border border-border shadow-card">
            <p className="text-4xl font-black" style={{ color: "hsl(var(--status-checked))" }}>$0</p>
            <p className="text-muted-foreground mt-1">per month, forever</p>
            <ul className="mt-6 space-y-3 text-left">
              {["Unlimited check-ins", "Up to 5 connected seniors", "Push notifications", "Mood tracking", "Emergency contacts"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-base text-foreground">
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={onGetStarted}
              className="w-full h-12 font-black rounded-xl border-0 text-base mt-6"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-12 md:py-16 border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {[
              { icon: <Star className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: "hsl(var(--primary))" }} />, text: "4.9★ App Rating" },
              { icon: <Shield className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: "hsl(var(--status-checked))" }} />, text: "HIPAA Compliant" },
              { icon: <Users className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: "hsl(var(--primary))" }} />, text: "2,500+ Families" },
              { icon: <Heart className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: "hsl(var(--status-alert))" }} />, text: "Made with ❤️" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-base font-bold text-foreground">
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Organizations */}
      <section id="organizations" className="py-16 md:py-20" style={{ background: "hsl(var(--secondary))" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground">
            For Care Organizations
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-lg mx-auto">
            Managing a care facility? Daily Guardian scales to hundreds of residents with staff dashboards, analytics, and compliance reporting.
          </p>
          <Button
            variant="outline"
            className="mt-6 h-12 px-8 text-base font-bold rounded-xl"
            onClick={onGetStarted}
          >
            Contact Sales <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo + Tagline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">☀️</span>
                <span className="text-lg font-black" style={{ color: "hsl(var(--primary))" }}>Daily Guardian</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple daily check-ins for peace of mind. Keeping families connected, one tap at a time.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-black text-sm text-foreground mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Daily Check-Ins</li>
                <li>Smart Alerts</li>
                <li>Mood Tracking</li>
                <li>Emergency Contacts</li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-black text-sm text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Contact</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-black text-sm text-foreground mb-3">Get in Touch</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@dailyguardian.app</li>
                <li>1-800-GUARDIAN</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Daily Guardian. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
