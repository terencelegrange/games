/**
 * Space Destroyer II Entities Module
 * Invaders, Invader Fleet Matrix, Multi-Tier Laser Cannon, Destructible Bunkers,
 * Alien Bombs, Multi-Trajectory Lasers, Mystery Mothership, and Falling Power-Up Pods.
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

export const WEAPON_TIERS = [
  { tier: 0, id: 'single', name: 'SINGLE LASER', color: '#22c55e', glow: '#4ade80' },
  { tier: 1, id: 'dual', name: 'DUAL PARALLEL', color: '#06b6d4', glow: '#38bdf8' },
  { tier: 2, id: 'vspread', name: 'V-SPREAD TWIN', color: '#f59e0b', glow: '#fcd34d' },
  { tier: 3, id: 'triple', name: 'TRIPLE V-CANNON', color: '#ec4899', glow: '#f472b6' },
  { tier: 4, id: 'warhead', name: 'MEGA WARHEAD', color: '#a855f7', glow: '#c084fc' },
  { tier: 5, id: 'shield', name: 'FORCE SHIELD', color: '#06b6d4', glow: '#67e8f9' }
];

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
      ctx.globalAlpha = 1.0;
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.config.color;
    ctx.shadowColor = this.config.glow;
    ctx.shadowBlur = 6;

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
}

export class Fleet {
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
    return this.invaders.filter(inv => inv.alive).length;
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

    // Weapon upgrade tier (0 = Single, 1 = Dual Parallel, 2 = V-Spread, 3 = Triple, 4 = Warhead, 5 = Shield)
    this.weaponTier = 0;

    // Force Shield Protection System
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.maxShieldTime = 6.0;
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

  activateShield(duration = 6.0) {
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
        color: ['#06b6d4', '#67e8f9', '#ffffff', '#a5f3fc'][Math.floor(Math.random() * 4)],
        size: 2.5 + Math.random() * 2.5
      });
    }
  }

  upgradeWeapon() {
    if (this.weaponTier < 5) {
      this.weaponTier++;
      if (this.weaponTier === 5) {
        this.activateShield(6.0);
      }
      return { upgraded: true, tier: this.weaponTier, config: WEAPON_TIERS[this.weaponTier] };
    }
    // Already at Tier 5 max power - recharge shield
    this.activateShield(6.0);
    return { upgraded: false, tier: this.weaponTier, config: WEAPON_TIERS[5], shieldRefill: true };
  }

  demoteWeapon() {
    // When hit, gracefully step down 1 tier
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
        color: ['#06b6d4', '#facc15', '#ffffff', '#ef4444'][Math.floor(Math.random() * 4)],
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

      // Update Shield Timer & Rotation
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

    // Update deflection spark particles
    for (let i = this.shieldSparks.length - 1; i >= 0; i--) {
      const sp = this.shieldSparks[i];
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life <= 0) this.shieldSparks.splice(i, 1);
    }
  }

  render(ctx) {
    // 1. Render deflection sparks
    for (const sp of this.shieldSparks) {
      const alpha = Math.max(0, sp.life / sp.maxLife);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(sp.x, sp.y, sp.size, sp.size);
    }
    ctx.globalAlpha = 1.0;

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

    const tierCfg = WEAPON_TIERS[this.weaponTier] || WEAPON_TIERS[0];

    // Neon armored cannon chassis with accent glow corresponding to weapon tier
    ctx.shadowColor = tierCfg.glow;
    ctx.shadowBlur = 8;
    ctx.fillStyle = tierCfg.color;

    // Base body
    ctx.fillRect(2, 12, this.width - 4, 12);
    // Upper turret cabin
    ctx.fillRect(10, 6, this.width - 20, 6);

    // Dynamic Barrels based on weaponTier
    if (this.weaponTier === 0) {
      // Single central muzzle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.width / 2 - 2, 0, 4, 6);
    } else if (this.weaponTier === 1) {
      // Dual parallel wing barrels
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, 0, 4, 8);
      ctx.fillRect(this.width - 10, 0, 4, 8);
    } else if (this.weaponTier === 2) {
      // V-Spread angled wing mounts
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(4, 1, 4, 7);
      ctx.fillRect(this.width - 8, 1, 4, 7);
      // Small angled fins
      ctx.fillRect(0, 8, 4, 4);
      ctx.fillRect(this.width - 4, 8, 4, 4);
    } else if (this.weaponTier === 3) {
      // Triple Cannon: Center + Dual V wings
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(this.width / 2 - 2, -2, 4, 8);
      ctx.fillRect(4, 0, 4, 8);
      ctx.fillRect(this.width - 8, 0, 4, 8);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 6, 4, 6);
      ctx.fillRect(this.width - 4, 6, 4, 6);
    } else {
      // Tier 4 & 5: Heavy Central Warhead Mortar Launcher
      ctx.fillStyle = this.weaponTier === 5 ? '#38bdf8' : '#c084fc';
      ctx.fillRect(this.width / 2 - 5, -4, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.width / 2 - 3, -4, 6, 3);
      // Heavy armored shoulder pads
      ctx.fillStyle = this.weaponTier === 5 ? '#06b6d4' : '#a855f7';
      ctx.fillRect(0, 4, 6, 8);
      ctx.fillRect(this.width - 6, 4, 6, 8);
    }

    // Accent warning stripe
    ctx.fillStyle = '#facc15';
    ctx.fillRect(8, 16, this.width - 16, 3);

    ctx.restore();

    // 2. Render Force Shield Dome around Cannon
    if (this.shieldActive) {
      ctx.save();
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const radius = 34;

      // Pulse rate accelerates when remaining shield time is low (< 1.8s)
      const warning = this.shieldTimer < 1.8;
      const pulseSpeed = warning ? 16 : 6;
      const pulse = 0.75 + Math.sin(performance.now() * 0.001 * pulseSpeed) * 0.25;

      // Outer forcefield glow aura
      ctx.shadowColor = warning ? '#f59e0b' : '#38bdf8';
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeStyle = warning ? `rgba(245, 158, 11, ${0.85 * pulse})` : `rgba(6, 182, 212, ${0.9 * pulse})`;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Translucent protective energy sphere fill
      ctx.fillStyle = warning
        ? `rgba(245, 158, 11, ${0.16 * pulse})`
        : `rgba(6, 182, 212, ${0.2 * pulse})`;
      ctx.fill();

      // Rotating orbital magnetic arcs
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, this.shieldAngle, this.shieldAngle + Math.PI * 0.65);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, this.shieldAngle + Math.PI, this.shieldAngle + Math.PI * 1.65);
      ctx.stroke();

      // Inner high-frequency energy core
      ctx.strokeStyle = warning ? '#fef08a' : '#a5f3fc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 8, -this.shieldAngle * 1.5, -this.shieldAngle * 1.5 + Math.PI * 0.8);
      ctx.stroke();

      ctx.restore();
    }
  }
}

export class Bunker {
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
    if (
      px < this.x - radius ||
      px > this.x + this.width + radius ||
      py < this.y - radius ||
      py > this.y + this.height + radius
    ) {
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
    ctx.fillStyle = '#06b6d4'; // Cyber cyan bunker in V2
    ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
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
  constructor(x, y, vy = -560, vx = 0, color = '#fde047', glow = '#facc15') {
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
}

export class MegaExplosion {
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
        color: ['#a855f7', '#c084fc', '#f59e0b', '#ffffff', '#38bdf8'][Math.floor(Math.random() * 5)],
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
    const radius = this.maxRadius * Math.sin((progress * Math.PI) / 2);
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer plasma shockwave ring
    ctx.strokeStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner fiery core ring
    ctx.strokeStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Flash core
    if (progress < 0.35) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress / 0.35)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render debris particles
    for (const p of this.particles) {
      const pAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = pAlpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    ctx.restore();
  }
}

export class MegaBullet {
  constructor(x, y, vy = -460, detonateY = 300) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = vy;
    this.width = 12;
    this.height = 24;
    this.color = '#c084fc';
    this.glow = '#a855f7';
    this.active = true;
    this.isMega = true;
    this.detonated = false;
    this.exploded = false;
    this.detonateY = detonateY; // Explodes halfway up the level (y = 300)
    this.blastRadius = 90; // Encompasses ~6 enemies in formation (improved damage)
    this.maxTargets = 6; // 4 original + 2 additional blocks = 6 blocks
    this.tick = 0;
    this.trailParticles = [];
  }

  update(dt) {
    this.tick += dt;
    this.y += this.vy * dt;

    // Rocket exhaust flame trail
    if (Math.random() < 0.8) {
      this.trailParticles.push({
        x: this.x + (Math.random() * 6 - 3),
        y: this.y + this.height,
        vx: (Math.random() - 0.5) * 20,
        vy: 40 + Math.random() * 60,
        life: 0.25,
        maxLife: 0.25,
        color: ['#f59e0b', '#ec4899', '#c084fc'][Math.floor(Math.random() * 3)],
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

    // Check if reached halfway point
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

    // Trigger visual shockwave explosion
    if (game.explosions) {
      game.explosions.push(new MegaExplosion(this.x, this.y, this.blastRadius));
    }

    // Play sound if available
    if (sound.warheadDetonate) {
      sound.warheadDetonate();
    }

    // Destroy up to 6 enemies in blast radius (improved from 4 to 6 blocks)
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

    // Check Mystery Ship within blast radius
    if (game.mysteryShip?.active) {
      const ufo = game.mysteryShip;
      const ux = ufo.x + ufo.width / 2;
      const uy = ufo.y + ufo.height / 2;
      if (Math.hypot(this.x - ux, this.y - uy) <= this.blastRadius + 20) {
        const { points, pod } = ufo.onHit();
        game.totalHits++;
        game.score += points;
        game.addFloatingScore(`★ +${points} ★`, ux, uy - 10, '#ec4899');
        if (pod && game.powerUpPods) game.powerUpPods.push(pod);
        if (game.options?.onScore) game.options.onScore(game.score);
      }
    }

    // Erode any bunker cells within blast radius
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
    ctx.globalAlpha = 1.0;

    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 14;

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, 0, this.width, this.height);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-this.width / 2 - 4, this.height - 8, 4, 8);
    ctx.fillRect(this.width / 2, this.height - 8, 4, 8);

    const coreAlpha = 0.6 + Math.sin(this.tick * 20) * 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`;
    ctx.fillRect(-2, 4, 4, 10);

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
    ctx.fillRect(this.x - 2, this.y, 4, 4);
    ctx.fillRect(this.x - (Math.floor(this.tick * 12) % 2 === 0 ? 3 : -1), this.y + 4, 4, 4);
    ctx.fillRect(this.x - 2, this.y + 8, 4, 4);
    ctx.restore();
  }
}

/**
 * Falling Power-Up Pod dropped from destroyed mystery spaceships.
 * Drifts downward toward player cannon.
 */
