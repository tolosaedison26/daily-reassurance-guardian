import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, MessageSquare, Clock, Pill, Gamepad2, LogOut, X, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardGuideProps {
  onClose: () => void;
}

const steps = [
  {
    icon: Users,
    iconBg: "hsl(var(--primary) / 0.12)",
    iconColor: "hsl(var(--primary))",
    title: "Add Emergency Contacts",
    description: "Add people you trust who will be notified if you miss a check-in.",
    details: [
      "Go to the Contacts page from the menu",
      "Enter a name and phone number for each contact",
      "You can add up to 3 contacts",
      "Use the arrows to set notification order",
      "Contact #1 is notified first, then #2, then #3",
    ],
  },
  {
    icon: CheckCircle,
    iconBg: "hsl(var(--status-checked) / 0.12)",
    iconColor: "hsl(var(--status-checked))",
    title: "Daily Check-In",
    description: "Each day, tell us how you're feeling by picking a mood. That's your check-in!",
    details: [
      "On your Home page, choose Great 😊, Okay 😐, or Not Great 😔",
      "Tapping any mood button completes your check-in for the day",
      "Or reply to the SMS text message you receive",
      "If you miss a check-in, your emergency contacts will be notified",
    ],
  },
  {
    icon: MessageSquare,
    iconBg: "hsl(var(--primary) / 0.12)",
    iconColor: "hsl(var(--primary))",
    title: "Enable SMS Check-Ins",
    description: "Get daily check-in reminders sent straight to your phone via text message. You can enable this in two places.",
    details: [
      "On the Home page: use the 'SMS Check-Ins' toggle to turn it on or off",
      "On the Settings page: find the 'SMS Check-Ins' card",
      "Toggle it on — you'll receive a confirmation text",
      "Reply YES to the text to activate daily reminders",
      "You can disable it any time by toggling off or replying STOP",
    ],
  },
  {
    icon: Clock,
    iconBg: "hsl(var(--primary) / 0.12)",
    iconColor: "hsl(var(--primary))",
    title: "Change Check-In Time",
    description: "Your check-in time is when you'll receive your daily reminder. You can change it in two places.",
    details: [
      "On the Home page: tap the 'Check-In Time' card to edit it",
      "On the Settings page: find the 'Check-In Time' section",
      "Pick the hour and AM/PM that fits your daily routine",
      "Your new time takes effect the next day",
      "You can change it once per week",
    ],
  },
  {
    icon: Pill,
    iconBg: "hsl(var(--primary) / 0.12)",
    iconColor: "hsl(var(--primary))",
    title: "Track Your Medications",
    description: "Add your medications and track each dose throughout the day.",
    details: [
      "Go to the Medications page from the menu",
      "Tap 'Add Medication' to add a new one, or pick from common presets",
      "Set the name, dosage, how often you take it, and the time(s)",
      "Each day, your schedule shows all upcoming doses",
      "Tap 'Take' or 'Skip' next to each dose to track it",
      "With SMS enabled, you'll receive a daily morning text reminding you to check your schedule",
      "You can pause or delete a medication any time",
    ],
  },
  {
    icon: Gamepad2,
    iconBg: "hsl(var(--primary) / 0.12)",
    iconColor: "hsl(var(--primary))",
    title: "Play Brain Games",
    description: "Play fun brain games solo or challenge a friend or family member.",
    details: [
      "Go to the Games page from the menu",
      "Choose Word Scramble or Memory Match",
      "Play Solo for practice, or tap VS to challenge someone",
      "Share your invite code so your friend can join",
      "Your scores and game history are tracked automatically",
    ],
  },
  {
    icon: LogOut,
    iconBg: "hsl(var(--muted))",
    iconColor: "hsl(var(--muted-foreground))",
    title: "Sign Out",
    description: "To sign out, use the Sign Out button at the bottom of the menu.",
    details: [
      "On desktop: click 'Sign Out' at the bottom of the left sidebar",
      "On mobile: tap 'Sign Out' in the top bar",
      "You'll need to sign back in to check in again",
    ],
  },
];

export default function DashboardGuide({ onClose }: DashboardGuideProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const panelRef = useRef<HTMLDivElement>(null);

  const getFocusableElements = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return [];
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
  }, []);

  // Escape key closes the guide; Tab/Shift+Tab trapped inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if focus is on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if focus is on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, getFocusableElements]);

  // Set initial focus when step changes
  useEffect(() => {
    const focusable = getFocusableElements();
    if (focusable.length > 0) focusable[0].focus();
  }, [step, getFocusableElements]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} className="bg-background rounded-3xl w-full max-w-md shadow-xl overflow-hidden" role="dialog" aria-modal="true" aria-label="Dashboard Guide">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <span className="text-sm font-bold text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                background: "hsl(var(--primary))",
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-6 space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: current.iconBg }}
            >
              <Icon className="w-8 h-8" style={{ color: current.iconColor }} />
            </div>
            <h2 className="font-black text-foreground" style={{ fontSize: "22px", lineHeight: "28px" }}>
              {current.title}
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: "16px", lineHeight: "24px" }}>
              {current.description}
            </p>
          </div>

          {/* Detail bullets */}
          <div className="space-y-2.5 text-left">
            {current.details.map((detail, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-foreground leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-5 pb-5 flex items-center gap-3">
          {step > 0 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-xl font-bold text-base"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-bold text-base text-muted-foreground"
            >
              Skip Guide
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 h-12 rounded-xl font-bold text-base border-0"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl font-bold text-base border-0"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              Got it!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
