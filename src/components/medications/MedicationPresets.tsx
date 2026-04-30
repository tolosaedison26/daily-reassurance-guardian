import { MEDICATION_PRESETS, PillFrequency, FREQUENCY_OPTIONS } from "@/types/pill-reminders";

interface Props {
  onSelect: (preset: { name: string; dosage: string; frequency: PillFrequency }) => void;
}

export default function MedicationPresets({ onSelect }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground mb-3">Quick Add — Common Medications</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MEDICATION_PRESETS.map((preset) => {
          const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === preset.frequency)?.label || "";
          return (
            <button
              key={preset.name}
              onClick={() => onSelect({ name: preset.name, dosage: preset.dosage, frequency: preset.frequency })}
              className="flex flex-col p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
            >
              <p className="text-sm font-bold truncate">{preset.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {preset.dosage} · {freqLabel}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
