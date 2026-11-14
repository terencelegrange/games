/**
 * Fast Car Player Entity (OutRun Red Convertible Sports Car)
 * Smooth 3-lane interpolation, banking tilt, oil slick spinout, and exhaust particle effects.
 */

export class PlayerCar {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth; // 900
    this.canvasHeight = canvasHeight; // 460

    // Car placement
    this.y = 400; // Screen Y near bottom of road
    this.baseWidth = 118;
    this.baseHeight = 52;

    // 3-Lane system (-1: Left, 0: Center, 1: Right)
    this.targetLane = 0;
    this.currentLane = 0;
    this.laneOffset = 0; // Float between -1.0 and 1.0

    // Lateral physics
    this.x = this.canvasWidth / 2;
    this.roll = 0; // Body banking angle during lane switch
    this.prevX = this.x;

    // States
    this.isSpinning = false;
    this.spinAngle = 0;
    this.spinTimer = 0;

    this.isInvulnerable = false;
    this.invulnerableTimer = 0;

    // Particles
    this.exhaustParticles = [];
    this.skidMarks = [];
  }

  reset() {
    this.targetLane = 0;
    this.currentLane = 0;
    this.laneOffset = 0;
    this.x = this.canvasWidth / 2;
    this.roll = 0;
    this.isSpinning = false;
    this.spinAngle = 0;
    this.spinTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.exhaustParticles = [];
  }

  steerLeft() {
    if (this.isSpinning) return;
    if (this.targetLane > -1) {
      this.targetLane--;
    }
  }

  steerRight() {
    if (this.isSpinning) return;
    if (this.targetLane < 1) {
      this.targetLane++;
    }
  }

  spinOut() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinAngle = 0;
    this.spinTimer = 0.85; // 0.85 seconds spinout
    this.spawnSkidSmoke(14);
  }

  hitHazard() {
    if (this.isInvulnerable) return false;
    this.isInvulnerable = true;
    this.invulnerableTimer = 2.0; // 2 seconds invulnerability blink
    this.spawnCrashSparks(18);
    return true;
  }

  update(road, speed, dt = 1 / 60) {
    // 1. Lane Interpolation
    const laneLerpSpeed = 10.0;
    this.laneOffset += (this.targetLane - this.laneOffset) * Math.min(1, dt * laneLerpSpeed);

    // Compute exact screen X from road perspective
    const proj = road.project(0); // At car distance
    if (proj) {
      const laneStep = proj.roadWidth * 0.31;
      this.x = proj.roadCenterX + this.laneOffset * laneStep;
    }

    // Body roll / tilt based on lateral velocity
    const dx = this.x - this.prevX;
    this.prevX = this.x;
    const targetRoll = Math.max(-0.16, Math.min(0.16, dx * 0.018));
    this.roll += (targetRoll - this.roll) * 0.25;

    // 2. Oil Slick Spinout Timer
    if (this.isSpinning) {
      this.spinTimer -= dt;
      this.spinAngle += dt * Math.PI * 4; // Rapid 360 spin
      this.spawnSkidSmoke(2);
      if (this.spinTimer <= 0) {
        this.isSpinning = false;
        this.spinAngle = 0;
      }
    }

    // 3. Invulnerability Timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // 4. Exhaust Particles
    if (speed > 2 && Math.random() < 0.65) {
      this.spawnExhaust();
    }

    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.size += p.growth;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.exhaustParticles.splice(i, 1);
      }
    }
  }

  spawnExhaust() {
    const leftExhaustX = this.x - 34;
    const rightExhaustX = this.x + 34;
    const exhaustY = this.y + 14;

    [leftExhaustX, rightExhaustX].forEach(exX => {
      this.exhaustParticles.push({
        x: exX + (Math.random() - 0.5) * 4,
        y: exhaustY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.5 + Math.random() * 2,
        size: 3,
        growth: 0.2,
        alpha: 0.6,
        decay: 0.035,
        color: '#94a3b8'
      });
    });
  }

  spawnSkidSmoke(count = 6) {
    for (let i = 0; i < count; i++) {
      this.exhaustParticles.push({
        x: this.x + (Math.random() - 0.5) * 60,
        y: this.y + 10 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 2,
        size: 4 + Math.random() * 4,
        growth: 0.4,
        alpha: 0.8,
        decay: 0.03,
        color: '#e2e8f0'
      });
    }
  }

  spawnCrashSparks(count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      this.exhaustParticles.push({
        x: this.x + (Math.random() - 0.5) * 40,
        y: this.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1,
        size: 2.5,
        growth: -0.05,
        alpha: 1.0,
        decay: 0.04,
        color: Math.random() > 0.4 ? '#facc15' : '#ef4444'
      });
    }
  }

  getHitbox() {
    return {
      x: this.x - 48,
      y: this.y - 28,
      w: 96,
      h: 40
    };
  }

  draw(ctx) {
    // 1. Draw Exhaust & Skid Particles
    ctx.save();
    for (const p of this.exhaustParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Invulnerability Blinking
    if (this.isInvulnerable && Math.floor(this.invulnerableTimer * 12) % 2 === 0) {
      return; // Skip rendering frame for retro blink effect
    }

    // 3. Draw Red Sports Convertible Car
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isSpinning) {
      ctx.rotate(this.spinAngle);
    } else {
      ctx.rotate(this.roll);
    }

    this.drawOutRunSportsCar(ctx);
    ctx.restore();
  }

  drawOutRunSportsCar(ctx) {
    const carRed = '#dc2626';
    const carLightRed = '#ef4444';
    const carDarkRed = '#991b1b';
    const blackTrim = '#0f172a';
    const chrome = '#e2e8f0';

    // Road Shadow under the car
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Rear Tires ---
    ctx.fillStyle = '#1e293b';
    // Left tire
    ctx.fillRect(-56, 4, 18, 16);
    // Right tire
    ctx.fillRect(38, 4, 18, 16);
    // Tire tread shading
    ctx.fillStyle = blackTrim;
    ctx.fillRect(-54, 8, 14, 12);
    ctx.fillRect(40, 8, 14, 12);

    // --- Wide Rear Chassis / Fenders ---
    ctx.fillStyle = carRed;
    ctx.beginPath();
    ctx.moveTo(-58, 8);
    ctx.lineTo(-54, -14);
    ctx.lineTo(-44, -20);
    ctx.lineTo(44, -20);
    ctx.lineTo(54, -14);
    ctx.lineTo(58, 8);
    ctx.lineTo(48, 16);
    ctx.lineTo(-48, 16);
    ctx.closePath();
    ctx.fill();

    // Top Highlight bevel
    ctx.fillStyle = carLightRed;
    ctx.beginPath();
    ctx.moveTo(-44, -20);
    ctx.lineTo(44, -20);
    ctx.lineTo(42, -16);
    ctx.lineTo(-42, -16);
    ctx.closePath();
    ctx.fill();

    // Side Fenders shadow
    ctx.fillStyle = carDarkRed;
    ctx.fillRect(-58, 2, 8, 10);
    ctx.fillRect(50, 2, 8, 10);

    // --- Open-Top Convertible Cockpit & Windshield ---
    // Windshield frame
    ctx.strokeStyle = chrome;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-36, -20);
    ctx.lineTo(-32, -34);
    ctx.lineTo(32, -34);
    ctx.lineTo(36, -20);
    ctx.stroke();

    // Blue tinted glass
    ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-34, -20);
    ctx.lineTo(-30, -32);
    ctx.lineTo(30, -32);
    ctx.lineTo(34, -20);
    ctx.closePath();
    ctx.fill();

    // Driver & Passenger Silhouettes (OutRun style!)
    // Driver (left side)
    ctx.fillStyle = '#f59e0b'; // blonde driver
    ctx.beginPath();
    ctx.arc(-14, -28, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7'; // blue shirt
    ctx.fillRect(-19, -23, 10, 6);

    // Passenger (right side)
    ctx.fillStyle = '#f43f5e'; // brunette passenger
    ctx.beginPath();
    ctx.arc(14, -27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // white top
    ctx.fillRect(9, -22, 10, 5);

    // Headrests
    ctx.fillStyle = blackTrim;
    ctx.beginPath();
    ctx.roundRect(-20, -26, 12, 8, 3);
    ctx.roundRect(8, -26, 12, 8, 3);
    ctx.fill();

    // Rearview mirrors
    ctx.fillStyle = carRed;
    ctx.fillRect(-42, -26, 6, 4);
    ctx.fillRect(36, -26, 6, 4);

    // --- Horizontal Rear Cooling Grille (Testarossa slats) ---
    ctx.fillStyle = blackTrim;
    ctx.fillRect(-44, -12, 88, 18);

    // Grille slats
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    for (let sl = -10; sl <= 4; sl += 4) {
      ctx.beginPath();
      ctx.moveTo(-42, sl);
      ctx.lineTo(42, sl);
      ctx.stroke();
    }

    // --- Tail Lights ---
    // Full width horizontal tail-light bar
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillRect(-42, -9, 84, 5);
    ctx.shadowBlur = 0;

    // Amber turn indicators on ends
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-42, -9, 8, 5);
    ctx.fillRect(34, -9, 8, 5);

    // White reverse lights center
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, -9, 12, 4);

    // --- License Plate ---
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-14, 0, 28, 9);
    ctx.strokeStyle = blackTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(-14, 0, 28, 9);
    // Plate text line
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-10, 3, 20, 3);

    // --- Chrome Dual Twin-Exhausts ---
    ctx.fillStyle = chrome;
    ctx.fillRect(-38, 12, 8, 5);
    ctx.fillRect(30, 12, 8, 5);
    ctx.fillStyle = blackTrim;
    ctx.beginPath();
    ctx.arc(-34, 15, 2.5, 0, Math.PI * 2);
    ctx.arc(34, 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
