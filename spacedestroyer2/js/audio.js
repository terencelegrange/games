/**
 * Space Destroyer II Procedural Retro Web Audio Synthesizer
 * 4-Step Alien Marching Beats, Multi-Tier Laser Blasts (Single, Dual, V-Spread, Triple),
 * Power-Up Drop & Collect Fanfares, Mystery Mothership Sirens, Explosions, and Stingers.
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.ufoOsc = null;
    this.ufoGain = null;
    this.ufoLfo = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? 0.35 : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.35 : 0, this.ctx.currentTime);
    }
    if (!this.enabled) {
      this.stopUfo();
    }
    return this.enabled;
  }

  // 1. Invader Marching Tone (4-note descending cycle: 0 -> 1 -> 2 -> 3)
  march(step = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [175, 155, 138, 123];
    const freq = freqs[step % 4] || 155;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  // 2. Laser Blasts (Tiered)
  laser(tier = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (tier === 0) {
      // Single Laser
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.125);
    } else if (tier === 1) {
      // Dual Parallel Lasers (Two punchy tones)
      [920, 760].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.14);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.145);
      });
    } else if (tier === 2) {
      // V-Spread Lasers (Wide stereo pitch glide)
      [1100, 840].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 180 : 120, now + 0.15);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.155);
      });
    } else if (tier === 3) {
      // Triple Cannon (Heavy 3-chord blast)
      [1200, 960, 720].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.16);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.165);
      });
    } else {
      // Tier 4: Mega Warhead Launch (Heavy sub-bass rocket whoosh)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.23);
    }
  }

  // Mega Warhead Detonation (Sub-bass rumble + filtered plasma thunder)
  warheadDetonate() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.55;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(40, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Deep sub-bass thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);
    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Force Shield Activation (Ascending energetic hum + crystalline barrier shimmer)
  shieldActivate() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Resonant ascending sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.36);

    // High shimmer harmonic
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(880, now);
    shimmer.frequency.linearRampToValueAtTime(1760, now + 0.3);
    sGain.gain.setValueAtTime(0.2, now);
    sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
    shimmer.connect(sGain);
    sGain.connect(this.masterGain);
    shimmer.start(now);
    shimmer.stop(now + 0.33);
  }

  // Force Shield Deflection (Metallic energy zap & harmonic ricochet)
  shieldDeflect() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Bright metallic ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(2400, now);
    ping.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    pingGain.gain.setValueAtTime(0.25, now);
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    ping.connect(pingGain);
    pingGain.connect(this.masterGain);
    ping.start(now);
    ping.stop(now + 0.1);
  }

  // Force Shield Power-Down (Descending soft tone)
  shieldExpire() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.28);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // 3. Power-Up Drop Whistle
  powerUpDrop() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // 4. Power-Up Collection Arpeggio Fanfare (C5 -> E5 -> G5 -> C6)
  powerUpCollect() {
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // 5. Invader Destroyed Explosion
  invaderHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(120, now + 0.12);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // 6. Mystery UFO Destruction Explosion
  ufoHit() {
    if (!this.enabled || !this.ctx) return;
    this.stopUfo();
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(80, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // 7. Continuous Mystery UFO Siren
  startUfo() {
    if (!this.enabled || !this.ctx || this.ufoOsc) return;
    const now = this.ctx.currentTime;

    this.ufoOsc = this.ctx.createOscillator();
    this.ufoGain = this.ctx.createGain();
    this.ufoLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    this.ufoOsc.type = 'sawtooth';
    this.ufoOsc.frequency.setValueAtTime(520, now);

    this.ufoLfo.type = 'sine';
    this.ufoLfo.frequency.setValueAtTime(4.5, now);
    lfoGain.gain.setValueAtTime(140, now);

    this.ufoLfo.connect(lfoGain);
    lfoGain.connect(this.ufoOsc.frequency);

    this.ufoGain.gain.setValueAtTime(0.18, now);

    this.ufoOsc.connect(this.ufoGain);
    this.ufoGain.connect(this.masterGain);

    this.ufoOsc.start(now);
    this.ufoLfo.start(now);
  }

  stopUfo() {
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoLfo.stop();
        this.ufoOsc.disconnect();
        this.ufoLfo.disconnect();
      } catch (_) {}
      this.ufoOsc = null;
      this.ufoLfo = null;
      this.ufoGain = null;
    }
  }

  // 8. Bunker Erosion Hit
  bunkerHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  // 9. Player Cannon Hit / Explosion
  playerDeath() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(60, now + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // 10. Wave Cleared Jingle
  waveClear() {
    if (!this.enabled || !this.ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  // 11. Game Over Stinger
  gameOver() {
    if (!this.enabled || !this.ctx) return;
    const notes = [329.63, 311.13, 293.66, 277.18];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.15;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }
}

export const sound = new SoundController();
