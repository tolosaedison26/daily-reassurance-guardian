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
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {/* Streak */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-card flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-pending) / 0.12)" }}>
          <Flame className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(var(--status-pending))" }} />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-2xl font-black leading-none truncate">{streak}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">day streak</p>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-card flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${weekColor}19` }}>
          <span className="text-base sm:text-lg font-black" style={{ color: weekColor }}>✓</span>
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-2xl font-black leading-none truncate" style={{ color: weekColor }}>{weekCheckins}/{weekTotal}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">days checked in</p>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-card min-w-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg sm:text-2xl font-black leading-none truncate">{monthRate}%</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">check-in rate</p>
        {monthTrend !== 0 && (
          <p className="text-[10px] sm:text-[11px] font-bold mt-1" style={{ color: monthTrend > 0 ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))" }}>
            {monthTrend > 0 ? "↑" : "↓"} {Math.abs(monthTrend)}% vs last
          </p>
        )}
      </div>

      {/* Avg Response */}
      <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border shadow-card flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-lg sm:text-2xl font-black leading-none truncate">{avgResponseMin}<span className="text-sm sm:text-base ml-0.5">min</span></p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">after reminder</p>
        </div>
      </div>
    </div>
  );
}
