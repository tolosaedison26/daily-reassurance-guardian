import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";

interface LandingNavProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingNav({ onGetStarted, onSignIn }: LandingNavProps) {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  const scrollTo = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-black tracking-tight text-primary">Daily Guardian</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button key={l.href} onClick={() => scrollTo(l.href)} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={onSignIn} className="font-bold text-sm">Sign In</Button>
          <Button onClick={onGetStarted} className="h-11 px-6 font-black rounded-xl text-sm" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
            Get Started Free
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden w-10 h-10 rounded-full bg-muted flex items-center justify-center" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-2 animate-slide-up">
          {links.map((l) => (
            <button key={l.href} onClick={() => scrollTo(l.href)} className="block w-full text-left text-base font-semibold text-foreground py-2">
              {l.label}
            </button>
          ))}
          <div className="pt-2 space-y-2">
            <Button variant="outline" onClick={() => { setOpen(false); onSignIn(); }} className="w-full h-12 font-bold rounded-xl text-base">Sign In</Button>
            <Button onClick={() => { setOpen(false); onGetStarted(); }} className="w-full h-12 font-black rounded-xl text-base" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
