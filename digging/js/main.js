import { DiggerGame } from './index.js';
import { storage } from './storage.js';

async function recordGameActivity(data) {
  try {
    await fetch('/api/games/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
  } catch (_) {}
}

class DiggerCabinetApp {
  constructor() {
    this.gameInstance = null;
    this.gameId = 'digger';

    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);
    this.speedList = [0.25, 0.50, 0.75, 1.00];
    const savedSpeed = Number(storage.getSetting('game_speed', 0.50));
    this.currentSpeed = this.speedList.includes(savedSpeed) ? savedSpeed : 0.50;

    this.canvasContainer = document.getElementById('game-canvas-container');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');
    this.btnToggleSpeed = document.getElementById('btn-toggle-speed');

    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnActionFire = document.getElementById('btn-action-fire');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLivesIcons = document.getElementById('hud-lives-icons');
    this.hudLevelNum = document.getElementById('hud-level-num');

    this.init();
  }

  init() {
    this.applySettings();
    this.bindEvents();
    this.launchGame();
  }

  applySettings() {
    this.soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.btnToggleSound.classList.toggle('active', this.soundEnabled);
    this.crtOverlay.classList.toggle('disabled', !this.crtEnabled);
    this.btnToggleCrt.classList.toggle('active', this.crtEnabled);
    if (this.btnToggleSpeed) {
      this.btnToggleSpeed.textContent = `SPEED: ${Math.round(this.currentSpeed * 100)}%`;
    }
  }

  cycleSpeed() {
    const idx = this.speedList.indexOf(this.currentSpeed);
    const nextIdx = (idx + 1) % this.speedList.length;
    this.currentSpeed = this.speedList[nextIdx];
    storage.setSetting('game_speed', this.currentSpeed);
    if (this.btnToggleSpeed) {
      this.btnToggleSpeed.textContent = `SPEED: ${Math.round(this.currentSpeed * 100)}%`;
    }
    if (this.gameInstance && typeof this.gameInstance.setSpeedMultiplier === 'function') {
      this.gameInstance.setSpeedMultiplier(this.currentSpeed);
    }
  }

  bindEvents() {
    this.btnToggleSound.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      storage.setSetting('sound_enabled', this.soundEnabled);
      this.applySettings();
      if (this.gameInstance && typeof this.gameInstance.setMuted === 'function') {
        this.gameInstance.setMuted(!this.soundEnabled);
      }
    });

    this.btnToggleCrt.addEventListener('click', () => {
      this.crtEnabled = !this.crtEnabled;
      storage.setSetting('crt_enabled', this.crtEnabled);
      this.applySettings();
    });

    if (this.btnToggleSpeed) {
      this.btnToggleSpeed.addEventListener('click', () => {
        this.cycleSpeed();
      });
    }

    this.btnPauseGame.addEventListener('click', () => {
      if (this.gameInstance) {
        const isPaused = this.gameInstance.togglePause();
        this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
      }
    });

    this.btnRestartGame.addEventListener('click', () => {
      if (this.gameInstance) {
        this.gameInstance.reset();
        this.btnPauseGame.textContent = 'PAUSE';
      }
    });

    const triggerFire = (e) => {
      e.preventDefault();
      if (this.gameInstance && typeof this.gameInstance.onFireWeapon === 'function') {
        this.gameInstance.onFireWeapon();
      }
    };

    if (this.btnActionFire) {
      this.btnActionFire.addEventListener('mousedown', triggerFire);
      this.btnActionFire.addEventListener('touchstart', triggerFire, { passive: false });
    }

    const dpadButtons = [
      { id: 'dpad-up', dir: 'UP' },
      { id: 'dpad-down', dir: 'DOWN' },
      { id: 'dpad-left', dir: 'LEFT' },
      { id: 'dpad-right', dir: 'RIGHT' }
    ];

    let touchHoldInterval = null;
    const stopHold = () => {
      if (touchHoldInterval) {
        clearInterval(touchHoldInterval);
        touchHoldInterval = null;
      }
    };

    const startHold = (action) => {
      stopHold();
      action();
      touchHoldInterval = setInterval(action, 100);
    };

    dpadButtons.forEach(({ id, dir }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const trigger = () => {
          if (this.gameInstance && this.gameInstance.input) {
            this.gameInstance.input.setDirection(dir);
          }
        };
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          startHold(trigger);
        });
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          startHold(trigger);
        }, { passive: false });

        btn.addEventListener('mouseup', stopHold);
        btn.addEventListener('mouseleave', stopHold);
        btn.addEventListener('touchend', stopHold);
        btn.addEventListener('touchcancel', stopHold);
      }
    });

    window.addEventListener('mouseup', stopHold);
    window.addEventListener('touchend', stopHold);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
        }
      } else if (e.code === 'KeyS') {
        this.cycleSpeed();
      } else if (e.code === 'Space' || e.code === 'F1') {
        if (this.gameInstance && typeof this.gameInstance.onFireWeapon === 'function') {
          e.preventDefault();
          this.gameInstance.onFireWeapon();
        }
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });
  }

  launchGame() {
    this.canvasContainer.innerHTML = '';
    const highScore = storage.getHighScore(this.gameId);
    this.hudHighScore.textContent = highScore.toString().padStart(4, '0');
    this.hudScore.textContent = '0000';
    this.hudLevelNum.textContent = '1';

    this.gameInstance = new DiggerGame(this.canvasContainer, {
      speedMultiplier: this.currentSpeed,
      muted: !this.soundEnabled,
      highScore: highScore,
      onScoreUpdate: (score) => {
        this.hudScore.textContent = score.toString().padStart(4, '0');
        if (score > highScore) {
          this.hudHighScore.textContent = score.toString().padStart(4, '0');
          storage.setHighScore(this.gameId, score);
        }
      },
      onLevelClear: (level, score) => {
        recordGameActivity({ gameId: 'digging', level, score, status: 'complete', result: 'LEVEL CLEAR' });
      },
      onGameOver: (finalScore) => {
        storage.setHighScore(this.gameId, finalScore);
        recordGameActivity({ gameId: 'digging', level: this.gameInstance?.level || 1, score: finalScore, status: 'complete', result: 'GAME OVER' });
      },
      onLivesUpdate: (lives) => {
        this.updateLivesHUD(lives);
      },
      onLevelUpdate: (level) => {
        this.hudLevelNum.textContent = level.toString();
      }
    });

    this.updateLivesHUD(3);
    this.gameInstance.start();
  }

  updateLivesHUD(count) {
    this.hudLivesIcons.innerHTML = '';
    for (let i = 0; i < Math.max(0, count); i++) {
      const icon = document.createElement('div');
      icon.className = 'life-icon digger-life';
      this.hudLivesIcons.appendChild(icon);
    }
  }
}

function boot() {
  new DiggerCabinetApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
