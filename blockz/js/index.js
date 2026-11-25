import { BaseGame } from './baseGame.js';
import { TetrisBoard } from './board.js';
import { Randomizer, rotateMatrix } from './tetromino.js';
import { TetrisAudio } from './audio.js';
import { TetrisRenderer } from './renderer.js';
import { InputManager } from './input.js';

export class TetrisGame extends BaseGame {
  constructor(containerElement, options = {}) {
    super(containerElement, options);

    this.level = 1;
    this.score = 0;
    this.lines = 0;

    this.gameState = 'PLAYING'; // PLAYING, CLEARING, GAME_OVER, PAUSED
    this.dropCounter = 0;
    this.lockTimer = 0;
    this.lockDelayMax = 30; // ~0.5s lock delay

    this.holdPiece = null;
    this.canHold = true;

    this.clearingLines = [];
    this.clearAnimationTimer = 0;

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.renderer = new TetrisRenderer(this.canvas);

    this.audio = new TetrisAudio();
    if (options.muted) {
      this.audio.setMuted(true);
    }

    this.input = new InputManager();
    this.input.attach(this.container);

    this.rafId = null;
    this.lastTime = 0;

    this.init();
  }

  init() {
    this.board = new TetrisBoard();
    this.randomizer = new Randomizer();

    this.currentPiece = this.randomizer.next();
    this.nextPiece = this.randomizer.next();
    this.holdPiece = null;
    this.canHold = true;

    this.bindInputs();
    this.audio.playThemeBGM();
  }

  bindInputs() {
    this.input.onAction('DIR_LEFT', () => this.movePiece(-1));
    this.input.onAction('DIR_RIGHT', () => this.movePiece(1));
    this.input.onAction('DIR_DOWN', () => this.softDrop());
    this.input.onAction('DIR_UP', () => this.rotatePiece(true));
  }

  // Called when Fire button / Space / Action is triggered
  onActionTrigger() {
    if (this.gameState === 'PLAYING') {
      this.hardDrop();
    }
  }

  // Hold action (C key or hold button)
  onHoldTrigger() {
    if (this.gameState !== 'PLAYING' || !this.canHold) return;

    this.audio.playRotate();
    if (!this.holdPiece) {
      this.holdPiece = {
        type: this.currentPiece.type,
        color: this.currentPiece.color,
        shape: this.currentPiece.shape
      };
      this.spawnNextPiece();
    } else {
      const temp = {
        type: this.currentPiece.type,
        color: this.currentPiece.color,
        shape: this.currentPiece.shape
      };
      // Spawn held piece
      const proto = this.holdPiece;
      this.currentPiece = {
        type: proto.type,
        color: proto.color,
        shape: proto.shape.map(r => [...r]),
        x: Math.floor((10 - proto.shape[0].length) / 2),
        y: proto.type === 'I' ? -1 : 0
      };
      this.holdPiece = temp;
    }
    this.canHold = false;
  }

