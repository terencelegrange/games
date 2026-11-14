import { BaseGame } from './baseGame.js';
import { GameMap, TILE_SIZE } from './map.js';
import { Pacman } from './pacman.js';
import { Ghost, GHOST_STATE } from './ghost.js';
import { PacmanAudio } from './audio.js';
import { PacmanRenderer } from './renderer.js';
import { InputManager } from './input.js';

export class PacmanGame extends BaseGame {
  constructor(containerElement, options = {}) {
    super(containerElement, options);

    this.lives = 3;
    this.level = 1;
    this.score = 0;
    this.ghostEatMultiplier = 1;
    this.floatingScores = [];

    // Global Scatter/Chase cycle timers
    this.cycleTimer = 0;
    this.globalGhostState = GHOST_STATE.SCATTER;

    this.gameState = 'READY'; // READY, PLAYING, DYING, LEVEL_CLEAR, GAME_OVER, PAUSED
    this.stateTimer = 120; // 2 seconds ready state

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.renderer = new PacmanRenderer(this.canvas);

    this.audio = new PacmanAudio();
    if (options.muted) {
      this.audio.setMuted(true);
    }

    this.input = new InputManager();
    this.input.attach(this.container);

    this.speedMultiplier = options.speed || 1.0;

    this.rafId = null;
    this.lastTime = 0;
    this.accumulator = 0;

    this.init();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Number(multiplier) || 1.0;
    if (this.pacman) {
      this.pacman.setSpeedMultiplier(this.speedMultiplier);
    }
    if (this.ghosts) {
      this.ghosts.forEach(g => g.setSpeedMultiplier(this.speedMultiplier));
    }
  }

  init() {
    this.map = new GameMap();
    this.pacman = new Pacman(this.map, this.speedMultiplier);

    this.ghosts = [
      new Ghost('Blinky', '#ff0000', 13, 11, 25, 0, this.map, this.speedMultiplier),
      new Ghost('Pinky', '#ffb8ff', 13, 14, 2, 0, this.map, this.speedMultiplier),
      new Ghost('Inky', '#00ffff', 11, 14, 27, 31, this.map, this.speedMultiplier),
      new Ghost('Clyde', '#ffb851', 15, 14, 0, 31, this.map, this.speedMultiplier)
    ];

    this.blinky = this.ghosts[0];

    this.input.onAction('DIR_UP', () => this.pacman.setDesiredDirection('UP'));
    this.input.onAction('DIR_DOWN', () => this.pacman.setDesiredDirection('DOWN'));
    this.input.onAction('DIR_LEFT', () => this.pacman.setDesiredDirection('LEFT'));
    this.input.onAction('DIR_RIGHT', () => this.pacman.setDesiredDirection('RIGHT'));

    this.audio.playStartJingle();
  }

  start() {
    this.isPaused = false;
    this.loop = this.gameLoop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  setMuted(muted) {
    this.audio.setMuted(muted);
  }

  resetPositions() {
    this.pacman.reset();
    this.ghosts.forEach(g => g.reset());
    this.ghostEatMultiplier = 1;
    this.globalGhostState = GHOST_STATE.SCATTER;
    this.cycleTimer = 0;
  }

  nextLevel() {
    this.level++;
    this.onLevelUpdate(this.level);
    this.map.reset();
    this.resetPositions();
    this.gameState = 'READY';
    this.stateTimer = 90;
    this.audio.playStartJingle();
  }

  gameLoop(currentTime) {
    if (!this.lastTime) {
      this.lastTime = currentTime;
      this.accumulator = 0;
    }
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      const step = 1 / 60;
      this.accumulator = (this.accumulator || 0) + dt;
      while (this.accumulator >= step) {
        this.update();
        this.accumulator -= step;
      }
    }
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  update() {
    // Update floating score elements
    this.floatingScores = this.floatingScores.filter(item => {
      item.timer--;
      return item.timer > 0;
    });

    if (this.gameState === 'READY') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.gameState = 'PLAYING';
      }
      return;
    }

