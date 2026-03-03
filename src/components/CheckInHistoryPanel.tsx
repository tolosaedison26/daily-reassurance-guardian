import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, CheckCircle, Loader, Calendar, Mic, Play, Pause, Square } from "lucide-react";

interface CheckIn {
  id: string;
  check_date: string;
  checked_in_at: string;
}

interface VoiceMessage {
  id: string;
  audio_path: string;
  duration_seconds: number | null;
  created_at: string;
}

interface CheckInHistoryPanelProps {
  seniorId: string;
  seniorName: string;
  onClose: () => void;
}

export default function CheckInHistoryPanel({ seniorId, seniorName, onClose }: CheckInHistoryPanelProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"checkins" | "voice">("checkins");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [checkInsRes, voiceRes] = await Promise.all([
      supabase
        .from("check_ins")
        .select("id, check_date, checked_in_at")
        .eq("senior_id", seniorId)
        .eq("status", "SAFE")
        .order("check_date", { ascending: false })
        .limit(30),
      (supabase.from as any)("voice_messages")
        .select("id, audio_path, duration_seconds, created_at")
        .eq("senior_id", seniorId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setCheckIns(checkInsRes.data || []);
    setVoiceMessages(voiceRes.data || []);
    setLoading(false);
  };

  const playVoice = async (vm: VoiceMessage) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === vm.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(vm.id);
    const { data } = await supabase.storage
      .from("voice-messages")
      .createSignedUrl(vm.audio_path, 3600);
    if (data?.signedUrl) {
      const audio = new Audio(data.signedUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => { setPlayingId(null); audioRef.current = null; };
      audio.onerror = () => { setPlayingId(null); audioRef.current = null; };
    } else {
      setPlayingId(null);
    }
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

  const streak = (() => {
    if (checkIns.length === 0) return 0;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < checkIns.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (checkIns[i].check_date === expected.toISOString().split("T")[0]) {
        count++;
      } else break;
    }
    return count;
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="flex-1" onClick={onClose} />
      <div className="rounded-t-3xl bg-background shadow-xl flex flex-col animate-slide-up" style={{ maxHeight: "82vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="text-xl font-black">{seniorName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">History & messages</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 pb-2">
          <button
            onClick={() => setTab("checkins")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              background: tab === "checkins" ? "hsl(var(--status-checked) / 0.12)" : "hsl(var(--muted))",
              color: tab === "checkins" ? "hsl(var(--status-checked))" : "hsl(var(--muted-foreground))",
            }}
          >
            <CheckCircle className="w-4 h-4" />
            Check-ins ({checkIns.length})
          </button>
          <button
            onClick={() => setTab("voice")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              background: tab === "voice" ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
              color: tab === "voice" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            <Mic className="w-4 h-4" />
            Voice ({voiceMessages.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tab === "checkins" ? (
            <>
              {checkIns.length > 0 && (
                <div className="flex gap-3 mb-3">
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
              {checkIns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm font-semibold">No check-ins yet</p>
                </div>
              ) : (
                checkIns.map((ci) => (
                  <div key={ci.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-card">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(var(--status-checked) / 0.12)" }}>
                      <CheckCircle className="w-5 h-5" style={{ color: "hsl(var(--status-checked))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{formatDate(ci.check_date)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Checked in at {formatTime(ci.checked_in_at)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold shrink-0">{timeAgo(ci.check_date)}</span>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {voiceMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                  <Mic className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm font-semibold">No voice messages yet</p>
                </div>
              ) : (
                voiceMessages.map((vm) => {
                  const isPlaying = playingId === vm.id;
                  return (
                    <div key={vm.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border shadow-card">
                      <button
                        onClick={() => playVoice(vm)}
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95"
                        style={{ background: isPlaying ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.12)" }}
                      >
                        {isPlaying ? (
                          <Square className="w-4 h-4" style={{ color: "#fff" }} />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" style={{ color: "hsl(var(--primary))" }} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">🎙 Voice message</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {vm.duration_seconds ? `${vm.duration_seconds}s · ` : ""}
                          {formatTime(vm.created_at)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold shrink-0">{timeAgo(vm.created_at)}</span>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
