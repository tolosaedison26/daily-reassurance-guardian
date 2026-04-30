import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PillReminder, PillDose, formatTime12h, PILL_COLORS } from "@/types/pill-reminders";
import { CheckCircle2, Clock, SkipForward, Loader2 } from "lucide-react";

interface DoseSlot {
  time: string;
  med: PillReminder;
  dose: PillDose | null;
}

interface Props {
  medications: PillReminder[];
  doses: PillDose[];
  seniorId: string;
  onDoseUpdate: () => void;
}

export default function TodaySchedule({ medications, doses, seniorId, onDoseUpdate }: Props) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Build today's schedule from active medications
  const activeMeds = medications.filter((m) => !m.paused && m.times.length > 0);
  const slots: DoseSlot[] = [];

  for (const med of activeMeds) {
    for (const time of med.times) {
      const existingDose = doses.find(
        (d) => d.pill_reminder_id === med.id && d.scheduled_time === time
      );
      slots.push({ time, med, dose: existingDose });
    }
  }

  // Sort by time
  slots.sort((a, b) => a.time.localeCompare(b.time));

  if (slots.length === 0) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleAction = async (slot: DoseSlot, status: "TAKEN" | "SKIPPED") => {
    const key = `${slot.med.id}-${slot.time}`;
    setActionLoading(key);
    try {
      if (slot.dose) {
        // Update existing
        await supabase
          .from("pill_doses")
          .update({
            status,
            taken_at: status === "TAKEN" ? new Date().toISOString() : null,
          })
          .eq("id", slot.dose.id);
      } else {
        // Insert new
        await supabase.from("pill_doses").insert({
          pill_reminder_id: slot.med.id,
          senior_id: seniorId,
          scheduled_date: todayStr,
          scheduled_time: slot.time,
          status,
          taken_at: status === "TAKEN" ? new Date().toISOString() : null,
        });
      }
      onDoseUpdate();
      toast({
        title: status === "TAKEN" ? "Marked as taken" : "Skipped",
        description: `${slot.med.medication_name} at ${formatTime12h(slot.time)}`,
      });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const allDone = slots.every((s) => s.dose && s.dose.status !== "PENDING");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Today's Schedule
        </p>
        {allDone && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All done
          </span>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
        {slots.map((slot) => {
          const key = `${slot.med.id}-${slot.time}`;
          const loading = actionLoading === key;
          const status = slot.dose?.status || "PENDING";
          const colorConfig = PILL_COLORS.find((c) => c.value === slot.med.color) || PILL_COLORS[0];

          return (
            <div key={key} className="flex items-center gap-3 p-4 min-h-[64px]">
              {/* Time */}
              <div className="w-20 shrink-0">
                <p className="text-base font-bold">{formatTime12h(slot.time)}</p>
              </div>

              {/* Med info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{slot.med.medication_name}</p>
                {slot.med.dosage && (
                  <span className={`text-xs font-semibold ${colorConfig.text}`}>{slot.med.dosage}</span>
                )}
              </div>

              {/* Status / Actions */}
              <div className="shrink-0 flex items-center gap-1.5">
                {status === "TAKEN" ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                  </span>
                ) : status === "SKIPPED" ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-full">
                    <SkipForward className="w-3.5 h-3.5" /> Skipped
                  </span>
                ) : status === "MISSED" ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-full">
                    Missed
                  </span>
                ) : loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <>
                    <button
                      onClick={() => handleAction(slot, "TAKEN")}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                      style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Take
                    </button>
                    <button
                      onClick={() => handleAction(slot, "SKIPPED")}
                      className="text-xs font-bold text-muted-foreground px-2.5 py-1.5 rounded-full hover:bg-muted transition-colors"
                    >
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
