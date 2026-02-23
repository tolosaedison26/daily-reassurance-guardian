import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, CheckCircle, Loader, Calendar } from "lucide-react";

interface CheckIn {
  id: string;
  check_date: string;
  checked_in_at: string;
}

interface CheckInHistoryPanelProps {
  seniorId: string;
  seniorName: string;
  onClose: () => void;
}

export default function CheckInHistoryPanel({ seniorId, seniorName, onClose }: CheckInHistoryPanelProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("daily_check_ins")
      .select("id, check_date, checked_in_at")
      .eq("senior_id", seniorId)
      .order("check_date", { ascending: false })
      .limit(30);
    setCheckIns(data || []);
    setLoading(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  // Calculate streak
  const streak = (() => {
    if (checkIns.length === 0) return 0;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < checkIns.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const checkDate = checkIns[i].check_date;
      if (checkDate === expected.toISOString().split("T")[0]) {
        count++;
      } else {
        break;
      }
    }
    return count;
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="flex-1" onClick={onClose} />
      <div className="rounded-t-3xl bg-background shadow-xl flex flex-col animate-slide-up" style={{ maxHeight: "82vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-black">{seniorName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Check-in history · Last 30 days</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Streak */}
        {!loading && checkIns.length > 0 && (
          <div className="px-5 pt-4 pb-2 flex gap-3">
            <div className="flex-1 bg-card rounded-2xl p-4 border border-border shadow-card text-center">
              <p className="text-3xl font-black" style={{ color: "hsl(var(--status-checked))" }}>{streak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Day streak 🔥</p>
            </div>
            <div className="flex-1 bg-card rounded-2xl p-4 border border-border shadow-card text-center">
              <p className="text-3xl font-black" style={{ color: "hsl(var(--primary))" }}>{checkIns.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total check-ins</p>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : checkIns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
              <Calendar className="w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm font-semibold">No check-ins yet</p>
            </div>
          ) : (
            checkIns.map((ci) => (
              <div
                key={ci.id}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-card"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--status-checked) / 0.12)" }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{formatDate(ci.check_date)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked in at {formatTime(ci.checked_in_at)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-semibold shrink-0">
                  {timeAgo(ci.check_date)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
