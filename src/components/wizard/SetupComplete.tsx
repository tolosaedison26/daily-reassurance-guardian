import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetupCompleteProps {
  seniorName: string;
  reminderTime: string;
  contactCount: number;
  onGoToDashboard: () => void;
}

export default function SetupComplete({ seniorName, reminderTime, contactCount, onGoToDashboard }: SetupCompleteProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "hsl(var(--status-checked) / 0.12)" }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
        </div>

        <h1 className="text-2xl font-black">You're all set! 🎉</h1>

        <div className="bg-card rounded-2xl border border-border shadow-card p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <span style={{ color: "hsl(var(--status-checked))" }}>✅</span>
            <span className="text-sm font-semibold">{seniorName} added</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: "hsl(var(--status-checked))" }}>✅</span>
            <span className="text-sm font-semibold">Check-ins: Daily at {reminderTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: contactCount > 0 ? "hsl(var(--status-checked))" : "hsl(var(--status-pending))" }}>
              {contactCount > 0 ? "✅" : "⚠️"}
            </span>
            <span className="text-sm font-semibold">
              {contactCount > 0 ? `${contactCount} emergency contact${contactCount !== 1 ? "s" : ""} added` : "No emergency contacts added"}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {seniorName} will receive their first check-in SMS tomorrow at {reminderTime}.
        </p>

        <Button
          onClick={onGoToDashboard}
          className="w-full rounded-2xl font-bold"
          style={{ minHeight: "56px", fontSize: "16px" }}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
