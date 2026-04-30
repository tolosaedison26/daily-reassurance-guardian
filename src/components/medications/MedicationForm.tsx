import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import {
  PillReminder,
  PillFrequency,
  FREQUENCY_OPTIONS,
  PILL_COLORS,
  getDefaultTimes,
} from "@/types/pill-reminders";

interface Props {
  initial?: PillReminder | null;
  onSave: (data: {
    medication_name: string;
    dosage: string;
    frequency: PillFrequency;
    times: string[];
    notes: string;
    color: string;
  }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export default function MedicationForm({ initial, onSave, onCancel, saving }: Props) {
  const [name, setName] = useState(initial?.medication_name || "");
  const [dosage, setDosage] = useState(initial?.dosage || "");
  const [frequency, setFrequency] = useState<PillFrequency>(initial?.frequency || "daily");
  const [times, setTimes] = useState<string[]>(initial?.times?.length ? initial.times : getDefaultTimes("daily"));
  const [notes, setNotes] = useState(initial?.notes || "");
  const [color, setColor] = useState(initial?.color || "blue");

  // Adjust times array when frequency changes (only if not editing existing)
  useEffect(() => {
    if (!initial) {
      setTimes(getDefaultTimes(frequency));
    }
  }, [frequency, initial]);

  const handleFrequencyChange = (f: PillFrequency) => {
    setFrequency(f);
    if (initial) {
      // When editing, adjust times array length to match new frequency
      const needed = FREQUENCY_OPTIONS.find((o) => o.value === f)?.timeCount || 0;
      if (needed === 0) {
        setTimes([]);
      } else if (times.length < needed) {
        const defaults = getDefaultTimes(f);
        setTimes([...times, ...defaults.slice(times.length, needed)]);
      } else if (times.length > needed) {
        setTimes(times.slice(0, needed));
      }
    }
  };

  const updateTime = (index: number, value: string) => {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const timeCount = FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.timeCount || 0;

  const canSave = name.trim().length > 0 && (timeCount === 0 || times.length === timeCount);

  const handleSubmit = async () => {
    if (!canSave || saving) return;
    await onSave({
      medication_name: name.trim(),
      dosage: dosage.trim(),
      frequency,
      times: times.slice(0, timeCount),
      notes: notes.trim(),
      color,
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{initial ? "Edit Medication" : "Add Medication"}</h3>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted" aria-label="Cancel">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Medication name */}
      <div>
        <Label className="text-sm font-semibold">Medication Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Metformin"
          className="mt-1 h-12 text-base rounded-xl"
          maxLength={100}
        />
      </div>

      {/* Dosage */}
      <div>
        <Label className="text-sm font-semibold">Dosage (optional)</Label>
        <Input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="e.g. 500mg, 1 tablet, 2 puffs"
          className="mt-1 h-12 text-base rounded-xl"
          maxLength={50}
        />
      </div>

      {/* Frequency */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">How often?</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFrequencyChange(opt.value)}
              className={`py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                frequency === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time pickers */}
      {timeCount > 0 && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">
            {timeCount === 1 ? "What time?" : `Set ${timeCount} times`}
          </Label>
          <div className="space-y-2">
            {Array.from({ length: timeCount }).map((_, i) => {
              const timeVal = times[i] || "08:00";
              const [hStr, mStr] = timeVal.split(":");
              let h = parseInt(hStr, 10);
              const m = mStr || "00";
              const period = h >= 12 ? "PM" : "AM";
              if (h === 0) h = 12;
              else if (h > 12) h -= 12;

              return (
                <div key={i} className="flex items-center gap-2">
                  {timeCount > 1 && (
                    <span className="text-xs font-bold text-muted-foreground w-14 shrink-0">
                      Dose {i + 1}
                    </span>
                  )}
                  <select
                    value={h}
                    onChange={(e) => {
                      const newH = parseInt(e.target.value, 10);
                      const h24 = period === "PM" ? (newH === 12 ? 12 : newH + 12) : newH === 12 ? 0 : newH;
                      updateTime(i, `${String(h24).padStart(2, "0")}:${m}`);
                    }}
                    className="h-12 rounded-xl border border-border bg-background px-3 text-base font-semibold flex-1"
                  >
                    {Array.from({ length: 12 }, (_, j) => j + 1).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <span className="text-lg font-bold">:</span>
                  <select
                    value={m}
                    onChange={(e) => {
                      const h24 = period === "PM" ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
                      updateTime(i, `${String(h24).padStart(2, "0")}:${e.target.value}`);
                    }}
                    className="h-12 rounded-xl border border-border bg-background px-3 text-base font-semibold flex-1"
                  >
                    {["00", "15", "30", "45"].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <select
                    value={period}
                    onChange={(e) => {
                      const newPeriod = e.target.value;
                      let h24 = h;
                      if (newPeriod === "PM") h24 = h === 12 ? 12 : h + 12;
                      else h24 = h === 12 ? 0 : h;
                      updateTime(i, `${String(h24).padStart(2, "0")}:${m}`);
                    }}
                    className="h-12 rounded-xl border border-border bg-background px-3 text-base font-semibold w-20"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Color picker */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Color</Label>
        <div className="flex gap-2">
          {PILL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-10 h-10 rounded-full ${c.stripe} transition-all ${
                color === c.value ? "ring-2 ring-offset-2 ring-primary" : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`${c.value} color`}
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-semibold">Notes (optional)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Take with food, avoid grapefruit"
          rows={2}
          maxLength={200}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSubmit}
        disabled={!canSave || saving}
        className="w-full h-14 text-lg font-black rounded-2xl border-0"
        style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : initial ? (
          "Save Changes"
        ) : (
          "Add Medication"
        )}
      </Button>
    </div>
  );
}
