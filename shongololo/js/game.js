/**
 * Shongololo Game Engine
 */

import { Shongololo, FoodItem, Maze } from './entities.js';
import { sound } from './audio.js';

export const SPEEDS = {
  1: 0.20,
  2: 0.175,
  3: 0.15,
  4: 0.13,
  5: 0.11,
  6: 0.09,
  7: 0.075,
  8: 0.06,
  9: 0.045
};

export class ShongololoGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.cols = 30;
    this.rows = 20;
    this.cellSize = 14;

    this.speedLevel = 5;
    this.mazeType = 'CLASSIC_BOX'; // CLASSIC_BOX, SAVANNAH_WRAP, ACACIA_GROVE

    this.score = 0;
    this.foodEaten = 0;
    this.state = 'READY'; // READY, PLAYING, GAME_OVER, PAUSED

    this.stepTimer = 0;
    this.shongololo = null;
    this.food = null;
    this.bonusBug = null;
    this.maze = null;

    this.init();
  }

  init() {
    this.maze = new Maze(this.mazeType, this.cols, this.rows);
    this.reset();
  }

  setSpeed(level) {
    const l = Math.max(1, Math.min(9, parseInt(level, 10) || 5));
    this.speedLevel = l;
    if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(this.speedLevel);
  }

  setMaze(type) {
    if (['CLASSIC_BOX', 'SAVANNAH_WRAP', 'ACACIA_GROVE'].includes(type)) {
      this.mazeType = type;
      this.maze = new Maze(this.mazeType, this.cols, this.rows);
      this.reset();
      if (this.callbacks.onMazeUpdate) this.callbacks.onMazeUpdate(this.mazeType);
    }
  }

  reset() {
    this.score = 0;
    this.foodEaten = 0;
    this.stepTimer = 0;
    this.bonusBug = null;

    // Start millipede in center heading right
    const startX = Math.floor(this.cols / 3);
    const startY = Math.floor(this.rows / 2);
    this.shongololo = new Shongololo(startX, startY, 4);

    this.spawnFood();

    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
    if (this.callbacks.onLengthUpdate) this.callbacks.onLengthUpdate(this.shongololo.body.length);
  }

  start() {
    this.reset();
    this.state = 'PLAYING';
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      return true;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      return false;
    }
    return false;
  }

  getRandomFreeCell() {
    const occupied = new Set();

    // Add millipede body
    this.shongololo.body.forEach(seg => occupied.add(`${seg.x},${seg.y}`));

    // Add maze walls
    if (this.mazeType === 'CLASSIC_BOX') {
      for (let x = 0; x < this.cols; x++) {
        occupied.add(`${x},0`);
        occupied.add(`${x},${this.rows - 1}`);
      }
      for (let y = 0; y < this.rows; y++) {
        occupied.add(`0,${y}`);
        occupied.add(`${this.cols - 1},${y}`);
      }
    } else if (this.maze) {
      this.maze.walls.forEach(w => occupied.add(w));
    }

    const free = [];
    for (let x = 1; x < this.cols - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }

    if (free.length === 0) return { x: 5, y: 5 };
    const idx = Math.floor(Math.random() * free.length);
    return free[idx];
  }

  spawnFood() {
    const pos = this.getRandomFreeCell();
    this.food = new FoodItem(pos.x, pos.y, false);
  }

  spawnBonusBug() {
    const pos = this.getRandomFreeCell();
    this.bonusBug = new FoodItem(pos.x, pos.y, true, 12.0);
  }

  handleDirection(dx, dy) {
    if (this.state === 'PLAYING' && this.shongololo) {
      this.shongololo.setDirection(dx, dy);
      sound.step();
    }
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Update bonus bug timer
    if (this.bonusBug) {
      this.bonusBug.update(dt);
      if (!this.bonusBug.active) {
        this.bonusBug = null;
      }
    }

    // Step tick
    const interval = SPEEDS[this.speedLevel] || 0.11;
    this.stepTimer += dt;

    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.tick();
    }
  }

  tick() {
    const s = this.shongololo;
    const isWrap = this.mazeType !== 'CLASSIC_BOX';

    // Calculate prospective head position
    let nextX = s.body[0].x + s.nextDir.x;
    let nextY = s.body[0].y + s.nextDir.y;

    if (isWrap) {
      nextX = (nextX + this.cols) % this.cols;
      nextY = (nextY + this.rows) % this.rows;
    }

    // Check Wall Collision
    if (this.maze.isWall(nextX, nextY)) {
      this.gameOver('CRASHED INTO WALL');
      return;
    }

    // Check Self Collision
    for (let i = 0; i < s.body.length - 1; i++) {
      if (s.body[i].x === nextX && s.body[i].y === nextY) {
        this.gameOver('BIT OWN TAIL');
        return;
      }
    }

    // Check Food Consumption
    let grow = false;
    if (this.food && nextX === this.food.x && nextY === this.food.y) {
      grow = true;
      sound.eat();
      this.foodEaten++;
      const pts = 10 * this.speedLevel;
      this.score += pts;
      if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);

      // Spawn next fruit
      this.spawnFood();

      // Every 5 fruits, spawn a bonus sun beetle!
      if (this.foodEaten % 5 === 0 && !this.bonusBug) {
        this.spawnBonusBug();
      }
    }

    // Check Bonus Bug Consumption
    if (this.bonusBug && this.bonusBug.active && nextX === this.bonusBug.x && nextY === this.bonusBug.y) {
      grow = true;
      sound.eatBonus();
      const bonusPts = 50 * this.speedLevel;
      this.score += bonusPts;
      if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
      this.bonusBug = null;
    }

    // Step forward
    s.step(grow, isWrap, this.cols, this.rows);
    if (this.callbacks.onLengthUpdate) this.callbacks.onLengthUpdate(s.body.length);
  }

  gameOver(reason = 'GAME OVER') {
    this.state = 'GAME_OVER';
    this.shongololo.dead = true;
    sound.crash();

    if (this.callbacks.onGameOver) {
      this.callbacks.onGameOver({
        score: this.score,
        length: this.shongololo.body.length,
        speed: this.speedLevel,
        reason
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.cols * this.cellSize;
    const h = this.rows * this.cellSize;

    // Nokia 6110 Monochrome Green LCD Tint
    ctx.fillStyle = '#879738';
    ctx.fillRect(0, 0, w, h);

    // Subtle LCD dot-matrix pixel grid texture
    ctx.fillStyle = 'rgba(27, 42, 9, 0.04)';
    for (let x = 0; x < w; x += 2) {
      ctx.fillRect(x, 0, 1, h);
    }
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }

    // Render Maze Walls
    if (this.maze) {
      this.maze.render(ctx, this.cellSize);
    }

    // Render Food
    if (this.food) {
      this.food.render(ctx, this.cellSize);
    }

    // Render Bonus Sun Bug
    if (this.bonusBug) {
      this.bonusBug.render(ctx, this.cellSize);
    }

    // Render Millipede (Shongololo)
    if (this.shongololo) {
      this.shongololo.render(ctx, this.cellSize);
    }

    // Game Over Overlay
    if (this.state === 'GAME_OVER') {
      ctx.save();
      ctx.fillStyle = 'rgba(27, 42, 9, 0.85)';
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.4);
      ctx.strokeStyle = '#1b2a09';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.4);

      ctx.fillStyle = '#879738';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SCORE: ' + this.score, w / 2, h * 0.46);
      ctx.font = 'bold 9px monospace';
      ctx.fillText('PRESS 5 OR TAP', w / 2, h * 0.58);
      ctx.restore();
    }
  }
}
