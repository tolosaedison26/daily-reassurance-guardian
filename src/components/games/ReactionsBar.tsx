import { useState } from "react";
import { sendReaction } from "@/lib/games/client";

const REACTIONS = [
  { id: 1, label: "Well done!" },
  { id: 2, label: "Nice try!" },
  { id: 3, label: "My turn!" },
  { id: 4, label: "Ha ha!" },
];

interface Props {
  matchId: string;
  senderId: string;
  disabled?: boolean;
}

export default function ReactionsBar({ matchId, senderId, disabled }: Props) {
  const [sent, setSent] = useState<number | null>(null);

  async function handleSend(reactionId: number) {
    if (disabled || sent) return;
    try {
      await sendReaction(matchId, senderId, reactionId);
      setSent(reactionId);
      setTimeout(() => setSent(null), 3000);
    } catch {
      // Non-critical
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {REACTIONS.map((r) => (
        <button
          key={r.id}
          onClick={() => handleSend(r.id)}
          disabled={disabled || sent !== null}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-all ${
            sent === r.id
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          } disabled:opacity-40`}
        >
          {sent === r.id ? "Sent!" : r.label}
        </button>
      ))}
    </div>
  );
}

export { REACTIONS };
