/**
 * Arkanoid - Core Game Engine
 * Manages ball physics, brick grids, powerup capsules, round transitions, and lives.
 */

import {
  Paddle,
  Ball,
  Brick,
  Capsule,
  BrickParticle,
  ARENA_LEFT,
  ARENA_RIGHT,
  ARENA_TOP,
  ARENA_BOTTOM,
  BASE_BALL_SPEED
} from './entities.js';
import { sound } from './audio.js';

export function createStageBricks(round = 1) {
  const bricks = [];
  const startX = ARENA_LEFT + 15;
  const startY = ARENA_TOP + 40;
  const brickW = 38;
  const brickH = 16;
  const cols = 11;

  if (round === 1) {
    // Round 1: Classic Taito Arkanoid 6-tier wall
    const rowTypes = ['silver', 'red', 'yellow', 'blue', 'pink', 'green'];
    rowTypes.forEach((type, row) => {
      for (let col = 0; col < cols; col++) {
        bricks.push(new Brick(startX + col * brickW, startY + row * brickH, type, brickW, brickH));
      }
    });
  } else if (round === 2) {
    // Round 2: Castle Chevron with silver bastions
    const rowTypes = ['gold', 'silver', 'red', 'yellow', 'cyan', 'green', 'pink'];
    rowTypes.forEach((type, row) => {
      for (let col = 0; col < cols; col++) {
        if ((row + col) % 2 === 0) {
          const t = (col === 0 || col === cols - 1) ? 'silver' : type;
          bricks.push(new Brick(startX + col * brickW, startY + row * brickH, t, brickW, brickH));
        }
      }
    });
  } else {
    // Round 3+: Fortress with Gold pillars and high-value rows
    const rowTypes = ['silver', 'red', 'yellow', 'pink', 'cyan', 'green', 'blue'];
    rowTypes.forEach((type, row) => {
      for (let col = 0; col < cols; col++) {
        if (col === 2 || col === 8) {
          if (row < 4) bricks.push(new Brick(startX + col * brickW, startY + row * brickH, 'gold', brickW, brickH));
        } else {
          bricks.push(new Brick(startX + col * brickW, startY + row * brickH, type, brickW, brickH));
        }
      }
    });
  }

  return bricks;
}