    if (this.gameState === 'LEVEL_CLEAR') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.nextLevel();
      }
      return;
    }

    if (this.gameState === 'DYING') {
      this.pacman.update();
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.audio.stopSiren();
          this.onGameOverCallback(this.score);
        } else {
          this.resetPositions();
          this.gameState = 'READY';
          this.stateTimer = 90;
        }
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    // Scatter / Chase wave timer
    this.cycleTimer++;
    const cyclePhase = Math.floor(this.cycleTimer / 60) % 27;
    if (cyclePhase < 7) {
      this.globalGhostState = GHOST_STATE.SCATTER;
    } else {
      this.globalGhostState = GHOST_STATE.CHASE;
    }

    // Update Pac-Man
    this.pacman.update();

    // Check pellet consumption
    const pCol = this.pacman.getCol();
    const pRow = this.pacman.getRow();
    const pelletType = this.map.consumePellet(pCol, pRow);

    if (pelletType === 'PELLET') {
      this.addScore(10);
      this.audio.playChomp();
    } else if (pelletType === 'ENERGIZER') {
      this.addScore(50);
      this.ghostEatMultiplier = 1;
      this.audio.startSiren();
      const frightenedDuration = Math.max(180, 420 - (this.level - 1) * 40);
      this.ghosts.forEach(g => g.setFrightened(frightenedDuration));
    }

    // Check if level cleared
    if (this.map.pelletsRemaining <= 0) {
      this.gameState = 'LEVEL_CLEAR';
      this.stateTimer = 90;
      this.audio.stopSiren();
      if (typeof this.options.onLevelClear === 'function') {
        this.options.onLevelClear(this.level, this.score);
      }
      return;
    }

    // Update ghosts & collisions
    const isGlobalFrightened = this.ghosts.some(g => g.state === GHOST_STATE.FRIGHTENED);
    let anyFrightened = false;

    for (const ghost of this.ghosts) {
      ghost.update(this.pacman, this.blinky, this.globalGhostState, isGlobalFrightened);

      if (ghost.state === GHOST_STATE.FRIGHTENED) {
        anyFrightened = true;
      }

      // Check collision
      const dist = Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y);
      if (dist < TILE_SIZE * 0.75) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
          // Ghost eaten!
          const points = 200 * this.ghostEatMultiplier;
          this.ghostEatMultiplier *= 2;
          this.addScore(points);
          this.audio.playEatGhost();
          ghost.eat();

          this.floatingScores.push({
            points,
            x: ghost.x,
            y: ghost.y,
            timer: 45
          });
        } else if (
          ghost.state !== GHOST_STATE.EATEN && 
          ghost.state !== GHOST_STATE.ENTERING_HOUSE &&
          ghost.state !== GHOST_STATE.HOUSE &&
          ghost.state !== GHOST_STATE.EXITING
        ) {
          // Pac-Man caught!
          this.gameState = 'DYING';
          this.stateTimer = 90;
          this.pacman.isDying = true;
          this.lives--;
          this.onLivesUpdate(this.lives);
          this.audio.stopSiren();
          this.audio.playDeath();
          break;
        }
      }
    }

    if (!anyFrightened) {
      this.audio.stopSiren();
    }
  }

  addScore(pts) {
    this.score += pts;
    this.onScoreUpdate(this.score);
  }

  render() {
    this.renderer.clear();
    this.renderer.drawMap(this.map);
    this.renderer.drawPacman(this.pacman);

    for (const ghost of this.ghosts) {
      this.renderer.drawGhost(ghost);
    }

    this.renderer.drawFloatingScores(this.floatingScores);

    if (this.gameState === 'READY') {
      this.renderer.drawOverlay('READY!', 'GET READY!', '#ffff00');
    } else if (this.gameState === 'LEVEL_CLEAR') {
      this.renderer.drawOverlay('CLEARED!', 'BONUS STAGE', '#00ffcc');
    } else if (this.gameState === 'GAME_OVER') {
      this.renderer.drawOverlay('GAME OVER', 'PRESS RETRY', '#ff2255');
    } else if (this.isPaused) {
      this.renderer.drawOverlay('PAUSED', 'PRESS SPACE TO RESUME', '#00e5ff');
    }
  }

  pause() {
    super.pause();
    this.audio.stopSiren();
  }

  resume() {
    super.resume();
  }

  reset() {
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.onLivesUpdate(this.lives);
    this.onScoreUpdate(this.score);
    this.onLevelUpdate(this.level);
    this.map.reset();
    this.resetPositions();
    this.gameState = 'READY';
    this.stateTimer = 90;
    this.audio.playStartJingle();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.audio.destroy();
    this.input.detach(this.container);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
