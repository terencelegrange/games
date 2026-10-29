/**
 * Goodies and Baddies Arsenal & Projectiles
 * Implements Lance, Dagger, and Ground-Igniting Holy Torch.
 */

import { GRAVITY } from './physics.js';

export const WEAPON_TYPES = {
  LANCE: {
    id: 'lance',
    name: 'STEEL LANCE',
    icon: '🗡️',
    speed: 480,
    maxActive: 2,
    gravity: 0,
    damage: 1
  },
  DAGGER: {
    id: 'dagger',
    name: 'FLYING DAGGER',
    icon: '🔪',
    speed: 580,
    maxActive: 3,
    gravity: 0,
    damage: 1
  },
  TORCH: {
    id: 'torch',
    name: 'HOLY TORCH',
    icon: '🔥',
    speed: 260,
    maxActive: 2,
    gravity: 600,
    damage: 1
  }
};

export class Projectile {
  constructor({ x, y, facingRight, type = 'lance' }) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.facingRight = facingRight;
    this.type = type;
    this.active = true;

    const def = WEAPON_TYPES[type.toUpperCase()] || WEAPON_TYPES.LANCE;
    this.speed = def.speed;
    this.gravity = def.gravity;
    this.damage = def.damage;

    this.vx = (facingRight ? 1 : -1) * this.speed;
    this.vy = type === 'torch' ? -180 : 0;
    this.radius = type === 'dagger' ? 4 : (type === 'torch' ? 7 : 6);
    this.width = type === 'lance' ? 24 : 12;
    this.height = type === 'lance' ? 8 : 10;

    // For torch ignition
    this.isIgnited = false;
    this.burnTimer = 0;
    this.maxBurnTime = 1.4; // Seconds flame lingers on ground
    this.rotation = 0;
  }

  update(dt, platforms = [], cameraX = null) {
    if (!this.active) return;

    if (this.isIgnited) {
      this.burnTimer += dt;
      if (this.burnTimer >= this.maxBurnTime) {
        this.active = false;
      }
      return;
    }

    // Apply movement
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.type === 'torch') {
      this.rotation += (this.facingRight ? 1 : -1) * 14 * dt;

      // Check collision with solid ground / platforms to ignite
      for (const p of platforms) {
        if (
          this.x >= p.x &&
          this.x <= p.x + p.width &&
          this.y + this.radius >= p.y &&
          this.y - this.radius <= p.y + 12 &&
          this.vy > 0
        ) {
          // Ignite holy blue-orange fire on the ground!
          this.isIgnited = true;
          this.vx = 0;
          this.vy = 0;
          this.y = p.y - 12; // Sit right on top of platform
          this.width = 28;
          this.height = 24;
          return;
        }
      }
    }

    // Despawn if traveled off screen or beyond world bounds
    if (cameraX !== null) {
      if (this.x < cameraX - 60 || this.x > cameraX + 860 || this.y > 550) {
        this.active = false;
      }
    } else if (Math.abs(this.x - this.startX) > 850 || this.y > 550) {
      this.active = false;
    }
  }

  render(ctx, cameraX) {
    if (!this.active) return;

    const screenX = Math.round(this.x - cameraX);
    const screenY = Math.round(this.y);

    ctx.save();

    if (this.isIgnited) {
      // Render flickering Holy Fire on the ground
      const flicker = (Math.sin(performance.now() * 0.02) + 1) * 0.5;
      const h = 18 + flicker * 8;
      
      // Outer blue-orange flame
      const grad = ctx.createLinearGradient(screenX, screenY - h, screenX, screenY);
      grad.addColorStop(0, '#ffff55'); // Yellow core
      grad.addColorStop(0.4, '#f97316'); // Orange body
      grad.addColorStop(1, '#38bdf8'); // Blue mystic base

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(screenX - 12, screenY);
      ctx.quadraticCurveTo(screenX - 8, screenY - h, screenX, screenY - h - 4);
      ctx.quadraticCurveTo(screenX + 8, screenY - h, screenX + 12, screenY);
      ctx.closePath();
      ctx.fill();

      // Spark particles
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(screenX + (Math.random() * 14 - 7), screenY - h + (Math.random() * 8), 2, 2);
    } else if (this.type === 'lance') {
      // Classic silver javelin / lance
      ctx.translate(screenX, screenY);
      if (!this.facingRight) ctx.scale(-1, 1);

      // Shaft
      ctx.fillStyle = '#b45309'; // Wood brown
      ctx.fillRect(-12, -2, 20, 4);

      // Steel Tip
      ctx.fillStyle = '#e2e8f0'; // Bright steel
      ctx.beginPath();
      ctx.moveTo(8, -4);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();

      // Gleam
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(9, -1, 3, 2);
    } else if (this.type === 'dagger') {
      // Rapid flying dagger
      ctx.translate(screenX, screenY);
      if (!this.facingRight) ctx.scale(-1, 1);

      // Blade
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(8, 0);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fill();

      // Hilt
      ctx.fillStyle = '#eab308'; // Gold hilt
      ctx.fillRect(-8, -4, 3, 8);
    } else if (this.type === 'torch') {
      // Spinning torch
      ctx.translate(screenX, screenY);
      ctx.rotate(this.rotation);

      // Handle
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -2, 16, 4);

      // Flame tip
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(8, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(8, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Dropped Items: Weapon Urns & Armor Restore Chests
 */
export class ItemDrop {
  constructor({ x, y, type = 'weapon', weaponType = 'dagger' }) {
    this.x = x;
    this.y = y;
    this.type = type; // 'weapon', 'armor', 'score'
    this.weaponType = weaponType; // 'dagger', 'torch', 'lance'
    this.width = 20;
    this.height = 20;
    this.vy = -120; // Slight upward pop upon drop
    this.active = true;
    this.life = 12.0; // Despawns after 12s
    this.groundY = y;
    this.bobTick = 0;
  }

  update(dt, platforms = []) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.bobTick += dt;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;

    // Land on platforms
    for (const p of platforms) {
      if (
        this.x + this.width > p.x &&
        this.x < p.x + p.width &&
        this.y + this.height >= p.y &&
        this.y + this.height <= p.y + 16 &&
        this.vy > 0
      ) {
        this.y = p.y - this.height;
        this.vy = 0;
        break;
      }
    }
  }

  render(ctx, cameraX) {
    if (!this.active) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);

    ctx.save();
    if (this.type === 'armor') {
      // Golden Armor Chest
      ctx.fillStyle = '#eab308';
      ctx.fillRect(sx, sy + 4, 20, 14);
      ctx.fillStyle = '#ca8a04';
      ctx.strokeRect(sx, sy + 4, 20, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sx + 8, sy + 8, 4, 5); // Gem lock
    } else {
      // Classic ancient ceramic Urn/Pot
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx + 2, sy + 4, 16, 14);
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 4, sy + 1, 12, 3); // Urn lip

      // Weapon icon mini badge above pot
      ctx.fillStyle = '#ffff55';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const icon = this.weaponType === 'dagger' ? '🔪' : (this.weaponType === 'torch' ? '🔥' : '🗡️');
      ctx.fillText(icon, sx + 10, sy - 2);
    }
    ctx.restore();
  }
}
