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
  CalendarDays, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, PieChart, Pie,
  AreaChart, Area, LineChart, Line,
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
  todaySkipped: number;
  checkinRate: number;
  totalAlerts7d: number;
  inactivityWarned: number;
  todayCheckins: { status: string; count: number }[];
  weekTrend: { date: string; SAFE: number; MISSED: number; PENDING: number }[];
  moodCounts: { mood: string; count: number; fill: string }[];
  recentAlerts: {
    id: string;
    senior_name: string;
    contact_name: string;
    alerted_at: string;
  }[];
  smsConsentPie: { name: string; value: number; fill: string }[];
  signupTrend: { date: string; count: number }[];
  responseTimeTrend: { date: string; avgMinutes: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  SAFE: "#059669",
  PENDING: "#d97706",
  MISSED: "#dc2626",
  SKIPPED: "#6b7280",
};

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 12,
    border: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    fontSize: 12,
    fontWeight: 600,
  },
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      const start30 = thirtyDaysAgo.toISOString().split("T")[0];

      // Get admin profile_ids to exclude from stats
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("role", "admin");
      const adminProfileIds = (adminProfiles || []).map((p) => p.user_id);

      // Get admin senior IDs to exclude
      let adminSeniorIds: string[] = [];
      if (adminProfileIds.length > 0) {
        const { data: adminSeniors } = await supabase
          .from("seniors")
          .select("id")
          .in("profile_id", adminProfileIds);
        adminSeniorIds = (adminSeniors || []).map((s) => s.id);
      }

      const [
        { data: seniors },
        { data: ecs },
        { data: todayCheckins },
        { data: alerts },
        { data: weekCheckins },
        { data: moodData },
        { data: alerts7dData },
        { data: allCheckins30d },
      ] = await Promise.all([
        supabase.from("seniors").select("id, paused, sms_consent_status, inactivity_warned_at, created_at"),
        supabase.from("emergency_contacts").select("id, opted_out, senior_id"),
        supabase.from("check_ins").select("senior_id, status").eq("date", today),
        supabase
          .from("alerts")
          .select("id, senior_id, contact_name, alerted_at")
          .order("alerted_at", { ascending: false })
          .limit(8),
        supabase.from("check_ins").select("senior_id, date, status").gte("date", startDate),
        supabase
          .from("check_ins")
          .select("senior_id, mood")
          .gte("date", startDate)
          .not("mood", "is", null),
        supabase
          .from("alerts")
          .select("senior_id")
          .gte("alerted_at", startDate + "T00:00:00Z"),
        supabase
          .from("check_ins")
          .select("senior_id, date, status, sent_at, responded_at")
          .gte("date", start30),
      ]);

      const seniorList = (seniors || []).filter((s) => !adminSeniorIds.includes(s.id));
      const ecList = (ecs || []).filter((e) => !adminSeniorIds.includes(e.senior_id));
      const checkinList = (todayCheckins || []).filter((c) => !adminSeniorIds.includes(c.senior_id));
      const allCheckins30dFiltered = (allCheckins30d || []).filter((c) => !adminSeniorIds.includes(c.senior_id));

      // Today counts
      const todaySafe = checkinList.filter((c) => c.status === "SAFE").length;
      const todayMissed = checkinList.filter((c) => c.status === "MISSED").length;
      const todayPending = checkinList.filter((c) => c.status === "PENDING").length;
      const todaySkipped = checkinList.filter((c) => c.status === "SKIPPED").length;
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
      const trendMap: Record<string, { SAFE: number; MISSED: number; PENDING: number }> = {};
      days.forEach((d) => { trendMap[d] = { SAFE: 0, MISSED: 0, PENDING: 0 }; });
      (weekCheckins || []).filter((ci) => !adminSeniorIds.includes(ci.senior_id)).forEach((ci) => {
        if (trendMap[ci.date]) {
          const s = ci.status as "SAFE" | "MISSED" | "PENDING";
          if (s in trendMap[ci.date]) trendMap[ci.date][s]++;
        }
      });
      const weekTrend = days.map((d) => ({
        date: new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        SAFE: trendMap[d].SAFE,
        MISSED: trendMap[d].MISSED,
        PENDING: trendMap[d].PENDING,
      }));

      // Mood distribution
      const MOOD_CONFIG: Record<string, { label: string; fill: string }> = {
        great: { label: "Great", fill: "#059669" },
        okay: { label: "Okay", fill: "#d97706" },
        "not-great": { label: "Not Great", fill: "#dc2626" },
      };
      const moodMap: Record<string, number> = {};
      (moodData || []).filter((ci) => !adminSeniorIds.includes(ci.senior_id)).forEach((ci) => {
        if (ci.mood) moodMap[ci.mood] = (moodMap[ci.mood] || 0) + 1;
      });
      const moodCounts = Object.entries(moodMap).map(([mood, count]) => ({
        mood: MOOD_CONFIG[mood]?.label || mood,
        count,
        fill: MOOD_CONFIG[mood]?.fill || "#6b7280",
      }));

      // SMS Consent pie chart
      const consentConfirmed = confirmed;
      const consentRequested = seniorList.filter((s) => s.sms_consent_status === "requested").length;
      const consentNone = seniorList.filter((s) => !s.sms_consent_status || s.sms_consent_status === "none").length;
      const consentOptedOut = seniorList.filter((s) => s.sms_consent_status === "opted_out").length;
      const smsConsentPie = [
        { name: "Active", value: consentConfirmed, fill: "#059669" },
        { name: "Requested", value: consentRequested, fill: "#d97706" },
        { name: "None", value: consentNone, fill: "#94a3b8" },
        { name: "Opted Out", value: consentOptedOut, fill: "#dc2626" },
      ].filter((d) => d.value > 0);

      // Signup trend (last 30 days)
      const signupDays: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        signupDays.push(d.toISOString().split("T")[0]);
      }
      const signupMap: Record<string, number> = {};
      signupDays.forEach((d) => { signupMap[d] = 0; });
      seniorList.forEach((s) => {
        const d = (s.created_at || "").split("T")[0];
        if (signupMap[d] !== undefined) signupMap[d]++;
      });
      let cumulative = seniorList.filter((s) => (s.created_at || "").split("T")[0] < signupDays[0]).length;
      const signupTrend = signupDays.map((d) => {
        cumulative += signupMap[d];
        return {
          date: new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: cumulative,
        };
      });

      // Average response time trend (last 7 days)
      const responseTimeTrend = days.map((d) => {
        const dayCheckins = allCheckins30dFiltered.filter(
          (c) => c.date === d && c.sent_at && c.responded_at
        );
        let avgMinutes = 0;
        if (dayCheckins.length > 0) {
          const totalMs = dayCheckins.reduce((sum, c) => {
            return sum + (new Date(c.responded_at!).getTime() - new Date(c.sent_at!).getTime());
          }, 0);
          avgMinutes = Math.round(totalMs / dayCheckins.length / 60000);
        }
        return {
          date: new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          avgMinutes,
        };
      });

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
        consentConfirmed,
        consentRequested,
        consentNone,
        consentOptedOut,
        totalECs: ecList.length,
        ecsOptedOut: ecList.filter((e) => e.opted_out).length,
        todaySafe,
        todayMissed,
        todayPending,
        todaySkipped,
        checkinRate,
        totalAlerts7d: (alerts7dData || []).filter((a) => !adminSeniorIds.includes(a.senior_id)).length,
        inactivityWarned: seniorList.filter((s: any) => s.inactivity_warned_at).length,
        todayCheckins: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        weekTrend,
        moodCounts,
        recentAlerts: (alerts || []).filter((a) => !adminSeniorIds.includes(a.senior_id)).map((a) => ({
          id: a.id,
          senior_name: seniorNames[a.senior_id] || "Unknown",
          contact_name: a.contact_name || "—",
          alerted_at: a.alerted_at || "",
        })),
        smsConsentPie,
        signupTrend,
        responseTimeTrend,
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-xl" />)}
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
            {stats.totalSeniors} registered user{stats.totalSeniors !== 1 ? "s" : ""}
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
              {stats.todayMissed} Missed Today
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

      {/* ═══ CHARTS SECTION (top) ═══ */}

      {/* Row 1: 7-Day Trend (wide) + Today's Breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              7-Day Check-In Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.weekTrend.every((d) => d.SAFE === 0 && d.MISSED === 0 && d.PENDING === 0) ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No check-in data this week</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.weekTrend} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="SAFE" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="MISSED" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PENDING" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Today's Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todayCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No check-ins today yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.todayCheckins} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
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

      {/* Row 2: Mood + SMS Consent Pie + Response Time */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Mood Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smile className="w-4 h-4 text-primary" />
              Mood Distribution (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.moodCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No mood data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.moodCounts}
                    dataKey="count"
                    nameKey="mood"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {stats.moodCounts.map((entry) => (
                      <Cell key={entry.mood} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SMS Consent Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              SMS Consent Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.smsConsentPie.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No users yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.smsConsentPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {stats.smsConsentPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Avg Response Time (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.responseTimeTrend.every((d) => d.avgMinutes === 0) ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No response data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.responseTimeTrend}>
                  <defs>
                    <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200, 70%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(200, 70%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} unit="m" />
                  <Tooltip
                    {...CUSTOM_TOOLTIP_STYLE}
                    formatter={(value: number) => [`${value} min`, "Avg Response"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgMinutes"
                    stroke="hsl(200, 70%, 45%)"
                    strokeWidth={2}
                    fill="url(#responseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: User Growth + Recent Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* User Growth (30 days) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              User Growth (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.signupTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(stats.signupTrend.length / 6)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Total Users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No recent alerts</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
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

      {/* ═══ STAT CARDS SECTION (below charts) ═══ */}

      {/* Section: Today's Status */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Today's Check-Ins</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Safe Today"
            value={stats.todaySafe}
            icon={CheckCircle2}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/users?today=SAFE")}
          />
          <StatCard
            label="Missed Today"
            value={stats.todayMissed}
            icon={AlertTriangle}
            color="text-red-600"
            bg="bg-red-500/10"
            onClick={() => navigate("/admin/users?today=MISSED")}
            urgent
          />
          <StatCard
            label="Pending Today"
            value={stats.todayPending}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/users?today=PENDING")}
          />
          <StatCard
            label="Skipped Today"
            value={stats.todaySkipped}
            icon={Pause}
            color="text-muted-foreground"
            bg="bg-muted"
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

      {/* Section: Accounts & Contacts */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Accounts & Contacts</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalSeniors}
            icon={Users}
            color="text-primary"
            bg="bg-primary/10"
            onClick={() => navigate("/admin/users")}
          />
          <StatCard
            label="Active Accounts"
            value={stats.activeSeniors}
            icon={Activity}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            onClick={() => navigate("/admin/users?status=active")}
          />
          <StatCard
            label="Paused"
            value={stats.pausedSeniors}
            icon={Pause}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/users?status=paused")}
          />
          <StatCard
            label="Alerts (7 Days)"
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
            onClick={() => navigate("/admin/users?sms=confirmed")}
          />
          <StatCard
            label="Awaiting YES Reply"
            value={stats.consentRequested}
            icon={Clock}
            color="text-amber-600"
            bg="bg-amber-500/10"
            onClick={() => navigate("/admin/users?sms=requested")}
          />
          <StatCard
            label="Opted Out"
            value={stats.consentOptedOut}
            icon={UserX}
            color="text-red-600"
            bg="bg-red-500/10"
            onClick={() => navigate("/admin/users?sms=opted_out")}
          />
          <StatCard
            label="No SMS Set Up"
            value={stats.consentNone}
            icon={BellOff}
            color="text-muted-foreground"
            bg="bg-muted"
            onClick={() => navigate("/admin/users?sms=none")}
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
            label="Avg ECs / User"
            value={stats.totalSeniors > 0 ? (stats.totalECs / stats.totalSeniors).toFixed(1) : "0"}
            icon={Smile}
            color="text-primary"
            bg="bg-primary/10"
          />
        </div>
      </div>
    </div>
  );
}
