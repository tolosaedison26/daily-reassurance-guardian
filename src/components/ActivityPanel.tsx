import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, CheckCircle, Mic, Loader, Play } from "lucide-react";

interface SeniorInfo {
  senior_id: string;
  full_name: string;
}

interface Activity {
  id: string;
  type: "check_in" | "voice_message";
  senior_name: string;
  senior_id: string;
  created_at: string;
  audio_path?: string;
}

interface ActivityPanelProps {
  caregiverId: string;
  seniors: SeniorInfo[];
  onClose: () => void;
}

export default function ActivityPanel({ caregiverId, seniors, onClose }: ActivityPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const seniorMap = Object.fromEntries(seniors.map((s) => [s.senior_id, s.full_name]));

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    const seniorIds = seniors.map((s) => s.senior_id);

    if (seniorIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const [checkInsRes, voiceRes] = await Promise.all([
      supabase
        .from("daily_check_ins")
        .select("id, senior_id, checked_in_at")
        .in("senior_id", seniorIds)
        .order("checked_in_at", { ascending: false })
        .limit(20),
      (supabase.from as any)("voice_messages")
        .select("id, senior_id, audio_path, duration_seconds, created_at")
        .in("senior_id", seniorIds)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const checkInActivities: Activity[] = (checkInsRes.data || []).map((ci: any) => ({
      id: ci.id,
      type: "check_in",
      senior_name: seniorMap[ci.senior_id] || "Unknown",
      senior_id: ci.senior_id,
      created_at: ci.checked_in_at,
    }));

    const voiceActivities: Activity[] = (voiceRes.data || []).map((vm: any) => ({
      id: vm.id,
      type: "voice_message",
      senior_name: seniorMap[vm.senior_id] || "Unknown",
      senior_id: vm.senior_id,
      created_at: vm.created_at,
      audio_path: vm.audio_path,
    }));

    const all = [...checkInActivities, ...voiceActivities].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setActivities(all);
    setLoading(false);
  };

  const playVoiceMessage = async (activity: Activity) => {
    if (!activity.audio_path) return;
    setPlayingId(activity.id);

    const { data } = await supabase.storage
      .from("voice-messages")
      .createSignedUrl(activity.audio_path, 3600);

    if (data?.signedUrl) {
      const audio = new Audio(data.signedUrl);
      audio.play();
      audio.onended = () => setPlayingId(null);
    } else {
      setPlayingId(null);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)" }}>
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Panel */}
      <div
        className="rounded-t-3xl bg-background shadow-xl flex flex-col animate-slide-up"
        style={{ maxHeight: "82vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-black">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Updates from your loved ones</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
              <p className="text-3xl">🌿</p>
              <p className="text-muted-foreground text-sm">No recent activity yet</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-card"
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      activity.type === "check_in"
                        ? "hsl(var(--status-checked) / 0.12)"
                        : "hsl(var(--primary) / 0.12)",
                  }}
                >
                  {activity.type === "check_in" ? (
                    <CheckCircle
                      className="w-5 h-5"
                      style={{ color: "hsl(var(--status-checked))" }}
                    />
                  ) : (
                    <Mic className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{activity.senior_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.type === "check_in"
                      ? "✅ Checked in"
                      : "🎙 Sent a voice message"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.created_at)}</p>
                </div>

                {/* Play button for voice */}
                {activity.type === "voice_message" && (
                  <button
                    onClick={() => playVoiceMessage(activity)}
                    disabled={playingId === activity.id}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    {playingId === activity.id ? (
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
