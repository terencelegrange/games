/**
 * Big Jump Entities (1983 Track & Field Long Jump)
 * Athlete, Referee, StadiumAudience, AngleMeter, SandPit, SandParticle
 */

export const MAX_RUN_SPEED = 1500;
export const MAX_JUMP_METERS = 10;

export class Athlete {
  constructor(x = 60, y = 330) {
    this.initialX = x;
    this.initialY = y;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 38;

    this.speed = 0; // cm/sec: 0 to 1500
    this.vx = 0;
    this.vy = 0;
    this.state = 'IDLE'; // IDLE, RUNNING, CHARGING_ANGLE, IN_FLIGHT, LANDED, FOUL
    this.runAnimPhase = 0;
    this.flightTime = 0;
    this.totalFlightDuration = 0;
    this.takeoffX = 0;
    this.landingX = 0;
    this.jumpAngle = 45; // Degrees (optimal ~42-45)
    this.isFoul = false;
    this.jumpDistanceMeters = 0;
  }

  reset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.state = 'IDLE';
    this.runAnimPhase = 0;
    this.flightTime = 0;
    this.totalFlightDuration = 0;
    this.takeoffX = 0;
    this.landingX = 0;
    this.jumpAngle = 45;
    this.isFoul = false;
    this.jumpDistanceMeters = 0;
  }

  addStepSpeed(amount = 95) {
    if (this.state === 'IDLE' || this.state === 'RUNNING') {
      this.state = 'RUNNING';
      // Arcade sprint cap; shared with the speedometer.
      this.speed = Math.min(MAX_RUN_SPEED, this.speed + amount);
    }
  }

  update(dt, foulLineX = 260, pitY = 330) {
    if (this.state === 'IDLE') return;

    if (this.state === 'RUNNING') {
      // Integrate the deceleration exactly, including the instant we stop.
      const decay = 140;
      const movingTime = Math.min(dt, this.speed / decay);
      const travelled = (this.speed * movingTime - 0.5 * decay * movingTime ** 2) * 0.22;
      this.x += travelled;
      this.runAnimPhase += travelled * 0.64;
      this.speed = Math.max(0, this.speed - dt * decay);
      if (this.speed <= 0) this.state = 'IDLE';
      if (this.x > foulLineX) {
        this.state = 'FOUL';
        this.isFoul = true;
      }
    } else if (this.state === 'CHARGING_ANGLE') {
      // Plant the foot on key-down. Preserve run-up speed for release.
      return;
    } else if (this.state === 'IN_FLIGHT') {
      // An analytic trajectory gives the same landing at every refresh rate.
      this.flightTime = Math.min(this.totalFlightDuration, this.flightTime + dt);
      this.x = this.takeoffX + this.vx * this.flightTime;
      this.y = this.initialY + this.launchVy * this.flightTime + 0.5 * 520 * this.flightTime ** 2;
      this.vy = this.launchVy + 520 * this.flightTime;
      if (this.flightTime >= this.totalFlightDuration) {
        this.y = pitY;
        this.vy = 0;
        this.vx = 0;
        this.state = 'LANDED';
        this.landingX = this.x;
      }
    }
  }

  launchJump(angleDeg, foulLineX = 260) {
    this.state = 'IN_FLIGHT';
    this.takeoffX = this.x;
    this.initialY = this.y;
    this.flightTime = 0;
    this.jumpAngle = Math.max(0, Math.min(90, angleDeg));
    if (this.takeoffX > foulLineX) this.isFoul = true;

    const angleRad = this.jumpAngle * Math.PI / 180;
    // Reward a solid run-up without requiring perfect button mashing.
    // Speed still matters, but moderate sprint speeds can reach 6–8 metres.
    const speedRatio = Math.min(MAX_RUN_SPEED, Math.max(0, this.speed)) / MAX_RUN_SPEED;
    const rangeAt45 = MAX_JUMP_METERS * speedRatio ** 1.2;
    const launchSpeed = Math.sqrt(520 * 45 * rangeAt45);
    this.vx = Math.cos(angleRad) * launchSpeed;
    this.launchVy = -Math.sin(angleRad) * launchSpeed;
    this.vy = this.launchVy;
    this.totalFlightDuration = -2 * this.launchVy / 520;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isRunning = this.state === 'RUNNING';
    const isFlight = this.state === 'IN_FLIGHT';
    const isLanded = this.state === 'LANDED';
    const isFoul = this.state === 'FOUL';

    // 1983 Konami Track & Field Sprinter Sprite
    if (isRunning) {
      const step = Math.sin(this.runAnimPhase);
      const legAngle = step * 0.75;
      const armAngle = -step * 0.75;

      // Torso & Singlet (White jersey with red national sash)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -30, 12, 16);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -28, 4, 14);

      // Running Shorts (Blue)
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-6, -14, 12, 8);

      // Head, Brown Hair & Athletic Headband
      ctx.fillStyle = '#fed7aa'; // Tan skin
      ctx.beginPath();
      ctx.arc(0, -36, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f'; // Brown hair
      ctx.fillRect(-6, -42, 12, 5);
      ctx.fillStyle = '#ef4444'; // Red headband
      ctx.fillRect(-6, -38, 12, 2.5);

      // Left Leg
      ctx.save();
      ctx.translate(-2, -6);
      ctx.rotate(legAngle);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.fillStyle = '#ffffff'; // White shoe
      ctx.fillRect(-2, 10, 6, 3);
      ctx.restore();

      // Right Leg
      ctx.save();
      ctx.translate(2, -6);
      ctx.rotate(-legAngle);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, 10, 6, 3);
      ctx.restore();

      // Arms
      ctx.save();
      ctx.translate(0, -26);
      ctx.rotate(armAngle);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-2, 0, 4, 11);
      ctx.restore();
    } else if (isFlight) {
      // In-flight aerodynamic layout: legs tucked forward, arms back
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-8, -26, 14, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -24, 4, 12);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-8, -12, 14, 8);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(4, -30, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -36, 12, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -32, 12, 2.5);

      // Forward outstretched legs for landing extension
      ctx.save();
      ctx.translate(4, -6);
      ctx.rotate(0.35);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(0, -2, 15, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, -3, 5, 6);
      ctx.restore();

      // Arms thrust forward/back
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-14, -22, 10, 4);
    } else if (isLanded) {
      // Sunk into sand: seated pose
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-10, -10, 16, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-8, -22, 12, 14);

      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -34, 12, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -30, 12, 2.5);

      // Feet sticking out of sand
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, -4, 6, 4);
    } else if (isFoul) {
      // Overstepped foul: head down in disbelief
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -26, 12, 14);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-6, -12, 12, 8);
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(2, -26, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-4, -32, 12, 5);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-4, 0, 4, 10);
      ctx.fillRect(2, 0, 4, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, 9, 6, 3);
      ctx.fillRect(2, 9, 6, 3);
    } else {
      // IDLE Ready Stance
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -28, 12, 15);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-4, -26, 4, 13);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-6, -13, 12, 8);

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -34, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-6, -40, 12, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -36, 12, 2.5);

      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(-4, -5, 4, 14);
      ctx.fillRect(2, -5, 4, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, 8, 6, 3);
      ctx.fillRect(2, 8, 6, 3);
    }

    ctx.restore();
  }
}

