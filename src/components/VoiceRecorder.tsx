import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Square, Send, Trash2, Loader } from "lucide-react";
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_DURATION = 120; // 2 minutes max

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

      mediaRecorder.start(1000); // collect data every 1s for reliability
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
      alert("Microphone access is required to send a voice message.");
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

  if (sent) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border shadow-card text-center">
        <p className="text-2xl mb-1">💌</p>
        <p className="font-bold">Voice message sent!</p>
        <p className="text-sm text-muted-foreground">Your family will hear it shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-card">
      <p className="font-semibold text-base mb-4">Send a voice message to your family</p>

      {!audioBlob ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              recording ? "scale-110" : "hover:scale-105 active:scale-95"
            }`}
            style={{
              background: recording
                ? "hsl(0 80% 60%)"
                : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
            }}
          >
            {recording ? (
              <Square className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          {recording ? (
            <p className="text-sm font-bold" style={{ color: "hsl(0 80% 60%)" }}>
              🔴 Recording {formatDuration(duration)} — tap to stop
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Tap to start recording (up to 2 min)</p>
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
              className="flex-1 h-11 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Discard
            </Button>
            <Button
              onClick={sendMessage}
              disabled={uploading}
              className="flex-1 h-11 gradient-btn border-0 rounded-xl font-bold"
            >
              {uploading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <><Send className="w-4 h-4 mr-1" /> Send</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
