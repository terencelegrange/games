/**
 * Goodies and Baddies Main Application & UI Controller
 * Binds keyboard and mobile touch controls, HUD bar, sound/CRT toggles,
 * and reports completed matches to Games Vault.
 */

import { GhostsGame } from './game.js';
import { sound } from './audio.js';
import { Storage } from './storage.js';

class GhostsApp {
  constructor() {
    this.canvas = document.getElementById('ghosts-canvas');
    this.crtOverlay = document.getElementById('crt-overlay');

    // HUD DOM Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudHighScore = document.getElementById('hud-hi-score');
    this.hudTime = document.getElementById('hud-time');
    this.hudLives = document.getElementById('hud-lives');
    this.hudArmor = document.getElementById('hud-armor');
    this.hudWeapon = document.getElementById('hud-weapon');

    // Header buttons
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnToggleCrt = document.getElementById('btn-toggle-crt');
    this.btnPause = document.getElementById('btn-pause-game');
    this.btnRestart = document.getElementById('btn-restart-game');

    // Audio & CRT initial states
    const soundPref = Storage.getSoundEnabled();
    sound.setMuted(!soundPref);
    this.updateSoundBtnUI();

    this.crtEnabled = Storage.getCrtEnabled();
    this.updateCrtUI();

    this.initGame();
    this.bindEvents();
    this.bindTouchControls();

    // Start requestAnimationFrame loop
    this.lastTime = performance.now();
    this.loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.game.update(dt);
      this.game.render();
      requestAnimationFrame(this.loop);
    };
    requestAnimationFrame(this.loop);
  }

  initGame() {
    this.game = new GhostsGame(this.canvas, {
      onHudUpdate: (data) => this.handleHudUpdate(data),
      onGameOver: (finalScore) => this.handleGameOver(finalScore),
      onStageClear: (finalScore, timeBonus) => this.handleStageClear(finalScore, timeBonus)
    });
  }

  handleHudUpdate(data) {
    if (this.hudScore) {
      this.hudScore.textContent = String(data.score).padStart(6, '0');
    }
    if (this.hudHighScore) {
      this.hudHighScore.textContent = String(Math.max(data.score, data.highScore)).padStart(6, '0');
    }
    if (this.hudTime) {
      this.hudTime.textContent = String(data.time).padStart(3, '0');
      this.hudTime.style.color = data.time < 30 ? '#ef4444' : '#60a5fa';
    }
    if (this.hudLives) {
      this.hudLives.textContent = `x${data.lives}`;
    }
    if (this.hudArmor) {
      if (data.armor === 2) {
        this.hudArmor.textContent = 'STEEL';
        this.hudArmor.className = 'hud-badge badge-steel';
      } else if (data.armor === 1) {
        this.hudArmor.textContent = 'BOXERS';
        this.hudArmor.className = 'hud-badge badge-boxers';
      } else {
        this.hudArmor.textContent = 'DEAD';
        this.hudArmor.className = 'hud-badge badge-dead';
      }
    }
    if (this.hudWeapon) {
      this.hudWeapon.textContent = `${data.weaponIcon} ${data.weaponName}`;
    }
  }

  async handleGameOver(finalScore) {
    try {
      await fetch('/api/games/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          gameId: 'goodiesandbaddies',
          score: Math.max(0, parseInt(finalScore, 10) || 0),
          level: 1,
          status: 'complete',
          result: `Defeated in Stage 1 (${finalScore} pts)`
        })
      });
    } catch {}
  }

  async handleStageClear(finalScore, timeBonus) {
    try {
      await fetch('/api/games/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          gameId: 'goodiesandbaddies',
          score: Math.max(0, parseInt(finalScore, 10) || 0),
          level: 1,
          status: 'complete',
          result: `STAGE 1 CLEARED! (${finalScore} pts, +${timeBonus} time bonus)`
        })
      });
    } catch {}
  }

  bindEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // Prevent default scrolling for game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Title or Game Over start
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.game.state === 'TITLE' || this.game.state === 'GAME_OVER' || this.game.state === 'STAGE_CLEAR') {
          this.game.startNewGame();
          return;
        }
      }

      // Pause toggle
      if (e.key === 'p' || e.key === 'P') {
        this.game.togglePause();
        return;
      }

      // Mute toggle
      if (e.key === 'm' || e.key === 'M') {
        this.toggleSound();
        return;
      }

      // Directional inputs
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.game.input.left = true;
        this.game.input.lastHorizontal = 'left';
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = false;
        }
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.game.input.right = true;
        this.game.input.lastHorizontal = 'right';
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = true;
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.game.input.up = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.game.input.down = true;
      }

      // Jump
      if (
        e.key === ' ' || e.key === 'z' || e.key === 'Z' ||
        e.key === 'k' || e.key === 'K' ||
        e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK'
      ) {
        if (!this.game.input.jump) {
          this.game.input.jump = true;
          if (this.game.state === 'PLAYING' && this.game.arthur.grounded) {
            this.game.sound.jump();
          }
        }
      }

      // Attack / Fire
      if (
        e.key === 'x' || e.key === 'X' ||
        e.key === 'f' || e.key === 'F' ||
        e.key === 'c' || e.key === 'C' ||
        e.key === 'j' || e.key === 'J' ||
        e.key === 'Control' ||
        e.code === 'KeyX' || e.code === 'KeyF' || e.code === 'KeyC' || e.code === 'KeyJ' ||
        e.code === 'ControlLeft' || e.code === 'ControlRight'
      ) {
        this.game.handleFire();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.game.input.left = false;
        if (this.game.input.right) {
          this.game.input.lastHorizontal = 'right';
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = true;
          }
        } else if (this.game.input.lastHorizontal === 'left') {
          this.game.input.lastHorizontal = null;
        }
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.game.input.right = false;
        if (this.game.input.left) {
          this.game.input.lastHorizontal = 'left';
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = false;
          }
        } else if (this.game.input.lastHorizontal === 'right') {
          this.game.input.lastHorizontal = null;
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.game.input.up = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.game.input.down = false;
      }
      if (
        e.key === ' ' || e.key === 'z' || e.key === 'Z' ||
        e.key === 'k' || e.key === 'K' ||
        e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK'
      ) {
        this.game.input.jump = false;
      }
    });

    // Canvas click to start or resume
    this.canvas.addEventListener('click', () => {
      sound.init();
      if (this.game.state === 'TITLE' || this.game.state === 'GAME_OVER' || this.game.state === 'STAGE_CLEAR') {
        this.game.startNewGame();
      }
    });

    // Header buttons
    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => this.toggleSound());
    }
    if (this.btnToggleCrt) {
      this.btnToggleCrt.addEventListener('click', () => this.toggleCrt());
    }
    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => this.game.togglePause());
    }
    if (this.btnRestart) {
      this.btnRestart.addEventListener('click', () => {
        sound.init();
        this.game.startNewGame();
      });
    }

    // Bypass rotate overlay for portrait mode
    const btnBypassRotate = document.getElementById('btn-bypass-rotate');
    if (btnBypassRotate) {
      btnBypassRotate.addEventListener('click', () => {
        document.body.classList.add('portrait-bypassed');
      });
    }
  }

  bindTouchControls() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const startHandler = (e) => {
        e.preventDefault();
        sound.init();
        onDown();
      };
      const endHandler = (e) => {
        e.preventDefault();
        onUp();
      };
      el.addEventListener('touchstart', startHandler, { passive: false });
      el.addEventListener('touchend', endHandler, { passive: false });
      el.addEventListener('mousedown', startHandler);
      el.addEventListener('mouseup', endHandler);
    };

    bindBtn('touch-btn-left', () => {
      this.game.input.left = true;
      this.game.input.lastHorizontal = 'left';
      if (this.game.arthur && this.game.arthur.grounded) {
        this.game.arthur.facingRight = false;
      }
    }, () => {
      this.game.input.left = false;
      if (this.game.input.right) {
        this.game.input.lastHorizontal = 'right';
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = true;
        }
      } else if (this.game.input.lastHorizontal === 'left') {
        this.game.input.lastHorizontal = null;
      }
    });

    bindBtn('touch-btn-right', () => {
      this.game.input.right = true;
      this.game.input.lastHorizontal = 'right';
      if (this.game.arthur && this.game.arthur.grounded) {
        this.game.arthur.facingRight = true;
      }
    }, () => {
      this.game.input.right = false;
      if (this.game.input.left) {
        this.game.input.lastHorizontal = 'left';
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = false;
        }
      } else if (this.game.input.lastHorizontal === 'right') {
        this.game.input.lastHorizontal = null;
      }
    });
    bindBtn('touch-btn-up', () => { this.game.input.up = true; }, () => { this.game.input.up = false; });
    bindBtn('touch-btn-down', () => { this.game.input.down = true; }, () => { this.game.input.down = false; });

    bindBtn('touch-btn-jump', () => {
      if (this.game.state === 'TITLE' || this.game.state === 'GAME_OVER' || this.game.state === 'STAGE_CLEAR') {
        this.game.startNewGame();
        return;
      }
      this.game.input.jump = true;
      if (this.game.state === 'PLAYING' && this.game.arthur.grounded) {
        this.game.sound.jump();
      }
    }, () => {
      this.game.input.jump = false;
    });

    bindBtn('touch-btn-fire', () => {
      if (this.game.state === 'TITLE' || this.game.state === 'GAME_OVER' || this.game.state === 'STAGE_CLEAR') {
        this.game.startNewGame();
        return;
      }
      this.game.handleFire();
    }, () => {});
  }

  toggleSound() {
    const newState = sound.toggle();
    Storage.setSoundEnabled(newState);
    this.updateSoundBtnUI();
  }

  updateSoundBtnUI() {
    if (this.soundIcon) {
      this.soundIcon.textContent = !sound.muted ? '🔊' : '🔇';
    }
    if (this.btnToggleSound) {
      this.btnToggleSound.classList.toggle('active', !sound.muted);
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
}

// Bootstrap reliably when DOM ready or already loaded
function boot() {
  new GhostsApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
