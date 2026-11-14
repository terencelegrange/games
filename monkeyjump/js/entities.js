/**
 * Monkey Jump Entities
 * Girder, Ladder, Kong, Barrel, HammerItem, Penny, Jumpman
 */

export class Girder {
  constructor(x1, y1, x2, y2, height = 12) {
    this.x1 = Math.min(x1, x2);
    this.y1 = x1 < x2 ? y1 : y2;
    this.x2 = Math.max(x1, x2);
    this.y2 = x1 < x2 ? y2 : y1;
    this.height = height;
  }

  containsX(x) {
    return x >= this.x1 && x <= this.x2;
  }

  getY(x) {
    if (this.x2 === this.x1) return this.y1;
    const t = Math.max(0, Math.min(1, (x - this.x1) / (this.x2 - this.x1)));
    return this.y1 + t * (this.y2 - this.y1);
  }

  render(ctx) {
    ctx.save();
    const x1 = this.x1;
    const y1 = this.y1;
    const x2 = this.x2;
    const y2 = this.y2;
    const h = this.height;

    // Outer girder silhouette (Authentic arcade crimson/magenta girder)
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y2 + h);
    ctx.lineTo(x1, y1 + h);
    ctx.closePath();
    ctx.fill();

    // Top shiny highlight line
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 1);
    ctx.lineTo(x2, y2 + 1);
    ctx.stroke();

    // Cross-brace truss rivets
    const span = x2 - x1;
    const steps = Math.floor(span / 16);
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < steps; i++) {
      const sx = x1 + i * 16;
      const sy = this.getY(sx);
      const ex = sx + 16;
      const ey = this.getY(ex);

      ctx.beginPath();
      ctx.moveTo(sx, sy + 2);
      ctx.lineTo(ex, ey + h - 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ex, ey + 2);
      ctx.lineTo(sx, sy + h - 2);
      ctx.stroke();

      // Rivet dots
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(sx + 1, sy + 3, 2, 2);
      ctx.fillRect(sx + 1, sy + h - 5, 2, 2);
    }

    ctx.restore();
  }
}

export class Ladder {
  constructor(x, yTop, yBottom, isBroken = false) {
    this.x = x;
    this.yTop = Math.min(yTop, yBottom);
    this.yBottom = Math.max(yTop, yBottom);
    this.width = 16;
    this.isBroken = isBroken;
  }

  contains(px, py, padX = 14, padY = 24) {
    return (
      Math.abs(px - this.x) <= padX &&
      py >= this.yTop - padY &&
      py <= this.yBottom + padY
    );
  }

