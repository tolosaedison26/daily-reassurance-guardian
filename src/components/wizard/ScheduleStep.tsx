import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import TimePicker from "./TimePicker";
import type { SeniorFormData } from "./types";

const TIMEZONES = [
  { label: "Eastern Time (ET)", value: "America/New_York" },
  { label: "Central Time (CT)", value: "America/Chicago" },
  { label: "Mountain Time (MT)", value: "America/Denver" },
  { label: "Pacific Time (PT)", value: "America/Los_Angeles" },
  { label: "Alaska Time (AKT)", value: "America/Anchorage" },
  { label: "Hawaii Time (HT)", value: "Pacific/Honolulu" },
  { label: "GMT / UTC", value: "UTC" },
];

const GRACE_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "2 hrs", value: 120 },
  { label: "4 hrs", value: 240 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  data: SeniorFormData;
  onChange: (patch: Partial<SeniorFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ScheduleStep({ data, onChange, onNext, onBack }: Props) {
  const toggleDay = (day: string) => {
    const days = data.customDays.includes(day)
      ? data.customDays.filter((d) => d !== day)
      : [...data.customDays, day];
    onChange({ customDays: days });
  };

  return (
    <div className="space-y-6">
      {/* Time picker */}
      <div>
        <label className="text-sm font-medium mb-1 block">Reminder Time *</label>
        <TimePicker
          hour={data.reminderHour}
          minute={data.reminderMinute}
          period={data.reminderPeriod}
          onHourChange={(h) => onChange({ reminderHour: h })}
          onMinuteChange={(m) => onChange({ reminderMinute: m })}
          onPeriodChange={(p) => onChange({ reminderPeriod: p })}
        />
        <p className="text-xs text-muted-foreground mt-1">We'll send an SMS at this time every day</p>
      </div>

      {/* Timezone */}
      <div>
        <label className="text-sm font-medium mb-1 block">Timezone *</label>
        <Select value={data.timezone} onValueChange={(v) => onChange({ timezone: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grace period */}
      <div>
        <label className="text-sm font-medium mb-1 block">Grace Period *</label>
        <p className="text-xs text-muted-foreground mb-2">How long to wait after the reminder before marking a missed check-in</p>
        <div className="flex flex-wrap gap-2">
          {GRACE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ gracePeriodMinutes: opt.value })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors",
                data.gracePeriodMinutes === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-input hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="text-sm font-medium mb-1 block">Check-in Frequency *</label>
        <div className="space-y-2 mt-2">
          {[
            { value: "daily" as const, label: "Daily (recommended)" },
            { value: "weekdays" as const, label: "Weekdays only (Mon–Fri)" },
            { value: "custom" as const, label: "Custom days" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                checked={data.frequency === opt.value}
                onChange={() => onChange({ frequency: opt.value })}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        {data.frequency === "custom" && (
          <div className="flex flex-wrap gap-2 mt-3">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  data.customDays.includes(day)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-input hover:bg-muted"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mood check */}
      <div className="flex items-center justify-between py-2">
        <div>
          <label className="text-sm font-medium block">Mood Check</label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.moodCheckEnabled
              ? "Senior will be asked to reply with their mood (1–3)"
              : "Only presence check — no mood question"}
          </p>
        </div>
        <Switch
          checked={data.moodCheckEnabled}
          onCheckedChange={(v) => onChange({ moodCheckEnabled: v })}
        />
      </div>

      {/* Vacation mode */}
      <div>
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="text-sm font-medium block">Vacation / Pause</label>
            <p className="text-xs text-muted-foreground mt-0.5">Temporarily pause check-ins</p>
          </div>
          <Switch
            checked={data.vacationMode}
            onCheckedChange={(v) => onChange({ vacationMode: v })}
          />
        </div>
        {data.vacationMode && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pause from</label>
              <Input
                type="date"
                value={data.vacationFrom}
                onChange={(e) => onChange({ vacationFrom: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pause until</label>
              <Input
                type="date"
                value={data.vacationUntil}
                onChange={(e) => onChange({ vacationUntil: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col-reverse md:flex-row gap-3 justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} className="w-full md:w-auto gap-1">
          Continue → Add Contacts <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
