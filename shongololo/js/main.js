/**
 * Shongololo - 1998 Nokia Snake Arcade Application Entry Point
 */

import { ShongololoGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class ShongololoApp {
  constructor() {
    this.canvas = document.getElementById('shongololo-canvas');
    this.btnBack = document.getElementById('btn-back-hub');
    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLength = document.getElementById('hud-length');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudMaze = document.getElementById('hud-maze');

    this.btnCycleSpeed = document.getElementById('btn-cycle-speed');
    this.btnCycleMaze = document.getElementById('btn-cycle-maze');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalLength = document.getElementById('overlay-final-length');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    this.highScore = getLocalHighScore();
    this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');

    this.soundEnabled = true;

    this.initGame();
    this.bindEvents();
    this.startGameLoop();
  }

  initGame() {
    this.game = new ShongololoGame(this.canvas, {
      onScoreUpdate: (score) => {
        this.hudScore.textContent = score.toString().padStart(4, '0');
        if (score > this.highScore) {
          this.highScore = score;
          saveLocalHighScore(this.highScore);
          this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');
        }
      },
      onLengthUpdate: (length) => {
        this.hudLength.textContent = length.toString();
      },
      onSpeedUpdate: (speed) => {
        this.hudSpeed.textContent = `SPD ${speed}`;
      },
      onMazeUpdate: (maze) => {
        const names = {
          CLASSIC_BOX: 'BOX',
          SAVANNAH_WRAP: 'WRAP',
          ACACIA_GROVE: 'GROVE'
        };
        this.hudMaze.textContent = names[maze] || maze;
      },
      onGameOver: ({ score, length, speed, reason }) => {
        this.handleGameOver(score, length, speed, reason);
      }
    });

    this.game.start();
  }

  handleGameOver(score, length, speed, reason) {
    this.overlayFinalScore.textContent = score.toString();
    this.overlayFinalLength.textContent = length.toString();
    this.overlayTitle.textContent = reason;
    this.gameOverlay.classList.add('visible');

    submitMatchRecord({
      score,
      level: speed,
      result: `LEN ${length} (${score} PTS)`
    });
  }

  bindEvents() {
    // Sound Toggle
    this.btnSound.addEventListener('click', () => {
      this.soundEnabled = sound.toggle();
      this.btnSound.textContent = this.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
      this.btnSound.classList.toggle('active', this.soundEnabled);
    });

    // Pause
    this.btnPause.addEventListener('click', () => {
      sound.init();
      const isPaused = this.game.togglePause();
      this.btnPause.textContent = isPaused ? 'RESUME' : 'PAUSE';
    });

    // Restart
    const doRestart = () => {
      sound.init();
      this.gameOverlay.classList.remove('visible');
      this.game.start();
      this.btnPause.textContent = 'PAUSE';
    };

    this.btnRestart.addEventListener('click', doRestart);
    this.overlayRestartBtn.addEventListener('click', doRestart);

    // Speed Cycle button (1 to 9)
    if (this.btnCycleSpeed) {
      this.btnCycleSpeed.addEventListener('click', () => {
        sound.init();
        let next = this.game.speedLevel + 1;
        if (next > 9) next = 1;
        this.game.setSpeed(next);
        this.btnCycleSpeed.textContent = `SPEED: ${next}`;
      });
    }

    // Maze Cycle button
    if (this.btnCycleMaze) {
      const mazes = ['CLASSIC_BOX', 'SAVANNAH_WRAP', 'ACACIA_GROVE'];
      this.btnCycleMaze.addEventListener('click', () => {
        sound.init();
        const currentIdx = mazes.indexOf(this.game.mazeType);
        const nextIdx = (currentIdx + 1) % mazes.length;
        this.game.setMaze(mazes[nextIdx]);
        const shortNames = ['BOX', 'WRAP', 'GROVE'];
        this.btnCycleMaze.textContent = `MAZE: ${shortNames[nextIdx]}`;
      });
    }

    // Keyboard controls (Nokia Keypad 2, 4, 6, 8 + Arrows/WASD)
    window.addEventListener('keydown', (e) => {
      sound.init();

      if (['ArrowUp', 'KeyW', 'Numpad8', 'Digit2'].includes(e.code)) {
        e.preventDefault();
        this.game.handleDirection(0, -1);
      } else if (['ArrowDown', 'KeyS', 'Numpad2', 'Digit8'].includes(e.code)) {
        e.preventDefault();
        this.game.handleDirection(0, 1);
      } else if (['ArrowLeft', 'KeyA', 'Numpad4', 'Digit4'].includes(e.code)) {
        e.preventDefault();
        this.game.handleDirection(-1, 0);
      } else if (['ArrowRight', 'KeyD', 'Numpad6', 'Digit6'].includes(e.code)) {
        e.preventDefault();
        this.game.handleDirection(1, 0);
      } else if (['Space', 'Enter', 'Numpad5', 'Digit5'].includes(e.code)) {
        e.preventDefault();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        } else {
          this.btnPause.click();
        }
      } else if (e.code === 'KeyP') {
        this.btnPause.click();
      } else if (e.code === 'KeyM') {
        this.btnSound.click();
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    // Virtual Nokia Keypad Button Listeners
    const bindKey = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        action();
        el.classList.add('active');
      });
      el.addEventListener('pointerup', () => el.classList.remove('active'));
      el.addEventListener('pointercancel', () => el.classList.remove('active'));
      el.addEventListener('pointerleave', () => el.classList.remove('active'));
    };

    bindKey('key-2', () => this.game.handleDirection(0, -1));
    bindKey('key-8', () => this.game.handleDirection(0, 1));
    bindKey('key-4', () => this.game.handleDirection(-1, 0));
    bindKey('key-6', () => this.game.handleDirection(1, 0));
    bindKey('key-5', () => {
      if (this.game.state === 'GAME_OVER') doRestart();
      else this.game.togglePause();
    });

    bindKey('dpad-up', () => this.game.handleDirection(0, -1));
    bindKey('dpad-down', () => this.game.handleDirection(0, 1));
    bindKey('dpad-left', () => this.game.handleDirection(-1, 0));
    bindKey('dpad-right', () => this.game.handleDirection(1, 0));

    // Touch Swipe Detection on LCD Screen
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        sound.init();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
          return;
        }

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (Math.max(absX, absY) > 20) {
          if (absX > absY) {
            this.game.handleDirection(dx > 0 ? 1 : -1, 0);
          } else {
            this.game.handleDirection(0, dy > 0 ? 1 : -1);
          }
        }
      }
    }, { passive: true });
  }

  startGameLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      this.game.update(dt);
      this.game.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ShongololoApp();
});
