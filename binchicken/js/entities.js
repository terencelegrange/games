/**
 * Bin Chicken - Entities, Kinematics, Canvas Pixel Rendering & Collision Math
 * Stars the Australian Sacred Ibis (Threskiornis molucca)
 */

export const GRAVITY = 900;          // px/s^2
export const FLAP_IMPULSE = -310;     // px/s upward burst
export const TERMINAL_VELOCITY = 520; // px/s max fall speed
export const BASE_SCROLL_SPEED = 145; // px/s obstacle scroll speed
export const BIN_WIDTH = 64;          // px width of wheelie bin column
export const GAP_SIZE = 152;          // px vertical clearance between bins
export const GROUND_Y = 550;          // px height where curb/ground begins

/**
 * Circle to Axis-Aligned Bounding Box (AABB) intersection
 */
export function circleIntersectsRect(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

/**
 * The Hero: Australian Sacred Ibis ("Bin Chicken")
 */
export class BinChicken {
  constructor(x = 110, y = 260) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vy = 0;
    this.angle = 0;
    this.targetAngle = 0;
    this.radius = 16; // Tight collision radius for fair gameplay
    this.wingPhase = 0;
    this.isFlapping = false;
    this.flapTimer = 0;
    this.isDead = false;
    this.idleHoverTimer = 0;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vy = 0;
    this.angle = 0;
    this.targetAngle = 0;
    this.wingPhase = 0;
    this.isFlapping = false;
    this.flapTimer = 0;
    this.isDead = false;
    this.idleHoverTimer = 0;
  }

  flap() {
    if (this.isDead) return false;
    this.vy = FLAP_IMPULSE;
    this.targetAngle = -0.44; // ~ -25 degrees pitch up
    this.isFlapping = true;
    this.flapTimer = 0.16;
    return true;
  }

  updateIdle(dt) {
    this.idleHoverTimer += dt * 4;
    this.y = this.startY + Math.sin(this.idleHoverTimer) * 12;
    this.angle = Math.sin(this.idleHoverTimer) * 0.08;
    this.wingPhase += dt * 6;
  }

  update(dt) {
    if (this.isDead) {
      // Tumble to the ground on death
      this.vy += GRAVITY * dt * 1.2;
      this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
      this.y += this.vy * dt;
      this.angle = Math.min(Math.PI / 2, this.angle + dt * 6);
      if (this.y > GROUND_Y - this.radius) {
        this.y = GROUND_Y - this.radius;
        this.vy = 0;
      }
      return;
    }

    // Kinematics: gravity and velocity
    this.vy += GRAVITY * dt;
    this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
    this.y += this.vy * dt;

    // Ceiling clamp (soft bounce or limit)
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = 0;
    }

    // Wing animation timer
    if (this.flapTimer > 0) {
      this.flapTimer -= dt;
      this.wingPhase += dt * 26; // Rapid wing flap
    } else {
      this.isFlapping = false;
      this.wingPhase += dt * 4; // Idle gentle glide
    }

    // Aerodynamic Pitch Angle based on vertical velocity
    if (this.vy < 0) {
      // Pitching up during flap
      this.angle = Math.max(-0.48, this.targetAngle);
    } else {
      // Nosing down into dive as descent gathers speed
      const diveFactor = Math.min(1.0, this.vy / TERMINAL_VELOCITY);
      const diveAngle = -0.2 + diveFactor * 1.4; // up to ~70 degrees nose down
      this.angle += (diveAngle - this.angle) * Math.min(1.0, dt * 7.5);
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius
    };
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shadow underneath in high sunlight
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Black spindly legs trailing behind
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    // Back leg
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-28, 14);
    ctx.stroke();
    // Front leg
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(-20, 12);
    ctx.lineTo(-24, 16);
    ctx.stroke();

    // 2. Black ragged tail plumes (classic scruffy Ibis rump)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-22, 6);
    ctx.lineTo(-26, 10);
    ctx.lineTo(-12, 7);
    ctx.closePath();
    ctx.fill();

    // 3. Main White Plumage Body
    ctx.fillStyle = '#f8fafc'; // Crisp white
    ctx.beginPath();
    ctx.ellipse(-2, 2, 17, 12, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Subtle feather body shading
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(-4, 6, 13, 7, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // 4. White & Black-tipped Wings (Flapping animation)
    const wingYOffset = Math.sin(this.wingPhase) * 11;
    ctx.save();
    ctx.translate(-4, 0);

    // Wing body
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(0, wingYOffset, 12, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Black secondary flight feather tips
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-8, wingYOffset + 1, 4, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Bare Bald Black Neck & Head
    ctx.fillStyle = '#090d16'; // Deep charcoal/black bald skin
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Graceful curved S-neck
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.quadraticCurveTo(18, -2, 16, -10);
    ctx.stroke();

    // Bald head bulb
    ctx.beginPath();
    ctx.arc(16, -10, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye (dark with tiny glint)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(17.5, -11, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. The Iconic Decurved Downward-bent Black Bill
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(19, -9);
    ctx.quadraticCurveTo(28, -6, 34, 4); // Distinctive downwards arc
    ctx.stroke();

    // Bill sharp taper tip
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(35, 6);
    ctx.stroke();

    // 7. Tiny Golden Hot Chip crumb dangling from beak tip!
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(33, 4, 5, 3, 1);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Bonus Item: Golden Aussie Hot Chip
 */
export class HotChip {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.radius = 12;
    this.collected = false;
    this.bobTimer = Math.random() * Math.PI * 2;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.bobTimer += dt * 5;
    this.y = this.baseY + Math.sin(this.bobTimer) * 8;
  }

  checkCollision(chicken) {
    if (this.collected) return false;
    const dx = this.x - chicken.x;
    const dy = this.y - chicken.y;
    const distSq = dx * dx + dy * dy;
    const hitRadius = this.radius + chicken.radius;
    if (distSq < hitRadius * hitRadius) {
      this.collected = true;
      return true;
    }
    return false;
  }

  render(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Warm golden glow
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;

    // Golden Hot Chip body (thick cut hot chip)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-10, -5, 20, 10, 3);
    ctx.fill();

    // Crispy golden highlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 3, 1.5);
    ctx.fill();

    // Salt flecks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -1, 2, 2);
    ctx.fillRect(3, 1, 2, 2);
    ctx.fillRect(-6, 1, 1.5, 1.5);

    ctx.restore();
  }
}

/**
 * Obstacle Pair: Aussie Council Wheelie Bins (Top & Bottom columns)
 */
export class WheelieBinPair {
  constructor(x, gapY = null, gapSize = GAP_SIZE) {
    this.x = x;
    this.width = BIN_WIDTH;
    this.gapSize = gapSize;
    this.passed = false;

    // Minimum distance from top and bottom
    const minGapY = 125;
    const maxGapY = GROUND_Y - gapSize - 60;
    this.gapY = gapY !== null ? gapY : Math.floor(minGapY + Math.random() * (maxGapY - minGapY));

    // Top obstacle spans from 0 to gapY
    this.topHeight = this.gapY;
    // Bottom obstacle spans from gapY + gapSize to GROUND_Y
    this.bottomY = this.gapY + this.gapSize;
    this.bottomHeight = GROUND_Y - this.bottomY;

    // Council lid color variant (Red = General Waste, Yellow = Recycling, Lime = FOGO)
    const colors = ['#ef4444', '#eab308', '#84cc16'];
    this.lidColor = colors[Math.floor(Math.random() * colors.length)];

    // 40% chance of spawning a bonus hot chip in the center of the gap
    this.chip = Math.random() < 0.45 ? new HotChip(this.x + this.width / 2, this.gapY + this.gapSize / 2) : null;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    if (this.chip) {
      this.chip.update(dt, speed);
    }
  }

  isOffScreen() {
    return this.x + this.width < -30;
  }

  checkCollision(chicken) {
    const cb = chicken.getBounds();

    // 1. Top Obstacle AABB Collision
    if (circleIntersectsRect(cb.x, cb.y, cb.radius - 2, this.x, 0, this.width, this.topHeight)) {
      return true;
    }

    // 2. Bottom Obstacle AABB Collision
    if (circleIntersectsRect(cb.x, cb.y, cb.radius - 2, this.x, this.bottomY, this.width, this.bottomHeight)) {
      return true;
    }

    return false;
  }

  render(ctx) {
    // 1. Render bonus chip if present
    if (this.chip) {
      this.chip.render(ctx);
    }

    const bx = this.x;
    const bw = this.width;

    // -------------------------------------------------------------
    // TOP OBSTACLE (Inverted / Overhead utility column + Wheelie Bin)
    // -------------------------------------------------------------
    ctx.save();
    // Metal support pole extending from sky ceiling
    ctx.fillStyle = '#475569';
    ctx.fillRect(bx + 14, 0, bw - 28, this.topHeight - 65);
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx + 16, 0, 4, this.topHeight - 65); // shadow line

    // Inverted Top Wheelie Bin
    const topBinY = this.topHeight - 65;
    const topBinH = 65;

    // Bin body (molded dark green plastic)
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.roundRect(bx + 4, topBinY, bw - 8, topBinH - 12, [0, 0, 4, 4]);
    ctx.fill();

    // Bin highlights & side ribs
    ctx.fillStyle = '#047857';
    ctx.fillRect(bx + 8, topBinY, 6, topBinH - 14);
    ctx.fillRect(bx + bw - 14, topBinY, 6, topBinH - 14);

    // Council logo stripe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(bx + 16, topBinY + 12, bw - 32, 6);

    // Top Bin Lid (facing gap)
    ctx.fillStyle = this.lidColor;
    ctx.beginPath();
    ctx.roundRect(bx, this.topHeight - 12, bw, 12, [0, 0, 6, 6]);
    ctx.fill();

    // Inverted Bin Wheels at top
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bx + 6, topBinY + 8, 7, 0, Math.PI * 2);
    ctx.arc(bx + bw - 6, topBinY + 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(bx + 6, topBinY + 8, 2.5, 0, Math.PI * 2);
    ctx.arc(bx + bw - 6, topBinY + 8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // -------------------------------------------------------------
    // BOTTOM OBSTACLE (Aussie Council Wheelie Bin + Extension)
    // -------------------------------------------------------------
    const bY = this.bottomY;
    const bH = this.bottomHeight;

    // Upright Wheelie Bin Lid at top of bottom column
    ctx.fillStyle = this.lidColor;
    ctx.beginPath();
    ctx.roundRect(bx, bY, bw, 14, [6, 6, 2, 2]);
    ctx.fill();

    // Lid handle grip
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bx + bw / 2 - 12, bY - 4, 24, 4);

    // Bin molded plastic main body
    ctx.fillStyle = '#064e3b'; // Council green
    ctx.beginPath();
    ctx.roundRect(bx + 4, bY + 14, bw - 8, Math.min(bH - 14, 110), [0, 0, 8, 8]);
    ctx.fill();

    // Plastic side ribs
    ctx.fillStyle = '#047857';
    ctx.fillRect(bx + 8, bY + 18, 6, Math.min(bH - 24, 98));
    ctx.fillRect(bx + bw - 14, bY + 18, 6, Math.min(bH - 24, 98));

    // Australian Council emblem stamp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, bY + 45, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(bx + bw / 2, bY + 45, 6, 0, Math.PI * 2);
    ctx.fill();

    // Black sturdy rubber wheels at the base of the bin
    const wheelY = bY + Math.min(bH - 10, 110);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bx + 6, wheelY, 9, 0, Math.PI * 2);
    ctx.arc(bx + bw - 6, wheelY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(bx + 6, wheelY, 3, 0, Math.PI * 2);
    ctx.arc(bx + bw - 6, wheelY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Curb pedestal extension if obstacle extends deeper down
    if (bH > 120) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(bx + 8, bY + 120, bw - 16, bH - 120);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx + 8, bY + 120, 4, bH - 120);
    }

    ctx.restore();
  }
}

/**
 * Parallax Background: Australian City Park & Curbside
 */
export class ParallaxBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.skyScroll = 0;
    this.cityScroll = 0;
    this.treeScroll = 0;
    this.roadScroll = 0;
  }

  update(dt, speed) {
    this.skyScroll = (this.skyScroll + speed * 0.08 * dt) % this.width;
    this.cityScroll = (this.cityScroll + speed * 0.22 * dt) % this.width;
    this.treeScroll = (this.treeScroll + speed * 0.55 * dt) % this.width;
    this.roadScroll = (this.roadScroll + speed * dt) % 40;
  }

  render(ctx) {
    const w = this.width;

    // 1. Sky Gradient (Sunny Australian afternoon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#0284c7');   // Vivid summer sky
    skyGrad.addColorStop(0.55, '#38bdf8'); // Azure
    skyGrad.addColorStop(1, '#bae6fd');   // Soft horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, GROUND_Y);

    // Warm summer sun
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(w - 70, 75, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(w - 70, 75, 26, 0, Math.PI * 2);
    ctx.fill();

    // 2. Distant City Skyline Silhouette (Sydney / Brisbane tower silhouette)
    ctx.save();
    ctx.translate(-this.cityScroll, 0);
    for (let offset = 0; offset <= w + this.cityScroll; offset += w) {
      ctx.fillStyle = '#0369a1';
      // Centrepoint tower spire
      ctx.fillRect(offset + 60, GROUND_Y - 210, 10, 110);
      ctx.beginPath();
      ctx.arc(offset + 65, GROUND_Y - 180, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(offset + 64, GROUND_Y - 240, 2, 35);

      // Office skyscrapers
      ctx.fillRect(offset + 95, GROUND_Y - 165, 45, 65);
      ctx.fillRect(offset + 155, GROUND_Y - 195, 38, 95);
      ctx.fillRect(offset + 210, GROUND_Y - 145, 50, 45);
      ctx.fillRect(offset + 280, GROUND_Y - 180, 42, 80);
      ctx.fillRect(offset + 345, GROUND_Y - 155, 48, 55);
      ctx.fillRect(offset + 410, GROUND_Y - 200, 36, 100);
    }
    ctx.restore();

    // 3. Midground: Eucalyptus Gum Trees & Park Greenery
    ctx.save();
    ctx.translate(-this.treeScroll, 0);
    for (let offset = 0; offset <= w + this.treeScroll; offset += w) {
      ctx.fillStyle = '#047857';
      // Tree trunks
      ctx.fillStyle = '#78716c';
      ctx.fillRect(offset + 35, GROUND_Y - 120, 8, 50);
      ctx.fillRect(offset + 185, GROUND_Y - 135, 10, 65);
      ctx.fillRect(offset + 340, GROUND_Y - 125, 9, 55);

      // Gum tree foliage crowns
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(offset + 39, GROUND_Y - 135, 26, 0, Math.PI * 2);
      ctx.arc(offset + 190, GROUND_Y - 150, 34, 0, Math.PI * 2);
      ctx.arc(offset + 345, GROUND_Y - 140, 28, 0, Math.PI * 2);
      ctx.fill();

      // Park bench & discarded chip wrapper
      ctx.fillStyle = '#b45309';
      ctx.fillRect(offset + 115, GROUND_Y - 82, 36, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offset + 140, GROUND_Y - 74, 8, 4); // chip wrapper
    }
    ctx.restore();

    // 4. Foreground: Grassy Park Lawn & Road Curb
    // Lush green park grass
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, GROUND_Y - 70, w, 32);

    // Concrete curb stone
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, GROUND_Y - 38, w, 14);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, GROUND_Y - 38, w, 3); // curb edge highlight

    // Asphalt street road
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, GROUND_Y - 24, w, this.height - (GROUND_Y - 24));

    // Road dashed white line
    ctx.fillStyle = '#f8fafc';
    for (let rx = -this.roadScroll; rx < w; rx += 40) {
      ctx.fillRect(rx, GROUND_Y + 28, 22, 5);
    }
  }
}

/**
 * Visual FX Particle: White feather puffs, chip crumbs, and collision sparks
 */
export class FeatherParticle {
  constructor(x, y, vx, vy, color = '#f8fafc', size = 4, life = 0.5) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 220 * dt; // gravity
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
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
