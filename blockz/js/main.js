import { TetrisGame } from './index.js';
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

class TetrisCabinetApp {
  constructor() {
    this.gameInstance = null;
    this.gameId = 'tetris';

    this.soundEnabled = storage.getSetting('sound_enabled', true);
    this.crtEnabled = storage.getSetting('crt_enabled', true);

    this.canvasContainer = document.getElementById('game-canvas-container');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnActionDrop = document.getElementById('btn-action-drop');
    this.btnActionHold = document.getElementById('btn-action-hold');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLinesNum = document.getElementById('hud-lines-num');
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
        this.hudLinesNum.textContent = '0';
      }
    });

    if (this.btnActionDrop) {
      const dropHandler = (e) => {
        e.preventDefault();
        if (this.gameInstance && typeof this.gameInstance.onActionTrigger === 'function') {
          this.gameInstance.onActionTrigger();
        }
      };
      this.btnActionDrop.addEventListener('mousedown', dropHandler);
      this.btnActionDrop.addEventListener('touchstart', dropHandler, { passive: false });
    }

    if (this.btnActionHold) {
      const holdHandler = (e) => {
        e.preventDefault();
        if (this.gameInstance && typeof this.gameInstance.onHoldTrigger === 'function') {
          this.gameInstance.onHoldTrigger();
        }
      };
      this.btnActionHold.addEventListener('mousedown', holdHandler);
      this.btnActionHold.addEventListener('touchstart', holdHandler, { passive: false });
    }

    // Virtual D-pad
    const dpadButtons = [
      { id: 'dpad-up', dir: 'UP' },
      { id: 'dpad-down', dir: 'DOWN' },
      { id: 'dpad-left', dir: 'LEFT' },
      { id: 'dpad-right', dir: 'RIGHT' }
    ];

    dpadButtons.forEach(({ id, dir }) => {
      const btn = document.getElementById(id);
      if (btn) {
        let holdInterval = null;
        const trigger = (e) => {
          e.preventDefault();
          if (this.gameInstance && this.gameInstance.input) {
            this.gameInstance.input.setDirection(dir);
          }
          btn.classList.add('pressed');
          clearInterval(holdInterval);
          if (dir === 'LEFT' || dir === 'RIGHT' || dir === 'DOWN') {
            holdInterval = setInterval(() => {
              if (this.gameInstance && this.gameInstance.input) {
                this.gameInstance.input.setDirection(dir);
              }
            }, 110);
          }
        };
        const stopTrigger = () => {
          btn.classList.remove('pressed');
          clearInterval(holdInterval);
          holdInterval = null;
        };
        btn.addEventListener('mousedown', trigger);
        btn.addEventListener('mouseup', stopTrigger);
        btn.addEventListener('mouseleave', stopTrigger);
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('touchend', stopTrigger);
        btn.addEventListener('touchcancel', stopTrigger);
      }
    });

    // Mobile touch gestures on canvas
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    this.canvasContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }, { passive: true });

    this.canvasContainer.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling while playing
    }, { passive: false });

    this.canvasContainer.addEventListener('touchend', (e) => {
      if (!this.gameInstance || !this.gameInstance.input) return;
      if (e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const elapsed = performance.now() - touchStartTime;

        // Quick tap: Rotate
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && elapsed < 250) {
          this.gameInstance.input.setDirection('UP');
          return;
        }

        // Swipes
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) >= 20) {
            this.gameInstance.input.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
          }
        } else {
          if (dy >= 25) {
            this.gameInstance.input.setDirection('DOWN'); // Soft drop
          } else if (dy <= -35 && typeof this.gameInstance.onActionTrigger === 'function') {
            this.gameInstance.onActionTrigger(); // Hard drop
          }
        }
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP') {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
        }
      } else if (e.code === 'Space') {
        if (this.gameInstance && typeof this.gameInstance.onActionTrigger === 'function') {
          e.preventDefault();
          this.gameInstance.onActionTrigger();
        }
      } else if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.gameInstance && typeof this.gameInstance.onHoldTrigger === 'function') {
          e.preventDefault();
          this.gameInstance.onHoldTrigger();
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
    this.hudLinesNum.textContent = '0';

    this.gameInstance = new TetrisGame(this.canvasContainer, {
      muted: !this.soundEnabled,
      highScore: highScore,
      onScoreUpdate: (score) => {
        this.hudScore.textContent = score.toString().padStart(4, '0');
        if (this.gameInstance && typeof this.gameInstance.lines !== 'undefined') {
          this.hudLinesNum.textContent = this.gameInstance.lines.toString();
        }
        if (score > highScore) {
          this.hudHighScore.textContent = score.toString().padStart(4, '0');
          storage.setHighScore(this.gameId, score);
        }
      },
      onGameOver: (finalScore) => {
        storage.setHighScore(this.gameId, finalScore);
        recordGameActivity({ gameId: 'blockz', level: this.gameInstance?.level || 1, score: finalScore, status: 'complete', result: 'GAME OVER' });
      },
      onLevelUpdate: (level) => {
        this.hudLevelNum.textContent = level.toString();
        if (level > 1 && this.gameInstance) {
          recordGameActivity({ gameId: 'blockz', level, score: this.gameInstance.score, status: 'complete', result: 'LEVEL ADVANCE' });
        }
      }
    });

    this.gameInstance.start();
  }
}

function boot() {
  new TetrisCabinetApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
