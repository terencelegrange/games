(() => {
  // spacedestroyer/js/audio.js
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
    // 2. Player Laser Shot
    laser() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
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
    }
    // 3. Invader Destroyed Explosion
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
    // 4. Bunker Erosion Hit
    bunkerHit() {
      if (!this.enabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
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
      filter.type = "lowpass";
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
        this.ufoOsc.type = "sawtooth";
        this.ufoOsc.frequency.setValueAtTime(480, now);
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
        } catch (_) {
        }
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
        osc.type = "square";
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
      const notes = [261.6, 329.6, 392, 523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.08;
        osc.type = "triangle";
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
      const notes = [392, 349.2, 311.1, 261.6];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + i * 0.22;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.28, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    }
  };
  var sound = new SoundController();

  // spacedestroyer/js/entities.js
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
      this.bombCooldown = 1.2;
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
      const interval = Math.max(0.065, 0.75 * Math.pow(ratio, 0.85) - waveBonus);
      return interval;
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
        this.bombTimer = Math.max(0.6, 2 * (alive / this.totalInvaders) + Math.random() * 0.8);
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
      this.alive = true;
      this.deathTimer = 0;
      this.respawnTimer = 0;
      this.particles = [];
    }
    reset() {
      this.x = this.canvasWidth / 2 - this.width / 2;
      this.alive = true;
      this.deathTimer = 0;
      this.particles = [];
    }
    destroy() {
      this.alive = false;
      this.deathTimer = 1.2;
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
          color: ["#22c55e", "#fde047", "#ffffff", "#ef4444"][Math.floor(Math.random() * 4)],
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
    }
    render(ctx) {
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
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(2, 12, this.width - 4, 12);
      ctx.fillRect(10, 6, this.width - 20, 6);
      ctx.fillRect(this.width / 2 - 2, 0, 4, 6);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(8, 16, this.width - 16, 3);
      ctx.restore();
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
    // Hit test against projectile (player laser or alien bomb)
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
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "rgba(34, 197, 94, 0.4)";
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
    constructor(x, y, vy = -560) {
      this.x = x;
      this.y = y;
      this.width = 3.5;
      this.height = 14;
      this.vy = vy;
      this.active = true;
    }
    update(dt) {
      this.y += this.vy * dt;
      if (this.y < -20 || this.y > 650) {
        this.active = false;
      }
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 8;
      ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
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
      const h = this.height;
      ctx.fillRect(this.x - 2, this.y, 4, 4);
      ctx.fillRect(this.x - (Math.floor(this.tick * 12) % 2 === 0 ? 3 : -1), this.y + 4, 4, 4);
      ctx.fillRect(this.x - 2, this.y + 8, 4, 4);
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
      this.spawnTimer = 22 + Math.random() * 12;
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
        this.spawnTimer = 25 + Math.random() * 15;
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
      this.spawnTimer = 28 + Math.random() * 15;
      const scores = [50, 100, 150, 300];
      const points = scores[Math.floor(Math.random() * scores.length)];
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        this.particles.push({
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.6,
          maxLife: 0.6,
          color: ["#f43f5e", "#facc15", "#ffffff"][Math.floor(Math.random() * 3)],
          size: 3 + Math.random() * 4
        });
      }
      return points;
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
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 10;
      ctx.fillRect(16, 0, 16, 5);
      ctx.fillRect(8, 5, 32, 6);
      ctx.fillRect(0, 11, 48, 6);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(6, 17, 6, 3);
      ctx.fillRect(21, 17, 6, 3);
      ctx.fillRect(36, 17, 6, 3);
      ctx.restore();
    }
  };

  // spacedestroyer/js/game.js
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
          size: Math.random() < 0.2 ? 2 : 1,
          speed: 10 + Math.random() * 35,
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
      this.floatingScores = [];
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
      this.initGameWorld();
      this.start();
    }
    setMoveLeft(val) {
      this.keys.left = Boolean(val);
    }
    setMoveRight(val) {
      this.keys.right = Boolean(val);
    }
    shoot() {
      if (this.state === STATES.ROUND_START) {
        this.state = STATES.PLAYING;
        this.roundStartTimer = 0;
      }
      if (this.state !== STATES.PLAYING || !this.cannon.alive) return;
      this.totalShots++;
      const bx = this.cannon.x + this.cannon.width / 2;
      const by = this.cannon.y - 8;
      this.playerBullets.push(new Bullet(bx, by, -560));
      sound.laser();
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
        life: 0.85
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
      this.mysteryShip = new MysteryShip(this.width);
      this.cannon.reset();
      this.initBunkers();
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      if (this.options.onWave) this.options.onWave(this.wave);
      if (this.options.onInvaders) {
        this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
      }
    }
    handlePlayerDeath() {
      this.lives--;
      this.cannon.destroy();
      if (this.options.onLives) this.options.onLives(this.lives);
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
      for (let i = this.playerBullets.length - 1; i >= 0; i--) {
        const b = this.playerBullets[i];
        b.update(dt);
        let bulletConsumed = false;
        for (const inv of this.fleet.invaders) {
          if (inv.alive && b.x >= inv.x && b.x <= inv.x + inv.width && b.y >= inv.y && b.y <= inv.y + inv.height) {
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
        if (!bulletConsumed && this.mysteryShip.active) {
          const ufo = this.mysteryShip;
          if (b.x >= ufo.x && b.x <= ufo.x + ufo.width && b.y >= ufo.y && b.y <= ufo.y + ufo.height) {
            const pts = ufo.onHit();
            this.totalHits++;
            this.score += pts;
            this.addFloatingScore(`\u2605 +${pts} \u2605`, ufo.x + ufo.width / 2, ufo.y - 10, "#facc15");
            if (this.options.onScore) this.options.onScore(this.score);
            bulletConsumed = true;
          }
        }
        if (!bulletConsumed) {
          for (const bk of this.bunkers) {
            if (bk.checkHit(b.x, b.y, 6)) {
              sound.bunkerHit();
              bulletConsumed = true;
              break;
            }
          }
        }
        if (bulletConsumed || !b.active) {
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
          if (bomb.x >= c.x && bomb.x <= c.x + c.width && bomb.y >= c.y && bomb.y <= c.y + c.height) {
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
        f.alpha = Math.max(0, f.life / 0.85);
        if (f.life <= 0) this.floatingScores.splice(i, 1);
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
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.height - 24);
      ctx.lineTo(this.width, this.height - 24);
      ctx.stroke();
      for (const f of this.floatingScores) {
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 6;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      if (this.state === STATES.ROUND_START) {
        this.renderRoundStartOverlay(ctx);
      } else if (this.state === STATES.WAVE_CLEAR) {
        this.renderWaveClearOverlay(ctx);
      } else if (this.state === STATES.PAUSED) {
        this.renderPausedOverlay(ctx);
      }
      ctx.restore();
    }
    renderRoundStartOverlay(ctx) {
      const seconds = Math.max(1, Math.ceil(this.roundStartTimer));
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 200, this.width, 180);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(this.width, 200);
      ctx.moveTo(0, 380);
      ctx.lineTo(this.width, 380);
      ctx.stroke();
      ctx.fillStyle = "#38bdf8";
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 10;
      ctx.fillText(`\u2605 WAVE ${this.wave} \u2605`, this.width / 2, 245);
      ctx.fillStyle = "#ffffff";
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText("ALIEN FLEET DESCENDING...", this.width / 2, 285);
      ctx.fillStyle = "#facc15";
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillText(`GET READY! ${seconds}`, this.width / 2, 335);
      ctx.restore();
    }
    renderWaveClearOverlay(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 210, this.width, 160);
      ctx.fillStyle = "#34d399";
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.shadowColor = "#059669";
      ctx.shadowBlur = 12;
      ctx.fillText(`\u2605 WAVE ${this.wave} CLEARED! \u2605`, this.width / 2, 270);
      ctx.fillStyle = "#facc15";
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText("INCOMING REINFORCEMENTS FASTER & LOWER!", this.width / 2, 320);
      ctx.restore();
    }
    renderPausedOverlay(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#facc15";
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", this.width / 2, 280);
      ctx.fillStyle = "#ffffff";
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText("PRESS P TO RESUME", this.width / 2, 320);
      ctx.restore();
    }
  };

  // spacedestroyer/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
    getHighScore(gameId = "spacedestroyer") {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
        return val ? parseInt(val, 10) : 0;
      } catch {
        return 0;
      }
    },
    setHighScore(gameId = "spacedestroyer", score) {
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

  // spacedestroyer/js/main.js
  var SpaceDestroyerApp = class {
    constructor() {
      this.gameId = "spacedestroyer";
      this.gameInstance = null;
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
      this.hudHighScore = document.getElementById("hud-high-score");
      this.floatingBanner = document.getElementById("floating-banner");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.btnMoveLeft = document.getElementById("btn-move-left");
      this.btnMoveRight = document.getElementById("btn-move-right");
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
        gameId: "spacedestroyer",
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
      this.fireKeyDown = false;
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
    new SpaceDestroyerApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
