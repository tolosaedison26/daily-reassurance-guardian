import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import SeniorProfileHeader from "@/components/senior-profile/SeniorProfileHeader";
import QuickStatsStrip from "@/components/senior-profile/QuickStatsStrip";
import CheckinCalendar from "@/components/senior-profile/CheckinCalendar";
import SeniorMoodTrendsCard from "@/components/senior-profile/SeniorMoodTrendsCard";
import ActivityTimeline from "@/components/senior-profile/ActivityTimeline";
import CaregiverNotes from "@/components/senior-profile/CaregiverNotes";
import ProfileSettingsSummary from "@/components/senior-profile/ProfileSettingsSummary";
import { MOCK_SENIOR } from "@/components/senior-profile/mock-data";

type ProfileStatus = "checked" | "awaiting" | "missed" | "none";

export default function SeniorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [senior, setSenior] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactCount, setContactCount] = useState(0);
  const [checkInStatus, setCheckInStatus] = useState<ProfileStatus>("none");
  const [lastCheckInLabel, setLastCheckInLabel] = useState<string | null>(null);
  const [stats, setStats] = useState({ streak: 0, weekCheckins: 0, weekTotal: 7, monthRate: 0, monthTrend: 0, avgResponseMin: 0 });

  useEffect(() => {
    if (!id) return;
    loadSenior();
  }, [id, user]);

  const loadSenior = async () => {
    setLoading(true);
    let seniorUserId: string | null = null;

    if (user && id && !id.startsWith("demo")) {
      const { data } = await supabase.from("managed_seniors").select("*").eq("id", id).single();
      if (data) {
        setSenior(data);
        seniorUserId = data.claimed_by || null;
        const { count } = await supabase.from("managed_senior_contacts").select("*", { count: "exact", head: true }).eq("managed_senior_id", id);
        setContactCount(count || 0);
        if (seniorUserId) {
          await loadCheckInData(seniorUserId, data);
        } else {
          setCheckInStatus("none");
          setLastCheckInLabel(null);
        }
        setLoading(false);
        return;
      }

      const { data: connData } = await supabase.from("senior_connections").select("senior_id").eq("caregiver_id", user.id).eq("senior_id", id).eq("status", "active").maybeSingle();
      if (connData) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", connData.senior_id).maybeSingle();
        if (profileData) {
          const names = profileData.full_name.split(" ");
          setSenior({
            first_name: names[0] || profileData.full_name, last_name: names.slice(1).join(" ") || "",
            relationship: null, date_of_birth: null, phone: null, grace_period_minutes: 60,
            mood_check_enabled: true, frequency: "daily", custom_days: [], vacation_mode: false, vacation_until: null,
            reminder_hour: "09", reminder_minute: "00", reminder_period: "AM", timezone: "America/New_York", id: connData.senior_id,
          });
          seniorUserId = connData.senior_id;
          await loadCheckInData(seniorUserId, null);
          setLoading(false);
          return;
        }
      }
    }
    // Fallback to mock
    setSenior(MOCK_SENIOR);
    setContactCount(3);
    setCheckInStatus("checked");
    setLastCheckInLabel("Today at 8:04 AM (demo)");
    setStats({ streak: 47, weekCheckins: 6, weekTotal: 7, monthRate: 91, monthTrend: 3, avgResponseMin: 4 });
    setLoading(false);
  };

  const loadCheckInData = async (seniorUserId: string, managedData: any) => {
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCheckIn } = await supabase.from("daily_check_ins").select("*").eq("senior_id", seniorUserId).eq("check_date", today).maybeSingle();

    if (todayCheckIn) {
      setCheckInStatus("checked");
      const time = new Date(todayCheckIn.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastCheckInLabel(`Today at ${time}`);
    } else {
      const reminderHour = managedData ? parseInt(managedData.reminder_hour) : 9;
      const now = new Date();
      const isPM = managedData?.reminder_period === "PM";
      const actualHour = isPM && reminderHour !== 12 ? reminderHour + 12 : reminderHour;
      const graceMinutes = managedData?.grace_period_minutes || 60;

      if (now.getHours() > actualHour || (now.getHours() === actualHour && now.getMinutes() > graceMinutes)) {
        setCheckInStatus("missed");
      } else if (now.getHours() >= actualHour) {
        setCheckInStatus("awaiting");
      } else {
        setCheckInStatus("none");
      }

      const { data: lastCheckIn } = await supabase.from("daily_check_ins").select("checked_in_at").eq("senior_id", seniorUserId).order("checked_in_at", { ascending: false }).limit(1).maybeSingle();
      if (lastCheckIn) {
        const d = new Date(lastCheckIn.checked_in_at);
        setLastCheckInLabel(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setLastCheckInLabel(null);
      }
    }

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentCheckIns } = await supabase.from("daily_check_ins").select("check_date, checked_in_at").eq("senior_id", seniorUserId).gte("check_date", thirtyDaysAgo.toISOString().split("T")[0]).order("check_date", { ascending: false });

    const allCheckins = recentCheckIns || [];
    const weekCheckins = allCheckins.filter(c => new Date(c.check_date) >= sevenDaysAgo).length;
    const monthRate = allCheckins.length > 0 ? Math.round((allCheckins.length / 30) * 100) : 0;

    let streak = 0;
    const checkDates = new Set(allCheckins.map(c => c.check_date));
    const d = new Date();
    if (!todayCheckIn) d.setDate(d.getDate() - 1);
    while (checkDates.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate() - 1); }

    let totalResponseMin = 0, responseCount = 0;
    const rHour = managedData ? parseInt(managedData.reminder_hour) : 9;
    allCheckins.forEach(c => {
      const t = new Date(c.checked_in_at);
      const diffMin = (t.getHours() * 60 + t.getMinutes()) - (rHour * 60);
      if (diffMin > 0 && diffMin < 120) { totalResponseMin += diffMin; responseCount++; }
    });

    setStats({
      streak, weekCheckins, weekTotal: 7,
      monthRate: Math.min(100, monthRate), monthTrend: 0,
      avgResponseMin: responseCount > 0 ? Math.round(totalResponseMin / responseCount) : 0,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (!senior) return null;

  const schedule = `${senior.frequency === "daily" ? "Daily" : "Custom"} at ${senior.reminder_hour}:${senior.reminder_minute} ${senior.reminder_period} ${senior.timezone?.split("/")[1]?.replace("_", " ") || ""}`;
  const activeDays = senior.frequency === "daily" ? "Every day" : senior.custom_days?.length ? senior.custom_days.join(", ") : "Every day";
  const seniorId = id || senior.id;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </button>

      <SeniorProfileHeader
        firstName={senior.first_name} lastName={senior.last_name}
        relationship={senior.relationship} dateOfBirth={senior.date_of_birth}
        phone={senior.phone} status={checkInStatus} lastCheckIn={lastCheckInLabel} seniorId={seniorId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        <div className="space-y-5">
          <CheckinCalendar />
          <ActivityTimeline />
        </div>
        <div className="space-y-5">
          <QuickStatsStrip streak={stats.streak} weekCheckins={stats.weekCheckins} weekTotal={stats.weekTotal} monthRate={stats.monthRate} monthTrend={stats.monthTrend} avgResponseMin={stats.avgResponseMin} />
          <SeniorMoodTrendsCard />
          <CaregiverNotes firstName={senior.first_name} managedSeniorId={seniorId} />
          <ProfileSettingsSummary seniorId={seniorId} schedule={schedule} gracePeriod={senior.grace_period_minutes} moodCheckEnabled={senior.mood_check_enabled} activeDays={activeDays} vacationMode={senior.vacation_mode} vacationUntil={senior.vacation_until} contactCount={contactCount} />
        </div>
      </div>
    </div>
  );
}
