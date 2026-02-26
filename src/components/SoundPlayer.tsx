import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from "lucide-react";
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
  color: string;
}

const SOUNDS: Sound[] = [
  { id: "rain", title: "Gentle Rain", subtitle: "Soft pitter-patter", image: soundRain, emoji: "🌧", color: "hsl(210 60% 35%)" },
  { id: "ocean", title: "Ocean Waves", subtitle: "Peaceful shoreline", image: soundOcean, emoji: "🌊", color: "hsl(195 70% 35%)" },
  { id: "forest", title: "Forest Walk", subtitle: "Birds & breeze", image: soundForest, emoji: "🌲", color: "hsl(142 45% 30%)" },
  { id: "night", title: "Night Ambience", subtitle: "Crickets & stars", image: soundNight, emoji: "🌙", color: "hsl(245 40% 30%)" },
  { id: "birds", title: "Morning Birds", subtitle: "Cheerful birdsong", image: soundBirds, emoji: "🐦", color: "hsl(45 80% 35%)" },
];

// ── Rich Web Audio synthesis for each sound ──────────────────────────────────

function buildRain(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];

  // Pink-ish noise via multiple filtered white noise sources
  for (let i = 0; i < 3; i++) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let n = 0; n < data.length; n++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[n] = (b0 + b1 + b2 + white * 0.5362) / 4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = 3;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600 + i * 400;
    filter.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.value = 0.08 - i * 0.015;
    gain.gain.linearRampToValueAtTime(gain.gain.value, ctx.currentTime + 2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    nodes.push(src, filter, gain);
  }
  return nodes;
}

function buildOcean(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];

  for (let i = 0; i < 2; i++) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 350;

    // LFO for wave rhythm
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.12 + i * 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain);

    const gain = ctx.createGain();
    gain.gain.value = 0.1;
    lfoGain.connect(gain.gain);

    src.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    lfo.start();
    nodes.push(src, lowpass, lfo, lfoGain, gain);
  }
  return nodes;
}

function buildForest(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];

  // Wind base
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 450;
  filter.Q.value = 0.5;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const gain = ctx.createGain();
  gain.gain.value = 0.07;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  lfo.start();
  nodes.push(src, filter, lfo, lfoGain, gain);

  // Bird chirps (random intervals)
  const chirpInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const freq = 1200 + Math.random() * 800;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }, 1200 + Math.random() * 2000);

  (nodes as any).__chirpInterval = chirpInterval;
  return nodes;
}

function buildNight(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];

  // Deep drone
  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 55;
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.04;
  drone.connect(droneGain);
  droneGain.connect(ctx.destination);
  drone.start();
  nodes.push(drone, droneGain);

  // Cricket-like chirps
  const cricketInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 3800 + Math.random() * 400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.015, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }, i * 70);
    }
  }, 600 + Math.random() * 400);

  (nodes as any).__chirpInterval = cricketInterval;
  return nodes;
}

function buildBirds(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];

  // Gentle nature bed
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1000;
  const gain = ctx.createGain();
  gain.gain.value = 0.02;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  nodes.push(src, filter, gain);

  // Melodic bird calls
  const birdInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const notes = [880, 1046, 1175, 1318].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.55);
      }, i * 200);
    });
  }, 1500 + Math.random() * 1500);

  (nodes as any).__chirpInterval = birdInterval;
  return nodes;
}

const BUILDERS: Record<string, (ctx: AudioContext) => AudioNode[]> = {
  rain: buildRain,
  ocean: buildOcean,
  forest: buildForest,
  night: buildNight,
  birds: buildBirds,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SoundPlayer({ onBack }: { onBack: () => void }) {
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

    // Master gain for volume control
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 pt-10 pb-5"
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

      {/* Now playing bar */}
      {playingSound && (
        <div className="mx-5 mb-4 bg-card rounded-2xl p-4 border border-border shadow-card flex items-center gap-3">
          <span className="text-3xl">{playingSound.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm truncate">{playingSound.title}</p>
            <p className="text-xs text-muted-foreground truncate">{playingSound.subtitle}</p>
          </div>
          {/* Volume slider */}
          <div className="flex items-center gap-2 shrink-0">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-primary h-1"
            />
          </div>
          {/* Animated bars */}
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
          {SOUNDS.map((sound) => {
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
                      ? `linear-gradient(to top, ${sound.color}ee 0%, ${sound.color}55 50%, transparent 100%)`
                      : "linear-gradient(to top, hsl(0 0% 0% / 0.7) 0%, hsl(0 0% 0% / 0.15) 60%, transparent 100%)",
                  }}
                />
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                    style={{
                      backgroundColor: isPlaying ? sound.color : "hsl(0 0% 100% / 0.2)",
                      border: "2px solid",
                      borderColor: isPlaying ? sound.color : "rgba(255,255,255,0.4)",
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
                  <p className="text-white font-black text-base leading-tight drop-shadow">
                    {sound.emoji} {sound.title}
                  </p>
                  <p className="text-white/75 text-xs">{sound.subtitle}</p>
                </div>
                {/* Playing indicator bars */}
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
      `}</style>
    </div>
  );
}
