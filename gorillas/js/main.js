/**
 * Gorillas Entry Point & UI Controller
 * Binds input fields, sliders, slingshot gestures, audio/CRT controls, and Games Vault.
 */

import { GorillasGame } from './game.js';
import { sound } from './audio.js';
import { Storage } from './storage.js';

class GorillasApp {
  constructor() {
    this.canvas = document.getElementById('gorillas-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');

    // HUD elements
    this.hudPlayerScore = document.getElementById('hud-player-score');
    this.hudAiScore = document.getElementById('hud-ai-score');
    this.hudRound = document.getElementById('hud-round');
    this.hudTurnStatus = document.getElementById('hud-turn-status');
    this.hudWindDir = document.getElementById('hud-wind-dir');
    this.hudWindVal = document.getElementById('hud-wind-val');
    this.windMeterFill = document.getElementById('wind-meter-fill');

    // Controls Dock elements
    this.inputAngle = document.getElementById('input-angle');
    this.sliderAngle = document.getElementById('slider-angle');
    this.inputVelocity = document.getElementById('input-velocity');
    this.sliderVelocity = document.getElementById('slider-velocity');
    this.btnThrow = document.getElementById('btn-throw');

    // Header buttons
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    // Audio & CRT initial states
    sound.enabled = Storage.getSoundEnabled();
    this.updateSoundBtnUI();

    this.crtEnabled = Storage.getCrtEnabled();
    this.updateCrtUI();

    this.initGame();
    this.bindEvents();
  }

  initGame() {
    this.game = new GorillasGame(this.canvas, {
      onWindChange: (wind) => this.handleWindChange(wind),
      onStateChange: (stateData) => this.handleStateChange(stateData),
      onMatchComplete: (matchData) => this.handleMatchComplete(matchData)
    });

    this.game.start();
  }

  handleWindChange(wind) {
    if (this.hudWindVal) {
      this.hudWindVal.textContent = `${Math.abs(wind)} MPH`;
    }
    if (this.hudWindDir) {
      if (wind > 0) {
        this.hudWindDir.textContent = 'EAST ▶';
        this.hudWindDir.style.color = '#38bdf8';
      } else if (wind < 0) {
        this.hudWindDir.textContent = '◀ WEST';
        this.hudWindDir.style.color = '#f87171';
      } else {
        this.hudWindDir.textContent = 'CALM ◆';
        this.hudWindDir.style.color = '#ffff55';
      }
    }
    if (this.windMeterFill) {
      // Scale -12 to +12 across 100% width
      const pct = Math.min(100, Math.max(0, ((wind + 12) / 24) * 100));
      this.windMeterFill.style.width = `${pct}%`;
      this.windMeterFill.style.backgroundColor = wind > 0 ? '#38bdf8' : (wind < 0 ? '#f87171' : '#ffff55');
    }
  }

  handleStateChange(data) {
    if (this.hudPlayerScore) this.hudPlayerScore.textContent = data.playerWins;
    if (this.hudAiScore) this.hudAiScore.textContent = data.aiWins;
    if (this.hudRound) this.hudRound.textContent = data.round;

    if (this.hudTurnStatus) {
      if (data.state === 'PLAYER_AIM') {
        this.hudTurnStatus.textContent = '★ YOUR TURN - ENTER ANGLE & POWER';
        this.hudTurnStatus.style.color = '#4ade80';
        this.enableControls(true);
      } else if (data.state === 'AI_THINKING') {
        this.hudTurnStatus.textContent = '🤖 COMPUTER CALCULATING TRAJECTORY...';
        this.hudTurnStatus.style.color = '#f87171';
        this.enableControls(false);
      } else if (data.state === 'BANANA_FLIGHT') {
        this.hudTurnStatus.textContent = '🍌 BANANA IN FLIGHT...';
        this.hudTurnStatus.style.color = '#ffff55';
        this.enableControls(false);
      } else if (data.state === 'ROUND_OVER') {
        this.enableControls(false);
      } else if (data.state === 'MATCH_OVER') {
        this.hudTurnStatus.textContent = data.playerWins > data.aiWins ? '🏆 MATCH VICTORY!' : '💀 DEFEAT';
        this.hudTurnStatus.style.color = data.playerWins > data.aiWins ? '#4ade80' : '#f87171';
        this.enableControls(false);
      }
    }
  }

  enableControls(enabled) {
    if (this.inputAngle) this.inputAngle.disabled = !enabled;
    if (this.sliderAngle) this.sliderAngle.disabled = !enabled;
    if (this.inputVelocity) this.inputVelocity.disabled = !enabled;
    if (this.sliderVelocity) this.sliderVelocity.disabled = !enabled;
    if (this.btnThrow) this.btnThrow.disabled = !enabled;
  }

