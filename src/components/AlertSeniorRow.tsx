import { Clock } from "lucide-react";

interface AlertSeniorRowProps {
  name: string;
  alertTime: string;
  contactNotified: string;
  onClick: () => void;
}

export default function AlertSeniorRow({ name, alertTime, contactNotified, onClick }: AlertSeniorRowProps) {
  return (
    <div
      className="bg-card rounded-2xl p-5 border shadow-card cursor-pointer active:scale-[0.98] transition-transform border-l-4"
      onClick={onClick}
      style={{
        borderLeftColor: "hsl(var(--status-alert))",
        background: "hsl(var(--status-alert) / 0.04)",
        borderColor: "hsl(var(--status-alert) / 0.2)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0 relative"
          style={{
            background: "hsl(var(--status-alert) / 0.12)",
            color: "hsl(var(--status-alert))",
          }}
        >
          {name.charAt(0).toUpperCase()}
          <div
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 animate-pulse"
            style={{
              background: "hsl(var(--status-alert))",
              borderColor: "hsl(var(--card))",
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-lg leading-tight truncate">{name}</p>
          <p className="text-sm font-black mt-0.5" style={{ color: "hsl(var(--status-alert))" }}>
            🚨 MISSED — Alert sent {alertTime}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {contactNotified} · Waiting for acknowledgment
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-black"
            style={{
              background: "hsl(var(--status-alert) / 0.12)",
              color: "hsl(var(--status-alert))",
            }}
          >
            View →
          </div>
        </div>
      </div>
    </div>
  );
}
