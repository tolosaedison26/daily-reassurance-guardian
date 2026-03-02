import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, Info, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SetupChecklistProps {
  seniorId: string;
  profileCreated: boolean;
  scheduleSet: boolean;
  contactAdded: boolean;
  testCheckinDone: boolean;
}

export default function SetupChecklist({ seniorId, profileCreated, scheduleSet, contactAdded, testCheckinDone }: SetupChecklistProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`test_checkin_dismissed_${seniorId}`) === "true";
  });

  const [fading, setFading] = useState(false);

  // Hide conditions
  const onboardingComplete = user ? localStorage.getItem(`onboarding_complete_${user.id}`) === "true" : false;
  const allDone = profileCreated && scheduleSet && contactAdded && testCheckinDone;

  // Don't render if dismissed, onboarding complete, test done, or all done
  if (dismissed || onboardingComplete || testCheckinDone || allDone) return null;

  const items = [
    { label: "Senior profile created", done: profileCreated, onClick: undefined, hasPopover: false },
    { label: "Check-in schedule set", done: scheduleSet, onClick: undefined, hasPopover: false },
    { label: "Emergency contact added", done: contactAdded, onClick: () => navigate(`/seniors/${seniorId}/contacts`), hasPopover: false },
    { label: "Test check-in completed", done: testCheckinDone, onClick: undefined, hasPopover: testCheckinDone },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      localStorage.setItem(`test_checkin_dismissed_${seniorId}`, "true");
      setDismissed(true);
    }, 150);
  };

  return (
    <div className={`bg-card rounded-2xl border border-border shadow-card p-5 transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-base">Setup Progress</p>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss setup checklist"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const inner = (
            <>
              {item.done ? (
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
              ) : (
                <Circle
                  className="w-4 h-4 shrink-0"
                  style={{ color: item.label.includes("Emergency") && !item.done ? "hsl(var(--status-pending))" : "hsl(var(--muted-foreground))" }}
                />
              )}
              <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "font-semibold"}`}>
                {item.label}
              </span>
              {item.hasPopover && item.done && (
                <Info className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
              )}
            </>
          );

          if (item.hasPopover && item.done) {
            return (
              <Popover key={i}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-2 w-full text-left min-h-[36px] hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                    tabIndex={0}
                  >
                    {inner}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="max-w-[320px] p-4 text-sm leading-relaxed" align="start">
                  <p className="font-semibold text-foreground mb-2">✅ Test Check-In — Completed</p>
                  <p className="font-semibold text-foreground mt-3 mb-1">What this means:</p>
                  <p>A test SMS was sent to this senior's phone number. They replied and their response was received successfully by Daily Guardian.</p>
                  <p className="font-semibold text-foreground mt-3 mb-1">What happened:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>A check-in SMS was sent to their phone</li>
                    <li>They replied to the message</li>
                    <li>Their status updated to "Safe" on your dashboard</li>
                    <li>A confirmation was logged to their profile</li>
                  </ol>
                  <p className="font-semibold text-foreground mt-3 mb-1">Next step:</p>
                  <p>Daily check-ins are now active. They will receive their first real check-in SMS tomorrow at their scheduled time.</p>
                  <div className="flex justify-end mt-3">
                    <Button size="sm" className="rounded-xl font-bold">Got it</Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <button
              key={i}
              onClick={item.onClick}
              disabled={!item.onClick}
              className="flex items-center gap-2 w-full text-left min-h-[36px] hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors disabled:cursor-default"
            >
              {inner}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "hsl(var(--status-checked))" }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">{progress}%</span>
      </div>
    </div>
  );
}