  bindEvents() {
    // 1. Angle sync
    this.inputAngle.addEventListener('input', (e) => {
      const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
      this.sliderAngle.value = val;
      this.game.playerAngle = val;
    });
    this.sliderAngle.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.inputAngle.value = val;
      this.game.playerAngle = val;
    });

    // 2. Velocity sync
    this.inputVelocity.addEventListener('input', (e) => {
      const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
      this.sliderVelocity.value = val;
      this.game.playerVelocity = val;
    });
    this.sliderVelocity.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.inputVelocity.value = val;
      this.game.playerVelocity = val;
    });

    // 3. Throw trigger
    this.btnThrow.addEventListener('click', () => {
      this.firePlayerBanana();
    });

    // 4. Slingshot drag-aiming on canvas
    this.setupSlingshotAiming();

    // 5. Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.firePlayerBanana();
      } else if (e.key === 'p' || e.key === 'P') {
        this.game.togglePause();
      } else if (e.key === 'm' || e.key === 'M') {
        this.toggleSound();
      } else if (e.key === 'Escape') {
        window.location.href = '../index.html';
      }
    });

    // 6. Header buttons
    this.btnToggleSound.addEventListener('click', () => this.toggleSound());
    this.btnToggleCrt.addEventListener('click', () => this.toggleCrt());
    this.btnPause.addEventListener('click', () => this.game.togglePause());
    this.btnRestart.addEventListener('click', () => this.game.resetMatch());

    // Bypass rotate overlay for portrait mode
    const btnBypassRotate = document.getElementById('btn-bypass-rotate');
    if (btnBypassRotate) {
      btnBypassRotate.addEventListener('click', () => {
        document.body.classList.add('portrait-bypassed');
      });
    }
  }

  firePlayerBanana() {
    if (this.game.state === 'PLAYER_AIM') {
      const a = Number(this.inputAngle.value) || 60;
      const v = Number(this.inputVelocity.value) || 55;
      this.game.throwBanana(a, v);
    }
  }

  setupSlingshotAiming() {
    const canvas = this.canvas;

    const getCanvasPos = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (this.game.state !== 'PLAYER_AIM') return;
      const pos = getCanvasPos(e);
      const g1 = this.game.skyline.gorilla1;
      if (!g1) return;

      const dist = Math.hypot(pos.x - g1.x, pos.y - g1.y);
      if (dist < 70) {
        this.game.isDragging = true;
        this.game.dragStart = { x: g1.x, y: g1.y };
        this.game.dragCurrent = pos;
        canvas.setPointerCapture(e.pointerId);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.game.isDragging) return;
      const pos = getCanvasPos(e);
      this.game.dragCurrent = pos;

      // Pulling back (down and left) increases power and angle
      const dx = this.game.dragStart.x - pos.x;
      const dy = pos.y - this.game.dragStart.y;

      const angleRad = Math.atan2(dy, -dx);
      let angleDeg = Math.round((angleRad * 180) / Math.PI);
      angleDeg = Math.max(10, Math.min(85, angleDeg));

      const pullDist = Math.hypot(dx, dy);
      const power = Math.max(15, Math.min(95, Math.round(pullDist * 0.9)));

      this.inputAngle.value = angleDeg;
      this.sliderAngle.value = angleDeg;
      this.game.playerAngle = angleDeg;

      this.inputVelocity.value = power;
      this.sliderVelocity.value = power;
      this.game.playerVelocity = power;
    });

    const endDrag = (e) => {
      if (!this.game.isDragging) return;
      this.game.isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      this.firePlayerBanana();
    };

    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
  }

  toggleSound() {
    const newState = sound.toggle();
    Storage.setSoundEnabled(newState);
    this.updateSoundBtnUI();
  }

  updateSoundBtnUI() {
    if (this.soundIcon) {
      this.soundIcon.textContent = sound.enabled ? '🔊' : '🔇';
    }
    if (this.btnToggleSound) {
      this.btnToggleSound.classList.toggle('active', sound.enabled);
    }
  }

  toggleCrt() {
    this.crtEnabled = !this.crtEnabled;
    Storage.setCrtEnabled(this.crtEnabled);
    this.updateCrtUI();
  }

  updateCrtUI() {
    if (this.crtOverlay) {
      this.crtOverlay.style.display = this.crtEnabled ? 'block' : 'none';
    }
    if (this.btnToggleCrt) {
      this.btnToggleCrt.classList.toggle('active', this.crtEnabled);
      this.btnToggleCrt.textContent = this.crtEnabled ? 'CRT: ON' : 'CRT: OFF';
    }
  }

  async handleMatchComplete(matchData) {
    const won = matchData.won;
    Storage.recordMatch(won);

    // Report to Games Vault
    try {
      const payload = {
        gameId: 'gorillas',
        score: matchData.playerWins * 100,
        level: matchData.rounds,
        status: 'complete',
        result: `${matchData.playerWins} - ${matchData.aiWins} (${won ? 'VICTORY' : 'DEFEAT'})`
      };

      await fetch('/api/games/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline fallback
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new GorillasApp();
});
