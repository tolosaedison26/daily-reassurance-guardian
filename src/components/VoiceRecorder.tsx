import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Square, Send, Trash2, Loader2, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  seniorId: string;
  onSent: () => void;
}

export default function VoiceRecorder({ seniorId, onSent }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permDenied, setPermDenied] = useState(false);
  const [supported, setSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_DURATION = 60;
  const WARN_AT = 55;

  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setSupported(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setPermDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION) {
            stopRecording();
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setPermDenied(true);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const discard = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  const sendMessage = async () => {
    if (!audioBlob) return;
    setUploading(true);

    const path = `${seniorId}/${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from("voice-messages")
      .upload(path, audioBlob, { contentType: "audio/webm" });

    if (uploadError) {
      alert("Failed to upload voice message. Please try again.");
      setUploading(false);
      return;
    }
    const { error: insertError } = await supabase.from("voice_messages").insert({
      senior_id: seniorId,
      audio_path: path,
      duration_seconds: duration,
    });
    if (insertError) {
      alert("Failed to save voice message. Please try again.");
      setUploading(false);
      return;
    }
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      onSent();
    }, 2000);
    setUploading(false);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!supported) return null;

  if (sent) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card text-center">
        <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--status-checked))" }} />
        <p className="font-bold text-base">Voice note received</p>
        <p className="text-sm text-muted-foreground">Your family will hear it shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
      <p className="font-semibold text-base mb-4">Send a voice message to your family</p>

      {permDenied && (
        <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: "hsl(var(--status-alert) / 0.08)" }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-alert))" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--status-alert))" }}>
              Microphone access was denied
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please allow microphone access in your browser settings and try again.
            </p>
            <Button variant="outline" size="sm" className="mt-2 text-xs gap-1" onClick={() => { setPermDenied(false); startRecording(); }}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg min-w-[64px] min-h-[64px]"
            style={{
              background: recording
                ? "hsl(var(--status-alert))"
                : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
            }}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? (
              <Square className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          {recording ? (
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: "hsl(var(--status-alert))" }}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ background: "hsl(var(--status-alert))" }} />
                Recording {formatDuration(duration)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Tap to stop</p>
              {duration >= WARN_AT && (
                <p className="text-xs font-semibold mt-1" style={{ color: "hsl(var(--status-pending))" }}>
                  Auto-stopping in {MAX_DURATION - duration}s…
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Tap to start recording (up to 1 min)</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>🎙</span>
            <span>Duration: {formatDuration(duration)}</span>
          </div>
          <audio src={audioUrl!} controls className="w-full rounded-xl" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={discard}
              className="flex-1 h-12 rounded-xl min-h-[48px]"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Re-record
            </Button>
            <Button
              onClick={sendMessage}
              disabled={uploading}
              className="flex-1 h-12 rounded-xl font-bold min-h-[48px]"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Send className="w-4 h-4 mr-1" /> Use this recording</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
