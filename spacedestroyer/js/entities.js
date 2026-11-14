/**
 * Space Destroyer Entities Module
 * Invaders, Invader Fleet Matrix, Player Laser Cannon, Destructible Bunkers,
 * Alien Bombs, Laser Bullets, and Mystery Mothership UFO.
 */

import { sound } from './audio.js';

export const INVADER_CONFIGS = {
  squid: {
    type: 'squid',
    name: 'COMMANDER SQUID',
    points: 30,
    width: 28,
    height: 22,
    color: '#f43f5e', // Neon crimson
    glow: 'rgba(244, 63, 94, 0.4)'
  },
  crab: {
    type: 'crab',
    name: 'WARRIOR CRAB',
    points: 20,
    width: 32,
    height: 22,
    color: '#38bdf8', // Neon cyan
    glow: 'rgba(56, 189, 248, 0.4)'
  },
  octopus: {
    type: 'octopus',
    name: 'SCOUT OCTOPUS',
    points: 10,
    width: 34,
    height: 22,
    color: '#34d399', // Emerald phosphor
    glow: 'rgba(52, 211, 153, 0.4)'
  }
};

export class Invader {
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
    // Explode debris
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
      // Draw death particle fragments
      for (const p of this.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.config.color;
    ctx.shadowColor = this.config.glow;
    ctx.shadowBlur = 6;

    // Draw authentic pixelated arcade invader based on type and 2-frame toggle
    if (this.type === 'squid') {
      this.renderSquid(ctx, frame);
    } else if (this.type === 'crab') {
      this.renderCrab(ctx, frame);
    } else {
      this.renderOctopus(ctx, frame);
    }

    ctx.restore();
  }

  renderSquid(ctx, frame) {
    const s = 2.4; // pixel scaling
    // 8-bit Commander Squid layout
    // Head / Dome
    ctx.fillRect(4 * s, 0, 4 * s, 2 * s);
    ctx.fillRect(3 * s, 2 * s, 6 * s, 2 * s);
    ctx.fillRect(2 * s, 4 * s, 8 * s, 2 * s);
    // Eyes
    ctx.fillRect(1 * s, 6 * s, 2 * s, 2 * s);
    ctx.fillRect(5 * s, 6 * s, 2 * s, 2 * s);
    ctx.fillRect(9 * s, 6 * s, 2 * s, 2 * s);

    // Tentacles (Frame A vs B)
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
    // 8-bit Warrior Crab
    // Eyes & Upper carapace
    ctx.fillRect(2 * s, 0, 2 * s, 2 * s);
    ctx.fillRect(9 * s, 0, 2 * s, 2 * s);
    ctx.fillRect(3 * s, 2 * s, 7 * s, 2 * s);
    ctx.fillRect(1 * s, 4 * s, 11 * s, 2 * s);

    // Midsection
    ctx.fillRect(0, 6 * s, 13 * s, 2 * s);
    ctx.fillRect(3 * s, 8 * s, 7 * s, 1.5 * s);

    // Claws & Legs (Frame A vs B)
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
    // 8-bit Scout Octopus
    ctx.fillRect(4 * s, 0, 6 * s, 2 * s);
    ctx.fillRect(1 * s, 2 * s, 12 * s, 2 * s);
    ctx.fillRect(0, 4 * s, 14 * s, 2 * s);
    // Body & mouth
    ctx.fillRect(0, 6 * s, 3 * s, 2 * s);
    ctx.fillRect(5 * s, 6 * s, 4 * s, 2 * s);
    ctx.fillRect(11 * s, 6 * s, 3 * s, 2 * s);

    // Kicking Tentacles (Frame A vs B)
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
}

export class Fleet {
  constructor(wave = 1, canvasWidth = 800) {
    this.wave = wave;
    this.canvasWidth = canvasWidth;
    this.rows = 5;
    this.cols = 11;
    this.totalInvaders = this.rows * this.cols; // 55

    this.invaders = [];
    this.direction = 1; // 1 = right, -1 = left
    this.stepSizeX = 14;
    this.dropDistance = 18;

    this.stepTimer = 0;
    this.marchIndex = 0;
    this.animFrame = 0;

    // Bomb dropping
    this.bombCooldown = 1.2;
    this.bombTimer = this.bombCooldown;

    this.initGrid();
  }

  initGrid() {
    this.invaders = [];
    const startX = 60;
    // Each wave starts slightly lower on screen (wave 1: Y=90, wave 2: Y=110, capped at Y=180)
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
    return this.invaders.filter(inv => inv.alive).length;
  }

