import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckIn, getTodayCheckIn, getReminderSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { LogOut, Music, Settings, CheckCircle } from "lucide-react";
import SoundPlayer from "@/components/SoundPlayer";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import VoiceRecorder from "@/components/VoiceRecorder";

type CheckInStatus = "checked" | "pending" | "none";

function getStatusConfig(status: CheckInStatus) {
  switch (status) {
    case "checked":
      return {
        color: "hsl(var(--status-checked))",
        bgColor: "hsl(var(--status-checked) / 0.12)",
        ringClass: "animate-pulse-checked",
        emoji: "✅",
        label: "You're checked in!",
        sublabel: "Have a wonderful day 🌿",
      };
    case "pending":
      return {
        color: "hsl(var(--status-pending))",
        bgColor: "hsl(var(--status-pending) / 0.12)",
        ringClass: "animate-pulse-pending",
        emoji: "🌤",
        label: "Good morning!",
        sublabel: "Don't forget to check in today",
      };
    default:
      return {
        color: "hsl(var(--status-none))",
        bgColor: "hsl(220 15% 70% / 0.12)",
        ringClass: "",
        emoji: "☀️",
        label: "Good day!",
        sublabel: "Tap the button to check in",
      };
  }
}

export default function SeniorHome() {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<CheckInStatus>("none");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showSound, setShowSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");

  useEffect(() => {
    if (user) {
      loadTodayStatus();
      loadReminderSettings();
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
      if (now.getHours() >= reminderHour) {
        setStatus("pending");
      } else {
        setStatus("none");
      }
    }
  };

  const loadReminderSettings = async () => {
    if (!user) return;
    const { data } = await getReminderSettings(user.id);
    if (data) setReminderTime(data.reminder_time.slice(0, 5));
  };

  const handleCheckIn = async () => {
    if (!user || status === "checked" || loading) return;
    setLoading(true);
    const { data } = await createCheckIn(user.id);
    if (data) {
      setStatus("checked");
      setJustCheckedIn(true);
      const time = new Date(data.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCheckInTime(time);
      setTimeout(() => setJustCheckedIn(false), 3000);
    }
    setLoading(false);
  };

  const statusConfig = getStatusConfig(status);
  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  if (showSound) {
    return <SoundPlayer onBack={() => setShowSound(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-xl font-bold">Hello, {firstName} 👋</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-full bg-card/70 backdrop-blur-sm shadow-card"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={signOut}
            className="p-3 rounded-full bg-card/70 backdrop-blur-sm shadow-card"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Status Circle */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-8">
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div
            className={`absolute rounded-full ${statusConfig.ringClass}`}
            style={{
              width: 200,
              height: 200,
              backgroundColor: statusConfig.bgColor,
              border: `3px solid ${statusConfig.color}`,
            }}
          />
          {/* Inner circle */}
          <div
            className="relative z-10 flex flex-col items-center justify-center rounded-full animate-bounce-in"
            style={{
              width: 160,
              height: 160,
              backgroundColor: statusConfig.bgColor,
              border: `4px solid ${statusConfig.color}`,
            }}
          >
            <span className="text-5xl mb-1">{statusConfig.emoji}</span>
            {status === "checked" && checkInTime && (
              <span className="text-xs font-semibold" style={{ color: statusConfig.color }}>
                {checkInTime}
              </span>
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-1">{statusConfig.label}</h2>
          <p className="text-muted-foreground text-base">{statusConfig.sublabel}</p>
        </div>

        {/* Check-in confirmation message */}
        {justCheckedIn && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-card border border-border shadow-card animate-bounce-in">
            <CheckCircle className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
            <span className="font-semibold text-sm">Your family knows you're safe 💚</span>
          </div>
        )}

        {/* Big Check-In Button */}
        {status !== "checked" && (
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full max-w-xs h-20 text-xl font-bold rounded-2xl gradient-btn shadow-btn border-0 animate-float"
          >
            {loading ? "Checking in..." : "Check In Now"}
          </Button>
        )}

        {status === "checked" && (
          <div className="w-full max-w-xs flex flex-col gap-3">
            <div
              className="h-20 rounded-2xl flex items-center justify-center gap-3 border-2"
              style={{
                borderColor: "hsl(var(--status-checked))",
                backgroundColor: "hsl(var(--status-checked) / 0.08)",
              }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: "hsl(var(--status-checked))" }} />
              <span className="text-xl font-bold" style={{ color: "hsl(var(--status-checked))" }}>
                Checked In ✓
              </span>
            </div>
            {user && (
              <VoiceRecorder
                seniorId={user.id}
                onSent={() => {}}
              />
            )}
          </div>
        )}
      </div>

      {/* Calm Sounds Button */}
      <div className="px-5 pb-8 pb-safe">
        <button
          onClick={() => setShowSound(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-card"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--accent))" }}
          >
            <Music className="w-6 h-6" style={{ color: "hsl(var(--accent-foreground))" }} />
          </div>
          <div className="text-left">
            <p className="font-bold text-base">Calm Sounds</p>
            <p className="text-muted-foreground text-sm">Rain, Ocean, Forest & more</p>
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
    </div>
  );
}
