/**
 * Galactic Shooter - Web Audio API Retro Sound Synthesizer
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.tractorOsc = null;
    this.tractorGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.tractorOsc) {
      this.stopTractorBeam();
    }
    return this.muted;
  }

  playLaser(isDual = false) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isDual ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(isDual ? 980 : 880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  playAlienDive() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (_) {}
  }

  startTractorBeam() {
    if (this.muted || !this.ctx || this.tractorOsc) return;
    try {
      const now = this.ctx.currentTime;
      this.tractorOsc = this.ctx.createOscillator();
      this.tractorGain = this.ctx.createGain();

      this.tractorOsc.type = 'sawtooth';
      this.tractorOsc.frequency.setValueAtTime(180, now);

      // Low frequency modulation for tractor beam waver
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(8, now);
      lfoGain.gain.setValueAtTime(60, now);
      lfo.connect(this.tractorOsc.frequency);
      lfo.start(now);

      this.tractorGain.gain.setValueAtTime(0.12, now);

      this.tractorOsc.connect(this.tractorGain);
      this.tractorGain.connect(this.ctx.destination);

      this.tractorOsc.start(now);
      this.tractorLfo = lfo;
    } catch (_) {}
  }

  stopTractorBeam() {
    if (this.tractorOsc) {
      try {
        this.tractorGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        this.tractorOsc.stop(this.ctx.currentTime + 0.05);
        if (this.tractorLfo) this.tractorLfo.stop(this.ctx.currentTime + 0.05);
      } catch (_) {}
      this.tractorOsc = null;
      this.tractorGain = null;
      this.tractorLfo = null;
    }
  }

  playCapture() {
    if (this.muted || !this.ctx) return;
    this.stopTractorBeam();
    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 293.66, 220.00];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + (idx + 1) * 0.08);
      });
    } catch (_) {}
  }

  playRescueDock() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.18, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + (idx + 1) * 0.06);
      });
    } catch (_) {}
  }

  playExplosion(type = 'normal') {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = type === 'boss' ? 0.45 : (type === 'player' ? 0.6 : 0.25);
      
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'boss' ? 500 : 350, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(type === 'boss' ? 0.35 : 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (_) {}
  }

  playStageStart() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.1 },
        { f: 659.25, d: 0.1 },
        { f: 783.99, d: 0.1 },
        { f: 1046.50, d: 0.25 }
      ];
      let offset = 0;
      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, now + offset);
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + note.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + note.d);
        offset += note.d;
      });
    } catch (_) {}
  }

  playChallengingStage() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 740, 880];
      let offset = 0;
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
        offset += 0.1;
      });
    } catch (_) {}
  }
}

export const audio = new SoundEffects();
