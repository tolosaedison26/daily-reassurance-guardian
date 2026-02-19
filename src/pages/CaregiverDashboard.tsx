import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getConnectedSeniors, getSeniorCheckInStatus } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, CheckCircle, XCircle, Clock, Users, Bell, Plus, BellRing } from "lucide-react";
import ActivityPanel from "@/components/ActivityPanel";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface SeniorStatus {
  connection_id: string;
  senior_id: string;
  full_name: string;
  status: "checked" | "not-checked";
  last_check_in: string | null;
}

export default function CaregiverDashboard() {
  const { user, profile, signOut } = useAuth();
  const [seniors, setSeniors] = useState<SeniorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const { subscribe } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    loadSeniors();

    // Check notification permission state
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }

    // Auto-subscribe if already granted
    if ("Notification" in window && Notification.permission === "granted") {
      subscribe();
    }

    const channel = supabase
      .channel("caregiver-checkins")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_check_ins" }, () => {
        loadSeniors();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadSeniors = async () => {
    if (!user) return;
    setLoading(true);
    const { data: connections } = await getConnectedSeniors(user.id);
    if (!connections) { setLoading(false); return; }

    const seniorStatuses: SeniorStatus[] = await Promise.all(
      connections.map(async (conn: any) => {
        const checkIn = await getSeniorCheckInStatus(conn.senior_id);
        // profiles can be returned as object or array depending on join type
        const p = Array.isArray(conn.profiles) ? conn.profiles[0] : conn.profiles;
        return {
          connection_id: conn.id,
          senior_id: conn.senior_id,
          full_name: p?.full_name || "Unknown",
          status: checkIn ? "checked" : "not-checked",
          last_check_in: checkIn
            ? new Date(checkIn.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null,
        };
      })
    );

    setSeniors(seniorStatuses);
    setLoading(false);
  };

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

  const checkedCount = seniors.filter((s) => s.status === "checked").length;
  const notCheckedCount = seniors.filter((s) => s.status === "not-checked").length;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
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
            aria-label="Recent activity"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {seniors.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                style={{ background: "hsl(var(--primary))" }}
              />
            )}
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

      {/* Greeting */}
      <div className="px-5 mb-4">
        <h1 className="text-3xl font-black leading-tight">Hi {firstName}! 👋</h1>
        <p className="text-muted-foreground text-base mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Push notification prompt */}
      {notifPermission === "default" && (
        <div className="mx-5 mb-4 bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
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
              try {
                await subscribe();
              } catch (e) {
                console.error("Enable notifications error:", e);
              }
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
        <div className="mx-5 mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <BellRing className="w-3.5 h-3.5" style={{ color: "hsl(var(--status-checked))" }} />
          <span style={{ color: "hsl(var(--status-checked))" }}>Alerts enabled — you'll be notified of missed check-ins</span>
        </div>
      )}

      {/* Connection success toast */}
      {connectSuccess && (
        <div className="mx-5 mb-4 bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3 animate-bounce-in">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-black text-sm">Connected!</p>
            <p className="text-xs text-muted-foreground">You can now see their daily check-ins.</p>
          </div>
        </div>
      )}

      {/* Summary row */}
      {seniors.length > 0 && (
        <div className="px-5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--status-checked) / 0.12)" }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: "hsl(var(--status-checked))" }} />
              </div>
              <div>
                <p className="text-3xl font-black leading-none" style={{ color: "hsl(var(--status-checked))" }}>
                  {checkedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Safe &amp; checked in</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--status-pending) / 0.12)" }}
              >
                <XCircle className="w-6 h-6" style={{ color: "hsl(var(--status-pending))" }} />
              </div>
              <div>
                <p className="text-3xl font-black leading-none" style={{ color: "hsl(var(--status-pending))" }}>
                  {notCheckedCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Not yet today</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seniors list */}
      <div className="px-5">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground animate-pulse text-lg font-semibold">Loading…</div>
          </div>
        ) : seniors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--secondary))" }}
            >
              <Users className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="font-black text-xl">No loved ones added yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Ask them to open the app and share their invite code
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {seniors.map((senior) => (
              <div
                key={senior.connection_id}
                className="bg-card rounded-2xl p-5 border shadow-card"
                style={{
                  borderColor:
                    senior.status === "checked"
                      ? "hsl(var(--status-checked) / 0.3)"
                      : "hsl(var(--border))",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
                    style={{
                      background:
                        senior.status === "checked"
                          ? "hsl(var(--status-checked) / 0.12)"
                          : "hsl(var(--muted))",
                      color:
                        senior.status === "checked"
                          ? "hsl(var(--status-checked))"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {senior.full_name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg leading-tight truncate">{senior.full_name}</p>
                    {senior.status === "checked" && senior.last_check_in ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
                        <p className="text-sm" style={{ color: "hsl(var(--status-checked))" }}>
                          Checked in at {senior.last_check_in}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-pending))" }}>
                        Has <strong>not</strong> checked in yet today
                      </p>
                    )}
                  </div>

                  <div
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-black"
                    style={{
                      background:
                        senior.status === "checked"
                          ? "hsl(var(--status-checked) / 0.12)"
                          : "hsl(var(--status-pending) / 0.12)",
                      color:
                        senior.status === "checked"
                          ? "hsl(var(--status-checked))"
                          : "hsl(var(--status-pending))",
                    }}
                  >
                    {senior.status === "checked" ? "✓ Safe" : "⏳ Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add loved one — invite code entry */}
      <div className="px-5 pb-10 mt-5">
        {/* Always-visible code entry card when no seniors, otherwise toggled */}
        {seniors.length === 0 && !loading ? (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
            <p className="font-black text-base mb-1">Enter Invite Code</p>
            <p className="text-sm text-muted-foreground mb-4">
              Ask your loved one to open the app, tap <strong>"Connect Family"</strong> and share their code with you.
            </p>
            <Input
              placeholder="e.g. PARK-7291"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
                setConnectError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConnectWithCode()}
              className="h-16 rounded-xl text-2xl font-black text-center tracking-widest mb-3"
              maxLength={9}
              autoCapitalize="characters"
            />
            {connectError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold mb-3">
                {connectError}
              </div>
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
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
                    setConnectError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleConnectWithCode()}
                  className="h-16 rounded-xl text-2xl font-black text-center tracking-widest mb-3"
                  maxLength={9}
                  autoCapitalize="characters"
                />
                {connectError && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold mb-3">
                    {connectError}
                  </div>
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
    </div>
  );
}
