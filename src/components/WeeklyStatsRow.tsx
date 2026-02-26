import { CheckCircle, TrendingUp, XCircle, AlertTriangle } from "lucide-react";

interface WeeklyStatsRowProps {
  totalCheckIns: number;
  checkInRate: number;
  rateDelta: number;
  missedCheckIns: number;
  activeAlerts: number;
}

export default function WeeklyStatsRow({
  totalCheckIns,
  checkInRate,
  rateDelta,
  missedCheckIns,
  activeAlerts,
}: WeeklyStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Check-ins */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--status-checked) / 0.12)" }}
        >
          <CheckCircle className="w-6 h-6" style={{ color: "hsl(var(--status-checked))" }} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none">{totalCheckIns}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Check-ins</p>
        </div>
      </div>

      {/* Check-in Rate */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <TrendingUp className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none">{checkInRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg rate</p>
          {rateDelta !== 0 && (
            <p
              className="text-xs font-bold mt-0.5"
              style={{ color: rateDelta > 0 ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))" }}
            >
              {rateDelta > 0 ? "↑" : "↓"} {Math.abs(rateDelta)}% from last week
            </p>
          )}
        </div>
      </div>

      {/* Missed Check-ins */}
      <div
        className="rounded-2xl p-4 border shadow-card flex items-center gap-3"
        style={{
          background: missedCheckIns > 0 ? "hsl(var(--status-pending) / 0.06)" : "hsl(var(--card))",
          borderColor: missedCheckIns > 0 ? "hsl(var(--status-pending) / 0.3)" : "hsl(var(--border))",
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--status-pending) / 0.12)" }}
        >
          <XCircle className="w-6 h-6" style={{ color: "hsl(var(--status-pending))" }} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none" style={{ color: missedCheckIns > 0 ? "hsl(var(--status-pending))" : undefined }}>
            {missedCheckIns}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Missed</p>
        </div>
      </div>

      {/* Active Alerts */}
      <div
        className="rounded-2xl p-4 border shadow-card flex items-center gap-3"
        style={{
          background: activeAlerts > 0 ? "hsl(var(--status-alert) / 0.06)" : "hsl(var(--card))",
          borderColor: activeAlerts > 0 ? "hsl(var(--status-alert) / 0.3)" : "hsl(var(--border))",
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--status-alert) / 0.12)" }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--status-alert))" }} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none" style={{ color: activeAlerts > 0 ? "hsl(var(--status-alert))" : undefined }}>
            {activeAlerts}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Alerts</p>
        </div>
      </div>
    </div>
  );
}
