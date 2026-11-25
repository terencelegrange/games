/**
 * Galactic Shooter - Entity Models & Kinematics
 */

// Cubic Bézier Curve Interpolation
export function getBezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  };
}

// Generate an authentic Galaga swooping loop path
export function generateDivePath(startX, startY, targetX, targetY, direction = 1) {
  const points = [];
  const steps = 60;
  // Control point 1: Upward loop outward
  const p0 = { x: startX, y: startY };
  const p1 = { x: startX + 80 * direction, y: startY - 60 };
  const p2 = { x: startX + 160 * direction, y: startY + 120 };
  const p3 = { x: targetX, y: targetY };

  for (let i = 0; i <= steps; i++) {
    points.push(getBezierPoint(p0, p1, p2, p3, i / steps));
  }
  return points;
}

// Generate entry wave path
export function generateEntryPath(type, startSide, targetGridX, targetGridY) {
  const points = [];
  const steps = 70;
  const startX = startSide === 'left' ? -40 : 520;
  const startY = type === 'top' ? 60 : 380;
  
  const p0 = { x: startX, y: startY };
  const p1 = { x: startSide === 'left' ? 200 : 280, y: startY + (type === 'top' ? 180 : -140) };
  const p2 = { x: startSide === 'left' ? 120 : 360, y: targetGridY + 80 };
  const p3 = { x: targetGridX, y: targetGridY };

  for (let i = 0; i <= steps; i++) {
    points.push(getBezierPoint(p0, p1, p2, p3, i / steps));
  }
  return points;
}

export class Starfield {
  constructor(width = 480, height = 640) {
    this.width = width;
    this.height = height;
    this.stars = [];
    this.colors = ['#ffffff', '#38bdf8', '#facc15', '#f472b6', '#a78bfa'];
    this.init();
  }

  init() {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 0.4 + Math.random() * 2.2,
        size: Math.random() < 0.25 ? 2 : 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  update() {
    for (const star of this.stars) {
      star.y += star.speed;
      star.twinkle += 0.05;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const star of this.stars) {
      const alpha = 0.5 + Math.sin(star.twinkle) * 0.4;
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }
}

export class Fighter {
  constructor(x = 240, y = 580) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 24;
    this.speed = 4.2;
    this.isDual = false;
    this.isCaptured = false;
    this.isCapturing = false;
    this.capturedBoss = null;
    this.captureProgress = 0;
    this.respawnTimer = 0;
    this.invulnerableTimer = 0;
    this.active = true;
  }

  getHitbox() {
    const w = this.isDual ? 56 : 28;
    return {
      x: this.x - w / 2,
      y: this.y - this.height / 2,
      width: w,
      height: this.height
    };
  }

  update(bounds = { minX: 20, maxX: 460 }) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    if (this.isCapturing && this.capturedBoss) {
      // Swirling rotation and ascension into the tractor beam
      this.captureProgress = Math.min(1, this.captureProgress + 0.015);
      const targetX = this.capturedBoss.x;
      const targetY = this.capturedBoss.y + 36;
      
      this.x += (targetX - this.x) * 0.08 + Math.sin(this.captureProgress * Math.PI * 8) * 3;
      this.y += (targetY - this.y) * 0.08;

      if (this.captureProgress >= 1 || Math.hypot(this.x - targetX, this.y - targetY) < 6) {
        this.isCapturing = false;
        this.isCaptured = true;
        this.capturedBoss.holdingShip = true;
      }
      return;
    }

    const halfW = (this.isDual ? 56 : 28) / 2;
    this.x = Math.max(bounds.minX + halfW, Math.min(bounds.maxX - halfW, this.x));
  }

  render(ctx) {
    if (!this.active) return;
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return; // Blinking invulnerability
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isCapturing) {
      // Spinning captured starfighter
      ctx.rotate(this.captureProgress * Math.PI * 6);
    }

    if (this.isDual) {
      // Left Fighter
      this.drawSingleShip(ctx, -14, 0, '#ffffff', '#ef4444', '#38bdf8');
      // Right Fighter
      this.drawSingleShip(ctx, 14, 0, '#ffffff', '#ef4444', '#38bdf8');
    } else {
      this.drawSingleShip(ctx, 0, 0, '#ffffff', '#ef4444', '#38bdf8');
    }