export class Referee {
  constructor(x = 245, y = 330) {
    this.x = x;
    this.y = y;
    this.flagState = 'NEUTRAL'; // NEUTRAL, WHITE (valid), RED (foul)
  }

  setFlag(state) {
    this.flagState = state;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Official in white polo & dark trousers with peaked umpire cap
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-6, -30, 12, 16);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-6, -14, 12, 16);

    // Head & Cap
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -36, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc'; // White cap
    ctx.fillRect(-6, -42, 12, 4);
    ctx.fillRect(-2, -38, 9, 2); // Visor

    // Raised Flag
    if (this.flagState === 'WHITE') {
      // Right arm raised holding white flag
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -24);
      ctx.lineTo(12, -42);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.fillRect(12, -44, 12, 9);
      ctx.strokeRect(12, -44, 12, 9);
    } else if (this.flagState === 'RED') {
      // Right arm raised holding bright red foul flag
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -24);
      ctx.lineTo(12, -42);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.fillRect(12, -44, 12, 9);
      ctx.strokeRect(12, -44, 12, 9);
    } else {
      // Arms resting at side holding lowered baton
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(6, -26, 3, 14);
    }

    ctx.restore();
  }
}

export class StadiumAudience {
  constructor(width = 800) {
    this.width = width;
    this.animTimer = 0;
    this.spectators = [];
    const colors = ['#ef4444', '#facc15', '#38bdf8', '#22c55e', '#f8fafc', '#ec4899'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 50; c++) {
        this.spectators.push({
          x: c * 16 + (r % 2) * 8,
          y: 75 + r * 14,
          color: colors[(c + r * 7) % colors.length],
          phase: Math.random() * Math.PI * 2
        });
      }
    }
  }

  update(dt) {
    this.animTimer += dt * 4;
  }

  render(ctx) {
    ctx.save();
    // Bleachers background gradient
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 65, this.width, 65);
    ctx.fillStyle = '#1e293b';
    for (let r = 0; r < 5; r++) {
      ctx.fillRect(0, 65 + r * 14, this.width, 2);
    }

    // Cheering spectators
    this.spectators.forEach(s => {
      const bob = Math.sin(this.animTimer + s.phase) > 0.4 ? -2 : 0;
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y + bob, 10, 8); // Body
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(s.x + 2, s.y - 4 + bob, 6, 5); // Head
    });

    // Stadium wall divider
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 130, this.width, 8);
    ctx.restore();
  }
}

export class AngleMeter {
  constructor() {
    this.active = false;
    this.angle = 20; // Starts at 20 degrees
    this.rate = 75; // Degrees per second while holding space
  }

  start() {
    this.active = true;
    this.angle = 20;
  }

  update(dt) {
    if (this.active) {
      this.angle = Math.min(78, this.angle + dt * this.rate);
    }
  }

  getAngle() {
    return Math.round(this.angle);
  }

  render(ctx, athleteX, athleteY) {
    if (!this.active) return;
    ctx.save();

    // Dotted arc radius
    const radius = 54;
    const currentRad = (this.angle * Math.PI) / 180;

    // Draw quadrant arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(athleteX, athleteY, radius, -Math.PI / 2, 0);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(athleteX, athleteY, radius, -48 * Math.PI / 180, -42 * Math.PI / 180);
    ctx.stroke();

    // Active angle vector line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(athleteX, athleteY);
    ctx.lineTo(athleteX + Math.cos(-currentRad) * radius, athleteY + Math.sin(-currentRad) * radius);
    ctx.stroke();

    // Cyan Angle Pill: [ 45° ] matching reference image
    const pillX = athleteX + 28;
    const pillY = athleteY + 12;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(pillX - 4, pillY - 14, 52, 20);
    ctx.strokeRect(pillX - 4, pillY - 14, 52, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.round(this.angle)}°`, pillX + 6, pillY);

    ctx.restore();
  }
}

export class SandParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI - Math.PI;
    const speed = 40 + Math.random() * 120;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.5 + Math.random() * 0.4;
    this.size = 2 + Math.random() * 3;
    const colors = ['#fde047', '#eab308', '#d97706', '#cbd5e1'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 220 * dt; // Gravity
    this.life -= dt;
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
