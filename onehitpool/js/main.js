/**
 * One Hit Pool Application Entrypoint & UI Controller
 */

import { OneHitPoolGame, GAME_STATES } from './game.js';
import { poolAudio } from './audio.js';
import { getLocalHighScore } from './storage.js';

class OneHitPoolApp {
  constructor() {
    this.canvas = document.getElementById('pool-canvas');
    this.container = document.getElementById('game-canvas-container');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudLevel = document.getElementById('hud-level');
    this.hudLives = document.getElementById('hud-lives');
    this.hudStreak = document.getElementById('hud-streak');
    this.powerFill = document.getElementById('power-meter-fill');
    this.powerPct = document.getElementById('power-meter-pct');

    // Overlays & Banners
    this.floatingBanner = document.getElementById('floating-banner');
    this.readyHint = document.getElementById('ready-hint');
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayBestScore = document.getElementById('overlay-best-score');
    this.overlayFinalLevel = document.getElementById('overlay-final-level');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    // Controls
    this.btnAimLeft = document.getElementById('btn-aim-left');
    this.btnAimRight = document.getElementById('btn-aim-right');
    this.btnPowerUp = document.getElementById('btn-power-up');
    this.btnPowerDown = document.getElementById('btn-power-down');
    this.btnShoot = document.getElementById('btn-shoot');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.isPaused = false;
    this.lastTime = performance.now();
    this.keys = {};

    this.initGame();
    this.bindEvents();
    this.startLoop();
  }

  initGame() {
    this.game = new OneHitPoolGame(this.canvas, {
      onHudUpdate: (stats) => this.updateHud(stats),
      onBanner: (text, type) => this.showBanner(text, type),
      onGameOver: (stats) => this.showGameOver(stats)
    });

    this.updateHud({
      score: this.game.score,
      highScore: this.game.highScore,
      level: this.game.level,
      lives: this.game.lives,
      streak: this.game.streak,
      state: this.game.state
    });
  }

  updateHud({ score, highScore, level, lives, streak, state }) {
    if (this.hudScore) this.hudScore.textContent = score.toString().padStart(6, '0');
    if (this.hudHighScore) this.hudHighScore.textContent = highScore.toString().padStart(6, '0');
    if (this.hudLevel) this.hudLevel.textContent = level.toString();
    if (this.hudStreak) this.hudStreak.textContent = streak.toString();

    if (this.hudLives) {
      const lifeIcons = ['☠️', '🎱', '🎱 🎱', '🎱 🎱 🎱'];
      this.hudLives.textContent = lifeIcons[Math.max(0, Math.min(3, lives))] || '🎱';
    }

    if (this.powerFill && this.game) {
      const pct = Math.round(this.game.aimPower * 100);
      this.powerFill.style.width = `${pct}%`;
      if (this.powerPct) this.powerPct.textContent = `${pct}%`;
    }

    if (this.readyHint) {
      this.readyHint.style.display = state === GAME_STATES.AIMING ? 'block' : 'none';
    }
  }

  showBanner(text, type = 'success') {
    if (!this.floatingBanner) return;
    this.floatingBanner.textContent = text;
    this.floatingBanner.className = `floating-banner show ${type}`;

    setTimeout(() => {
      this.floatingBanner.className = 'floating-banner';
    }, 1400);
  }

  showGameOver({ finalScore, highScore, level }) {
    if (!this.gameOverlay) return;
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = finalScore.toString().padStart(6, '0');
    if (this.overlayBestScore) this.overlayBestScore.textContent = highScore.toString().padStart(6, '0');
    if (this.overlayFinalLevel) this.overlayFinalLevel.textContent = `LEVEL ${level}`;
    this.gameOverlay.classList.add('active');
  }

  hideGameOver() {
    if (this.gameOverlay) this.gameOverlay.classList.remove('active');
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  bindEvents() {
    // --- Canvas Pointer Events for Drag & Aim ---
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      const coords = this.getCanvasCoords(e);
      this.game.startDrag(coords.x, coords.y);
      this.updateHud({
        score: this.game.score,
        highScore: this.game.highScore,
        level: this.game.level,
        lives: this.game.lives,
        streak: this.game.streak,
        state: this.game.state
      });
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const coords = this.getCanvasCoords(e);
      if (this.game.isDragging) {
        this.game.updateDrag(coords.x, coords.y);
      } else if (this.game.state === GAME_STATES.AIMING && this.game.cueBall) {
        // Direct hover aim
        const dx = coords.x - this.game.cueBall.x;
        const dy = coords.y - this.game.cueBall.y;
        this.game.setAimAngle(Math.atan2(dy, dx));
      }
      this.updateHud({
        score: this.game.score,
        highScore: this.game.highScore,
        level: this.game.level,
        lives: this.game.lives,
        streak: this.game.streak,
        state: this.game.state
      });
    });

