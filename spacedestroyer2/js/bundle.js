(() => {
  // spacedestroyer2/js/audio.js
  var SoundController = class {
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
      if (this.ctx && this.ctx.state === "suspended") {
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
      osc.type = "square";
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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.125);
      } else if (tier === 1) {
        [920, 760].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
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
        [1100, 840].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 180 : 120, now + 0.15);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.155);
        });
      } else if (tier === 3) {
        [1200, 960, 720].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
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
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(40, now + 0.55);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "sine";
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.36);
      const shimmer = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      shimmer.type = "sine";
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
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = "sine";
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
      osc.type = "sine";
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
      osc.type = "sine";
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
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.06;
        osc.type = "square";
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
      filter.type = "bandpass";
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
      filter.type = "lowpass";
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
      this.ufoOsc.type = "sawtooth";
      this.ufoOsc.frequency.setValueAtTime(520, now);
      this.ufoLfo.type = "sine";
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
        } catch (_) {
        }
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
      osc.type = "triangle";
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
      filter.type = "lowpass";
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
        osc.type = "square";
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
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    }
  };
  var sound = new SoundController();

  // spacedestroyer2/js/entities.js
  var INVADER_CONFIGS = {
    squid: {
      type: "squid",
      name: "COMMANDER SQUID",
      points: 30,
      width: 28,
      height: 22,
      color: "#f43f5e",
      // Neon crimson
      glow: "rgba(244, 63, 94, 0.4)"
    },
    crab: {
      type: "crab",
      name: "WARRIOR CRAB",
      points: 20,
      width: 32,
      height: 22,
      color: "#38bdf8",
      // Neon cyan
      glow: "rgba(56, 189, 248, 0.4)"
    },
    octopus: {
      type: "octopus",
      name: "SCOUT OCTOPUS",
      points: 10,
      width: 34,
      height: 22,
      color: "#34d399",
      // Emerald phosphor
      glow: "rgba(52, 211, 153, 0.4)"
    }
  };
  var WEAPON_TIERS = [
    { tier: 0, id: "single", name: "SINGLE LASER", color: "#22c55e", glow: "#4ade80" },
    { tier: 1, id: "dual", name: "DUAL PARALLEL", color: "#06b6d4", glow: "#38bdf8" },
    { tier: 2, id: "vspread", name: "V-SPREAD TWIN", color: "#f59e0b", glow: "#fcd34d" },
    { tier: 3, id: "triple", name: "TRIPLE V-CANNON", color: "#ec4899", glow: "#f472b6" },
    { tier: 4, id: "warhead", name: "MEGA WARHEAD", color: "#a855f7", glow: "#c084fc" },
    { tier: 5, id: "shield", name: "FORCE SHIELD", color: "#06b6d4", glow: "#67e8f9" }
  ];
  var Invader = class {
    constructor(row, col, x, y, config) {
      this.row = row;
      this.col = col;
      this.x = x;
      this.y = y;
      this.config = config;
      this.type = config.type;
      this.points = config.points;
      this.width = config.width;
      this.height = config.height;
      this.alive = true;
      this.deathTimer = 0;
      this.particles = [];
    }
    onHit() {
      this.alive = false;
      this.deathTimer = 0.35;
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        this.particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35,
          maxLife: 0.35,
          color: this.config.color,
          size: 2 + Math.random() * 3
        });
      }
    }
    update(dt) {
      if (this.deathTimer > 0) {
        this.deathTimer -= dt;
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) this.particles.splice(i, 1);
        }
      }
    }
    render(ctx, frame = 0) {
      if (!this.alive) {
        for (const p of this.particles) {
          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.config.color;
      ctx.shadowColor = this.config.glow;
      ctx.shadowBlur = 6;
      if (this.type === "squid") {
        this.renderSquid(ctx, frame);
      } else if (this.type === "crab") {
        this.renderCrab(ctx, frame);
      } else {
        this.renderOctopus(ctx, frame);
      }
      ctx.restore();
    }
    renderSquid(ctx, frame) {
      const s = 2.4;
      ctx.fillRect(4 * s, 0, 4 * s, 2 * s);
      ctx.fillRect(3 * s, 2 * s, 6 * s, 2 * s);
      ctx.fillRect(2 * s, 4 * s, 8 * s, 2 * s);
      ctx.fillRect(1 * s, 6 * s, 2 * s, 2 * s);
      ctx.fillRect(5 * s, 6 * s, 2 * s, 2 * s);
      ctx.fillRect(9 * s, 6 * s, 2 * s, 2 * s);
      if (frame === 0) {
        ctx.fillRect(3 * s, 8 * s, 6 * s, 1.5 * s);
        ctx.fillRect(2 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(8 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(0, 7 * s, 1.5 * s, 3.5 * s);
        ctx.fillRect(10.5 * s, 7 * s, 1.5 * s, 3.5 * s);
      } else {
        ctx.fillRect(3 * s, 8 * s, 6 * s, 1.5 * s);
        ctx.fillRect(4 * s, 9.5 * s, 4 * s, 2 * s);
        ctx.fillRect(1.5 * s, 9 * s, 1.5 * s, 3 * s);
        ctx.fillRect(9 * s, 9 * s, 1.5 * s, 3 * s);
      }
    }
    renderCrab(ctx, frame) {
      const s = 2.4;
      ctx.fillRect(2 * s, 0, 2 * s, 2 * s);
      ctx.fillRect(9 * s, 0, 2 * s, 2 * s);
      ctx.fillRect(3 * s, 2 * s, 7 * s, 2 * s);
      ctx.fillRect(1 * s, 4 * s, 11 * s, 2 * s);
      ctx.fillRect(0, 6 * s, 13 * s, 2 * s);
      ctx.fillRect(3 * s, 8 * s, 7 * s, 1.5 * s);
      if (frame === 0) {
        ctx.fillRect(0, 2 * s, 2 * s, 3 * s);
        ctx.fillRect(11 * s, 2 * s, 2 * s, 3 * s);
        ctx.fillRect(1 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(10 * s, 9.5 * s, 2 * s, 2 * s);
      } else {
        ctx.fillRect(0, 8 * s, 2 * s, 3 * s);
        ctx.fillRect(11 * s, 8 * s, 2 * s, 3 * s);
        ctx.fillRect(3 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(8 * s, 9.5 * s, 2 * s, 2 * s);
      }
    }
    renderOctopus(ctx, frame) {
      const s = 2.4;
      ctx.fillRect(4 * s, 0, 6 * s, 2 * s);
      ctx.fillRect(1 * s, 2 * s, 12 * s, 2 * s);
      ctx.fillRect(0, 4 * s, 14 * s, 2 * s);
      ctx.fillRect(0, 6 * s, 3 * s, 2 * s);
      ctx.fillRect(5 * s, 6 * s, 4 * s, 2 * s);
      ctx.fillRect(11 * s, 6 * s, 3 * s, 2 * s);
      if (frame === 0) {
        ctx.fillRect(3 * s, 8 * s, 2 * s, 2 * s);
        ctx.fillRect(9 * s, 8 * s, 2 * s, 2 * s);
        ctx.fillRect(1 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(11 * s, 9.5 * s, 2 * s, 2 * s);
      } else {
        ctx.fillRect(1 * s, 8 * s, 2 * s, 2 * s);
        ctx.fillRect(11 * s, 8 * s, 2 * s, 2 * s);
        ctx.fillRect(4 * s, 9.5 * s, 2 * s, 2 * s);
        ctx.fillRect(8 * s, 9.5 * s, 2 * s, 2 * s);
      }
    }
  };
  var Fleet = class {
    constructor(wave = 1, canvasWidth = 800) {
      this.wave = wave;
      this.canvasWidth = canvasWidth;
      this.rows = 5;
      this.cols = 11;
      this.totalInvaders = this.rows * this.cols;
      this.invaders = [];
      this.direction = 1;
      this.stepSizeX = 14;
      this.dropDistance = 18;
      this.stepTimer = 0;
      this.marchIndex = 0;
      this.animFrame = 0;
      this.bombCooldown = 1.1;
      this.bombTimer = this.bombCooldown;
      this.initGrid();
    }
    initGrid() {
      this.invaders = [];
      const startX = 60;
      const startY = Math.min(180, 85 + (this.wave - 1) * 16);
      const colSpacing = 58;
      const rowSpacing = 42;
      for (let r = 0; r < this.rows; r++) {
        let cfg = INVADER_CONFIGS.octopus;
        if (r === 0) cfg = INVADER_CONFIGS.squid;
        else if (r === 1 || r === 2) cfg = INVADER_CONFIGS.crab;
        for (let c = 0; c < this.cols; c++) {
          const x = startX + c * colSpacing;
          const y = startY + r * rowSpacing;
          this.invaders.push(new Invader(r, c, x, y, cfg));
        }
      }
    }
    getAliveCount() {
      return this.invaders.filter((inv) => inv.alive).length;
    }
    getStepInterval() {
      const alive = this.getAliveCount();
      const ratio = alive / this.totalInvaders;
      const waveBonus = Math.min(0.2, (this.wave - 1) * 0.04);
      return Math.max(0.065, 0.75 * Math.pow(ratio, 0.85) - waveBonus);
    }
    getBounds() {
      let minX = 9999;
      let maxX = -9999;
      let maxY = -9999;
      for (const inv of this.invaders) {
        if (inv.alive) {
          if (inv.x < minX) minX = inv.x;
          if (inv.x + inv.width > maxX) maxX = inv.x + inv.width;
          if (inv.y + inv.height > maxY) maxY = inv.y + inv.height;
        }
      }
      return { minX, maxX, maxY };
    }
    update(dt, onBombDrop) {
      for (const inv of this.invaders) {
        inv.update(dt);
      }
      const alive = this.getAliveCount();
      if (alive === 0) return;
      this.stepTimer += dt;
      const interval = this.getStepInterval();
      if (this.stepTimer >= interval) {
        this.stepTimer = 0;
        this.stepFleet();
      }
      this.bombTimer -= dt;
      if (this.bombTimer <= 0) {
        this.bombTimer = Math.max(0.5, 1.8 * (alive / this.totalInvaders) + Math.random() * 0.7);
        this.dropBomb(onBombDrop);
      }
    }
    stepFleet() {
      const { minX, maxX } = this.getBounds();
      const padding = 28;
      let shouldDrop = false;
      if (this.direction === 1 && maxX + this.stepSizeX > this.canvasWidth - padding) {
        shouldDrop = true;
      } else if (this.direction === -1 && minX - this.stepSizeX < padding) {
        shouldDrop = true;
      }
      if (shouldDrop) {
        this.direction = -this.direction;
        for (const inv of this.invaders) {
          inv.y += this.dropDistance;
        }
      } else {
        for (const inv of this.invaders) {
          inv.x += this.stepSizeX * this.direction;
        }
      }
      sound.march(this.marchIndex % 4);
      this.marchIndex++;
      this.animFrame = 1 - this.animFrame;
    }
    dropBomb(onBombDrop) {
      const bottomByCol = /* @__PURE__ */ new Map();
      for (const inv of this.invaders) {
        if (inv.alive) {
          const existing = bottomByCol.get(inv.col);
          if (!existing || inv.row > existing.row) {
            bottomByCol.set(inv.col, inv);
          }
        }
      }
      const candidates = Array.from(bottomByCol.values());
      if (candidates.length === 0) return;
      const shooter = candidates[Math.floor(Math.random() * candidates.length)];
      if (onBombDrop) {
        onBombDrop(shooter.x + shooter.width / 2, shooter.y + shooter.height + 4);
      }
    }
    render(ctx) {
      for (const inv of this.invaders) {
        inv.render(ctx, this.animFrame);
      }
    }
  };
  var LaserCannon = class {
    constructor(canvasWidth = 800, canvasHeight = 600) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.width = 44;
      this.height = 24;
      this.x = canvasWidth / 2 - this.width / 2;
      this.y = canvasHeight - 55;
      this.speed = 360;
      this.weaponTier = 0;
      this.shieldActive = false;
      this.shieldTimer = 0;
      this.maxShieldTime = 6;
      this.shieldAngle = 0;
      this.shieldSparks = [];
      this.alive = true;
      this.deathTimer = 0;
      this.particles = [];
    }
    reset() {
      this.x = this.canvasWidth / 2 - this.width / 2;
      this.alive = true;
      this.deathTimer = 0;
      this.particles = [];
      this.shieldActive = false;
      this.shieldTimer = 0;
      this.shieldSparks = [];
    }
    activateShield(duration = 6) {
      this.shieldActive = true;
      this.shieldTimer = duration;
      this.maxShieldTime = duration;
    }
    deactivateShield() {
      if (this.shieldActive) {
        this.shieldActive = false;
        this.shieldTimer = 0;
        sound.shieldExpire();
      }
    }
    deflectImpact(x, y) {
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 70 + Math.random() * 160;
        this.shieldSparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.35,
          maxLife: 0.35,
          color: ["#06b6d4", "#67e8f9", "#ffffff", "#a5f3fc"][Math.floor(Math.random() * 4)],
          size: 2.5 + Math.random() * 2.5
        });
      }
    }
    upgradeWeapon() {
      if (this.weaponTier < 5) {
        this.weaponTier++;
        if (this.weaponTier === 5) {
          this.activateShield(6);
        }
        return { upgraded: true, tier: this.weaponTier, config: WEAPON_TIERS[this.weaponTier] };
      }
      this.activateShield(6);
      return { upgraded: false, tier: this.weaponTier, config: WEAPON_TIERS[5], shieldRefill: true };
    }
    demoteWeapon() {
      this.weaponTier = Math.max(0, this.weaponTier - 1);
      this.shieldActive = false;
      this.shieldTimer = 0;
    }
    destroy() {
      this.alive = false;
      this.deathTimer = 1.2;
      this.demoteWeapon();
      sound.playerDeath();
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        this.particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.8,
          maxLife: 0.8,
          color: ["#06b6d4", "#facc15", "#ffffff", "#ef4444"][Math.floor(Math.random() * 4)],
          size: 3 + Math.random() * 4
        });
      }
    }
    update(dt, moveInput = 0) {
      if (this.alive) {
        this.x += moveInput * this.speed * dt;
        if (this.x < 24) this.x = 24;
        if (this.x + this.width > this.canvasWidth - 24) {
          this.x = this.canvasWidth - 24 - this.width;
        }
        if (this.shieldActive) {
          this.shieldAngle += dt * 3.2;
          this.shieldTimer -= dt;
          if (this.shieldTimer <= 0) {
            this.deactivateShield();
          }
        }
      } else {
        this.deathTimer -= dt;
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) this.particles.splice(i, 1);
        }
      }
      for (let i = this.shieldSparks.length - 1; i >= 0; i--) {
        const sp = this.shieldSparks[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.life -= dt;
        if (sp.life <= 0) this.shieldSparks.splice(i, 1);
      }
    }
    render(ctx) {
      for (const sp of this.shieldSparks) {
        const alpha = Math.max(0, sp.life / sp.maxLife);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
      }
      ctx.globalAlpha = 1;
      if (!this.alive) {
        for (const p of this.particles) {
          const alpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        return;
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      const tierCfg = WEAPON_TIERS[this.weaponTier] || WEAPON_TIERS[0];
      ctx.shadowColor = tierCfg.glow;
      ctx.shadowBlur = 8;
      ctx.fillStyle = tierCfg.color;
      ctx.fillRect(2, 12, this.width - 4, 12);
      ctx.fillRect(10, 6, this.width - 20, 6);
      if (this.weaponTier === 0) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.width / 2 - 2, 0, 4, 6);
      } else if (this.weaponTier === 1) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(6, 0, 4, 8);
        ctx.fillRect(this.width - 10, 0, 4, 8);
      } else if (this.weaponTier === 2) {
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(4, 1, 4, 7);
        ctx.fillRect(this.width - 8, 1, 4, 7);
        ctx.fillRect(0, 8, 4, 4);
        ctx.fillRect(this.width - 4, 8, 4, 4);
      } else if (this.weaponTier === 3) {
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(this.width / 2 - 2, -2, 4, 8);
        ctx.fillRect(4, 0, 4, 8);
        ctx.fillRect(this.width - 8, 0, 4, 8);
        ctx.fillStyle = "#fde047";
        ctx.fillRect(0, 6, 4, 6);
        ctx.fillRect(this.width - 4, 6, 4, 6);
      } else {
        ctx.fillStyle = this.weaponTier === 5 ? "#38bdf8" : "#c084fc";
        ctx.fillRect(this.width / 2 - 5, -4, 10, 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.width / 2 - 3, -4, 6, 3);
        ctx.fillStyle = this.weaponTier === 5 ? "#06b6d4" : "#a855f7";
        ctx.fillRect(0, 4, 6, 8);
        ctx.fillRect(this.width - 6, 4, 6, 8);
      }
      ctx.fillStyle = "#facc15";
      ctx.fillRect(8, 16, this.width - 16, 3);
      ctx.restore();
      if (this.shieldActive) {
        ctx.save();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const radius = 34;
        const warning = this.shieldTimer < 1.8;
        const pulseSpeed = warning ? 16 : 6;
        const pulse = 0.75 + Math.sin(performance.now() * 1e-3 * pulseSpeed) * 0.25;
        ctx.shadowColor = warning ? "#f59e0b" : "#38bdf8";
        ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = warning ? `rgba(245, 158, 11, ${0.85 * pulse})` : `rgba(6, 182, 212, ${0.9 * pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = warning ? `rgba(245, 158, 11, ${0.16 * pulse})` : `rgba(6, 182, 212, ${0.2 * pulse})`;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, this.shieldAngle, this.shieldAngle + Math.PI * 0.65);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, this.shieldAngle + Math.PI, this.shieldAngle + Math.PI * 1.65);
        ctx.stroke();
        ctx.strokeStyle = warning ? "#fef08a" : "#a5f3fc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 8, -this.shieldAngle * 1.5, -this.shieldAngle * 1.5 + Math.PI * 0.8);
        ctx.stroke();
        ctx.restore();
      }
    }
  };
  var Bunker = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.cellSize = 6;
      this.rows = 7;
      this.cols = 10;
      this.width = this.cols * this.cellSize;
      this.height = this.rows * this.cellSize;
      this.cells = [
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 1, 1]
      ];
    }
    checkHit(px, py, radius = 7) {
      if (px < this.x - radius || px > this.x + this.width + radius || py < this.y - radius || py > this.y + this.height + radius) {
        return false;
      }
      let hit = false;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.cells[r][c] === 1) {
            const cx = this.x + c * this.cellSize + this.cellSize / 2;
            const cy = this.y + r * this.cellSize + this.cellSize / 2;
            const dist = Math.hypot(px - cx, py - cy);
            if (dist <= radius) {
              this.cells[r][c] = 0;
              hit = true;
            }
          }
        }
      }
      return hit;
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = "#06b6d4";
      ctx.shadowColor = "rgba(6, 182, 212, 0.4)";
      ctx.shadowBlur = 4;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.cells[r][c] === 1) {
            ctx.fillRect(
              this.x + c * this.cellSize,
              this.y + r * this.cellSize,
              this.cellSize - 0.5,
              this.cellSize - 0.5
            );
          }
        }
      }
      ctx.restore();
    }
  };
  var Bullet = class {
    constructor(x, y, vy = -560, vx = 0, color = "#fde047", glow = "#facc15") {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.width = 3.5;
      this.height = 14;
      this.color = color;
      this.glow = glow;
      this.active = true;
      this.angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    }
    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y < -20 || this.y > 650 || this.x < -20 || this.x > 820) {
        this.active = false;
      }
    }
    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 8;
      ctx.fillRect(-this.width / 2, 0, this.width, this.height);
      ctx.restore();
    }
  };
  var MegaExplosion = class {
    constructor(x, y, maxRadius = 75, duration = 0.55) {
      this.x = x;
      this.y = y;
      this.maxRadius = maxRadius;
      this.duration = duration;
      this.timer = 0;
      this.active = true;
      this.particles = [];
      for (let i = 0; i < 32; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 160;
        this.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.4 + Math.random() * 0.25,
          maxLife: 0.65,
          color: ["#a855f7", "#c084fc", "#f59e0b", "#ffffff", "#38bdf8"][Math.floor(Math.random() * 5)],
          size: 3 + Math.random() * 4
        });
      }
    }
    update(dt) {
      this.timer += dt;
      if (this.timer >= this.duration) {
        this.active = false;
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    render(ctx) {
      const progress = Math.min(1, this.timer / this.duration);
      const radius = this.maxRadius * Math.sin(progress * Math.PI / 2);
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#c084fc";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 16;
      ctx.lineWidth = 4 * (1 - progress * 0.5);
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#fde047";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      if (progress < 0.35) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress / 0.35)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of this.particles) {
        const pAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pAlpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.restore();
    }
  };
  var MegaBullet = class {
    constructor(x, y, vy = -460, detonateY = 300) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = vy;
      this.width = 12;
      this.height = 24;
      this.color = "#c084fc";
      this.glow = "#a855f7";
      this.active = true;
      this.isMega = true;
      this.detonated = false;
      this.exploded = false;
      this.detonateY = detonateY;
      this.blastRadius = 90;
      this.maxTargets = 6;
      this.tick = 0;
      this.trailParticles = [];
    }
    update(dt) {
      this.tick += dt;
      this.y += this.vy * dt;
      if (Math.random() < 0.8) {
        this.trailParticles.push({
          x: this.x + (Math.random() * 6 - 3),
          y: this.y + this.height,
          vx: (Math.random() - 0.5) * 20,
          vy: 40 + Math.random() * 60,
          life: 0.25,
          maxLife: 0.25,
          color: ["#f59e0b", "#ec4899", "#c084fc"][Math.floor(Math.random() * 3)],
          size: 3 + Math.random() * 2
        });
      }
      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        const p = this.trailParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.trailParticles.splice(i, 1);
      }
      if (this.y <= this.detonateY && !this.exploded) {
        this.detonatePending = true;
      }
      if (this.y < -30) {
        this.active = false;
        this.exploded = true;
      }
    }
    explode(game) {
      if (this.exploded) return;
      this.exploded = true;
      this.detonated = true;
      this.active = false;
      if (game.explosions) {
        game.explosions.push(new MegaExplosion(this.x, this.y, this.blastRadius));
      }
      if (sound.warheadDetonate) {
        sound.warheadDetonate();
      }
      const candidates = [];
      for (const inv of game.fleet.invaders) {
        if (inv.alive) {
          const cx = inv.x + inv.width / 2;
          const cy = inv.y + inv.height / 2;
          const dist = Math.hypot(this.x - cx, this.y - cy);
          if (dist <= this.blastRadius) {
            candidates.push({ inv, dist });
          }
        }
      }
      candidates.sort((a, b) => a.dist - b.dist);
      const victims = candidates.slice(0, this.maxTargets || 6);
      for (const { inv } of victims) {
        inv.onHit();
        sound.invaderHit();
        game.totalHits++;
        game.score += inv.points;
        game.addFloatingScore(`+${inv.points}`, inv.x + inv.width / 2, inv.y, inv.config.color);
      }
      if (game.options?.onScore) game.options.onScore(game.score);
      if (game.options?.onInvaders) {
        game.options.onInvaders(game.fleet.getAliveCount(), game.fleet.totalInvaders);
      }
      if (game.fleet.getAliveCount() === 0) {
        game.handleWaveClear();
      }
      if (game.mysteryShip?.active) {
        const ufo = game.mysteryShip;
        const ux = ufo.x + ufo.width / 2;
        const uy = ufo.y + ufo.height / 2;
        if (Math.hypot(this.x - ux, this.y - uy) <= this.blastRadius + 20) {
          const { points, pod } = ufo.onHit();
          game.totalHits++;
          game.score += points;
          game.addFloatingScore(`\u2605 +${points} \u2605`, ux, uy - 10, "#ec4899");
          if (pod && game.powerUpPods) game.powerUpPods.push(pod);
          if (game.options?.onScore) game.options.onScore(game.score);
        }
      }
      for (const bk of game.bunkers) {
        if (bk.checkHit(this.x, this.y, this.blastRadius * 0.5)) {
          sound.bunkerHit();
        }
      }
    }
    render(ctx) {
      for (const p of this.trailParticles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, 0, this.width, this.height);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(this.width / 2, 0);
      ctx.lineTo(-this.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(-this.width / 2 - 4, this.height - 8, 4, 8);
      ctx.fillRect(this.width / 2, this.height - 8, 4, 8);
      const coreAlpha = 0.6 + Math.sin(this.tick * 20) * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
      ctx.fillRect(-2, 4, 4, 10);
      ctx.restore();
    }
  };
  var AlienBomb = class {
    constructor(x, y, vy = 240) {
      this.x = x;
      this.y = y;
      this.width = 4;
      this.height = 12;
      this.vy = vy;
      this.active = true;
      this.tick = Math.random() * 10;
    }
    update(dt) {
      this.tick += dt;
      this.y += this.vy * dt;
      this.x += Math.sin(this.tick * 16) * 1.2;
      if (this.y > 650) {
        this.active = false;
      }
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 6;
      ctx.fillRect(this.x - 2, this.y, 4, 4);
      ctx.fillRect(this.x - (Math.floor(this.tick * 12) % 2 === 0 ? 3 : -1), this.y + 4, 4, 4);
      ctx.fillRect(this.x - 2, this.y + 8, 4, 4);
      ctx.restore();
    }
  };
  var PowerUpPod = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 24;
      this.height = 24;
      this.vy = 115;
      this.tick = Math.random() * 10;
      this.active = true;
    }
    update(dt) {
      this.tick += dt;
      this.y += this.vy * dt;
      this.x += Math.sin(this.tick * 3.5) * 0.8;
      if (this.y > 620) {
        this.active = false;
      }
    }
    render(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const pulse = 0.85 + Math.sin(this.tick * 8) * 0.15;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", 0, 0);
      ctx.restore();
    }
  };
  var ShieldItem = class {
    constructor(x, y = 50, duration = 5) {
      this.x = x;
      this.y = y;
      this.width = 26;
      this.height = 26;
      this.vy = 65;
      this.tick = Math.random() * 10;
      this.active = true;
      this.collected = false;
      this.duration = duration;
    }
    update(dt) {
      this.tick += dt;
      if (this.y < 540) {
        this.y += this.vy * dt;
        this.x += Math.sin(this.tick * 3) * 0.9;
      } else {
        this.y = 540;
        this.x += Math.sin(this.tick * 2) * 35 * dt;
      }
      this.x = Math.max(20, Math.min(760, this.x));
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      const pulse = 0.88 + Math.sin(this.tick * 7) * 0.12;
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(6, 182, 212, 0.35)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 15, this.tick * 4, this.tick * 4 + Math.PI * 0.7);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", 0, 0);
      ctx.restore();
    }
  };
  var MysteryShip = class {
    constructor(canvasWidth = 800) {
      this.canvasWidth = canvasWidth;
      this.width = 48;
      this.height = 20;
      this.y = 48;
      this.speed = 150;
      this.active = false;
      this.direction = 1;
      this.x = -100;
      this.spawnTimer = 4.5 + Math.random() * 2.5;
      this.particles = [];
    }
    update(dt) {
      if (!this.active) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawn();
        }
        return;
      }
      this.x += this.speed * this.direction * dt;
      if (this.direction > 0 && this.x > this.canvasWidth + 60 || this.direction < 0 && this.x < -this.width - 60) {
        this.active = false;
        sound.stopUfo();
        this.spawnTimer = 10 + Math.random() * 5;
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    spawn() {
      this.active = true;
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.x = this.direction > 0 ? -this.width - 20 : this.canvasWidth + 20;
      sound.startUfo();
    }
    onHit() {
      this.active = false;
      sound.ufoHit();
      this.spawnTimer = 11 + Math.random() * 5;
      const scores = [50, 100, 150, 300];
      const points = scores[Math.floor(Math.random() * scores.length)];
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        this.particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.65,
          maxLife: 0.65,
          color: ["#06b6d4", "#facc15", "#ec4899", "#ffffff"][Math.floor(Math.random() * 4)],
          size: 3 + Math.random() * 4
        });
      }
      const pod = new PowerUpPod(this.x + this.width / 2, this.y + this.height + 2);
      sound.powerUpDrop();
      return { points, pod };
    }
    render(ctx) {
      for (const p of this.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = "#ec4899";
      ctx.shadowColor = "#f472b6";
      ctx.shadowBlur = 10;
      ctx.fillRect(16, 0, 16, 5);
      ctx.fillRect(8, 5, 32, 6);
      ctx.fillRect(0, 11, 48, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(6, 17, 6, 3);
      ctx.fillRect(21, 17, 6, 3);
      ctx.fillRect(36, 17, 6, 3);
      ctx.restore();
    }
  };

  // spacedestroyer2/js/game.js
  var STATES = {
    ROUND_START: "ROUND_START",
    PLAYING: "PLAYING",
    PLAYER_HIT: "PLAYER_HIT",
    WAVE_CLEAR: "WAVE_CLEAR",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
  };
  var SpaceDestroyerGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.width = 800;
      this.height = 600;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.wave = 1;
      this.score = 0;
      this.lives = 3;
      this.totalShots = 0;
      this.totalHits = 0;
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      this.waveClearTimer = 0;
      this.respawnTimer = 0;
      this.previousState = STATES.PLAYING;
      this.keys = { left: false, right: false };
      this.stars = [];
      this.initStars();
      this.initGameWorld();
      this.lastTime = performance.now();
      this.animId = null;
      this.start();
    }
    initStars() {
      this.stars = [];
      for (let i = 0; i < 90; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() < 0.25 ? 2 : 1,
          speed: 12 + Math.random() * 40,
          alpha: 0.3 + Math.random() * 0.7
        });
      }
    }
    initBunkers() {
      this.bunkers = [];
      const count = 4;
      const spacing = 180;
      const startX = 85;
      for (let i = 0; i < count; i++) {
        this.bunkers.push(new Bunker(startX + i * spacing, 450));
      }
    }
    initGameWorld() {
      this.fleet = new Fleet(this.wave, this.width);
      this.cannon = new LaserCannon(this.width, this.height);
      this.initBunkers();
      this.playerBullets = [];
      this.alienBombs = [];
      this.mysteryShip = new MysteryShip(this.width);
      this.powerUpPods = [];
      this.shieldItems = [];
      this.shieldItemSpawned = false;
      this.shieldItemTimer = 3.5;
      this.explosions = [];
      this.activeMegaBullet = null;
      this.floatingScores = [];
      this.shields = 1;
    }
    start() {
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      this.lastTime = performance.now();
      if (this.animId) cancelAnimationFrame(this.animId);
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
      if (this.options.onScore) this.options.onScore(this.score);
      if (this.options.onWave) this.options.onWave(this.wave);
      if (this.options.onLives) this.options.onLives(this.lives);
      if (this.options.onWeapon) this.options.onWeapon(WEAPON_TIERS[this.cannon.weaponTier]);
      if (this.options.onShield) this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
      if (this.options.onInvaders) {
        this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
      }
    }
    reset() {
      sound.stopUfo();
      this.wave = 1;
      this.score = 0;
      this.lives = 3;
      this.totalShots = 0;
      this.totalHits = 0;
      this.activeMegaBullet = null;
      this.explosions = [];
      this.shields = 1;
      this.shieldItems = [];
      this.shieldItemSpawned = false;
      this.shieldItemTimer = 3.5;
      this.initGameWorld();
      this.start();
    }
    setMoveLeft(val) {
      this.keys.left = Boolean(val);
    }
    setMoveRight(val) {
      this.keys.right = Boolean(val);
    }
    triggerShield() {
      if (this.state === STATES.ROUND_START) {
        this.state = STATES.PLAYING;
      }
      if (this.state !== STATES.PLAYING || !this.cannon.alive) return false;
      if (this.cannon.shieldActive) return false;
      if (this.shields > 0) {
        this.shields--;
        this.cannon.activateShield(6);
        sound.shieldActivate();
        this.addFloatingScore("\u2605 SHIELD ACTIVE (6s) \u2605", this.cannon.x + this.cannon.width / 2, this.cannon.y - 20, "#06b6d4");
        if (this.options.onShield) {
          this.options.onShield(this.shields, true, 6);
        }
        return true;
      }
      return false;
    }
    shoot() {
      if (this.state === STATES.ROUND_START) {
        this.state = STATES.PLAYING;
        this.roundStartTimer = 0;
      }
      if (this.state !== STATES.PLAYING || !this.cannon.alive) return;
      const tier = this.cannon.weaponTier;
      const cx = this.cannon.x;
      const cy = this.cannon.y;
      const cw = this.cannon.width;
      if (tier === 0) {
        this.totalShots++;
        this.playerBullets.push(new Bullet(cx + cw / 2, cy - 8, -560, 0, "#22c55e", "#4ade80"));
      } else if (tier === 1) {
        this.totalShots += 2;
        this.playerBullets.push(new Bullet(cx + 8, cy - 8, -560, 0, "#38bdf8", "#0ea5e9"));
        this.playerBullets.push(new Bullet(cx + cw - 8, cy - 8, -560, 0, "#38bdf8", "#0ea5e9"));
      } else if (tier === 2) {
        this.totalShots += 2;
        this.playerBullets.push(new Bullet(cx + 10, cy - 8, -540, -125, "#f59e0b", "#fcd34d"));
        this.playerBullets.push(new Bullet(cx + cw - 10, cy - 8, -540, 125, "#f59e0b", "#fcd34d"));
      } else if (tier === 3) {
        this.totalShots += 3;
        this.playerBullets.push(new Bullet(cx + cw / 2, cy - 10, -560, 0, "#ec4899", "#f472b6"));
        this.playerBullets.push(new Bullet(cx + 8, cy - 8, -540, -140, "#ec4899", "#f472b6"));
        this.playerBullets.push(new Bullet(cx + cw - 8, cy - 8, -540, 140, "#ec4899", "#f472b6"));
      } else {
        if (this.activeMegaBullet && !this.activeMegaBullet.exploded) {
          return;
        }
        this.totalShots++;
        const mega = new MegaBullet(cx + cw / 2, cy - 14, -460, 300);
        this.activeMegaBullet = mega;
        this.playerBullets.push(mega);
      }
      sound.laser(tier);
    }
    togglePause() {
      if (this.state === STATES.PLAYING || this.state === STATES.ROUND_START) {
        this.previousState = this.state;
        this.state = STATES.PAUSED;
        sound.stopUfo();
        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
        return true;
      } else if (this.state === STATES.PAUSED) {
        this.state = this.previousState || STATES.PLAYING;
        this.lastTime = performance.now();
        this.animId = requestAnimationFrame(this.loop);
        return false;
      }
      return false;
    }
    addFloatingScore(text, x, y, color = "#facc15") {
      this.floatingScores.push({
        text,
        x,
        y,
        vy: -40,
        alpha: 1,
        color,
        life: 0.95
      });
    }
    handleWaveClear() {
      this.state = STATES.WAVE_CLEAR;
      this.waveClearTimer = 2.2;
      sound.stopUfo();
      sound.waveClear();
      if (this.options.onWaveClear) {
        this.options.onWaveClear(this.wave);
      }
    }
    advanceToNextWave() {
      this.wave++;
      this.fleet = new Fleet(this.wave, this.width);
      this.playerBullets = [];
      this.alienBombs = [];
      this.powerUpPods = [];
      this.shieldItems = [];
      this.shieldItemSpawned = false;
      this.shieldItemTimer = 3.5;
      this.explosions = [];
      this.activeMegaBullet = null;
      this.mysteryShip = new MysteryShip(this.width);
      this.cannon.reset();
      this.initBunkers();
      this.shields = Math.min(3, Math.max(1, this.shields + 1));
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      if (this.options.onWave) this.options.onWave(this.wave);
      if (this.options.onShield) this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
      if (this.options.onInvaders) {
        this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
      }
    }
    spawnShieldItem(x = null, y = 50, duration = 5) {
      const spawnX = x !== null ? x : 120 + Math.random() * (this.width - 240);
      const item = new ShieldItem(spawnX, y, duration);
      this.shieldItems.push(item);
      this.shieldItemSpawned = true;
      return item;
    }
    handlePlayerDeath() {
      this.lives--;
      this.cannon.destroy();
      if (this.options.onLives) this.options.onLives(this.lives);
      if (this.options.onWeapon) this.options.onWeapon(WEAPON_TIERS[this.cannon.weaponTier]);
      if (this.options.onShield) this.options.onShield(this.shields, false, 0);
      if (this.lives <= 0) {
        this.handleGameOver("CANNON DESTROYED");
      } else {
        this.state = STATES.PLAYER_HIT;
        this.respawnTimer = 1.4;
      }
    }
    handleGameOver(reason = "GAME OVER") {
      this.state = STATES.GAME_OVER;
      sound.stopUfo();
      sound.gameOver();
      const accuracy = this.totalShots > 0 ? Math.round(this.totalHits / this.totalShots * 100) : 0;
      if (this.options.onGameOver) {
        this.options.onGameOver({
          score: this.score,
          wave: this.wave,
          accuracy,
          totalHits: this.totalHits,
          totalShots: this.totalShots,
          reason
        });
      }
    }
    loop(currentTime) {
      if (this.state !== STATES.PLAYING && this.state !== STATES.ROUND_START && this.state !== STATES.PLAYER_HIT && this.state !== STATES.WAVE_CLEAR) {
        return;
      }
      const dt = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      this.update(dt);
      this.render();
      this.animId = requestAnimationFrame(this.loop);
    }
    update(dt) {
      for (const s of this.stars) {
        s.y += s.speed * dt;
        if (s.y > this.height) {
          s.y = 0;
          s.x = Math.random() * this.width;
        }
      }
      if (this.state === STATES.ROUND_START) {
        this.roundStartTimer -= dt;
        this.mysteryShip.update(dt);
        if (this.roundStartTimer <= 0) {
          this.state = STATES.PLAYING;
        }
        return;
      }
      if (this.state === STATES.WAVE_CLEAR) {
        this.waveClearTimer -= dt;
        if (this.waveClearTimer <= 0) {
          this.advanceToNextWave();
        }
        return;
      }
      if (this.state === STATES.PLAYER_HIT) {
        this.cannon.update(dt, 0);
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          this.cannon.reset();
          this.state = STATES.PLAYING;
        }
        return;
      }
      let moveInput = 0;
      if (this.keys.left) moveInput -= 1;
      if (this.keys.right) moveInput += 1;
      this.cannon.update(dt, moveInput);
      this.fleet.update(dt, (bx, by) => {
        this.alienBombs.push(new AlienBomb(bx, by, 240 + (this.wave - 1) * 15));
      });
      if (this.fleet.getBounds().maxY >= 470) {
        this.handleGameOver("INVASION REACHED BASELINE!");
        return;
      }
      this.mysteryShip.update(dt);
      for (let i = this.powerUpPods.length - 1; i >= 0; i--) {
        const pod = this.powerUpPods[i];
        pod.update(dt);
        if (this.cannon.alive) {
          const c = this.cannon;
          if (pod.x >= c.x - 12 && pod.x <= c.x + c.width + 12 && pod.y >= c.y - 12 && pod.y <= c.y + c.height + 12) {
            pod.active = false;
            const res = this.cannon.upgradeWeapon();
            if (res.upgraded) {
              sound.powerUpCollect();
              if (res.tier === 5) {
                this.shields = Math.min(3, this.shields + 1);
                sound.shieldActivate();
                this.addFloatingScore("\u2605 FORCE SHIELD ACTIVATED! \u2605", c.x + c.width / 2, c.y - 18, "#06b6d4");
                if (this.options.onShield) this.options.onShield(this.shields, true, 6);
              } else {
                this.addFloatingScore(`\u2605 ${res.config.name} \u2605`, c.x + c.width / 2, c.y - 18, res.config.color);
              }
              if (this.options.onWeapon) this.options.onWeapon(res.config);
            } else {
              this.score += 500;
              sound.powerUpCollect();
              if (res.shieldRefill) {
                this.shields = Math.min(3, this.shields + 1);
                sound.shieldActivate();
                this.addFloatingScore("\u2605 SHIELD RECHARGED +500 \u2605", c.x + c.width / 2, c.y - 18, "#06b6d4");
                if (this.options.onShield) this.options.onShield(this.shields, true, 6);
              } else {
                this.addFloatingScore("\u2605 MAX POWER +500 \u2605", c.x + c.width / 2, c.y - 18, "#ec4899");
              }
              if (this.options.onScore) this.options.onScore(this.score);
            }
          }
        }
        if (!pod.active) {
          this.powerUpPods.splice(i, 1);
        }
      }
      if (!this.shieldItemSpawned && this.state === STATES.PLAYING) {
        this.shieldItemTimer -= dt;
        if (this.shieldItemTimer <= 0) {
          this.spawnShieldItem();
        }
      }
      for (let i = this.shieldItems.length - 1; i >= 0; i--) {
        const item = this.shieldItems[i];
        item.update(dt);
        if (this.cannon.alive) {
          const c = this.cannon;
          if (item.x + item.width >= c.x - 12 && item.x <= c.x + c.width + 12 && item.y + item.height >= c.y - 12 && item.y <= c.y + c.height + 12) {
            item.active = false;
            item.collected = true;
            c.activateShield(item.duration || 5);
            sound.shieldActivate();
            this.score += 250;
            this.addFloatingScore("\u2605 5s FORCE SHIELD! \u2605", c.x + c.width / 2, c.y - 18, "#06b6d4");
            if (this.options.onScore) this.options.onScore(this.score);
            if (this.options.onShield) {
              this.options.onShield(this.shields, true, c.shieldTimer);
            }
          }
        }
        if (!item.active) {
          this.shieldItems.splice(i, 1);
        }
      }
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const exp = this.explosions[i];
        exp.update(dt);
        if (!exp.active) {
          this.explosions.splice(i, 1);
        }
      }
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        b.update(dt);
        if (b.isMega) {
          if (b.detonatePending || b.y <= b.detonateY) {
            b.explode(this);
            if (this.activeMegaBullet === b) this.activeMegaBullet = null;
            this.playerBullets.splice(i, 1);
            continue;
          }
        }
        let bulletConsumed = false;
        for (const inv of this.fleet.invaders) {
          if (inv.alive && b.x >= inv.x && b.x <= inv.x + inv.width && b.y >= inv.y && b.y <= inv.y + inv.height) {
            if (b.isMega) {
              b.explode(this);
              if (this.activeMegaBullet === b) this.activeMegaBullet = null;
              bulletConsumed = true;
              break;
            } else {
              inv.onHit();
              sound.invaderHit();
              this.totalHits++;
              this.score += inv.points;
              this.addFloatingScore(`+${inv.points}`, inv.x + inv.width / 2, inv.y, inv.config.color);
              if (this.options.onScore) this.options.onScore(this.score);
              if (this.options.onInvaders) {
                this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
              }
              bulletConsumed = true;
              if (this.fleet.getAliveCount() === 0) {
                this.handleWaveClear();
              }
              break;
            }
          }
        }
        if (!bulletConsumed && this.mysteryShip.active) {
          const ufo = this.mysteryShip;
          if (b.x >= ufo.x && b.x <= ufo.x + ufo.width && b.y >= ufo.y && b.y <= ufo.y + ufo.height) {
            if (b.isMega) {
              b.explode(this);
              if (this.activeMegaBullet === b) this.activeMegaBullet = null;
              bulletConsumed = true;
            } else {
              const { points, pod } = ufo.onHit();
              this.totalHits++;
              this.score += points;
              this.addFloatingScore(`\u2605 +${points} \u2605`, ufo.x + ufo.width / 2, ufo.y - 10, "#ec4899");
              if (this.options.onScore) this.options.onScore(this.score);
              if (pod) {
                this.powerUpPods.push(pod);
              }
              bulletConsumed = true;
            }
          }
        }
        if (!bulletConsumed) {
          for (const bk of this.bunkers) {
            if (bk.checkHit(b.x, b.y, b.isMega ? 14 : 6)) {
              sound.bunkerHit();
              if (b.isMega) {
                b.explode(this);
                if (this.activeMegaBullet === b) this.activeMegaBullet = null;
              }
              bulletConsumed = true;
              break;
            }
          }
        }
        if (bulletConsumed || !b.active) {
          if (b.isMega && this.activeMegaBullet === b) {
            this.activeMegaBullet = null;
          }
          this.playerBullets.splice(i, 1);
        }
      }
      for (let i = this.alienBombs.length - 1; i >= 0; i--) {
        const bomb = this.alienBombs[i];
        bomb.update(dt);
        let bombConsumed = false;
        for (const bk of this.bunkers) {
          if (bk.checkHit(bomb.x, bomb.y, 7)) {
            sound.bunkerHit();
            bombConsumed = true;
            break;
          }
        }
        if (!bombConsumed && this.cannon.alive) {
          const c = this.cannon;
          if (c.shieldActive) {
            const scx = c.x + c.width / 2;
            const scy = c.y + c.height / 2;
            if (Math.hypot(bomb.x - scx, bomb.y - scy) <= 36) {
              bombConsumed = true;
              sound.shieldDeflect();
              c.deflectImpact(bomb.x, bomb.y);
              this.addFloatingScore("DEFLECTED!", bomb.x, bomb.y - 10, "#06b6d4");
            }
          } else if (bomb.x >= c.x && bomb.x <= c.x + c.width && bomb.y >= c.y && bomb.y <= c.y + c.height) {
            bombConsumed = true;
            this.handlePlayerDeath();
          }
        }
        if (bombConsumed || !bomb.active) {
          this.alienBombs.splice(i, 1);
        }
      }
      for (let i = this.floatingScores.length - 1; i >= 0; i--) {
        const f = this.floatingScores[i];
        f.y += f.vy * dt;
        f.life -= dt;
        f.alpha = Math.max(0, f.life / 0.95);
        if (f.life <= 0) this.floatingScores.splice(i, 1);
      }
      if (this.cannon.alive && this.options.onShield) {
        this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
      }
    }
    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#ffffff";
      for (const s of this.stars) {
        ctx.globalAlpha = s.alpha;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.globalAlpha = 1;
      this.mysteryShip.render(ctx);
      for (const pod of this.powerUpPods) {
        pod.render(ctx);
      }
      for (const item of this.shieldItems) {
        item.render(ctx);
      }
      this.fleet.render(ctx);
      for (const bk of this.bunkers) {
        bk.render(ctx);
      }
      for (const b of this.playerBullets) {
        b.render(ctx);
      }
      for (const bomb of this.alienBombs) {
        bomb.render(ctx);
      }
      this.cannon.render(ctx);
      for (const exp of this.explosions) {
        exp.render(ctx);
      }
      for (const f of this.floatingScores) {
        ctx.save();
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = f.alpha;
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
      if (this.state === STATES.ROUND_START) {
        ctx.fillStyle = "rgba(6, 9, 19, 0.45)";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#0284c7";
        ctx.shadowBlur = 12;
        ctx.font = 'bold 20px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText(`\u2605 WAVE ${this.wave} \u2605`, this.width / 2, this.height / 2 - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillText("PRESS SPACE TO DEFEND", this.width / 2, this.height / 2 + 20);
      } else if (this.state === STATES.PAUSED) {
        ctx.fillStyle = "rgba(6, 9, 19, 0.75)";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = "#fde047";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.font = 'bold 24px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", this.width / 2, this.height / 2);
      }
      ctx.restore();
    }
  };

  // spacedestroyer2/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
    getHighScore(gameId = "spacedestroyer2") {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
        return val ? parseInt(val, 10) : 0;
      } catch {
        return 0;
      }
    },
    setHighScore(gameId = "spacedestroyer2", score) {
      try {
        const current = this.getHighScore(gameId);
        if (score > current) {
          localStorage.setItem(`${STORAGE_PREFIX}high_${gameId}`, score.toString());
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    getSetting(key, defaultValue) {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}opt_${key}`);
        return val !== null ? JSON.parse(val) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    setSetting(key, value) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}opt_${key}`, JSON.stringify(value));
      } catch {
      }
    }
  };
  async function recordGameActivity(data) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });
    } catch (_) {
    }
  }

  // spacedestroyer2/js/main.js
  var SpaceDestroyer2App = class {
    constructor() {
      this.gameId = "spacedestroyer2";
      this.gameInstance = null;
      this.fireKeyDown = false;
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.canvas = document.getElementById("space-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.hudScore = document.getElementById("hud-score");
      this.hudWave = document.getElementById("hud-wave");
      this.hudLives = document.getElementById("hud-lives");
      this.hudInvaders = document.getElementById("hud-invaders");
      this.hudWeapon = document.getElementById("hud-weapon");
      this.hudShield = document.getElementById("hud-shield");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.floatingBanner = document.getElementById("floating-banner");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.btnMoveLeft = document.getElementById("btn-move-left");
      this.btnMoveRight = document.getElementById("btn-move-right");
      this.btnTriggerShield = document.getElementById("btn-trigger-shield");
      this.deckShieldCount = document.getElementById("deck-shield-count");
      this.btnTriggerFire = document.getElementById("btn-trigger-fire");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayTitle = document.getElementById("overlay-title");
      this.overlayReason = document.getElementById("overlay-reason");
      this.overlayFinalScore = document.getElementById("overlay-final-score");
      this.overlayFinalWave = document.getElementById("overlay-final-wave");
      this.overlayFinalAccuracy = document.getElementById("overlay-final-accuracy");
      this.overlayFinalHits = document.getElementById("overlay-final-hits");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.highScore = storage.getHighScore(this.gameId);
      this.init();
    }
    init() {
      this.applySettings();
      this.setupGame();
      this.bindEvents();
    }
    applySettings() {
      this.soundIcon.textContent = this.soundEnabled ? "\u{1F50A}" : "\u{1F507}";
      this.btnToggleSound.classList.toggle("active", this.soundEnabled);
      this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
      this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
      this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
    }
    setupGame() {
      this.gameInstance = new SpaceDestroyerGame(this.canvas, {
        onScore: (score) => {
          this.hudScore.textContent = score.toString().padStart(5, "0");
          if (score > this.highScore) {
            this.highScore = score;
            this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
            storage.setHighScore(this.gameId, this.highScore);
          }
        },
        onWave: (wave) => {
          this.hudWave.textContent = wave.toString();
        },
        onLives: (lives) => {
          const icons = [];
          for (let i = 0; i < 3; i++) {
            icons.push(i < lives ? "\u25B2" : "\xD7");
          }
          this.hudLives.textContent = icons.join(" ");
        },
        onWeapon: (cfg) => {
          if (this.hudWeapon && cfg) {
            this.hudWeapon.textContent = cfg.name;
            this.hudWeapon.style.color = cfg.color;
            this.hudWeapon.style.textShadow = `0 0 8px ${cfg.glow}`;
          }
        },
        onShield: (shields, active, remainingTime) => {
          if (this.hudShield) {
            if (active) {
              this.hudShield.textContent = `${remainingTime.toFixed(1)}s`;
              this.hudShield.classList.add("active");
            } else if (shields > 0) {
              this.hudShield.textContent = `READY (${shields})`;
              this.hudShield.classList.remove("active");
            } else {
              this.hudShield.textContent = "OFFLINE (0)";
              this.hudShield.classList.remove("active");
            }
          }
          if (this.btnTriggerShield && this.deckShieldCount) {
            if (active) {
              this.btnTriggerShield.classList.add("active");
              this.deckShieldCount.textContent = `${remainingTime.toFixed(1)}s ACTIVE`;
            } else {
              this.btnTriggerShield.classList.remove("active");
              this.deckShieldCount.textContent = shields > 0 ? `[S] READY (${shields})` : "[S] NONE (0)";
            }
          }
        },
        onInvaders: (alive, total) => {
          this.hudInvaders.textContent = `${alive} / ${total}`;
        },
        onWaveClear: (wave) => {
          if (this.floatingBanner) {
            this.floatingBanner.textContent = `\u2605 WAVE ${wave} CLEARED! \u2605`;
            this.floatingBanner.classList.add("show");
            setTimeout(() => {
              this.floatingBanner.classList.remove("show");
            }, 2e3);
          }
        },
        onGameOver: (stats) => {
          this.handleGameOver(stats);
        }
      });
    }
    handleGameOver(stats) {
      if (stats.score > this.highScore) {
        this.highScore = stats.score;
        storage.setHighScore(this.gameId, this.highScore);
        this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
      }
      if (this.overlayReason) {
        this.overlayReason.textContent = stats.reason || "DEFENSE FAILED";
      }
      this.overlayFinalScore.textContent = stats.score.toString().padStart(5, "0");
      this.overlayFinalWave.textContent = `WAVE ${stats.wave}`;
      this.overlayFinalAccuracy.textContent = `${stats.accuracy}%`;
      this.overlayFinalHits.textContent = `${stats.totalHits} / ${stats.totalShots}`;
      this.gameOverlay.classList.add("visible");
      recordGameActivity({
        gameId: "spacedestroyer2",
        level: Math.max(1, Math.min(255, stats.wave)),
        score: stats.score,
        status: "complete",
        result: `${stats.score} PTS (WAVE ${stats.wave})`
      });
    }
    bindEvents() {
      this.btnToggleSound.addEventListener("click", () => {
        this.soundEnabled = sound.toggle();
        storage.setSetting("sound_enabled", this.soundEnabled);
        this.applySettings();
      });
      this.btnToggleCrt.addEventListener("click", () => {
        this.crtEnabled = !this.crtEnabled;
        storage.setSetting("crt_enabled", this.crtEnabled);
        this.applySettings();
      });
      this.btnPauseGame.addEventListener("click", () => {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
        }
      });
      const doRestart = () => {
        this.gameOverlay.classList.remove("visible");
        if (this.gameInstance) {
          this.gameInstance.reset();
          this.btnPauseGame.textContent = "PAUSE";
        }
      };
      this.btnRestartGame.addEventListener("click", doRestart);
      this.overlayRestartBtn.addEventListener("click", doRestart);
      window.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "KeyA"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          this.gameInstance.setMoveLeft(true);
        } else if (["ArrowRight", "KeyD"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          this.gameInstance.setMoveRight(true);
        } else if (["Space", "ArrowUp", "KeyW", "Enter"].includes(e.code)) {
          e.preventDefault();
          if (e.repeat || this.fireKeyDown) return;
          this.fireKeyDown = true;
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) {
            doRestart();
          } else {
            this.gameInstance.shoot();
            if (this.btnTriggerFire) {
              this.btnTriggerFire.classList.add("pressed");
              setTimeout(() => this.btnTriggerFire.classList.remove("pressed"), 100);
            }
          }
        } else if (["KeyS", "ShiftLeft", "ShiftRight"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          if (this.gameInstance) {
            this.gameInstance.triggerShield();
            if (this.btnTriggerShield) {
              this.btnTriggerShield.classList.add("pressed");
              setTimeout(() => this.btnTriggerShield.classList.remove("pressed"), 120);
            }
          }
        } else if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
          }
        } else if (e.code === "KeyM") {
          this.btnToggleSound.click();
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
      window.addEventListener("keyup", (e) => {
        if (["ArrowLeft", "KeyA"].includes(e.code)) {
          this.gameInstance.setMoveLeft(false);
        } else if (["ArrowRight", "KeyD"].includes(e.code)) {
          this.gameInstance.setMoveRight(false);
        } else if (["Space", "ArrowUp", "KeyW", "Enter"].includes(e.code)) {
          this.fireKeyDown = false;
        }
      });
      this.canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          const rect = this.canvas.getBoundingClientRect();
          const clickX = (e.clientX - rect.left) / rect.width * this.gameInstance.width;
          if (clickX < this.gameInstance.cannon.x) {
            this.gameInstance.setMoveLeft(true);
            setTimeout(() => this.gameInstance.setMoveLeft(false), 120);
          } else if (clickX > this.gameInstance.cannon.x + this.gameInstance.cannon.width) {
            this.gameInstance.setMoveRight(true);
            setTimeout(() => this.gameInstance.setMoveRight(false), 120);
          }
          this.gameInstance.shoot();
        }
      });
      if (this.btnMoveLeft) {
        const startLeft = (e) => {
          e.preventDefault();
          sound.init();
          this.gameInstance.setMoveLeft(true);
          this.btnMoveLeft.classList.add("pressed");
        };
        const stopLeft = (e) => {
          e.preventDefault();
          this.gameInstance.setMoveLeft(false);
          this.btnMoveLeft.classList.remove("pressed");
        };
        this.btnMoveLeft.addEventListener("pointerdown", startLeft);
        this.btnMoveLeft.addEventListener("pointerup", stopLeft);
        this.btnMoveLeft.addEventListener("pointercancel", stopLeft);
        this.btnMoveLeft.addEventListener("pointerleave", stopLeft);
      }
      if (this.btnMoveRight) {
        const startRight = (e) => {
          e.preventDefault();
          sound.init();
          this.gameInstance.setMoveRight(true);
          this.btnMoveRight.classList.add("pressed");
        };
        const stopRight = (e) => {
          e.preventDefault();
          this.gameInstance.setMoveRight(false);
          this.btnMoveRight.classList.remove("pressed");
        };
        this.btnMoveRight.addEventListener("pointerdown", startRight);
        this.btnMoveRight.addEventListener("pointerup", stopRight);
        this.btnMoveRight.addEventListener("pointercancel", stopRight);
        this.btnMoveRight.addEventListener("pointerleave", stopRight);
      }
      if (this.btnTriggerShield) {
        this.btnTriggerShield.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          sound.init();
          if (this.gameInstance && this.gameInstance.state !== STATES.GAME_OVER) {
            this.gameInstance.triggerShield();
            this.btnTriggerShield.classList.add("pressed");
          }
        });
        this.btnTriggerShield.addEventListener("pointerup", () => this.btnTriggerShield.classList.remove("pressed"));
        this.btnTriggerShield.addEventListener("pointercancel", () => this.btnTriggerShield.classList.remove("pressed"));
        this.btnTriggerShield.addEventListener("pointerleave", () => this.btnTriggerShield.classList.remove("pressed"));
      }
      if (this.btnTriggerFire) {
        this.btnTriggerFire.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) {
            doRestart();
          } else {
            this.gameInstance.shoot();
            this.btnTriggerFire.classList.add("pressed");
          }
        });
        this.btnTriggerFire.addEventListener("pointerup", () => this.btnTriggerFire.classList.remove("pressed"));
        this.btnTriggerFire.addEventListener("pointercancel", () => this.btnTriggerFire.classList.remove("pressed"));
      }
    }
  };
  function boot() {
    new SpaceDestroyer2App();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
