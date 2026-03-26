import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Music, ChevronLeft, MessageSquare, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { triggerSmsWebhook } from "@/lib/supabase-helpers";
import SoundPlayer from "@/components/SoundPlayer";
import CheckinSuccessScreen from "@/components/senior/CheckinSuccessScreen";
import SeniorWalkthrough from "@/components/senior/SeniorWalkthrough";
import SeniorEmergencyContactsCard from "@/components/senior/SeniorEmergencyContactsCard";
import CheckInTimeEditor from "@/components/CheckInTimeEditor";

type CheckInStatus = "checked" | "pending" | "none";

export default function SeniorHome() {
  const { user, profile, signOut } = useAuth();
  const [status, setStatus] = useState<CheckInStatus>("none");
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showSound, setShowSound] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMood, setSelectedMood] = useState<"great" | "okay" | "not-great" | null>(null);
  const [loading, setLoading] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [walkthroughDismissed, setWalkthroughDismissed] = useState(false);
  const [seniorRecordId, setSeniorRecordId] = useState<string | null>(null);
  const [smsStatus, setSmsStatus] = useState<string>("none");

  // Walkthrough: versioned key so users see updated walkthrough after major changes
  const walkthroughKey = `walkthrough_v2_${user?.id}`;
  const showWalkthrough = !!user && !walkthroughDismissed && !localStorage.getItem(walkthroughKey);

  useEffect(() => {
    if (user) {
      loadSeniorRecord();
    }
  }, [user]);

  // Real-time subscription: auto-update SMS status when n8n changes it via inbound SMS
  useEffect(() => {
    if (!seniorRecordId) return;
    const channel = supabase
      .channel(`senior-sms-${seniorRecordId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "seniors", filter: `id=eq.${seniorRecordId}` },
        (payload) => {
          const newStatus = (payload.new as any).sms_consent_status;
          if (newStatus) setSmsStatus(newStatus);
          const newTime = (payload.new as any).check_in_time;
          if (newTime) setReminderTime(newTime.slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seniorRecordId]);

  const loadSeniorRecord = async () => {
    if (!user) return;
    const { data: senior } = await supabase
      .from("seniors")
      .select("id, check_in_time, sms_consent_status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (senior) {
      setSeniorRecordId(senior.id);
      const time = senior.check_in_time ? senior.check_in_time.slice(0, 5) : "09:00";
      setReminderTime(time);
      setSmsStatus(senior.sms_consent_status || "none");
      await loadTodayStatus(senior.id, time);
    } else {
      setStatus("none");
    }
  };

  const loadTodayStatus = async (sId: string, checkInTime?: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { data } = await supabase
      .from("check_ins")
      .select("*")
      .eq("senior_id", sId)
      .eq("date", today)
      .maybeSingle();

    if (data?.status === "SAFE") {
      setStatus("checked");
      if (data.responded_at) {
        const time = new Date(data.responded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setCheckInTime(time);
      }
      if (data.mood) setSelectedMood(data.mood as any);
    } else {
      const timeStr = checkInTime || reminderTime;
      const reminderHour = parseInt(timeStr.split(":")[0]);
      setStatus(now.getHours() >= reminderHour ? "pending" : "none");
    }
  };

  const handleCheckIn = async (mood?: "great" | "okay" | "not-great") => {
    if (!user || !seniorRecordId || status === "checked" || loading) return;
    setLoading(true);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { data, error } = await supabase
      .from("check_ins")
      .upsert(
        {
          senior_id: seniorRecordId,
          date: today,
          status: "SAFE",
          mood: mood || null,
          responded_at: new Date().toISOString(),
        },
        { onConflict: "senior_id,date" }
      )
      .select()
      .single();

    if (error) {
      toast({ title: "Check-in failed", description: "Please try again.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data) {
      setStatus("checked");
      if (mood) setSelectedMood(mood);
      const time = new Date(data.responded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setCheckInTime(time);
      setShowSuccess(true);
    }
    setLoading(false);
  };

  const dismissSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  const handleWalkthroughComplete = () => {
    if (user) {
      localStorage.setItem(walkthroughKey, "true");
    }
    setWalkthroughDismissed(true);
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

  // Time-aware greeting
  const greeting = (() => {
    if (isChecked) return `You're all set, ${firstName}!`;
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  })();

  const dateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const smsLabel = smsStatus === "confirmed" ? "Active" : smsStatus === "requested" ? "Pending confirmation" : smsStatus === "opted_out" ? "Opted out" : "Not enabled";
  const smsColor = smsStatus === "confirmed" ? "hsl(var(--status-checked))" : smsStatus === "requested" ? "hsl(var(--status-pending))" : "hsl(var(--muted-foreground))";

  // Status indicator config
  const statusDotColor = isChecked
    ? "hsl(var(--status-checked))"
    : isPending
    ? "hsl(var(--status-pending))"
    : "hsl(var(--muted-foreground))";

  const statusText = isChecked
    ? `Checked in at ${checkInTime}`
    : isPending
    ? "Awaiting your check-in"
    : "No check-in yet today";

  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-6 sm:pt-8 pb-10">

        {/* ═══════════════════════════════════════════
            HERO: Greeting + Date + Status
            Warm-tinted card that adapts color to status
        ═══════════════════════════════════════════ */}
        <div
          className="w-full rounded-2xl p-6 sm:p-7"
          style={{
            background: isChecked
              ? "linear-gradient(152deg, hsl(142 38% 95%), hsl(150 25% 97%))"
              : isPending
              ? "linear-gradient(152deg, hsl(30 60% 96%), hsl(38 40% 98%))"
              : "linear-gradient(152deg, hsl(30 40% 97%), hsl(25 25% 98%))",
          }}
        >
          <p className="text-muted-foreground font-medium" style={{ fontSize: "16px" }}>
            {dateString}
          </p>
          <h1
            className="font-extrabold text-foreground mt-1"
            style={{ fontSize: "30px", lineHeight: "38px" }}
          >
            {greeting}
          </h1>
          <div className="flex items-center gap-2.5 mt-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                background: statusDotColor,
                boxShadow: isChecked
                  ? "0 0 0 4px hsl(var(--status-checked) / 0.15)"
                  : isPending
                  ? "0 0 0 4px hsl(var(--status-pending) / 0.15)"
                  : undefined,
              }}
            />
            <span
              className="font-semibold"
              style={{ fontSize: "16px", color: statusDotColor }}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            PENDING ALERT BANNER
        ═══════════════════════════════════════════ */}
        {isPending && (
          <div
            className="w-full rounded-2xl p-5 border-2 text-center mt-5"
            style={{
              background: "hsl(var(--status-pending) / 0.06)",
              borderColor: "hsl(var(--status-pending) / 0.3)",
            }}
          >
            <p className="font-bold" style={{ fontSize: "18px", color: "hsl(var(--status-pending))" }}>
              Your family is waiting to hear from you.
            </p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "17px" }}>
              Please tap the button below when you see this.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            CHECK-IN ZONE
            Checked-in confirmation OR Mood buttons
        ═══════════════════════════════════════════ */}
        {isChecked ? (
          <div
            className="w-full rounded-2xl p-6 border text-center mt-6"
            style={{
              background: "hsl(var(--status-checked) / 0.05)",
              borderColor: "hsl(var(--status-checked) / 0.2)",
            }}
          >
            <div className="mb-3" style={{ fontSize: "48px", lineHeight: 1 }}>
              {selectedMood === "great" ? "😊" : selectedMood === "okay" ? "😐" : selectedMood === "not-great" ? "😔" : "✅"}
            </div>
            <p className="font-extrabold" style={{ fontSize: "22px", color: "hsl(var(--status-checked))" }}>
              You're all checked in!
            </p>
            <p className="text-muted-foreground mt-2" style={{ fontSize: "18px", lineHeight: "28px" }}>
              You checked in at {checkInTime} {selectedMood === "great" ? "— Feeling great 😊" : selectedMood === "okay" ? "— Feeling okay 😐" : selectedMood === "not-great" ? "— Not feeling great 😔" : ""}
            </p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "16px" }}>See you tomorrow!</p>
          </div>
        ) : (
          <div className="mt-6">
            <p
              className="text-center font-bold text-foreground mb-5"
              style={{ fontSize: "22px", lineHeight: "30px" }}
            >
              How are you feeling today?
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {([
                { mood: "great" as const, emoji: "😊", label: "Great", ariaLabel: "Check in as feeling great" },
                { mood: "okay" as const, emoji: "😐", label: "Okay", ariaLabel: "Check in as feeling okay" },
                { mood: "not-great" as const, emoji: "😔", label: "Not Great", ariaLabel: "Check in as not feeling great" },
              ]).map((m) => (
                <button
                  key={m.mood}
                  onClick={() => handleCheckIn(m.mood)}
                  disabled={loading}
                  aria-label={m.ariaLabel}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg active:scale-[0.97] transition-all disabled:opacity-50"
                  style={{ minHeight: "128px", boxShadow: "var(--shadow-card)" }}
                >
                  <span aria-hidden="true" style={{ fontSize: "48px", lineHeight: "56px" }}>{m.emoji}</span>
                  <span className="font-bold text-foreground mt-2" style={{ fontSize: "18px" }}>{m.label}</span>
                </button>
              ))}
            </div>
            {loading && (
              <p className="text-center text-muted-foreground mt-3 animate-pulse" style={{ fontSize: "16px" }}>
                Checking in...
              </p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SECTION: YOUR SETTINGS
            SMS toggle + Check-in time editor
        ═══════════════════════════════════════════ */}
        {seniorRecordId && (
          <div className="mt-10">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pl-1">
              Your Settings
            </p>
            <div className="space-y-3">
              {/* SMS Status Card */}
              <div
                className="w-full rounded-2xl bg-card border border-border p-5 space-y-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}
                  >
                    <MessageSquare className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ fontSize: "18px" }}>SMS Check-Ins</p>
                    <p style={{ fontSize: "15px", color: smsColor, fontWeight: 600 }}>{smsLabel}</p>
                  </div>
                  <Switch
                    checked={smsStatus === "confirmed" || smsStatus === "requested"}
                    onCheckedChange={async () => {
                      if (!seniorRecordId) return;
                      if (smsStatus === "confirmed" || smsStatus === "requested") {
                        const { error } = await supabase.from("seniors").update({ sms_consent_status: "opted_out" }).eq("id", seniorRecordId);
                        if (error) { toast({ title: "Error", description: "Failed to update SMS settings.", variant: "destructive" }); return; }
                        setSmsStatus("opted_out");
                        triggerSmsWebhook(seniorRecordId, "opt_out");
                        toast({ title: "SMS disabled", description: "You will no longer receive check-in SMS." });
                      } else {
                        const { error } = await supabase.from("seniors").update({ sms_consent_status: "requested" }).eq("id", seniorRecordId);
                        if (error) { toast({ title: "Error", description: "Failed to update SMS settings.", variant: "destructive" }); return; }
                        setSmsStatus("requested");
                        triggerSmsWebhook(seniorRecordId, "opt_in");
                        toast({ title: "SMS enabled", description: "You'll receive a confirmation text shortly. Reply YES to activate." });
                      }
                    }}
                  />
                </div>
                {smsStatus === "requested" && (
                  <p
                    className="text-sm text-muted-foreground rounded-xl p-3"
                    style={{ background: "hsl(var(--status-pending) / 0.08)" }}
                  >
                    We sent a confirmation text to your phone. Reply <span className="font-bold">YES</span> to activate SMS check-ins.
                  </p>
                )}
              </div>

              {/* Check-In Time Editor */}
              <div className="w-full">
                <CheckInTimeEditor seniorId={seniorRecordId} compact />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            SECTION: SAFETY NETWORK
            Emergency contacts card
        ═══════════════════════════════════════════ */}
        {seniorRecordId && (
          <div className="mt-10">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 pl-1">
              Safety Network
            </p>
            <SeniorEmergencyContactsCard seniorId={seniorRecordId} />
          </div>
        )}

        {/* ═══════════════════════════════════════════
            CALM SOUNDS
        ═══════════════════════════════════════════ */}
        <div className="mt-8">
          <button
            onClick={() => setShowSound(true)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border active:scale-[0.98] transition-transform"
            style={{ minHeight: "72px", boxShadow: "var(--shadow-card)" }}
          >
            <div
              className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--accent))" }}
            >
              <Music className="w-6 h-6" style={{ color: "hsl(var(--accent-foreground))" }} />
            </div>
            <div className="text-left">
              <p className="font-bold" style={{ fontSize: "18px" }}>Calm Sounds</p>
              <p className="text-muted-foreground" style={{ fontSize: "16px" }}>Rain, Ocean, Forest & more</p>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </div>

      </div>
    </div>
  );
}
