import { Flame, Clock } from "lucide-react";

interface QuickStatsStripProps {
  streak: number;
  weekCheckins: number;
  weekTotal: number;
  monthRate: number;
  monthTrend: number;
  avgResponseMin: number;
}

export default function QuickStatsStrip({ streak, weekCheckins, weekTotal, monthRate, monthTrend, avgResponseMin }: QuickStatsStripProps) {
  const weekPct = weekTotal > 0 ? (weekCheckins / weekTotal) * 100 : 0;
  const weekColor = weekPct >= 80 ? "hsl(var(--status-checked))" : weekPct >= 60 ? "hsl(var(--status-pending))" : "hsl(var(--status-alert))";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Streak */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-pending) / 0.12)" }}>
          <Flame className="w-5 h-5" style={{ color: "hsl(var(--status-pending))" }} />
        </div>
        <div>
          <p className="text-2xl font-black leading-none">{streak}</p>
          <p className="text-xs text-muted-foreground mt-0.5">day streak</p>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${weekColor}19` }}>
          <span className="text-lg font-black" style={{ color: weekColor }}>✓</span>
        </div>
        <div>
          <p className="text-2xl font-black leading-none" style={{ color: weekColor }}>{weekCheckins}/{weekTotal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">days checked in</p>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
        <p className="text-2xl font-black leading-none">{monthRate}%</p>
        <p className="text-xs text-muted-foreground mt-0.5">check-in rate</p>
        {monthTrend !== 0 && (
          <p className="text-[11px] font-bold mt-1" style={{ color: monthTrend > 0 ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))" }}>
            {monthTrend > 0 ? "↑" : "↓"} {Math.abs(monthTrend)}% vs last month
          </p>
        )}
      </div>

      {/* Avg Response */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
          <Clock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-black leading-none">{avgResponseMin} min</p>
          <p className="text-xs text-muted-foreground mt-0.5">after reminder</p>
        </div>
      </div>
    </div>
  );
}
