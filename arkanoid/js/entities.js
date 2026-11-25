/**
 * Arkanoid - Entities, Kinematics, Collision Math & Rendering
 * Faithfully recreates the 1986 Taito classic with Vaus, capsules, and energy balls.
 */

export const ARENA_LEFT = 16;
export const ARENA_RIGHT = 464;
export const ARENA_TOP = 24;
export const ARENA_BOTTOM = 640;

export const PADDLE_NORMAL_WIDTH = 72;
export const PADDLE_ENLARGED_WIDTH = 104;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y = 590;

export const BALL_RADIUS = 5;
export const BASE_BALL_SPEED = 300;
export const MAX_BALL_SPEED = 480;

/**
 * Circle to Box collision helper
 */
export function circleIntersectRect(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

/**
 * The Vaus Paddle
 */
export class Paddle {
  constructor(x = 240) {
    this.x = x;
    this.y = PADDLE_Y;
    this.width = PADDLE_NORMAL_WIDTH;
    this.height = PADDLE_HEIGHT;
    this.speed = 440;

    // Power-up states
    this.laserActive = false;
    this.catchActive = false;
    this.enlarged = false;
    this.laserCooldown = 0;
  }

  reset() {
    this.x = 240;
    this.width = PADDLE_NORMAL_WIDTH;
    this.laserActive = false;
    this.catchActive = false;
    this.enlarged = false;
    this.laserCooldown = 0;
  }

  setEnlarge(active) {
    this.enlarged = active;
    this.width = active ? PADDLE_ENLARGED_WIDTH : PADDLE_NORMAL_WIDTH;
    this.clampPosition();
  }

  setLaser(active) {
    this.laserActive = active;
  }

  setCatch(active) {
    this.catchActive = active;
  }

  moveTo(targetX) {
    this.x = targetX;
    this.clampPosition();
  }

  move(dir, dt) {
    this.x += dir * this.speed * dt;
    this.clampPosition();
  }

  clampPosition() {
    const half = this.width / 2;
    if (this.x - half < ARENA_LEFT) this.x = ARENA_LEFT + half;
    if (this.x + half > ARENA_RIGHT) this.x = ARENA_RIGHT - half;
  }

  update(dt) {
    if (this.laserCooldown > 0) {
      this.laserCooldown -= dt;
    }
  }

  canFireLaser() {
    return this.laserActive && this.laserCooldown <= 0;
  }

  fireLaser() {
    if (!this.canFireLaser()) return null;
    this.laserCooldown = 0.22;
    const offset = this.width * 0.35;
    return [
      new LaserBullet(this.x - offset, this.y - 4),
      new LaserBullet(this.x + offset, this.y - 4)
    ];
  }

  render(ctx) {
    const x = this.x - this.width / 2;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    ctx.save();
    // Vaus shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x, y + 6, w, h, 6);
    ctx.fill();

    // Vaus metallic outer shell (Silver Chrome)
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.3, '#cbd5e1');
    grad.addColorStop(0.7, '#64748b');
    grad.addColorStop(1, '#334155');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vaus Red Central Control Core
    ctx.fillStyle = this.laserActive ? '#ef4444' : (this.catchActive ? '#10b981' : '#3b82f6');
    ctx.beginPath();
    ctx.roundRect(x + w * 0.3, y + 3, w * 0.4, h - 6, 3);
    ctx.fill();

    // Laser Cannon Emitters on left & right tips if laser active
    if (this.laserActive) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 4, y - 4, 4, 6);
      ctx.fillRect(x + w - 8, y - 4, 4, 6);
      ctx.fillStyle = '#fecaca';
      ctx.fillRect(x + 5, y - 5, 2, 2);
      ctx.fillRect(x + w - 7, y - 5, 2, 2);
    }

    // Catch grip surface indicator if catch active
    if (this.catchActive) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.fillRect(x + 8, y, w - 16, 2.5);
    }

    ctx.restore();
  }
}

