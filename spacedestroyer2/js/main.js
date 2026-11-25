/**
 * Space Destroyer II Main Application Entry Point
 * Event bindings, DOM HUD updates, Weapon status indicators, Single-shot keyboard latch,
 * touch deck, and Games Vault integration.
 */

import { SpaceDestroyerGame, STATES } from './game.js';
import { storage, recordGameActivity } from './storage.js';
import { sound } from './audio.js';

class SpaceDestroyer2App {
  constructor() {
    this.gameId = 'spacedestroyer2';
    this.gameInstance = null;
    this.fireKeyDown = false;

    // Settings
    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);

    // DOM Elements
    this.canvas = document.getElementById('space-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');

    this.hudScore = document.getElementById('hud-score');
    this.hudWave = document.getElementById('hud-wave');
    this.hudLives = document.getElementById('hud-lives');
    this.hudInvaders = document.getElementById('hud-invaders');
    this.hudWeapon = document.getElementById('hud-weapon');
    this.hudShield = document.getElementById('hud-shield');
    this.hudHighScore = document.getElementById('hud-high-score');

    this.floatingBanner = document.getElementById('floating-banner');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    // Virtual Touch Controls Deck
    this.btnMoveLeft = document.getElementById('btn-move-left');
    this.btnMoveRight = document.getElementById('btn-move-right');
    this.btnTriggerShield = document.getElementById('btn-trigger-shield');
    this.deckShieldCount = document.getElementById('deck-shield-count');
    this.btnTriggerFire = document.getElementById('btn-trigger-fire');

