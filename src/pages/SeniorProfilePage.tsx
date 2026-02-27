import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import SeniorProfileHeader from "@/components/senior-profile/SeniorProfileHeader";
import QuickStatsStrip from "@/components/senior-profile/QuickStatsStrip";
import CheckinCalendar from "@/components/senior-profile/CheckinCalendar";
import SeniorMoodTrendsCard from "@/components/senior-profile/SeniorMoodTrendsCard";
import ActivityTimeline from "@/components/senior-profile/ActivityTimeline";
import CaregiverNotes from "@/components/senior-profile/CaregiverNotes";
import ProfileSettingsSummary from "@/components/senior-profile/ProfileSettingsSummary";
import { MOCK_SENIOR } from "@/components/senior-profile/mock-data";

export default function SeniorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [senior, setSenior] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    loadSenior();
  }, [id, user]);

  const loadSenior = async () => {
    setLoading(true);
    // Try loading from DB first
    if (user && id && !id.startsWith("demo")) {
      const { data } = await supabase
        .from("managed_seniors")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setSenior(data);
        // Load contact count
        const { count } = await supabase
          .from("managed_senior_contacts")
          .select("*", { count: "exact", head: true })
          .eq("managed_senior_id", id);
        setContactCount(count || 0);
        setLoading(false);
        return;
      }
    }
    // Fallback to mock
    setSenior(MOCK_SENIOR);
    setContactCount(3);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[960px] mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!senior) return null;

  const schedule = `${senior.frequency === "daily" ? "Daily" : "Custom"} at ${senior.reminder_hour}:${senior.reminder_minute} ${senior.reminder_period} ${senior.timezone?.split("/")[1]?.replace("_", " ") || ""}`;
  const activeDays = senior.frequency === "daily"
    ? "Every day"
    : senior.custom_days?.length
      ? senior.custom_days.join(", ")
      : "Every day";

  const seniorId = id || senior.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[960px] mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <SeniorProfileHeader
          firstName={senior.first_name}
          lastName={senior.last_name}
          relationship={senior.relationship}
          dateOfBirth={senior.date_of_birth}
          phone={senior.phone}
          status="checked"
          lastCheckIn="Today at 8:04 AM"
          seniorId={seniorId}
        />

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
          {/* Left column */}
          <div className="space-y-5">
            <CheckinCalendar />
            <ActivityTimeline />
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <QuickStatsStrip
              streak={47}
              weekCheckins={6}
              weekTotal={7}
              monthRate={91}
              monthTrend={3}
              avgResponseMin={4}
            />
            <SeniorMoodTrendsCard />
            <CaregiverNotes firstName={senior.first_name} managedSeniorId={seniorId} />
            <ProfileSettingsSummary
              seniorId={seniorId}
              schedule={schedule}
              gracePeriod={senior.grace_period_minutes}
              moodCheckEnabled={senior.mood_check_enabled}
              activeDays={activeDays}
              vacationMode={senior.vacation_mode}
              vacationUntil={senior.vacation_until}
              contactCount={contactCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
