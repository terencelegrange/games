/**
 * Meteor Strike Application Entrypoint & UI Controller
 */

import { MeteorStrikeGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class MeteorStrikeApp {
  constructor() {
    this.canvas = document.getElementById('meteor-canvas');
    this.canvasContainer = document.getElementById('game-canvas-container');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudWave = document.getElementById('hud-wave');
    this.hudLives = document.getElementById('hud-lives');

    // Overlays & Banners
    this.floatingBanner = document.getElementById('floating-banner');
    this.readyHint = document.getElementById('ready-hint');
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayBestScore = document.getElementById('overlay-best-score');
    this.overlayFinalWave = document.getElementById('overlay-final-wave');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    // Controls
    this.btnRotLeft = document.getElementById('btn-rot-left');
    this.btnRotRight = document.getElementById('btn-rot-right');
    this.btnThrust = document.getElementById('btn-thrust');
    this.btnFire = document.getElementById('btn-fire');
    this.btnHyper = document.getElementById('btn-hyper');

    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    this.updateHighScoreDisplay();

    this.input = { left: false, right: false, thrust: false };

    this.initGame();
    this.bindEvents();
  }

  initGame() {
    this.game = new MeteorStrikeGame(this.canvas, {
      onScore: (score) => {
        if (this.hudScore) this.hudScore.textContent = score.toString().padStart(6, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.updateHighScoreDisplay();
          saveLocalHighScore(score);
        }
      },
      onWave: (wave) => {
        if (this.hudWave) this.hudWave.textContent = wave.toString();
      },
      onLives: (lives) => {
        if (this.hudLives) {
          this.hudLives.textContent = '▲ '.repeat(Math.max(0, lives)).trim() || 'NONE';
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
      onWaveClear: (wave) => {
        this.showFloatingBanner(`★ WAVE ${wave} CLEARED! ★`);
      },
      onGameOver: (stats) => {
        this.handleGameOver(stats);
      }
    });

    this.game.currentInput = this.input;
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
    if (this.overlayFinalWave) this.overlayFinalWave.textContent = `WAVE ${stats.wave}`;

    setTimeout(() => {
      if (this.gameOverlay) this.gameOverlay.classList.add('visible');
    }, 450);

    submitMatchRecord({
      score: stats.score,
      wave: stats.wave,
      result: `${stats.score} PTS (WAVE ${stats.wave})`
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.input.left = true;
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.input.right = true;
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.input.thrust = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.game.handleFire();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.game.handleHyperspace();
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
        this.input.left = false;
      } else if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.input.right = false;
      } else if (e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.input.thrust = false;
      }
    });

    // Touch / Buttons
    const bindTouch = (btn, prop) => {
      if (!btn) return;
      const setVal = (v) => (e) => { e.preventDefault(); this.input[prop] = v; };
      btn.addEventListener('mousedown', setVal(true));
      btn.addEventListener('mouseup', setVal(false));
      btn.addEventListener('touchstart', setVal(true), { passive: false });
      btn.addEventListener('touchend', setVal(false));
    };

    bindTouch(this.btnRotLeft, 'left');
    bindTouch(this.btnRotRight, 'right');
    bindTouch(this.btnThrust, 'thrust');

    if (this.btnFire) {
      this.btnFire.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.handleFire();
      });
      this.btnFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleFire();
      }, { passive: false });
    }

    if (this.btnHyper) {
      this.btnHyper.addEventListener('click', (e) => {
        e.preventDefault();
        this.game.handleHyperspace();
      });
      this.btnHyper.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.handleHyperspace();
      }, { passive: false });
    }

    if (this.canvasContainer) {
      this.canvasContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.game.handleFire();
      });
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
    document.addEventListener('DOMContentLoaded', () => new MeteorStrikeApp());
  } else {
    new MeteorStrikeApp();
  }
}
