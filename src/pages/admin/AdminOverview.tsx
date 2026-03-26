import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CheckCircle2, Clock, AlertTriangle, Phone, UserX,
  MessageSquare, ShieldAlert, ChevronRight, Activity,
  Smile, TrendingUp, Pause, BellOff, RefreshCw, Trash2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";

interface Stats {
  totalSeniors: number;
  activeSeniors: number;
  pausedSeniors: number;
  consentConfirmed: number;
  consentRequested: number;
  consentNone: number;
  consentOptedOut: number;
  totalECs: number;
  ecsOptedOut: number;
  todaySafe: number;
  todayMissed: number;
  todayPending: number;
  checkinRate: number;
  totalAlerts7d: number;
  inactivityWarned: number;
  todayCheckins: { status: string; count: number }[];
  weekTrend: { date: string; SAFE: number; MISSED: number }[];
  moodCounts: { mood: string; count: number; fill: string }[];
  recentAlerts: {
    id: string;
    senior_name: string;
    contact_name: string;
    alerted_at: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  SAFE: "#059669",
  PENDING: "#d97706",
  MISSED: "#dc2626",
  SKIPPED: "#6b7280",
};

function StatCard({
  label, value, icon: Icon, color, bg, onClick, suffix, urgent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  onClick?: () => void;
  suffix?: string;
  urgent?: boolean;
}) {
  return (
    <Card
      className={`border-0 shadow-sm transition-shadow group ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      } ${urgent && Number(value) > 0 ? "ring-2 ring-red-400" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black leading-none">{value}</span>
            {suffix && (
              <span className="text-sm font-semibold text-muted-foreground">{suffix}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-1 truncate">{label}</p>
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    if (!loading) setRefreshing(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split("T")[0];

      const [
        { data: seniors },
        { data: ecs },
        { data: todayCheckins },
        { data: alerts },
        { data: weekCheckins },
        { data: moodData },
        { count: alerts7dCount },
      ] = await Promise.all([
        supabase.from("seniors").select("id, paused, sms_consent_status, inactivity_warned_at"),
        supabase.from("emergency_contacts").select("id, opted_out"),
        supabase.from("check_ins").select("status").eq("date", today),
        supabase
          .from("alerts")
          .select("id, senior_id, contact_name, alerted_at")
          .order("alerted_at", { ascending: false })
          .limit(8),
        supabase.from("check_ins").select("date, status").gte("date", startDate),
        supabase
          .from("check_ins")
          .select("mood")
          .gte("date", startDate)
          .not("mood", "is", null),
        supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .gte("alerted_at", startDate + "T00:00:00Z"),
      ]);

      const seniorList = seniors || [];
      const ecList = ecs || [];
      const checkinList = todayCheckins || [];

      // Today counts
      const todaySafe = checkinList.filter((c) => c.status === "SAFE").length;
      const todayMissed = checkinList.filter((c) => c.status === "MISSED").length;
      const todayPending = checkinList.filter((c) => c.status === "PENDING").length;
      const confirmed = seniorList.filter((s) => s.sms_consent_status === "confirmed").length;
      const checkinRate = confirmed > 0 ? Math.round((todaySafe / confirmed) * 100) : 0;

      // Today chart data
      const statusCounts: Record<string, number> = {};
      checkinList.forEach((ci) => {
        statusCounts[ci.status] = (statusCounts[ci.status] || 0) + 1;
      });

      // 7-day trend
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }
      const trendMap: Record<string, { SAFE: number; MISSED: number }> = {};
      days.forEach((d) => { trendMap[d] = { SAFE: 0, MISSED: 0 }; });
      (weekCheckins || []).forEach((ci) => {
        if (trendMap[ci.date] && (ci.status === "SAFE" || ci.status === "MISSED")) {
          trendMap[ci.date][ci.status as "SAFE" | "MISSED"]++;
        }
      });
      const weekTrend = days.map((d) => ({
        date: new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        SAFE: trendMap[d].SAFE,
        MISSED: trendMap[d].MISSED,
      }));

      // Mood distribution
      const MOOD_CONFIG: Record<string, { label: string; fill: string }> = {
        great: { label: "Great 😊", fill: "#059669" },
        okay: { label: "Okay 😐", fill: "#d97706" },
        "not-great": { label: "Not Great 😔", fill: "#dc2626" },
      };
      const moodMap: Record<string, number> = {};
      (moodData || []).forEach((ci) => {
        if (ci.mood) moodMap[ci.mood] = (moodMap[ci.mood] || 0) + 1;
      });
      const moodCounts = Object.entries(moodMap).map(([mood, count]) => ({
        mood: MOOD_CONFIG[mood]?.label || mood,
        count,
        fill: MOOD_CONFIG[mood]?.fill || "#6b7280",
      }));

      // Senior names for alerts
      const alertSeniorIds = [...new Set((alerts || []).map((a) => a.senior_id))];
      let seniorNames: Record<string, string> = {};
      if (alertSeniorIds.length > 0) {
        const { data: sNames } = await supabase
          .from("seniors")
          .select("id, name")
          .in("id", alertSeniorIds);
        (sNames || []).forEach((s) => { seniorNames[s.id] = s.name || "Unknown"; });
      }

      setLastUpdated(new Date());
      setStats({
        totalSeniors: seniorList.length,
        activeSeniors: seniorList.filter((s) => !s.paused).length,
        pausedSeniors: seniorList.filter((s) => s.paused).length,
        consentConfirmed: confirmed,
        consentRequested: seniorList.filter((s) => s.sms_consent_status === "requested").length,
        consentNone: seniorList.filter((s) => !s.sms_consent_status || s.sms_consent_status === "none").length,
        consentOptedOut: seniorList.filter((s) => s.sms_consent_status === "opted_out").length,
        totalECs: ecList.length,
        ecsOptedOut: ecList.filter((e) => e.opted_out).length,
        todaySafe,
        todayMissed,
        todayPending,
        checkinRate,
        totalAlerts7d: alerts7dCount || 0,
        inactivityWarned: seniorList.filter((s: any) => s.inactivity_warned_at).length,
        todayCheckins: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        weekTrend,
        moodCounts,
        recentAlerts: (alerts || []).map((a) => ({
          id: a.id,
          senior_name: seniorNames[a.senior_id] || "Unknown",
          contact_name: a.contact_name || "—",
          alerted_at: a.alerted_at || "",
        })),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.totalSeniors} registered users
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.todayMissed > 0 && (
            <Badge className="bg-red-500 text-white border-red-500 text-sm px-3 py-1.5 animate-pulse">
              ⚠ {stats.todayMissed} Missed Today
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Section: Today's Status */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Today's Check-Ins</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Safe Today"
            value={stats.todaySafe}
            icon={CheckCircle2}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/seniors?today=SAFE")}
          />
          <StatCard
            label="Missed Today"
            value={stats.todayMissed}
            icon={AlertTriangle}
            color="text-red-600"
            bg="bg-red-500/10"
            onClick={() => navigate("/admin/seniors?today=MISSED")}
            urgent
          />
          <StatCard
            label="Pending Today"
            value={stats.todayPending}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/seniors?today=PENDING")}
          />
          <StatCard
            label="Check-In Rate"
            value={stats.checkinRate}
            suffix="%"
            icon={TrendingUp}
            color="text-primary"
            bg="bg-primary/10"
          />
        </div>
      </div>

      {/* Section: SMS Consent */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">SMS Consent</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="SMS Active"
            value={stats.consentConfirmed}
            icon={MessageSquare}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/seniors?sms=confirmed")}
          />
          <StatCard
            label="Awaiting YES Reply"
            value={stats.consentRequested}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/seniors?sms=requested")}
          />
          <StatCard
            label="Opted Out"
            value={stats.consentOptedOut}
            icon={UserX}
            color="text-red-600"
            bg="bg-red-500/10"
            onClick={() => navigate("/admin/seniors?sms=opted_out")}
          />
          <StatCard
            label="No SMS Set Up"
            value={stats.consentNone}
            icon={BellOff}
            color="text-muted-foreground"
            bg="bg-muted"
            onClick={() => navigate("/admin/seniors?sms=none")}
          />
        </div>
      </div>

      {/* Section: Accounts & Contacts */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Accounts & Contacts</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Seniors"
            value={stats.totalSeniors}
            icon={Users}
            color="text-primary"
            bg="bg-primary/10"
            onClick={() => navigate("/admin/seniors")}
          />
          <StatCard
            label="Active Accounts"
            value={stats.activeSeniors}
            icon={Activity}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/seniors?status=active")}
          />
          <StatCard
            label="Paused"
            value={stats.pausedSeniors}
            icon={Pause}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/seniors?status=paused")}
          />
          <StatCard
            label="Alerts (Last 7 Days)"
            value={stats.totalAlerts7d}
            icon={ShieldAlert}
            color="text-red-600"
            bg="bg-red-500/10"
          />
          <StatCard
            label="At Risk (Inactivity)"
            value={stats.inactivityWarned}
            icon={Trash2}
            color="text-red-600"
            bg="bg-red-500/10"
            urgent
          />
        </div>
      </div>

      {/* Section: Emergency Contacts */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Emergency Contacts</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total ECs"
            value={stats.totalECs}
            icon={Phone}
            color="text-primary"
            bg="bg-primary/10"
            onClick={() => navigate("/admin/contacts")}
          />
          <StatCard
            label="Active ECs"
            value={stats.totalECs - stats.ecsOptedOut}
            icon={CheckCircle2}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/contacts?filter=active")}
          />
          <StatCard
            label="ECs Opted Out"
            value={stats.ecsOptedOut}
            icon={ShieldAlert}
            color="text-red-600"
            bg="bg-red-500/10"
            onClick={() => navigate("/admin/contacts?filter=opted_out")}
          />
          <StatCard
            label="Avg ECs / Senior"
            value={stats.totalSeniors > 0 ? (stats.totalECs / stats.totalSeniors).toFixed(1) : "0"}
            icon={Smile}
            color="text-primary"
            bg="bg-primary/10"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 7-day check-in trend */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              7-Day Check-In Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.weekTrend} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="SAFE" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MISSED" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's check-ins */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Today's Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todayCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No check-ins today yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.todayCheckins} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.todayCheckins.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mood distribution + Recent Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mood distribution (last 7 days) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smile className="w-4 h-4 text-primary" />
              Mood Distribution (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.moodCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No mood data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.moodCounts} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mood" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.moodCounts.map((entry) => (
                      <Cell key={entry.mood} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent alerts</p>
            ) : (
              <div className="space-y-2">
                {stats.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold">{alert.senior_name}</p>
                      <p className="text-xs text-muted-foreground">Notified: {alert.contact_name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {alert.alerted_at
                        ? new Date(alert.alerted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
