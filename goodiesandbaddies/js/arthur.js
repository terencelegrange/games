/**
 * Knight Arthur Player Entity
 * Implements committed jump mechanics, 2-stage armor degradation,
 * crouching attacks, ladder climbing, and authentic retro pixel art rendering.
 */

import {
  GRAVITY,
  MAX_FALL_SPEED,
  WALK_SPEED,
  JUMP_VELOCITY,
  CLIMB_SPEED,
  findOverlappingLadder
} from './physics.js';
import { Projectile, WEAPON_TYPES } from './weapons.js';

export class Arthur {
  constructor(x = 100, y = 300) {
    this.x = x;
    this.y = y;
    this.spawnX = x;
    this.spawnY = y;
    this.width = 24;
    this.height = 34;

    this.vx = 0;
    this.vy = 0;
    this.facingRight = true;

    // Armor and life state: 2 = Full Armor, 1 = Boxer Shorts, 0 = Dead (Skeleton)
    this.armorLevel = 2;
    this.lives = 3;
    this.invulnerableTimer = 0;

    // Movement and action states
    this.state = 'IDLE'; // 'IDLE', 'RUN', 'JUMP', 'FALL', 'CROUCH', 'CLIMB', 'HIT', 'DEAD'
    this.grounded = true;
    this.onLadder = false;
    this.jumpVx = 0; // Committed jump velocity in mid-air

    // Weapon inventory
    this.weaponType = 'lance'; // 'lance', 'dagger', 'torch'
    this.throwCooldown = 0;
    this.isThrowingAnim = false;
    this.throwAnimTimer = 0;

    // Animation ticks
    this.animTick = 0;
    this.deathTimer = 0;
  }

  resetToCheckpoint(checkpointX = 100, checkpointY = 300) {
    this.x = checkpointX;
    this.y = checkpointY;
    this.vx = 0;
    this.vy = 0;
    this.jumpVx = 0;
    this.facingRight = true;
    this.armorLevel = 2;
    this.invulnerableTimer = 2.0; // Grace timer upon respawn
    this.state = 'IDLE';
    this.grounded = true;
    this.onLadder = false;
    this.isThrowingAnim = false;
    this.deathTimer = 0;
  }

  takeDamage() {
    if (this.invulnerableTimer > 0 || this.state === 'DEAD' || this.state === 'HIT') {
      return null;
    }

    if (this.armorLevel === 2) {
      // Armor broken! Drop to Boxer Shorts
      this.armorLevel = 1;
      this.state = 'HIT';
      this.invulnerableTimer = 1.6;
      this.vy = -200;
      this.vx = (this.facingRight ? -1 : 1) * 110; // Knockback
      this.onLadder = false;
      return 'ARMOR_LOST';
    } else {
      // Fatal hit! Crumble into skeleton
      this.armorLevel = 0;
      this.state = 'DEAD';
      this.deathTimer = 2.5;
      this.vx = 0;
      this.vy = -160;
      this.onLadder = false;
      this.lives = Math.max(0, this.lives - 1);
      return 'KILLED';
    }
  }

  restoreArmor() {
    if (this.armorLevel === 1) {
      this.armorLevel = 2;
      return true;
    }
    return false;
  }

