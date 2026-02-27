import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { subDays, format } from "date-fns";
import type { MoodValue } from "./mock-data";

function moodEmoji(m: MoodValue) {
  if (m === "great") return "😊";
  if (m === "okay") return "😐";
  if (m === "bad") return "😟";
  return "—";
}

function moodScore(m: MoodValue): number | null {
  if (m === "great") return 1;
  if (m === "okay") return 2;
  if (m === "bad") return 3;
  return null;
}

function moodColor(m: MoodValue) {
  if (m === "great") return "hsl(var(--status-checked))";
  if (m === "okay") return "hsl(var(--status-pending))";
  if (m === "bad") return "hsl(var(--status-alert))";
  return "hsl(var(--muted))";
}

const DAYS_7 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generate7DayMoods(): MoodValue[] {
  const moods: MoodValue[] = [];
  for (let i = 0; i < 7; i++) {
    const r = Math.random();
    if (r < 0.55) moods.push("great");
    else if (r < 0.8) moods.push("okay");
    else if (r < 0.92) moods.push("bad");
    else moods.push(null);
  }
  return moods;
}

function generate30DayMoods(): { date: Date; mood: MoodValue }[] {
  const data: { date: Date; mood: MoodValue }[] = [];
  for (let i = 29; i >= 0; i--) {
    const r = Math.random();
    let mood: MoodValue = null;
    if (r < 0.55) mood = "great";
    else if (r < 0.8) mood = "okay";
    else if (r < 0.92) mood = "bad";
    data.push({ date: subDays(new Date(), i), mood });
  }
  return data;
}

export default function SeniorMoodTrendsCard() {
  const [moods7] = useState(generate7DayMoods);
  const [moods30] = useState(generate30DayMoods);

  const avg7 = useMemo(() => {
    const scores = moods7.map(moodScore).filter((s): s is number => s !== null);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }, [moods7]);

  const avg7Label = avg7 ? (avg7 <= 1.5 ? "😊 Great" : avg7 <= 2.3 ? "😐 Okay" : "😟 Not great") : "No data";

  // SVG chart for 30-day view
  const svgWidth = 320;
  const svgHeight = 100;
  const padding = { top: 10, bottom: 10, left: 10, right: 10 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const points30 = moods30
    .map((d, i) => {
      const score = moodScore(d.mood);
      if (score === null) return null;
      const x = padding.left + (i / 29) * chartW;
      const y = padding.top + ((score - 1) / 2) * chartH;
      return { x, y, mood: d.mood, date: d.date };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const linePath = points30.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <Tabs defaultValue="7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black">Mood Trends</h3>
          <TabsList className="h-8">
            <TabsTrigger value="7" className="text-xs px-3 h-7">7 Days</TabsTrigger>
            <TabsTrigger value="30" className="text-xs px-3 h-7">30 Days</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="7">
          <div className="flex justify-between">
            {moods7.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{moodEmoji(m)}</span>
                <span className="text-[11px] text-muted-foreground">{DAYS_7[i]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Average this week: {avg7Label} ({avg7 ? `${avg7.toFixed(1)} / 3 score` : "—"})
          </p>
        </TabsContent>

        <TabsContent value="30">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ maxHeight: 120 }}>
            {/* Grid lines */}
            {[1, 2, 3].map((score) => {
              const y = padding.top + ((score - 1) / 2) * chartH;
              return <line key={score} x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" />;
            })}
            {/* Line */}
            {linePath && <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />}
            {/* Dots */}
            {points30.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={moodColor(p.mood)} stroke="hsl(var(--card))" strokeWidth="2" />
            ))}
            {/* Labels */}
            <text x={padding.left} y={padding.top - 2} fontSize="8" fill="hsl(var(--muted-foreground))">Great</text>
            <text x={padding.left} y={svgHeight - 2} fontSize="8" fill="hsl(var(--muted-foreground))">Bad</text>
          </svg>
          <p className="text-xs text-muted-foreground mt-2">Average this month: 😊 Great — best month in 3 months</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
