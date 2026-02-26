import { useState, useEffect } from "react";
import { getReminderSettings, upsertReminderSettings } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Bell, User } from "lucide-react";

interface Props {
  seniorId: string;
  onClose: () => void;
}

export default function ReminderSettingsModal({ seniorId, onClose }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [gracePeriod, setGracePeriod] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getReminderSettings(seniorId).then(({ data }) => {
      if (data) {
        setReminderTime(data.reminder_time.slice(0, 5));
        setGracePeriod(data.grace_period_hours);
      }
    });
  }, [seniorId]);

  const handleSave = async () => {
    setSaving(true);
    await upsertReminderSettings(seniorId, reminderTime, gracePeriod);
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-t-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Settings</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-base font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Display Name
            </label>
            <div className="flex gap-2">
              <Input
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setNameSaved(false); }}
                maxLength={100}
                className="h-12 rounded-xl text-base"
                placeholder="Your name"
              />
              <Button
                onClick={async () => {
                  const trimmed = fullName.trim();
                  if (!trimmed || trimmed === profile?.full_name) return;
                  setNameSaving(true);
                  await supabase.from("profiles").update({ full_name: trimmed }).eq("user_id", seniorId);
                  await refreshProfile();
                  setNameSaving(false);
                  setNameSaved(true);
                }}
                disabled={nameSaving || nameSaved || fullName.trim() === profile?.full_name || !fullName.trim()}
                className="h-12 rounded-xl px-5 font-bold shrink-0"
              >
                {nameSaved ? "✓" : nameSaving ? "…" : "Save"}
              </Button>
            </div>
          </div>

          <hr className="border-border" />
          <div>
            <label className="block text-base font-semibold mb-2">Daily reminder time</label>
            <p className="text-sm text-muted-foreground mb-3">When should we remind you to check in?</p>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full h-14 text-2xl font-bold text-center rounded-xl border-2 border-border bg-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-base font-semibold mb-2">
              Alert family after <span className="text-primary">{gracePeriod} hour{gracePeriod !== 1 ? "s" : ""}</span>
            </label>
            <p className="text-sm text-muted-foreground mb-3">If no check-in after this time, your caregiver will be notified</p>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  onClick={() => setGracePeriod(h)}
                  className={`flex-1 h-12 rounded-xl border-2 font-bold transition-all ${
                    gracePeriod === h
                      ? "border-primary bg-secondary text-secondary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="w-full h-14 text-base font-bold rounded-xl gradient-btn shadow-btn border-0"
          >
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
