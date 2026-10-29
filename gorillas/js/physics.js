/**
 * Gorillas Ballistic Physics Engine
 * Handles 2D projectile kinematics with gravity and dynamic lateral wind acceleration,
 * trajectory simulation for aiming / AI, and terrain crater deformation.
 */

export const GRAVITY = 280; // px/s^2 downward acceleration
export const WIND_FACTOR = 16; // Multiplier from wind MPH to px/s^2 horizontal acceleration
export const VELOCITY_SCALE = 4.2; // Multiplier from input velocity units (1-100) to px/s

/**
 * Computes initial vx, vy based on thrower orientation and input angle (0-90 degrees)
 * @param {number} angleDeg - Angle in degrees (0 = flat horizontal, 90 = vertical straight up)
 * @param {number} velocity - Launch power (typically 1 - 100)
 * @param {boolean} facingRight - True if throwing toward the right (Player 1), False if throwing left (Player 2 / AI)
 */
export function calculateInitialVelocity(angleDeg, velocity, facingRight = true) {
  const rad = (Math.max(0, Math.min(90, angleDeg)) * Math.PI) / 180;
  const speed = Math.max(1, velocity) * VELOCITY_SCALE;
  const vx = speed * Math.cos(rad) * (facingRight ? 1 : -1);
  const vy = -speed * Math.sin(rad); // Negative because canvas Y grows downward
  return { vx, vy };
}

/**
 * Simulates ballistic trajectory path points
 */
export function simulateTrajectory(startX, startY, angleDeg, velocity, facingRight, windSpeed, maxDuration = 5.0, timeStep = 0.05) {
  const points = [];
  let { vx, vy } = calculateInitialVelocity(angleDeg, velocity, facingRight);
  const windAccel = windSpeed * WIND_FACTOR;
  let x = startX;
  let y = startY;

  for (let t = 0; t <= maxDuration; t += timeStep) {
    points.push({ x, y });
    vx += windAccel * timeStep;
    vy += GRAVITY * timeStep;
    x += vx * timeStep;
    y += vy * timeStep;

    // Terminate if far off screen bottom
    if (y > 650) break;
  }

  return points;
}

/**
 * Checks intersection between circle and an axis-aligned bounding box (AABB)
 */
export function checkCircleAABB(cx, cy, r, bx, by, bw, bh) {
  const closestX = Math.max(bx, Math.min(cx, bx + bw));
  const closestY = Math.max(by, Math.min(cy, by + bh));
  const distX = cx - closestX;
  const distY = cy - closestY;
  return distX * distX + distY * distY <= r * r;
}

/**
 * Checks intersection between two circles
 */
export function checkCircleCircle(c1x, c1y, r1, c2x, c2y, r2) {
  const dx = c2x - c1x;
  const dy = c2y - c1y;
  const rSum = r1 + r2;
  return dx * dx + dy * dy <= rSum * rSum;
}

/**
 * Carves an explosive blast crater into a canvas context using destination-out blending
 */
export function carveCrater(ctx, x, y, radius = 24) {
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Banana projectile entity
 */
export class Banana {
  constructor({ x, y, angleDeg, velocity, facingRight, windSpeed, throwerId = 1 }) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    const initialV = calculateInitialVelocity(angleDeg, velocity, facingRight);
    this.vx = initialV.vx;
    this.vy = initialV.vy;
    this.windSpeed = windSpeed;
    this.radius = 6;
    this.rotation = 0;
    this.rotSpeed = (facingRight ? 1 : -1) * 12; // Angular rotation speed
    this.active = true;
    this.trail = [];
    this.maxTrail = 16;
    this.throwerId = throwerId;
    this.age = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;

    // Apply wind and gravity
    const windAccel = this.windSpeed * WIND_FACTOR;
    this.vx += windAccel * dt;
    this.vy += GRAVITY * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;

    // Update smoke trail
    this.trail.push({ x: this.x, y: this.y, life: 1.0 });
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
    for (const p of this.trail) {
      p.life -= dt * 1.5;
    }
    this.trail = this.trail.filter(p => p.life > 0);
  }

  render(ctx) {
    if (!ctx) return;

    // Render smoke trail
    for (const p of this.trail) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.life * 0.4)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (!this.active) return;

    // Render rotating pixel banana
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Banana crescent shape
    ctx.fillStyle = '#ffff00'; // EGA Yellow
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker tips & outline
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#854d0e'; // Banana stem tip
    ctx.fillRect(5, -1, 3, 2);

    ctx.restore();
  }
}
