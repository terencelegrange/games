/**
 * Fast Car Main Application Entry Point
 * UI controller, event bindings, audio controls, and Games Vault integration.
 */

import { FastCarGame, STATES } from './game.js';
import { storage, recordGameActivity } from './storage.js';
import { sound } from './audio.js';

class FastCarApp {
  constructor() {
    this.gameId = 'fastcar';
    this.gameInstance = null;

    // Settings
    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);
    this.difficulty = storage.getSetting('difficulty', 'medium');

    // DOM Elements
    this.canvas = document.getElementById('fastcar-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');

    this.hudScore = document.getElementById('hud-score');
    this.hudLevel = document.getElementById('hud-level');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.lifeCars = [
      document.getElementById('life-1'),
      document.getElementById('life-2'),
      document.getElementById('life-3')
    ];

    this.diffButtons = document.querySelectorAll('.diff-btn');

    this.floatingBanner = document.getElementById('floating-banner');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalStage = document.getElementById('overlay-final-stage');
    this.overlayFinalCoins = document.getElementById('overlay-final-coins');
    this.overlayFinalSpeed = document.getElementById('overlay-final-speed');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    this.btnSteerLeft = document.getElementById('btn-steer-left');
    this.btnSteerRight = document.getElementById('btn-steer-right');
    this.btnAccel = document.getElementById('btn-accel');
    this.btnBrake = document.getElementById('btn-brake');

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
    this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
    if (this.hudLevel) {
      this.hudLevel.textContent = '1';
    }
    this.diffButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.diff === this.difficulty);
    });
  }

  setupGame() {
    this.gameInstance = new FastCarGame(this.canvas, {
      difficulty: this.difficulty,

      onScore: (score) => {
        this.hudScore.textContent = score.toString().padStart(6, '0');
        if (score > this.highScore) {
          this.highScore = score;
          this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
          storage.setHighScore(this.gameId, this.highScore);
        }
      },

      onSpeed: (speedKmH) => {
        this.hudSpeed.textContent = `${speedKmH.toString().padStart(3, '0')} KM/H`;
      },

      onCoins: (coins) => {
        this.hudCoins.textContent = `🟡 ${coins.toString().padStart(2, '0')}`;
      },

      onLevelUpdate: (level) => {
        if (this.hudLevel) {
          this.hudLevel.textContent = level;
        }
      },

      onStageAdvance: (stage) => {
        this.floatingBanner.textContent = `⚡ STAGE ${stage} REACHED! ⚡`;
        this.floatingBanner.classList.add('show');
        setTimeout(() => {
          this.floatingBanner.classList.remove('show');
        }, 2000);
      },

      onCombo: (multiplier) => {
        this.floatingBanner.textContent = `★ COIN COMBO x${multiplier} ★`;
        this.floatingBanner.classList.add('show');
        setTimeout(() => {
          this.floatingBanner.classList.remove('show');
        }, 1600);
      },

      onLives: (lives) => {
        this.lifeCars.forEach((icon, idx) => {
          if (icon) {
            icon.classList.toggle('lost', idx >= lives);
          }
        });
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
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
    }

    this.overlayFinalScore.textContent = stats.score.toString().padStart(6, '0');
    if (this.overlayFinalStage) {
      this.overlayFinalStage.textContent = `STAGE ${stats.stage || 1}`;
    }
    this.overlayFinalCoins.textContent = stats.coins.toString();
    this.overlayFinalSpeed.textContent = `${stats.topSpeed} KM/H`;
    this.gameOverlay.classList.add('visible');

    // Report race activity to Games Vault backend with actual stage reached
    recordGameActivity({
      gameId: 'fastcar',
      level: Math.max(1, Math.min(255, stats.stage || 1)),
      score: stats.score,
      status: 'complete',
      result: 'RACE OVER'
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

    // Difficulty buttons
    this.diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const diff = btn.dataset.diff;
        if (['easy', 'medium', 'hard'].includes(diff)) {
          this.difficulty = diff;
          storage.setSetting('difficulty', diff);
          this.diffButtons.forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
          if (this.gameInstance) {
            this.gameInstance.setDifficulty(diff);
          }
        }
      });
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
      if (['ArrowLeft', 'KeyA', 'Numpad4'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
        else this.gameInstance.steerLeft();
      } else if (['ArrowRight', 'KeyD', 'Numpad6'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
        else this.gameInstance.steerRight();
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        this.gameInstance.setAccelerating(true);
        this.btnAccel.classList.add('pressed');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        sound.init();
        this.gameInstance.setBraking(true);
        this.btnBrake.classList.add('pressed');
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
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.gameInstance.setAccelerating(false);
        this.btnAccel.classList.remove('pressed');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.gameInstance.setBraking(false);
        this.btnBrake.classList.remove('pressed');
      }
    });

    // Virtual Touch Buttons
    this.btnSteerLeft.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
      else this.gameInstance.steerLeft();
    });

    this.btnSteerRight.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
      else this.gameInstance.steerRight();
    });

    const startAccel = (e) => {
      e.preventDefault();
      sound.init();
      this.gameInstance.setAccelerating(true);
      this.btnAccel.classList.add('pressed');
    };
    const stopAccel = (e) => {
      e.preventDefault();
      this.gameInstance.setAccelerating(false);
      this.btnAccel.classList.remove('pressed');
    };
    this.btnAccel.addEventListener('pointerdown', startAccel);
    this.btnAccel.addEventListener('pointerup', stopAccel);
    this.btnAccel.addEventListener('pointercancel', stopAccel);

    const startBrake = (e) => {
      e.preventDefault();
      sound.init();
      this.gameInstance.setBraking(true);
      this.btnBrake.classList.add('pressed');
    };
    const stopBrake = (e) => {
      e.preventDefault();
      this.gameInstance.setBraking(false);
      this.btnBrake.classList.remove('pressed');
    };
    this.btnBrake.addEventListener('pointerdown', startBrake);
    this.btnBrake.addEventListener('pointerup', stopBrake);
    this.btnBrake.addEventListener('pointercancel', stopBrake);

    // Canvas click
    this.canvas.addEventListener('pointerdown', (e) => {
      sound.init();
      if (this.gameInstance.state === STATES.GAME_OVER) {
        doRestart();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) {
        this.gameInstance.steerLeft();
      } else {
        this.gameInstance.steerRight();
      }
    });
  }
}

function boot() {
  new FastCarApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
