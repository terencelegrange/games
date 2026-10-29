/**
 * Pure Client Retro Arcade Dashboard
 * Handles category filtering, CRT simulation, and local storage high scores.
 */
const STORAGE_PREFIX = 'retro_arcade_';

function getHighScore(gameId) {
  try {
    const score = localStorage.getItem(`${STORAGE_PREFIX}${gameId}_hiscore`);
    return score ? parseInt(score, 10) : 0;
  } catch {
    return 0;
  }
}

function updateHighScores() {
  const games = [
    { id: 'mazearcade', legacyId: 'pacman', pad: 4 },
    { id: 'digging', legacyId: 'digger', pad: 4 },
    { id: 'blockz', legacyId: 'tetris', pad: 4 },
    { id: 'safarirun', legacyId: 'cheetah', pad: 5 },
    { id: 'fastcar', legacyId: 'fastcar', pad: 6 },
    { id: 'sharpshooter', legacyId: 'sharpshooter', pad: 4 },
    { id: 'spacedestroyer', legacyId: 'spacedestroyer', pad: 5 },
    { id: 'spacedestroyer2', legacyId: 'spacedestroyer2', pad: 5 },
    { id: 'galacticshooter', legacyId: 'galacticshooter', pad: 6 },
    { id: 'gorillas', legacyId: 'gorilla', pad: 2 },
    { id: 'goodiesandbaddies', legacyId: 'goodies', pad: 5 },
    { id: 'monkeyjump', legacyId: 'monkeyjump', pad: 5 },
    { id: 'shongololo', legacyId: 'shongololo', pad: 4 },
    { id: 'biplaneflyer', legacyId: 'biplaneflyer', pad: 6 },
    { id: 'bigjump', legacyId: 'bigjump', pad: 6 },
    { id: 'bottomer', legacyId: 'bottomer', pad: 6 },
    { id: 'binchicken', legacyId: 'binchicken', pad: 4 },
    { id: 'arkanoid', legacyId: 'arkanoid', pad: 6 },
    { id: 'meteorstrike', legacyId: 'meteorstrike', pad: 6 }
  ];
  games.forEach(({ id, legacyId, pad }) => {
    const el = document.getElementById(`hi-${id}`);
    if (el) {
      const score = getHighScore(id) || getHighScore(legacyId);
      el.textContent = score.toString().padStart(pad, '0');
    }
  });
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const tiles = document.querySelectorAll('.game-tile');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      tiles.forEach(tile => {
        if (filter === 'all' || tile.dataset.category === filter) {
          tile.style.display = 'flex';
        } else {
          tile.style.display = 'none';
        }
      });
    });
  });
}

function setupCRTFilter() {
  const crtOverlay = document.getElementById('crt-overlay');
  const btnToggleCrt = document.getElementById('btn-toggle-crt');

  let crtEnabled = true;
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}opt_crt_enabled`);
    if (saved !== null) crtEnabled = JSON.parse(saved);
  } catch {}

  function applyCrt() {
    crtOverlay.classList.toggle('disabled', !crtEnabled);
    btnToggleCrt.classList.toggle('active', crtEnabled);
  }

  applyCrt();

  btnToggleCrt.addEventListener('click', () => {
    crtEnabled = !crtEnabled;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}opt_crt_enabled`, JSON.stringify(crtEnabled));
    } catch {}
    applyCrt();
  });
}

function setupKeyboardNavigation() {
  const keyMap = {
    'm': './meteorstrike/index.html',
    'k': './arkanoid/index.html',
    'c': './binchicken/index.html',
    'b': './bottomer/index.html',
    'j': './bigjump/index.html',
    'p': './biplaneflyer/index.html',
    'h': './shongololo/index.html',
    'o': './monkeyjump/index.html',
    'l': './galacticshooter/index.html',
    'g': './goodiesandbaddies/index.html',
    'r': './gorillas/index.html',
    '2': './spacedestroyer2/index.html',
    'v': './spacedestroyer/index.html',
    'u': './sharpshooter/index.html',
    'f': './fastcar/index.html',
    's': './safarirun/index.html',
    'z': './blockz/index.html',
    'd': './digging/index.html',
    'a': './mazearcade/index.html',
    't': './tankwars/index.html'
  };

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const targetUrl = keyMap[e.key.toLowerCase()];
    if (targetUrl) window.location.href = targetUrl;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupFilterTabs();
  setupCRTFilter();
  updateHighScores();
  setupKeyboardNavigation();
});
