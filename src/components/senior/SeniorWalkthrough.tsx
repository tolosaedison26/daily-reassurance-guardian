import { useState, useEffect } from "react";
import { ShieldCheck, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import RegistrationCodeStep from "./RegistrationCodeStep";

interface WalkthroughContact {
  name: string;
  relationship: string | null;
  sort_order: number;
}

interface SeniorWalkthroughProps {
  firstName: string;
  seniorId?: string;
  onComplete: () => void;
  onCheckIn: () => void;
}

export default function SeniorWalkthrough({ firstName, seniorId, onComplete, onCheckIn }: SeniorWalkthroughProps) {
  const [screen, setScreen] = useState(0);
  const [practiced, setPracticed] = useState(false);
  const [contacts, setContacts] = useState<WalkthroughContact[]>([]);

  // Check if code step was already shown
  const codeShown = localStorage.getItem("dg_senior_code_shown") === "true";
  const totalSteps = codeShown ? 3 : 4;
  // Screen mapping: if code not shown, screen 0 = code step, 1-3 = original 0-2
  // If code shown, screen 0-2 = original 0-2

  useEffect(() => {
    if (seniorId) loadContacts();
  }, [seniorId]);

  const loadContacts = async () => {
    if (!seniorId) return;
    const { data } = await supabase
      .from("emergency_contacts")
      .select("name, relationship, sort_order")
      .eq("senior_id", seniorId)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      setContacts(data);
    }
  };

  const handlePractice = () => {
    onCheckIn();
    setPracticed(true);
  };

  const delayLabels = ["Notified first", "Notified after 30 min", "Notified after 60 min"];

  // Registration code step
  if (!codeShown && screen === 0 && seniorId) {
    return (
      <RegistrationCodeStep
        seniorId={seniorId}
        onNext={() => setScreen(1)}
      />
    );
  }

  // Map screen index to original walkthrough screens
  const effectiveScreen = codeShown ? screen : screen - 1;
  const currentStep = codeShown ? screen + 1 : screen + 1;

  const dots = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative">
      {/* Skip link */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
      >
        Skip intro
      </button>

      {/* Screen 1 — Welcome */}
      {effectiveScreen === 0 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <ShieldCheck className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Hi {firstName}! Your family is looking out for you.
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            Every morning you'll get a text message asking if you're okay. Just tap the link and press 'I'm Okay'. That's it!
          </p>
          <Button
            onClick={() => setScreen(screen + 1)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          <div className="flex justify-center gap-2">
            {dots.map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i === currentStep - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
            ))}
          </div>
        </div>
      )}

      {/* Screen 2 — Emergency Contacts */}
      {effectiveScreen === 1 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <Users className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Someone is always watching out for you
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            If you miss a check-in, we'll automatically contact your emergency contacts — one by one — until someone responds.
          </p>
          <p className="text-muted-foreground" style={{ fontSize: "18px", lineHeight: "28px" }}>
            You don't need to do anything. It happens automatically.
          </p>

          {contacts.length > 0 ? (
            <div className="space-y-2 text-left">
              {contacts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ fontSize: "16px" }}>
                      {c.name}
                      {c.relationship && <span className="font-normal text-muted-foreground"> · {c.relationship}</span>}
                    </p>
                    <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                      {delayLabels[i] || delayLabels[2]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl p-4 text-left"
              style={{ background: "hsl(var(--status-pending) / 0.08)", border: "1px solid hsl(var(--status-pending) / 0.2)" }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
                <p className="text-muted-foreground" style={{ fontSize: "16px", lineHeight: "24px" }}>
                  Your caregiver hasn't added contacts yet. Ask them to do this in their Daily Guardian account.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => setScreen(screen + 1)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          <div className="flex justify-center gap-2">
            {dots.map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i === currentStep - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
            ))}
          </div>
        </div>
      )}

      {/* Screen 3 — Practice Check-in */}
      {effectiveScreen === 2 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "hsl(var(--status-checked) / 0.12)" }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Let's do a quick practice!
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            This is what you'll see every morning. Tap the big button to try it now.
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
                  You've got it! 🎉 Your family will love this.
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
                I'm ready — let's go!
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {dots.map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i === currentStep - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
