/**
 * Meteor Strike - Entities, Vector Kinematics, Wrap-around Physics & Rendering
 * Classic 1979 vector space combat mechanics.
 */

export function wrapPosition(obj, width, height, margin = 20) {
  if (obj.x < -margin) obj.x = width + margin;
  else if (obj.x > width + margin) obj.x = -margin;
  if (obj.y < -margin) obj.y = height + margin;
  else if (obj.y > height + margin) obj.y = -margin;
}

export function distanceSq(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Player Ship
 */
export class Ship {
  constructor(x = 400, y = 300) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2; // Pointing upwards
    this.radius = 10;
    this.rotationSpeed = 4.4; // rad/s
    this.thrustPower = 340;  // px/s^2
    this.friction = 0.985;
    this.isThrusting = false;
    this.invulnerableTimer = 2.5;
    this.alive = true;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.isThrusting = false;
    this.invulnerableTimer = 2.5;
    this.alive = true;
  }

  rotate(dir, dt) {
    this.angle += dir * this.rotationSpeed * dt;
  }

  thrust(active, dt) {
    this.isThrusting = active;
    if (active) {
      this.vx += Math.cos(this.angle) * this.thrustPower * dt;
      this.vy += Math.sin(this.angle) * this.thrustPower * dt;

      // Cap max speed
      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = 420;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    }
  }

  hyperspace(arenaWidth, arenaHeight) {
    this.x = 40 + Math.random() * (arenaWidth - 80);
    this.y = 40 + Math.random() * (arenaHeight - 80);
    this.vx = 0;
    this.vy = 0;
    this.invulnerableTimer = 0.8;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Zero-g space friction/damping
    this.vx *= Math.pow(this.friction, dt * 60);
    this.vy *= Math.pow(this.friction, dt * 60);

    wrapPosition(this, width, height, 15);

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    // Invulnerability flashing
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Vector Phosphor Glow
    ctx.strokeStyle = '#22c55e';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Classic Triangular Vector Wedge
    ctx.beginPath();
    ctx.moveTo(14, 0);           // Nose tip
    ctx.lineTo(-10, -9);         // Left wing
    ctx.lineTo(-6, 0);           // Inner engine notch
    ctx.lineTo(-10, 9);          // Right wing
    ctx.closePath();
    ctx.stroke();

    // Thruster flame flicker when accelerating
    if (this.isThrusting && Math.random() < 0.85) {
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-16 - Math.random() * 8, 0);
      ctx.lineTo(-6, 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Procedural Vector Asteroid
 */
export class Asteroid {
  constructor(x, y, tier = 'large', vx = null, vy = null) {
    this.x = x;
    this.y = y;
    this.tier = tier; // 'large', 'medium', 'small'

    const config = {
      large: { radius: 40, points: 20, baseSpeed: 55 },
      medium: { radius: 22, points: 50, baseSpeed: 95 },
      small: { radius: 12, points: 100, baseSpeed: 145 }
    }[tier];

    this.radius = config.radius;
    this.points = config.points;

    if (vx !== null && vy !== null) {
      this.vx = vx;
      this.vy = vy;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const spd = config.baseSpeed * (0.75 + Math.random() * 0.5);
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
    }

    this.rot = 0;
    this.rotSpeed = (Math.random() - 0.5) * 1.8;

    // Generate irregular polygon vertices
    const vertexCount = 10 + Math.floor(Math.random() * 4);
    this.offsets = [];
    for (let i = 0; i < vertexCount; i++) {
      const radVar = (Math.random() - 0.5) * (this.radius * 0.45);
      this.offsets.push(this.radius + radVar);
    }
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.rotSpeed * dt;
    wrapPosition(this, width, height, this.radius + 10);
  }

  split() {
    if (this.tier === 'large') {
      const angle = Math.random() * Math.PI * 2;
      return [
        new Asteroid(this.x, this.y, 'medium', Math.cos(angle) * 100, Math.sin(angle) * 100),
        new Asteroid(this.x, this.y, 'medium', -Math.cos(angle) * 100, -Math.sin(angle) * 100)
      ];
    } else if (this.tier === 'medium') {
      const angle = Math.random() * Math.PI * 2;
      return [
        new Asteroid(this.x, this.y, 'small', Math.cos(angle) * 155, Math.sin(angle) * 155),
        new Asteroid(this.x, this.y, 'small', -Math.cos(angle) * 155, -Math.sin(angle) * 155)
      ];
    }
    return [];
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    ctx.strokeStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const count = this.offsets.length;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const r = this.offsets[i];
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Player Laser Bullet
 */
export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const speed = 640;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2.5;
    this.life = 1.15;
    this.alive = true;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    wrapPosition(this, width, height, 5);
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Alien Flying Saucer (Large & Small)
 */
export class Saucer {
  constructor(arenaWidth, arenaHeight, isSmall = false) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;
    this.isSmall = isSmall;
    this.radius = isSmall ? 10 : 18;
    this.points = isSmall ? 1000 : 200;

    // Spawns on left or right edge
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -20 : arenaWidth + 20;
    this.y = 80 + Math.random() * (arenaHeight - 160);

    const baseSpeed = isSmall ? 140 : 90;
    this.vx = this.direction * baseSpeed;
    this.vy = 0;
    this.sineTimer = 0;
    this.shootTimer = 1.3;
    this.alive = true;
  }

  update(dt, targetShip) {
    this.sineTimer += dt * 3;
    this.vy = Math.sin(this.sineTimer) * 45;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (
      (this.direction === 1 && this.x > this.arenaWidth + 30) ||
      (this.direction === -1 && this.x < -30)
    ) {
      this.alive = false;
    }
  }

  canShoot(dt) {
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.isSmall ? 1.4 : 1.9;
      return true;
    }
    return false;
  }

  getShotAngle(targetShip) {
    if (this.isSmall && targetShip.alive) {
      // Accurate shot toward ship with small variance
      const dx = targetShip.x - this.x;
      const dy = targetShip.y - this.y;
      return Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.22;
    }
    // Large saucer fires in random direction
    return Math.random() * Math.PI * 2;
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.strokeStyle = this.isSmall ? '#ef4444' : '#f59e0b';
    ctx.shadowColor = this.isSmall ? '#f87171' : '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const r = this.radius;

    // Vector Saucer Hull
    ctx.beginPath();
    // Bottom rim
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.5, r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.4);
    ctx.closePath();
    ctx.stroke();

    // Top cockpit dome
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(-r * 0.3, -r * 0.5);
    ctx.lineTo(r * 0.3, -r * 0.5);
    ctx.lineTo(r * 0.6, 0);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Alien Saucer Projectile
 */
export class SaucerBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const speed = 400;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2.5;
    this.life = 1.3;
    this.alive = true;
  }

  update(dt, width, height) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
    wrapPosition(this, width, height, 5);
  }

  render(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Vector Line Explosion Particle
 */
export class VectorParticle {
  constructor(x, y, color = '#f8fafc') {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 160;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.life = 0.5 + Math.random() * 0.4;
    this.maxLife = this.life;
    this.len = 3 + Math.random() * 5;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
    ctx.stroke();
    ctx.restore();
  }
}
