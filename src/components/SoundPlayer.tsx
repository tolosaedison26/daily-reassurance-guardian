import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { SOUNDS, CATEGORIES, type Sound, type Category } from "./sound-data";
import { BUILDERS } from "./sound-builders";

export default function SoundPlayer({ onBack }: { onBack: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>("nature");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);

  const stopCurrentSound = () => {
    const interval = (nodesRef.current as any).__chirpInterval;
    if (interval) clearInterval(interval);
    nodesRef.current.forEach((node) => {
      try {
        if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) node.stop();
      } catch (_) {}
    });
    nodesRef.current = [];
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
    if (!masterGainRef.current || masterGainRef.current.context !== audioCtxRef.current) {
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.connect(audioCtxRef.current.destination);
    }
    masterGainRef.current.gain.value = volume;
    const nodes = BUILDERS[sound.id](audioCtxRef.current);
    nodesRef.current = nodes;
    setPlayingId(sound.id);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (masterGainRef.current) masterGainRef.current.gain.value = v;
  };

  useEffect(() => {
    return () => {
      stopCurrentSound();
      audioCtxRef.current?.close();
    };
  }, []);

  const playingSound = SOUNDS.find((s) => s.id === playingId);
  const filteredSounds = SOUNDS.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 pt-10 pb-4"
        style={{
          background: playingSound
            ? `linear-gradient(135deg, ${playingSound.color}22, transparent)`
            : undefined,
        }}
      >
        <button
          onClick={() => { stopCurrentSound(); setPlayingId(null); onBack(); }}
          className="p-3 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black">Calm Sounds</h1>
          <p className="text-sm text-muted-foreground">Tap to play • One at a time</p>
        </div>
        {playingId && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{ background: `${playingSound?.color}22`, borderColor: `${playingSound?.color}44` }}
          >
            <Volume2 className="w-3.5 h-3.5" style={{ color: playingSound?.color }} />
            <span className="text-xs font-black" style={{ color: playingSound?.color }}>Live</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Now playing bar */}
      {playingSound && (
        <div className="mx-5 mb-4 bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
          <span className="text-3xl">{playingSound.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm truncate">{playingSound.title}</p>
            <p className="text-xs text-muted-foreground truncate">{playingSound.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary h-1"
            />
          </div>
          <div className="flex gap-0.5 items-end h-5 shrink-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  height: `${8 + (i % 3) * 4}px`,
                  background: playingSound.color,
                  animation: `sound-bar${i} 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sound Grid */}
      <div className="flex-1 px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {filteredSounds.map((sound) => {
            const isPlaying = playingId === sound.id;
            return (
              <button
                key={sound.id}
                onClick={() => handlePlay(sound)}
                className="relative overflow-hidden rounded-lg aspect-square text-left transition-transform active:scale-95 w-full max-w-[180px] mx-auto"
                style={{
                  outline: isPlaying ? `2.5px solid ${sound.color}` : undefined,
                  outlineOffset: "2px",
                }}
              >
                <img src={sound.image} alt={sound.title} className="absolute inset-0 w-full h-full object-cover" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isPlaying
                      ? `linear-gradient(to top, ${sound.color}ee 0%, ${sound.color}55 50%, transparent 100%)`
                      : "linear-gradient(to top, hsl(0 0% 0% / 0.7) 0%, hsl(0 0% 0% / 0.15) 60%, transparent 100%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                    style={{
                      backgroundColor: isPlaying ? sound.color : "hsl(0 0% 100% / 0.2)",
                      border: "2px solid",
                      borderColor: isPlaying ? sound.color : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-black text-base leading-tight drop-shadow">{sound.emoji} {sound.title}</p>
                  <p className="text-white/75 text-xs">{sound.subtitle}</p>
                </div>
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

        <div className="mt-4 p-4 rounded-2xl bg-card border border-border text-center">
          <p className="text-sm text-muted-foreground">
            🎵 Sounds are generated live using your device — no downloads needed.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sound-bar1 { from { height: 8px; } to { height: 16px; } }
        @keyframes sound-bar2 { from { height: 14px; } to { height: 6px; } }
        @keyframes sound-bar3 { from { height: 10px; } to { height: 18px; } }
        @keyframes sound-bar4 { from { height: 16px; } to { height: 8px; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
