import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface CheckinSuccessScreenProps {
  firstName: string;
  mood?: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function CheckinSuccessScreen({ firstName, mood, onDismiss, autoDismissMs = 5000 }: CheckinSuccessScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const moodEmoji = mood === "great" ? "😊" : mood === "okay" ? "😐" : mood === "bad" ? "😔" : "💚";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="flex flex-col items-center text-center px-8 max-w-sm">
        {/* Animated checkmark */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{
            background: "hsl(var(--status-checked) / 0.12)",
            animation: "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontSize: "24px", lineHeight: "32px" }}>
          Thank you, {firstName}!
        </h1>

        <p className="text-lg text-muted-foreground" style={{ fontSize: "18px", lineHeight: "28px" }}>
          Your family has been notified you're doing well today. {moodEmoji}
        </p>

        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-4"
        >
          Close
        </button>
      </div>
    </div>
  );
}
