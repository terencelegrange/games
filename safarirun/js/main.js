/**
 * Safari Run Main Application Entry Point
 * UI controller, event bindings, audio controls, and Games Vault integration.
 */

import { SafariRunGame, STATES } from './game.js';
import { storage, recordGameActivity } from './storage.js';
import { sound } from './audio.js';

class SafariRunApp {
  constructor() {
    this.gameId = 'safarirun';
    this.gameInstance = null;

    // Settings
    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);

    // DOM Elements
    this.canvas = document.getElementById('safari-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.milestoneBadge = document.getElementById('milestone-badge');
    this.speedBarFill = document.getElementById('speed-bar-fill');
    this.speedText = document.getElementById('speed-text');
    this.timeOfDayLabel = document.getElementById('time-of-day-label');

    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlaySub = document.getElementById('overlay-sub');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    this.btnVirtualJump = document.getElementById('btn-virtual-jump');
    this.btnVirtualDuck = document.getElementById('btn-virtual-duck');

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
    this.gameInstance = new SafariRunGame(this.canvas, {
      onScore: (score) => {
        this.hudScore.textContent = score.toString().padStart(5, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.hudHighScore.textContent = this.highScore.toString().padStart(5, '0');
          storage.setHighScore(this.gameId, this.highScore);
        }
      },

      onMilestone: (milestone) => {
        this.hudScore.classList.add('flash');
        this.milestoneBadge.textContent = `★ +${milestone} SAFARI PTS ★`;
        this.milestoneBadge.classList.add('show');
        setTimeout(() => {
          this.hudScore.classList.remove('flash');
          this.milestoneBadge.classList.remove('show');
        }, 1800);
      },

      onSpeed: (speedKmH, fillRatio) => {
        this.speedText.textContent = `${speedKmH} KM/H`;
        this.speedBarFill.style.width = `${Math.min(100, Math.round(fillRatio * 100))}%`;
      },

      onTimeOfDay: (name) => {
        this.timeOfDayLabel.textContent = name;
      },

      onGameOver: (finalScore, speedTier) => {
        this.handleGameOver(finalScore, speedTier);
      }
    });
  }

  handleGameOver(score, speedTier) {
    if (score > this.highScore) {
      this.highScore = score;
      storage.setHighScore(this.gameId, this.highScore);
      this.hudHighScore.textContent = this.highScore.toString().padStart(5, '0');
    }

    this.overlayTitle.textContent = 'GAME OVER';
    this.overlaySub.textContent = `DISTANCE: ${score.toLocaleString()} PTS • VELOCITY TIER ${speedTier}`;
    this.gameOverlay.classList.add('visible');

    // Post match activity to Games Vault backend
    recordGameActivity({
      gameId: 'safarirun',
      level: speedTier,
      score: score,
      status: 'complete',
      result: 'GAME OVER'
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

    // Bypass rotate overlay for portrait mode
    const btnBypassRotate = document.getElementById('btn-bypass-rotate');
    if (btnBypassRotate) {
      btnBypassRotate.addEventListener('click', () => {
        document.body.classList.add('portrait-bypassed');
      });
    }

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

    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.jump();
          this.btnVirtualJump.classList.add('pressed');
        }
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        this.gameInstance.duck(true);
        this.btnVirtualDuck.classList.add('pressed');
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
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        this.gameInstance.cutJump();
        this.btnVirtualJump.classList.remove('pressed');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.gameInstance.duck(false);
        this.btnVirtualDuck.classList.remove('pressed');
      }
    });

    // Virtual Touch Controls
    const jumpStart = (e) => {
      e.preventDefault();
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) {
        doRestart();
      } else {
        this.gameInstance.jump();
        this.btnVirtualJump.classList.add('pressed');
      }
    };
    const jumpEnd = (e) => {
      e.preventDefault();
      this.gameInstance.cutJump();
      this.btnVirtualJump.classList.remove('pressed');
    };

    this.btnVirtualJump.addEventListener('pointerdown', jumpStart);
    this.btnVirtualJump.addEventListener('pointerup', jumpEnd);
    this.btnVirtualJump.addEventListener('pointercancel', jumpEnd);

    const duckStart = (e) => {
      e.preventDefault();
      sound.init();
      this.gameInstance.duck(true);
      this.btnVirtualDuck.classList.add('pressed');
    };
    const duckEnd = (e) => {
      e.preventDefault();
      this.gameInstance.duck(false);
      this.btnVirtualDuck.classList.remove('pressed');
    };

    this.btnVirtualDuck.addEventListener('pointerdown', duckStart);
    this.btnVirtualDuck.addEventListener('pointerup', duckEnd);
    this.btnVirtualDuck.addEventListener('pointercancel', duckEnd);

    // Canvas click / tap
    this.canvas.addEventListener('pointerdown', (e) => {
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) {
        doRestart();
      } else {
        this.gameInstance.jump();
      }
    });
  }
}

function boot() {
  new SafariRunApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
