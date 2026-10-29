/**
 * Biplane Flyer Arcade Application Entry Point (Sopwith Camel Tribute)
 */

import { BiplaneGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class BiplaneApp {
  constructor() {
    this.canvas = document.getElementById('biplane-canvas');
    this.btnBack = document.getElementById('btn-back-hub');
    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudStage = document.getElementById('hud-stage');
    this.hudLives = document.getElementById('hud-lives');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudAlt = document.getElementById('hud-alt');
    this.hudThrottle = document.getElementById('hud-throttle');
    this.hudFuel = document.getElementById('hud-fuel');
    this.hudBombs = document.getElementById('hud-bombs');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalStage = document.getElementById('overlay-final-stage');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');
    this.floatingBanner = document.getElementById('floating-banner');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    if (this.hudHighScore) {
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
    }

    this.soundEnabled = true;
    this.crtEnabled = true;

    this.initGame();
    this.bindEvents();
    this.startGameLoop();
  }

  initGame() {
    this.game = new BiplaneGame(this.canvas, {
      onScoreUpdate: (score) => {
        if (this.hudScore) this.hudScore.textContent = score.toString().padStart(6, '0');
        if (score > this.highScore) {
          this.highScore = score;
          saveLocalHighScore(this.highScore);
          if (this.hudHighScore) {
            this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
          }
        }
      },
      onLivesUpdate: (lives) => {
        if (this.hudLives) {
          this.hudLives.textContent = '✈️ '.repeat(Math.max(0, lives)).trim() || 'SHOT DOWN';
        }
      },
      onLevelUpdate: (level) => {
        if (this.hudStage) this.hudStage.textContent = level.toString();
      },
      onSpeedUpdate: (speed) => {
        if (this.hudSpeed) this.hudSpeed.textContent = `${speed} KTS`;
      },
      onAltUpdate: (alt) => {
        if (this.hudAlt) this.hudAlt.textContent = `${alt} FT`;
      },
      onThrottleUpdate: (throttle) => {
        if (this.hudThrottle) this.hudThrottle.textContent = `${throttle}%`;
      },
      onFuelUpdate: (fuel) => {
        if (this.hudFuel) this.hudFuel.textContent = `${Math.max(0, Math.round(fuel))}%`;
      },
      onBombsUpdate: (bombs) => {
        if (this.hudBombs) {
          this.hudBombs.textContent = '💣 '.repeat(Math.max(0, bombs)).trim() || 'EMPTY';
        }
      },
      onMissionSuccess: ({ level, bonus }) => {
        if (this.floatingBanner) {
          this.floatingBanner.textContent = `★ MISSION ${level} ACCOMPLISHED! +${bonus} PTS ★`;
          this.floatingBanner.classList.add('show');
          setTimeout(() => {
            this.floatingBanner.classList.remove('show');
          }, 2600);
        }
      },
      onGameOver: ({ score, level }) => {
        this.handleGameOver(score, level);
      }
    });

    this.game.start();
  }

  handleGameOver(score, level) {
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = score.toString().padStart(6, '0');
    if (this.overlayFinalStage) this.overlayFinalStage.textContent = `MISSION ${level}`;
    if (this.gameOverlay) this.gameOverlay.classList.add('visible');

    submitMatchRecord({
      score,
      level,
      result: `MISSION ${level} (${score} PTS)`
    });
  }

  bindEvents() {
    // Sound Toggle
    if (this.btnSound) {
      this.btnSound.addEventListener('click', () => {
        this.soundEnabled = sound.toggle();
        this.btnSound.textContent = this.soundEnabled ? '🔊 SOUND' : '🔇 MUTED';
        this.btnSound.classList.toggle('active', this.soundEnabled);
      });
    }

    // CRT Filter Toggle
    if (this.btnCrt) {
      this.btnCrt.addEventListener('click', () => {
        this.crtEnabled = !this.crtEnabled;
        if (this.crtOverlay) this.crtOverlay.classList.toggle('disabled', !this.crtEnabled);
        this.btnCrt.classList.toggle('active', this.crtEnabled);
        this.btnCrt.textContent = this.crtEnabled ? 'CRT: ON' : 'CRT: OFF';
      });
    }

    // Pause
    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => {
        sound.init();
        const isPaused = this.game.togglePause();
        this.btnPause.textContent = isPaused ? 'RESUME' : 'PAUSE';
      });
    }

    // Restart
    const doRestart = () => {
      sound.init();
      if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      this.game.start();
      if (this.btnPause) this.btnPause.textContent = 'PAUSE';
    };

    if (this.btnRestart) this.btnRestart.addEventListener('click', doRestart);
    if (this.overlayRestartBtn) this.overlayRestartBtn.addEventListener('click', doRestart);

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      const controls = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyJ', 'KeyB', 'KeyK', 'KeyX', 'KeyZ', 'Comma', 'Period', 'Slash', 'KeyF', 'KeyP', 'KeyM'];
      if (controls.includes(e.code)) e.preventDefault();
      sound.init();

      if (['ArrowUp', 'KeyW', 'KeyX'].includes(e.code)) {
        this.game.input.throttleUp = true;
      } else if (['ArrowDown', 'KeyS', 'KeyZ'].includes(e.code)) {
        this.game.input.throttleDown = true;
      } else if (['ArrowLeft', 'KeyA', 'Comma'].includes(e.code)) {
        this.game.input.pitchUp = true;
      } else if (['ArrowRight', 'KeyD', 'Slash'].includes(e.code)) {
        this.game.input.pitchDown = true;
      } else if (['Space', 'KeyJ'].includes(e.code)) {
        e.preventDefault();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        } else {
          this.game.input.fire = true;
        }
      } else if (['KeyB', 'KeyK'].includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) this.game.handleBomb();
      } else if (['Period', 'KeyF'].includes(e.code)) {
        if (!e.repeat) this.game.handleFlip();
      } else if (e.code === 'KeyP' && !e.repeat) {
        if (this.btnPause) this.btnPause.click();
      } else if (e.code === 'KeyM' && !e.repeat) {
        if (this.btnSound) this.btnSound.click();
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'KeyW', 'KeyX'].includes(e.code)) {
        this.game.input.throttleUp = false;
      } else if (['ArrowDown', 'KeyS', 'KeyZ'].includes(e.code)) {
        this.game.input.throttleDown = false;
      } else if (['ArrowLeft', 'KeyA', 'Comma'].includes(e.code)) {
        this.game.input.pitchUp = false;
      } else if (['ArrowRight', 'KeyD', 'Slash'].includes(e.code)) {
        this.game.input.pitchDown = false;
      } else if (['Space', 'KeyJ'].includes(e.code)) {
        this.game.input.fire = false;
      }
    });

    const releaseControls = () => {
      this.game.clearInput();
      document.querySelectorAll('.controls-deck .active').forEach(el => el.classList.remove('active'));
      if (this.game.state === 'PLAYING') {
        this.game.togglePause();
        if (this.btnPause) this.btnPause.textContent = 'RESUME';
      }
    };
    window.addEventListener('blur', releaseControls);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseControls();
    });
    document.getElementById('btn-action-flip')?.addEventListener('click', () => this.game.handleFlip());

    // Touch D-Pad Handlers
    const bindTouchAction = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const setOn = (e) => {
        e.preventDefault();
        sound.init();
        this.game.input[key] = true;
        el.classList.add('active');
      };
      const setOff = (e) => {
        e.preventDefault();
        this.game.input[key] = false;
        el.classList.remove('active');
      };
      el.addEventListener('pointerdown', setOn);
      el.addEventListener('pointerup', setOff);
      el.addEventListener('pointercancel', setOff);
      el.addEventListener('pointerleave', setOff);
    };

    bindTouchAction('dpad-throttle-up', 'throttleUp');
    bindTouchAction('dpad-throttle-down', 'throttleDown');
    bindTouchAction('dpad-pitch-up', 'pitchUp');
    bindTouchAction('dpad-pitch-down', 'pitchDown');

    // Fire & Bomb Action Buttons
    const btnFire = document.getElementById('btn-action-fire');
    if (btnFire) {
      const setFireOn = (e) => {
        e.preventDefault();
        sound.init();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        } else {
          this.game.input.fire = true;
          btnFire.classList.add('active');
        }
      };
      const setFireOff = (e) => {
        e.preventDefault();
        this.game.input.fire = false;
        btnFire.classList.remove('active');
      };
      btnFire.addEventListener('pointerdown', setFireOn);
      btnFire.addEventListener('pointerup', setFireOff);
      btnFire.addEventListener('pointercancel', setFireOff);
      btnFire.addEventListener('pointerleave', setFireOff);
    }

    const btnBomb = document.getElementById('btn-action-bomb');
    if (btnBomb) {
      btnBomb.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        this.game.handleBomb();
        btnBomb.classList.add('active');
      });
      btnBomb.addEventListener('pointerup', () => btnBomb.classList.remove('active'));
      btnBomb.addEventListener('pointercancel', () => btnBomb.classList.remove('active'));
    }

    // Canvas Tap to Fire / Restart
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', (e) => {
        sound.init();
        if (this.game.state === 'GAME_OVER') {
          doRestart();
        }
      });
    }
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
  new BiplaneApp();
});