export class ArkanoidGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.callbacks = callbacks;

    this.state = 'READY'; // 'READY' | 'PLAYING' | 'ROUND_CLEAR' | 'GAME_OVER' | 'PAUSED'
    this.score = 0;
    this.round = 1;
    this.lives = 3;

    this.paddle = new Paddle(240);
    this.balls = [new Ball(240, 575)];
    this.bricks = [];
    this.capsules = [];
    this.lasers = [];
    this.particles = [];

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
    this.round = 1;
    this.lives = 3;
    this.setupRound(1);
    this.state = 'READY';

    if (this.callbacks.onScore) this.callbacks.onScore(0);
    if (this.callbacks.onRound) this.callbacks.onRound(1);
    if (this.callbacks.onLives) this.callbacks.onLives(3);
    if (this.callbacks.onReady) this.callbacks.onReady();
  }

  setupRound(round) {
    this.round = round;
    this.paddle.reset();
    this.balls = [new Ball(this.paddle.x, this.paddle.y - 15)];
    this.bricks = createStageBricks(round);
    this.capsules = [];
    this.lasers = [];
    this.particles = [];
    this.state = 'READY';

    if (this.callbacks.onRound) this.callbacks.onRound(this.round);
    if (this.callbacks.onReady) this.callbacks.onReady();
  }

  handleAction() {
    if (this.state === 'READY') {
      // Launch ball
      const gluedBall = this.balls.find(b => b.isGlued);
      if (gluedBall) {
        gluedBall.launch();
        this.state = 'PLAYING';
        if (this.callbacks.onStart) this.callbacks.onStart();
        sound.paddleBounce();
      }
      return true;
    }

    if (this.state === 'PLAYING') {
      // If any ball is caught/glued, release it
      let launched = false;
      this.balls.forEach(ball => {
        if (ball.isGlued) {
          ball.launch();
          launched = true;
          sound.paddleBounce();
        }
      });

      // If paddle has laser, fire laser cannons
      if (this.paddle.canFireLaser()) {
        const bolts = this.paddle.fireLaser();
        if (bolts) {
          this.lasers.push(...bolts);
          sound.laserFire();
        }
      }
      return true;
    }

    return false;
  }

  movePaddle(targetX) {
    this.paddle.moveTo(targetX);
  }

  stepPaddle(dir, dt) {
    this.paddle.move(dir, dt);
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

  spawnCapsule(x, y) {
    const types = ['L', 'E', 'C', 'D', 'S', 'P'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.capsules.push(new Capsule(x, y, type));
  }

  applyCapsule(type) {
    sound.powerupCatch();
    if (this.callbacks.onPowerup) this.callbacks.onPowerup(type);

    switch (type) {
      case 'L': // Laser
        this.paddle.setLaser(true);
        this.paddle.setCatch(false);
        break;
      case 'E': // Enlarge
        this.paddle.setEnlarge(true);
        break;
      case 'C': // Catch
        this.paddle.setCatch(true);
        this.paddle.setLaser(false);
        break;
      case 'D': // Disrupt / Multi-ball
        if (this.balls.length > 0) {
          const main = this.balls[0];
          const b1 = new Ball(main.x, main.y);
          const b2 = new Ball(main.x, main.y);
          b1.speed = main.speed;
          b2.speed = main.speed;
          b1.launch(main.speed * 0.7, -main.speed * 0.7);
          b2.launch(-main.speed * 0.7, -main.speed * 0.7);
          this.balls.push(b1, b2);
        }
        break;
      case 'S': // Slow
        this.balls.forEach(b => {
          b.speed = BASE_BALL_SPEED;
          const len = Math.hypot(b.vx, b.vy) || 1;
          b.vx = (b.vx / len) * b.speed;
          b.vy = (b.vy / len) * b.speed;
        });
        break;
      case 'P': // Player / Extra Life
        this.lives += 1;
        if (this.callbacks.onLives) this.callbacks.onLives(this.lives);
        break;
    }
  }

  spawnDebris(brick) {
    const color = {
      white: '#f8fafc',
      orange: '#f97316',
      cyan: '#06b6d4',
      green: '#22c55e',
      red: '#ef4444',
      blue: '#3b82f6',
      pink: '#ec4899',
      yellow: '#eab308',
      silver: '#cbd5e1'
    }[brick.type] || '#ef4444';

    for (let i = 0; i < 8; i++) {
      this.particles.push(new BrickParticle(brick.x + brick.width / 2, brick.y + brick.height / 2, color));
    }
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    sound.lifeLost();
    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        score: this.score,
        round: this.round
      });
    }
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead()) this.particles.splice(i, 1);
    }

    if (this.state === 'READY') {
      this.paddle.update(dt);
      this.balls.forEach(b => b.update(dt, this.paddle));
      return;
    }

    if (this.state !== 'PLAYING') return;

    this.paddle.update(dt);

    // 1. Update Laser Bullets
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update(dt);

      for (const brick of this.bricks) {
        if (brick.alive && laser.checkCollision(brick)) {
          this.score += brick.getPoints(this.round);
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);
          this.spawnDebris(brick);
          sound.brickBreak();
          if (Math.random() < 0.18) this.spawnCapsule(brick.x + brick.width / 2, brick.y);
          break;
        }
      }

      if (!laser.alive) this.lasers.splice(i, 1);
    }

    // 2. Update Capsules
    for (let i = this.capsules.length - 1; i >= 0; i--) {
      const cap = this.capsules[i];
      cap.update(dt);

      if (cap.checkCollision(this.paddle)) {
        this.applyCapsule(cap.type);
        this.capsules.splice(i, 1);
      } else if (cap.y > ARENA_BOTTOM) {
        this.capsules.splice(i, 1);
      }
    }

    // 3. Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update(dt, this.paddle);

      // Check paddle bounce
      if (ball.checkPaddleCollision(this.paddle)) {
        sound.paddleBounce();
      }

      // Check brick collisions
      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        const destroyed = brick.checkCollision(ball);
        if (destroyed) {
          this.score += brick.getPoints(this.round);
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);
          this.spawnDebris(brick);
          sound.brickBreak();
          if (Math.random() < 0.18) this.spawnCapsule(brick.x + brick.width / 2, brick.y);
          break;
        } else if (brick.hitsRemaining < brick.maxHits) {
          sound.metalRicochet();
          break;
        }
      }

      // Check bottom pit fall
      if (ball.isOutOfBounds()) {
        this.balls.splice(i, 1);
      }
    }

    // Check if all balls were lost
    if (this.balls.length === 0) {
      this.lives -= 1;
      if (this.callbacks.onLives) this.callbacks.onLives(this.lives);

      if (this.lives > 0) {
        sound.lifeLost();
        this.paddle.reset();
        this.balls = [new Ball(this.paddle.x, this.paddle.y - 15)];
        this.capsules = [];
        this.lasers = [];
        this.state = 'READY';
        if (this.callbacks.onReady) this.callbacks.onReady();
      } else {
        this.triggerGameOver();
        return;
      }
    }

    // 4. Check if all destructible bricks cleared
    const remainingDestructible = this.bricks.filter(b => b.alive && b.type !== 'gold').length;
    if (remainingDestructible === 0) {
      this.state = 'ROUND_CLEAR';
      sound.roundClear();
      if (this.callbacks.onRoundClear) this.callbacks.onRoundClear(this.round);
      setTimeout(() => {
        this.setupRound(this.round + 1);
      }, 1600);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Arena Metallic Walls & Grid Backdrop
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle arena grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let x = ARENA_LEFT; x <= ARENA_RIGHT; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, ARENA_TOP);
      ctx.lineTo(x, ARENA_BOTTOM);
      ctx.stroke();
    }
    for (let y = ARENA_TOP; y <= ARENA_BOTTOM; y += 38) {
      ctx.beginPath();
      ctx.moveTo(ARENA_LEFT, y);
      ctx.lineTo(ARENA_RIGHT, y);
      ctx.stroke();
    }

    // Outer Neon Border Beams
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, ARENA_LEFT, this.height);
    ctx.fillRect(ARENA_RIGHT, 0, this.width - ARENA_RIGHT, this.height);
    ctx.fillRect(0, 0, this.width, ARENA_TOP);

    // Neon Cyan Pinstripes
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(ARENA_LEFT - 3, ARENA_TOP, 3, this.height);
    ctx.fillRect(ARENA_RIGHT, ARENA_TOP, 3, this.height);
    ctx.fillRect(ARENA_LEFT - 3, ARENA_TOP - 3, ARENA_RIGHT - ARENA_LEFT + 6, 3);

    // 2. Render Bricks
    for (const brick of this.bricks) {
      brick.render(ctx);
    }

    // 3. Render Capsules
    for (const cap of this.capsules) {
      cap.render(ctx);
    }

    // 4. Render Laser Bullets
    for (const laser of this.lasers) {
      laser.render(ctx);
    }

    // 5. Render Particles
    for (const p of this.particles) {
      p.render(ctx);
    }

    // 6. Render Vaus Paddle & Balls
    this.paddle.render(ctx);
    for (const ball of this.balls) {
      ball.render(ctx);
    }
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    this.animationId = requestAnimationFrame(t => this.loop(t));
  }
}
