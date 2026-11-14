/**
 * Sharpshooter Main Application Entry Point
 * Event bindings, DOM HUD updates, sound controls, and Games Vault integration.
 */

import { SharpshooterGame, STATES } from './game.js';
import { storage, recordGameActivity } from './storage.js';
import { sound } from './audio.js';

class SharpshooterApp {
  constructor() {
    this.gameId = 'sharpshooter';
    this.gameInstance = null;

    // Settings
    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);

    // DOM Elements
    this.canvas = document.getElementById('sharpshooter-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');

    this.hudScore = document.getElementById('hud-score');
    this.hudStage = document.getElementById('hud-stage');
    this.hudTargetName = document.getElementById('hud-target-name');
    this.hudProgress = document.getElementById('hud-progress');
    this.hudLives = document.getElementById('hud-lives');
    this.hudHighScore = document.getElementById('hud-high-score');

    this.floatingBanner = document.getElementById('floating-banner');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnTriggerFire = document.getElementById('btn-trigger-fire');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalStage = document.getElementById('overlay-final-stage');
    this.overlayFinalAccuracy = document.getElementById('overlay-final-accuracy');
    this.overlayFinalHits = document.getElementById('overlay-final-hits');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    this.highScore = storage.getHighScore(this.gameId);

    this.init();
  }

  init() {
    this.applySettings();
    this.setupGame();
    this.bindEvents();
    if (this.gameInstance) {
      this.gameInstance.start();
    }
  }

  applySettings() {
    this.soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.btnToggleSound.classList.toggle('active', this.soundEnabled);
    this.crtOverlay.classList.toggle('disabled', !this.crtEnabled);
    this.btnToggleCrt.classList.toggle('active', this.crtEnabled);
    this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');
  }

  setupGame() {
    this.gameInstance = new SharpshooterGame(this.canvas, {
      onScore: (score) => {
        this.hudScore.textContent = score.toString().padStart(4, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');
          storage.setHighScore(this.gameId, this.highScore);
        }
      },

      onStage: (stage, config) => {
        this.hudStage.textContent = stage.toString();
        this.hudTargetName.textContent = `${config.icon} ${config.name}`;
      },

      onProgress: (hits, quota) => {
        // Visual indicator: filled and empty dots
        let dots = '';
        for (let i = 0; i < quota; i++) {
          dots += i < hits ? '●' : '○';
        }
        this.hudProgress.textContent = `${dots} (${hits}/${quota})`;
      },

      onLives: (lives) => {
        const icons = [];
        for (let i = 0; i < 3; i++) {
          icons.push(i < lives ? '🎯' : '❌');
        }
        this.hudLives.textContent = icons.join(' ');
      },

      onStageClear: (stage) => {
        this.floatingBanner.textContent = `★ STAGE ${stage} CLEARED! ★`;
        this.floatingBanner.classList.add('show');
        setTimeout(() => {
          this.floatingBanner.classList.remove('show');
        }, 1800);
      },

      onGameOver: (stats) => {
        this.handleGameOver(stats);
      }
    });
  }

  handleGameOver(stats) {
    if (stats.score > this.highScore) {
      this.highScore = stats.score;
      storage.setHighScore(this.gameId, this.highScore);
      this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');
    }

    this.overlayFinalScore.textContent = stats.score.toString().padStart(4, '0');
    this.overlayFinalStage.textContent = `STAGE ${stats.stage}`;
    this.overlayFinalAccuracy.textContent = `${stats.accuracy}%`;
    this.overlayFinalHits.textContent = `${stats.totalHits} / ${stats.totalShots}`;
    this.gameOverlay.classList.add('visible');

    // Report race/round activity to Games Vault backend
    recordGameActivity({
      gameId: 'sharpshooter',
      level: Math.max(1, Math.min(255, stats.stage)),
      score: stats.score,
      status: 'complete',
      result: `${stats.score} PTS (STAGE ${stats.stage})`
    });
  }

  bindEvents() {
    // Sound toggle
    this.btnToggleSound.addEventListener('click', () => {
      this.soundEnabled = sound.toggle();
      storage.setSetting('sound_enabled', this.soundEnabled);
      this.applySettings();
    });

    // CRT toggle
    this.btnToggleCrt.addEventListener('click', () => {
      this.crtEnabled = !this.crtEnabled;
      storage.setSetting('crt_enabled', this.crtEnabled);
      this.applySettings();
    });

    // Pause / Resume
    this.btnPauseGame.addEventListener('click', () => {
      if (this.gameInstance) {
        const isPaused = this.gameInstance.togglePause();
        this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
      }
    });

    // Restart
    const doRestart = () => {
      this.gameOverlay.classList.remove('visible');
      if (this.gameInstance) {
        this.gameInstance.reset();
        this.gameInstance.start();
        this.btnPauseGame.textContent = 'PAUSE';
      }
    };

    this.btnRestartGame.addEventListener('click', doRestart);
    this.overlayRestartBtn.addEventListener('click', doRestart);

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (['Space', 'KeyZ', 'KeyX', 'Enter'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.shoot();
          if (this.btnTriggerFire) {
            this.btnTriggerFire.classList.add('pressed');
            setTimeout(() => this.btnTriggerFire.classList.remove('pressed'), 120);
          }
        }
      } else if (e.code === 'KeyP') {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
        }
      } else if (e.code === 'KeyM') {
        this.btnToggleSound.click();
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    // Canvas click / tap
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) {
        doRestart();
      } else {
        this.gameInstance.shoot();
      }
    });

    // Virtual Touch Trigger Button
    if (this.btnTriggerFire) {
      this.btnTriggerFire.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.shoot();
          this.btnTriggerFire.classList.add('pressed');
        }
      });
      this.btnTriggerFire.addEventListener('pointerup', () => {
        this.btnTriggerFire.classList.remove('pressed');
      });
      this.btnTriggerFire.addEventListener('pointercancel', () => {
        this.btnTriggerFire.classList.remove('pressed');
      });
    }
  }
}

function boot() {
  new SharpshooterApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
