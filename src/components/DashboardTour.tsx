import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface TourStep {
  targetSelector: string;
  text: string;
  buttonLabel: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: "[data-tour='overview-banner']",
    text: "This banner tells you at a glance whether all your seniors are okay today. Green means everyone checked in.",
    buttonLabel: "Next →",
  },
  {
    targetSelector: "[data-tour='seniors-list']",
    text: "Your seniors are listed here with their current check-in status. Click any name to view their full profile and history.",
    buttonLabel: "Next →",
  },
  {
    targetSelector: "[data-tour='notification-bell']",
    text: "Alerts appear here when a senior misses a check-in. A red dot means action is needed.",
    buttonLabel: "Next →",
  },
  {
    targetSelector: "[data-tour='add-senior-btn']",
    text: "Add more seniors here any time. Each one gets their own daily check-in schedule and emergency contacts.",
    buttonLabel: "Done ✓",
  },
];

interface DashboardTourProps {
  onComplete: () => void;
}

export default function DashboardTour({ onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowSide: "top" | "bottom" }>({ top: 0, left: 0, arrowSide: "top" });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipHeight = 160;
    const margin = 12;

    // Try to position below the target
    let top = rect.bottom + margin;
    let arrowSide: "top" | "bottom" = "top";

    // If not enough space below, position above
    if (top + tooltipHeight > window.innerHeight) {
      top = rect.top - tooltipHeight - margin;
      arrowSide = "bottom";
    }

    let left = Math.max(16, Math.min(rect.left + rect.width / 2 - 130, window.innerWidth - 276));

    setTooltipPos({ top, left, arrowSide });
  };

  useEffect(() => {
    updatePosition();
    const handle = () => updatePosition();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [currentStep]);

  const advance = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onComplete} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[61] bg-card border border-border shadow-lg rounded-xl p-4 animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          maxWidth: 260,
          width: 260,
        }}
      >
        <p className="text-sm text-foreground leading-relaxed mb-3">{step.text}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={onComplete}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <button
            onClick={advance}
            className="text-sm font-bold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {step.buttonLabel}
          </button>
        </div>
        <div className="flex justify-center gap-1 mt-2">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === currentStep ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
