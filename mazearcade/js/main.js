import { PacmanGame } from './index.js';
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

class PacmanCabinetApp {
  constructor() {
    this.gameInstance = null;
    this.gameId = 'pacman';

    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);
    this.gameSpeed = storage.getSetting('game_speed', 1);

    this.canvasContainer = document.getElementById('game-canvas-container');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.speedBtns = document.querySelectorAll('.speed-btn');

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
    this.speedBtns.forEach(btn => {
      const spd = parseFloat(btn.dataset.speed) || 1;
      btn.classList.toggle('active', spd === this.gameSpeed);
    });
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

    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed) || 1;
        this.gameSpeed = speed;
        storage.setSetting('game_speed', this.gameSpeed);
        this.applySettings();
        if (this.gameInstance && typeof this.gameInstance.setSpeed === 'function') {
          this.gameInstance.setSpeed(this.gameSpeed);
        }
      });
    });

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

    const dpadButtons = [
      { id: 'dpad-up', dir: 'UP' },
      { id: 'dpad-down', dir: 'DOWN' },
      { id: 'dpad-left', dir: 'LEFT' },
      { id: 'dpad-right', dir: 'RIGHT' }
    ];

    dpadButtons.forEach(({ id, dir }) => {
      const btn = document.getElementById(id);
      if (btn) {
        const trigger = (e) => {
          e.preventDefault();
          if (this.gameInstance && this.gameInstance.input) {
            this.gameInstance.input.setDirection(dir);
          }
        };
        btn.addEventListener('mousedown', trigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
      }
    });

    // Mobile touch swipe gestures on canvas
    let touchStartX = 0;
    let touchStartY = 0;
    this.canvasContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvasContainer.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent mobile scrolling during game
    }, { passive: false });

    this.canvasContainer.addEventListener('touchend', (e) => {
      if (!this.gameInstance || !this.gameInstance.input) return;
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.gameInstance.input.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          this.gameInstance.input.setDirection(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
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

    this.gameInstance = new PacmanGame(this.canvasContainer, {
      muted: !this.soundEnabled,
      speed: this.gameSpeed,
      highScore: highScore,
      onScoreUpdate: (score) => {
        this.hudScore.textContent = score.toString().padStart(4, '0');
        if (score > highScore) {
          this.hudHighScore.textContent = score.toString().padStart(4, '0');
          storage.setHighScore(this.gameId, score);
        }
      },
      onLevelClear: (level, score) => {
        recordGameActivity({ gameId: 'mazearcade', level, score, status: 'complete', result: 'LEVEL CLEAR' });
      },
      onGameOver: (finalScore) => {
        storage.setHighScore(this.gameId, finalScore);
        recordGameActivity({ gameId: 'mazearcade', level: this.gameInstance?.level || 1, score: finalScore, status: 'complete', result: 'GAME OVER' });
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
      icon.className = 'life-icon';
      this.hudLivesIcons.appendChild(icon);
    }
  }
}

function boot() {
  new PacmanCabinetApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
