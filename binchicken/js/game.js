/**
 * Bin Chicken - Core Game Engine
 * Manages game states, obstacle spawning, physics loop, scoring, and particle visual FX.
 */

import {
  BinChicken,
  WheelieBinPair,
  ParallaxBackground,
  FeatherParticle,
  BASE_SCROLL_SPEED,
  GROUND_Y
} from './entities.js';
import { sound } from './audio.js';

export class BinChickenGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.callbacks = callbacks;

    this.state = 'READY'; // 'READY' | 'PLAYING' | 'GAME_OVER' | 'PAUSED'
    this.score = 0;
    this.chips = 0;
    this.speed = BASE_SCROLL_SPEED;

    this.chicken = new BinChicken(120, 260);
    this.background = new ParallaxBackground(this.width, this.height);
    this.obstacles = [];
    this.particles = [];

    this.spawnTimer = 0;
    this.spawnInterval = 1.95; // Seconds between obstacle spawns
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    this.lastTime = 0;
    this.animationId = null;
    this.running = false;
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
    this.state = 'READY';
    this.score = 0;
    this.chips = 0;
    this.speed = BASE_SCROLL_SPEED;
    this.chicken.reset();
    this.obstacles = [];
    this.particles = [];
    this.spawnTimer = 0.5; // Short delay before first obstacle after game start
    this.shakeTimer = 0;

    if (this.callbacks.onScore) this.callbacks.onScore(0);
    if (this.callbacks.onChips) this.callbacks.onChips(0);
    if (this.callbacks.onReady) this.callbacks.onReady();
  }

  handleFlap() {
    if (this.state === 'READY') {
      this.state = 'PLAYING';
      if (this.callbacks.onStart) this.callbacks.onStart();
      this.chicken.flap();
      sound.flap();
      this.spawnFlapParticles();
      return true;
    }

    if (this.state === 'PLAYING') {
      const flapped = this.chicken.flap();
      if (flapped) {
        sound.flap();
        this.spawnFlapParticles();
      }
      return flapped;
    }

    if (this.state === 'GAME_OVER') {
      // Ignore flap during game over until player explicitly restarts
      return false;
    }

    return false;
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

  spawnFlapParticles() {
    for (let i = 0; i < 4; i++) {
      const vx = -30 - Math.random() * 40;
      const vy = 10 + (Math.random() - 0.5) * 40;
      this.particles.push(new FeatherParticle(this.chicken.x - 12, this.chicken.y + 4, vx, vy, '#f8fafc', 3, 0.45));
    }
  }

  spawnChipParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const color = Math.random() < 0.6 ? '#f59e0b' : '#fef08a';
      this.particles.push(new FeatherParticle(x, y, vx, vy, color, 3.5, 0.55));
    }
  }

  spawnCrashParticles(x, y) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const colors = ['#f8fafc', '#047857', '#ef4444', '#1e293b', '#eab308'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new FeatherParticle(x, y, vx, vy, c, 4, 0.7));
    }
  }

  triggerScreenShake(duration = 0.28, intensity = 12) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  triggerGameOver(cause = 'COLLISION') {
    if (this.state === 'GAME_OVER') return;

    this.state = 'GAME_OVER';
    this.chicken.isDead = true;
    this.triggerScreenShake(0.35, 14);
    this.spawnCrashParticles(this.chicken.x, this.chicken.y);

    sound.hit();
    sound.squawk();

    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        score: this.score,
        chips: this.chips,
        cause
      });
    }
  }

  update(dt) {
    // Screen shake countdown
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    // Update visual particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }

    // STATE: READY
    if (this.state === 'READY') {
      this.background.update(dt, this.speed * 0.4);
      this.chicken.updateIdle(dt);
      return;
    }

    // STATE: GAME_OVER
    if (this.state === 'GAME_OVER') {
      this.chicken.update(dt);
      return;
    }

    // STATE: PAUSED
    if (this.state === 'PAUSED') {
      return;
    }

    // STATE: PLAYING
    // 1. Difficulty progression: slightly ramp up speed as score advances
    this.speed = Math.min(195, BASE_SCROLL_SPEED + Math.floor(this.score / 5) * 4);

    // 2. Background and player update
    this.background.update(dt, this.speed);
    this.chicken.update(dt);

    // 3. Check ground collision
    if (this.chicken.y + this.chicken.radius >= GROUND_Y - 4) {
      this.triggerGameOver('GROUND');
      return;
    }

    // 4. Obstacle spawning
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.obstacles.push(new WheelieBinPair(this.width + 10));
    }

    // 5. Update obstacles and collision checks
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.update(dt, this.speed);

      // Check for hot chip collection
      if (obs.chip && !obs.chip.collected && obs.chip.checkCollision(this.chicken)) {
        this.chips += 1;
        this.score += 5;
        sound.chip();
        this.spawnChipParticles(obs.chip.x, obs.chip.y);
        if (this.callbacks.onChips) this.callbacks.onChips(this.chips);
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
        if (this.callbacks.onChipSnack) this.callbacks.onChipSnack(this.chips, this.score);
      }

      // Check obstacle collision
      if (obs.checkCollision(this.chicken)) {
        this.triggerGameOver('WHEELIE_BIN');
        return;
      }

      // Score passing (+1 point)
      if (!obs.passed && obs.x + obs.width < this.chicken.x) {
        obs.passed = true;
        this.score += 1;
        sound.point();
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
      }

      // Cull offscreen obstacles
      if (obs.isOffScreen()) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Screen shake transform
    if (this.shakeTimer > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. Parallax City Park Background
    this.background.render(ctx);

    // 2. Obstacles (Wheelie Bins & Hot Chips)
    for (const obs of this.obstacles) {
      obs.render(ctx);
    }

    // 3. Particles
    for (const p of this.particles) {
      p.render(ctx);
    }

    // 4. Player Bin Chicken
    this.chicken.render(ctx);

    // 5. In-game big arcade score display while playing
    if (this.state === 'PLAYING') {
      ctx.save();
      ctx.font = 'bold 36px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      // Drop shadow
      ctx.fillStyle = '#05140d';
      ctx.fillText(this.score.toString(), this.width / 2 + 3, 93);
      // Gold score
      ctx.fillStyle = '#facc15';
      ctx.fillText(this.score.toString(), this.width / 2, 90);
      ctx.restore();
    }

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(t => this.loop(t));
  }
}
