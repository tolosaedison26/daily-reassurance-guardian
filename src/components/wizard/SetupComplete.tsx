import { useState } from "react";
import { CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetupCompleteProps {
  seniorName: string;
  reminderTime: string;
  contactCount: number;
  seniorPhone?: string;
  gracePeriodMinutes?: number;
  onGoToDashboard: () => void;
}

export default function SetupComplete({
  seniorName,
  reminderTime,
  contactCount,
  seniorPhone,
  gracePeriodMinutes,
  onGoToDashboard,
}: SetupCompleteProps) {
  const [testSent, setTestSent] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const handleTestCheckin = async () => {
    setTestSending(true);
    // Simulate sending test SMS
    await new Promise((r) => setTimeout(r, 1500));
    setTestSent(true);
    setTestSending(false);
  };

  const firstName = seniorName.split(" ")[0];

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
          {gracePeriodMinutes && (
            <div className="flex items-center gap-2">
              <span style={{ color: "hsl(var(--status-checked))" }}>✅</span>
              <span className="text-sm font-semibold">Grace period: {gracePeriodMinutes} minutes</span>
            </div>
          )}
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

        <div className="space-y-3">
          <Button
            onClick={onGoToDashboard}
            className="w-full rounded-2xl font-bold"
            style={{ minHeight: "56px", fontSize: "16px" }}
          >
            Go to My Dashboard
          </Button>
          {!testSent ? (
            <Button
              variant="outline"
              onClick={handleTestCheckin}
              disabled={testSending}
              className="w-full rounded-2xl font-bold"
              style={{ minHeight: "48px" }}
            >
              {testSending ? "Sending test…" : "Send a Test Check-in Now"}
            </Button>
          ) : null}
        </div>

        {/* Test check-in explanation card */}
        {testSent && (
          <div
            className="rounded-xl p-4 text-left space-y-3 text-sm"
            style={{
              background: "hsl(var(--status-checked) / 0.06)",
              border: "1px solid hsl(var(--status-checked) / 0.25)",
              lineHeight: "1.6",
            }}
          >
            <div className="flex items-center gap-2 font-bold" style={{ color: "hsl(var(--status-checked))" }}>
              <CheckCircle className="w-4 h-4" />
              Test Check-in — Completed
            </div>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">What this means:</span><br />
                A test SMS was sent to {seniorName}'s phone.
                When they reply, their status will update to "Safe" on your dashboard in real time.
              </p>
              <p>
                <span className="font-semibold text-foreground">What to do next:</span><br />
                Ask {firstName} to check their phone and reply.
                Then check your dashboard to see their status update live.
              </p>
              <p>
                If they didn't receive it, verify their phone number in Senior Settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
