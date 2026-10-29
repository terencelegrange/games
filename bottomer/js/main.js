/**
 * Bottomer Application Entry Point (1983 Bally Midway Tapper Tribute)
 */

import { BottomerGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

class BottomerApp {
  constructor() {
    this.canvas = document.getElementById('saloon-canvas');
    this.btnBack = document.getElementById('btn-back-hub');
    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLives = document.getElementById('hud-lives');
    this.hudRound = document.getElementById('hud-round');

    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayFinalRound = document.getElementById('overlay-final-round');
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

  formatLives(num) {
    return '🍺 '.repeat(Math.max(0, num)).trim();
  }

  initGame() {
    this.game = new BottomerGame(this.canvas, {
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
        if (this.hudLives) this.hudLives.textContent = this.formatLives(lives);
      },
      onRoundUpdate: (round) => {
        if (this.hudRound) this.hudRound.textContent = round.toString();
      },
      onRoundClear: ({ round, bonus }) => {
        if (this.floatingBanner) {
          this.floatingBanner.textContent = `★ SALOON WAVE ${round} CLEAR! (+${bonus} PTS) ★`;
          this.floatingBanner.classList.add('show');
          setTimeout(() => {
            this.floatingBanner.classList.remove('show');
          }, 2600);
        }
      },
      onGameOver: ({ score, round, reason }) => {
        this.handleGameOver(score, round, reason);
      }
    });

    this.game.start();
  }

  handleGameOver(score, round, reason) {
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = score.toString().padStart(6, '0');
    if (this.overlayFinalRound) this.overlayFinalRound.textContent = `WAVE ${round}`;
    if (this.gameOverlay) this.gameOverlay.classList.add('visible');

    let reasonText = 'LAST CALL!';
    if (reason === 'OVERTHROWN_MUG') reasonText = 'DROPPED MUG ON FLOOR!';
    else if (reason === 'DROPPED_EMPTY') reasonText = 'MISSED RETURNING STEIN!';
    else if (reason === 'PATRON_REACHED_BAR') reasonText = 'THIRSTY PATRON TOOK OVER THE BAR!';
    if (this.overlayTitle) this.overlayTitle.textContent = reasonText;

    submitMatchRecord({
      score,
      level: round,
      result: `WAVE ${round}`
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

    const held = new Set();
    const syncInput = () => {
      this.game.input.left = ['ArrowLeft', 'KeyA', 'pointer:left'].some(key => held.has(key));
      this.game.input.right = ['ArrowRight', 'KeyD', 'pointer:right'].some(key => held.has(key));
      this.game.input.pour = ['Space', 'Enter', 'KeyF', 'pointer:pour'].some(key => held.has(key));
    };

    // Restart
    const doRestart = () => {
      sound.init();
      if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      held.clear();
      this.floatingBanner?.classList.remove('show');
      this.game.start();
      if (this.btnPause) this.btnPause.textContent = 'PAUSE';
    };

    if (this.btnRestart) this.btnRestart.addEventListener('click', doRestart);
    if (this.overlayRestartBtn) this.overlayRestartBtn.addEventListener('click', doRestart);

    // Hold controls use game time rather than operating-system key repeats.
    window.addEventListener('keydown', (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'Enter', 'KeyF', 'KeyP', 'KeyM'];
      if (keys.includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      sound.init();
      if (e.code === 'KeyP') { this.btnPause?.click(); return; }
      if (e.code === 'KeyM') { this.btnSound?.click(); return; }
      if (e.code === 'Escape') { window.location.href = '../index.html'; return; }
      if (['Space', 'Enter', 'KeyF'].includes(e.code) && this.game.state === 'GAME_OVER') {
        doRestart();
        return;
      }
      if (this.game.state !== 'PLAYING') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.game.moveBar(-1);
      else if (['ArrowDown', 'KeyS'].includes(e.code)) this.game.moveBar(1);
      else {
        held.add(e.code);
        syncInput();
        if (['Space', 'Enter', 'KeyF'].includes(e.code)) this.game.handlePour();
      }
    });
    window.addEventListener('keyup', (e) => { held.delete(e.code); syncInput(); });
    const clearHeld = () => {
      held.clear();
      this.game.clearInput();
      document.querySelectorAll('.controls-deck .active').forEach(el => el.classList.remove('active'));
    };
    this.btnPause?.addEventListener('click', clearHeld);
    const loseFocus = () => {
      clearHeld();
      if (!['PAUSED', 'GAME_OVER'].includes(this.game.state)) {
        this.game.togglePause();
        if (this.btnPause) this.btnPause.textContent = 'RESUME';
      }
    };
    window.addEventListener('blur', loseFocus);
    document.addEventListener('visibilitychange', () => { if (document.hidden) loseFocus(); });

    for (const [id, direction] of [['btn-bar-up', -1], ['btn-bar-down', 1]]) {
      document.getElementById(id)?.addEventListener('pointerdown', e => {
        e.preventDefault();
        sound.init();
        this.game.moveBar(direction);
      });
    }
    for (const [id, action] of [['btn-walk-left', 'left'], ['btn-walk-right', 'right'], ['btn-action-pour', 'pour']]) {
      const button = document.getElementById(id);
      if (!button) continue;
      button.addEventListener('pointerdown', e => {
        e.preventDefault();
        sound.init();
        if (action === 'pour' && this.game.state === 'GAME_OVER') { doRestart(); return; }
        if (this.game.state !== 'PLAYING') return;
        button.setPointerCapture(e.pointerId);
        held.add(`pointer:${action}`);
        syncInput();
        if (action === 'pour') this.game.handlePour();
        button.classList.add('active');
      });
      const release = e => {
        e.preventDefault();
        held.delete(`pointer:${action}`);
        syncInput();
        button.classList.remove('active');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    }
  }

  startGameLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      this.game.update(dt);
      this.game.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BottomerApp();
});