    // Game Over Overlay
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayReason = document.getElementById('overlay-reason');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalWave = document.getElementById('overlay-final-wave');
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
  }

  applySettings() {
    this.soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.btnToggleSound.classList.toggle('active', this.soundEnabled);
    this.crtOverlay.classList.toggle('disabled', !this.crtEnabled);
    this.btnToggleCrt.classList.toggle('active', this.crtEnabled);
    this.hudHighScore.textContent = this.highScore.toString().padStart(5, '0');
  }

  setupGame() {
    this.gameInstance = new SpaceDestroyerGame(this.canvas, {
      onScore: (score) => {
        this.hudScore.textContent = score.toString().padStart(5, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.hudHighScore.textContent = this.highScore.toString().padStart(5, '0');
          storage.setHighScore(this.gameId, this.highScore);
        }
      },

      onWave: (wave) => {
        this.hudWave.textContent = wave.toString();
      },

      onLives: (lives) => {
        const icons = [];
        for (let i = 0; i < 3; i++) {
          icons.push(i < lives ? '▲' : '×');
        }
        this.hudLives.textContent = icons.join(' ');
      },

      onWeapon: (cfg) => {
        if (this.hudWeapon && cfg) {
          this.hudWeapon.textContent = cfg.name;
          this.hudWeapon.style.color = cfg.color;
          this.hudWeapon.style.textShadow = `0 0 8px ${cfg.glow}`;
        }
      },

      onShield: (shields, active, remainingTime) => {
        if (this.hudShield) {
          if (active) {
            this.hudShield.textContent = `${remainingTime.toFixed(1)}s`;
            this.hudShield.classList.add('active');
          } else if (shields > 0) {
            this.hudShield.textContent = `READY (${shields})`;
            this.hudShield.classList.remove('active');
          } else {
            this.hudShield.textContent = 'OFFLINE (0)';
            this.hudShield.classList.remove('active');
          }
        }
        if (this.btnTriggerShield && this.deckShieldCount) {
          if (active) {
            this.btnTriggerShield.classList.add('active');
            this.deckShieldCount.textContent = `${remainingTime.toFixed(1)}s ACTIVE`;
          } else {
            this.btnTriggerShield.classList.remove('active');
            this.deckShieldCount.textContent = shields > 0 ? `[S] READY (${shields})` : '[S] NONE (0)';
          }
        }
      },

      onInvaders: (alive, total) => {
        this.hudInvaders.textContent = `${alive} / ${total}`;
      },

      onWaveClear: (wave) => {
        if (this.floatingBanner) {
          this.floatingBanner.textContent = `★ WAVE ${wave} CLEARED! ★`;
          this.floatingBanner.classList.add('show');
          setTimeout(() => {
            this.floatingBanner.classList.remove('show');
          }, 2000);
        }
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
      this.hudHighScore.textContent = this.highScore.toString().padStart(5, '0');
    }

    if (this.overlayReason) {
      this.overlayReason.textContent = stats.reason || 'DEFENSE FAILED';
    }
    this.overlayFinalScore.textContent = stats.score.toString().padStart(5, '0');
    this.overlayFinalWave.textContent = `WAVE ${stats.wave}`;
    this.overlayFinalAccuracy.textContent = `${stats.accuracy}%`;
    this.overlayFinalHits.textContent = `${stats.totalHits} / ${stats.totalShots}`;
    this.gameOverlay.classList.add('visible');

    // Report match to Games Vault backend
    recordGameActivity({
      gameId: 'spacedestroyer2',
      level: Math.max(1, Math.min(255, stats.wave)),
      score: stats.score,
      status: 'complete',
      result: `${stats.score} PTS (WAVE ${stats.wave})`
    });
  }

  bindEvents() {
    this.btnToggleSound.addEventListener('click', () => {
      this.soundEnabled = sound.toggle();
      storage.setSetting('sound_enabled', this.soundEnabled);
      this.applySettings();
    });

    this.btnToggleCrt.addEventListener('click', () => {
      this.crtEnabled = !this.crtEnabled;
      storage.setSetting('crt_enabled', this.crtEnabled);
      this.applySettings();
    });

    this.btnPauseGame.addEventListener('click', () => {
      if (this.gameInstance) {
        const isPaused = this.gameInstance.togglePause();
        this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
      }
    });

    const doRestart = () => {
      this.gameOverlay.classList.remove('visible');
      if (this.gameInstance) {
        this.gameInstance.reset();
        this.btnPauseGame.textContent = 'PAUSE';
      }
    };

    this.btnRestartGame.addEventListener('click', doRestart);
    this.overlayRestartBtn.addEventListener('click', doRestart);

    // Keyboard Listeners with Strict Single-Shot Latch (NO RAPID FIRE ON HOLD)
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        this.gameInstance.setMoveLeft(true);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        this.gameInstance.setMoveRight(true);
      } else if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
        e.preventDefault();
        // One keyboard press = one fire; strictly disable rapid fire on key hold
        if (e.repeat || this.fireKeyDown) return;
        this.fireKeyDown = true;
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.shoot();
          if (this.btnTriggerFire) {
            this.btnTriggerFire.classList.add('pressed');
            setTimeout(() => this.btnTriggerFire.classList.remove('pressed'), 100);
          }
        }
      } else if (['KeyS', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        if (this.gameInstance) {
          this.gameInstance.triggerShield();
          if (this.btnTriggerShield) {
            this.btnTriggerShield.classList.add('pressed');
            setTimeout(() => this.btnTriggerShield.classList.remove('pressed'), 120);
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

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.gameInstance.setMoveLeft(false);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.gameInstance.setMoveRight(false);
      } else if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
        this.fireKeyDown = false;
      }
    });

    // Canvas click / pointerdown to fire
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) {
        doRestart();
      } else {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * this.gameInstance.width;
        if (clickX < this.gameInstance.cannon.x) {
          this.gameInstance.setMoveLeft(true);
          setTimeout(() => this.gameInstance.setMoveLeft(false), 120);
        } else if (clickX > this.gameInstance.cannon.x + this.gameInstance.cannon.width) {
          this.gameInstance.setMoveRight(true);
          setTimeout(() => this.gameInstance.setMoveRight(false), 120);
        }
        this.gameInstance.shoot();
      }
    });

    // Virtual Touch Deck Buttons
    if (this.btnMoveLeft) {
      const startLeft = (e) => { e.preventDefault(); sound.init(); this.gameInstance.setMoveLeft(true); this.btnMoveLeft.classList.add('pressed'); };
      const stopLeft = (e) => { e.preventDefault(); this.gameInstance.setMoveLeft(false); this.btnMoveLeft.classList.remove('pressed'); };
      this.btnMoveLeft.addEventListener('pointerdown', startLeft);
      this.btnMoveLeft.addEventListener('pointerup', stopLeft);
      this.btnMoveLeft.addEventListener('pointercancel', stopLeft);
      this.btnMoveLeft.addEventListener('pointerleave', stopLeft);
    }

    if (this.btnMoveRight) {
      const startRight = (e) => { e.preventDefault(); sound.init(); this.gameInstance.setMoveRight(true); this.btnMoveRight.classList.add('pressed'); };
      const stopRight = (e) => { e.preventDefault(); this.gameInstance.setMoveRight(false); this.btnMoveRight.classList.remove('pressed'); };
      this.btnMoveRight.addEventListener('pointerdown', startRight);
      this.btnMoveRight.addEventListener('pointerup', stopRight);
      this.btnMoveRight.addEventListener('pointercancel', stopRight);
      this.btnMoveRight.addEventListener('pointerleave', stopRight);
    }

    if (this.btnTriggerShield) {
      this.btnTriggerShield.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance && this.gameInstance.state !== STATES.GAME_OVER) {
          this.gameInstance.triggerShield();
          this.btnTriggerShield.classList.add('pressed');
        }
      });
      this.btnTriggerShield.addEventListener('pointerup', () => this.btnTriggerShield.classList.remove('pressed'));
      this.btnTriggerShield.addEventListener('pointercancel', () => this.btnTriggerShield.classList.remove('pressed'));
      this.btnTriggerShield.addEventListener('pointerleave', () => this.btnTriggerShield.classList.remove('pressed'));
    }

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
      this.btnTriggerFire.addEventListener('pointerup', () => this.btnTriggerFire.classList.remove('pressed'));
      this.btnTriggerFire.addEventListener('pointercancel', () => this.btnTriggerFire.classList.remove('pressed'));
    }
  }
}

function boot() {
  new SpaceDestroyer2App();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
