/**
 * Safari Run Game Engine
 * Core loop, 60 FPS timestep accumulator, collision detection, and score progression.
 */

import { Cheetah } from './cheetah.js';
import { ObstacleManager } from './obstacle.js';
import { SafariBackground } from './background.js';
import { sound } from './audio.js';

export const STATES = {
  READY: 'READY',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class SafariRunGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.width = 900;
    this.height = 300;
    this.groundY = 240;

    // Ensure internal resolution is 900x300
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Entities
    this.cheetah = new Cheetah(this.width, this.groundY);
    this.obstacles = new ObstacleManager(this.width, this.groundY);
    this.background = new SafariBackground(this.width, this.height, this.groundY);

    // Game variables
    this.state = STATES.READY;
    this.score = 0;
    this.distanceAccumulator = 0;
    this.lastMilestone = 0;
    this.baseSpeed = 6.5;
    this.currentSpeed = this.baseSpeed;
    this.maxSpeed = 13.5;

    // Timing
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60; // 60 FPS
    this.animId = null;

    // Start in READY state
    this.render();
  }

  start() {
    if (this.state === STATES.RUNNING) return;
    this.state = STATES.RUNNING;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  reset() {
    this.state = STATES.READY;
    this.score = 0;
    this.distanceAccumulator = 0;
    this.lastMilestone = 0;
    this.currentSpeed = this.baseSpeed;
    this.cheetah.reset();
    this.obstacles.reset();
    this.background.reset();

    if (this.options.onScore) this.options.onScore(0);
    if (this.options.onSpeed) this.options.onSpeed(60, 0.2);
    if (this.options.onTimeOfDay) this.options.onTimeOfDay('SAVANNA NOON');

    this.render();
  }

  jump() {
    if (this.state === STATES.READY) {
      this.start();
      sound.jump();
      this.cheetah.jump();
      return;
    }
    if (this.state === STATES.GAME_OVER) {
      this.reset();
      this.start();
      sound.jump();
      this.cheetah.jump();
      return;
    }
    if (this.state === STATES.RUNNING) {
      if (this.cheetah.jump()) {
        sound.jump();
      }
    }
  }

  cutJump() {
    if (this.state === STATES.RUNNING) {
      this.cheetah.cutJump();
    }
  }

  duck(isDown) {
    if (this.state === STATES.RUNNING) {
      this.cheetah.duck(isDown);
      if (isDown) sound.duck();
    }
  }

  togglePause() {
    if (this.state === STATES.RUNNING) {
      this.state = STATES.PAUSED;
      if (this.animId) cancelAnimationFrame(this.animId);
      this.render();
      return true;
    } else if (this.state === STATES.PAUSED) {
      this.state = STATES.RUNNING;
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.loop);
      return false;
    }
    return false;
  }

  loop(currentTime) {
    if (this.state !== STATES.RUNNING) return;

    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.render();

    if (this.state === STATES.RUNNING) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  update(dt) {
    // 1. Calculate progressive speed
    // Starts at 6.5, reaches 13.5 max around 2000 points
    this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + (this.score * 0.0035));

    // Speed display: 60 km/h to 120 km/h (real cheetah speed!)
    const speedRatio = (this.currentSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
    const cheetahKmH = Math.round(60 + speedRatio * 60);
    if (this.options.onSpeed) {
      this.options.onSpeed(cheetahKmH, 0.2 + speedRatio * 0.8);
    }

    // 2. Advance Entities
    this.background.update(this.currentSpeed, this.score);
    this.cheetah.update(this.currentSpeed, dt);
    this.obstacles.update(this.currentSpeed, this.score);

    // 3. Update Distance Score
    this.distanceAccumulator += this.currentSpeed * 0.06;
    const newScore = Math.floor(this.distanceAccumulator);
    if (newScore !== this.score) {
      this.score = newScore;
      if (this.options.onScore) this.options.onScore(this.score);

      // 100-point Milestone detection
      if (this.score >= this.lastMilestone + 100) {
        this.lastMilestone = Math.floor(this.score / 100) * 100;
        sound.milestone();
        if (this.options.onMilestone) this.options.onMilestone(this.lastMilestone);
      }
    }

    if (this.options.onTimeOfDay) {
      this.options.onTimeOfDay(this.background.getTimeOfDayName());
    }

    // 4. Collision Detection
    this.checkCollisions();
  }

  checkCollisions() {
    const cheetahBoxes = this.cheetah.getHitboxes();

    for (const obs of this.obstacles.obstacles) {
      const obsBoxes = this.obstacles.getHitboxes(obs);

      for (const cb of cheetahBoxes) {
        for (const ob of obsBoxes) {
          if (
            cb.x < ob.x + ob.w &&
            cb.x + cb.w > ob.x &&
            cb.y < ob.y + ob.h &&
            cb.y + cb.h > ob.y
          ) {
            this.handleCrash();
            return;
          }
        }
      }
    }
  }

  handleCrash() {
    this.state = STATES.GAME_OVER;
    this.cheetah.isDead = true;
    sound.hit();

    // Speed tier based on score
    const speedTier = Math.min(10, Math.max(1, Math.floor(this.score / 200) + 1));

    if (this.options.onGameOver) {
      this.options.onGameOver(this.score, speedTier);
    }

    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw African safari backdrop
    this.background.draw(this.ctx);

    // 2. Draw obstacles (Baobabs, rocks, vultures)
    this.obstacles.draw(this.ctx);

    // 3. Draw Cheetah player
    this.cheetah.draw(this.ctx);

    // 4. State messages on canvas if ready or paused
    if (this.state === STATES.READY) {
      this.drawPrompt('PRESS SPACE OR TAP TO SPRINT', 'LEAP OVER BAOBABS & DUCK UNDER VULTURES');
    } else if (this.state === STATES.PAUSED) {
      this.drawPrompt('GAME PAUSED', 'PRESS P OR PAUSE BUTTON TO RESUME');
    }
  }

  drawPrompt(mainText, subText) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 12, 10, 0.65)';
    this.ctx.fillRect(0, 80, this.width, 100);

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(mainText, this.width / 2, 126);

    this.ctx.fillStyle = '#f5f5f4';
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(subText, this.width / 2, 154);
    this.ctx.restore();
  }
}
