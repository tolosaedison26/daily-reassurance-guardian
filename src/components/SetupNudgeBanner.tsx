import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeniorWithoutContacts {
  id: string;
  name: string;
}

interface SetupNudgeBannerProps {
  seniorsWithoutContacts: SeniorWithoutContacts[];
}

export default function SetupNudgeBanner({ seniorsWithoutContacts }: SetupNudgeBannerProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("nudge_dismissed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const valid: Record<string, number> = {};
        for (const [id, ts] of Object.entries(parsed)) {
          // Show again after 7 days
          if (now - (ts as number) < 7 * 24 * 60 * 60 * 1000) {
            valid[id] = ts as number;
          }
        }
        setDismissed(new Set(Object.keys(valid)));
      } catch { /* ignore */ }
    }
  }, []);

  const visible = seniorsWithoutContacts.filter((s) => !dismissed.has(s.id));
  if (visible.length === 0) return null;

  const senior = visible[0];

  const handleDismiss = () => {
    const stored = JSON.parse(localStorage.getItem("nudge_dismissed") || "{}");
    stored[senior.id] = Date.now();
    localStorage.setItem("nudge_dismissed", JSON.stringify(stored));
    setDismissed((prev) => new Set(prev).add(senior.id));
  };

  return (
    <div
      className="rounded-2xl p-4 border flex items-start gap-3"
      style={{
        background: "hsl(var(--status-pending) / 0.06)",
        borderColor: "hsl(var(--status-pending) / 0.25)",
      }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">
          {senior.name} has no emergency contacts — no one will be notified if they miss a check-in.
        </p>
        <Button
          variant="link"
          className="h-auto p-0 text-sm font-bold mt-1"
          style={{ color: "hsl(var(--primary))" }}
          onClick={() => navigate(`/seniors/${senior.id}/contacts`)}
        >
          Add Contact Now →
        </Button>
      </div>
      <button
        onClick={handleDismiss}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
