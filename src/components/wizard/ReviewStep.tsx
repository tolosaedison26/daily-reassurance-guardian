import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Loader2, Phone, Mail, Info, Check } from "lucide-react";
import type { SeniorFormData } from "./types";
import { useState } from "react";

const TZ_LABELS: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "America/Anchorage": "AKT",
  "Pacific/Honolulu": "HT",
  UTC: "UTC",
};

interface Props {
  data: SeniorFormData;
  isEdit: boolean;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  onJumpToStep: (step: number) => void;
}

export default function ReviewStep({ data, isEdit, saving, onSave, onBack, onJumpToStep }: Props) {
  const initials = (data.firstName.charAt(0) + data.lastName.charAt(0)).toUpperCase();
  const tzLabel = TZ_LABELS[data.timezone] || data.timezone;
  const [notesExpanded, setNotesExpanded] = useState(false);

  const freqLabel =
    data.frequency === "daily"
      ? "Daily"
      : data.frequency === "weekdays"
      ? "Weekdays only"
      : data.customDays.join(", ");

  const graceLabel =
    data.gracePeriodMinutes >= 60
      ? `${data.gracePeriodMinutes / 60}-hour grace period`
      : `${data.gracePeriodMinutes}-minute grace period`;

  return (
    <div className="space-y-5">
      {/* Section A — Profile */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Senior Profile</h3>
          <button type="button" onClick={() => onJumpToStep(0)} className="text-xs font-medium text-primary hover:underline">
            Edit
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-primary-foreground"
            style={{ background: "hsl(var(--primary))" }}
          >
            {initials}
          </div>
          <div>
            <p className="font-bold text-base">{data.firstName} {data.lastName}</p>
            <p className="text-xs text-muted-foreground">{data.phone} · {data.relationship}</p>
            {data.dateOfBirth && (
              <p className="text-xs text-muted-foreground">Born {data.dateOfBirth}</p>
            )}
          </div>
        </div>
        {data.notes && (
          <div>
            <p className={`text-xs text-muted-foreground ${!notesExpanded ? "line-clamp-2" : ""}`}>
              {data.notes}
            </p>
            {data.notes.length > 100 && (
              <button type="button" onClick={() => setNotesExpanded(!notesExpanded)} className="text-xs text-primary hover:underline mt-1">
                {notesExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section B — Schedule */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Check-in Schedule</h3>
          <button type="button" onClick={() => onJumpToStep(1)} className="text-xs font-medium text-primary hover:underline">
            Edit
          </button>
        </div>
        <p className="text-sm">
          {freqLabel} at {data.reminderHour}:{data.reminderMinute} {data.reminderPeriod} {tzLabel}
        </p>
        <p className="text-sm text-muted-foreground">{graceLabel}</p>
        <div className="flex gap-2">
          <Badge variant={data.moodCheckEnabled ? "default" : "secondary"} className="text-xs">
            Mood check {data.moodCheckEnabled ? "enabled" : "off"}
          </Badge>
          {data.vacationMode && (
            <Badge variant="secondary" className="text-xs">
              Paused {data.vacationFrom} – {data.vacationUntil}
            </Badge>
          )}
        </div>
      </div>

      {/* Section C — Contacts */}
      <div className="bg-muted/40 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Emergency Contacts</h3>
          <button type="button" onClick={() => onJumpToStep(2)} className="text-xs font-medium text-primary hover:underline">
            Edit
          </button>
        </div>
        {data.contacts.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 text-sm">
            <span className="font-bold">{i + 1}.</span>
            <span>{c.name} ({c.relationship || "—"})</span>
            <span className="text-muted-foreground">
              {c.notifyViaSms && <Phone className="w-3 h-3 inline mr-1" />}
              {c.notifyViaEmail && <Mail className="w-3 h-3 inline mr-1" />}
              {c.delayMinutes === 0 ? "Immediate" : `+${c.delayMinutes} min`}
            </span>
          </div>
        ))}
      </div>

      {/* Confirmation notice */}
      {!isEdit ? (
        <div
          className="flex items-start gap-3 rounded-xl p-3 text-sm"
          style={{
            background: "hsl(var(--status-checked) / 0.08)",
            border: "1px solid hsl(var(--status-checked) / 0.2)",
          }}
        >
          <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-checked))" }} />
          <span>
            Once saved, {data.firstName} will receive their first check-in SMS tomorrow at{" "}
            {data.reminderHour}:{data.reminderMinute} {data.reminderPeriod} {tzLabel}.
          </span>
        </div>
      ) : (
        <div
          className="flex items-start gap-3 rounded-xl p-3 text-sm"
          style={{
            background: "hsl(var(--status-pending) / 0.08)",
            border: "1px solid hsl(var(--status-pending) / 0.2)",
          }}
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
          <span>Changes will take effect starting with the next check-in.</span>
        </div>
      )}

      {/* Nav */}
      <div className="flex flex-col-reverse md:flex-row gap-3 justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="w-full md:w-auto gap-1"
          style={!isEdit ? { background: "hsl(var(--status-checked))" } : undefined}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes →" : "Save Senior →"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        You can edit these settings at any time from the senior's profile.
      </p>
    </div>
  );
}
