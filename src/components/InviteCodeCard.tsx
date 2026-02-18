import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InviteCodeCardProps {
  seniorId: string;
}

export default function InviteCodeCard({ seniorId }: InviteCodeCardProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadExistingCode();
  }, []);

  const loadExistingCode = async () => {
    const { data } = await (supabase.from as any)("invite_codes")
      .select("code, expires_at")
      .eq("senior_id", seniorId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (data) {
      setCode(data.code);
      setExpiresAt(data.expires_at);
    }
    setLoading(false);
  };

  const generateCode = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("generate_invite_code", {
      p_senior_id: seniorId,
    });
    if (data && !error) {
      setCode(data as string);
      setExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
    }
    setGenerating(false);
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    if (!code) return;
    const msg = `My Daily Guardian invite code is: ${code}\n\nOpen the app and enter this code to connect with me and see my daily check-ins! 💚`;
    if (navigator.share) {
      navigator.share({ title: "Daily Guardian Invite", text: msg });
    } else {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : null;

  if (loading) return null;

  return (
    <div className="w-full bg-card rounded-2xl p-5 border border-border shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">👨‍👩‍👧</span>
        <p className="font-black text-base">Connect Family</p>
      </div>

      {code ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Share this code with your family. They enter it in their app to connect.
          </p>

          {/* Code display */}
          <div
            className="flex items-center justify-between px-5 py-4 rounded-2xl mb-3"
            style={{ background: "hsl(var(--secondary))" }}
          >
            <span
              className="text-3xl font-black tracking-widest"
              style={{ color: "hsl(var(--primary))", letterSpacing: "0.12em" }}
            >
              {code}
            </span>
            <button
              onClick={copyCode}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "hsl(var(--primary))" }}
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            ⏱ Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
          </p>

          <div className="flex gap-2">
            <Button
              onClick={shareCode}
              className="flex-1 h-11 rounded-xl font-black border-0"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Code
            </Button>
            <Button
              onClick={generateCode}
              disabled={generating}
              variant="outline"
              className="h-11 px-4 rounded-xl border-border"
              aria-label="Generate new code"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a code and share it with your family so they can see your daily check-ins.
          </p>
          <Button
            onClick={generateCode}
            disabled={generating}
            className="w-full h-12 font-black rounded-xl border-0"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            {generating ? "Generating…" : "Get My Invite Code"}
          </Button>
        </>
      )}
    </div>
  );
}
