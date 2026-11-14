/**
 * Space Destroyer Procedural Retro Web Audio Synthesizer
 * 4-Step Alien Marching Beats, Laser Blasts, Explosions, Mystery UFO Sirens & Fanfares.
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

    // Snappy punch
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  // 2. Player Laser Shot
  laser() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

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
  }

  // 3. Invader Destroyed Explosion
  invaderHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Filtered noise crunch + low square blip
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

  // 4. Bunker Erosion Hit
  bunkerHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.065);
  }

  // 5. Player Cannon Explosion
  playerDeath() {
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
    filter.frequency.linearRampToValueAtTime(80, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  // 6. Mystery UFO High-Pitch Siren
  startUfo() {
    if (!this.enabled || !this.ctx || this.ufoOsc) return;
    try {
      const now = this.ctx.currentTime;

      this.ufoOsc = this.ctx.createOscillator();
      this.ufoGain = this.ctx.createGain();
      this.ufoLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      this.ufoOsc.type = 'sawtooth';
      this.ufoOsc.frequency.setValueAtTime(480, now);

      // LFO modulation for alien warble
      this.ufoLfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(60, now);

      this.ufoLfo.connect(lfoGain);
      lfoGain.connect(this.ufoOsc.frequency);

      this.ufoGain.gain.setValueAtTime(0.18, now);

      this.ufoOsc.connect(this.ufoGain);
      this.ufoGain.connect(this.masterGain);

      this.ufoOsc.start(now);
      this.ufoLfo.start(now);
    } catch (_) {
      // ignore
    }
  }

  stopUfo() {
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoLfo?.stop();
        this.ufoOsc.disconnect();
        this.ufoGain?.disconnect();
        this.ufoLfo?.disconnect();
      } catch (_) {}
      this.ufoOsc = null;
      this.ufoGain = null;
      this.ufoLfo = null;
    }
  }

  // 7. Mystery UFO Destroyed
  ufoHit() {
    this.stopUfo();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.16);
    });
  }

  // 8. Wave Clear Fanfare
  waveClear() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.6, 329.6, 392.0, 523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.24);
    });
  }

  // 9. Game Over Lament
  gameOver() {
    this.stopUfo();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 349.2, 311.1, 261.6];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.22;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }
}

export const sound = new SoundController();
