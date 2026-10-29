/**
 * Biplane Flyer Game Engine (Sopwith Camel)
 */

import { Biplane, Bullet, Bomb, GroundTarget, Zeppelin, EnemyPlane } from './entities.js';
import { sound } from './audio.js';

export class BiplaneGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 800;
    this.height = canvas.height || 480;
    this.callbacks = callbacks;

    this.worldWidth = 2800;
    this.runwayX1 = 40;
    this.runwayX2 = 500;
    this.groundY = this.height - 60;
    this.accumulator = 0;

    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.state = 'READY'; // READY, PLAYING, LANDED_SUCCESS, CRASHED, GAME_OVER, PAUSED
    this.stateTimer = 0;

    this.biplane = new Biplane(160, this.groundY - 14);
    this.bullets = [];
    this.bombs = [];
    this.targets = [];
    this.zeppelin = null;
    this.enemyPlanes = [];
    this.particles = [];
    this.floatingScores = [];

    this.cameraX = 0;

    this.input = {
      throttleUp: false,
      throttleDown: false,
      pitchUp: false,
      pitchDown: false,
      fire: false,
      bomb: false
    };

    this.buildWorld();
  }

  buildWorld() {
    this.targets = [
      // Enemy Hangar (Primary Objective)
      new GroundTarget('HANGAR', 2100, this.groundY - 50, 70, 50, 1000),
      // Enemy AA Turret
      new GroundTarget('AA_TURRET', 1750, this.groundY - 28, 34, 28, 400),
      // Second AA Turret (Level 2+)
      new GroundTarget('AA_TURRET', 2350, this.groundY - 28, 34, 28, 400),
      // Fuel Depot
      new GroundTarget('FUEL_DEPOT', 1950, this.groundY - 35, 42, 35, 600)
    ];

    this.zeppelin = new Zeppelin(1500, 100);
    this.enemyPlanes = [];
    if (this.level >= 2) {
      this.enemyPlanes.push(new EnemyPlane(2400, 180));
    }
  }

  start() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.resetMission();
  }

  resetMission(keepScore = true, preserveTargets = false) {
    if (!keepScore) this.score = 0;
    this.state = 'PLAYING';
    this.stateTimer = 0;

    this.biplane = new Biplane(160, this.groundY - 14);
    this.bullets = [];
    this.bombs = [];
    this.particles = [];
    this.floatingScores = [];

    if (!preserveTargets) this.buildWorld();
    this.cameraX = (this.biplane.x - this.width * 0.35 + this.worldWidth) % this.worldWidth;
    this.clearInput();
    sound.startEngine();

    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
    if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
    if (this.callbacks.onLevelUpdate) this.callbacks.onLevelUpdate(this.level);
    if (this.callbacks.onFuelUpdate) this.callbacks.onFuelUpdate(this.biplane.fuel);
    if (this.callbacks.onBombsUpdate) this.callbacks.onBombsUpdate(this.biplane.bombs);
  }

  clearInput() {
    Object.keys(this.input).forEach(key => { this.input[key] = false; });
  }

  handleFlip() {
    if (this.state === 'PLAYING') this.biplane.flip();
  }

  handleFire() {
    if (this.state === 'PLAYING' && this.biplane.canFire()) {
      const b = this.biplane.fire();
      if (b) {
        this.bullets.push(b);
        sound.machineGun();
      }
    }
  }

  handleBomb() {
    if (this.state === 'PLAYING') {
      const b = this.biplane.dropBomb();
      if (b) {
        this.bombs.push(b);
        sound.bombWhistle();
        if (this.callbacks.onBombsUpdate) this.callbacks.onBombsUpdate(this.biplane.bombs);
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.clearInput();
      this.state = 'PAUSED';
      sound.stopEngine();
      return true;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      sound.startEngine();
      return false;
    }
    return false;
  }

  addFloatingScore(text, x, y, color = '#facc15') {
    this.floatingScores.push({ text, x, y, color, timer: 1.2 });
  }

  createExplosion(x, y, count = 18, color = '#f97316') {
    sound.explosion();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: Math.random() < 0.6 ? color : '#fde047',
        life: 0.6 + Math.random() * 0.4
      });
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += Math.min(dt, 0.25);
    const step = 1 / 120;
    while (this.accumulator + 1e-9 >= step) {
      this.accumulator -= step;
      this.step(step);
    }
  }

  step(dt) {
    if (this.state === 'PAUSED' || this.state === 'READY' || this.state === 'GAME_OVER') return;

    if (this.state === 'LANDED_SUCCESS') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.level++;
        this.resetMission(true);
      }
      return;
    }

    if (this.state === 'CRASHED') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.lives <= 0) {
          this.state = 'GAME_OVER';
          sound.stopEngine();
          if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver({ score: this.score, level: this.level });
          }
        } else {
          this.resetMission(true, true);
        }
      }
      return;
    }

    const p = this.biplane;

    // Handle continuous machine gun fire
    if (this.input.fire) {
      this.handleFire();
    }

    // Biplane physics
    p.update(dt, this.input, this.groundY, this.worldWidth);

    // Audio engine pitch
    sound.startEngine();
    sound.updateEngine(p.throttle, p.isStalling);

    // Instrument Callbacks
    if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(Math.round(p.airspeed));
    if (this.callbacks.onAltUpdate) this.callbacks.onAltUpdate(Math.max(0, Math.round(this.groundY - 14 - p.y)));
    if (this.callbacks.onFuelUpdate) this.callbacks.onFuelUpdate(p.fuel);
    if (this.callbacks.onThrottleUpdate) this.callbacks.onThrottleUpdate(Math.round(p.throttle * 100));

    // Camera tracks biplane
    this.cameraX = p.x - this.width * 0.35;
    if (this.cameraX < 0) this.cameraX += this.worldWidth;
    if (this.cameraX >= this.worldWidth) this.cameraX -= this.worldWidth;

    // Bullets update
    this.bullets.forEach(b => b.update(dt, this.worldWidth));
    this.bullets = this.bullets.filter(b => b.active);

    // Bombs update
    this.bombs.forEach(b => {
      b.update(dt, this.worldWidth, this.groundY);
      if (!b.active) {
        this.createExplosion(b.x, b.y, 22, '#ef4444');
        this.checkBombHits(b.x, b.y);
      }
    });
    this.bombs = this.bombs.filter(b => b.active);

    // Targets update (AA turrets fire flak)
    this.targets.forEach(t => {
      t.update(dt, p.x, p.y, (fx, fy, px, py) => {
        sound.flakBurst();
        // A visible shell travels from the gun to the last observed position.
        const angle = Math.atan2(py - fy, px - fx);
        this.bullets.push(new Bullet(fx, fy, Math.cos(angle) * 230, Math.sin(angle) * 230, 'ENEMY'));
      });
    });

    // Zeppelin update
    if (this.zeppelin) {
      this.zeppelin.update(dt, this.worldWidth);
    }

    // Enemy planes update
    this.enemyPlanes.forEach(ep => {
      ep.update(dt, p.x, p.y, this.worldWidth, (ex, ey, evx, evy) => {
        this.bullets.push(new Bullet(ex, ey, evx, evy, 'ENEMY'));
        sound.machineGun();
      });
    });

    // Particles update
    this.particles.forEach(pt => {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
    });
    this.particles = this.particles.filter(pt => pt.life > 0);

    // Floating scores update
    this.floatingScores.forEach(fs => {
      fs.timer -= dt;
      fs.y -= 20 * dt;
    });
    this.floatingScores = this.floatingScores.filter(fs => fs.timer > 0);

    // Ground and Landing Check
    this.checkLandingAndGround();

    // Combat Hit Testing
    if (this.state === 'PLAYING') this.checkBulletHits();
    if (this.state === 'PLAYING') this.checkPlaneCollisions();
  }

  checkPlaneCollisions() {
    const p = this.biplane;
    if (p.dead || p.isGrounded) return;
    const overlaps = t => p.x + 16 > t.x && p.x - 16 < t.x + t.width &&
      p.y + 10 > t.y && p.y - 10 < t.y + t.height;
    if (this.targets.some(t => !t.destroyed && overlaps(t))) {
      this.triggerCrash('HIT ENEMY BUILDING');
    } else if ((this.zeppelin && !this.zeppelin.destroyed && overlaps(this.zeppelin)) ||
      this.enemyPlanes.some(ep => !ep.destroyed && Math.hypot(ep.x - p.x, ep.y - p.y) < 28)) {
      this.triggerCrash('MID-AIR COLLISION');
    }
  }

  damagePlayer(amount) {
    if (this.state !== 'PLAYING' || this.biplane.dead) return;
    this.biplane.health = Math.max(0, this.biplane.health - amount);
    if (this.biplane.health <= 0) {
      this.triggerCrash('PLANE SHOT DOWN');
    }
  }

  triggerCrash(reason = 'CRASHED') {
    if (this.state !== 'PLAYING' || this.biplane.dead) return;
    this.state = 'CRASHED';
    this.stateTimer = 2.0;
    this.biplane.dead = true;
    this.lives--;
    sound.crash();
    this.createExplosion(this.biplane.x, this.biplane.y, 35, '#dc2626');
    this.addFloatingScore(reason, this.biplane.x, this.biplane.y - 20, '#ef4444');
    if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
  }

  checkLandingAndGround() {
    const p = this.biplane;
    if (p.dead || this.state !== 'PLAYING') return;

    // Check if touching runway or ground
    if (p.y >= this.groundY - 14) {
      const onHomeRunway = p.x >= this.runwayX1 && p.x <= this.runwayX2;

      if (onHomeRunway) {
        if (p.isGrounded) {
          const returnFuel = p.fuel;
          if (p.airspeed < 8 && p.throttle < 0.05) {
            p.fuel = 100;
            p.health = 100;
            p.bombs = 5;
            p.gunHeat = 0;
            p.isOverheated = false;
            if (this.callbacks.onBombsUpdate) this.callbacks.onBombsUpdate(p.bombs);
          }
          // Already rolling on runway
          // If stopped in front of hangar with mission accomplished:
          if (p.airspeed < 8 && this.targets.every(t => t.destroyed)) {
            this.state = 'LANDED_SUCCESS';
            this.stateTimer = 2.8;
            sound.landingFanfare();
            const landingBonus = 1000 + Math.round(returnFuel) * 10;
            this.score += landingBonus;
            if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            if (this.callbacks.onMissionSuccess) this.callbacks.onMissionSuccess({ level: this.level, bonus: landingBonus });
            this.addFloatingScore(`+${landingBonus} LANDING BONUS!`, p.x, p.y - 30, '#4ade80');
          }
        } else {
          // Attempting Touchdown
          const safePitch = Math.abs(Math.sin(p.angle)) < 0.24 && Math.cos(p.angle) * p.roll > 0; // within ~14 degrees of level
          const safeSpeed = p.airspeed < 130;
          const safeDescent = p.vy < 90;

          if (safePitch && safeSpeed && safeDescent) {
            // Perfect landing!
            p.isGrounded = true;
            p.angle = Math.cos(p.angle) < 0 ? Math.PI : 0;
            p.y = this.groundY - 14;
            p.vy = 0;
            sound.touchdownSqueak();
            this.addFloatingScore('TOUCHDOWN', p.x, p.y - 16, '#38bdf8');
          } else {
            // Hard crash on runway
            this.triggerCrash('HARD LANDING CRASH');
          }
        }
      } else {
        // Hit terrain outside runway -> Catastrophic crash
        this.triggerCrash('CRASHED INTO TERRAIN');
      }
    }
  }

  checkBombHits(bx, by) {
    const blastRadius = 48;
    this.targets.forEach(t => {
      if (!t.destroyed) {
        const cx = t.x + t.width / 2;
        const cy = t.y + t.height / 2;
        if (Math.hypot(bx - cx, by - cy) < blastRadius) {
          t.health -= 2;
          if (t.health <= 0) {
            t.destroyed = true;
            this.score += t.points;
            if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            this.addFloatingScore(`+${t.points}`, t.x, t.y - 12, '#fde047');
          }
        }
      }
    });
  }

  checkBulletHits() {
    this.bullets.forEach(b => {
      if (!b.active) return;

      if (b.team === 'PLAYER') {
        // Hit Zeppelin
        if (this.zeppelin && !this.zeppelin.destroyed) {
          if (b.x >= this.zeppelin.x && b.x <= this.zeppelin.x + this.zeppelin.width &&
              b.y >= this.zeppelin.y && b.y <= this.zeppelin.y + this.zeppelin.height) {
            b.active = false;
            this.zeppelin.health--;
            if (this.zeppelin.health <= 0) {
              this.zeppelin.destroyed = true;
              this.score += 600;
              this.createExplosion(this.zeppelin.x + 55, this.zeppelin.y + 18, 30, '#f97316');
              this.addFloatingScore('+600 ZEPPELIN DOWN!', this.zeppelin.x, this.zeppelin.y - 10, '#f97316');
              if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            }
            return;
          }
        }

        // Hit Enemy Planes
        this.enemyPlanes.forEach(ep => {
          if (b.active && !ep.destroyed) {
            if (Math.hypot(b.x - ep.x, b.y - ep.y) < 22) {
              b.active = false;
              ep.destroyed = true;
              this.score += 800;
              this.createExplosion(ep.x, ep.y, 25, '#dc2626');
              this.addFloatingScore('+800 RED BARON SHOT!', ep.x, ep.y - 14, '#ef4444');
              if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            }
          }
        });

        // Hit Ground Targets
        this.targets.forEach(t => {
          if (b.active && !t.destroyed) {
            if (b.x >= t.x && b.x <= t.x + t.width && b.y >= t.y && b.y <= t.y + t.height) {
              b.active = false;
              t.health--;
              if (t.health <= 0) {
                t.destroyed = true;
                this.score += t.points;
                this.createExplosion(t.x + t.width / 2, t.y + t.height / 2, 20, '#f59e0b');
                this.addFloatingScore(`+${t.points}`, t.x, t.y - 12, '#fde047');
                if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
              }
            }
          }
        });
      } else if (b.team === 'ENEMY') {
        // Enemy bullet vs player plane
        const p = this.biplane;
        if (!p.dead && Math.hypot(b.x - p.x, b.y - p.y) < 18) {
          b.active = false;
          this.damagePlayer(20);
        }
      }
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Retro CGA/EGA 1984 Blue Sky with subtle horizon gradient
    const sky = ctx.createLinearGradient(0, 0, 0, this.groundY);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(0.7, '#7dd3fc');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // Camera translation (world scrolls horizontally)
    ctx.translate(-Math.round(this.cameraX), 0);

    // Draw world with wrapping support for entities visible near seam
    this.renderWorldContent(ctx);
    // Draw mirrored content on right seam for seamless scrolling
    ctx.translate(this.worldWidth, 0);
    this.renderWorldContent(ctx);
    ctx.restore();

    // Floating text
    this.floatingScores.forEach(fs => {
      ctx.save();
      const screenX = (fs.x - this.cameraX + this.worldWidth) % this.worldWidth;
      ctx.fillStyle = fs.color;
      ctx.font = 'bold 12px monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(fs.text, screenX, fs.y);
      ctx.restore();
    });

    // Mission status and full-world radar remain visible while scrolling.
    const remaining = this.targets.filter(t => !t.destroyed).length;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    const status = this.state === 'PAUSED' ? 'PAUSED — P TO RESUME'
      : this.state === 'CRASHED' ? 'PLANE LOST — PREPARING NEXT SORTIE'
      : this.biplane.isStalling ? 'STALL — LOWER THE NOSE / ADD THROTTLE'
      : this.biplane.isGrounded ? 'HOLD UP + LEFT TO TAKE OFF • STOP TO REARM'
      : remaining ? `DESTROY ${remaining} GROUND TARGETS • B TO BOMB`
      : 'RETURN TO BASE • LAND LEVEL BELOW 130 • BRAKE TO STOP';
    ctx.fillText(status, 12, 19);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h - 38, w, 38);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(this.runwayX1 / this.worldWidth * w, h - 15, (this.runwayX2 - this.runwayX1) / this.worldWidth * w, 4);
    this.targets.forEach(t => {
      ctx.fillStyle = t.destroyed ? '#64748b' : '#fb7185';
      ctx.fillRect(t.x / this.worldWidth * w, h - 17, 5, 6);
    });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.biplane.x / this.worldWidth * w, h - 26, 4, 8);
    ctx.fillText(`M${this.level}   HULL ${this.biplane.health}%   GUN ${Math.round(this.biplane.gunHeat)}%`, 12, h - 25);

    // Landing success banner
    if (this.state === 'LANDED_SUCCESS') {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(w * 0.2, h * 0.35, w * 0.6, 90);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.2, h * 0.35, w * 0.6, 90);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION COMPLETE!', w / 2, h * 0.44);
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('REFUELED & REARMED • NEXT MISSION ➜', w / 2, h * 0.52);
      ctx.restore();
    }
  }

  renderWorldContent(ctx) {
    // Parallax Mountains / Hills
    ctx.fillStyle = '#15803d'; // Green rolling terrain
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    for (let x = 0; x <= this.worldWidth; x += 100) {
      const hillHeight = Math.sin(x * 0.005) * 35 + Math.cos(x * 0.012) * 20;
      ctx.lineTo(x, this.groundY - 45 - hillHeight);
    }
    ctx.lineTo(this.worldWidth, this.groundY + 100);
    ctx.lineTo(0, this.groundY + 100);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#166534';
    ctx.fillRect(0, this.groundY, this.worldWidth, 100);

    // Ground Dirt Underneath
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, this.groundY + 8, this.worldWidth, 80);

    // Home Runway (Flat green turf with white landing boundary markers)
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.runwayX1, this.groundY - 6, this.runwayX2 - this.runwayX1, 14);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.runwayX1, this.groundY - 6, this.runwayX2 - this.runwayX1, 14);

    // Runway stripes
    ctx.fillStyle = '#ffffff';
    for (let rx = this.runwayX1 + 20; rx < this.runwayX2 - 20; rx += 50) {
      ctx.fillRect(rx, this.groundY - 2, 24, 4);
    }

    // Home Hangar & Control Tower
    ctx.fillStyle = '#475569';
    ctx.fillRect(60, this.groundY - 45, 55, 40);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(60, this.groundY - 45, 55, 40);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('RAF BASE', 65, this.groundY - 30);

    // Windsock
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(490, this.groundY - 35, 2, 30);
    ctx.beginPath();
    ctx.moveTo(492, this.groundY - 35);
    ctx.lineTo(512, this.groundY - 30);
    ctx.lineTo(512, this.groundY - 24);
    ctx.lineTo(492, this.groundY - 26);
    ctx.closePath();
    ctx.fill();

    // Render Targets
    this.targets.forEach(t => t.render(ctx));

    // Render Zeppelin
    if (this.zeppelin) this.zeppelin.render(ctx);

    // Render Enemy Planes
    this.enemyPlanes.forEach(ep => ep.render(ctx));

    // Render Bombs
    this.bombs.forEach(b => b.render(ctx));

    // Render Bullets
    this.bullets.forEach(b => b.render(ctx));

    // Render Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Biplane
    this.biplane.render(ctx);
  }
}
