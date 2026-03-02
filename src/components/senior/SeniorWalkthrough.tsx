import { useState } from "react";
import { ShieldCheck, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeniorWalkthroughProps {
  firstName: string;
  onComplete: () => void;
  onCheckIn: () => void;
}

export default function SeniorWalkthrough({ firstName, onComplete, onCheckIn }: SeniorWalkthroughProps) {
  const [screen, setScreen] = useState(0);
  const [practiced, setPracticed] = useState(false);

  const handlePractice = () => {
    onCheckIn();
    setPracticed(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      {/* Skip link */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
      >
        Skip intro
      </button>

      {/* Screen 1 */}
      {screen === 0 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--status-checked) / 0.12)" }}
          >
            <ShieldCheck className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "28px", lineHeight: "36px" }}>
            Hi {firstName}! 👋
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            Your family set this up to check in on you every day.
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "18px", lineHeight: "28px" }}>
            Each morning you'll get a text message. Just reply to let them know you're okay. That's all there is to it!
          </p>
          <Button
            onClick={() => setScreen(1)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          {/* Dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen 2 */}
      {screen === 1 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <Users className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Your family is looking out for you
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            If you miss a check-in, we'll automatically let your emergency contacts know so they can check in on you.
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "16px" }}>
            Your caregiver will add your emergency contacts soon.
          </p>
          <Button
            onClick={() => setScreen(2)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: i === 1 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screen 3 */}
      {screen === 2 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--status-checked) / 0.12)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Let's try it out!
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            This is exactly what you'll see each morning. Tap the button below to practice.
          </p>

          {!practiced ? (
            <Button
              onClick={handlePractice}
              className="w-full rounded-2xl border-0 shadow-btn font-bold"
              style={{
                minHeight: "80px",
                fontSize: "22px",
                background: "hsl(var(--status-checked))",
                color: "#fff",
              }}
            >
              ✓  I'M OKAY
            </Button>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-2xl p-4 border text-center"
                style={{
                  background: "hsl(var(--status-checked) / 0.06)",
                  borderColor: "hsl(var(--status-checked) / 0.25)",
                }}
              >
                <p className="text-3xl mb-2">✅</p>
                <p className="font-black" style={{ fontSize: "18px", color: "hsl(var(--status-checked))" }}>
                  Perfect! You've got it.
                </p>
              </div>
              <Button
                onClick={onComplete}
                className="w-full rounded-2xl font-bold border-0"
                style={{
                  minHeight: "64px",
                  fontSize: "18px",
                  background: "hsl(var(--status-checked))",
                  color: "#fff",
                }}
              >
                I'm ready — Take me home
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: i === 2 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
