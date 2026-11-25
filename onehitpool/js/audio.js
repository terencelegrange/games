/**
 * Web Audio API Retro Sound Synthesizer for One Hit Pool
 * 100% Procedural synthesis for cue impacts, ball clacks, cushion bounces, and scoring chimes.
 */

class PoolAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.35;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch {}
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return !this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Cue stick striking the cue ball with leather tip chalk impact
   */
  cueStrike(power = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const intensity = Math.min(1.0, Math.max(0.1, power));

      // 1. Transient chalk/tip noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2400, t);
      noiseFilter.Q.setValueAtTime(1.5, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * intensity * 0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);

      // 2. Punchy body thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.05);

      oscGain.gain.setValueAtTime(this.volume * intensity * 0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  /**
   * Crisp phenolic resin billiard ball-on-ball collision clack
   */
  ballHit(intensity = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const force = Math.min(1.0, Math.max(0.08, intensity));

      // High-pitched resin click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2600 + Math.random() * 400, t);
      osc1.frequency.exponentialRampToValueAtTime(900, t + 0.025);

      gain1.gain.setValueAtTime(this.volume * force * 0.9, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.025);

      // Mid body resonance
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1400, t);
      osc2.frequency.exponentialRampToValueAtTime(300, t + 0.03);

      gain2.gain.setValueAtTime(this.volume * force * 0.5, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.03);
    } catch {}
  }

  /**
   * Cushion bumper bounce: low rubber thud
   */
  cushionHit(intensity = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const force = Math.min(1.0, Math.max(0.1, intensity));

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.06);

      gain.gain.setValueAtTime(this.volume * force * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  /**
   * Scoring chime when ball lands inside concentric rings
   */
  ringScore(isInner = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = isInner ? [523.25, 659.25, 783.99, 1046.50] : [440.00, 554.37, 659.25]; // C5-E5-G5-C6 or A4-C#5-E5
      const noteDuration = 0.12;

      notes.forEach((freq, idx) => {
        const start = t + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isInner ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(this.volume * 0.7, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + noteDuration + 0.16);
      });
    } catch {}
  }

  /**
   * Miss buzzer when target is missed or life is lost
   */
  miss() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(95, t + 0.22);

      gain.gain.setValueAtTime(this.volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.23);
    } catch {}
  }

  /**
   * Triumphant level clear fanfare
   */
  levelClear() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      arpeggio.forEach((f, i) => {
        const start = t + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(this.volume * 0.7, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {}
  }

  /**
   * Game Over descending melancholy cadence
   */
  gameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const chords = [392.00, 349.23, 311.13, 261.63];
      chords.forEach((freq, idx) => {
        const start = t + idx * 0.16;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(this.volume * 0.45, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.23);
      });
    } catch {}
  }
}

export const poolAudio = new PoolAudio();
