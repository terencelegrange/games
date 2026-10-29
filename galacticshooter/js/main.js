/**
 * Galactic Shooter - Main Browser Controller
 */

import { GalacticShooterGame } from './game.js';
import { audio } from './audio.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const game = new GalacticShooterGame(canvas);

  // UI Elements
  const hudScore = document.getElementById('hud-score');
  const hudHighScore = document.getElementById('hud-high-score');
  const hudLives = document.getElementById('hud-lives');
  const hudStage = document.getElementById('hud-stage');

  const overlayTitle = document.getElementById('overlay-title');
  const overlayStats = document.getElementById('overlay-stats');
  const overlayBtn = document.getElementById('overlay-btn');
  const uiOverlay = document.getElementById('ui-overlay');
  const muteBtn = document.getElementById('btn-mute');

  // Input Listeners
  window.addEventListener('keydown', (e) => {
    audio.init();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      game.keys.left = true;
      e.preventDefault();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      game.keys.right = true;
      e.preventDefault();
    } else if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyJ') {
      game.keys.fire = true;
      e.preventDefault();
    } else if (e.code === 'KeyP') {
      game.isPaused = !game.isPaused;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      game.keys.left = false;
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      game.keys.right = false;
    } else if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyJ') {
      game.keys.fire = false;
    }
  });

  // Touch Virtual Controls
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');

  const setupTouch = (elem, pressFn, releaseFn) => {
    if (!elem) return;
    elem.addEventListener('pointerdown', (e) => {
      audio.init();
      e.preventDefault();
      elem.classList.add('active');
      pressFn();
    });
    const end = (e) => {
      e.preventDefault();
      elem.classList.remove('active');
      releaseFn();
    };
    elem.addEventListener('pointerup', end);
    elem.addEventListener('pointercancel', end);
    elem.addEventListener('pointerleave', end);
  };

  setupTouch(btnLeft, () => { game.keys.left = true; }, () => { game.keys.left = false; });
  setupTouch(btnRight, () => { game.keys.right = true; }, () => { game.keys.right = false; });
  setupTouch(btnFire, () => { game.keys.fire = true; }, () => { game.keys.fire = false; });

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 UNMUTE' : '🔊 SOUND';
    });
  }

  overlayBtn.addEventListener('click', () => {
    audio.init();
    uiOverlay.classList.add('hidden');
    game.startNewGame();
  });

  // Main Loop
  let lastTime = performance.now();
  function gameLoop(now) {
    requestAnimationFrame(gameLoop);

    game.update();
    game.render();

    // Update HUD
    if (hudScore) hudScore.textContent = game.score.toString().padStart(6, '0');
    if (hudHighScore) hudHighScore.textContent = game.highScore.toString().padStart(6, '0');
    if (hudStage) hudStage.textContent = `STAGE ${game.stage}`;

    if (hudLives) {
      const lifeIcons = [];
      for (let i = 0; i < Math.max(0, game.lives); i++) {
        lifeIcons.push('🚀');
      }
      if (game.fighter.isDual) {
        lifeIcons.push('✨[DUAL]');
      }
      hudLives.innerHTML = lifeIcons.join(' ');
    }

    // Show Game Over Overlay
    if (game.state === 'GAME_OVER' && uiOverlay.classList.contains('hidden')) {
      overlayTitle.textContent = 'MISSION FAILED';
      overlayTitle.classList.remove('win');
      const acc = game.shotsFired > 0 ? Math.round((game.hits / game.shotsFired) * 100) : 0;
      overlayStats.innerHTML = `
        FINAL SCORE: <span>${game.score}</span><br>
        SECTOR REACHED: <span>STAGE ${game.stage}</span><br>
        ACCURACY: <span>${acc}%</span> (${game.hits}/${game.shotsFired})
      `;
      overlayBtn.textContent = 'PLAY AGAIN ➜';
      uiOverlay.classList.remove('hidden');
    }
  }

  requestAnimationFrame(gameLoop);
});
