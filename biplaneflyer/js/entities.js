/**
 * Biplane Flyer Entities
 * Biplane, Bullet, Bomb, GroundTarget, Zeppelin, EnemyPlane, TerrainAndRunway, Particle
 */

export class Biplane {
  constructor(x = 100, y = 514) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0; // Radians: 0 = heading right, negative = climbing, positive = diving
    this.roll = 1; // 1 = upright, -1 = inverted
    this.gunCooldown = 0;
    this.throttle = 0; // 0.0 to 1.0
    this.airspeed = 0; // Knots / px per sec

    this.isGrounded = true;
    this.isStalling = false;
    this.stallTimer = 0;

    this.health = 100;
    this.fuel = 100;
    this.bombs = 5;
    this.gunHeat = 0;
    this.isOverheated = false;

    this.propellerAngle = 0;
    this.smokeTrail = [];
    this.dead = false;

    this.width = 38;
    this.height = 18;
  }

  update(dt, input, runwayY = 520, worldWidth = 2800) {
    if (this.dead) return;

    this.gunCooldown = Math.max(0, this.gunCooldown - dt);

    // Fuel Consumption
    if (this.throttle > 0.05) {
      this.fuel = Math.max(0, this.fuel - dt * (0.8 + this.throttle * 1.2));
      if (this.fuel <= 0) {
        this.throttle = 0; // Engine cutoff
      }
    }

    // Gun cooling
    if (this.gunHeat > 0) {
      this.gunHeat = Math.max(0, this.gunHeat - dt * 35);
      if (this.gunHeat < 20) this.isOverheated = false;
    }

    // Throttle Control
    if (input.throttleUp && this.fuel > 0) {
      this.throttle = Math.min(1.0, this.throttle + dt * 0.8);
    } else if (input.throttleDown) {
      this.throttle = Math.max(0, this.throttle - dt * 1.0);
    }

    // Arcade flight: speed follows throttle; pitch steers the flight path.
    // All rates are per second, independent of display refresh rate.
    this.propellerAngle += (15 + this.throttle * 60) * dt;
    if (this.isGrounded) {
      const direction = Math.cos(this.angle) < 0 ? -1 : 1;
      this.angle = direction === 1 ? 0 : Math.PI;
      this.roll = direction;
      this.vy = 0;
      this.y = runwayY - 14;
      const drag = input.throttleDown ? 4 : 1.3;
      const terminal = direction * this.throttle * 240 / drag;
      this.vx = terminal + (this.vx - terminal) * Math.exp(-drag * dt);
      this.airspeed = Math.abs(this.vx);
      if (this.airspeed >= 95 && input.pitchUp) {
        this.isGrounded = false;
        this.angle -= direction * 0.18;
        this.vy = -30;
      }
    } else {
      const pitch = Number(Boolean(input.pitchDown)) - Number(Boolean(input.pitchUp));
      this.angle += pitch * this.roll * 1.65 * dt;
      this.angle = Math.atan2(Math.sin(this.angle), Math.cos(this.angle));
      const speed = Math.hypot(this.vx, this.vy);
      this.isStalling = speed < 75;
      this.stallTimer = this.isStalling ? this.stallTimer + dt : 0;
      if (this.isStalling) {
        // Let the nose fall toward the ground on either heading.
        const noseDrop = Math.atan2(Math.sin(Math.PI / 2 - this.angle), Math.cos(Math.PI / 2 - this.angle));
        this.angle += Math.sign(noseDrop) * Math.min(Math.abs(noseDrop), 1.8 * dt);
      }
      const acceleration = this.throttle * 155 - speed * 0.65 - Math.sin(this.angle) * 65;
      this.airspeed = Math.max(25, Math.min(260, speed + acceleration * dt));
      const sink = Math.max(0, 1 - this.airspeed / 100) * 45;
      this.vx = Math.cos(this.angle) * this.airspeed;
      this.vy = Math.sin(this.angle) * this.airspeed + sink;
    }

    // Position integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap around world borders horizontally
    if (this.x < 0) this.x += worldWidth;
    if (this.x >= worldWidth) this.x -= worldWidth;

    // Ceiling ceiling clamp
    if (this.y < 35) {
      this.y = 35;
      if (this.vy < 0) this.vy = 0;
    }

    // Exhaust smoke trail
    if (this.throttle > 0.2 && Math.random() < 0.4) {
      const tailX = this.x - Math.cos(this.angle) * 18;
      const tailY = this.y - Math.sin(this.angle) * 18;
      this.smokeTrail.push({
        x: tailX,
        y: tailY,
        vx: -this.vx * 0.15 + (Math.random() - 0.5) * 10,
        vy: -this.vy * 0.15 + (Math.random() - 0.5) * 10,
        radius: 2.5,
        alpha: 0.65,
        life: 0.8
      });
    }

    // Update smoke
    this.smokeTrail.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += 8 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.8 * 0.65);
    });
    this.smokeTrail = this.smokeTrail.filter(p => p.life > 0);
  }

  flip() {
    if (!this.dead && !this.isGrounded) this.roll *= -1;
  }

  canFire() {
    return !this.dead && this.gunCooldown <= 0 && !this.isOverheated && this.gunHeat < 85;
  }

  fire(speed = 480) {
    if (!this.canFire()) return null;
    this.gunCooldown = 0.12;
    this.gunHeat += 12;
    if (this.gunHeat >= 90) this.isOverheated = true;

    const noseX = this.x + Math.cos(this.angle) * 20;
    const noseY = this.y + Math.sin(this.angle) * 20;
    const bvx = Math.cos(this.angle) * (speed + this.airspeed);
    const bvy = Math.sin(this.angle) * (speed + this.airspeed);

    return new Bullet(noseX, noseY, bvx, bvy, 'PLAYER');
  }

  dropBomb() {
    if (this.bombs <= 0 || this.dead || this.isGrounded) return null;
    this.bombs--;
    const bellyX = this.x - Math.sin(this.angle) * 6;
    const bellyY = this.y + Math.cos(this.angle) * 6;
    // Bomb inherits plane's horizontal and vertical velocity plus slight downward kick
    return new Bomb(bellyX, bellyY, this.vx * 0.85, this.vy + 20);
  }

  render(ctx) {
    if (this.dead) return;

    // Draw smoke particles
    this.smokeTrail.forEach(p => {
      ctx.save();
      ctx.fillStyle = `rgba(226, 232, 240, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(1, this.roll);

    // SOPWITH CAMEL BIPLANE SPRITE
    // Fuselage (olive drab WWI British army color)
    ctx.fillStyle = '#4d5d36';
    ctx.strokeStyle = '#27311c';
    ctx.lineWidth = 1.2;

    // Main fuselage body
    ctx.beginPath();
    ctx.moveTo(18, 0);       // Propeller spinner nose
    ctx.lineTo(12, -5);      // Engine cowling top
    ctx.lineTo(-14, -4);     // Cockpit rim
    ctx.lineTo(-24, -1);     // Tail start
    ctx.lineTo(-24, 2);      // Tail lower
    ctx.lineTo(-12, 4);      // Fuselage belly
    ctx.lineTo(12, 5);       // Cowling bottom
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Radial Engine Cowling (Metal silver)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(10, -5, 6, 10);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(10, -5, 6, 10);

    // Upper Wing (Khaki with roundels)
    ctx.fillStyle = '#657843';
    ctx.strokeStyle = '#27311c';
    ctx.fillRect(-10, -14, 28, 4);
    ctx.strokeRect(-10, -14, 28, 4);

    // Lower Wing
    ctx.fillRect(-8, 3, 24, 3.5);
    ctx.strokeRect(-8, 3, 24, 3.5);

    // Wing Struts & Rigging Wires
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(6, 3);
    ctx.moveTo(-4, -10);
    ctx.lineTo(-4, 3);
    ctx.stroke();

    // Tail Fin / Rudder (British Red-White-Blue Stripes)
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fillRect(-26, -11, 2.5, 9);
    ctx.fillStyle = '#ffffff'; // White
    ctx.fillRect(-23.5, -11, 2.5, 9);
    ctx.fillStyle = '#2563eb'; // Blue
    ctx.fillRect(-21, -11, 2.5, 9);

    // Horizontal Tail Stabilizer
    ctx.fillStyle = '#4d5d36';
    ctx.fillRect(-24, -2, 8, 3);

    // British RAF Cockade / Roundel on Fuselage
    ctx.fillStyle = '#2563eb'; // Outer Blue
    ctx.beginPath();
    ctx.arc(-2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; // Mid White
    ctx.beginPath();
    ctx.arc(-2, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444'; // Center Red
    ctx.beginPath();
    ctx.arc(-2, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Pilot with Aviator Cap & White Scarf
    ctx.fillStyle = '#78350f'; // Leather cap
    ctx.beginPath();
    ctx.arc(-4, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    // Flying Goggles
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-3, -7, 3, 2);
    // Fluttering White Scarf
    const flutter = Math.sin(Date.now() / 60) * 2;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -5);
    ctx.lineTo(-14, -6 + flutter);
    ctx.stroke();

    // Landing Gear (Two wheels on strut)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(4, 5);
    ctx.lineTo(1, 11);
    ctx.stroke();
    // Wheel tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(1, 11, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8'; // Hubcap
    ctx.fillRect(0.5, 10.5, 1, 1);

    // Tail Skid
    ctx.beginPath();
    ctx.moveTo(-20, 2);
    ctx.lineTo(-22, 6);
    ctx.stroke();

    // Spinning Propeller Disc
    ctx.save();
    ctx.translate(18, 0);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)'; // Motion blur disc
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.5, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Propeller Hub
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

export class Bullet {
  constructor(x, y, vx, vy, team = 'PLAYER') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.team = team; // 'PLAYER' or 'ENEMY'
    this.lifetime = 1.6;
    this.active = true;
  }

  update(dt, worldWidth = 2800) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;

    if (this.x < 0) this.x += worldWidth;
    if (this.x >= worldWidth) this.x -= worldWidth;

    if (this.lifetime <= 0 || this.y > 540 || this.y < 0) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.strokeStyle = this.team === 'PLAYER' ? '#fde047' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.025, this.y - this.vy * 0.025);
    ctx.stroke();
    ctx.restore();
  }
}

export class Bomb {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.rotation = 0;
    this.active = true;
  }

  update(dt, worldWidth = 2800, groundY = 520) {
    if (!this.active) return;
    this.vy += 180 * dt; // Gravity acceleration
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.rotation = Math.atan2(this.vy, this.vx);

    if (this.x < 0) this.x += worldWidth;
    if (this.x >= worldWidth) this.x -= worldWidth;

    if (this.y >= groundY) {
      this.y = groundY;
      this.active = false; // Explodes on ground impact
    }
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Iron teardrop aerial bomb
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tail fins
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -4, 3, 8);

    ctx.restore();
  }
}

export class GroundTarget {
  constructor(type, x, y, width, height, points = 500) {
    this.type = type; // 'HANGAR', 'AA_TURRET', 'FUEL_DEPOT'
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.points = points;
    this.health = type === 'HANGAR' ? 3 : 1;
    this.destroyed = false;
    this.fireTimer = 0;
  }

  update(dt, playerX, playerY, onFlakFire) {
    if (this.destroyed) return;

    if (this.type === 'AA_TURRET') {
      this.fireTimer += dt;
      const dist = Math.abs(this.x - playerX);
      if (this.fireTimer > 2.2 && dist < 420 && playerY < this.y - 12) {
        this.fireTimer = 0;
        if (typeof onFlakFire === 'function') {
          onFlakFire(this.x + this.width / 2, this.y - 10, playerX, playerY);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    if (this.destroyed) {
      // Rubble & smoking ruin
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + w * 0.3, y + h - 14, 10, 6);
      ctx.restore();
      return;
    }

    if (this.type === 'HANGAR') {
      // Arched enemy aircraft hangar
      ctx.fillStyle = '#3f3f46';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h, w / 2, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Hangar door opening
      ctx.fillStyle = '#09090b';
      ctx.fillRect(x + w * 0.2, y + h - 22, w * 0.6, 22);

      // Iron Cross Insignia on roof
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + w / 2 - 8, y + 4, 16, 16);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + w / 2 - 6, y + 10, 12, 4);
      ctx.fillRect(x + w / 2 - 2, y + 6, 4, 12);
    } else if (this.type === 'AA_TURRET') {
      // Sandbag barrier
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x, y + 14, w, 12);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(x, y + 14, w, 12);

      // Flak Gun Barrels
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + 8, y + 6, 12, 8);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 8);
      ctx.lineTo(x + 22, y - 6);
      ctx.stroke();
    } else if (this.type === 'FUEL_DEPOT') {
      // Cylindrical fuel tanks
      ctx.fillStyle = '#dc2626'; // Red tank
      ctx.fillRect(x + 4, y, w - 8, h);
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y, w - 8, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('FUEL', x + 8, y + h / 2 + 3);
    }

    ctx.restore();
  }
}

export class Zeppelin {
  constructor(x = 1400, y = 110) {
    this.x = x;
    this.y = y;
    this.vx = -22; // Drifts slowly westward
    this.width = 110;
    this.height = 36;
    this.health = 5;
    this.destroyed = false;
  }

  update(dt, worldWidth = 2800) {
    if (this.destroyed) return;
    this.x += this.vx * dt;
    if (this.x < -150) this.x += worldWidth + 200;
  }

  render(ctx) {
    if (this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Zeppelin gasbag (Steel grey dirigible)
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(55, 18, 55, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tail Fins
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(95, 2, 12, 6);
    ctx.fillRect(95, 28, 12, 6);

    // German Cross
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(50, 10, 14, 14);
    ctx.fillStyle = '#000000';
    ctx.fillRect(52, 15, 10, 4);
    ctx.fillRect(55, 12, 4, 10);

    // Gondola / Cabin underneath
    ctx.fillStyle = '#334155';
    ctx.fillRect(45, 34, 24, 7);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(45, 34, 24, 7);

    ctx.restore();
  }
}

export class EnemyPlane {
  constructor(x = 2200, y = 200) {
    this.x = x;
    this.y = y;
    this.vx = -120;
    this.vy = 0;
    this.angle = Math.PI; // Heading left
    this.destroyed = false;
    this.fireTimer = 0;
  }

  update(dt, playerX, playerY, worldWidth = 2800, onEnemyFire) {
    if (this.destroyed) return;

    // AI navigation: turn slightly toward player altitude
    const dy = playerY - this.y;
    this.vy += Math.sign(dy) * 40 * dt;
    this.vy = Math.max(-60, Math.min(60, this.vy));

    this.x += this.vx * dt;
    this.y = Math.max(60, Math.min(380, this.y + this.vy * dt));

    if (this.x < 0) this.x += worldWidth;
    if (this.x >= worldWidth) this.x -= worldWidth;

    // Fire machine guns when facing player within range
    this.fireTimer += dt;
    const dist = Math.abs(this.x - playerX);
    if (this.fireTimer > 1.8 && dist < 360 && playerX < this.x && Math.abs(dy) < 60) {
      this.fireTimer = 0;
      if (typeof onEnemyFire === 'function') {
        onEnemyFire(this.x - 16, this.y, -360, 0);
      }
    }
  }

  render(ctx) {
    if (this.destroyed) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(-1, 1); // Flip facing left

    // Red Baron Fokker Dr.I Triplane / Crimson Biplane
    ctx.fillStyle = '#dc2626'; // Crimson red
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(-12, -4);
    ctx.lineTo(-22, -1);
    ctx.lineTo(-22, 2);
    ctx.lineTo(-10, 4);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red Wings
    ctx.fillRect(-8, -12, 24, 3.5);
    ctx.fillRect(-6, 3, 20, 3.5);

    // Cross on tail
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-20, -8, 6, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-19, -6, 4, 2);
    ctx.fillRect(-18, -7, 2, 4);

    ctx.restore();
  }
}
