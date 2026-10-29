/**
 * Sharpshooter Central Crosshair Reticle & Hitbox Engine
 * Fixed in center of screen with 80s arcade vector aesthetics, recoil, and muzzle flash.
 */

export class Crosshair {
  constructor(canvasWidth = 900, canvasHeight = 500) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;

    this.baseRadius = 38;
    this.hitRadius = 30; // Radius tolerance for scoring a hit

    this.recoilScale = 1.0;
    this.muzzleFlashTimer = 0; // Duration in seconds
    this.flashOpacity = 0;

    this.sparks = [];
  }

  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.x = width / 2;
    this.y = height / 2;
  }

  // Trigger gun firing recoil and muzzle blast
  fire() {
    this.recoilScale = 1.35;
    this.muzzleFlashTimer = 0.09;
    this.flashOpacity = 0.85;

    // Emit brief gun smoke / spark burst
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.sparks.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.2 + Math.random() * 0.15,
        maxLife: 0.35,
        color: Math.random() > 0.4 ? '#fef08a' : '#f97316',
        size: 2 + Math.random() * 3
      });
    }
  }

  // Check if a moving target overlaps the central crosshair
  checkHit(target) {
    if (!target || !target.active || target.state === 'hit') {
      return { hit: false, bullseye: false, distance: 999 };
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Hit tolerance: target radius + crosshair hit radius
    const hitTolerance = this.hitRadius + target.radius;
    const hit = dist <= hitTolerance;
    const bullseye = dist <= 14;

    return {
      hit,
      bullseye,
      distance: dist
    };
  }

  update(dt = 1 / 60) {
    // Decay recoil scale
    if (this.recoilScale > 1.0) {
      this.recoilScale = Math.max(1.0, this.recoilScale - dt * 2.8);
    }

    // Decay muzzle flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      this.flashOpacity = Math.max(0, this.muzzleFlashTimer / 0.09);
    } else {
      this.flashOpacity = 0;
    }

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Muzzle Flash Overlay
    if (this.flashOpacity > 0.01) {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(
        this.x, this.y, 10,
        this.x, this.y, 180
      );
      flashGrad.addColorStop(0, `rgba(255, 255, 230, ${this.flashOpacity})`);
      flashGrad.addColorStop(0.3, `rgba(253, 224, 71, ${this.flashOpacity * 0.7})`);
      flashGrad.addColorStop(0.7, `rgba(249, 115, 22, ${this.flashOpacity * 0.3})`);
      flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Firing Sparks
    for (const s of this.sparks) {
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 3. Central Arcade Crosshair Reticle
    const r = this.baseRadius * this.recoilScale;
    const innerR = 14 * this.recoilScale;

    // Outer Glow Circle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Concentric Precision Ring
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Tick Marks (Top, Bottom, Left, Right)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;

    // Left line
    ctx.beginPath();
    ctx.moveTo(this.x - r - 16, this.y);
    ctx.lineTo(this.x - innerR - 2, this.y);
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(this.x + innerR + 2, this.y);
    ctx.lineTo(this.x + r + 16, this.y);
    ctx.stroke();

    // Top line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - r - 16);
    ctx.lineTo(this.x, this.y - innerR - 2);
    ctx.stroke();

    // Bottom line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + innerR + 2);
    ctx.lineTo(this.x, this.y + r + 16);
    ctx.stroke();

    // Cross Notch Marks on 4 quadrants
    const notchOffset = r * 0.707;
    ctx.fillStyle = '#ef4444';
    [
      [this.x - notchOffset, this.y - notchOffset],
      [this.x + notchOffset, this.y - notchOffset],
      [this.x - notchOffset, this.y + notchOffset],
      [this.x + notchOffset, this.y + notchOffset]
    ].forEach(([nx, ny]) => {
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Center Red Bullseye Dot
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
