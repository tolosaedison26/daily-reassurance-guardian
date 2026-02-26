type MoodValue = "great" | "okay" | "bad" | null;

interface SeniorMood {
  name: string;
  days: MoodValue[];
  trending: string;
  trendEmoji: string;
}

interface MoodTrendsCardProps {
  seniors: SeniorMood[];
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dotColor(mood: MoodValue) {
  if (mood === "great") return "hsl(var(--status-checked))";
  if (mood === "okay") return "hsl(var(--status-pending))";
  if (mood === "bad") return "hsl(var(--status-alert))";
  return "hsl(var(--muted))";
}

function trendColor(emoji: string) {
  if (emoji === "😊") return "hsl(var(--status-checked))";
  if (emoji === "😐") return "hsl(var(--status-pending))";
  return "hsl(var(--status-alert))";
}

export default function MoodTrendsCard({ seniors }: MoodTrendsCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black">Mood Trends — 7 Days</h3>
        <p className="text-xs text-muted-foreground">Mon – Sun this week</p>
      </div>

      <div className="space-y-4">
        {seniors.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="text-sm font-semibold w-28 md:w-36 truncate shrink-0">{s.name}</span>
            <div className="flex gap-1.5 overflow-x-auto shrink-0">
              {s.days.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
                    style={{ background: dotColor(d) }}
                    title={`${dayLabels[i]}: ${d || "no data"}`}
                  />
                  <span className="text-[9px] text-muted-foreground leading-none hidden md:block">
                    {dayLabels[i]}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs font-bold ml-auto whitespace-nowrap" style={{ color: trendColor(s.trendEmoji) }}>
              {s.trendEmoji} {s.trending}
            </span>
          </div>
        ))}
      </div>

      {/* Day labels for mobile */}
      <div className="flex md:hidden mt-2 ml-[7.5rem] gap-1.5">
        {dayLabels.map((d) => (
          <span key={d} className="text-[8px] text-muted-foreground w-2.5 text-center">{d[0]}</span>
        ))}
      </div>
    </div>
  );
}