  throwWeapon(activeProjectiles = []) {
    if (this.state === 'DEAD' || this.state === 'HIT' || this.throwCooldown > 0) {
      return null;
    }

    const def = WEAPON_TYPES[this.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE;
    const countActive = activeProjectiles.filter(p => p.active && p.type === this.weaponType).length;
    if (countActive >= def.maxActive) {
      return null;
    }

    this.throwCooldown = this.weaponType === 'dagger' ? 0.22 : 0.35;
    this.isThrowingAnim = true;
    this.throwAnimTimer = 0.2;

    const spawnX = this.facingRight ? this.x + this.width + 4 : this.x - 24;
    const spawnY = this.state === 'CROUCH' ? this.y + 14 : this.y + 8;

    return new Projectile({
      x: spawnX,
      y: spawnY,
      facingRight: this.facingRight,
      type: this.weaponType
    });
  }

  update(dt, input, platforms, ladders) {
    // 1. Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    // 2. Weapon throw animation timer decay
    if (this.throwCooldown > 0) {
      this.throwCooldown = Math.max(0, this.throwCooldown - dt);
    }
    if (this.throwAnimTimer > 0) {
      this.throwAnimTimer -= dt;
      if (this.throwAnimTimer <= 0) {
        this.isThrowingAnim = false;
      }
    }

    // 3. Death state processing
    if (this.state === 'DEAD') {
      this.deathTimer -= dt;
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
      this.y += this.vy * dt;
      // Settle on ground
      for (const p of platforms) {
        if (
          this.x + this.width > p.x &&
          this.x < p.x + p.width &&
          this.y + this.height >= p.y &&
          this.y + this.height <= p.y + 20 &&
          this.vy > 0
        ) {
          this.y = p.y - this.height;
          this.vy = 0;
          break;
        }
      }
      return;
    }

    // 4. Knockback recovery from hit
    if (this.state === 'HIT') {
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Platform landing terminates hit knockback
      for (const p of platforms) {
        if (
          this.x + this.width > p.x &&
          this.x < p.x + p.width &&
          this.y + this.height >= p.y &&
          this.y + this.height <= p.y + 20 &&
          this.vy > 0
        ) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.vx = 0;
          this.state = 'IDLE';
          this.grounded = true;
          break;
        }
      }
      return;
    }

    // 5. Ladder climbing interaction
    const overlappingLadder = findOverlappingLadder(this, ladders);
    if (overlappingLadder) {
      if ((input.up || input.down) && !this.onLadder) {
        // Mount ladder
        this.onLadder = true;
        this.grounded = false;
        this.vx = 0;
        this.vy = 0;
        this.jumpVx = 0;
        // Snap center horizontally to ladder
        this.x = overlappingLadder.x + overlappingLadder.width / 2 - this.width / 2;
      }
    } else {
      this.onLadder = false;
    }

    if (this.onLadder) {
      this.state = 'CLIMB';
      this.height = 34;
      if (input.up) {
        this.vy = -CLIMB_SPEED;
        this.animTick += dt;
      } else if (input.down) {
        this.vy = CLIMB_SPEED;
        this.animTick += dt;
      } else {
        this.vy = 0;
      }

      this.y += this.vy * dt;

      // Dismount if jumping off
      if (input.jump) {
        this.onLadder = false;
        this.vy = JUMP_VELOCITY * 0.85;
        const dismountLeft = input.lastHorizontal ? input.lastHorizontal === 'left' : (input.left && !input.right);
        const dismountRight = input.lastHorizontal ? input.lastHorizontal === 'right' : (input.right && !input.left);
        this.jumpVx = dismountLeft ? -WALK_SPEED : (dismountRight ? WALK_SPEED : 0);
        this.state = 'JUMP';
      }
      return;
    }

    // 6. Grounded vs Airborne movement
    if (this.grounded) {
      const moveLeft = input.lastHorizontal ? input.lastHorizontal === 'left' : (input.left && !input.right);
      const moveRight = input.lastHorizontal ? input.lastHorizontal === 'right' : (input.right && !input.left);

      // Instant direction turning when grounded (works both standing and crouching)
      if (moveLeft) {
        this.facingRight = false;
      } else if (moveRight) {
        this.facingRight = true;
      }

      if (input.down) {
        // Crouch / duck
        this.state = 'CROUCH';
        this.height = 22; // Shorter hitbox
        this.vx = 0;
      } else {
        this.height = 34; // Normal standing height

        if (moveLeft) {
          this.vx = -WALK_SPEED;
          this.state = 'RUN';
          this.animTick += dt;
        } else if (moveRight) {
          this.vx = WALK_SPEED;
          this.state = 'RUN';
          this.animTick += dt;
        } else {
          this.vx = 0;
          this.state = 'IDLE';
        }

        // Initiate committed jump
        if (input.jump) {
          this.grounded = false;
          this.vy = JUMP_VELOCITY;
          // In Goodies and Baddies, jump forward preserves committed velocity
          this.jumpVx = moveLeft ? -WALK_SPEED : (moveRight ? WALK_SPEED : 0);
          this.state = 'JUMP';
        }
      }
    } else {
      // Airborne: Committed jump physics (locked horizontal speed)
      this.vx = this.jumpVx;
      this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
      this.state = this.vy < 0 ? 'JUMP' : 'FALL';
      this.height = 34;
    }

    // 7. Apply horizontal and vertical integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 8. Platform collision resolution (land on tops of solid surfaces)
    this.grounded = false;
    for (const p of platforms) {
      const bottom = this.state === 'CROUCH' ? this.y + 34 : this.y + this.height;
      if (
        this.x + this.width > p.x &&
        this.x < p.x + p.width &&
        bottom >= p.y &&
        bottom <= p.y + 20 &&
        this.vy >= 0
      ) {
        this.y = p.y - (this.state === 'CROUCH' ? 34 : this.height);
        this.vy = 0;
        this.jumpVx = 0;
        this.grounded = true;
        if (this.state === 'JUMP' || this.state === 'FALL') {
          this.state = 'IDLE';
        }
        break;
      }
    }

    // 9. World boundary clamping
    this.x = Math.max(0, this.x);
  }

