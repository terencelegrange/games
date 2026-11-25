/**
 * Authentic 1983 PC Speaker Synthesizer for Digger using Web Audio API
 * Includes "Popcorn", "William Tell Overture", and "Funeral March" chiptunes!
 */
export class DiggerAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.bgmTimer = null;
    this.bgmNoteIndex = 0;
    this.currentBgm = null; // 'popcorn', 'bonus', or null
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

  // --- Chiptune Melodies ---

  // "Popcorn" Theme (Main Gameplay)
  playPopcornBGM() {
    if (this.muted || this.currentBgm === 'popcorn') return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    this.currentBgm = 'popcorn';

    // Frequencies for "Popcorn" motif
    const notes = [
      466.16, 415.30, 466.16, 349.23, 277.18, 349.23, 233.08, 0,
      466.16, 415.30, 466.16, 349.23, 277.18, 349.23, 233.08, 0,
      466.16, 523.25, 554.37, 523.25, 554.37, 466.16, 523.25, 466.16,
      523.25, 415.30, 466.16, 415.30, 466.16, 392.00, 466.16, 0
    ];

    let noteIdx = 0;
    const interval = 135; // Tempo ms

    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const freq = notes[noteIdx];
      noteIdx = (noteIdx + 1) % notes.length;

      if (freq > 0) {
        this.playSquareTone(freq, 0.09, 0.15);
      }
    }, interval);
  }

  // "William Tell Overture" (Bonus Cherry Mode)
  playBonusBGM() {
    if (this.muted) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    this.currentBgm = 'bonus';

    // Classic William Tell da-da-dum da-da-dum da-da-dum-dum-dum motif
    const notes = [
      587.33, 587.33, 587.33, 587.33, 587.33, 587.33,
      587.33, 659.25, 739.99, 587.33, 659.25, 739.99,
      783.99, 739.99, 659.25, 587.33, 554.37, 587.33
    ];

    let idx = 0;
    this.bgmTimer = setInterval(() => {
      if (this.muted) return;
      const f = notes[idx];
      idx = (idx + 1) % notes.length;
      if (f > 0) {
        this.playSquareTone(f, 0.08, 0.2);
      }
    }, 110);
  }

  // "Funeral March" (Player Death)
  playFuneralMarch() {
    if (this.muted) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    const marchNotes = [
      { f: 293.66, d: 0.4 }, // D4
      { f: 293.66, d: 0.4 }, // D4
      { f: 293.66, d: 0.4 }, // D4
      { f: 293.66, d: 0.6 }, // D4
      { f: 349.23, d: 0.3 }, // F4
      { f: 329.63, d: 0.3 }, // E4
      { f: 293.66, d: 0.5 }  // D4
    ];

    let t = this.ctx.currentTime;
    marchNotes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d + 0.05;
    });
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentBgm = null;
  }

  playSquareTone(freq, duration, vol = 0.15) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square'; // Authentic PC speaker 1-bit square wave
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // --- Sound Effects ---

  playDig() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    // Crunch tone
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playEmerald() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.playSquareTone(987.77, 0.08, 0.2); // High B5 ping
  }

  playGold() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this.playSquareTone(784, 0.07, 0.25);
    setTimeout(() => {
      this.playSquareTone(1046.50, 0.12, 0.25); // C6 chime
    }, 70);
  }

  playShot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playCrush() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
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
