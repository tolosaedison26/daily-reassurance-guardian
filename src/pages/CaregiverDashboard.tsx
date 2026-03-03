import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getConnectedSeniors, getSeniorCheckInStatus } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Users, Plus, BellRing, AlertTriangle, Pencil, PhoneCall } from "lucide-react";
import ActivityPanel from "@/components/ActivityPanel";
import DisconnectSeniorDialog from "@/components/DisconnectSeniorDialog";
import CheckInHistoryPanel from "@/components/CheckInHistoryPanel";
import AlertBanner from "@/components/AlertBanner";
import AlertSeniorRow from "@/components/AlertSeniorRow";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SeniorListSkeleton, StatsStripSkeleton } from "@/components/ui/LoadingSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import TodayOverviewBanner from "@/components/senior/TodayOverviewBanner";
import SetupNudgeBanner from "@/components/SetupNudgeBanner";
import SetupWizard from "@/components/wizard/SetupWizard";
import SetupComplete from "@/components/wizard/SetupComplete";
import DashboardTour from "@/components/DashboardTour";
import { SeniorsHelpButton, DashboardHelpButton } from "@/components/HelpModalsContent";
import { Loader2 as Loader2Icon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManagedSeniorData {
  id: string;
  first_name: string;
  last_name: string;
  vacation_mode?: boolean;
  vacation_from?: string | null;
  vacation_until?: string | null;
  reminder_hour?: string;
  reminder_minute?: string;
  reminder_period?: string;
  grace_period_minutes?: number;
  frequency?: string;
  custom_days?: string[] | null;
  caregiver_id: string;
  created_at: string;
  claimed_by?: string | null;
}

interface SeniorStatus {
  connection_id: string;
  senior_id: string;
  full_name: string;
  status: "safe" | "pending" | "missed" | "paused" | "none";
  last_check_in: string | null;
  is_managed?: boolean;
  relationship?: string | null;
  contact_count?: number;
}

function deriveManagedStatus(ms: ManagedSeniorData, hasCheckedInToday: boolean): "safe" | "pending" | "missed" | "paused" | "none" {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  if (ms.vacation_mode && ms.vacation_from && ms.vacation_until) {
    if (todayStr >= ms.vacation_from && todayStr <= ms.vacation_until) return "paused";
  }
  if (hasCheckedInToday) return "safe";
  const reminderHour = parseInt(ms.reminder_hour || "9");
  const isPM = ms.reminder_period === "PM";
  const actualHour = isPM && reminderHour !== 12 ? reminderHour + 12 : (!isPM && reminderHour === 12 ? 0 : reminderHour);
  const reminderMinute = parseInt(ms.reminder_minute || "0");
  const graceMinutes = ms.grace_period_minutes || 60;
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const reminderMinutes = actualHour * 60 + reminderMinute;
  if (nowMinutes < reminderMinutes) return "none";
  if (nowMinutes < reminderMinutes + graceMinutes) return "pending";
  return "missed";
}

export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [seniors, setSeniors] = useState<SeniorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ seniorId: string; name: string } | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [markingSafe, setMarkingSafe] = useState<string | null>(null);
  const { subscribe } = usePushNotifications();
  const { toast } = useToast();

  // Onboarding wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardComplete, setWizardComplete] = useState(false);
  const [wizardData, setWizardData] = useState<any>(null);
  const [wizardSaving, setWizardSaving] = useState(false);

  // Tour state
  const [showTour, setShowTour] = useState(false);

  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(() => {
    const stored = JSON.parse(sessionStorage.getItem("resolved-alerts") || "[]");
    return new Set(stored as string[]);
  });

  useEffect(() => {
    const syncResolved = () => {
      const stored = JSON.parse(sessionStorage.getItem("resolved-alerts") || "[]");
      setResolvedAlerts(new Set(stored as string[]));
    };
    window.addEventListener("focus", syncResolved);
    syncResolved();
    return () => window.removeEventListener("focus", syncResolved);
  }, []);

  useEffect(() => {
    if (!user) return;
    const onboardingDone = localStorage.getItem(`onboarding_complete_${user.id}`);
    if (!onboardingDone) {
      setShowWizard(true);
    } else {
      // Check tour
      const tourDone = localStorage.getItem(`tour_complete_${user.id}`);
      if (!tourDone) {
        // Delay tour slightly to let dashboard render
        setTimeout(() => setShowTour(true), 800);
      }
    }
    loadSeniors();
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }
    if ("Notification" in window && Notification.permission === "granted") {
      subscribe();
    }

    const channel = supabase
      .channel("caregiver-checkins")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_check_ins" }, () => {
        loadSeniors();
      })
      .subscribe();

    const handleFocus = () => loadSeniors();
    window.addEventListener("focus", handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  const loadSeniors = async () => {
    if (!user) return;
    setLoading(true);
    const { data: connections } = await getConnectedSeniors(user.id);
    const connectedStatuses: SeniorStatus[] = connections
      ? await Promise.all(
          connections.map(async (conn: any) => {
            const checkIn = await getSeniorCheckInStatus(conn.senior_id);
            const p = Array.isArray(conn.profiles) ? conn.profiles[0] : conn.profiles;
            return {
              connection_id: conn.id,
              senior_id: conn.senior_id,
              full_name: p?.full_name || "Unknown",
              status: checkIn ? ("safe" as const) : ("pending" as const),
              last_check_in: checkIn
                ? new Date(checkIn.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : null,
            };
          })
        )
      : [];

    const { data: managed } = await supabase
      .from("managed_seniors")
      .select("*")
      .eq("caregiver_id", user.id)
      .order("created_at", { ascending: false });

    const managedStatuses: SeniorStatus[] = await Promise.all(
      (managed || []).map(async (ms: any) => {
        let hasCheckedIn = false;
        if (ms.claimed_by) {
          const today = new Date().toISOString().split("T")[0];
          const { data: checkIn } = await supabase
            .from("daily_check_ins")
            .select("id")
            .eq("senior_id", ms.claimed_by)
            .eq("check_date", today)
            .maybeSingle();
          hasCheckedIn = !!checkIn;
        }
        const { count } = await supabase
          .from("managed_senior_contacts")
          .select("id", { count: "exact", head: true })
          .eq("managed_senior_id", ms.id);

        const status = deriveManagedStatus(ms as ManagedSeniorData, hasCheckedIn);
        return {
          connection_id: ms.id,
          senior_id: ms.id,
          full_name: `${ms.first_name} ${ms.last_name}`,
          status,
          last_check_in: null,
          is_managed: true,
          relationship: ms.relationship,
          contact_count: count || 0,
        };
      })
    );

    const urgency: Record<string, number> = { missed: 0, pending: 1, paused: 2, none: 3, safe: 4 };
    const allSeniors = [...connectedStatuses, ...managedStatuses].sort(
      (a, b) => (urgency[a.status] ?? 3) - (urgency[b.status] ?? 3)
    );

    setSeniors(allSeniors);
    setLoading(false);
  };

  const handleWizardComplete = async (data: any) => {
    if (!user) return;
    setWizardSaving(true);
    const { data: senior, error } = await supabase
      .from("managed_seniors")
      .insert({
        caregiver_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        relationship: data.relationship,
        reminder_hour: data.reminderHour,
        reminder_minute: data.reminderMinute,
        reminder_period: data.reminderPeriod,
        timezone: data.timezone,
        grace_period_minutes: data.gracePeriodMinutes,
      })
      .select()
      .single();

    if (senior && data.contacts.length > 0) {
      const contactInserts = data.contacts.map((c: any, i: number) => ({
        managed_senior_id: senior.id,
        name: c.name,
        relationship: c.relationship || null,
        phone: c.phone || null,
        email: c.email || null,
        notify_via_sms: c.notifyViaSms,
        notify_via_email: c.notifyViaEmail,
        sort_order: i,
        delay_minutes: i === 0 ? 0 : i === 1 ? 30 : 60,
      }));
      await supabase.from("managed_senior_contacts").insert(contactInserts);
    }

    setWizardData({ ...data, seniorId: senior?.id });
    setWizardSaving(false);
    setWizardComplete(true);
    setShowWizard(false);
  };

  const handleWizardSkip = () => {
    if (user) localStorage.setItem(`onboarding_complete_${user.id}`, "true");
    setShowWizard(false);
  };

  const handleWizardFinish = () => {
    if (user) localStorage.setItem(`onboarding_complete_${user.id}`, "true");
    setWizardComplete(false);
    setWizardData(null);
    loadSeniors();
    // Trigger tour after onboarding
    setTimeout(() => setShowTour(true), 800);
  };

  const handleTourComplete = () => {
    if (user) localStorage.setItem(`tour_complete_${user.id}`, "true");
    setShowTour(false);
  };

  // Show wizard
  if (showWizard) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <SetupWizard
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
          saving={wizardSaving}
        />
      </div>
    );
  }

  // Show completion screen
  if (wizardComplete && wizardData) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <SetupComplete
          seniorName={`${wizardData.firstName} ${wizardData.lastName}`}
          reminderTime={`${wizardData.reminderHour}:${wizardData.reminderMinute} ${wizardData.reminderPeriod}`}
          contactCount={wizardData.contacts.length}
          gracePeriodMinutes={wizardData.gracePeriodMinutes}
          onGoToDashboard={handleWizardFinish}
        />
      </div>
    );
  }

  const handleConnectWithCode = async () => {
    if (!user || !inviteCode.trim()) return;
    const cleanCode = inviteCode.toUpperCase().trim();
    setConnecting(true);
    setConnectError("");
    const { data: result, error } = await supabase.rpc("connect_via_invite_code", {
      p_code: cleanCode,
      p_caregiver_id: user.id,
    });
    if (error || !result) {
      setConnectError("Something went wrong. Please try again.");
    } else if ((result as any).success) {
      setConnectSuccess(true);
      setShowSearch(false);
      setInviteCode("");
      setTimeout(() => setConnectSuccess(false), 3000);
      loadSeniors();
    } else {
      setConnectError((result as any).error || "Failed to connect. Please check the code.");
    }
    setConnecting(false);
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnecting(connectionId);
    await supabase
      .from("senior_connections")
      .update({ status: "inactive" })
      .eq("id", connectionId);
    await loadSeniors();
    setDisconnecting(null);
  };

  const handleMarkSafe = async (senior: SeniorStatus) => {
    const prevStatus = senior.status;
    setMarkingSafe(senior.senior_id);
    setSeniors(prev => prev.map(s => s.senior_id === senior.senior_id ? { ...s, status: "safe" as const } : s));
    try {
      const key = `marked_safe_${new Date().toISOString().split("T")[0]}_${senior.senior_id}`;
      localStorage.setItem(key, "true");
      toast({ title: `${senior.full_name} marked as safe for today.` });
    } catch {
      setSeniors(prev => prev.map(s => s.senior_id === senior.senior_id ? { ...s, status: prevStatus } : s));
      toast({ title: "Could not mark safe — please try again.", variant: "destructive" });
    } finally {
      setMarkingSafe(null);
    }
  };

  const isSafeToday = (seniorId: string) => {
    const key = `marked_safe_${new Date().toISOString().split("T")[0]}_${seniorId}`;
    return localStorage.getItem(key) === "true";
  };

  const safeCount = seniors.filter((s) => s.status === "safe").length;
  const pendingCount = seniors.filter((s) => s.status === "pending" || s.status === "none").length;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const allDemoAlerts = [
    {
      seniorId: "demo-alert-1",
      name: "Dorothy Wilson",
      dueTime: "9:00 AM",
      overdueText: "1h 45min",
      alertTime: "9:45 AM",
      contactNotified: "Contact #1 has been notified",
    },
  ];
  const demoAlerts = allDemoAlerts.filter(a => !resolvedAlerts.has(a.seniorId));
  const alertCount = demoAlerts.length;
  const missedCount = seniors.filter(s => s.status === "missed").length + alertCount;

  const getStatusBadge = (s: SeniorStatus) => {
    switch (s.status) {
      case "safe": return "safe" as const;
      case "pending": return "pending" as const;
      case "missed": return "missed" as const;
      case "paused": return "paused" as const;
      default: return "paused" as const;
    }
  };

  const filterSenior = (s: SeniorStatus) => {
    if (!statusFilter || statusFilter === "total") return true;
    if (statusFilter === "safe") return s.status === "safe";
    if (statusFilter === "pending") return s.status === "pending" || s.status === "none";
    if (statusFilter === "alert") return s.status === "missed";
    return true;
  };

  const seniorsWithoutContacts = seniors
    .filter(s => s.is_managed && (s.contact_count === 0 || s.contact_count === undefined))
    .map(s => ({ id: s.senior_id, name: s.full_name }));

  return (
    <div className="space-y-5">
      {/* Tour */}
      {showTour && <DashboardTour onComplete={handleTourComplete} />}

      {/* Greeting */}
      <div>
        <div className="flex items-center gap-1">
          <h1 className="text-3xl font-black leading-tight">Hi {firstName}! 👋</h1>
          <DashboardHelpButton />
        </div>
        <p className="text-muted-foreground text-base mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Setup nudge banner */}
      {!loading && seniorsWithoutContacts.length > 0 && (
        <SetupNudgeBanner seniorsWithoutContacts={seniorsWithoutContacts} />
      )}

      {/* Today's Overview Banner */}
      {!loading && seniors.length > 0 && (
        <div data-tour="overview-banner">
          <TodayOverviewBanner
            totalSeniors={seniors.length + alertCount}
            safeCount={safeCount}
            pendingCount={pendingCount}
            alertCount={missedCount}
          />
        </div>
      )}

      {/* Push notification prompt */}
      {notifPermission === "default" && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <BellRing className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm">Enable alerts</p>
            <p className="text-xs text-muted-foreground">Get notified if a loved one misses their check-in.</p>
          </div>
          <Button
            onClick={async () => {
              try { await subscribe(); } catch (e) { console.error("Enable notifications error:", e); }
              if ("Notification" in window) setNotifPermission(Notification.permission);
            }}
            className="shrink-0 h-9 px-4 rounded-xl font-black border-0 text-sm"
            style={{ background: "hsl(var(--primary))", color: "#fff" }}
          >
            Enable
          </Button>
        </div>
      )}

      {notifPermission === "granted" && seniors.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BellRing className="w-3.5 h-3.5" style={{ color: "hsl(var(--status-checked))" }} />
          <span style={{ color: "hsl(var(--status-checked))" }}>Alerts enabled — you'll be notified of missed check-ins</span>
        </div>
      )}

      {/* Alert Banner */}
      {alertCount > 0 && (
        <AlertBanner
          alertCount={alertCount}
          seniorName={demoAlerts[0].name}
          dueTime={demoAlerts[0].dueTime}
          overdueText={demoAlerts[0].overdueText}
          contactNotified={demoAlerts[0].contactNotified}
          onViewSenior={() => navigate("/seniors/demo-alert-1/alert")}
          onHandleThis={() => {
            const id = demoAlerts[0].seniorId;
            setResolvedAlerts(prev => new Set(prev).add(id));
            const existing = JSON.parse(sessionStorage.getItem("resolved-alerts") || "[]");
            if (!existing.includes(id)) {
              existing.push(id);
              sessionStorage.setItem("resolved-alerts", JSON.stringify(existing));
            }
          }}
        />
      )}

      {/* Connection success toast */}
      {connectSuccess && (
        <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 animate-bounce-in">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-black text-sm">Connected!</p>
            <p className="text-xs text-muted-foreground">You can now see their daily check-ins.</p>
          </div>
        </div>
      )}

      {/* Status summary */}
      {(seniors.length > 0 || alertCount > 0) && (
        <div>
          {statusFilter && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-muted-foreground">
                Showing: <span className="capitalize text-foreground">{statusFilter}</span>
              </p>
              <button
                onClick={() => setStatusFilter(null)}
                className="text-xs font-bold text-primary hover:underline"
              >
                Show All
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter(statusFilter === "total" ? null : "total")}
              className={`bg-card rounded-2xl p-4 border shadow-card flex items-center gap-3 text-left transition-all ${statusFilter === "total" ? "ring-2 ring-primary" : "border-border"}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--muted))" }}>
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-black leading-none">{seniors.length + alertCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total</p>
              </div>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "safe" ? null : "safe")}
              className={`bg-card rounded-2xl p-4 border shadow-card flex items-center gap-3 text-left transition-all ${statusFilter === "safe" ? "ring-2 ring-primary" : "border-border"}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-checked) / 0.12)" }}>
                <CheckCircle className="w-6 h-6" style={{ color: "hsl(var(--status-checked))" }} />
              </div>
              <div>
                <p className="text-3xl font-black leading-none" style={{ color: "hsl(var(--status-checked))" }}>{safeCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">✓ Safe</p>
              </div>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
              className={`bg-card rounded-2xl p-4 border shadow-card flex items-center gap-3 text-left transition-all ${statusFilter === "pending" ? "ring-2 ring-primary" : "border-border"}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-pending) / 0.12)" }}>
                <XCircle className="w-6 h-6" style={{ color: "hsl(var(--status-pending))" }} />
              </div>
              <div>
                <p className="text-3xl font-black leading-none" style={{ color: "hsl(var(--status-pending))" }}>{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">⏳ Pending</p>
              </div>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === "alert" ? null : "alert")}
              className={`rounded-2xl p-4 border shadow-card flex items-center gap-3 text-left transition-all ${statusFilter === "alert" ? "ring-2 ring-primary" : ""}`}
              style={{
                background: missedCount > 0 ? "hsl(var(--status-alert) / 0.06)" : "hsl(var(--card))",
                borderColor: statusFilter === "alert" ? undefined : (missedCount > 0 ? "hsl(var(--status-alert) / 0.3)" : "hsl(var(--border))"),
              }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-alert) / 0.12)" }}>
                <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--status-alert))" }} />
              </div>
              <div>
                <p className="text-3xl font-black leading-none" style={{ color: "hsl(var(--status-alert))" }}>{missedCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">🚨 Alert</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Alert senior rows */}
      {alertCount > 0 && (
        <div className="space-y-3">
          {demoAlerts.map((alert) => (
            <AlertSeniorRow
              key={alert.seniorId}
              name={alert.name}
              alertTime={alert.alertTime}
              contactNotified={alert.contactNotified}
              onClick={() => navigate(`/seniors/${alert.seniorId}/alert`)}
            />
          ))}
        </div>
      )}

      {/* Seniors list */}
      <div data-tour="seniors-list">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <h2 className="font-black text-lg">Your Seniors</h2>
            <SeniorsHelpButton />
          </div>
        </div>
        {loading ? (
          <SeniorListSkeleton />
        ) : seniors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No loved ones added yet"
            description="Add your first senior to start daily check-ins."
            actionLabel="Add Senior"
            onAction={() => navigate("/seniors/new")}
          />
        ) : (
          <div className="space-y-3">
            {seniors.filter(filterSenior).map((senior) => {
              const isSelected = location.pathname === `/seniors/${senior.senior_id}`;
              return (
                <Link
                  key={senior.connection_id}
                  to={`/seniors/${senior.senior_id}`}
                  className={`block bg-card rounded-2xl p-5 border shadow-card cursor-pointer active:scale-[0.98] transition-all hover:bg-muted/50 relative no-underline ${
                    isSelected ? "border-l-4 bg-primary/5" : ""
                  }`}
                  style={{
                    borderColor: isSelected
                      ? "hsl(var(--primary))"
                      : senior.status === "safe"
                      ? "hsl(var(--status-checked) / 0.3)"
                      : senior.status === "missed"
                      ? "hsl(var(--status-alert) / 0.3)"
                      : "hsl(var(--border))",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
                      style={{
                        background: senior.status === "safe" ? "hsl(var(--status-checked) / 0.12)"
                          : senior.status === "missed" ? "hsl(var(--status-alert) / 0.12)"
                          : "hsl(var(--muted))",
                        color: senior.status === "safe" ? "hsl(var(--status-checked))"
                          : senior.status === "missed" ? "hsl(var(--status-alert))"
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      {senior.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-lg leading-tight truncate text-foreground">{senior.full_name}</p>
                        {senior.relationship && (
                          <span className="text-xs text-muted-foreground">· {senior.relationship}</span>
                        )}
                        {senior.is_managed && senior.contact_count === 0 && (
                          <span title="No emergency contacts set up" className="shrink-0">
                            <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--status-pending))" }} />
                          </span>
                        )}
                      </div>
                      {senior.status === "safe" && senior.last_check_in ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                          <p className="text-sm" style={{ color: "hsl(var(--status-checked))" }}>
                            Checked in at {senior.last_check_in}
                          </p>
                        </div>
                      ) : senior.status === "missed" ? (
                        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-alert))" }}>
                          Missed today's check-in
                        </p>
                      ) : senior.status === "paused" ? (
                        <p className="text-sm mt-0.5 text-muted-foreground">Check-ins paused</p>
                      ) : (
                        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-pending))" }}>
                          Has <strong>not</strong> checked in yet today
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Mark Safe button */}
                      {senior.status === "safe" || isSafeToday(senior.senior_id) ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground whitespace-nowrap">
                          Already Safe Today ✓
                        </span>
                      ) : senior.status === "paused" ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground whitespace-nowrap">
                          Check-ins Paused
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkSafe(senior); }}
                          disabled={markingSafe === senior.senior_id}
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors min-h-[28px]"
                          style={{ background: "hsl(var(--status-checked) / 0.12)", color: "hsl(var(--status-checked))" }}
                        >
                          {markingSafe === senior.senior_id ? (
                            <span className="flex items-center gap-1"><Loader2Icon className="w-3 h-3 animate-spin" /> Marking…</span>
                          ) : (
                            "Mark Safe ✓"
                          )}
                        </button>
                      )}
                      {senior.is_managed && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/seniors/${senior.senior_id}/contacts`); }}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                          aria-label={`Contacts for ${senior.full_name}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/seniors/${senior.senior_id}/edit`); }}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                        aria-label={`Edit ${senior.full_name}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <StatusBadge status={getStatusBadge(senior)} />
                      {!senior.is_managed && (
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <DisconnectSeniorDialog
                            seniorName={senior.full_name}
                            onConfirm={() => handleDisconnect(senior.connection_id)}
                            disconnecting={disconnecting === senior.connection_id}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Add loved one — invite code entry */}
      <div className="pb-4">
        {seniors.length === 0 && !loading ? (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
            <p className="font-black text-base mb-1">Enter Invite Code</p>
            <p className="text-sm text-muted-foreground mb-4">
              Ask your loved one to open the app, tap <strong>"Connect Family"</strong> and share their code with you.
            </p>
            <Input
              placeholder="e.g. PARK-7291"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")); setConnectError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConnectWithCode()}
              className="h-16 rounded-xl text-2xl font-black text-center tracking-widest mb-3"
              maxLength={9}
              autoCapitalize="characters"
            />
            {connectError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold mb-3">{connectError}</div>
            )}
            <Button
              onClick={handleConnectWithCode}
              disabled={connecting || inviteCode.trim().length < 4}
              className="w-full h-12 font-black rounded-xl border-0 text-base"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              {connecting ? "Connecting…" : "Connect ✓"}
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={() => { setShowSearch(!showSearch); setConnectError(""); }}
              className="w-full h-14 text-base font-black rounded-2xl border-0 shadow-btn"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Loved One
            </Button>
            {showSearch && (
              <div className="mt-3 bg-card rounded-2xl p-5 border border-border shadow-card animate-bounce-in">
                <p className="font-black text-base mb-1">Enter Invite Code</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask your loved one to open the app, tap <strong>"Connect Family"</strong> and share their code with you.
                </p>
                <Input
                  placeholder="e.g. PARK-7291"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")); setConnectError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnectWithCode()}
                  className="h-16 rounded-xl text-2xl font-black text-center tracking-widest mb-3"
                  maxLength={9}
                  autoCapitalize="characters"
                />
                {connectError && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold mb-3">{connectError}</div>
                )}
                <Button
                  onClick={handleConnectWithCode}
                  disabled={connecting || inviteCode.trim().length < 4}
                  className="w-full h-12 font-black rounded-xl border-0 text-base"
                  style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
                >
                  {connecting ? "Connecting…" : "Connect ✓"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {showActivity && user && (
        <ActivityPanel
          caregiverId={user.id}
          seniors={seniors.map((s) => ({ senior_id: s.senior_id, full_name: s.full_name }))}
          onClose={() => setShowActivity(false)}
        />
      )}
      {historyTarget && (
        <CheckInHistoryPanel
          seniorId={historyTarget.seniorId}
          seniorName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