    const finishDrag = (e) => {
      if (this.game.isDragging) {
        this.game.endDrag();
      }
    };
    this.canvas.addEventListener('pointerup', finishDrag);
    this.canvas.addEventListener('pointercancel', finishDrag);

    // --- Keyboard Controls ---
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.key] = true;

      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      } else if (e.key === 'm' || e.key === 'M') {
        this.toggleSound();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (this.game.state === GAME_STATES.AIMING) {
          this.game.shoot();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // --- On-screen Virtual Deck Buttons ---
    if (this.btnAimLeft) {
      this.btnAimLeft.addEventListener('click', () => {
        this.game.setAimAngle(this.game.aimAngle - 0.05);
      });
    }
    if (this.btnAimRight) {
      this.btnAimRight.addEventListener('click', () => {
        this.game.setAimAngle(this.game.aimAngle + 0.05);
      });
    }
    if (this.btnPowerUp) {
      this.btnPowerUp.addEventListener('click', () => {
        this.game.setAimPower(this.game.aimPower + 0.05);
        this.updateHud({
          score: this.game.score,
          highScore: this.game.highScore,
          level: this.game.level,
          lives: this.game.lives,
          streak: this.game.streak,
          state: this.game.state
        });
      });
    }
    if (this.btnPowerDown) {
      this.btnPowerDown.addEventListener('click', () => {
        this.game.setAimPower(this.game.aimPower - 0.05);
        this.updateHud({
          score: this.game.score,
          highScore: this.game.highScore,
          level: this.game.level,
          lives: this.game.lives,
          streak: this.game.streak,
          state: this.game.state
        });
      });
    }
    if (this.btnShoot) {
      this.btnShoot.addEventListener('click', () => {
        if (this.game.state === GAME_STATES.AIMING) {
          this.game.shoot();
        }
      });
    }

    // Header buttons
    if (this.btnPauseGame) {
      this.btnPauseGame.addEventListener('click', () => this.togglePause());
    }
    if (this.btnRestartGame) {
      this.btnRestartGame.addEventListener('click', () => this.restartGame());
    }
    if (this.overlayRestartBtn) {
      this.overlayRestartBtn.addEventListener('click', () => this.restartGame());
    }

    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => this.toggleSound());
    }

    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => this.toggleCrt());
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.btnPauseGame) {
      this.btnPauseGame.textContent = this.isPaused ? 'RESUME' : 'PAUSE';
      this.btnPauseGame.classList.toggle('active', this.isPaused);
    }
  }

  restartGame() {
    this.hideGameOver();
    this.isPaused = false;
    if (this.btnPauseGame) {
      this.btnPauseGame.textContent = 'PAUSE';
      this.btnPauseGame.classList.remove('active');
    }
    this.game.restart();
  }

  toggleSound() {
    const active = poolAudio.toggleMute();
    if (this.btnToggleSound) {
      this.btnToggleSound.classList.toggle('active', active);
    }
    if (this.soundIcon) {
      this.soundIcon.textContent = active ? '🔊' : '🔇';
    }
  }

  toggleCrt() {
    if (!this.crtOverlay || !this.btnToggleCrt) return;
    const isOff = this.crtOverlay.classList.toggle('disabled');
    this.btnToggleCrt.classList.toggle('active', !isOff);
    this.btnToggleCrt.textContent = isOff ? 'CRT: OFF' : 'CRT: ON';
    try {
      localStorage.setItem('retro_arcade_opt_crt_enabled', JSON.stringify(!isOff));
    } catch {}
  }

  processKeyboard(dt) {
    if (this.game.state !== GAME_STATES.AIMING) return;

    const angleSpeed = 1.4 * dt;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.game.setAimAngle(this.game.aimAngle - angleSpeed);
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.game.setAimAngle(this.game.aimAngle + angleSpeed);
    }

    const powerSpeed = 0.5 * dt;
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.game.setAimPower(this.game.aimPower + powerSpeed);
      this.updateHud({
        score: this.game.score,
        highScore: this.game.highScore,
        level: this.game.level,
        lives: this.game.lives,
        streak: this.game.streak,
        state: this.game.state
      });
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.game.setAimPower(this.game.aimPower - powerSpeed);
      this.updateHud({
        score: this.game.score,
        highScore: this.game.highScore,
        level: this.game.level,
        lives: this.game.lives,
        streak: this.game.streak,
        state: this.game.state
      });
    }
  }

  startLoop() {
    const loop = (now) => {
      const dt = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;

      if (!this.isPaused) {
        this.processKeyboard(dt);
        this.game.update(dt);
      }

      this.game.draw();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OneHitPoolApp();
});
