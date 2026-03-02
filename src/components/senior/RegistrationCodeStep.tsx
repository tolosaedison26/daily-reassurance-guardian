import { useState, useEffect } from "react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationCodeStepProps {
  seniorId: string;
  onNext: () => void;
}

export default function RegistrationCodeStep({ seniorId, onNext }: RegistrationCodeStepProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadCode();
  }, [seniorId]);

  const loadCode = async () => {
    setLoading(true);
    // Try to get existing active invite code
    const { data } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("senior_id", seniorId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.code) {
      setCode(data.code);
    } else {
      // Generate a new one via RPC
      const { data: newCode } = await supabase.rpc("generate_invite_code", { p_senior_id: seniorId });
      if (newCode) setCode(newCode as string);
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNext = () => {
    localStorage.setItem("dg_senior_code_shown", "true");
    onNext();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-[360px] w-full text-center space-y-6">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <ShieldCheck className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
        </div>

        <h1 className="text-xl font-bold text-foreground">Your Registration Code</h1>

        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
          Share this code with your family member so they can add you to their Daily Guardian account and keep an eye on you.
        </p>

        {loading ? (
          <div className="rounded-lg p-5 bg-muted animate-pulse">
            <div className="h-10 bg-muted-foreground/10 rounded" />
          </div>
        ) : code ? (
          <>
            <div
              className="rounded-lg py-5 px-6"
              style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}
            >
              <p className="text-3xl font-bold tracking-[0.15em]" style={{ color: "hsl(var(--primary))" }}>
                {code}
              </p>
            </div>

            <Button
              variant="ghost"
              onClick={handleCopy}
              className="w-full gap-2 font-semibold"
              style={{ color: "hsl(var(--primary))" }}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy Code</>
              )}
            </Button>

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Your code: <span className="font-bold">{code}</span>
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: "hsl(var(--status-pending))" }}>
            Your code is being generated — check Settings → Your Account shortly.
          </p>
        )}

        <Button
          onClick={handleNext}
          className="w-full rounded-2xl font-bold border-0"
          style={{ minHeight: "56px", fontSize: "16px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          Got it — let's go →
        </Button>

        <p className="text-xs text-muted-foreground">
          You can find this code any time in Settings → Your Account.
        </p>
      </div>
    </div>
  );
}
