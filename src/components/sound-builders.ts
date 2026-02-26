// ── Web Audio synthesis builders for each sound ──────────────────────────────

export function buildRain(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
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
    src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = 3;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 600 + i * 400; filter.Q.value = 0.4;
    const gain = ctx.createGain();
    gain.gain.value = 0.08 - i * 0.015;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start();
    nodes.push(src, filter, gain);
  }
  return nodes;
}

export function buildOcean(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  for (let i = 0; i < 2; i++) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lowpass = ctx.createBiquadFilter(); lowpass.type = "lowpass"; lowpass.frequency.value = 350;
    const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.12 + i * 0.05;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.07; lfo.connect(lfoGain);
    const gain = ctx.createGain(); gain.gain.value = 0.1; lfoGain.connect(gain.gain);
    src.connect(lowpass); lowpass.connect(gain); gain.connect(ctx.destination);
    src.start(); lfo.start();
    nodes.push(src, lowpass, lfo, lfoGain, gain);
  }
  return nodes;
}

export function buildForest(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 450; filter.Q.value = 0.5;
  const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 150; lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
  const gain = ctx.createGain(); gain.gain.value = 0.07;
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start(); lfo.start();
  nodes.push(src, filter, lfo, lfoGain, gain);
  const chirpInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const freq = 1200 + Math.random() * 800;
    const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.35);
  }, 1200 + Math.random() * 2000);
  (nodes as any).__chirpInterval = chirpInterval;
  return nodes;
}

export function buildNight(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  const drone = ctx.createOscillator(); drone.type = "sine"; drone.frequency.value = 55;
  const droneGain = ctx.createGain(); droneGain.gain.value = 0.04;
  drone.connect(droneGain); droneGain.connect(ctx.destination); drone.start();
  nodes.push(drone, droneGain);
  const cricketInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator(); osc.type = "square"; osc.frequency.value = 3800 + Math.random() * 400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.015, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.05);
      }, i * 70);
    }
  }, 600 + Math.random() * 400);
  (nodes as any).__chirpInterval = cricketInterval;
  return nodes;
}

export function buildBirds(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = 1000;
  const gain = ctx.createGain(); gain.gain.value = 0.02;
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start();
  nodes.push(src, filter, gain);
  const birdInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const notes = [880, 1046, 1175, 1318].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.55);
      }, i * 200);
    });
  }, 1500 + Math.random() * 1500);
  (nodes as any).__chirpInterval = birdInterval;
  return nodes;
}

export function buildStream(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Bubbling water with filtered noise + random blips
  const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 800; bp.Q.value = 0.8;
  const gain = ctx.createGain(); gain.gain.value = 0.06;
  src.connect(bp); bp.connect(gain); gain.connect(ctx.destination); src.start();
  nodes.push(src, bp, gain);
  const bubbleInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 600 + Math.random() * 600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.2);
  }, 300 + Math.random() * 500);
  (nodes as any).__chirpInterval = bubbleInterval;
  return nodes;
}

export function buildFire(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Crackle noise
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) {
    data[n] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.2);
  }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000;
  const gain = ctx.createGain(); gain.gain.value = 0.08;
  src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ctx.destination); src.start();
  nodes.push(src, hp, lp, gain);
  // Low rumble
  const rumbleBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const rd = rumbleBuf.getChannelData(0);
  for (let n = 0; n < rd.length; n++) rd[n] = Math.random() * 2 - 1;
  const rs = ctx.createBufferSource(); rs.buffer = rumbleBuf; rs.loop = true;
  const rlp = ctx.createBiquadFilter(); rlp.type = "lowpass"; rlp.frequency.value = 200;
  const rg = ctx.createGain(); rg.gain.value = 0.05;
  rs.connect(rlp); rlp.connect(rg); rg.connect(ctx.destination); rs.start();
  nodes.push(rs, rlp, rg);
  return nodes;
}

export function buildThunder(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Rain base
  const rainNodes = buildRain(ctx);
  nodes.push(...rainNodes);
  // Periodic thunder rumble
  const thunderInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 80;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(); src.stop(ctx.currentTime + 3);
  }, 8000 + Math.random() * 12000);
  (nodes as any).__chirpInterval = thunderInterval;
  return nodes;
}

export function buildWind(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 300; bp.Q.value = 0.3;
  const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 200; lfo.connect(lfoGain); lfoGain.connect(bp.frequency);
  const gain = ctx.createGain(); gain.gain.value = 0.09;
  src.connect(bp); bp.connect(gain); gain.connect(ctx.destination); src.start(); lfo.start();
  nodes.push(src, bp, lfo, lfoGain, gain);
  return nodes;
}

export function buildBowl(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  // Repeating singing bowl tone
  const bowlInterval = setInterval(() => {
    if (ctx.state === "closed") return;
    const freqs = [261, 392, 523];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 4.5);
    });
  }, 5000);
  // Trigger immediately
  const freqs = [261, 392, 523];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 4.5);
    nodes.push(osc, g);
  });
  (nodes as any).__chirpInterval = bowlInterval;
  return nodes;
}

export function buildWhiteNoise(ctx: AudioContext): AudioNode[] {
  const nodes: AudioNode[] = [];
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let n = 0; n < data.length; n++) data[n] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const gain = ctx.createGain(); gain.gain.value = 0.06;
  src.connect(gain); gain.connect(ctx.destination); src.start();
  nodes.push(src, gain);
  return nodes;
}

export const BUILDERS: Record<string, (ctx: AudioContext) => AudioNode[]> = {
  rain: buildRain,
  ocean: buildOcean,
  forest: buildForest,
  night: buildNight,
  birds: buildBirds,
  stream: buildStream,
  fire: buildFire,
  thunder: buildThunder,
  wind: buildWind,
  bowl: buildBowl,
  whitenoise: buildWhiteNoise,
};
