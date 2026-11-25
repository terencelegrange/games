/**
 * Web Audio Synthesizer for Fast Car (OutRun Style)
 * Dynamic engine pitch, tire skids, coin pickups, and crash explosions.
 */

class FastCarAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.engineOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;

    try {
      const saved = localStorage.getItem('retro_arcade_sound_fastcar');
      if (saved !== null) this.enabled = saved === 'true';
    } catch (_) {}
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('retro_arcade_sound_fastcar', String(this.enabled));
    } catch (_) {}

    if (!this.enabled && this.isEngineRunning) {
      this.stopEngine();
    }
    return this.enabled;
  }

  startEngine() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55 Hz idle rumble

      // Low pass filter to give warm retro arcade rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (_) {}
  }

  updateEngine(speedRatio) {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc) return;
    try {
      // Modulate frequency from 50Hz to 160Hz based on speed
      const targetFreq = 50 + speedRatio * 110;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    } catch (_) {}
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        if (this.engineOsc) {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
          this.engineOsc = null;
        }
        this.isEngineRunning = false;
      }, 60);
    } catch (_) {
      this.isEngineRunning = false;
    }
  }

  coin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-pitched bright 2-tone arpeggio (B5 987Hz -> E6 1318Hz)
      [
        { f: 987.77, t: now, d: 0.08 },
        { f: 1318.51, t: now + 0.07, d: 0.16 }
      ].forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, note.t);

        gain.gain.setValueAtTime(0.2, note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, note.t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.t);
        osc.stop(note.t + note.d);
      });
    } catch (_) {}
  }

  skid() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (_) {}
  }

  crash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Heavy crunch impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.48);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch (_) {}
  }

  combo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [
        { f: 523.25, t: now, d: 0.08 },
        { f: 659.25, t: now + 0.08, d: 0.08 },
        { f: 783.99, t: now + 0.16, d: 0.18 }
      ].forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.t);

        gain.gain.setValueAtTime(0.18, note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, note.t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(note.t);
        osc.stop(note.t + note.d);
      });
    } catch (_) {}
  }
}

export const sound = new FastCarAudio();