/**
 * Energy Ball
 */
export class Ball {
  constructor(x = 240, y = 575) {
    this.x = x;
    this.y = y;
    this.radius = BALL_RADIUS;
    this.speed = BASE_BALL_SPEED;
    this.vx = 0;
    this.vy = 0;
    this.isGlued = true;
    this.gluedOffset = 0;
  }

  launch(vx = null, vy = null) {
    this.isGlued = false;
    if (vx !== null && vy !== null) {
      this.vx = vx;
      this.vy = vy;
    } else {
      const angle = (Math.random() - 0.5) * 0.6; // slight random initial angle
      this.vx = this.speed * Math.sin(angle);
      this.vy = -this.speed * Math.cos(angle);
    }
  }

  update(dt, paddle) {
    if (this.isGlued) {
      this.x = paddle.x + this.gluedOffset;
      this.y = paddle.y - this.radius - 1;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Arena Wall Collisions
    if (this.x - this.radius <= ARENA_LEFT) {
      this.x = ARENA_LEFT + this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius >= ARENA_RIGHT) {
      this.x = ARENA_RIGHT - this.radius;
      this.vx = -Math.abs(this.vx);
    }

    if (this.y - this.radius <= ARENA_TOP) {
      this.y = ARENA_TOP + this.radius;
      this.vy = Math.abs(this.vy);
    }
  }

  checkPaddleCollision(paddle) {
    if (this.isGlued || this.vy <= 0) return false;

    // Paddle bounding box
    const px = paddle.x - paddle.width / 2;
    const py = paddle.y;
    const pw = paddle.width;
    const ph = paddle.height;

    if (circleIntersectRect(this.x, this.y, this.radius, px, py, pw, ph)) {
      this.y = paddle.y - this.radius;

      // Catch power-up holds ball on paddle
      if (paddle.catchActive) {
        this.isGlued = true;
        this.gluedOffset = this.x - paddle.x;
        this.vx = 0;
        this.vy = 0;
        return true;
      }

      // Classic Arkanoid deflection angle calculation
      const hitOffset = (this.x - paddle.x) / (paddle.width / 2); // -1.0 to +1.0
      const clampedOffset = Math.max(-0.92, Math.min(0.92, hitOffset));
      const maxAngle = 1.15; // ~66 degrees
      const angle = clampedOffset * maxAngle;

      this.speed = Math.min(MAX_BALL_SPEED, this.speed + 2);
      this.vx = this.speed * Math.sin(angle);
      this.vy = -Math.abs(this.speed * Math.cos(angle));
      return true;
    }

    return false;
  }

  isOutOfBounds() {
    return this.y - this.radius > ARENA_BOTTOM;
  }

  render(ctx) {
    ctx.save();
    // Glowing cyan/white energy ball
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.x - 1, this.y - 1, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Destructible or Solid Brick
 */
export class Brick {
  constructor(x, y, type = 'red', width = 38, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.maxHits = type === 'silver' ? 2 : (type === 'gold' ? Infinity : 1);
    this.hitsRemaining = this.maxHits;
    this.alive = true;
  }

  getPoints(round = 1) {
    const pointValues = {
      white: 50,
      orange: 60,
      cyan: 70,
      green: 80,
      red: 90,
      blue: 100,
      pink: 110,
      yellow: 120,
      silver: 50 * round,
      gold: 0
    };
    return pointValues[this.type] || 50;
  }

  checkCollision(ball) {
    if (!this.alive) return false;

    if (circleIntersectRect(ball.x, ball.y, ball.radius, this.x, this.y, this.width, this.height)) {
      // Determine reflection axis based on penetration depth
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const overlapX = (this.width / 2 + ball.radius) - Math.abs(dx);
      const overlapY = (this.height / 2 + ball.radius) - Math.abs(dy);

      if (overlapX < overlapY) {
        ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      } else {
        ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
      }

      return this.hit();
    }
    return false;
  }

  hit() {
    if (this.type === 'gold') return false; // Indestructible
    this.hitsRemaining -= 1;
    if (this.hitsRemaining <= 0) {
      this.alive = false;
      return true; // Destroyed
    }
    return false; // Damaged but alive (silver)
  }

  render(ctx) {
    if (!this.alive) return;

    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    const colors = {
      white: '#f8fafc',
      orange: '#f97316',
      cyan: '#06b6d4',
      green: '#22c55e',
      red: '#ef4444',
      blue: '#3b82f6',
      pink: '#ec4899',
      yellow: '#eab308',
      silver: this.hitsRemaining === 1 ? '#94a3b8' : '#e2e8f0',
      gold: '#facc15'
    };

    ctx.save();
    // Brick bevel / border
    ctx.fillStyle = colors[this.type] || '#ef4444';
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

    // Bevel highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 1, y + 1, w - 2, 2.5);
    ctx.fillRect(x + 1, y + 1, 2.5, h - 2);

    // Bevel shadows
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x + 1, y + h - 3.5, w - 2, 2.5);
    ctx.fillRect(x + w - 3.5, y + 1, 2.5, h - 2);

    // Brick dark grid line
    ctx.strokeStyle = '#05070e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.restore();
  }
}

/**
 * Falling Power-up Capsule
 */
export class Capsule {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 14;
    this.type = type; // 'L', 'E', 'C', 'D', 'S', 'P'
    this.speed = 135;
    this.alive = true;
    this.rot = 0;
  }

  update(dt) {
    this.y += this.speed * dt;
    this.rot += dt * 4;
  }

  checkCollision(paddle) {
    if (!this.alive) return false;
    const px = paddle.x - paddle.width / 2;
    const py = paddle.y;
    const pw = paddle.width;
    const ph = paddle.height;

    if (
      this.x + this.width / 2 > px &&
      this.x - this.width / 2 < px + pw &&
      this.y + this.height / 2 > py &&
      this.y - this.height / 2 < py + ph
    ) {
      this.alive = false;
      return true;
    }
    return false;
  }

  render(ctx) {
    if (!this.alive) return;

    const colors = {
      L: '#ef4444', // Red: Laser
      E: '#3b82f6', // Blue: Enlarge
      C: '#22c55e', // Green: Catch
      D: '#06b6d4', // Cyan: Disrupt (Multi-ball)
      S: '#f97316', // Orange: Slow
      P: '#a855f7'  // Purple/Grey: Player life
    };

    ctx.save();
    ctx.translate(this.x, this.y);
    const scaleY = Math.cos(this.rot);
    ctx.scale(1, Math.abs(scaleY) < 0.2 ? 0.2 : scaleY);

    // Capsule pill body
    ctx.fillStyle = colors[this.type] || '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 7);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Capsule Letter
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type, 0, 0);

    ctx.restore();
  }
}

/**
 * Laser Projectile
 */
export class LaserBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 3;
    this.height = 12;
    this.speed = 580;
    this.alive = true;
  }

  update(dt) {
    this.y -= this.speed * dt;
    if (this.y < ARENA_TOP) this.alive = false;
  }

  checkCollision(brick) {
    if (!this.alive || !brick.alive) return false;
    if (
      this.x > brick.x &&
      this.x < brick.x + brick.width &&
      this.y < brick.y + brick.height &&
      this.y + this.height > brick.y
    ) {
      this.alive = false;
      return brick.hit();
    }
    return false;
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x - 1.5, this.y, this.width, this.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - 0.5, this.y + 2, 1, this.height - 4);
    ctx.restore();
  }
}

/**
 * Particle on Brick Destruction
 */
export class BrickParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 120;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.size = 2.5 + Math.random() * 2.5;
    this.life = 0.45;
    this.maxLife = 0.45;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 200 * dt; // gravity
    this.life -= dt;
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}
