/**
 * Goodies and Baddies Procedural Web Audio API Chiptune Synthesizer
 * 100% code-synthesized 1985 arcade chiptune:
 * - Stage 1 Graveyard Theme (D Minor Gothic chiptune loop)
 * - Weapon throw sounds (Lance, Dagger, Holy Torch flame)
 * - Jump, Armor Shatter, Skeleton Crumble
 * - Zombie groan, Red Arremer screech, Cyclops boss roar & defeat
 * - Golden Key chime & Stage Clear Victory Fanfare
 */

export class GhostsAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.isPlayingBgm = false;
    this.bgmTimer = null;
    this.activeNodes = [];
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.16;
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
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.16, this.ctx.currentTime);
    }
    if (muted) {
      this.stopBGM();
    }
  }

  toggle() {
    this.setMuted(!this.muted);
    return !this.muted;
  }

  // Helper to schedule a tone
  playTone(freq, duration, type = 'square', timeOffset = 0, volume = 0.25) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime + timeOffset;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.02, duration - 0.01));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
    this.activeNodes.push({ osc, gain, stopTime: t + duration });
  }

  // -------------------------------------------------------------
  // STAGE 1 THEME: THE HAUNTED GRAVEYARD
  // -------------------------------------------------------------
  playThemeBGM() {
    if (this.muted || this.isPlayingBgm) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    this.isPlayingBgm = true;

    // Frequencies (Hz)
    const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, Bb3 = 233.08;
    const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63, F4 = 349.23, G4 = 392.00, Ab4 = 415.30, A4 = 440.00, Bb4 = 466.16, C5 = 523.25, D5 = 587.33;
    const D2 = 73.42, A2 = 110.00, G2 = 98.00, F2 = 87.31, E2 = 82.41, Bb2 = 116.54;

    // Iconic Stage 1 spooky melody notes & duration (in sixteenth note steps @ 140 BPM)
    // 1 step = 0.107 sec
    const step = 0.108;

    const melody = [
      // Bar 1-2: Main eerie riff
      { f: D4, d: 2 }, { f: 0, d: 1 }, { f: D4, d: 1 }, { f: F4, d: 2 }, { f: G4, d: 2 },
      { f: Ab4, d: 3 }, { f: A4, d: 3 }, { f: F4, d: 2 },
      { f: D4, d: 4 }, { f: C4, d: 2 }, { f: D4, d: 6 }, { f: 0, d: 4 },

      // Bar 3-4: Ascending tension
      { f: D4, d: 2 }, { f: F4, d: 2 }, { f: G4, d: 2 }, { f: Ab4, d: 2 },
      { f: A4, d: 3 }, { f: C5, d: 3 }, { f: Bb4, d: 2 },
      { f: A4, d: 2 }, { f: G4, d: 2 }, { f: F4, d: 2 }, { f: E4, d: 2 },
      { f: D4, d: 4 }, { f: 0, d: 4 },

      // Bar 5-6: Dramatic cadence
      { f: F4, d: 3 }, { f: G4, d: 3 }, { f: A4, d: 2 },
      { f: Bb4, d: 4 }, { f: A4, d: 2 }, { f: G4, d: 2 },
      { f: F4, d: 2 }, { f: E4, d: 2 }, { f: D4, d: 2 }, { f: C4, d: 2 },
      { f: D4, d: 6 }, { f: 0, d: 2 },

      // Bar 7-8: Chilling descent into graveyard loop
      { f: Bb4, d: 3 }, { f: A4, d: 3 }, { f: G4, d: 2 },
      { f: A4, d: 3 }, { f: G4, d: 3 }, { f: F4, d: 2 },
      { f: G4, d: 2 }, { f: F4, d: 2 }, { f: E4, d: 2 }, { f: Eb4, d: 2 },
      { f: D4, d: 6 }, { f: 0, d: 4 }
    ];

    // Pulsing chiptune triangle bassline
    const bass = [
      { f: D2, d: 2 }, { f: D3, d: 2 }, { f: D2, d: 2 }, { f: D3, d: 2 },
      { f: D2, d: 2 }, { f: D3, d: 2 }, { f: F2, d: 2 }, { f: G2, d: 2 },
      { f: D2, d: 2 }, { f: D3, d: 2 }, { f: D2, d: 2 }, { f: D3, d: 2 },
      { f: C3, d: 2 }, { f: C4, d: 2 }, { f: D2, d: 4 },

      { f: D2, d: 2 }, { f: D3, d: 2 }, { f: F2, d: 2 }, { f: G2, d: 2 },
      { f: A2, d: 2 }, { f: A3, d: 2 }, { f: Bb2, d: 2 }, { f: Bb3, d: 2 },
      { f: A2, d: 2 }, { f: G2, d: 2 }, { f: F2, d: 2 }, { f: E2, d: 2 },
      { f: D2, d: 4 }, { f: A2, d: 4 },

      { f: Bb2, d: 2 }, { f: Bb3, d: 2 }, { f: Bb2, d: 2 }, { f: Bb3, d: 2 },
      { f: A2, d: 2 }, { f: A3, d: 2 }, { f: G2, d: 2 }, { f: G3, d: 2 },
      { f: F2, d: 2 }, { f: F3, d: 2 }, { f: E2, d: 2 }, { f: E3, d: 2 },
      { f: D2, d: 4 }, { f: D3, d: 4 }
    ];

    const playLoop = () => {
      if (!this.isPlayingBgm || this.muted) return;
      let mTime = 0;
      melody.forEach(n => {
        if (n.f > 0) {
          this.playTone(n.f, n.d * step * 0.92, 'square', mTime, 0.18);
        }
        mTime += n.d * step;
      });

      let bTime = 0;
      // Loop bass to match melody length
      while (bTime < mTime) {
        for (const b of bass) {
          if (bTime >= mTime) break;
          this.playTone(b.f, b.d * step * 0.85, 'triangle', bTime, 0.22);
          bTime += b.d * step;
        }
      }

      this.bgmTimer = setTimeout(() => {
        if (this.isPlayingBgm) playLoop();
      }, mTime * 1000);
    };

    playLoop();
  }

  stopBGM() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // -------------------------------------------------------------
  // SFX: ARTHUR ACTIONS
  // -------------------------------------------------------------

  // Jump swoosh
  jump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Lance throw: Crisp metallic woosh
  throwLance() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Dagger throw: High-speed metallic snap
  throwDagger() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Holy Torch throw
  throwTorch() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Ground flame burning crackle
  torchIgnite() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Low frequency rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Arthur takes non-fatal hit: Armor breaks into shards
  armorLost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Clang
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.32);

    // Minor second dissonance
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(550, t);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.28);
    gain2.gain.setValueAtTime(0.3, t);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t);
    osc2.stop(t + 0.32);
  }

  // Fatal hit: Skeleton crumbles
  playerDeath() {
    this.stopBGM();
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const drops = [440, 392, 349, 311, 261, 220, 185, 146, 110];
    drops.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.28, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.11);
    });
  }

  // -------------------------------------------------------------
  // SFX: MONSTERS & BOSS
  // -------------------------------------------------------------

  // Zombie popping from ground
  zombieEmerge() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Enemy hit / defeated
  enemyKill() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Red Arremer screech
  redArremerScreech() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(980, t);
    osc1.frequency.linearRampToValueAtTime(1400, t + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(600, t + 0.25);

    osc2.frequency.setValueAtTime(1020, t);
    osc2.frequency.linearRampToValueAtTime(1450, t + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(630, t + 0.25);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.26);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.28);
    osc2.stop(t + 0.28);
  }

  // Boss Cyclops hit
  bossHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  // Boss Cyclops defeat explosion
  bossDefeat() {
    this.stopBGM();
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220 - i * 35, t + delay);
      osc.frequency.exponentialRampToValueAtTime(30, t + delay + 0.22);

      gain.gain.setValueAtTime(0.45, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.24);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.26);
    }
  }

  // -------------------------------------------------------------
  // REWARDS & STAGE CLEAR
  // -------------------------------------------------------------

  // Golden Key sparkle pickup
  keyPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]; // D5, E5, G5, A5, C6, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.2);
    });
  }

  // Weapon / Armor pickup chime
  itemPickup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.setValueAtTime(659.25, t + 0.08);
    osc.frequency.setValueAtTime(783.99, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  // Stage Clear Fanfare: Capcom 1985 victorious fanfare
  stageClearFanfare() {
    this.stopBGM();
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { f: 587.33, d: 0.12 }, // D5
      { f: 587.33, d: 0.12 }, // D5
      { f: 587.33, d: 0.12 }, // D5
      { f: 587.33, d: 0.36 }, // D5
      { f: 466.16, d: 0.24 }, // Bb4
      { f: 523.25, d: 0.24 }, // C5
      { f: 587.33, d: 0.48 }, // D5
      { f: 523.25, d: 0.24 }, // C5
      { f: 587.33, d: 0.80 }  // D5 sustain
    ];

    let curTime = t;
    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, curTime);

      gain.gain.setValueAtTime(0.35, curTime);
      gain.gain.exponentialRampToValueAtTime(0.01, curTime + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(curTime);
      osc.stop(curTime + n.d + 0.05);

      curTime += n.d;
    });
  }
}

export const sound = new GhostsAudio();
