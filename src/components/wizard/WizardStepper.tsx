import { Check } from "lucide-react";

const STEPS = ["Basic Info", "Schedule", "Contacts", "Review"];

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  allowJump?: boolean;
}

export default function WizardStepper({ currentStep, completedSteps, onStepClick, allowJump }: WizardStepperProps) {
  return (
    <>
      {/* Mobile: compact label */}
      <div className="flex md:hidden items-center justify-center gap-2 py-4">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-primary-foreground"
          style={{ background: "hsl(var(--primary))" }}
        >
          {currentStep + 1}
        </span>
        <span className="font-bold text-sm">
          Step {currentStep + 1} of 4 — {STEPS[currentStep]}
        </span>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden md:flex items-center justify-center gap-0 py-6 px-4">
        {STEPS.map((label, i) => {
          const isCompleted = completedSteps.has(i);
          const isActive = i === currentStep;
          const canClick = allowJump && (isCompleted || i <= currentStep);

          return (
            <div key={label} className="flex items-center">
              {i > 0 && (
                <div
                  className="w-12 lg:w-20 h-0.5 mx-1"
                  style={{
                    background: completedSteps.has(i - 1)
                      ? "hsl(var(--status-checked))"
                      : "hsl(var(--border))",
                  }}
                />
              )}
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick?.(i)}
                className="flex items-center gap-2 group disabled:cursor-default"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                  style={{
                    background: isCompleted
                      ? "hsl(var(--status-checked))"
                      : isActive
                      ? "hsl(var(--primary))"
                      : "transparent",
                    border: !isCompleted && !isActive ? "2px solid hsl(var(--border))" : "none",
                    color: isCompleted || isActive ? "#fff" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className="text-sm whitespace-nowrap"
                  style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--muted-foreground))",
                  }}
                >
                  {label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