  start() {
    this.isPaused = false;
    this.loop = this.gameLoop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  setMuted(muted) {
    this.audio.setMuted(muted);
  }

  getDropInterval() {
    return Math.max(3, Math.floor(48 - (this.level - 1) * 4)); // Frames per drop
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update();
    }
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  update() {
    if (this.gameState === 'CLEARING') {
      this.clearAnimationTimer--;
      if (this.clearAnimationTimer <= 0) {
        this.board.clearLines(this.clearingLines);
        this.clearingLines = [];
        this.gameState = 'PLAYING';
        this.spawnNextPiece();
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    this.dropCounter++;
    const interval = this.getDropInterval();

    const isTouchingFloor = this.board.collides(this.currentPiece, 0, 1);

    if (isTouchingFloor) {
      this.lockTimer++;
      if (this.lockTimer >= this.lockDelayMax) {
        this.lockCurrentPiece();
      }
    } else {
      this.lockTimer = 0;
      if (this.dropCounter >= interval) {
        this.dropCounter = 0;
        this.currentPiece.y++;
      }
    }
  }

  movePiece(dx) {
    if (this.gameState !== 'PLAYING') return;
    if (!this.board.collides(this.currentPiece, dx, 0)) {
      this.currentPiece.x += dx;
      this.audio.playMove();
      // Reset lock delay on move
      if (this.board.collides(this.currentPiece, 0, 1)) {
        this.lockTimer = 0;
      }
    }
  }

  rotatePiece(clockwise = true) {
    if (this.gameState !== 'PLAYING') return;
    const rotated = rotateMatrix(this.currentPiece.shape, clockwise);

    // Wall kick offsets to test: 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.board.collides(this.currentPiece, kick, 0, rotated)) {
        this.currentPiece.x += kick;
        this.currentPiece.shape = rotated;
        this.audio.playRotate();
        if (this.board.collides(this.currentPiece, 0, 1)) {
          this.lockTimer = 0;
        }
        return;
      }
    }
  }

  softDrop() {
    if (this.gameState !== 'PLAYING') return;
    if (!this.board.collides(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.addScore(1);
      this.dropCounter = 0;
    }
  }

  hardDrop() {
    if (this.gameState !== 'PLAYING') return;
    const ghostY = this.board.getGhostY(this.currentPiece);
    const dropDistance = ghostY - this.currentPiece.y;
    this.currentPiece.y = ghostY;
    this.addScore(dropDistance * 2);
    this.audio.playDrop();
    this.lockCurrentPiece();
  }

  lockCurrentPiece() {
    const toppedOut = this.board.lock(this.currentPiece);
    this.audio.playDrop();

    if (toppedOut) {
      this.triggerGameOver();
      return;
    }

    // Check line clears
    const fullLines = this.board.findFullLines();
    if (fullLines.length > 0) {
      this.clearingLines = fullLines;
      this.gameState = 'CLEARING';
      this.clearAnimationTimer = 14;

      const count = fullLines.length;
      this.lines += count;

      // Scoring formula: Single 100, Double 300, Triple 500, Tetris 800
      const scoreTable = [0, 100, 300, 500, 800];
      const pts = (scoreTable[count] || 800) * this.level;
      this.addScore(pts);

      if (count === 4) {
        this.audio.playTetris();
      } else {
        this.audio.playLineClear();
      }

      // Check level advance every 10 lines
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.onLevelUpdate(this.level);
      }
    } else {
      this.spawnNextPiece();
    }
  }

  spawnNextPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.randomizer.next();
    this.canHold = true;
    this.dropCounter = 0;
    this.lockTimer = 0;

    // Check top out on spawn
    if (this.board.collides(this.currentPiece, 0, 0)) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';
    this.audio.playGameOver();
    this.onGameOverCallback(this.score);
  }

  addScore(pts) {
    this.score += pts;
    this.onScoreUpdate(this.score);
  }

  render() {
    this.renderer.clear();
    this.renderer.drawPlayfield(this.board, this.clearAnimationTimer, this.clearingLines);

    if (this.gameState === 'PLAYING') {
      const ghostY = this.board.getGhostY(this.currentPiece);
      this.renderer.drawGhostPiece(this.currentPiece, ghostY);
      this.renderer.drawActivePiece(this.currentPiece);
    }

    this.renderer.drawSidePanels(this.holdPiece, this.nextPiece, this.score, this.lines, this.level);

    if (this.gameState === 'GAME_OVER') {
      this.renderer.drawOverlay('GAME OVER', 'PRESS RETRY', '#ff2255');
    } else if (this.isPaused) {
      this.renderer.drawOverlay('PAUSED', 'PRESS P TO RESUME', '#00ffff');
    }
  }

  pause() {
    super.pause();
    this.audio.stopBGM();
  }

  resume() {
    super.resume();
    if (this.gameState === 'PLAYING') {
      this.audio.playThemeBGM();
    }
  }

  reset() {
    this.level = 1;
    this.score = 0;
    this.lines = 0;
    this.onScoreUpdate(this.score);
    this.onLevelUpdate(this.level);
    this.board.reset();
    this.init();
    this.gameState = 'PLAYING';
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
