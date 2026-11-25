/**
 * Big Jump Application Entry Point (1983 Track & Field Long Jump)
 */

import { MAX_RUN_SPEED } from './entities.js';
import { BigJumpGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class BigJumpApp {
  constructor() {
    this.canvas = document.getElementById('jump-canvas');
    this.btnBack = document.getElementById('btn-back-hub');
    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudQualify = document.getElementById('hud-qualify');
    this.hudTry1 = document.getElementById('hud-try-1');
    this.hudTry2 = document.getElementById('hud-try-2');
    this.hudTry3 = document.getElementById('hud-try-3');
    this.hudRound = document.getElementById('hud-round');

    this.hudSpeedVal = document.getElementById('hud-speed-val');
    this.speedBarFill = document.getElementById('speed-bar-fill');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayBestJump = document.getElementById('overlay-best-jump');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');
    this.floatingBanner = document.getElementById('floating-banner');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    if (this.hudHighScore) {
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, '0');
    }

    this.soundEnabled = true;
    this.crtEnabled = true;
    this.spacePressed = false;
    this.jumpInputs = new Set();

    this.initGame();
    this.bindEvents();
    this.startGameLoop();
  }

  initGame() {
    this.game = new BigJumpGame(this.canvas, {
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
      onSpeedUpdate: (speed) => {
        if (this.hudSpeedVal) this.hudSpeedVal.textContent = `${speed} cm/sec`;
        if (this.speedBarFill) {
          const pct = Math.min(100, Math.round((speed / MAX_RUN_SPEED) * 100));
          this.speedBarFill.style.width = `${pct}%`;
        }
      },
      onQualifyUpdate: (qualifyStr) => {
        if (this.hudQualify) this.hudQualify.textContent = qualifyStr;
      },
      onRoundUpdate: (round) => {
        if (this.hudRound) this.hudRound.textContent = round.toString();
        if (this.hudTry1) this.hudTry1.textContent = '--m--';
        if (this.hudTry2) this.hudTry2.textContent = '--m--';
        if (this.hudTry3) this.hudTry3.textContent = '--m--';
      },
      onTryUpdate: ({ tryIndex, distanceStr }) => {
        const el = [this.hudTry1, this.hudTry2, this.hudTry3][tryIndex];
        if (el) el.textContent = distanceStr;
      },
      onRoundSuccess: ({ round, bestDistance, bonus }) => {
        if (this.floatingBanner) {
          this.floatingBanner.textContent = `★ QUALIFIED ROUND ${round}! ${bestDistance} (+${bonus} PTS) ★`;
          this.floatingBanner.classList.add('show');
          setTimeout(() => {
            this.floatingBanner.classList.remove('show');
          }, 2800);
        }
      },
      onGameOver: ({ score, round, bestDistance }) => {
        this.handleGameOver(score, round, bestDistance);
      }
    });

    this.game.start();
  }

  handleGameOver(score, round, bestDistance) {
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = score.toString().padStart(6, '0');
    if (this.overlayBestJump) this.overlayBestJump.textContent = bestDistance;
    if (this.gameOverlay) this.gameOverlay.classList.add('visible');

    submitMatchRecord({
      score,
      level: round,
      result: `ROUND ${round} (${bestDistance})`
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

    // CRT Toggle
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
      this.spacePressed = false;
      this.jumpInputs.clear();
      this.floatingBanner?.classList.remove('show');
      this.game.start();
      if (this.btnPause) this.btnPause.textContent = 'PAUSE';
    };

    if (this.btnRestart) this.btnRestart.addEventListener('click', doRestart);
    if (this.overlayRestartBtn) this.overlayRestartBtn.addEventListener('click', doRestart);

    const beginJump = (source) => {
      if (this.jumpInputs.has(source)) return;
      if (this.game.state === 'GAME_OVER') { doRestart(); return; }
      if (this.jumpInputs.size === 0 && !this.game.startJumpCharge()) return;
      this.jumpInputs.add(source);
      this.spacePressed = true;
    };
    const endJump = (source) => {
      if (!this.jumpInputs.delete(source)) return;
      if (this.jumpInputs.size === 0) {
        this.spacePressed = false;
        this.game.releaseJump();
      }
    };
    const loseFocus = () => {
      if (!['PAUSED', 'GAME_OVER'].includes(this.game.state)) {
        this.game.togglePause();
        if (this.btnPause) this.btnPause.textContent = 'RESUME';
      }
      for (const source of [...this.jumpInputs]) endJump(source);
      document.querySelectorAll('.controls-deck .active').forEach(el => el.classList.remove('active'));
    };
    window.addEventListener('blur', loseFocus);
    document.addEventListener('visibilitychange', () => { if (document.hidden) loseFocus(); });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD', 'KeyZ', 'KeyX', 'KeyJ', 'KeyP', 'KeyM'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      sound.init();

      if (['ArrowLeft', 'KeyA', 'KeyZ'].includes(e.code)) {
        this.game.handleStep('L');
      } else if (['ArrowRight', 'KeyD', 'KeyX'].includes(e.code)) {
        this.game.handleStep('R');
      } else if (['Space', 'KeyJ'].includes(e.code)) {
        e.preventDefault();
        beginJump(e.code);
      } else if (e.code === 'KeyP') {
        if (this.btnPause) this.btnPause.click();
      } else if (e.code === 'KeyM') {
        if (this.btnSound) this.btnSound.click();
      } else if (e.code === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['Space', 'KeyJ'].includes(e.code)) {
        endJump(e.code);
      }
    });

    // Mobile Virtual Touch Buttons
    const btnRunL = document.getElementById('btn-run-left');
    if (btnRunL) {
      btnRunL.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        btnRunL.setPointerCapture(e.pointerId);
        this.game.handleStep('L');
        btnRunL.classList.add('active');
      });
      btnRunL.addEventListener('pointerup', () => btnRunL.classList.remove('active'));
      btnRunL.addEventListener('pointercancel', () => btnRunL.classList.remove('active'));
    }

    const btnRunR = document.getElementById('btn-run-right');
    if (btnRunR) {
      btnRunR.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        btnRunR.setPointerCapture(e.pointerId);
        this.game.handleStep('R');
        btnRunR.classList.add('active');
      });
      btnRunR.addEventListener('pointerup', () => btnRunR.classList.remove('active'));
      btnRunR.addEventListener('pointercancel', () => btnRunR.classList.remove('active'));
    }

    const btnJump = document.getElementById('btn-action-jump');
    if (btnJump) {
      btnJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        btnJump.setPointerCapture(e.pointerId);
        beginJump(`pointer:${e.pointerId}`);
        if (this.spacePressed) btnJump.classList.add('active');
      });
      const releasePointer = (e) => {
        e.preventDefault();
        endJump(`pointer:${e.pointerId}`);
        if (!this.spacePressed) btnJump.classList.remove('active');
      };
      btnJump.addEventListener('pointerup', releasePointer);
      btnJump.addEventListener('pointercancel', releasePointer);
      btnJump.addEventListener('lostpointercapture', releasePointer);
    }

    // Canvas Tap to Jump / Restart
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
  new BigJumpApp();
});
