/**
 * Authentic 8-Bit Tetris Synthesizer using Web Audio API
 * Features the iconic "Korobeiniki" (Type A) chiptune theme!
 */
export class TetrisAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.bgmTimer = null;
    this.isPlayingBgm = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.12;
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
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBGM();
    }
  }

  // "Korobeiniki" (Tetris Type A Theme)
  playThemeBGM() {
    if (this.muted || this.isPlayingBgm) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    this.isPlayingBgm = true;

    // Frequencies (Hz) for Korobeiniki melody
    const E5 = 659.25, B4 = 493.88, C5 = 523.25, D5 = 587.33;
    const A4 = 440.00, Gs4 = 415.30, E4 = 329.63, F5 = 698.46;

    const melody = [
      { f: E5, d: 2 }, { f: B4, d: 1 }, { f: C5, d: 1 }, { f: D5, d: 2 }, { f: C5, d: 1 }, { f: B4, d: 1 },
      { f: A4, d: 2 }, { f: A4, d: 1 }, { f: C5, d: 1 }, { f: E5, d: 2 }, { f: D5, d: 1 }, { f: C5, d: 1 },
      { f: B4, d: 3 }, { f: C5, d: 1 }, { f: D5, d: 2 }, { f: E5, d: 2 },
      { f: C5, d: 2 }, { f: A4, d: 2 }, { f: A4, d: 2 }, { f: 0,  d: 2 },

      { f: D5, d: 3 }, { f: F5, d: 1 }, { f: A4, d: 2 }, { f: Gs4, d: 1 }, { f: F5, d: 1 },
      { f: E5, d: 3 }, { f: C5, d: 1 }, { f: E5, d: 2 }, { f: D5, d: 1 }, { f: C5, d: 1 },
      { f: B4, d: 2 }, { f: B4, d: 1 }, { f: C5, d: 1 }, { f: D5, d: 2 }, { f: E5, d: 2 },
      { f: C5, d: 2 }, { f: A4, d: 2 }, { f: A4, d: 2 }, { f: 0,  d: 2 }
    ];

    let noteIndex = 0;
    const beatMs = 140;

    const scheduleNext = () => {
      if (!this.isPlayingBgm || this.muted) return;
      const note = melody[noteIndex];
      noteIndex = (noteIndex + 1) % melody.length;

      if (note.f > 0) {
        this.playSquareTone(note.f, (note.d * beatMs * 0.85) / 1000, 0.16);
      }

      this.bgmTimer = setTimeout(scheduleNext, note.d * beatMs);
    };

    scheduleNext();
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isPlayingBgm = false;
  }

  playSquareTone(freq, duration, vol = 0.15) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  playMove() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.playSquareTone(330, 0.03, 0.08);
  }

  playRotate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.playSquareTone(580, 0.05, 0.1);
  }

  playDrop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.playSquareTone(180, 0.08, 0.2);
  }

  playLineClear() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.2, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.12);
    });
  }

  playTetris() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.6);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  destroy() {
    this.stopBGM();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
