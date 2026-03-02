import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface CheckInEntry {
  id: string;
  check_date: string;
  checked_in_at: string;
}

function formatTimestamp(d: Date) {
  const time = format(d, "h:mm a");
  if (isToday(d)) return `Today ${time}`;
  if (isYesterday(d)) return `Yesterday ${time}`;
  return `${format(d, "MMM d")} · ${time}`;
}

interface ActivityTimelineProps {
  seniorUserId?: string | null;
}

export default function ActivityTimeline({ seniorUserId }: ActivityTimelineProps) {
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadCheckIns();
  }, [seniorUserId]);

  const loadCheckIns = async () => {
    if (!seniorUserId) {
      setCheckIns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const { data, error: err } = await supabase
      .from("daily_check_ins")
      .select("id, check_date, checked_in_at")
      .eq("senior_id", seniorUserId)
      .order("checked_in_at", { ascending: false })
      .limit(50);

    if (err) {
      setError(true);
    } else {
      setCheckIns(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="text-lg font-black mb-1">Recent Activity</h3>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="text-lg font-black mb-1">Recent Activity</h3>
        <div className="flex items-center justify-center h-32 gap-2">
          <p className="text-sm" style={{ color: "hsl(var(--status-alert))" }}>Couldn't load history</p>
          <Button variant="ghost" size="sm" onClick={loadCheckIns} className="text-sm font-bold">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (checkIns.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="text-lg font-black mb-1">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <Clock className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-muted-foreground">No check-in history yet</p>
          <p className="text-sm text-muted-foreground/60 max-w-[280px]">
            Check-in history will appear here once the first reminder is sent and responded to.
          </p>
        </div>
      </div>
    );
  }

  const visible = showAll ? checkIns : checkIns.slice(0, 10);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <h3 className="text-lg font-black mb-1">Recent Activity</h3>
      <p className="text-xs text-muted-foreground mb-4">Check-in records</p>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-0">
          {visible.map((ci) => {
            const ts = new Date(ci.checked_in_at);
            return (
              <div key={ci.id} className="flex items-start gap-3 py-2.5 relative">
                <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 bg-card z-10 border border-border">
                  <CheckCircle className="w-4 h-4" style={{ color: "hsl(var(--status-checked))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Checked in</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ci.check_date}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                  {formatTimestamp(ts)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {!showAll && checkIns.length > 10 && (
        <Button variant="ghost" className="w-full mt-2 font-bold text-sm" onClick={() => setShowAll(true)}>
          Load more
        </Button>
      )}
    </div>
  );
}
