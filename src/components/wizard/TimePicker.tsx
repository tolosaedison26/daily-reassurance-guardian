import { cn } from "@/lib/utils";

interface TimePickerProps {
  hour: string;
  minute: string;
  period: "AM" | "PM";
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  onPeriodChange: (p: "AM" | "PM") => void;
}

export default function TimePicker({ hour, minute, period, onHourChange, onMinuteChange, onPeriodChange }: TimePickerProps) {
  const handleHour = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    if (n === "" || (parseInt(n) >= 0 && parseInt(n) <= 12)) onHourChange(n);
  };
  const handleMinute = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 2);
    if (n === "" || (parseInt(n) >= 0 && parseInt(n) <= 59)) onMinuteChange(n);
  };

  const boxClass = "w-14 h-12 text-center text-lg font-bold rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex items-center gap-2 justify-center md:justify-start">
      <input
        type="text"
        inputMode="numeric"
        value={hour}
        onChange={(e) => handleHour(e.target.value)}
        onBlur={() => onHourChange(hour.padStart(2, "0"))}
        className={boxClass}
        aria-label="Hour"
      />
      <span className="text-xl font-bold text-muted-foreground">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={minute}
        onChange={(e) => handleMinute(e.target.value)}
        onBlur={() => onMinuteChange(minute.padStart(2, "0"))}
        className={boxClass}
        aria-label="Minute"
      />
      <div className="flex rounded-lg border border-input overflow-hidden">
        {(["AM", "PM"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            className={cn(
              "px-3 h-12 text-sm font-bold transition-colors",
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