    ctx.restore();
  }

  drawSingleShip(ctx, offsetX, offsetY, hullColor, stripeColor, engineColor) {
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Starfighter Fuselage
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(6, 6);
    ctx.lineTo(12, 10);
    ctx.lineTo(8, 12);
    ctx.lineTo(4, 8);
    ctx.lineTo(0, 10);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-8, 12);
    ctx.lineTo(-12, 10);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    // Red Center Strip & Cockpit
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(2, 2);
    ctx.lineTo(-2, 2);
    ctx.closePath();
    ctx.fill();

    // Blue Wingtips
    ctx.fillStyle = engineColor;
    ctx.fillRect(-12, 6, 3, 5);
    ctx.fillRect(9, 6, 3, 5);

    // Exhaust Jet Glow
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(0, 14 + Math.random() * 3);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class Laser {
  constructor(x, y, vy = -9.5, isDual = false) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.width = 3;
    this.height = 12;
    this.isDual = isDual;
    this.active = true;
  }

  update() {
    this.y += this.vy;
    if (this.y < -20) this.active = false;
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.isDual ? '#4ade80' : '#38bdf8';
    ctx.shadowColor = this.isDual ? '#4ade80' : '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.restore();
  }
}

export class AlienBomb {
  constructor(x, y, vx = 0, vy = 3.6) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 3;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y > 660 || this.x < -20 || this.x > 500) {
      this.active = false;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class TractorBeam {
  constructor(boss) {
    this.boss = boss;
    this.active = false;
    this.length = 0;
    this.maxLength = 420;
    this.baseWidth = 14;
    this.bottomWidth = 80;
    this.pulse = 0;
  }

  start() {
    this.active = true;
    this.length = 0;
  }

  stop() {
    this.active = false;
    this.length = 0;
  }

  update() {
    if (!this.active) return;
    this.pulse += 0.15;
    if (this.length < this.maxLength) {
      this.length = Math.min(this.maxLength, this.length + 8);
    }
  }

  contains(player) {
    if (!this.active || this.length < 80) return false;
    const px = player.x;
    const py = player.y;
    const topY = this.boss.y + 12;
    const botY = topY + this.length;

    if (py < topY || py > botY) return false;

    // Conical width at player's y level
    const ratio = (py - topY) / this.length;
    const currentHalfWidth = (this.baseWidth + (this.bottomWidth - this.baseWidth) * ratio) / 2;

    return Math.abs(px - this.boss.x) <= currentHalfWidth;
  }

  render(ctx) {
    if (!this.active || this.length <= 0) return;
    ctx.save();
    const topX = this.boss.x;
    const topY = this.boss.y + 10;
    const botY = topY + this.length;
    const halfBot = this.bottomWidth / 2;
    const halfTop = this.baseWidth / 2;

    const grad = ctx.createLinearGradient(topX, topY, topX, botY);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    grad.addColorStop(0.5, 'rgba(192, 132, 252, 0.5)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.1)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(topX - halfTop, topY);
    ctx.lineTo(topX + halfTop, topY);
    ctx.lineTo(topX + halfBot, botY);
    ctx.lineTo(topX - halfBot, botY);
    ctx.closePath();
    ctx.fill();

    // Swirling rings in tractor beam
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    const rings = 6;
    for (let i = 1; i <= rings; i++) {
      const ringRatio = ((i / rings) + (this.pulse * 0.1)) % 1;
      const ringY = topY + ringRatio * this.length;
      const ringHalfW = (halfTop + (halfBot - halfTop) * ringRatio) * (0.8 + Math.sin(this.pulse + i) * 0.2);
      ctx.beginPath();
      ctx.ellipse(topX, ringY, ringHalfW, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Enemy {
  constructor(type, gridCol, gridRow, targetX, targetY) {
    this.type = type; // 'boss', 'butterfly', 'bee'
    this.gridCol = gridCol;
    this.gridRow = gridRow;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = targetX;
    this.y = targetY;
    this.width = 24;
    this.height = 20;
    this.state = 'formation'; // 'entry', 'formation', 'diving', 'tractor', 'returning'
    this.hp = type === 'boss' ? 2 : 1;
    this.points = type === 'boss' ? 150 : (type === 'butterfly' ? 80 : 50);
    this.flightPoints = type === 'boss' ? 400 : (type === 'butterfly' ? 160 : 100);
    this.path = [];
    this.pathIndex = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.holdingShip = false;
    this.tractorBeam = type === 'boss' ? new TractorBeam(this) : null;
    this.tractorDuration = 0;
    this.active = true;
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  setPath(pathPoints) {
    this.path = pathPoints;
    this.pathIndex = 0;
  }

  update(formationOffset = { x: 0, y: 0 }) {
    this.animTimer++;
    if (this.animTimer % 12 === 0) {
      this.animFrame = (this.animFrame + 1) % 2;
    }

    if (this.state === 'formation') {
      this.x = this.targetX + formationOffset.x;
      this.y = this.targetY + formationOffset.y;
      return;
    }

    if (this.state === 'entry' || this.state === 'diving') {
      if (this.path && this.pathIndex < this.path.length) {
        const pt = this.path[this.pathIndex];
        this.x = pt.x;
        this.y = pt.y;
        this.pathIndex++;

        // If boss reaches midpoint in dive, randomly activate tractor beam
        if (this.type === 'boss' && !this.holdingShip && this.state === 'diving' && this.pathIndex === 30 && Math.random() < 0.45) {
          this.state = 'tractor';
          this.tractorDuration = 180;
          this.tractorBeam.start();
        }
      } else {
        if (this.state === 'entry') {
          this.state = 'formation';
        } else {
          // Loop back from top of screen into formation
          this.y = -20;
          this.state = 'returning';
        }
      }
      return;
    }

    if (this.state === 'tractor') {
      this.tractorBeam.update();
      this.tractorDuration--;
      if (this.tractorDuration <= 0) {
        this.tractorBeam.stop();
        this.state = 'diving';
      }
      return;
    }

    if (this.state === 'returning') {
      const dx = (this.targetX + formationOffset.x) - this.x;
      const dy = (this.targetY + formationOffset.y) - this.y;
      this.x += dx * 0.08;
      this.y += dy * 0.08;

      if (Math.hypot(dx, dy) < 4) {
        this.state = 'formation';
      }
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'boss') {
      this.drawBoss(ctx);
    } else if (this.type === 'butterfly') {
      this.drawButterfly(ctx);
    } else {
      this.drawBee(ctx);
    }

    // Render captured ship above holding boss
    if (this.holdingShip) {
      this.drawCapturedShip(ctx);
    }

    ctx.restore();

    if (this.tractorBeam && this.state === 'tractor') {
      this.tractorBeam.render(ctx);
    }
  }

  drawBoss(ctx) {
    // 2-Hit color change: Green (normal) -> Blue (damaged)
    const primary = this.hp === 2 ? '#22c55e' : '#38bdf8';
    const accent = '#facc15';

    ctx.fillStyle = primary;
    // Horns / Crown
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-6, -12);
    ctx.lineTo(-2, -6);
    ctx.lineTo(2, -6);
    ctx.lineTo(6, -12);
    ctx.lineTo(10, -8);
    ctx.lineTo(8, 2);
    ctx.lineTo(-8, 2);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = primary;
    const flap = this.animFrame === 0 ? 0 : 2;
    ctx.fillRect(-12, -2 + flap, 4, 8);
    ctx.fillRect(8, -2 + flap, 4, 8);
  }

  drawButterfly(ctx) {
    ctx.fillStyle = '#ef4444';
    // Head & Antennae
    ctx.fillRect(-2, -8, 4, 4);
    ctx.fillRect(-4, -10, 2, 2);
    ctx.fillRect(2, -10, 2, 2);

    // Wings
    ctx.fillStyle = '#f87171';
    const flap = this.animFrame === 0 ? 0 : 3;
    ctx.beginPath();
    ctx.moveTo(-10, -4 + flap);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-8, 8 - flap);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -4 + flap);
    ctx.lineTo(2, 0);
    ctx.lineTo(8, 8 - flap);
    ctx.closePath();
    ctx.fill();

    // Center Torso
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-2, -2, 4, 8);
  }

  drawBee(ctx) {
    ctx.fillStyle = '#38bdf8';
    // Head & Mandibles
    ctx.fillRect(-2, -6, 4, 4);

    // Striped Body
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, -2, 8, 4);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-4, 2, 8, 4);

    // Wings Flapping
    ctx.fillStyle = '#e0f2fe';
    const flap = this.animFrame === 0 ? -1 : 2;
    ctx.fillRect(-8, -4 + flap, 4, 6);
    ctx.fillRect(4, -4 + flap, 4, 6);
  }

  drawCapturedShip(ctx) {
    ctx.save();
    ctx.translate(0, -22);
    ctx.fillStyle = '#ef4444'; // Red captured starfighter
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(4, 4);
    ctx.lineTo(8, 6);
    ctx.lineTo(0, 6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export class ExplosionParticle {
  constructor(x, y, color = '#facc15') {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.alpha = 1;
    this.size = 2 + Math.random() * 3;
    this.life = 25 + Math.floor(Math.random() * 15);
    this.maxLife = this.life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
