import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckIn, getTodayCheckIn, getReminderSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/ui/StatusBadge";
import { LogOut, Music, Settings, Bell, ChevronLeft } from "lucide-react";
import SoundPlayer from "@/components/SoundPlayer";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import VoiceRecorder from "@/components/VoiceRecorder";
import EmergencyContacts from "@/components/EmergencyContacts";
import SeniorActivityPanel from "@/components/SeniorActivityPanel";
import InviteCodeCard from "@/components/InviteCodeCard";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import MoodSelector from "@/components/senior/MoodSelector";
import CheckinSuccessScreen from "@/components/senior/CheckinSuccessScreen";
import SeniorWalkthrough from "@/components/senior/SeniorWalkthrough";

type CheckInStatus = "checked" | "pending" | "none";

export default function SeniorHome() {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<CheckInStatus>("none");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showSound, setShowSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMood, setSelectedMood] = useState<"great" | "okay" | "bad" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    if (user) {
      loadTodayStatus();
      loadReminderSettings();
      // Check if first visit
      const walkthroughDone = localStorage.getItem(`walkthrough_completed_${user.id}`);
      if (!walkthroughDone) {
        setShowWalkthrough(true);
      }
    }
  }, [user]);

  const loadTodayStatus = async () => {
    if (!user) return;
    const { data } = await getTodayCheckIn(user.id);
    if (data) {
      setStatus("checked");
      const time = new Date(data.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCheckInTime(time);
    } else {
      const now = new Date();
      const reminderHour = parseInt(reminderTime.split(":")[0]);
      setStatus(now.getHours() >= reminderHour ? "pending" : "none");
    }
  };

  const loadReminderSettings = async () => {
    if (!user) return;
    const { data } = await getReminderSettings(user.id);
    if (data) setReminderTime(data.reminder_time.slice(0, 5));
  };

  const handleCheckIn = async (mood?: "great" | "okay" | "bad") => {
    if (!user || status === "checked" || loading) return;
    setLoading(true);
    const { data } = await createCheckIn(user.id);
    if (data) {
      setStatus("checked");
      if (mood) setSelectedMood(mood);
      const time = new Date(data.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCheckInTime(time);
      setShowSuccess(true);
    }
    setLoading(false);
  };

  const handleMoodSelect = (mood: "great" | "okay" | "bad") => {
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

  // Show walkthrough overlay
  if (showWalkthrough) {
    return (
      <SeniorWalkthrough
        firstName={firstName}
        onComplete={handleWalkthroughComplete}
        onCheckIn={() => handleCheckIn()}
      />
    );
  }

  if (showAccountSettings) return <AccountSettingsPage onBack={() => setShowAccountSettings(false)} />;
  if (showSound) return <SoundPlayer onBack={() => setShowSound(false)} />;
  if (showSuccess) {
    return <CheckinSuccessScreen firstName={firstName} mood={selectedMood} onDismiss={dismissSuccess} />;
  }

  const isChecked = status === "checked";
  const isPending = status === "pending";

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-3xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-8 sm:pt-10 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <span className="text-lg font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
            Daily Guardian
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowActivity(true)}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center relative"
            aria-label="My activity"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowAccountSettings(true)}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center"
            aria-label="Account Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={signOut}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-muted flex items-center justify-center"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-5 pt-6 pb-24 gap-5">

        {/* Greeting */}
        <div className="w-full text-center">
          <h1 className="font-black text-foreground leading-tight" style={{ fontSize: "28px", lineHeight: "36px" }}>
            {isChecked ? `You're all set, ${firstName}!` : `Good morning, ${firstName}!`} 👋
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "18px", lineHeight: "28px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex justify-center">
          <StatusBadge
            status={isChecked ? "safe" : isPending ? "pending" : "paused"}
          />
        </div>

        {/* Overdue warning */}
        {isPending && (
          <div
            className="w-full rounded-2xl p-4 border text-center"
            style={{
              background: "hsl(var(--status-pending) / 0.06)",
              borderColor: "hsl(var(--status-pending) / 0.25)",
            }}
          >
            <p className="font-semibold" style={{ fontSize: "16px", color: "hsl(var(--status-pending))" }}>
              Your family is waiting to hear from you.
            </p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>
              Please tap the button below when you see this.
            </p>
          </div>
        )}

        {/* Checked-in state */}
        {isChecked ? (
          <div
            className="w-full rounded-2xl p-6 border text-center"
            style={{
              background: "hsl(var(--status-checked) / 0.06)",
              borderColor: "hsl(var(--status-checked) / 0.25)",
            }}
          >
            <p className="text-4xl mb-3">✅</p>
            <p className="font-black" style={{ fontSize: "22px", color: "hsl(var(--status-checked))" }}>
              You're all checked in!
            </p>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "18px", lineHeight: "28px" }}>
              You checked in at {checkInTime} {selectedMood === "great" ? "😊" : selectedMood === "okay" ? "😐" : selectedMood === "bad" ? "😔" : ""}
            </p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>
              See you tomorrow!
            </p>
          </div>
        ) : (
          <>
            {/* BIG CHECK-IN BUTTON */}
            <Button
              onClick={() => {
                setShowMoodSelector(true);
                handleCheckIn();
              }}
              disabled={loading}
              className="w-full rounded-2xl border-0 shadow-btn font-bold"
              style={{
                minHeight: "80px",
                fontSize: "22px",
                background: "hsl(var(--status-checked))",
                color: "#fff",
              }}
            >
              {loading ? "Checking in…" : "✓  I'M OKAY"}
            </Button>

            {/* Mood selector */}
            <MoodSelector
              selected={selectedMood}
              onSelect={handleMoodSelect}
              disabled={loading}
            />
          </>
        )}

        {/* Voice message (post check-in) */}
        {isChecked && user && (
          <div className="w-full">
            <VoiceRecorder seniorId={user.id} onSent={() => {}} />
          </div>
        )}

        {/* Invite code */}
        {user && <InviteCodeCard seniorId={user.id} />}

        {/* Emergency Contacts - read-only for seniors */}
        {user && <EmergencyContacts userId={user.id} />}

        {/* Calm Sounds */}
        <button
          onClick={() => setShowSound(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card"
          style={{ minHeight: "64px" }}
        >
          <div
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--accent))" }}
          >
            <Music className="w-5 h-5" style={{ color: "hsl(var(--accent-foreground))" }} />
          </div>
          <div className="text-left">
            <p className="font-bold" style={{ fontSize: "18px" }}>Calm Sounds</p>
            <p className="text-muted-foreground" style={{ fontSize: "16px" }}>Rain, Ocean, Forest &amp; more</p>
          </div>
          <span className="ml-auto text-muted-foreground text-lg">›</span>
        </button>
      </div>

      {showSettings && (
        <ReminderSettingsModal
          seniorId={user?.id || ""}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showActivity && user && (
        <SeniorActivityPanel
          seniorId={user.id}
          onClose={() => setShowActivity(false)}
        />
      )}
    </div>
  );
}