  render(ctx) {
    ctx.save();
    const half = this.width / 2;
    const x = this.x;
    const yTop = this.yTop;
    const yBottom = this.yBottom;

    ctx.strokeStyle = '#38bdf8'; // Retro arcade cyan
    ctx.lineWidth = 2;

    if (!this.isBroken) {
      // Rails
      ctx.beginPath();
      ctx.moveTo(x - half, yTop);
      ctx.lineTo(x - half, yBottom);
      ctx.moveTo(x + half, yTop);
      ctx.lineTo(x + half, yBottom);
      ctx.stroke();

      // Rungs
      const rungDist = 8;
      for (let y = yTop + 4; y < yBottom; y += rungDist) {
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }
    } else {
      // Broken ladder with middle section missing
      const gapY1 = yTop + (yBottom - yTop) * 0.35;
      const gapY2 = yTop + (yBottom - yTop) * 0.65;

      // Top segment
      ctx.beginPath();
      ctx.moveTo(x - half, yTop);
      ctx.lineTo(x - half, gapY1);
      ctx.moveTo(x + half, yTop);
      ctx.lineTo(x + half, gapY1);
      ctx.stroke();

      for (let y = yTop + 4; y < gapY1; y += 8) {
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }

      // Bottom segment
      ctx.beginPath();
      ctx.moveTo(x - half, gapY2);
      ctx.lineTo(x - half, yBottom);
      ctx.moveTo(x + half, gapY2);
      ctx.lineTo(x + half, yBottom);
      ctx.stroke();

      for (let y = gapY2 + 4; y < yBottom; y += 8) {
        ctx.beginPath();
        ctx.moveTo(x - half, y);
        ctx.lineTo(x + half, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

export class Kong {
  constructor(x = 60, y = 100) {
    this.x = x;
    this.y = y;
    this.width = 64;
    this.height = 54;
    this.state = 'IDLE'; // IDLE, CHEST_BEAT, REACH, LIFT, TOSS
    this.timer = 0;
    this.chestBeatFrame = 0;
    this.hasBarrelInHand = false;
  }

  update(dt, onBeat, onToss) {
    this.timer += dt;

    if (this.state === 'IDLE') {
      if (this.timer > 1.8) {
        this.state = 'CHEST_BEAT';
        this.timer = 0;
        this.chestBeatFrame = 0;
      }
    } else if (this.state === 'CHEST_BEAT') {
      if (this.timer > 0.16) {
        this.timer = 0;
        this.chestBeatFrame++;
        if (typeof onBeat === 'function') onBeat();
        if (this.chestBeatFrame >= 4) {
          this.state = 'REACH';
          this.timer = 0;
        }
      }
    } else if (this.state === 'REACH') {
      if (this.timer > 0.4) {
        this.state = 'LIFT';
        this.hasBarrelInHand = true;
        this.timer = 0;
      }
    } else if (this.state === 'LIFT') {
      if (this.timer > 0.5) {
        this.state = 'TOSS';
        this.timer = 0;
        this.hasBarrelInHand = false;
        if (typeof onToss === 'function') onToss(this.x + 48, this.y + 36);
      }
    } else if (this.state === 'TOSS') {
      if (this.timer > 0.4) {
        this.state = 'IDLE';
        this.timer = 0;
      }
    }
  }

  render(ctx) {
    ctx.save();
    const x = this.x;
    const y = this.y;

    // Stacked reserve barrels beside Kong
    ctx.fillStyle = '#b45309'; // Wooden brown
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;

    // Draw stack of 2 barrels on left
    [-24, -24].forEach((bx, idx) => {
      const by = y + 16 + idx * 16;
      ctx.beginPath();
      ctx.ellipse(x + bx, by, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + bx - 8, by - 2, 16, 4); // Barrel steel band
      ctx.fillStyle = '#b45309';
    });

    // Kong Body (Rich brown ape fur)
    ctx.fillStyle = '#5c2c16';
    ctx.strokeStyle = '#381607';
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 14, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ape face / muzzle (tan skin)
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(x + 34, y + 16, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 28, y + 11, 4, 4);
    ctx.fillRect(x + 36, y + 11, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 30, y + 12, 2, 2);
    ctx.fillRect(x + 38, y + 12, 2, 2);

    // Brow & grin
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 34, y + 20, 6, 0, Math.PI);
    ctx.stroke();

    // Torso
    ctx.fillStyle = '#5c2c16';
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 36, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chest skin
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 35, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms based on state
    ctx.fillStyle = '#5c2c16';
    if (this.state === 'CHEST_BEAT') {
      const beatOffset = (this.chestBeatFrame % 2 === 0) ? -4 : 4;
      // Left arm thumping chest
      ctx.fillRect(x + 16 + beatOffset, y + 28, 12, 12);
      // Right arm thumping chest
      ctx.fillRect(x + 36 - beatOffset, y + 28, 12, 12);
    } else if (this.state === 'LIFT') {
      // Arms raised high
      ctx.fillRect(x + 14, y + 4, 10, 24);
      ctx.fillRect(x + 40, y + 4, 10, 24);
      // Barrel held aloft
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(x + 32, y - 4, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();
    } else if (this.state === 'REACH') {
      // Arm reaching left to barrel stack
      ctx.fillRect(x + 4, y + 24, 20, 10);
      ctx.fillRect(x + 42, y + 28, 12, 16);
    } else {
      // Resting gorilla arms
      ctx.fillRect(x + 10, y + 26, 10, 20);
      ctx.fillRect(x + 44, y + 26, 10, 20);
    }

    ctx.restore();
  }
}

export class Barrel {
  constructor(x, y, speed = 2.2) {
    this.x = x;
    this.y = y;
    this.radius = 9;
    this.speed = speed;
    this.vx = speed;
    this.vy = 0;
    this.rotation = 0;
    this.currentGirder = null;
    this.state = 'ROLLING'; // ROLLING, FALLING, LADDER_DOWN
    this.ladderTargetY = null;
    this.hoppedByPlayer = false; // Prevents duplicate score on 1 jump
    this.active = true;
  }

  update(girders, ladders) {
    if (!this.active) return;

    if (this.state === 'ROLLING') {
      this.rotation += (this.vx > 0 ? 0.2 : -0.2);
      this.x += this.vx;

      // Check ladder drop chance (25%) when rolling over an intact ladder
      const rollLadder = ladders.find(l => !l.isBroken && Math.abs(this.x - l.x) < 4 && Math.abs(this.y - l.yTop) < 14);
      if (rollLadder && Math.random() < 0.25) {
        this.state = 'LADDER_DOWN';
        this.x = rollLadder.x;
        this.ladderTargetY = rollLadder.yBottom;
        this.vy = 3.0;
        return;
      }

      // Match slope of current girder
      let onGirder = null;
      for (const g of girders) {
        if (g.containsX(this.x)) {
          const expectedY = g.getY(this.x) - this.radius;
          if (Math.abs(this.y - expectedY) < 16) {
            onGirder = g;
            this.y = expectedY;
            break;
          }
        }
      }

      if (!onGirder) {
        // Walked off girder edge -> transition to falling
        this.state = 'FALLING';
        this.vy = 2.0;
      } else {
        this.currentGirder = onGirder;
      }
    } else if (this.state === 'FALLING') {
      this.vy += 0.35; // Gravity
      this.y += this.vy;

      // Check if barrel lands on any lower girder
      for (const g of girders) {
        if (g.containsX(this.x)) {
          const expectedY = g.getY(this.x) - this.radius;
          if (this.y >= expectedY - 6 && this.y <= expectedY + 12) {
            this.y = expectedY;
            this.vy = 0;
            this.vx = -this.vx; // Reverse rolling direction on landing!
            this.state = 'ROLLING';
            this.currentGirder = g;
            break;
          }
        }
      }

      // Off screen bottom removal
      if (this.y > 660) {
        this.active = false;
      }
    } else if (this.state === 'LADDER_DOWN') {
      this.y += this.vy;
      this.rotation += 0.3;
      if (this.ladderTargetY && this.y >= this.ladderTargetY - this.radius) {
        this.y = this.ladderTargetY - this.radius;
        this.vy = 0;
        this.vx = -this.vx; // Reverse direction on descending ladder
        this.state = 'ROLLING';
        this.ladderTargetY = null;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Barrel circular body
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Steel bands
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
    ctx.stroke();

    // Wood stave lines across barrel
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-this.radius + 2, -3);
    ctx.lineTo(this.radius - 2, -3);
    ctx.moveTo(-this.radius + 2, 3);
    ctx.lineTo(this.radius - 2, 3);
    ctx.moveTo(0, -this.radius + 1);
    ctx.lineTo(0, this.radius - 1);
    ctx.stroke();

    ctx.restore();
  }
}

export class HammerItem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 18;
    this.active = true;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    const x = this.x;
    const y = this.y;

    // Wooden handle
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 7, y + 6, 4, 12);

    // Heavy steel hammer head
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + 2, y, 14, 7);
    ctx.strokeRect(x + 2, y, 14, 7);

    // Glow gleam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 2, 3, 2);

    ctx.restore();
  }
}

export class BonusItem {
  constructor(type, x, y) {
    this.type = type; // 'PARASOL', 'PURSE', 'HAT'
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 18;
    this.active = true;
    this.points = 300;
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'PARASOL') {
      // Pink Parasol (Pauline's umbrella)
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(9, 7, 7, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(9, 7);
      ctx.lineTo(9, 15);
      ctx.arc(7, 15, 2, 0, Math.PI);
      ctx.stroke();
    } else if (this.type === 'PURSE') {
      // Golden yellow purse
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, 5, 12, 10);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(7, 9, 4, 3);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 5, 12, 10);
      ctx.beginPath();
      ctx.arc(9, 5, 4, Math.PI, 0);
      ctx.stroke();
    } else if (this.type === 'HAT') {
      // Pink sun hat
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(2, 10, 14, 3);
      ctx.beginPath();
      ctx.ellipse(9, 8, 5, 5, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 9, 8, 2);
    }

    ctx.restore();
  }
}

