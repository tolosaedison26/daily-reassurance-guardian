import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { LogOut, Music, Settings, Bell, ChevronLeft } from "lucide-react";
import SoundPlayer from "@/components/SoundPlayer";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import VoiceRecorder from "@/components/VoiceRecorder";
import SeniorActivityPanel from "@/components/SeniorActivityPanel";
import InviteCodeCard from "@/components/InviteCodeCard";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import MoodSelector from "@/components/senior/MoodSelector";
import CheckinSuccessScreen from "@/components/senior/CheckinSuccessScreen";
import SeniorWalkthrough from "@/components/senior/SeniorWalkthrough";
import SeniorEmergencyContactsCard from "@/components/senior/SeniorEmergencyContactsCard";

type CheckInStatus = "checked" | "pending" | "none";

export default function SeniorHome() {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<CheckInStatus>("none");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showSound, setShowSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMood, setSelectedMood] = useState<"great" | "okay" | "not-great" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [seniorRecordId, setSeniorRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSeniorRecord();
      const walkthroughDone = localStorage.getItem(`walkthrough_completed_${user.id}`);
      if (!walkthroughDone) {
        setShowWalkthrough(true);
      }
    }
  }, [user]);

  const loadSeniorRecord = async () => {
    if (!user) return;
    // Find the seniors record linked to this user
    const { data: senior } = await supabase
      .from("seniors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (senior) {
      setSeniorRecordId(senior.id);
      await loadTodayStatus(senior.id);
    } else {
      // No senior record yet — check if awaiting
      setStatus("none");
    }
  };

  const loadTodayStatus = async (sId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("check_ins")
      .select("*")
      .eq("senior_id", sId)
      .eq("check_date", today)
      .maybeSingle();

    if (data?.status === "SAFE") {
      setStatus("checked");
      if (data.checked_in_at) {
        const time = new Date(data.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setCheckInTime(time);
      }
      if (data.mood) setSelectedMood(data.mood as any);
    } else {
      const now = new Date();
      const reminderHour = parseInt(reminderTime.split(":")[0]);
      setStatus(now.getHours() >= reminderHour ? "pending" : "none");
    }
  };

  const handleCheckIn = async (mood?: "great" | "okay" | "not-great") => {
    if (!user || !seniorRecordId || status === "checked" || loading) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("check_ins")
      .upsert(
        {
          senior_id: seniorRecordId,
          check_date: today,
          status: "SAFE",
          mood: mood || null,
          checked_in_at: new Date().toISOString(),
        },
        { onConflict: "senior_id,check_date" }
      )
      .select()
      .single();

    if (data) {
      setStatus("checked");
      if (mood) setSelectedMood(mood);
      const time = new Date(data.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCheckInTime(time);
      setShowSuccess(true);
    }
    setLoading(false);
  };

  const handleMoodSelect = (mood: "great" | "okay" | "not-great") => {
    setSelectedMood(mood);
    if (status !== "checked") {
      handleCheckIn(mood);
    }
  };

  const dismissSuccess = useCallback(() => {
    setShowSuccess(false);
    setShowMoodSelector(false);
  }, []);

  const handleWalkthroughComplete = () => {
    if (user) {
      localStorage.setItem(`walkthrough_completed_${user.id}`, "true");
    }
    setShowWalkthrough(false);
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  if (showWalkthrough) {
    return (
      <SeniorWalkthrough
        firstName={firstName}
        seniorId={seniorRecordId || undefined}
        onComplete={handleWalkthroughComplete}
        onCheckIn={() => handleCheckIn()}
      />
    );
  }

  if (showAccountSettings) return <AccountSettingsPage onBack={() => setShowAccountSettings(false)} />;

  if (showSound) {
    return (
      <div className="min-h-screen bg-background max-w-3xl mx-auto w-full">
        <div className="px-4 pt-4">
          <button onClick={() => setShowSound(false)} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors" style={{ minHeight: "48px" }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <SoundPlayer onBack={() => setShowSound(false)} />
      </div>
    );
  }

  if (showSuccess) {
    return <CheckinSuccessScreen firstName={firstName} mood={selectedMood} onDismiss={dismissSuccess} />;
  }

  const isChecked = status === "checked";
  const isPending = status === "pending";

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between px-4 sm:px-5 pt-8 sm:pt-10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <span className="text-lg font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>Daily Guardian</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowActivity(true)} className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center relative" aria-label="My activity">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={() => setShowAccountSettings(true)} className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center" aria-label="Account Settings">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={signOut} className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center" aria-label="Sign out">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-5 pt-6 pb-24 gap-5">
        <div className="w-full text-center">
          <h1 className="font-black text-foreground leading-tight" style={{ fontSize: "28px", lineHeight: "36px" }}>
            {isChecked ? `You're all set, ${firstName}!` : `Good morning, ${firstName}!`} 👋
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "18px", lineHeight: "28px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="flex justify-center">
          <StatusBadge status={isChecked ? "safe" : isPending ? "pending" : "paused"} />
        </div>

        {isPending && (
          <div className="w-full rounded-2xl p-4 border text-center" style={{ background: "hsl(var(--status-pending) / 0.06)", borderColor: "hsl(var(--status-pending) / 0.25)" }}>
            <p className="font-semibold" style={{ fontSize: "16px", color: "hsl(var(--status-pending))" }}>Your family is waiting to hear from you.</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>Please tap the button below when you see this.</p>
          </div>
        )}

        {isChecked ? (
          <div className="w-full rounded-2xl p-6 border text-center" style={{ background: "hsl(var(--status-checked) / 0.06)", borderColor: "hsl(var(--status-checked) / 0.25)" }}>
            <p className="text-4xl mb-3">✅</p>
            <p className="font-black" style={{ fontSize: "22px", color: "hsl(var(--status-checked))" }}>You're all checked in!</p>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "18px", lineHeight: "28px" }}>
              You checked in at {checkInTime} {selectedMood === "great" ? "😊" : selectedMood === "okay" ? "😐" : selectedMood === "not-great" ? "😔" : ""}
            </p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>See you tomorrow!</p>
          </div>
        ) : (
          <>
            <Button
              onClick={() => { setShowMoodSelector(true); handleCheckIn(); }}
              disabled={loading}
              className="w-full rounded-2xl border-0 shadow-btn font-bold"
              style={{ minHeight: "80px", fontSize: "22px", background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              {loading ? "Checking in…" : "✓  I'M OKAY"}
            </Button>
            <MoodSelector selected={selectedMood as any} onSelect={handleMoodSelect as any} disabled={loading} />
          </>
        )}

        {seniorRecordId && (
          <SeniorEmergencyContactsCard seniorId={seniorRecordId} onViewSettings={() => setShowAccountSettings(true)} />
        )}

        {isChecked && seniorRecordId && (
          <div className="w-full">
            <VoiceRecorder seniorId={seniorRecordId} onSent={() => {}} />
          </div>
        )}

        {seniorRecordId && <InviteCodeCard seniorId={seniorRecordId} />}

        <button onClick={() => setShowSound(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card" style={{ minHeight: "64px" }}>
          <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--accent))" }}>
            <Music className="w-5 h-5" style={{ color: "hsl(var(--accent-foreground))" }} />
          </div>
          <div className="text-left">
            <p className="font-bold" style={{ fontSize: "18px" }}>Calm Sounds</p>
            <p className="text-muted-foreground" style={{ fontSize: "16px" }}>Rain, Ocean, Forest &amp; more</p>
          </div>
          <span className="ml-auto text-muted-foreground text-lg">›</span>
        </button>
      </div>

      {showSettings && <ReminderSettingsModal seniorId={seniorRecordId || ""} onClose={() => setShowSettings(false)} />}
      {showActivity && seniorRecordId && <SeniorActivityPanel seniorId={seniorRecordId} onClose={() => setShowActivity(false)} />}
    </div>
  );
}
