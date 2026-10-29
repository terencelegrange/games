/**
 * Web Audio API Retro Synthesizer for Bin Chicken
 * Pure procedural synthesis — zero external audio assets required.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.28;
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
   * Soft airy wing whoosh on flap
   */
  flap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.16);

      gain.gain.setValueAtTime(this.volume * 0.7, t);
      gain.gain.linearRampToValueAtTime(this.volume, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /**
   * Bright ding when clearing a wheelie bin gap (+1 pt)
   */
  point() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880.00, t + 0.07); // A5

      gain.gain.setValueAtTime(this.volume * 0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.29);
    } catch {}
  }

  /**
   * Crunchy chip snack munch / bite sound (+5 pts)
   */
  chip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [0, 0.04, 0.08].forEach((delay, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440 + idx * 220, t + delay);
        osc.frequency.exponentialRampToValueAtTime(880 + idx * 300, t + delay + 0.04);

        gain.gain.setValueAtTime(this.volume * 0.5, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 0.06);
      });
    } catch {}
  }

  /**
   * Collision impact with wheelie bin or asphalt
   */
  hit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);

      gain.gain.setValueAtTime(this.volume * 1.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {}
  }

  /**
   * Synthesized Australian Ibis honk / squawk on crash
   */
  squawk() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime + 0.08;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(260, t);
      osc1.frequency.linearRampToValueAtTime(180, t + 0.25);
      osc2.frequency.setValueAtTime(270, t);
      osc2.frequency.linearRampToValueAtTime(188, t + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.Q.setValueAtTime(4.0, t);

      gain.gain.setValueAtTime(this.volume * 0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.32);
      osc2.stop(t + 0.32);
    } catch {}
  }

  /**
   * Upbeat celebratory chime on medal award
   */
  medal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(this.volume * 0.6, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.26);
      });
    } catch {}
  }
}

export const sound = new SoundSystem();