export class Fireball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.vx = (Math.random() < 0.5 ? -1.0 : 1.0) * 1.3;
    this.vy = 0;
    this.animTimer = 0;
    this.active = true;
    this.climbing = false;
  }

  update(dt, girders, ladders, jumpmanX) {
    if (!this.active) return;
    this.animTimer += dt * 8;

    if (!this.climbing) {
      this.x += this.vx;

      // Reverse at screen borders
      if (this.x < 24) {
        this.x = 24;
        this.vx = Math.abs(this.vx);
      } else if (this.x > 450) {
        this.x = 450;
        this.vx = -Math.abs(this.vx);
      }

      // Check ladder climb chance if near ladder
      const ladder = ladders.find(l => !l.isBroken && Math.abs(this.x - l.x) < 6 && Math.abs((this.y + 16) - l.yBottom) < 10);
      if (ladder && Math.random() < 0.015) {
        this.climbing = true;
        this.x = ladder.x - 8;
        this.vy = -1.2;
      }
    } else {
      this.y += this.vy;
      // Reached top of ladder
      const atTop = girders.some(g => g.containsX(this.x + 8) && Math.abs((this.y + 16) - g.getY(this.x + 8)) < 6);
      if (atTop) {
        this.climbing = false;
        this.vy = 0;
        this.vx = this.x < jumpmanX ? 1.3 : -1.3;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const frame = Math.floor(this.animTimer) % 2;

    // Flickering core
    ctx.fillStyle = frame === 0 ? '#38bdf8' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Outer flame tongues
    ctx.fillStyle = frame === 0 ? '#0284c7' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(8, 0);
    ctx.lineTo(13, 8);
    ctx.lineTo(11, 15);
    ctx.lineTo(5, 15);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 6, 2, 3);
    ctx.fillRect(9, 6, 2, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(5, 7, 1, 2);
    ctx.fillRect(9, 7, 1, 2);

    ctx.restore();
  }
}

export class Penny {
  constructor(x = 230, y = 56) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 24;
    this.timer = 0;
  }

  update(dt) {
    this.timer += dt;
  }

  render(ctx) {
    ctx.save();
    const x = this.x;
    const y = this.y;

    // "HELP!" speech bubble with pulsing heart
    const pulse = 1 + Math.sin(this.timer * 6) * 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 14, y - 28, 48, 16);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 14, y - 28, 48, 16);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('HELP! ❤️', x - 10, y - 16);

    // Damsel Penny pixel figure (Blonde hair, pink retro gown)
    // Blonde hair
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x + 3, y, 14, 8);

    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 5, y + 4, 10, 6);

    // Pink dress
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 10);
    ctx.lineTo(x + 16, y + 10);
    ctx.lineTo(x + 19, y + 24);
    ctx.lineTo(x + 1, y + 24);
    ctx.closePath();
    ctx.fill();

    // Waving hands
    const armOffset = Math.sin(this.timer * 8) > 0 ? -4 : 0;
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + 1, y + 8 + armOffset, 3, 6);
    ctx.fillRect(x + 16, y + 8 - armOffset, 3, 6);

    ctx.restore();
  }
}