  render(ctx, cameraX) {
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);

    // Blinking effect during invulnerability
    if (this.invulnerableTimer > 0) {
      if (Math.floor(performance.now() / 60) % 2 === 0) {
        return; // Skip rendering frame for arcade blink
      }
    }

    ctx.save();
    ctx.translate(sx, sy);
    if (!this.facingRight) {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }

    const isBoxers = this.armorLevel === 1;
    const isDead = this.armorLevel === 0;

    if (isDead) {
      // Render Arthur's Crumbled Skeleton
      ctx.fillStyle = '#f8fafc'; // Bone white
      // Skull
      ctx.beginPath();
      ctx.arc(12, 24, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9, 23, 2, 3); // Eye socket
      ctx.fillRect(14, 23, 2, 3);

      // Ribs & bones scattered
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(2, 28, 7, 3);
      ctx.fillRect(15, 29, 8, 3);
      ctx.fillRect(8, 31, 8, 3);

      ctx.restore();
      return;
    }

    const runFrame = Math.floor(this.animTick * 8) % 4;

    // 1. Arthur Head & Helmet
    if (!isBoxers) {
      // Knight Helmet
      ctx.fillStyle = '#94a3b8'; // Steel
      ctx.fillRect(6, 0, 13, 11);
      // Red plume / feather
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, -4, 10, 4);
      ctx.fillRect(1, -2, 4, 3);
      // Visor slit & eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 4, 6, 3);
      ctx.fillStyle = '#ffff55';
      ctx.fillRect(14, 5, 2, 1.5);
    } else {
      // Bare Head with Knight Helmet on Boxers Arthur
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(6, 0, 13, 11);
      // Feather
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, -4, 9, 4);
      // Arthur's face & heroic beard/mustache
      ctx.fillStyle = '#fbcfe8'; // Skin
      ctx.fillRect(11, 4, 7, 6);
      ctx.fillStyle = '#78350f'; // Brown beard
      ctx.fillRect(13, 8, 6, 3);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, 5, 2, 2); // Eye
    }

    if (this.state === 'CROUCH') {
      // Ducking pose
      if (!isBoxers) {
        // Armor Torso low
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(4, 10, 16, 8);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(6, 12, 12, 4);
        // Boots
        ctx.fillStyle = '#475569';
        ctx.fillRect(2, 17, 18, 5);
      } else {
        // Bare skin & boxers crouch
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(4, 10, 15, 6);
        // White boxers with red hearts
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(3, 15, 17, 7);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(6, 17, 2, 2);
        ctx.fillRect(13, 18, 2, 2);
      }

      // Extended throwing arm when ducking
      if (this.isThrowingAnim) {
        ctx.fillStyle = isBoxers ? '#fbcfe8' : '#cbd5e1';
        ctx.fillRect(16, 11, 8, 4);
      }
    } else {
      // Standing / Running / Jumping pose
      // 2. Torso
      if (!isBoxers) {
        // Full Steel Cuirass Plate
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(5, 10, 14, 12);
        // Steel chestplate highlight
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(7, 11, 9, 3);
        // Belt
        ctx.fillStyle = '#b45309';
        ctx.fillRect(5, 20, 14, 3);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(10, 20, 4, 3);
      } else {
        // Bare chest
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(5, 10, 13, 10);
        // White boxer shorts with red hearts
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 19, 15, 7);
        // Red heart dots
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(7, 21, 2, 2);
        ctx.fillRect(13, 22, 2, 2);
      }

      // 3. Arms
      if (this.isThrowingAnim) {
        // Throwing arm extended forward
        ctx.fillStyle = isBoxers ? '#fbcfe8' : '#cbd5e1';
        ctx.fillRect(14, 11, 9, 4);
        ctx.fillRect(21, 9, 4, 8); // Hand holding weapon
      } else if (this.state === 'CLIMB') {
        // Climbing arms on ladder
        ctx.fillStyle = isBoxers ? '#fbcfe8' : '#cbd5e1';
        const climbAlt = Math.floor(this.animTick * 6) % 2;
        if (climbAlt === 0) {
          ctx.fillRect(1, 7, 4, 8);
          ctx.fillRect(18, 12, 4, 8);
        } else {
          ctx.fillRect(1, 12, 4, 8);
          ctx.fillRect(18, 7, 4, 8);
        }
      } else {
        // Resting or running arm
        ctx.fillStyle = isBoxers ? '#fbcfe8' : '#94a3b8';
        ctx.fillRect(3, 12, 4, 8);
      }

      // 4. Legs & Boots
      if (!isBoxers) {
        ctx.fillStyle = '#475569'; // Steel greaves
        if (this.state === 'RUN') {
          if (runFrame === 0 || runFrame === 2) {
            ctx.fillRect(4, 23, 6, 11);
            ctx.fillRect(13, 23, 6, 11);
          } else if (runFrame === 1) {
            ctx.fillRect(1, 23, 6, 11);
            ctx.fillRect(15, 22, 6, 10);
          } else {
            ctx.fillRect(6, 22, 6, 10);
            ctx.fillRect(12, 23, 6, 11);
          }
        } else if (this.state === 'JUMP' || this.state === 'FALL') {
          // Jump curled legs
          ctx.fillRect(3, 22, 7, 8);
          ctx.fillRect(12, 24, 7, 8);
        } else {
          // Idle legs
          ctx.fillRect(5, 23, 6, 11);
          ctx.fillRect(13, 23, 6, 11);
        }
      } else {
        // Bare legs and brown boots
        ctx.fillStyle = '#fbcfe8'; // Skin
        ctx.fillRect(5, 25, 4, 4);
        ctx.fillRect(13, 25, 4, 4);
        ctx.fillStyle = '#78350f'; // Leather boots
        if (this.state === 'RUN') {
          if (runFrame % 2 === 0) {
            ctx.fillRect(4, 28, 6, 6);
            ctx.fillRect(13, 28, 6, 6);
          } else {
            ctx.fillRect(2, 28, 6, 6);
            ctx.fillRect(15, 27, 6, 6);
          }
        } else {
          ctx.fillRect(4, 28, 6, 6);
          ctx.fillRect(13, 28, 6, 6);
        }
      }
    }

    ctx.restore();
  }
}
