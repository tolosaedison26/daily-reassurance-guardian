import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface InlineConfirmProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "safe" | "destructive";
}

export default function InlineConfirm({ message, confirmLabel, onConfirm, onCancel, loading, variant = "safe" }: InlineConfirmProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <p className="text-sm font-medium text-foreground flex-1">{message}</p>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading} className="text-xs">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={loading}
          className="text-xs font-bold"
          style={variant === "safe" ? { background: "hsl(var(--status-checked))", color: "#fff" } : undefined}
          variant={variant === "destructive" ? "destructive" : "default"}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
