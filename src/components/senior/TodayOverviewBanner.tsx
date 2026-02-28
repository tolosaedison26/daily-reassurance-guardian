import { CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";

interface TodayOverviewBannerProps {
  totalSeniors: number;
  safeCount: number;
  pendingCount: number;
  alertCount: number;
  onTap?: () => void;
}

export default function TodayOverviewBanner({ totalSeniors, safeCount, pendingCount, alertCount, onTap }: TodayOverviewBannerProps) {
  if (totalSeniors === 0) return null;

  let bg: string;
  let borderColor: string;
  let icon: React.ReactNode;
  let text: string;

  if (alertCount > 0) {
    bg = "hsl(var(--status-alert) / 0.06)";
    borderColor = "hsl(var(--status-alert) / 0.25)";
    icon = (
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "hsl(var(--status-alert))" }} />
        <AlertOctagon className="w-5 h-5" style={{ color: "hsl(var(--status-alert))" }} />
      </div>
    );
    text = `${alertCount} senior${alertCount > 1 ? "s" : ""} missed today's check-in. Contacts have been notified.`;
  } else if (pendingCount > 0) {
    bg = "hsl(var(--status-pending) / 0.06)";
    borderColor = "hsl(var(--status-pending) / 0.25)";
    icon = <AlertTriangle className="w-5 h-5" style={{ color: "hsl(var(--status-pending))" }} />;
    text = `${pendingCount} senior${pendingCount > 1 ? "s" : ""} haven't checked in yet. Grace period still active.`;
  } else {
    bg = "hsl(var(--status-checked) / 0.06)";
    borderColor = "hsl(var(--status-checked) / 0.25)";
    icon = <CheckCircle className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />;
    text = `All ${safeCount} senior${safeCount > 1 ? "s" : ""} checked in today — everyone is okay.`;
  }

  return (
    <button
      onClick={onTap}
      className="w-full rounded-2xl p-4 border shadow-card flex items-center gap-3 text-left transition-all hover:shadow-md"
      style={{ background: bg, borderColor }}
    >
      {icon}
      <p className="text-sm font-semibold text-foreground flex-1">{text}</p>
    </button>
  );
}