export class PowerUpPod {
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
    // Gentle gentle floating drift
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

    // Glowing cyber pod orb
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    // Outer octagonal capsule
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Power-up Icon: Glowing 'P' symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 0, 0);

    ctx.restore();
  }
}

/**
 * Collectible Force Shield item that spawns in each level.
 * Drifts downward, hovers near defensive baseline, and on collection
 * provides 5.0 seconds of damage immunity for the Laser Cannon.
 */
export class ShieldItem {
  constructor(x, y = 50, duration = 5.0) {
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
      this.x += Math.sin(this.tick * 3.0) * 0.9;
    } else {
      // Hover across bottom defense trench so player has ample opportunity to collect
      this.y = 540;
      this.x += Math.sin(this.tick * 2.0) * 35 * dt;
    }
    this.x = Math.max(20, Math.min(760, this.x));
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    const pulse = 0.88 + Math.sin(this.tick * 7) * 0.12;
    ctx.scale(pulse, pulse);

    // Glowing cyan/electric blue shield aura
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;

    // Outer protective forcefield sphere
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating orbital magnetic arc
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15, this.tick * 4, this.tick * 4 + Math.PI * 0.7);
    ctx.stroke();

    // Shield Emblem: Glowing 'S'
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, 0);

    ctx.restore();
  }
}

