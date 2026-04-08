export class SoundSystem {
  constructor() {
    this.context = null;
    this.available = true;
    this.lastImpactAt = 0;
  }

  play(name, meta = {}) {
    this.trigger(name, meta).catch(() => {});
  }

  async trigger(name, meta) {
    const ctx = await this.ensureContext();
    if (!ctx) {
      return;
    }

    if (name === "impact") {
      const now = performance.now();
      if (now - this.lastImpactAt < 90) {
        return;
      }
      this.lastImpactAt = now;
    }

    const start = ctx.currentTime;
    if (name === "start") {
      this.sweep(ctx, { start, from: 360, to: 520, duration: 0.12, gain: 0.04, type: "triangle" });
      this.sweep(ctx, { start: start + 0.08, from: 480, to: 700, duration: 0.16, gain: 0.035, type: "triangle" });
      return;
    }

    if (name === "launch") {
      const profile = meta.shotKey === "heavy"
        ? { from: 170, to: 110, gain: 0.046, type: "square" }
        : meta.shotKey === "super"
          ? { from: 300, to: 220, gain: 0.042, type: "sawtooth" }
          : meta.shotKey === "light"
            ? { from: 420, to: 300, gain: 0.03, type: "triangle" }
            : { from: 260, to: 180, gain: 0.035, type: "triangle" };
      this.sweep(ctx, { start, duration: 0.11, ...profile });
      return;
    }

    if (name === "impact") {
      const hitHeavy = meta.heavy || meta.wall;
      this.noise(ctx, { start, duration: hitHeavy ? 0.12 : 0.08, gain: hitHeavy ? 0.06 : 0.038, highpass: hitHeavy ? 180 : 260 });
      this.sweep(ctx, {
        start,
        from: hitHeavy ? 160 : 240,
        to: hitHeavy ? 82 : 140,
        duration: hitHeavy ? 0.14 : 0.09,
        gain: hitHeavy ? 0.032 : 0.022,
        type: "triangle"
      });
      return;
    }

    if (name === "win") {
      this.tone(ctx, { start, frequency: 420, duration: 0.12, gain: 0.035, type: "triangle" });
      this.tone(ctx, { start: start + 0.12, frequency: 560, duration: 0.14, gain: 0.04, type: "triangle" });
      this.tone(ctx, { start: start + 0.24, frequency: 720, duration: 0.18, gain: 0.045, type: "triangle" });
      return;
    }

    if (name === "lose") {
      this.sweep(ctx, { start, from: 240, to: 170, duration: 0.16, gain: 0.04, type: "sine" });
      this.sweep(ctx, { start: start + 0.14, from: 180, to: 120, duration: 0.24, gain: 0.042, type: "sine" });
    }
  }

  async ensureContext() {
    if (!this.available) {
      return null;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      this.available = false;
      return null;
    }

    if (!this.context) {
      this.context = new AudioCtor();
    }

    if (this.context.state === "suspended") {
      try {
        await this.context.resume();
      } catch {
        return null;
      }
    }

    return this.context;
  }

  tone(ctx, { start, frequency, duration, gain, type }) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  sweep(ctx, { start, from, to, duration, gain, type }) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(ctx, { start, duration, gain, highpass }) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(highpass, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(envelope).connect(ctx.destination);
    source.start(start);
    source.stop(start + duration + 0.02);
  }
}
