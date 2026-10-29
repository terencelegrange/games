/**
 * Synthesized 8-Bit Retro Audio Engine using Web Audio API
 * 100% self-contained, no external audio files or dependencies needed.
 */
export class PacmanAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.wakaAlternator = false;
    this.sirenOsc = null;
    this.sirenGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15; // Balanced retro volume
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
    if (muted) {
      this.stopSiren();
    }
  }

  playChomp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Alternate between higher and lower pitch for "waka waka"
    const freq = this.wakaAlternator ? 480 : 330;
    this.wakaAlternator = !this.wakaAlternator;

    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.085);
  }

  playEatGhost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playDeath() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Classic descending pitch sweeps
    const steps = [
      { f: 600, dur: 0.1 },
      { f: 550, dur: 0.1 },
      { f: 500, dur: 0.1 },
      { f: 450, dur: 0.1 },
      { f: 400, dur: 0.1 },
      { f: 350, dur: 0.1 },
      { f: 300, dur: 0.1 },
      { f: 250, dur: 0.15 },
      { f: 180, dur: 0.2 },
      { f: 100, dur: 0.3 }
    ];

    let timeOffset = 0;
    osc.frequency.setValueAtTime(steps[0].f, t);
    steps.forEach(step => {
      osc.frequency.setValueAtTime(step.f, t + timeOffset);
      timeOffset += step.dur;
    });

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + timeOffset);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + timeOffset);
  }

  playStartJingle() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.10 }, // B5
      { f: 739.99, d: 0.15 }, // F#5
      { f: 622.25, d: 0.25 }  // D#5
    ];

    let offset = 0;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t + offset);

      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + offset);
      osc.stop(t + offset + note.d);
      offset += note.d + 0.02;
    });
  }

  startSiren() {
    if (this.muted || this.sirenOsc) return;
    this.init();
    if (!this.ctx) return;

    this.sirenOsc = this.ctx.createOscillator();
    this.sirenGain = this.ctx.createGain();

    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(200, this.ctx.currentTime);
    
    // Low wailing siren for power energizer
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(this.sirenOsc.frequency);
    lfo.start();

    this.sirenGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);
    this.sirenOsc.start();
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {}
      this.sirenOsc = null;
      this.sirenGain = null;
    }
  }

  destroy() {
    this.stopSiren();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
