import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { BUILDERS } from "@/components/sound-builders";
import soundRain from "@/assets/sound-rain.jpg";
import soundOcean from "@/assets/sound-ocean.jpg";
import soundForest from "@/assets/sound-forest.jpg";
import soundNight from "@/assets/sound-night.jpg";
import soundBowl from "@/assets/sound-bowl.jpg";
import soundFire from "@/assets/sound-fire.jpg";

const PREVIEW_DURATION = 20_000;

const sounds = [
  { id: "ocean", title: "Ocean Waves", sub: "Peaceful shoreline", image: soundOcean, color: "hsl(195 70% 35%)" },
  { id: "rain", title: "Gentle Rain", sub: "Soft pitter-patter", image: soundRain, color: "hsl(210 60% 35%)" },
  { id: "forest", title: "Forest Walk", sub: "Birds & breeze", image: soundForest, color: "hsl(142 45% 30%)" },
  { id: "bowl", title: "Singing Bowl", sub: "Zen meditation", image: soundBowl, color: "hsl(40 70% 40%)" },
  { id: "fire", title: "Campfire", sub: "Warm crackling", image: soundFire, color: "hsl(20 90% 40%)" },
  { id: "night", title: "Night Ambience", sub: "Crickets & stars", image: soundNight, color: "hsl(245 40% 30%)" },
];

interface Props {
  onGetStarted: () => void;
}

export default function LandingCalmingSounds({ onGetStarted }: Props) {
  const { ref, isVisible } = useInView(0.1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSound = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const interval = (nodesRef.current as any).__chirpInterval;
    if (interval) clearInterval(interval);
    nodesRef.current.forEach((n) => {
      try { if (n instanceof AudioBufferSourceNode || n instanceof OscillatorNode) n.stop(); } catch {}
    });
    nodesRef.current = [];
    setPlayingId(null);
  }, []);

  const handlePlay = useCallback((id: string) => {
    if (playingId === id) { stopSound(); return; }
    stopSound();
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    const nodes = BUILDERS[id](audioCtxRef.current);
    nodesRef.current = nodes;
    setPlayingId(id);
    timerRef.current = setTimeout(stopSound, PREVIEW_DURATION);
  }, [playingId, stopSound]);

  useEffect(() => () => { stopSound(); audioCtxRef.current?.close(); }, [stopSound]);

  const playingSound = sounds.find((s) => s.id === playingId);

  return (
    <section id="sounds" className="py-14 sm:py-16 md:py-20 bg-section-alt">
      <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Compact header — inline label + headline */}
        <div className={`fade-up flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10 ${isVisible ? "visible" : ""}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" style={{ color: "hsl(200 70% 45%)" }} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Calming Sounds
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black text-foreground"
              style={{ letterSpacing: "-0.03em" }}
            >
              Calming sounds for stress relief
            </h2>
          </div>
          <p className="text-sm text-muted-foreground sm:text-right sm:max-w-[240px] leading-relaxed">
            Tap to preview — 6 of 11 sounds. Unlock all nature and ambient tracks in your dashboard.
          </p>
        </div>

        {/* Sound grid — 2×3 on mobile, 3×2 on sm, 6×1 on lg */}
        <div
          className={`fade-up grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "120ms" }}
        >
          {sounds.map((s) => {
            const isPlaying = playingId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handlePlay(s.id)}
                className="group relative overflow-hidden rounded-xl text-left transition-all duration-300 active:scale-[0.97] w-full aspect-[3/4]"
                style={{
                  boxShadow: isPlaying
                    ? `0 0 0 2px ${s.color}, 0 8px 24px -4px ${s.color}44`
                    : "var(--shadow-card)",
                }}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: isPlaying
                      ? `linear-gradient(to top, ${s.color}dd 0%, ${s.color}44 50%, transparent 100%)`
                      : "linear-gradient(to top, hsl(0 0% 0% / 0.6) 0%, hsl(0 0% 0% / 0.08) 55%, transparent 100%)",
                  }}
                />

                {/* Play / Pause */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                      isPlaying ? "scale-100" : "scale-90 group-hover:scale-100"
                    }`}
                    style={{
                      backgroundColor: isPlaying ? "hsl(0 0% 100% / 0.95)" : "hsl(0 0% 100% / 0.2)",
                      border: isPlaying ? "none" : "1.5px solid hsl(0 0% 100% / 0.3)",
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" style={{ color: s.color }} fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
                    )}
                  </div>
                </div>

                {/* Waveform bars */}
                {isPlaying && (
                  <div className="absolute top-2.5 right-2.5 flex gap-[2px] items-end h-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-[2px] rounded-full bg-white"
                        style={{
                          animation: `dg-bar${i} 0.8s ease-in-out infinite alternate`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm leading-tight drop-shadow-md">{s.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Now playing indicator — only shows when a sound is active */}
        {playingSound && (
          <div
            className="mt-4 flex items-center justify-center gap-3 py-2.5 px-4 rounded-full bg-card border border-border/60 w-fit mx-auto transition-all"
            style={{ boxShadow: `0 0 20px -4px ${playingSound.color}33` }}
          >
            <div className="flex gap-[3px] items-end h-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{
                    background: playingSound.color,
                    animation: `dg-bar${i} 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">{playingSound.title}</span>
            <span className="text-xs text-muted-foreground">20s preview</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dg-bar1 { from { height: 6px; } to { height: 16px; } }
        @keyframes dg-bar2 { from { height: 14px; } to { height: 6px; } }
        @keyframes dg-bar3 { from { height: 8px; } to { height: 18px; } }
        @keyframes dg-bar4 { from { height: 16px; } to { height: 8px; } }
      `}</style>
    </section>
  );
}
