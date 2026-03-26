import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";

interface LandingNavProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function LandingNav({ onGetStarted, onSignIn }: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const sectionLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  const scrollTo = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg sm:text-xl font-black tracking-tight text-foreground">Daily Guardian</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {sectionLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="text-[15px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {l.label}
            </button>
          ))}
          <a href="/contact" className="text-[15px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSignIn} className="text-[15px] cursor-pointer">
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={onGetStarted}
            className="text-[15px] px-5 cursor-pointer rounded-lg font-semibold"
            style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
          >
            Get Started
          </Button>
        </div>

        <button
          className="md:hidden w-11 h-11 flex items-center justify-center cursor-pointer rounded-lg hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/40 bg-background px-4 sm:px-6 py-4 space-y-1">
          {sectionLinks.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              className="block w-full text-left text-base sm:text-lg py-3 text-foreground cursor-pointer rounded-lg px-2 hover:bg-muted/60 transition-colors"
            >
              {l.label}
            </button>
          ))}
          <a
            href="/contact"
            onClick={() => setOpen(false)}
            className="block w-full text-left text-base sm:text-lg py-3 text-foreground cursor-pointer rounded-lg px-2 hover:bg-muted/60 transition-colors"
          >
            Contact
          </a>
          <div className="pt-3 flex flex-col gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); onSignIn(); }} className="w-full h-12 text-base cursor-pointer">
              Sign In
            </Button>
            <Button
              onClick={() => { setOpen(false); onGetStarted(); }}
              className="w-full h-12 text-base cursor-pointer font-semibold"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
