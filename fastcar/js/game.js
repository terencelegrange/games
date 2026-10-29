/**
 * Fast Car Core Game Engine
 * 60 FPS delta loop, speed physics, 3-lane collision handling, coin combos, and lives.
 */

import { Pseudo3DRoad } from './road.js';
import { PlayerCar } from './car.js';
import { HazardManager } from './hazards.js';
import { sound } from './audio.js';

export const STATES = {
  READY: 'READY',
  RACING: 'RACING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class FastCarGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.width = 900;
    this.height = 460;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems
    this.difficulty = options.difficulty || 'medium';
    this.road = new Pseudo3DRoad(this.width, this.height);
    this.playerCar = new PlayerCar(this.width, this.height);
    this.hazards = new HazardManager(this.difficulty);

    // Racing Variables
    this.state = STATES.READY;
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.combo = 1;
    this.lives = 3;
    this.currentStage = 1;

    // Speeds in KM/H
    this.minSpeed = 50;
    this.cruiseSpeed = 150;
    this.maxSpeed = 240;
    this.speed = this.cruiseSpeed;
    this.topSpeed = this.speed;

    // Input States
    this.isAccelerating = false;
    this.isBraking = false;

    // Screen shake on collision
    this.screenShake = 0;

    // Timing & 60 FPS normalization
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.animId = null;

    this.render();
  }

  start() {
    if (this.state === STATES.RACING) return;
    this.state = STATES.RACING;
    this.lastTime = performance.now();
    this.accumulator = 0;
    sound.startEngine();
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  }

  reset() {
    this.state = STATES.READY;
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.combo = 1;
    this.lives = 3;
    this.currentStage = 1;
    this.speed = this.cruiseSpeed;
    this.topSpeed = this.speed;
    this.isAccelerating = false;
    this.isBraking = false;
    this.screenShake = 0;

    this.road.reset();
    this.playerCar.reset();
    this.hazards.reset();

    if (this.options.onScore) this.options.onScore(0);
    if (this.options.onCoins) this.options.onCoins(0);
    if (this.options.onSpeed) this.options.onSpeed(this.speed);
    if (this.options.onLives) this.options.onLives(this.lives);
    if (this.options.onLevelUpdate) this.options.onLevelUpdate(this.currentStage);

    sound.stopEngine();
    this.render();
  }

  setDifficulty(diff) {
    if (['easy', 'medium', 'hard'].includes(diff)) {
      this.difficulty = diff;
      this.hazards.setDifficulty(diff);
    }
  }

  steerLeft() {
    if (this.state === STATES.READY) {
      this.start();
    }
    if (this.state === STATES.RACING) {
      this.playerCar.steerLeft();
    }
  }

  steerRight() {
    if (this.state === STATES.READY) {
      this.start();
    }
    if (this.state === STATES.RACING) {
      this.playerCar.steerRight();
    }
  }

  setAccelerating(val) {
    if (this.state === STATES.READY && val) {
      this.start();
    }
    this.isAccelerating = val;
  }

  setBraking(val) {
    this.isBraking = val;
  }

  togglePause() {
    if (this.state === STATES.RACING) {
      this.state = STATES.PAUSED;
      sound.stopEngine();
      if (this.animId) cancelAnimationFrame(this.animId);
      this.render();
      return true;
    } else if (this.state === STATES.PAUSED) {
      this.state = STATES.RACING;
      sound.startEngine();
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.loop);
      return false;
    }
    return false;
  }

  loop(currentTime) {
    if (this.state !== STATES.RACING) return;

    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this.render();

    if (this.state === STATES.RACING) {
      this.animId = requestAnimationFrame(this.loop);
    }
  }

  update(dt) {
    // 1. Acceleration / Braking Physics
    if (this.playerCar.isSpinning) {
      // Slow down drastically during spin
      this.speed = Math.max(this.minSpeed, this.speed - 120 * dt);
    } else if (this.isAccelerating) {
      this.speed = Math.min(this.maxSpeed, this.speed + 65 * dt);
    } else if (this.isBraking) {
      this.speed = Math.max(this.minSpeed, this.speed - 90 * dt);
    } else {
      // Natural cruise drag
      if (this.speed > this.cruiseSpeed) {
        this.speed = Math.max(this.cruiseSpeed, this.speed - 25 * dt);
      } else if (this.speed < this.cruiseSpeed) {
        this.speed = Math.min(this.cruiseSpeed, this.speed + 35 * dt);
      }
    }

    const currentSpeedInt = Math.round(this.speed);
    if (currentSpeedInt > this.topSpeed) {
      this.topSpeed = currentSpeedInt;
    }

    // World speed scaling factor (pixels/units per step)
    const worldSpeed = (this.speed / 160) * 12.0;

    // Update audio engine frequency
    const speedRatio = (this.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed);
    sound.updateEngine(speedRatio);

    // 2. Advance Entities
    this.road.update(worldSpeed);
    this.playerCar.update(this.road, worldSpeed, dt);
    this.hazards.update(worldSpeed, dt);

    // 3. Collision & Pickup Checks
    const events = this.hazards.checkCarCollisions(this.playerCar);

    for (const ev of events) {
      if (ev.type === 'coin') {
        sound.coin();
        this.coins++;
        const points = 100 * this.combo;
        this.score += points;

        if (this.options.onCoins) this.options.onCoins(this.coins);
        if (this.options.onScore) this.options.onScore(this.score);

        // Increase combo every 2 coins
        if (this.coins % 2 === 0 && this.combo < 5) {
          this.combo++;
          sound.combo();
          if (this.options.onCombo) this.options.onCombo(this.combo);
        }
      } else if (ev.type === 'oil_slick') {
        sound.skid();
        this.playerCar.spinOut();
        this.combo = 1;
        this.speed = Math.max(this.minSpeed, this.speed * 0.55);
      } else if (ev.type === 'barrel') {
        if (this.playerCar.hitHazard()) {
          sound.crash();
          this.screenShake = 16;
          this.combo = 1;
          this.lives--;
          this.speed = Math.max(this.minSpeed, this.speed * 0.45);

          if (this.options.onLives) this.options.onLives(this.lives);

          if (this.lives <= 0) {
            this.handleGameOver();
            return;
          }
        }
      }
    }

    // 4. Distance and Score accumulation
    this.distance += worldSpeed * 0.2;
    this.score += Math.round(worldSpeed * 0.4);

    // Stage / Level progression (advances every 600m)
    const calculatedStage = Math.floor(this.distance / 600) + 1;
    if (calculatedStage > this.currentStage) {
      this.currentStage = calculatedStage;
      sound.combo();
      if (this.options.onStageAdvance) {
        this.options.onStageAdvance(this.currentStage);
      }
      if (this.options.onLevelUpdate) {
        this.options.onLevelUpdate(this.currentStage);
      }
    }

    if (this.options.onScore) this.options.onScore(this.score);
    if (this.options.onSpeed) this.options.onSpeed(currentSpeedInt);

    // 5. Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 1.5);
    }
  }

  handleGameOver() {
    this.state = STATES.GAME_OVER;
    sound.stopEngine();

    if (this.options.onGameOver) {
      this.options.onGameOver({
        score: this.score,
        coins: this.coins,
        topSpeed: this.topSpeed,
        distance: Math.round(this.distance),
        stage: this.currentStage,
        difficulty: this.difficulty
      });
    }

    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    // Screen shake displacement
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // 1. Draw 3D Perspective Road & Scenery
    this.road.draw(this.ctx);

    // 2. Draw Hazards (Oil slicks, barrels, coins)
    this.hazards.draw(this.ctx, this.road);

    // 3. Draw Red Sports Convertible Player Car
    this.playerCar.draw(this.ctx);

    this.ctx.restore();

    // 4. Onscreen state prompts
    if (this.state === STATES.READY) {
      this.drawPrompt('PRESS LEFT / RIGHT OR TAP TO DRIVE', 'DODGE OIL SLICKS & BARRELS • COLLECT COINS');
    } else if (this.state === STATES.PAUSED) {
      this.drawPrompt('GAME PAUSED', 'PRESS P OR PAUSE BUTTON TO RESUME');
    }
  }

  drawPrompt(mainText, subText) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(9, 13, 22, 0.72)';
    this.ctx.fillRect(0, 160, this.width, 110);

    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = '16px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText(mainText, this.width / 2, 210);

    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(subText, this.width / 2, 242);
    this.ctx.restore();
  }
}
