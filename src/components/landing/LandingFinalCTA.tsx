import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface LandingFinalCTAProps {
  onGetStarted: () => void;
}

export default function LandingFinalCTA({ onGetStarted }: LandingFinalCTAProps) {
  const { ref, isVisible } = useInView(0.1);

  return (
    <section className="py-20 sm:py-24 md:py-32 relative overflow-hidden">
      {/* Warm background gradient */}
      <div
        className="absolute inset-0 pointer-events-none gradient-cta"
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className={`fade-up ${isVisible ? "visible" : ""}`}>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em" }}
          >
            Stay safe. Stay on track.
          </h2>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-lg mx-auto" style={{ lineHeight: "1.6" }}>
            Sign up in 2 minutes. Get daily check-ins and medication reminders. Your emergency contacts get peace of mind.
          </p>
        </div>

        <div
          className={`fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "120ms" }}
        >
          <Button
            onClick={onGetStarted}
            className="w-full sm:w-auto h-14 px-10 text-base sm:text-lg font-bold rounded-xl cursor-pointer shadow-btn"
            style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto h-14 px-8 text-base sm:text-lg font-medium rounded-xl cursor-pointer bg-card"
            onClick={() =>
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Learn More
          </Button>
        </div>

        <p
          className={`fade-up mt-5 text-sm text-muted-foreground ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "200ms" }}
        >
          Free for{" "}
          <a href="https://www.edwardcreation.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline underline-offset-2 hover:no-underline">Edward Creation</a>
          {" "}customers. No credit card required.
        </p>
      </div>
    </section>
  );
}
