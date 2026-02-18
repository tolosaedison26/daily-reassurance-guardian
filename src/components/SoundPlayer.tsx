import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Volume2 } from "lucide-react";
import soundRain from "@/assets/sound-rain.jpg";
import soundOcean from "@/assets/sound-ocean.jpg";
import soundForest from "@/assets/sound-forest.jpg";
import soundNight from "@/assets/sound-night.jpg";
import soundBirds from "@/assets/sound-birds.jpg";

interface Sound {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  emoji: string;
  // Using loopable audio frequencies via Web Audio API instead of actual files
  frequency: number;
  type: OscillatorType;
}

const SOUNDS: Sound[] = [
  { id: "rain", title: "Gentle Rain", subtitle: "Soft pitter-patter", image: soundRain, emoji: "🌧", frequency: 200, type: "sawtooth" },
  { id: "ocean", title: "Ocean Waves", subtitle: "Peaceful shoreline", image: soundOcean, emoji: "🌊", frequency: 120, type: "sine" },
  { id: "forest", title: "Forest Walk", subtitle: "Birds & breeze", image: soundForest, emoji: "🌲", frequency: 300, type: "triangle" },
  { id: "night", title: "Night Ambience", subtitle: "Crickets & stars", image: soundNight, emoji: "🌙", frequency: 180, type: "sine" },
  { id: "birds", title: "Morning Birds", subtitle: "Cheerful birdsong", image: soundBirds, emoji: "🐦", frequency: 400, type: "triangle" },
];

function createNatureSound(audioCtx: AudioContext, frequency: number, type: OscillatorType) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(0.0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1.5);

  // Add some gentle modulation
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.3, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(15, audioCtx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  lfo.start();

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();

  return { oscillator, gainNode, lfo };
}

export default function SoundPlayer({ onBack }: { onBack: () => void }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ oscillator: OscillatorNode; gainNode: GainNode; lfo: OscillatorNode } | null>(null);

  const stopCurrentSound = () => {
    if (nodesRef.current && audioCtxRef.current) {
      const { oscillator, gainNode, lfo } = nodesRef.current;
      gainNode.gain.linearRampToValueAtTime(0.0, audioCtxRef.current.currentTime + 0.8);
      setTimeout(() => {
        try { oscillator.stop(); lfo.stop(); } catch (_) {}
      }, 900);
      nodesRef.current = null;
    }
  };

  const handlePlay = (sound: Sound) => {
    if (playingId === sound.id) {
      stopCurrentSound();
      setPlayingId(null);
      return;
    }

    stopCurrentSound();

    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    nodesRef.current = createNatureSound(audioCtxRef.current, sound.frequency, sound.type);
    setPlayingId(sound.id);
  };

  useEffect(() => {
    return () => {
      stopCurrentSound();
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-hero)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-safe pt-6 pb-4">
        <button
          onClick={() => { stopCurrentSound(); setPlayingId(null); onBack(); }}
          className="p-3 rounded-full bg-card/70 backdrop-blur-sm shadow-card"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Calm Sounds</h1>
          <p className="text-sm text-muted-foreground">Relax and unwind</p>
        </div>
        {playingId && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Playing</span>
          </div>
        )}
      </div>

      {/* Sound Grid */}
      <div className="flex-1 px-5 pb-8 pb-safe">
        <div className="grid grid-cols-2 gap-4">
          {SOUNDS.map((sound) => {
            const isPlaying = playingId === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => handlePlay(sound)}
                className="sound-card relative overflow-hidden rounded-2xl aspect-square bg-card border border-border shadow-card text-left"
              >
                {/* Background image */}
                <img
                  src={sound.image}
                  alt={sound.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: isPlaying
                      ? "linear-gradient(to top, hsl(152 40% 20% / 0.85) 0%, hsl(152 40% 20% / 0.3) 60%, transparent 100%)"
                      : "linear-gradient(to top, hsl(0 0% 0% / 0.65) 0%, hsl(0 0% 0% / 0.1) 60%, transparent 100%)",
                  }}
                />
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                    style={{
                      backgroundColor: isPlaying ? "hsl(var(--primary) / 0.9)" : "hsl(0 0% 100% / 0.25)",
                      border: "2px solid",
                      borderColor: isPlaying ? "hsl(var(--primary))" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    )}
                  </div>
                </div>
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-base leading-tight drop-shadow">{sound.emoji} {sound.title}</p>
                  <p className="text-white/75 text-xs">{sound.subtitle}</p>
                </div>
                {/* Playing indicator */}
                {isPlaying && (
                  <div className="absolute top-3 right-3 flex gap-0.5 items-end h-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-white"
                        style={{
                          height: `${8 + (i % 3) * 4}px`,
                          animation: `sound-bar${i} 0.8s ease-in-out infinite alternate`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Note */}
        <div className="mt-5 p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border text-center">
          <p className="text-sm text-muted-foreground">
            🎵 One sound plays at a time. Tap to play or pause.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sound-bar1 { from { height: 8px; } to { height: 16px; } }
        @keyframes sound-bar2 { from { height: 14px; } to { height: 6px; } }
        @keyframes sound-bar3 { from { height: 10px; } to { height: 18px; } }
        @keyframes sound-bar4 { from { height: 16px; } to { height: 8px; } }
      `}</style>
    </div>
  );
}