export class Jumpman {
  constructor(x = 40, y = 576) {
    this.x = x;
    this.y = y;
    this.width = 18;
    this.height = 24;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'RIGHT'; // 'LEFT' or 'RIGHT'
    this.state = 'GROUNDED'; // GROUNDED, JUMPING, CLIMBING, HAMMER, DEAD
    this.currentGirder = null;
    this.currentLadder = null;
    this.walkAnimTimer = 0;
    this.hammerTimer = 0;
    this.hammerSwingUp = true;
    this.hammerSwingTimer = 0;
    this.jumpOriginGirder = null;
  }

  jump() {
    if (this.state === 'GROUNDED') {
      this.state = 'JUMPING';
      this.vy = -4.8;
      this.jumpOriginGirder = this.currentGirder;
      return true;
    }
    return false;
  }

  startHammer(duration = 8.0) {
    this.hammerTimer = duration;
    this.state = 'HAMMER';
    this.hammerSwingUp = true;
    this.hammerSwingTimer = 0;
  }

  update(dt, input, girders, ladders) {
    if (this.state === 'DEAD') return;

    // Hammer timer decay
    if (this.hammerTimer > 0) {
      this.hammerTimer -= dt;
      this.hammerSwingTimer += dt;
      if (this.hammerSwingTimer > 0.12) {
        this.hammerSwingTimer = 0;
        this.hammerSwingUp = !this.hammerSwingUp;
      }
      if (this.hammerTimer <= 0) {
        this.hammerTimer = 0;
        this.state = 'GROUNDED';
      }
    }

    const moveSpeed = 2.8;
    const climbSpeed = 2.0;

    // Horizontal Movement (cannot move horizontally if climbing)
    if (this.state !== 'CLIMBING') {
      if (input.left) {
        this.vx = -moveSpeed;
        this.facing = 'LEFT';
        this.walkAnimTimer += dt * 10;
      } else if (input.right) {
        this.vx = moveSpeed;
        this.facing = 'RIGHT';
        this.walkAnimTimer += dt * 10;
      } else {
        this.vx = 0;
      }
    }

    // Climbing Ladder Logic
    if (this.state !== 'HAMMER' && this.state !== 'JUMPING') {
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;
      const nearLadder = ladders.find(l => !l.isBroken && l.contains(centerX, centerY));
      if (nearLadder) {
        if (input.up) {
          this.state = 'CLIMBING';
          this.x = nearLadder.x - this.width / 2; // Center on ladder
          this.vx = 0;
          this.vy = -climbSpeed;
          this.currentLadder = nearLadder;
          this.jumpOriginGirder = null;
          this.walkAnimTimer += dt * 8;
        } else if (input.down) {
          this.state = 'CLIMBING';
          this.x = nearLadder.x - this.width / 2;
          this.vx = 0;
          this.vy = climbSpeed;
          this.currentLadder = nearLadder;
          this.jumpOriginGirder = null;
          this.walkAnimTimer += dt * 8;
        } else if (this.state === 'CLIMBING') {
          this.vy = 0;
        }
      } else if (this.state === 'CLIMBING') {
        // Stepped off ladder
        this.state = 'GROUNDED';
        this.vy = 0;
        this.currentLadder = null;
      }

      // Step off ladder to left or right if aligned with girder
      if (this.state === 'CLIMBING' && (input.left || input.right)) {
        const footY = this.y + this.height;
        for (const g of girders) {
          if (g.containsX(centerX)) {
            const surfaceY = g.getY(centerX);
            if (Math.abs(footY - surfaceY) < 10) {
              this.state = 'GROUNDED';
              this.currentLadder = null;
              break;
            }
          }
        }
      }
    }

    // Physics Step
    this.x += this.vx;
    this.y += this.vy;

    // Apply Gravity when jumping or in air
    if (this.state === 'JUMPING') {
      this.vy += 0.38;
    }

    // Girder Collision & Snapping
    if (this.state !== 'CLIMBING') {
      let landed = false;
      const footY = this.y + this.height;

      for (const g of girders) {
        if (g.containsX(this.x)) {
          const surfaceY = g.getY(this.x);
          // Prevent jumping directly onto upper girder levels (must climb ladders to advance)
          if (this.jumpOriginGirder && g !== this.jumpOriginGirder && surfaceY < this.jumpOriginGirder.getY(this.x) - 15) {
            continue;
          }

          // Check if feet are near girder top
          if (footY >= surfaceY - 5 && footY <= surfaceY + 12 && this.vy >= 0) {
            this.y = surfaceY - this.height;
            this.vy = 0;
            this.state = (this.hammerTimer > 0) ? 'HAMMER' : 'GROUNDED';
            this.currentGirder = g;
            this.jumpOriginGirder = null;
            landed = true;
            break;
          }
        }
      }

      if (!landed && this.state === 'GROUNDED') {
        // Walked off girder edge
        this.state = 'JUMPING';
        this.vy = 1.0;
      }
    } else if (this.currentLadder) {
      // Clamp climbing to ladder bounds
      if (this.y + this.height < this.currentLadder.yTop) {
        this.y = this.currentLadder.yTop - this.height;
        this.state = 'GROUNDED';
        this.vy = 0;
      } else if (this.y + this.height > this.currentLadder.yBottom + 2) {
        this.y = this.currentLadder.yBottom - this.height;
        this.state = 'GROUNDED';
        this.vy = 0;
      }
    }

    // Screen bounds clamping
    this.x = Math.max(12, Math.min(468, this.x));
    if (this.y > 640) {
      this.y = 600 - this.height;
      this.state = 'GROUNDED';
      this.vy = 0;
    }
  }

