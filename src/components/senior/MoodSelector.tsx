import { cn } from "@/lib/utils";

const MOODS = [
  { value: "great" as const, emoji: "😊", label: "Great" },
  { value: "okay" as const, emoji: "😐", label: "Okay" },
  { value: "bad" as const, emoji: "😔", label: "Not great" },
];

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (mood: "great" | "okay" | "bad") => void;
  disabled?: boolean;
}

export default function MoodSelector({ selected, onSelect, disabled }: MoodSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-lg font-semibold text-foreground mb-4 text-center" style={{ fontSize: "18px", lineHeight: "28px" }}>
        How are you feeling today?
      </p>
      <div className="grid grid-cols-3 gap-4">
        {MOODS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => !disabled && onSelect(mood.value)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 transition-all",
              "min-h-[88px] min-w-[88px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected === mood.value
                ? "border-primary bg-primary/10 scale-105 shadow-md"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Mood: ${mood.label}`}
            aria-pressed={selected === mood.value}
          >
            <span className="text-4xl mb-1">{mood.emoji}</span>
            <span className="text-sm font-semibold text-foreground" style={{ fontSize: "16px" }}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
