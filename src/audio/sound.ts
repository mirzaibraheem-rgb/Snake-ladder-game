/**
 * All sounds are synthesized live with the Web Audio API: no audio files, no licensing questions,
 * and almost zero download size. Web Audio follows the phone's silent switch on iOS
 * (we also ask for the "ambient" audio session where supported), and pauses when the app is hidden.
 */

type Nav = Navigator & { audioSession?: { type: string } };

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  sfxOn = true;
  musicOn = true;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) void this.ctx.suspend();
        else void this.ctx.resume();
      });
    }
  }

  /** Must be called from a user gesture (tap / key) the first time. */
  unlock() {
    try {
      const nav = navigator as Nav;
      if (nav.audioSession) nav.audioSession.type = 'ambient';
    } catch {
      /* not supported */
    }
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.musicOn) this.startMusic();
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  private tone(freq: number, start: number, len: number, opts: { type?: OscillatorType; vol?: number; slideTo?: number; dest?: AudioNode } = {}) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opts.type ?? 'sine';
    o.frequency.setValueAtTime(freq, start);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, start + len);
    const v = opts.vol ?? 0.25;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(v, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + len);
    o.connect(g).connect(opts.dest ?? this.master);
    o.start(start);
    o.stop(start + len + 0.05);
  }

  private noise(start: number, len: number, vol = 0.15, filterFreq = 2000) {
    if (!this.ctx || !this.master) return;
    const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * len)), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master);
    src.start(start);
  }

  private get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  private can() {
    return this.sfxOn && !!this.ctx && this.ctx.state === 'running';
  }

  click() {
    if (!this.can()) return;
    this.tone(880, this.now, 0.06, { type: 'triangle', vol: 0.12 });
  }

  dice() {
    if (!this.can()) return;
    for (let i = 0; i < 7; i++) this.noise(this.now + i * 0.07 + Math.random() * 0.02, 0.05, 0.22, 1500 + Math.random() * 2500);
  }

  hop(i = 0) {
    if (!this.can()) return;
    const base = 520 + (i % 6) * 40;
    this.tone(base, this.now, 0.12, { type: 'sine', vol: 0.2, slideTo: base * 1.5 });
  }

  ladder() {
    if (!this.can()) return;
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, this.now + i * 0.09, 0.22, { type: 'triangle', vol: 0.18 }));
  }

  train() {
    if (!this.can()) return;
    const t = this.now;
    this.tone(587, t, 0.35, { type: 'square', vol: 0.06 });
    this.tone(740, t, 0.35, { type: 'square', vol: 0.05 });
    this.tone(587, t + 0.4, 0.5, { type: 'square', vol: 0.06 });
    this.tone(740, t + 0.4, 0.5, { type: 'square', vol: 0.05 });
    for (let i = 0; i < 6; i++) this.noise(t + 0.9 + i * 0.16, 0.08, 0.12, 900);
  }

  snake() {
    if (!this.can()) return;
    const t = this.now;
    this.noise(t, 0.4, 0.12, 5000); // gentle hiss
    this.tone(660, t + 0.35, 0.9, { type: 'triangle', vol: 0.18, slideTo: 180 }); // slide whistle down
  }

  toast() {
    if (!this.can()) return;
    this.tone(988, this.now, 0.15, { type: 'sine', vol: 0.12 });
    this.tone(1319, this.now + 0.1, 0.2, { type: 'sine', vol: 0.12 });
  }

  bump() {
    if (!this.can()) return;
    this.tone(300, this.now, 0.18, { type: 'triangle', vol: 0.15, slideTo: 220 });
  }

  win() {
    if (!this.can()) return;
    const t = this.now;
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => this.tone(f, t + i * 0.13, i === notes.length - 1 ? 0.8 : 0.2, { type: 'triangle', vol: 0.2 }));
  }

  // ---- gentle background music: a slow pentatonic loop ----
  private startMusic() {
    if (!this.ctx || !this.musicGain || this.musicTimer !== null || !this.musicOn) return;
    this.musicGain.gain.cancelScheduledValues(this.now);
    this.musicGain.gain.setTargetAtTime(0.5, this.now, 1.2);
    this.nextNoteTime = this.now + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 120);
  }

  private stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(0, this.now, 0.3);
  }

  private schedule() {
    if (!this.ctx || !this.musicGain) return;
    const beat = 60 / 84 / 2; // eighth notes at 84 bpm
    // C major pentatonic melody, 32 steps; 0 = rest
    const melody = [
      523, 0, 659, 0, 784, 0, 659, 0, 880, 0, 784, 0, 659, 0, 0, 0,
      587, 0, 659, 0, 784, 0, 1047, 0, 880, 0, 784, 0, 659, 0, 0, 0,
    ];
    const bass = [131, 131, 175, 175, 196, 196, 131, 131];
    while (this.nextNoteTime < this.ctx.currentTime + 0.4) {
      const s = this.step % melody.length;
      const f = melody[s];
      if (f) this.tone(f, this.nextNoteTime, beat * 1.8, { type: 'sine', vol: 0.05, dest: this.musicGain });
      if (s % 4 === 0) this.tone(bass[(s / 4) % bass.length], this.nextNoteTime, beat * 3.6, { type: 'triangle', vol: 0.06, dest: this.musicGain });
      this.nextNoteTime += beat;
      this.step++;
    }
  }
}

export const sound = new SoundEngine();
