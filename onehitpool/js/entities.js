/**
 * One Hit Pool Entities & Kinematics Engine
 */

export const BALL_RADIUS = 12;
export const INNER_RING_RADIUS = 28;
export const OUTER_RING_RADIUS = 68;
export const FRICTION_DAMPING = 0.985;
export const CUSHION_RESTITUTION = 0.85;
export const BALL_RESTITUTION = 0.95;

export const BALL_PALETTE = [
  { color: '#ef4444', name: 'Solid Red', number: 3 },
  { color: '#3b82f6', name: 'Solid Blue', number: 2 },
  { color: '#eab308', name: 'Solid Yellow', number: 1 },
  { color: '#9333ea', name: 'Solid Purple', number: 4 },
  { color: '#f97316', name: 'Solid Orange', number: 5 },
  { color: '#10b981', name: 'Solid Green', number: 6 },
  { color: '#a855f7', name: 'Solid Violet', number: 7 },
  { color: '#18181b', name: '8-Ball Black', number: 8 }
];

export class Ball {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.radius = options.radius || BALL_RADIUS;
    this.mass = options.mass || 1.0;
    this.isCueBall = Boolean(options.isCueBall);
    this.color = options.color || (this.isCueBall ? '#f8fafc' : '#ef4444');
    this.number = options.number || (this.isCueBall ? 0 : 8);
  }

  update(friction = FRICTION_DAMPING) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= friction;
    this.vy *= friction;

    // Zero out residual micro-velocities
    if (Math.hypot(this.vx, this.vy) < 0.035) {
      this.vx = 0;
      this.vy = 0;
    }
  }

  isStopped() {
    return this.vx === 0 && this.vy === 0;
  }

  getSpeed() {
    return Math.hypot(this.vx, this.vy);
  }

  draw(ctx) {
    ctx.save();

    // 1. Drop Shadow
    ctx.beginPath();
    ctx.ellipse(this.x + 2, this.y + 4, this.radius * 0.9, this.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // 2. Ball Body with 3D Radial Sphere Shading
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.35,
      this.y - this.radius * 0.35,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );

    if (this.isCueBall) {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#f1f5f9');
      grad.addColorStop(0.8, '#cbd5e1');
      grad.addColorStop(1, '#94a3b8');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, this.color);
      grad.addColorStop(0.85, this.color);
      grad.addColorStop(1, '#09090b');
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Central Number Circle for Colored Balls
    if (!this.isCueBall && this.number > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.font = `bold ${Math.round(this.radius * 0.65)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.number.toString(), this.x, this.y + 0.5);
    }

    // 4. Subtle Specular Highlight
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }
}

export class ConcentricRings {
  constructor(x, y, innerRadius = INNER_RING_RADIUS, outerRadius = OUTER_RING_RADIUS) {
    this.x = x;
    this.y = y;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.pulsePhase = 0;
  }

  update(dt = 0.016) {
    this.pulsePhase = (this.pulsePhase + dt * 2.5) % (Math.PI * 2);
  }

  evaluateBall(ball) {
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    if (dist <= this.innerRadius) {
      return { hit: true, zone: 'inner', score: 1000, dist };
    }
    if (dist <= this.outerRadius) {
      return { hit: true, zone: 'outer', score: 500, dist };
    }
    return { hit: false, zone: 'none', score: 0, dist };
  }

  draw(ctx) {
    ctx.save();
    const pulse = Math.sin(this.pulsePhase) * 2;

    // --- Outer Ring ---
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8 + pulse;
    ctx.stroke();

    // Subtle dashed accent ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.innerRadius + this.outerRadius) / 2, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Inner Ring (Bullseye) ---
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12 + pulse * 2;
    ctx.stroke();

    // --- Center Pin Dot ---
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fill();

    // Text labels
    ctx.shadowBlur = 0;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.fillText('1000', this.x, this.y - 12);

    ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
    ctx.fillText('500', this.x, this.y - (this.innerRadius + this.outerRadius) / 2);

    ctx.restore();
  }
}

/**
 * Handle ball reflection off table cushion rails
 */
export function handleCushionBounce(ball, bounds, onBounce = null) {
  let bounced = false;

  // Left Cushion
  if (ball.x - ball.radius < bounds.minX) {
    ball.x = bounds.minX + ball.radius;
    ball.vx = -ball.vx * CUSHION_RESTITUTION;
    bounced = true;
  }
  // Right Cushion
  else if (ball.x + ball.radius > bounds.maxX) {
    ball.x = bounds.maxX - ball.radius;
    ball.vx = -ball.vx * CUSHION_RESTITUTION;
    bounced = true;
  }

  // Top Cushion
  if (ball.y - ball.radius < bounds.minY) {
    ball.y = bounds.minY + ball.radius;
    ball.vy = -ball.vy * CUSHION_RESTITUTION;
    bounced = true;
  }
  // Bottom Cushion
  else if (ball.y + ball.radius > bounds.maxY) {
    ball.y = bounds.maxY - ball.radius;
    ball.vy = -ball.vy * CUSHION_RESTITUTION;
    bounced = true;
  }

  if (bounced && onBounce) {
    onBounce(ball.getSpeed());
  }

  return bounced;
}

/**
 * 2D Elastic momentum resolution between two balls
 */
export function resolveBallCollision(b1, b2, onCollision = null) {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.hypot(dx, dy);
  const minDist = b1.radius + b2.radius;

  if (dist < minDist && dist > 0.0001) {
    const nx = dx / dist;
    const ny = dy / dist;

    // Positional separation to resolve overlap
    const overlap = (minDist - dist) * 0.5;
    b1.x -= nx * overlap;
    b1.y -= ny * overlap;
    b2.x += nx * overlap;
    b2.y += ny * overlap;

    // Relative velocity along collision normal
    const k = (b1.vx - b2.vx) * nx + (b1.vy - b2.vy) * ny;

    if (k > 0) {
      const impulse = (1 + BALL_RESTITUTION) * k * 0.5;
      b1.vx -= impulse * nx;
      b1.vy -= impulse * ny;
      b2.vx += impulse * nx;
      b2.vy += impulse * ny;

      if (onCollision) {
        onCollision(k);
      }
      return true;
    }
  }

  return false;
}

/**
 * Procedural level layout generator
 * Creates non-overlapping, valid table coordinates for rings, colored ball, and cue ball
 */
export function generateValidLayout(bounds, options = {}) {
  const ringsRadius = options.ringsRadius || OUTER_RING_RADIUS;
  const ballRadius = options.ballRadius || BALL_RADIUS;
  const minBallDist = options.minBallDist || 110;
  const rng = options.rng || Math.random;

  const pad = 40;
  const ringPad = ringsRadius + 25;

  let rings = null;
  let targetBall = null;
  let cueBall = null;

  for (let attempt = 0; attempt < 200; attempt++) {
    // 1. Place Concentric Rings
    const rx = bounds.minX + ringPad + rng() * (bounds.maxX - bounds.minX - ringPad * 2);
    const ry = bounds.minY + ringPad + rng() * (bounds.maxY - bounds.minY - ringPad * 2);

    // 2. Place Colored Target Ball (must not be inside or immediately adjacent to rings)
    const tx = bounds.minX + pad + rng() * (bounds.maxX - bounds.minX - pad * 2);
    const ty = bounds.minY + pad + rng() * (bounds.maxY - bounds.minY - pad * 2);

    const distTargetToRing = Math.hypot(tx - rx, ty - ry);
    if (distTargetToRing < ringsRadius + 30) continue;

    // 3. Place Cue Ball (must not be inside rings and must be far enough from target ball)
    const cx = bounds.minX + pad + rng() * (bounds.maxX - bounds.minX - pad * 2);
    const cy = bounds.minY + pad + rng() * (bounds.maxY - bounds.minY - pad * 2);

    const distCueToRing = Math.hypot(cx - rx, cy - ry);
    if (distCueToRing < ringsRadius + 30) continue;

    const distCueToTarget = Math.hypot(cx - tx, cy - ty);
    if (distCueToTarget < minBallDist) continue;

    rings = { x: Math.round(rx), y: Math.round(ry) };
    targetBall = { x: Math.round(tx), y: Math.round(ty) };
    cueBall = { x: Math.round(cx), y: Math.round(cy) };
    break;
  }

  // Safe fallback if loop exhausted
  if (!rings || !targetBall || !cueBall) {
    rings = { x: bounds.minX + 160, y: (bounds.minY + bounds.maxY) / 2 };
    targetBall = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    cueBall = { x: bounds.maxX - 160, y: (bounds.minY + bounds.maxY) / 2 };
  }

  const ballMeta = BALL_PALETTE[Math.floor(rng() * BALL_PALETTE.length)];

  return {
    rings: new ConcentricRings(rings.x, rings.y, INNER_RING_RADIUS, OUTER_RING_RADIUS),
    targetBall: new Ball(targetBall.x, targetBall.y, {
      color: ballMeta.color,
      number: ballMeta.number,
      isCueBall: false
    }),
    cueBall: new Ball(cueBall.x, cueBall.y, {
      isCueBall: true
    })
  };
}