  getStepInterval() {
    // Progressive cadence scaling: as alive count drops, step interval drops steeply!
    const alive = this.getAliveCount();
    const ratio = alive / this.totalInvaders;
    // Wave bonus: later waves are inherently faster
    const waveBonus = Math.min(0.2, (this.wave - 1) * 0.04);
    // Base step interval scales from ~0.75s down to 0.065s when 1 invader remains
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
    // 1. Update dying invader particle debris
    for (const inv of this.invaders) {
      inv.update(dt);
    }

    const alive = this.getAliveCount();
    if (alive === 0) return;

    // 2. Stepping March Loop
    this.stepTimer += dt;
    const interval = this.getStepInterval();

    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.stepFleet();
    }

    // 3. Alien Bomb Dropping
    this.bombTimer -= dt;
    if (this.bombTimer <= 0) {
      this.bombTimer = Math.max(0.6, 2.0 * (alive / this.totalInvaders) + Math.random() * 0.8);
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

    // Play marching beat & toggle 2-frame animation
    sound.march(this.marchIndex % 4);
    this.marchIndex++;
    this.animFrame = 1 - this.animFrame;
  }

  dropBomb(onBombDrop) {
    // Collect bottom-most alive invader per column
    const bottomByCol = new Map();
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
}

export class LaserCannon {
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
        color: ['#22c55e', '#fde047', '#ffffff', '#ef4444'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4
      });
    }
  }

  update(dt, moveInput = 0) {
    if (this.alive) {
      this.x += moveInput * this.speed * dt;
      // Clamp inside screen margins
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
      ctx.globalAlpha = 1.0;
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    // Neon armored cannon chassis
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#22c55e';

    // Base body
    ctx.fillRect(2, 12, this.width - 4, 12);
    // Upper turret cabin
    ctx.fillRect(10, 6, this.width - 20, 6);
    // Center muzzle barrel
    ctx.fillRect(this.width / 2 - 2, 0, 4, 6);

    // Accent warning stripe
    ctx.fillStyle = '#facc15';
    ctx.fillRect(8, 16, this.width - 16, 3);

    ctx.restore();
  }
}

export class Bunker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.cellSize = 6;
    this.rows = 7;
    this.cols = 10;
    this.width = this.cols * this.cellSize; // 60px
    this.height = this.rows * this.cellSize; // 42px

    // Arch-shaped bunker layout (1 = solid, 0 = empty)
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
    // Fast AABB pre-check
    if (
      px < this.x - radius ||
      px > this.x + this.width + radius ||
      py < this.y - radius ||
      py > this.y + this.height + radius
    ) {
      return false;
    }

    let hit = false;
    // Check and erode cells within crater radius
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.cells[r][c] === 1) {
          const cx = this.x + c * this.cellSize + this.cellSize / 2;
          const cy = this.y + r * this.cellSize + this.cellSize / 2;
          const dist = Math.hypot(px - cx, py - cy);
          if (dist <= radius) {
            this.cells[r][c] = 0; // Destroy cell
            hit = true;
          }
        }
      }
    }

    return hit;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#22c55e'; // Classic phosphor green
    ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
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
}

export class Bullet {
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
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.restore();
  }
}

export class AlienBomb {
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
    // Squiggly horizontal wobble
    this.x += Math.sin(this.tick * 16) * 1.2;
    if (this.y > 650) {
      this.active = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 6;
    // Zigzag bomb rendering
    const h = this.height;
    ctx.fillRect(this.x - 2, this.y, 4, 4);
    ctx.fillRect(this.x - (Math.floor(this.tick * 12) % 2 === 0 ? 3 : -1), this.y + 4, 4, 4);
    ctx.fillRect(this.x - 2, this.y + 8, 4, 4);
    ctx.restore();
  }
}

export class MysteryShip {
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
    if (
      (this.direction > 0 && this.x > this.canvasWidth + 60) ||
      (this.direction < 0 && this.x < -this.width - 60)
    ) {
      this.active = false;
      sound.stopUfo();
      this.spawnTimer = 25 + Math.random() * 15;
    }

    // Update death particles
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

    // Pick retro mystery score: 50, 100, 150, or 300 pts
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
        color: ['#f43f5e', '#facc15', '#ffffff'][Math.floor(Math.random() * 3)],
        size: 3 + Math.random() * 4
      });
    }

    return points;
  }

  render(ctx) {
    // Draw debris
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 10;

    // Authentic retro Mothership Flying Saucer vector
    // Dome
    ctx.fillRect(16, 0, 16, 5);
    // Upper hull
    ctx.fillRect(8, 5, 32, 6);
    // Main disc
    ctx.fillRect(0, 11, 48, 6);
    // Underside nozzles & thrusters
    ctx.fillStyle = '#facc15';
    ctx.fillRect(6, 17, 6, 3);
    ctx.fillRect(21, 17, 6, 3);
    ctx.fillRect(36, 17, 6, 3);

    ctx.restore();
  }
}
