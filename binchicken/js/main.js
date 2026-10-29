/**
 * Bin Chicken Application Entrypoint & UI Controller
 */

import { BinChickenGame } from './game.js';
import { sound } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

export function calculateMedal(score) {
  if (score >= 75) return { icon: '🏆', name: 'GOLDEN WHEELIE BIN' };
  if (score >= 50) return { icon: '🥈', name: 'SILVER DUMPSTER' };
  if (score >= 25) return { icon: '🍟', name: 'HOT CHIP FEAST' };
  if (score >= 10) return { icon: '🍞', name: 'BREAD CRUST' };
  return { icon: '🥫', name: 'TIN CAN' };
}

export function calculateRank(score) {
  if (score >= 75) return 'TIP DEITY';
  if (score >= 50) return 'PARK LORD';
  if (score >= 25) return 'CURB KING';
  if (score >= 10) return 'SCAVENGER';
  return 'ROOKIE';
}

class BinChickenApp {
  constructor() {
    this.canvas = document.getElementById('binchicken-canvas');
    this.canvasContainer = document.getElementById('game-canvas-container');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-high-score');
    this.hudChips = document.getElementById('hud-chips');
    this.hudRank = document.getElementById('hud-rank');

    // Overlays & Banners
    this.floatingBanner = document.getElementById('floating-banner');
    this.readyHint = document.getElementById('ready-hint');
    this.gameOverlay = document.getElementById('game-overlay');
    this.overlayMedalIcon = document.getElementById('overlay-medal-icon');
    this.overlayMedalName = document.getElementById('overlay-medal-name');
    this.overlayFinalScore = document.getElementById('overlay-final-score');
    this.overlayBestScore = document.getElementById('overlay-best-score');
    this.overlayChipsCount = document.getElementById('overlay-chips-count');
    this.overlayRestartBtn = document.getElementById('overlay-restart-btn');

    // Controls
    this.btnFlap = document.getElementById('btn-flap');
    this.btnPauseGame = document.getElementById('btn-pause-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.crtOverlay = document.getElementById('crt-overlay');

    this.highScore = getLocalHighScore();
    this.updateHighScoreDisplay();

    this.initGame();
    this.bindEvents();
  }

  initGame() {
    this.game = new BinChickenGame(this.canvas, {
      onScore: (score) => {
        if (this.hudScore) this.hudScore.textContent = score.toString().padStart(4, '0');
        if (this.hudRank) this.hudRank.textContent = calculateRank(score);
        if (score > this.highScore) {
          this.highScore = score;
          this.updateHighScoreDisplay();
          saveLocalHighScore(score);
        }
      },
      onChips: (chips) => {
        if (this.hudChips) this.hudChips.textContent = chips.toString();
      },
      onChipSnack: (chips, score) => {
        this.showFloatingBanner(`★ HOT CHIP SNATCHED! +5 ★`);
      },
      onStart: () => {
        if (this.readyHint) this.readyHint.style.display = 'none';
        if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      },
      onReady: () => {
        if (this.readyHint) this.readyHint.style.display = 'block';
        if (this.gameOverlay) this.gameOverlay.classList.remove('visible');
      },
      onGameOver: (stats) => {
        this.handleGameOver(stats);
      }
    });

    this.game.start();
  }

  updateHighScoreDisplay() {
    if (this.hudHighScore) {
      this.hudHighScore.textContent = this.highScore.toString().padStart(4, '0');
    }
  }

  showFloatingBanner(text) {
    if (!this.floatingBanner) return;
    this.floatingBanner.textContent = text;
    this.floatingBanner.classList.add('show');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.floatingBanner.classList.remove('show');
    }, 1400);
  }

  handleGameOver(stats) {
    const medal = calculateMedal(stats.score);
    if (this.overlayMedalIcon) this.overlayMedalIcon.textContent = medal.icon;
    if (this.overlayMedalName) this.overlayMedalName.textContent = medal.name;
    if (this.overlayFinalScore) this.overlayFinalScore.textContent = stats.score.toString().padStart(4, '0');
    if (this.overlayBestScore) this.overlayBestScore.textContent = this.highScore.toString().padStart(4, '0');
    if (this.overlayChipsCount) this.overlayChipsCount.textContent = stats.chips.toString();

    setTimeout(() => {
      if (this.gameOverlay) this.gameOverlay.classList.add('visible');
      sound.medal();
    }, 450);

    // Save and submit match record to Games Vault
    submitMatchRecord({
      score: stats.score,
      chips: stats.chips,
      result: `${stats.score} PTS (${stats.chips} CHIPS)`
    });
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.game.handleFlap();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const isPaused = this.game.togglePause();
        if (this.btnPauseGame) {
          this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleSound();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this.game.reset();
      }
    });

    // Touch & Canvas Tap
    const triggerFlap = (e) => {
      e.preventDefault();
      this.game.handleFlap();
    };

    if (this.canvasContainer) {
      this.canvasContainer.addEventListener('mousedown', triggerFlap);
      this.canvasContainer.addEventListener('touchstart', triggerFlap, { passive: false });
    }

    if (this.btnFlap) {
      this.btnFlap.addEventListener('mousedown', triggerFlap);
      this.btnFlap.addEventListener('touchstart', triggerFlap, { passive: false });
    }

    // Overlay restart button
    if (this.overlayRestartBtn) {
      this.overlayRestartBtn.addEventListener('click', () => {
        this.game.reset();
      });
    }

    // Cabinet sub-bar controls
    if (this.btnRestartGame) {
      this.btnRestartGame.addEventListener('click', () => {
        this.game.reset();
      });
    }

    if (this.btnPauseGame) {
      this.btnPauseGame.addEventListener('click', () => {
        const isPaused = this.game.togglePause();
        this.btnPauseGame.textContent = isPaused ? 'RESUME' : 'PAUSE';
      });
    }

    // Header buttons
    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => {
        this.toggleSound();
      });
    }

    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => {
        if (this.crtOverlay) {
          const disabled = this.crtOverlay.classList.toggle('disabled');
          this.btnToggleCrt.textContent = disabled ? 'CRT: OFF' : 'CRT: ON';
          this.btnToggleCrt.classList.toggle('active', !disabled);
        }
      });
    }
  }

  toggleSound() {
    const unmuted = sound.toggleMute();
    if (this.btnToggleSound) {
      this.btnToggleSound.classList.toggle('active', unmuted);
    }
    if (this.soundIcon) {
      this.soundIcon.textContent = unmuted ? '🔊' : '🔇';
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BinChickenApp());
  } else {
    new BinChickenApp();
  }
}
