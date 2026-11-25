/**
 * Web Audio API Monophonic Piezo Buzzer Synthesizer for Shongololo (1998 Nokia Snake)
 */

class ShongololoAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  toggle() {
    this.setMuted(!this.muted);
    return !this.muted;
  }

  playBeep(freq, duration = 0.04, vol = 0.12) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pure square wave (authentic monophonic Nokia piezo buzzer)
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.setValueAtTime(vol, now + duration - 0.005);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  step() {
    // Subtle tick on direction change or step
    this.playBeep(1200, 0.015, 0.03);
  }

  eat() {
    // Classic high Nokia chirp (2800 Hz -> 3600 Hz)
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.setValueAtTime(3400, now + 0.03);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (_) {}
  }

  eatBonus() {
    // Double high chirp fanfare for bonus bug
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [2800, 3600, 4400].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.2, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0, now + idx * 0.04 + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.035);
      });
    } catch (_) {}
  }

  crash() {
    // Low harsh buzzer crash
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }

  fanfare() {
    // 1998 Nokia ringtone fragment: E5 - D5 - F#4 - G#4 - C#5 - B4 - D4 - E4
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 659.25, d: 0.08 }, // E5
        { f: 587.33, d: 0.08 }, // D5
        { f: 369.99, d: 0.14 }, // F#4
        { f: 415.30, d: 0.14 }, // G#4
        { f: 554.37, d: 0.08 }, // C#5
        { f: 493.88, d: 0.08 }, // B4
        { f: 293.66, d: 0.14 }, // D4
        { f: 329.63, d: 0.18 }  // E4
      ];
      let t = 0;
      notes.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, now + t);
        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.setValueAtTime(0.18, now + t + n.d - 0.01);
        gain.gain.linearRampToValueAtTime(0, now + t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + n.d);
        t += n.d + 0.02;
      });
    } catch (_) {}
  }
}

export const sound = new ShongololoAudio();
