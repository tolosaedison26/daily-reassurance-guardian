import { Link } from "react-router-dom";
import { Calendar, Clock, Smile, CalendarDays, Palmtree, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileSettingsSummaryProps {
  seniorId: string;
  schedule: string;
  gracePeriod: number;
  moodCheckEnabled: boolean;
  activeDays: string;
  vacationMode: boolean;
  vacationUntil?: string | null;
  contactCount: number;
}

export default function ProfileSettingsSummary({
  seniorId, schedule, gracePeriod, moodCheckEnabled, activeDays, vacationMode, vacationUntil, contactCount,
}: ProfileSettingsSummaryProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black">Check-in Settings</h3>
        <Link to={`/seniors/${seniorId}/edit`} className="text-sm font-bold text-primary hover:underline">Edit</Link>
      </div>

      <div className="space-y-3">
        <Row icon={Calendar} label="Schedule" value={schedule} />
        <Row icon={Clock} label="Grace period" value={`${gracePeriod}-minute grace period`} />
        <Row icon={Smile} label="Mood check" value={moodCheckEnabled ? "Enabled" : "Off"} badge={moodCheckEnabled ? "green" : "grey"} />
        <Row icon={CalendarDays} label="Active days" value={activeDays} />
        <Row
          icon={Palmtree}
          label="Vacation mode"
          value={vacationMode ? `Active${vacationUntil ? ` · Paused until ${vacationUntil}` : ""}` : "Off"}
          badge={vacationMode ? "amber" : "grey"}
        />
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Emergency contacts</span>
          <Link to={`/seniors/${seniorId}/contacts`} className="text-sm font-bold text-primary hover:underline ml-auto">
            {contactCount} contact{contactCount !== 1 ? "s" : ""}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, badge }: { icon: typeof Calendar; label: string; value: string; badge?: "green" | "amber" | "grey" }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold ml-auto text-right">
        {badge ? (
          <Badge
            variant="secondary"
            className="font-bold text-xs"
            style={{
              background: badge === "green" ? "hsl(var(--status-checked) / 0.12)" : badge === "amber" ? "hsl(var(--status-pending) / 0.12)" : undefined,
              color: badge === "green" ? "hsl(var(--status-checked))" : badge === "amber" ? "hsl(var(--status-pending))" : undefined,
            }}
          >
            {value}
          </Badge>
        ) : value}
      </span>
    </div>
  );
}
