import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCaregiversSeniors, getSeniorCheckInStatus } from "@/lib/supabase-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Clock, PhoneCall, Pencil } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import AvatarCircle from "@/components/ui/AvatarCircle";
import EmptyState from "@/components/ui/EmptyState";
import { SeniorListSkeleton } from "@/components/ui/LoadingSkeleton";

interface SeniorItem {
  id: string;
  full_name: string;
  relationship: string | null;
  status: "safe" | "pending" | "missed" | "paused";
  last_check_in: string | null;
}

function deriveStatus(senior: any, todayCheckIn: any): "safe" | "pending" | "missed" | "paused" {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (senior.vacation_mode && senior.vacation_from && senior.vacation_until) {
    if (todayStr >= senior.vacation_from && todayStr <= senior.vacation_until) return "paused";
  }

  if (todayCheckIn?.status === "SAFE") return "safe";
  if (todayCheckIn?.status === "MISSED") return "missed";

  const reminderHour = parseInt(senior.reminder_hour || "9");
  const isPM = senior.reminder_period === "PM";
  const actualHour = isPM && reminderHour !== 12 ? reminderHour + 12 : (!isPM && reminderHour === 12 ? 0 : reminderHour);
  const reminderMinute = parseInt(senior.reminder_minute || "0");
  const graceMinutes = senior.grace_period_minutes || 60;
  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const reminderMinutes = actualHour * 60 + reminderMinute;

  if (nowMinutes < reminderMinutes) return "pending";
  if (nowMinutes < reminderMinutes + graceMinutes) return "pending";
  return "missed";
}

export default function SeniorsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seniors, setSeniors] = useState<SeniorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    loadSeniors();
  }, [user]);

  const loadSeniors = async () => {
    if (!user) return;
    setLoading(true);

    const { data: familyData } = await getCaregiversSeniors(user.id);

    const items: SeniorItem[] = await Promise.all(
      (familyData || []).map(async (entry: any) => {
        const senior = entry.senior;
        if (!senior) return null;
        const todayCheckIn = await getSeniorCheckInStatus(senior.id);
        const status = deriveStatus(senior, todayCheckIn);
        return {
          id: senior.id,
          full_name: `${senior.first_name} ${senior.last_name}`,
          relationship: senior.relationship,
          status,
          last_check_in: null,
        };
      })
    );

    const filtered = items.filter(Boolean) as SeniorItem[];
    const urgency: Record<string, number> = { missed: 0, pending: 1, paused: 2, safe: 3 };
    filtered.sort((a, b) => (urgency[a.status] ?? 2) - (urgency[b.status] ?? 2));
    setSeniors(filtered);
    setLoading(false);
  };

  const filteredList = seniors.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">All Seniors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{seniors.length} {seniors.length === 1 ? "person" : "people"} being monitored</p>
        </div>
        <Button onClick={() => navigate("/seniors/new")} className="rounded-xl font-bold gap-1.5">
          <Plus className="w-4 h-4" /> Add Senior
        </Button>
      </div>

      {seniors.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…" className="pl-10 h-11 rounded-xl" />
        </div>
      )}

      {loading ? (
        <SeniorListSkeleton count={4} />
      ) : seniors.length === 0 ? (
        <EmptyState icon={Users} title="No seniors yet" description="Add your first senior to start daily check-ins." actionLabel="Add Senior" onAction={() => navigate("/seniors/new")} />
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No results for "{search}"</div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((senior) => (
            <Link key={senior.id} to={`/seniors/${senior.id}`} className="block bg-card rounded-2xl p-5 border border-border shadow-card cursor-pointer active:scale-[0.98] transition-all hover:bg-muted/50 no-underline">
              <div className="flex items-center gap-4">
                <AvatarCircle name={senior.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base leading-tight truncate text-foreground">{senior.full_name}</p>
                    {senior.relationship && <span className="text-xs text-muted-foreground">· {senior.relationship}</span>}
                  </div>
                  {senior.status === "safe" ? (
                    <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-checked))" }}>✓ Checked in today</p>
                  ) : senior.status === "missed" ? (
                    <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-alert))" }}>Missed today's check-in</p>
                  ) : senior.status === "paused" ? (
                    <p className="text-sm mt-0.5 text-muted-foreground">Check-ins paused</p>
                  ) : (
                    <p className="text-sm mt-0.5" style={{ color: "hsl(var(--status-pending))" }}>Awaiting check-in</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/seniors/${senior.id}/contacts`); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors" aria-label={`Contacts for ${senior.full_name}`}>
                    <PhoneCall className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/seniors/${senior.id}/edit`); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors" aria-label={`Edit ${senior.full_name}`}>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <StatusBadge status={senior.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
