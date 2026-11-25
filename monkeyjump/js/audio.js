/**
 * Web Audio API Retro Arcade Synthesizer for Monkey Jump
 */
class MonkeyJumpAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.hammerThemeLoop = null;
    this.isHammerPlaying = false;
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
    if (this.muted && this.isHammerPlaying) {
      this.stopHammerTheme();
    }
  }

  toggle() {
    this.setMuted(!this.muted);
    return !this.muted;
  }

  playTone(freq, type = 'square', duration = 0.08, startVol = 0.15, endVol = 0.01) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(startVol, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  step() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  jump() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (_) {}
  }

  barrelHop() {
    // 100 PTS bonus sound
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [660, 880, 1100].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.1);
      });
    } catch (_) {}
  }

  itemChime() {
    // Pauline bonus items (+300 PTS)
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.15);
      });
    } catch (_) {}
  }

  barrelRoll() {
    if (this.muted || !this.ctx) return;
    this.playTone(90, 'triangle', 0.06, 0.09, 0.01);
  }

  chestBeat() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  barrelToss() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (_) {}
  }

  hammerSmash() {
    // 300 PTS smash explosion crunch
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // Low punch tone
      this.playTone(110, 'square', 0.15, 0.25, 0.01);
    } catch (_) {}
  }

  startHammerTheme() {
    if (this.muted || !this.ctx || this.isHammerPlaying) return;
    this.isHammerPlaying = true;
    const notes = [
      { f: 523.25, d: 0.1 }, // C5
      { f: 587.33, d: 0.1 }, // D5
      { f: 659.25, d: 0.1 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 659.25, d: 0.1 }, // E5
      { f: 783.99, d: 0.2 }  // G5
    ];
    let step = 0;
    this.hammerThemeLoop = setInterval(() => {
      if (this.muted || !this.isHammerPlaying) return;
      const note = notes[step % notes.length];
      this.playTone(note.f, 'square', note.d, 0.1, 0.01);
      step++;
    }, 140);
  }

  stopHammerTheme() {
    this.isHammerPlaying = false;
    if (this.hammerThemeLoop) {
      clearInterval(this.hammerThemeLoop);
      this.hammerThemeLoop = null;
    }
  }

  stageClear() {
    this.stopHammerTheme();
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, t: 0.0 },   // C5
        { f: 659.25, t: 0.12 },  // E5
        { f: 783.99, t: 0.24 },  // G5
        { f: 1046.50, t: 0.36 }, // C6
        { f: 783.99, t: 0.50 },  // G5
        { f: 1046.50, t: 0.65 }  // C6
      ];
      melody.forEach(m => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(m.f, now + m.t);
        gain.gain.setValueAtTime(0.25, now + m.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + m.t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + m.t);
        osc.stop(now + m.t + 0.2);
      });
    } catch (_) {}
  }

  death() {
    this.stopHammerTheme();
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const tones = [
        { f: 440, t: 0.0 },
        { f: 415, t: 0.12 },
        { f: 392, t: 0.24 },
        { f: 349, t: 0.36 },
        { f: 220, t: 0.55 }
      ];
      tones.forEach(tone => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(tone.f, now + tone.t);
        gain.gain.setValueAtTime(0.2, now + tone.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.t + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + tone.t);
        osc.stop(now + tone.t + 0.18);
      });
    } catch (_) {}
  }
}

export const sound = new MonkeyJumpAudio();
