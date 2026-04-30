import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Loader2 } from "lucide-react";
import { PillReminder, PillDose, PillFrequency, getDefaultTimes } from "@/types/pill-reminders";
import MedicationCard from "@/components/medications/MedicationCard";
import MedicationForm from "@/components/medications/MedicationForm";
import MedicationPresets from "@/components/medications/MedicationPresets";
import TodaySchedule from "@/components/medications/TodaySchedule";

const MAX_MEDICATIONS = 10;

export default function MedicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<PillReminder[]>([]);
  const [doses, setDoses] = useState<PillDose[]>([]);
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<PillReminder | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [presetData, setPresetData] = useState<{ name: string; dosage: string; frequency: PillFrequency } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: senior } = await supabase
      .from("seniors")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!senior) {
      setLoading(false);
      return;
    }
    setSeniorId(senior.id);

    const todayStr = new Date().toISOString().split("T")[0];

    const [{ data: meds }, { data: todayDoses }] = await Promise.all([
      supabase
        .from("pill_reminders")
        .select("*")
        .eq("senior_id", senior.id)
        .order("created_at"),
      supabase
        .from("pill_doses")
        .select("*")
        .eq("senior_id", senior.id)
        .eq("scheduled_date", todayStr),
    ]);

    setMedications((meds as PillReminder[]) || []);
    setDoses((todayDoses as PillDose[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: {
    medication_name: string;
    dosage: string;
    frequency: PillFrequency;
    times: string[];
    notes: string;
    color: string;
  }) => {
    if (!seniorId) return;
    setSaving(true);
    try {
      if (editingMed) {
        const { error } = await supabase
          .from("pill_reminders")
          .update(data)
          .eq("id", editingMed.id);
        if (error) throw error;
        toast({ title: "Medication updated" });
      } else {
        const { error } = await supabase
          .from("pill_reminders")
          .insert({ ...data, senior_id: seniorId });
        if (error) throw error;
        toast({ title: "Medication added" });
      }
      setShowForm(false);
      setEditingMed(null);
      setPresetData(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("pill_reminders").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Medication removed" });
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  const handleTogglePause = async (med: PillReminder, paused: boolean) => {
    try {
      const { error } = await supabase
        .from("pill_reminders")
        .update({ paused })
        .eq("id", med.id);
      if (error) throw error;
      toast({ title: paused ? "Medication paused" : "Medication resumed" });
      await loadData();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handlePresetSelect = (preset: { name: string; dosage: string; frequency: PillFrequency }) => {
    setPresetData(preset);
    setShowPresets(false);
    setShowForm(true);
  };

  const handleAddClick = () => {
    if (medications.length >= MAX_MEDICATIONS) {
      toast({ title: `Maximum ${MAX_MEDICATIONS} medications`, variant: "destructive" });
      return;
    }
    setEditingMed(null);
    setPresetData(null);
    setShowPresets(true);
    setShowForm(false);
  };

  const handleEditClick = (med: PillReminder) => {
    setEditingMed(med);
    setPresetData(null);
    setShowPresets(false);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMed(null);
    setPresetData(null);
    setShowPresets(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Build initial values for form when using preset
  const formInitial = editingMed
    ? editingMed
    : presetData
    ? ({
        medication_name: presetData.name,
        dosage: presetData.dosage,
        frequency: presetData.frequency,
        times: getDefaultTimes(presetData.frequency),
        notes: null,
        color: "blue",
        paused: false,
      } as unknown as PillReminder)
    : null;

  return (
    <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6 gap-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-black text-foreground">Medications</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Manage your daily medications and track doses.
          </p>
        </div>

        {/* Today's schedule */}
        {seniorId && (
          <TodaySchedule
            medications={medications}
            doses={doses}
            seniorId={seniorId}
            onDoseUpdate={loadData}
          />
        )}

        {/* Medication list */}
        {medications.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Your Medications ({medications.length}/{MAX_MEDICATIONS})
            </p>
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id}>
                  <MedicationCard
                    med={med}
                    onEdit={() => handleEditClick(med)}
                    onDelete={() => setDeleteConfirm(med.id)}
                    onTogglePause={(paused) => handleTogglePause(med, paused)}
                  />
                  {/* Delete confirmation */}
                  {deleteConfirm === med.id && (
                    <div className="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Remove {med.medication_name}?
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-sm font-bold text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="text-sm font-bold text-white px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        {showPresets && !showForm && (
          <div className="space-y-3">
            <MedicationPresets onSelect={handlePresetSelect} />
            <button
              onClick={() => {
                setShowPresets(false);
                setShowForm(true);
              }}
              className="w-full text-sm font-bold text-primary hover:underline underline-offset-4 py-2"
            >
              Or add a custom medication
            </button>
            <button
              onClick={handleCancelForm}
              className="w-full text-sm font-semibold text-muted-foreground hover:underline underline-offset-4 py-1"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <MedicationForm
            initial={formInitial}
            onSave={handleSave}
            onCancel={handleCancelForm}
            saving={saving}
          />
        )}

        {/* Add button */}
        {!showForm && !showPresets && medications.length < MAX_MEDICATIONS && (
          <button
            onClick={handleAddClick}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-primary">
              Add Medication ({medications.length}/{MAX_MEDICATIONS})
            </span>
          </button>
        )}

        {/* Empty state */}
        {medications.length === 0 && !showForm && !showPresets && (
          <div className="text-center py-10">
            <Pill className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-lg font-bold text-foreground">No medications added yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your medications to track your daily doses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
