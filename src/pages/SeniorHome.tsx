import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckIn, getTodayCheckIn, getReminderSettings } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Music, Settings, Bell, Phone } from "lucide-react";
import SoundPlayer from "@/components/SoundPlayer";
import ReminderSettingsModal from "@/components/ReminderSettingsModal";
import VoiceRecorder from "@/components/VoiceRecorder";
import EmergencyContacts from "@/components/EmergencyContacts";
import SeniorActivityPanel from "@/components/SeniorActivityPanel";
import InviteCodeCard from "@/components/InviteCodeCard";
import AccountSettingsPage from "@/pages/AccountSettingsPage";

type CheckInStatus = "checked" | "pending" | "none";

export default function SeniorHome() {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<CheckInStatus>("none");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showSound, setShowSound] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const emergencyLinkRef = useRef<HTMLAnchorElement>(null);

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
      setStatus(now.getHours() >= reminderHour ? "pending" : "none");
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
      setTimeout(() => setJustCheckedIn(false), 3500);
    }
    setLoading(false);
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Friend";

  if (showAccountSettings) return <AccountSettingsPage onBack={() => setShowAccountSettings(false)} />;
  if (showSound) return <SoundPlayer onBack={() => setShowSound(false)} />;

  const isChecked = status === "checked";
  const isPending = status === "pending";

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-3xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <span className="text-lg font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
            Daily Guardian
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowActivity(true)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative"
            aria-label="My activity"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowAccountSettings(true)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Account Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-6 pb-10 gap-4">

        {/* Greeting */}
        <div className="w-full text-center">
          <h1 className="text-3xl font-black text-foreground leading-tight">
            Hi {firstName}! 👋
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Status card */}
        <div
          className="w-full rounded-3xl p-6 shadow-card border border-border text-center animate-bounce-in"
          style={{
            background: isChecked
              ? "hsl(142 60% 40% / 0.06)"
              : isPending
              ? "hsl(28 95% 54% / 0.06)"
              : "hsl(var(--card))",
            borderColor: isChecked
              ? "hsl(142 60% 40% / 0.25)"
              : isPending
              ? "hsl(28 95% 54% / 0.25)"
              : "hsl(var(--border))",
          }}
        >
          {isChecked ? (
            <>
              <p className="text-3xl mb-3">✅</p>
              <p className="text-lg font-black" style={{ color: "hsl(var(--status-checked))" }}>
                You're all checked in!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Checked in at {checkInTime} · Your family knows you're safe 💚
              </p>
            </>
          ) : isPending ? (
            <>
              <p className="text-3xl mb-3">⏰</p>
              <p className="text-lg font-black text-foreground">
                Time to check in!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You{" "}
                <span className="font-bold" style={{ color: "hsl(var(--status-pending))" }}>
                  have not
                </span>{" "}
                checked in yet today. Tap the button below!
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl mb-3">🌅</p>
              <p className="text-lg font-black text-foreground">Good morning!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your daily check-in reminder is at {reminderTime}
              </p>
            </>
          )}
        </div>

        {/* Just checked in toast */}
        {justCheckedIn && (
          <div className="w-full rounded-2xl bg-card border border-border shadow-card p-4 flex items-center gap-3 animate-bounce-in">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-sm">Check-in complete!</p>
              <p className="text-xs text-muted-foreground">Your family has been notified you're safe.</p>
            </div>
          </div>
        )}

        {/* Big CTA button */}
        {!isChecked && (
          <Button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full h-14 text-lg font-black rounded-2xl border-0 shadow-btn animate-float"
            style={{
              background: "hsl(var(--status-checked))",
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? "Checking in…" : "✓  Check In Now"}
          </Button>
        )}

        {/* Voice message (post check-in) */}
        {isChecked && user && (
          <div className="w-full">
            <VoiceRecorder seniorId={user.id} onSent={() => {}} />
          </div>
        )}

        {/* Invite code */}
        {user && <InviteCodeCard seniorId={user.id} />}

        {/* Emergency 911 */}
        <a ref={emergencyLinkRef} href="tel:911" className="hidden" aria-hidden="true" />
        <button
          onClick={() => setShowEmergencyDialog(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border shadow-card"
          style={{
            background: "hsl(0 70% 50% / 0.06)",
            borderColor: "hsl(0 70% 50% / 0.25)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(0 70% 50%)" }}
          >
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-base" style={{ color: "hsl(0 70% 50%)" }}>Emergency 911</p>
            <p className="text-muted-foreground text-sm">Tap to call for immediate help</p>
          </div>
          <span className="ml-auto text-muted-foreground text-lg">›</span>
        </button>

        {/* Emergency Contacts */}
        {user && <EmergencyContacts userId={user.id} />}

        {/* Calm Sounds */}
        <button
          onClick={() => setShowSound(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-card"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--accent))" }}
          >
            <Music className="w-5 h-5" style={{ color: "hsl(var(--accent-foreground))" }} />
          </div>
          <div className="text-left">
            <p className="font-bold text-base">Calm Sounds</p>
            <p className="text-muted-foreground text-sm">Rain, Ocean, Forest &amp; more</p>
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

      <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              🚨 Call 911?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              This will dial emergency services. Only use this for real emergencies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => emergencyLinkRef.current?.click()}
              className="w-full h-14 text-lg font-black rounded-xl border-0"
              style={{ background: "hsl(0 70% 50%)", color: "#fff" }}
            >
              Yes, Call 911
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-xl mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
