import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getConnectedSeniors, getSeniorCheckInStatus } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Plus, CheckCircle, XCircle, Clock, Search, Users, Bell } from "lucide-react";
import ActivityPanel from "@/components/ActivityPanel";

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
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; full_name: string }>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadSeniors();

    // Real-time: refresh when any check-in changes for connected seniors
    const channel = supabase
      .channel("caregiver-checkins")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_check_ins" },
        () => {
          loadSeniors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadSeniors = async () => {
    if (!user) return;
    setLoading(true);

    const { data: connections } = await getConnectedSeniors(user.id);
    if (!connections) { setLoading(false); return; }

    const seniorStatuses: SeniorStatus[] = await Promise.all(
      connections.map(async (conn: any) => {
        const checkIn = await getSeniorCheckInStatus(conn.senior_id);
        const profile = conn.profiles;
        return {
          connection_id: conn.id,
          senior_id: conn.senior_id,
          full_name: profile?.full_name || "Unknown",
          status: checkIn ? "checked" : "not-checked",
          last_check_in: checkIn ? new Date(checkIn.checked_in_at).toLocaleString() : null,
        };
      })
    );

    setSeniors(seniorStatuses);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "senior")
      .ilike("full_name", `%${searchEmail}%`)
      .limit(5);
    setSearchResults(data || []);
  };

  const handleConnect = async (seniorId: string) => {
    if (!user) return;
    setConnecting(true);
    await supabase
      .from("senior_connections")
      .insert({ caregiver_id: user.id, senior_id: seniorId, status: "active" });
    setConnecting(false);
    setShowSearch(false);
    setSearchEmail("");
    setSearchResults([]);
    loadSeniors();
  };

  const checkedCount = seniors.filter((s) => s.status === "checked").length;
  const notCheckedCount = seniors.filter((s) => s.status === "not-checked").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <div className="px-5 pt-safe pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold">Family Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivity(true)}
              className="p-3 rounded-full bg-card/70 backdrop-blur-sm shadow-card relative"
              aria-label="Recent activity"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {seniors.length > 0 && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
              )}
            </button>
            <button
              onClick={signOut}
              className="p-3 rounded-full bg-card/70 backdrop-blur-sm shadow-card"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {seniors.length > 0 && (
        <div className="px-5 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--status-checked) / 0.12)" }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "hsl(var(--status-checked))" }}>{checkedCount}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--status-pending) / 0.12)" }}
              >
                <XCircle className="w-5 h-5" style={{ color: "hsl(var(--status-pending))" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "hsl(var(--status-pending))" }}>{notCheckedCount}</p>
                <p className="text-xs text-muted-foreground">Not Yet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seniors List */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground animate-pulse text-lg">Loading...</div>
          </div>
        ) : seniors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--secondary))" }}
            >
              <Users className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="font-bold text-lg">No seniors connected yet</p>
              <p className="text-muted-foreground text-sm">Add a loved one to start monitoring</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {seniors.map((senior) => (
              <div
                key={senior.connection_id}
                className="bg-card rounded-2xl p-5 shadow-card border border-border"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                    style={{
                      backgroundColor: senior.status === "checked"
                        ? "hsl(var(--status-checked) / 0.12)"
                        : "hsl(var(--status-pending) / 0.12)",
                    }}
                  >
                    {senior.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{senior.full_name}</p>
                    {senior.status === "checked" && senior.last_check_in ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: "hsl(var(--status-checked))" }} />
                        <p className="text-sm" style={{ color: "hsl(var(--status-checked))" }}>
                          Checked in at {senior.last_check_in}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "hsl(var(--status-pending))" }}>
                        Not yet checked in today
                      </p>
                    )}
                  </div>
                  {/* Status badge */}
                  <div
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: senior.status === "checked"
                        ? "hsl(var(--status-checked) / 0.12)"
                        : "hsl(var(--status-pending) / 0.12)",
                      color: senior.status === "checked"
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

      {/* Add Senior Button */}
      <div className="px-5 pb-8 pb-safe mt-4">
        <Button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full h-14 text-base font-bold rounded-xl gradient-btn shadow-btn border-0 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add a Loved One
        </Button>

        {showSearch && (
          <div className="mt-3 bg-card rounded-2xl p-5 shadow-card border border-border animate-bounce-in">
            <p className="font-semibold mb-3 text-base">Find a senior by name</p>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Search by full name..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 rounded-xl text-base"
              />
              <Button
                onClick={handleSearch}
                variant="outline"
                className="h-12 px-4 rounded-xl border-primary"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              The senior must have created an account with the "Senior" role.
            </p>
            {searchResults.map((result) => (
              <div
                key={result.user_id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted mb-2"
              >
                <span className="font-medium">{result.full_name}</span>
                <Button
                  size="sm"
                  onClick={() => handleConnect(result.user_id)}
                  disabled={connecting}
                  className="gradient-btn border-0 text-white h-8 px-4 rounded-lg text-sm font-semibold"
                >
                  Connect
                </Button>
              </div>
            ))}
            {searchResults.length === 0 && searchEmail && (
              <p className="text-sm text-muted-foreground text-center py-2">No results found. Try a different name.</p>
            )}
          </div>
        )}
      </div>

      {/* Activity Panel */}
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
