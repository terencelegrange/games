/**
 * Goodies and Baddies Enemy Hierarchy & Level 1 Boss
 * Implements Zombie, Flying Bat, Red Arremer (Firebrand), Plant Spitter,
 * and the iconic Cyclops (Unicorn) boss.
 */

import { checkAABB, checkCircleCircle, GRAVITY } from './physics.js';
import { ItemDrop } from './weapons.js';

export class Enemy {
  constructor({ x, y, type = 'zombie', facingRight = false }) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.type = type;
    this.facingRight = facingRight;
    this.active = true;
    this.hp = 1;
    this.points = 100;
    this.width = 24;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.animTick = 0;
    this.hitFlash = 0;

    // Type-specific initializations
    if (type === 'zombie') {
      this.hp = 1;
      this.points = 100;
      this.width = 20;
      this.height = 32;
      this.state = 'EMERGING'; // Emerge out of cemetery dirt
      this.emergeY = y;
      this.emergeProgress = 0; // 0 to 1
    } else if (type === 'bat') {
      this.hp = 1;
      this.points = 200;
      this.width = 22;
      this.height = 18;
      this.baseY = y;
      this.flyTimer = Math.random() * Math.PI;
      this.vx = (facingRight ? 1 : -1) * 140;
    } else if (type === 'red_arremer') {
      this.hp = 3;
      this.points = 1000;
      this.width = 28;
      this.height = 36;
      this.state = 'PERCHED'; // Waiting on tombstone
      this.swoopTarget = { x: 0, y: 0 };
      this.actionTimer = 0;
      this.fireCooldown = 0;
    } else if (type === 'plant') {
      this.hp = 2;
      this.points = 400;
      this.width = 26;
      this.height = 34;
      this.shootTimer = 1.0 + Math.random() * 1.5;
    } else if (type === 'boss_cyclops') {
      this.hp = 10;
      this.maxHp = 10;
      this.points = 5000;
      this.width = 46;
      this.height = 68;
      this.state = 'PATROL';
      this.vx = -60;
      this.chargeTimer = 0;
      this.shootCooldown = 2.0;
    }
  }

  takeDamage(amount = 1) {
    this.hp -= amount;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.active = false;
      return true; // Destroyed
    }
    return false;
  }

  update(dt, arthur, platforms, enemyProjectiles = [], itemDrops = []) {
    if (!this.active) return;
    this.animTick += dt;
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);

    if (this.type === 'zombie') {
      if (this.state === 'EMERGING') {
        this.emergeProgress += dt * 1.8;
        if (this.emergeProgress >= 1.0) {
          this.state = 'WALKING';
          // Orient towards Arthur
          this.facingRight = arthur.x > this.x;
          this.vx = (this.facingRight ? 1 : -1) * 55;
        }
        return;
      }

      // Zombie walking logic
      this.x += this.vx * dt;

      // Platform gravity & edge turning
      let onPlatform = false;
      for (const p of platforms) {
        if (
          this.x + this.width > p.x &&
          this.x < p.x + p.width &&
          this.y + this.height >= p.y &&
          this.y + this.height <= p.y + 16
        ) {
          onPlatform = true;
          this.y = p.y - this.height;
          break;
        }
      }
      if (!onPlatform) {
        this.vy += GRAVITY * dt;
        this.y += this.vy * dt;
      }
    } else if (this.type === 'bat') {
      this.flyTimer += dt * 3.5;
      this.x += this.vx * dt;
      this.y = this.baseY + Math.sin(this.flyTimer) * 45;
    } else if (this.type === 'red_arremer') {
      const distToArthur = Math.hypot(arthur.x - this.x, arthur.y - this.y);

      if (this.state === 'PERCHED') {
        // Awaken if Arthur draws near
        if (distToArthur < 240) {
          this.state = 'LAUNCHING';
          this.vy = -180;
        }
      } else if (this.state === 'LAUNCHING') {
        this.y += this.vy * dt;
        if (this.y < 180) {
          this.state = 'HOVER';
          this.actionTimer = 1.0;
        }
      } else if (this.state === 'HOVER') {
        this.actionTimer -= dt;
        this.facingRight = arthur.x > this.x;
        // Hover bobbing
        this.x += (arthur.x > this.x ? 1 : -1) * 40 * dt;
        this.y += Math.sin(this.animTick * 6) * 20 * dt;

        // Fireball attack
        if (this.actionTimer <= 0) {
          // Shoot fireball towards Arthur
          const dx = arthur.x - this.x;
          const dy = arthur.y - this.y;
          const len = Math.hypot(dx, dy) || 1;
          enemyProjectiles.push({
            x: this.x + (this.facingRight ? 24 : -4),
            y: this.y + 12,
            vx: (dx / len) * 220,
            vy: (dy / len) * 220,
            radius: 5,
            active: true
          });

          // Transition to swoop
          this.state = 'SWOOP';
          this.swoopTarget = { x: arthur.x, y: arthur.y };
        }
      } else if (this.state === 'SWOOP') {
        // Rapid swoop attack
        const dx = this.swoopTarget.x - this.x;
        const dy = this.swoopTarget.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 20 || this.y > 400) {
          // Climb back to hover altitude
          this.state = 'CLIMBING';
          this.vy = -160;
        } else {
          this.x += (dx / dist) * 210 * dt;
          this.y += (dy / dist) * 210 * dt;
        }
      } else if (this.state === 'CLIMBING') {
        this.y += this.vy * dt;
        if (this.y <= 190) {
          this.state = 'HOVER';
          this.actionTimer = 1.2;
        }
      }
    } else if (this.type === 'plant') {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = 2.4;
        const dir = arthur.x > this.x ? 1 : -1;
        enemyProjectiles.push({
          x: this.x + (dir > 0 ? 24 : 0),
          y: this.y + 8,
          vx: dir * 180,
          vy: -60,
          gravity: 400,
          radius: 5,
          active: true
        });
      }
    } else if (this.type === 'boss_cyclops') {
      this.facingRight = arthur.x > this.x;

      if (this.state === 'PATROL') {
        this.x += this.vx * dt;
        if (this.x < 3050) {
          this.vx = 55;
        } else if (this.x > 3480) {
          this.vx = -55;
        }

        // Periodic fireball attack
        this.shootCooldown -= dt;
        if (this.shootCooldown <= 0) {
          this.shootCooldown = 2.2;
          const dir = this.facingRight ? 1 : -1;
          enemyProjectiles.push({
            x: this.x + (this.facingRight ? 44 : 2),
            y: this.y + 20,
            vx: dir * 260,
            vy: 0,
            radius: 7,
            active: true
          });
        }

        // Random enraged charge if hit
        if (this.hp <= 6 && Math.random() < 0.008) {
          this.state = 'CHARGE';
          this.chargeTimer = 1.5;
          this.vx = (this.facingRight ? 1 : -1) * 140;
        }
      } else if (this.state === 'CHARGE') {
        this.x += this.vx * dt;
        this.chargeTimer -= dt;
        if (this.chargeTimer <= 0 || this.x < 3040 || this.x > 3500) {
          this.state = 'PATROL';
          this.vx = this.facingRight ? 55 : -55;
        }
      }

      // Settle on castle ground
      this.y = 372;
    }
  }

  render(ctx, cameraX) {
    if (!this.active) return;
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);

    ctx.save();
    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(2.5)';
    }

    if (this.type === 'zombie') {
      if (this.state === 'EMERGING') {
        // Emerging out of mound
        const clipH = Math.round(32 * this.emergeProgress);
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx - 4, sy + 32 - clipH, 28, clipH);
        ctx.clip();

        // Zombie body rising
        ctx.fillStyle = '#65a30d'; // Ghastly zombie green
        ctx.fillRect(sx + 3, sy + 32 - clipH, 14, 32);
        // Tattered shroud
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(sx + 2, sy + 38 - clipH, 16, 18);
        ctx.restore();

        // Dirt mound spatter
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx - 4, sy + 28, 28, 6);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(sx - 2, sy + 26, 24, 3);
        ctx.restore();
        return;
      }

      // Zombie walking
      ctx.translate(sx, sy);
      if (!this.facingRight) {
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
      }

      const walkFrame = Math.floor(this.animTick * 4) % 2;

      // Zombie Head
      ctx.fillStyle = '#84cc16'; // Putrid undead skin
      ctx.fillRect(5, 0, 11, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, 3, 3, 3); // Hollow dark eye socket
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(12, 4, 1.5, 1.5); // Glowing red eye dot

      // Tattered Shroud
      ctx.fillStyle = '#52525b';
      ctx.fillRect(3, 10, 14, 13);
      ctx.fillStyle = '#27272a';
      ctx.fillRect(4, 14, 12, 6);

      // Outstretched Arms
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(13, 11, 8, 4);

      // Shuffling legs
      ctx.fillStyle = '#3f3f46';
      if (walkFrame === 0) {
        ctx.fillRect(4, 23, 5, 9);
        ctx.fillRect(11, 23, 5, 9);
      } else {
        ctx.fillRect(2, 23, 5, 9);
        ctx.fillRect(13, 22, 5, 8);
      }
    } else if (this.type === 'bat') {
      // Flying Green Eye / Spooky Bat
      ctx.translate(sx + this.width / 2, sy + this.height / 2);
      if (!this.facingRight) ctx.scale(-1, 1);

      const wingFlap = Math.sin(this.animTick * 18);

      // Eyeball / Core
      ctx.fillStyle = '#10b981'; // Alien emerald green
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(3, -1, 3, 3); // Red pupil

      // Leathery wings
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-12, wingFlap * 9);
      ctx.lineTo(-4, 3);
      ctx.moveTo(4, -2);
      ctx.lineTo(12, wingFlap * 9);
      ctx.lineTo(4, 3);
      ctx.fill();
    } else if (this.type === 'red_arremer') {
      // The Infamous Red Arremer (Firebrand)
      ctx.translate(sx, sy);
      if (!this.facingRight) {
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
      }

      // Crimson demonic gargoyle skin
      ctx.fillStyle = '#dc2626'; // Demon red
      ctx.fillRect(6, 4, 16, 18);

      // Horns
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(7, 4);
      ctx.lineTo(4, -4);
      ctx.lineTo(10, 4);
      ctx.moveTo(18, 4);
      ctx.lineTo(21, -4);
      ctx.lineTo(15, 4);
      ctx.fill();

      // Yellow predatory eyes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(13, 8, 4, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(15, 9, 2, 2);

      // Demon wings
      const wingSpread = this.state === 'PERCHED' ? 4 : (Math.sin(this.animTick * 12) * 8 + 14);
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.moveTo(5, 8);
      ctx.lineTo(-wingSpread, 2);
      ctx.lineTo(-2, 16);
      ctx.moveTo(21, 8);
      ctx.lineTo(21 + wingSpread, 2);
      ctx.lineTo(20, 16);
      ctx.fill();

      // Claws & tail
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(6, 22, 6, 12);
      ctx.fillRect(14, 22, 6, 12);
    } else if (this.type === 'plant') {
      // Carnivorous forest plant spitter
      ctx.translate(sx, sy);
      ctx.fillStyle = '#15803d'; // Stem & leaves
      ctx.fillRect(10, 12, 6, 22);

      // Bulb head
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(13, 10, 11, 0, Math.PI * 2);
      ctx.fill();

      // Spitting maw
      ctx.fillStyle = '#facc15';
      ctx.fillRect(1, 7, 8, 6);
    } else if (this.type === 'boss_cyclops') {
      // The Giant Cyclops (Unicorn)
      ctx.translate(sx, sy);
      if (!this.facingRight) {
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
      }

      // Massive bluish-gray ogre body
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, 14, 34, 34);

      // Armored spiked shoulder plates
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 12, 10, 12);
      ctx.fillRect(36, 12, 10, 12);

      // Head & massive horn (Unicorn)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 2, 24, 16);

      // Golden single horn
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(20, 2);
      ctx.lineTo(23, -16);
      ctx.lineTo(26, 2);
      ctx.closePath();
      ctx.fill();

      // Single giant glowing red eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(24, 9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(24, 8, 3, 3); // Eye highlight

      // Fangs
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(18, 14, 3, 4);
      ctx.fillRect(26, 14, 3, 4);

      // Heavy stomping legs
      ctx.fillStyle = '#334155';
      const stomp = Math.floor(this.animTick * 4) % 2;
      if (stomp === 0) {
        ctx.fillRect(8, 48, 12, 20);
        ctx.fillRect(26, 48, 12, 20);
      } else {
        ctx.fillRect(6, 46, 12, 22);
        ctx.fillRect(28, 50, 12, 18);
      }

      // Boss Health Bar above head
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -26, 46, 6);
      ctx.fillStyle = '#ef4444';
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillRect(1, -25, Math.round(44 * pct), 4);
    }

    ctx.restore();
  }
}
