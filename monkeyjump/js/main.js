/**
 * Monkey Jump Arcade Application Entry Point
 */

import { MonkeyJumpGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class MonkeyJumpApp {
  constructor() {
    this.canvas = document.getElementById('monkey-canvas');
    this.btnBack = document.getElementById('btn-back-hub');
    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudBonus = document.getElementById('hud-bonus');
    this.hudLevel = document.getElementById('hud-level');
    this.hudLives = document.getElementById('hud-lives');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalStage = document.getElementById('overlay-final-stage');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');
    this.floatingBanner = document.getElementById('floating-banner');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');

    this.soundEnabled = true;
    this.crtEnabled = true;

    this.initGame();
    this.bindEvents();
    this.startGameLoop();
  }

  initGame() {
    this.game = new MonkeyJumpGame(this.canvas, {
      onScoreUpdate: (score) => {
        this.hudScore.textContent = score.toString().padStart(6, '0');
        if (score > this.highScore) {
          this.highScore = score;
          saveLocalHighScore(this.highScore);
          this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
        }
      },
      onLivesUpdate: (lives) => {
        this.hudLives.textContent = '🏃 '.repeat(Math.max(0, lives)).trim() || 'DEAD';
      },
      onBonusUpdate: (bonus) => {
        this.hudBonus.textContent = bonus.toString().padStart(4, '0');
      },
      onLevelUpdate: (level) => {
        this.hudLevel.textContent = level.toString();
      },
      onStageClear: (stage) => {
        this.floatingBanner.textContent = `★ STAGE ${stage} RESCUED! ★`;
        this.floatingBanner.classList.add('show');
        setTimeout(() => {
          this.floatingBanner.classList.remove('show');
        }, 2200);
      },
      onGameOver: ({ score, level }) => {
        this.handleGameOver(score, level);
      }
    });

    this.game.start();
  }

  handleGameOver(score, level) {
    this.overlayFinalScore.textContent = score.toString().padStart(6, '0');
    this.overlayFinalStage.textContent = `STAGE ${level}`;
    this.gameOverlay.classList.add('visible');

    submitMatchRecord({
      score,
      level,
      result: `STAGE ${level} (${score} PTS)`
    });
  }

  bindEvents() {
    // Sound Toggle
    this.btnSound.addEventListener('click', () => {
      this.soundEnabled = sound.toggle();
      this.btnSound.textContent = this.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
      this.btnSound.classList.toggle('active', this.soundEnabled);
    });

    // CRT Scanlines Toggle
    this.btnCrt.addEventListener('click', () => {
      this.crtEnabled = !this.crtEnabled;
      this.crtOverlay.classList.toggle('disabled', !this.crtEnabled);
      this.btnCrt.classList.toggle('active', this.crtEnabled);
      this.btnCrt.textContent = this.crtEnabled ? 'CRT: ON' : 'CRT: OFF';
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

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      sound.init();

      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.game.input.left = true;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.game.input.right = true;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.game.input.up = true;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.game.input.down = true;
      } else if (['Space', 'KeyZ', 'KeyJ'].includes(e.code)) {
        e.preventDefault();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        } else {
          this.game.handleJump();
        }
      } else if (e.code === 'KeyP') {
        this.btnPause.click();
      } else if (e.code === 'KeyM') {
        this.btnSound.click();
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.game.input.left = false;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.game.input.right = false;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.game.input.up = false;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.game.input.down = false;
      }
    });

    // Virtual D-Pad Touch Handlers
    const bindTouchDir = (id, dirKey) => {
      const el = document.getElementById(id);
      if (!el) return;
      const setOn = (e) => {
        e.preventDefault();
        sound.init();
        this.game.input[dirKey] = true;
        el.classList.add('active');
      };
      const setOff = (e) => {
        e.preventDefault();
        this.game.input[dirKey] = false;
        el.classList.remove('active');
      };
      el.addEventListener('pointerdown', setOn);
      el.addEventListener('pointerup', setOff);
      el.addEventListener('pointercancel', setOff);
      el.addEventListener('pointerleave', setOff);
    };

    bindTouchDir('dpad-left', 'left');
    bindTouchDir('dpad-right', 'right');
    bindTouchDir('dpad-up', 'up');
    bindTouchDir('dpad-down', 'down');

    // Virtual Jump Button
    const btnJump = document.getElementById('btn-action-jump');
    if (btnJump) {
      btnJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        } else {
          this.game.handleJump();
          btnJump.classList.add('active');
        }
      });
      btnJump.addEventListener('pointerup', () => btnJump.classList.remove('active'));
      btnJump.addEventListener('pointercancel', () => btnJump.classList.remove('active'));
    }

    // Canvas Tap to Jump / Restart
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      if (this.game.state === 'GAME_OVER') {
        doRestart();
      } else {
        this.game.handleJump();
      }
    });
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
  new MonkeyJumpApp();
});