  getHammerHitbox() {
    if (this.state !== 'HAMMER') return null;
    const reach = 26;
    const hx = this.facing === 'RIGHT' ? this.x + this.width - 4 : this.x - reach + 4;
    const hy = this.y - 12;
    return { x: hx, y: hy, width: reach, height: this.height + 16 };
  }

  render(ctx) {
    ctx.save();
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const flip = this.facing === 'LEFT';

    if (this.state === 'DEAD') {
      // Tumble upside down
      ctx.translate(x + this.width / 2, y + this.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else if (flip) {
      ctx.translate(x + this.width, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    // Jumpman Pixel Art (Authentic Red Overalls, Blue Shirt, Brown Mustache & Cap)
    // Red Cap
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(3, 0, 12, 5);
    ctx.fillRect(7, 2, 10, 3); // Cap visor

    // Face / Nose
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(5, 5, 8, 5);
    ctx.fillRect(11, 6, 4, 3); // Big nose

    // Mustache & Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(9, 6, 2, 2); // Eye
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8, 8, 7, 3); // Mustache

    // Blue Shirt
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(4, 10, 10, 6);

    // Red Overalls
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(5, 14, 8, 6);
    // Yellow Overall buttons
    ctx.fillStyle = '#fde047';
    ctx.fillRect(6, 15, 2, 2);
    ctx.fillRect(10, 15, 2, 2);

    // Legs / Boots
    const step = Math.floor(this.walkAnimTimer) % 2;
    ctx.fillStyle = '#78350f'; // Brown boots
    if (this.state === 'JUMPING') {
      // Leaping pose with legs kicked back
      ctx.fillRect(1, 18, 5, 5);
      ctx.fillRect(12, 16, 5, 5);
    } else if (this.state === 'CLIMBING') {
      // Climbing ladder pose alternating hands/feet
      if (step === 0) {
        ctx.fillRect(4, 19, 4, 5);
        ctx.fillRect(10, 17, 4, 5);
      } else {
        ctx.fillRect(4, 17, 4, 5);
        ctx.fillRect(10, 19, 4, 5);
      }
    } else {
      // Walking / running legs
      if (step === 0) {
        ctx.fillRect(4, 19, 4, 5);
        ctx.fillRect(10, 19, 4, 5);
      } else {
        ctx.fillRect(2, 19, 5, 5);
        ctx.fillRect(11, 19, 5, 5);
      }
    }

    // Hammer Rendering when in HAMMER state
    if (this.state === 'HAMMER') {
      ctx.save();
      const hx = 14;
      const hy = this.hammerSwingUp ? -12 : 12;

      // Hammer handle
      ctx.fillStyle = '#d97706';
      ctx.fillRect(hx, hy + 4, 4, 16);

      // Steel head
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.fillRect(hx - 4, hy, 18, 8);
      ctx.strokeRect(hx - 4, hy, 18, 8);
      ctx.restore();
    }

    ctx.restore();

    if (this.state === 'DEAD') {
      ctx.save();
      const starAngle = (performance.now() / 120);
      ctx.fillStyle = '#fde047';
      for (let s = 0; s < 4; s++) {
        const a = starAngle + (s * Math.PI) / 2;
        const sx = x + this.width / 2 + Math.cos(a) * 14;
        const sy = y - 4 + Math.sin(a) * 5;
        ctx.fillRect(sx, sy, 3, 3);
      }
      ctx.restore();
    }
  }
}
