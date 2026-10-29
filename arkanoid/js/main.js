/**
 * Arkanoid Application Entrypoint & UI Controller
 */

import { ArkanoidGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class ArkanoidApp {
  constructor() {
    this.canvas = document.getElementById('arkanoid-canvas');
    this.canvasContainer = document.getElementById('game-canvas-container');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudRound = document.getElementById('hud-round');
    this.hudLives = document.getElementById('hud-lives');

    // Overlays & Banners
    this.floatingBanner = document.getElementById('floating-banner');
    this.readyHint = document.getElementById('ready-hint');
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayBestScore = document.getElementById('overlay-best-score');
    this.overlayFinalRound = document.getElementById('overlay-final-round');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    // Controls
    this.btnLeft = document.getElementById('btn-left');
    this.btnRight = document.getElementById('btn-right');
    this.btnAction = document.getElementById('btn-action');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    this.updateHighScoreDisplay();

    this.keyState = { left: false, right: false };
    this.initGame();
    this.bindEvents();
    this.startInputLoop();
  }

  initGame() {
    this.game = new ArkanoidGame(this.canvas, {
      onScore: (score) => {
        if (this.hudScore) this.hudScore.textContent = score.toString().padStart(6, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.updateHighScoreDisplay();
          saveLocalHighScore(score);
        }
      },
      onRound: (round) => {
        if (this.hudRound) this.hudRound.textContent = round.toString();
      },
      onLives: (lives) => {
        if (this.hudLives) {
          this.hudLives.textContent = '🚀 '.repeat(Math.max(0, lives)).trim() || 'NONE';
        }
      },
      onStart: () => {
        if (this.readyHint) this.readyHint.style.display = 'none';
        if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      },
      onReady: () => {
        if (this.readyHint) this.readyHint.style.display = 'block';
        if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      },
      onRoundClear: (round) => {
        this.showFloatingBanner(`★ ROUND ${round} CLEARED! ★`);
      },
      onGameOver: (stats) => {
        this.handleGameOver(stats);
      }
    });

    this.game.start();
  }

  updateHighScoreDisplay() {
    if (this.hudHighScore) {
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
    }
  }

  showFloatingBanner(text) {
    if (!this.floatingBanner) return;
    this.floatingBanner.textContent = text;
    this.floatingBanner.classList.add('show');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.remove('show');
    }, 1500);
  }

  handleGameOver(stats) {
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = stats.score.toString().padStart(6, '0');
    if (this.overlayBestScore) this.overlayBestScore.textContent = this.highScore.toString().padStart(6, '0');
    if (this.overlayFinalRound) this.overlayFinalRound.textContent = `ROUND ${stats.round}`;

    setTimeout(() => {
      if (this.gameOverlay) this.gameOverlay.classList.add('visible');
    }, 400);

    submitMatchRecord({
      score: stats.score,
      level: stats.round,
      result: `${stats.score} PTS (ROUND ${stats.round})`
    });
  }

  startInputLoop() {
    let lastTime = performance.now();
    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (this.keyState.left) this.game.stepPaddle(-1, dt);
      if (this.keyState.right) this.game.stepPaddle(1, dt);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  bindEvents() {
    // Mouse movement inside canvas container
    if (this.canvasContainer) {
      const getCanvasX = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        return (e.clientX - rect.left) * scale;
      };

      this.canvasContainer.addEventListener('mousemove', (e) => {
        const targetX = getCanvasX(e);
        this.game.movePaddle(targetX);
      });

      this.canvasContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.game.handleAction();
      });

      // Touch movement
      this.canvasContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = this.canvas.getBoundingClientRect();
          const scale = this.canvas.width / rect.width;
          const targetX = (touch.clientX - rect.left) * scale;
          this.game.movePaddle(targetX);
        }
      }, { passive: true });

      this.canvasContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleAction();
      }, { passive: false });
    }

    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.keyState.left = true;
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.keyState.right = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.game.handleAction();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const isPaused = this.game.togglePause();
        if (this.btnPauseGame) {
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleSound();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.game.reset();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.keyState.left = false;
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.keyState.right = false;
      }
    });

    // Mobile Virtual Deck Buttons
    if (this.btnLeft) {
      const setLeft = (val) => (e) => { e.preventDefault(); this.keyState.left = val; };
      this.btnLeft.addEventListener('mousedown', setLeft(true));
      this.btnLeft.addEventListener('mouseup', setLeft(false));
      this.btnLeft.addEventListener('touchstart', setLeft(true), { passive: false });
      this.btnLeft.addEventListener('touchend', setLeft(false));
    }

    if (this.btnRight) {
      const setRight = (val) => (e) => { e.preventDefault(); this.keyState.right = val; };
      this.btnRight.addEventListener('mousedown', setRight(true));
      this.btnRight.addEventListener('mouseup', setRight(false));
      this.btnRight.addEventListener('touchstart', setRight(true), { passive: false });
      this.btnRight.addEventListener('touchend', setRight(false));
    }

    if (this.btnAction) {
      this.btnAction.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.handleAction();
      });
      this.btnAction.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleAction();
      }, { passive: false });
    }

    // Sub-bar & Modal Buttons
    if (this.overlayRestartBtn) {
      this.overlayRestartBtn.addEventListener('click', () => this.game.reset());
    }
    if (this.btnRestartGame) {
      this.btnRestartGame.addEventListener('click', () => this.game.reset());
    }
    if (this.btnPauseGame) {
      this.btnPauseGame.addEventListener('click', () => {
        const isPaused = this.game.togglePause();
        this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
      });
    }

    // Header buttons
    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => this.toggleSound());
    }

    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => {
        if (this.crtOverlay) {
          const disabled = this.crtOverlay.classList.toggle('disabled');
          this.btnToggleCrt.textContent = disabled ? 'CRT: OFF' : 'CRT: ON';
          this.btnToggleCrt.classList.toggle('active', !disabled);
        }
      });
    }
  }

  toggleSound() {
    const unmuted = sound.toggleMute();
    if (this.btnToggleSound) {
      this.btnToggleSound.classList.toggle('active', unmuted);
    }
    if (this.soundIcon) {
      this.soundIcon.textContent = unmuted ? '🔊' : '🔇';
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ArkanoidApp());
  } else {
    new ArkanoidApp();
  }
}
