interface SeniorRate {
  name: string;
  rate: number;
  mood: string;
}

interface CheckinRatesCardProps {
  seniors: SeniorRate[];
  overallRate: number;
  lastWeekRate: number;
  seniorCount: number;
}

function rateColor(rate: number) {
  if (rate >= 80) return "hsl(var(--status-checked))";
  if (rate >= 60) return "hsl(var(--status-pending))";
  return "hsl(var(--status-alert))";
}

function rateBg(rate: number) {
  if (rate >= 80) return "hsl(var(--status-checked) / 0.18)";
  if (rate >= 60) return "hsl(var(--status-pending) / 0.18)";
  return "hsl(var(--status-alert) / 0.18)";
}

export default function CheckinRatesCard({ seniors, overallRate, lastWeekRate, seniorCount }: CheckinRatesCardProps) {
  const delta = overallRate - lastWeekRate;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black">Check-in Rates</h3>
        <p className="text-xs text-muted-foreground">This Week · {seniorCount} seniors</p>
      </div>

      <div className="space-y-3">
        {seniors.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="text-sm font-semibold w-28 md:w-36 truncate shrink-0">{s.name}</span>
            <div className="flex-1 min-w-[80px] h-3 rounded-full overflow-hidden" style={{ background: rateBg(s.rate) }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${s.rate}%`, background: rateColor(s.rate) }}
              />
            </div>
            <span className="text-sm font-black w-12 text-right" style={{ color: rateColor(s.rate) }}>
              {s.rate}%
            </span>
            <span className="text-base w-6 text-center">{s.mood}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        Overall team rate: <span className="font-bold">{overallRate}%</span> · Last week: {lastWeekRate}%{" "}
        {delta !== 0 && (
          <span style={{ color: delta > 0 ? "hsl(var(--status-checked))" : "hsl(var(--status-alert))" }}>
            {delta > 0 ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}