/**
 * Mystery Mothership UFO:
 * 2x as many spaceships, with an early first spawn (4-7s into the round).
 * Drops a PowerUpPod upon defeat!
 */
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

    // 2x frequency: first spawn early in round (4-7 seconds)
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
    if (
      (this.direction > 0 && this.x > this.canvasWidth + 60) ||
      (this.direction < 0 && this.x < -this.width - 60)
    ) {
      this.active = false;
      sound.stopUfo();
      // Subsequent spawn interval: 10 - 15s (2x as frequent as original 25-40s)
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
    // Subsequent spawn interval: 11 - 16s (2x as frequent)
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
        color: ['#06b6d4', '#facc15', '#ec4899', '#ffffff'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4
      });
    }

    // Always drop a power-up pod from the mystery ship!
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
    ctx.globalAlpha = 1.0;

    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#ec4899'; // Cyber magenta Mothership in V2
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 10;

    // Authentic retro Mothership Flying Saucer vector
    ctx.fillRect(16, 0, 16, 5);
    ctx.fillRect(8, 5, 32, 6);
    ctx.fillRect(0, 11, 48, 6);

    // Underside nozzles & thrusters
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, 17, 6, 3);
    ctx.fillRect(21, 17, 6, 3);
    ctx.fillRect(36, 17, 6, 3);

    ctx.restore();
  }
}
