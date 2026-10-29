/**
 * Meteor Strike - Core Game Engine
 * Manages vector space kinematics, wave progression, asteroid fracturing, saucers, and heartbeat pacing.
 */

import {
  Ship,
  Asteroid,
  Bullet,
  Saucer,
  SaucerBullet,
  VectorParticle,
  distanceSq
} from './entities.js';
import { sound } from './audio.js';

export class MeteorStrikeGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.callbacks = callbacks;

    this.state = 'READY'; // 'READY' | 'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER' | 'PAUSED'
    this.score = 0;
    this.wave = 1;
    this.lives = 3;

    this.ship = new Ship(this.width / 2, this.height / 2);
    this.asteroids = [];
    this.bullets = [];
    this.saucers = [];
    this.saucerBullets = [];
    this.particles = [];

    // Heartbeat pacing
    this.heartbeatTimer = 0;
    this.heartbeatInterval = 1.0;

    // Saucer spawn timing
    this.saucerTimer = 22;

    this.lastTime = 0;
    this.animationId = null;
    this.running = false;
    this.reset();
  }

  start() {
    this.reset();
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.setupWave(1);
    this.state = 'READY';

    if (this.callbacks.onScore) this.callbacks.onScore(0);
    if (this.callbacks.onWave) this.callbacks.onWave(1);
    if (this.callbacks.onLives) this.callbacks.onLives(3);
    if (this.callbacks.onReady) this.callbacks.onReady();
  }

  setupWave(wave) {
    this.wave = wave;
    this.ship.reset();
    this.bullets = [];
    this.saucers = [];
    this.saucerBullets = [];
    this.particles = [];
    this.saucerTimer = Math.max(12, 24 - wave * 2);

    // Spawn large asteroids away from center
    const count = Math.min(10, 4 + (wave - 1) * 2);
    this.asteroids = [];
    for (let i = 0; i < count; i++) {
      let x, y;
      do {
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      } while (Math.hypot(x - this.width / 2, y - this.height / 2) < 160);

      this.asteroids.push(new Asteroid(x, y, 'large'));
    }

    this.heartbeatInterval = 1.0;
    this.heartbeatTimer = 0;

    if (this.callbacks.onWave) this.callbacks.onWave(wave);
  }

  handleFire() {
    if (this.state === 'READY') {
      this.state = 'PLAYING';
      if (this.callbacks.onStart) this.callbacks.onStart();
    }

    if (this.state !== 'PLAYING' || !this.ship.alive) return false;

    // Cap at max 4 simultaneous bullets
    if (this.bullets.length >= 4) return false;

    // Firing offset from ship nose
    const noseX = this.ship.x + Math.cos(this.ship.angle) * 14;
    const noseY = this.ship.y + Math.sin(this.ship.angle) * 14;

    this.bullets.push(new Bullet(noseX, noseY, this.ship.angle));
    sound.fire();
    return true;
  }

  handleHyperspace() {
    if (this.state !== 'PLAYING' || !this.ship.alive) return;
    this.ship.hyperspace(this.width, this.height);
    sound.hyperspace();
    for (let i = 0; i < 16; i++) {
      this.particles.push(new VectorParticle(this.ship.x, this.ship.y, '#38bdf8'));
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      return true;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      return false;
    }
    return false;
  }

  spawnExplosion(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new VectorParticle(x, y, color));
    }
  }

  triggerShipDeath() {
    this.ship.alive = false;
    this.spawnExplosion(this.ship.x, this.ship.y, '#22c55e', 24);
    sound.explodeBig();

    this.lives -= 1;
    if (this.callbacks.onLives) this.callbacks.onLives(this.lives);

    if (this.lives > 0) {
      setTimeout(() => {
        this.ship.reset();
        this.ship.alive = true;
      }, 1000);
    } else {
      this.state = 'GAME_OVER';
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver({
          score: this.score,
          wave: this.wave
        });
      }
    }
  }

  update(dt, input = {}) {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead()) this.particles.splice(i, 1);
    }

    if (this.state === 'PAUSED') return;

    // 2. Heartbeat sound pacing: tempo increases as asteroid count decreases
    if (this.state === 'PLAYING' || this.state === 'READY') {
      this.heartbeatTimer += dt;
      const rockRatio = Math.max(0.18, Math.min(1.0, this.asteroids.length / 10));
      this.heartbeatInterval = 0.2 + rockRatio * 0.8;
      if (this.heartbeatTimer >= this.heartbeatInterval) {
        this.heartbeatTimer = 0;
        sound.heartbeat();
      }
    }

    // 3. Process ship flight inputs
    if (this.ship.alive) {
      if (input.left) this.ship.rotate(-1, dt);
      if (input.right) this.ship.rotate(1, dt);
      if (input.thrust) {
        this.ship.thrust(true, dt);
        sound.thrust();
      } else {
        this.ship.thrust(false, dt);
      }
      this.ship.update(dt, this.width, this.height);
    }

    // 4. Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.width, this.height);
      if (!b.alive) this.bullets.splice(i, 1);
    }

    // 5. Update Asteroids
    for (const rock of this.asteroids) {
      rock.update(dt, this.width, this.height);
    }

    if (this.state !== 'PLAYING') return;

    // 6. Saucer Spawning & Updating
    this.saucerTimer -= dt;
    if (this.saucerTimer <= 0 && this.saucers.length === 0) {
      const isSmall = this.wave >= 2 && Math.random() < 0.55;
      this.saucers.push(new Saucer(this.width, this.height, isSmall));
      this.saucerTimer = 22 + Math.random() * 10;
    }

    for (let i = this.saucers.length - 1; i >= 0; i--) {
      const saucer = this.saucers[i];
      saucer.update(dt, this.ship);
      sound.saucer(saucer.isSmall);

      if (saucer.canShoot(dt)) {
        const shotAngle = saucer.getShotAngle(this.ship);
        this.saucerBullets.push(new SaucerBullet(saucer.x, saucer.y, shotAngle));
      }

      if (!saucer.alive) this.saucers.splice(i, 1);
    }

    // 7. Update Saucer Bullets
    for (let i = this.saucerBullets.length - 1; i >= 0; i--) {
      const sb = this.saucerBullets[i];
      sb.update(dt, this.width, this.height);
      if (!sb.alive) this.saucerBullets.splice(i, 1);
    }

    // 8. Collisions: Bullets vs. Asteroids
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const rock = this.asteroids[ai];
        const hitDist = (rock.radius + b.radius);
        if (distanceSq(b.x, b.y, rock.x, rock.y) < hitDist * hitDist) {
          b.alive = false;
          this.score += rock.points;
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);

          if (rock.tier === 'large') sound.explodeBig();
          else if (rock.tier === 'medium') sound.explodeMed();
          else sound.explodeSmall();

          this.spawnExplosion(rock.x, rock.y, '#f8fafc', rock.tier === 'large' ? 18 : 10);

          const splits = rock.split();
          this.asteroids.splice(ai, 1);
          this.asteroids.push(...splits);
          break;
        }
      }
    }

    // 9. Collisions: Bullets vs. Saucers
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let si = this.saucers.length - 1; si >= 0; si--) {
        const saucer = this.saucers[si];
        const hitDist = saucer.radius + b.radius;
        if (distanceSq(b.x, b.y, saucer.x, saucer.y) < hitDist * hitDist) {
          b.alive = false;
          this.score += saucer.points;
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);
          sound.explodeMed();
          this.spawnExplosion(saucer.x, saucer.y, saucer.isSmall ? '#ef4444' : '#f59e0b', 16);
          this.saucers.splice(si, 1);
          break;
        }
      }
    }

    // 10. Collisions: Ship vs. Asteroids / Saucers / Alien Bullets
    if (this.ship.alive && this.ship.invulnerableTimer <= 0) {
      // vs Asteroids
      for (const rock of this.asteroids) {
        const hitDist = rock.radius + this.ship.radius - 2;
        if (distanceSq(this.ship.x, this.ship.y, rock.x, rock.y) < hitDist * hitDist) {
          this.triggerShipDeath();
          break;
        }
      }

      // vs Saucers
      if (this.ship.alive) {
        for (const saucer of this.saucers) {
          const hitDist = saucer.radius + this.ship.radius;
          if (distanceSq(this.ship.x, this.ship.y, saucer.x, saucer.y) < hitDist * hitDist) {
            this.triggerShipDeath();
            break;
          }
        }
      }

      // vs Saucer Bullets
      if (this.ship.alive) {
        for (let sbi = this.saucerBullets.length - 1; sbi >= 0; sbi--) {
          const sb = this.saucerBullets[sbi];
          const hitDist = sb.radius + this.ship.radius;
          if (distanceSq(this.ship.x, this.ship.y, sb.x, sb.y) < hitDist * hitDist) {
            sb.alive = false;
            this.triggerShipDeath();
            break;
          }
        }
      }
    }

    // 11. Wave Cleared Condition
    if (this.asteroids.length === 0) {
      this.state = 'WAVE_CLEAR';
      sound.waveClear();
      if (this.callbacks.onWaveClear) this.callbacks.onWaveClear(this.wave);
      setTimeout(() => {
        this.setupWave(this.wave + 1);
        this.state = 'PLAYING';
      }, 1600);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep vector space background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, this.width, this.height);

    // Starfield points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % this.width);
      const sy = ((i * 243.1) % this.height);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // 1. Render Asteroids
    for (const rock of this.asteroids) {
      rock.render(ctx);
    }

    // 2. Render Saucers
    for (const saucer of this.saucers) {
      saucer.render(ctx);
    }

    // 3. Render Saucer Bullets
    for (const sb of this.saucerBullets) {
      sb.render(ctx);
    }

    // 4. Render Bullets
    for (const b of this.bullets) {
      b.render(ctx);
    }

    // 5. Render Ship
    this.ship.render(ctx);

    // 6. Render Particles
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt, this.currentInput || {});
    this.render();

    this.animationId = requestAnimationFrame(t => this.loop(t));
  }
}
