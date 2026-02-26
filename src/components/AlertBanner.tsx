import { AlertTriangle, Eye, HandHelping } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  alertCount: number;
  seniorName: string;
  dueTime: string;
  overdueText: string;
  contactNotified: string;
  onViewSenior: () => void;
  onHandleThis: () => void;
}

export default function AlertBanner({
  alertCount,
  seniorName,
  dueTime,
  overdueText,
  contactNotified,
  onViewSenior,
  onHandleThis,
}: AlertBannerProps) {
  return (
    <div
      className="w-full rounded-2xl p-5 border shadow-card animate-bounce-in"
      style={{
        background: "hsl(var(--status-alert) / 0.06)",
        borderColor: "hsl(var(--status-alert) / 0.3)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5 shrink-0">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: "hsl(var(--status-alert))" }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-black text-base leading-tight" style={{ color: "hsl(var(--status-alert))" }}>
              🚨 {alertCount} Active Alert — {seniorName} has not checked in
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Due at {dueTime} · Now {overdueText} overdue · {contactNotified}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <Button
            onClick={onViewSenior}
            className="flex-1 md:flex-none h-10 font-black rounded-xl border-0 text-sm"
            style={{ background: "hsl(var(--status-alert))", color: "#fff" }}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View Senior
          </Button>
          <Button
            onClick={onHandleThis}
            variant="outline"
            className="flex-1 md:flex-none h-10 font-black rounded-xl text-sm"
          >
            <HandHelping className="w-4 h-4 mr-1.5" />
            I'm Handling This
          </Button>
        </div>
      </div>
    </div>
  );
}
