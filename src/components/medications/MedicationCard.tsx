import { PillReminder, PILL_COLORS, FREQUENCY_OPTIONS, formatTime12h } from "@/types/pill-reminders";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  med: PillReminder;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePause: (paused: boolean) => void;
}

export default function MedicationCard({ med, onEdit, onDelete, onTogglePause }: Props) {
  const colorConfig = PILL_COLORS.find((c) => c.value === med.color) || PILL_COLORS[0];
  const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === med.frequency)?.label || med.frequency;
  const timesDisplay = med.times.length > 0 ? med.times.map(formatTime12h).join(", ") : "No set time";

  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex transition-opacity ${
        med.paused ? "opacity-60" : ""
      }`}
    >
      {/* Color stripe */}
      <div className={`w-1.5 shrink-0 ${colorConfig.stripe}`} />

      <div className="flex-1 p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold truncate">{med.medication_name}</h3>
              {med.dosage && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorConfig.bg} ${colorConfig.text}`}>
                  {med.dosage}
                </span>
              )}
              {med.paused && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  PAUSED
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {freqLabel} · {timesDisplay}
            </p>
            {med.notes && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{med.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Edit medication"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Delete medication"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Pause toggle */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-sm font-medium text-muted-foreground">
            {med.paused ? "Paused — no reminders" : "Active"}
          </span>
          <Switch
            checked={!med.paused}
            onCheckedChange={(checked) => onTogglePause(!checked)}
            aria-label={med.paused ? "Resume medication" : "Pause medication"}
          />
        </div>
      </div>
    </div>
  );
}
