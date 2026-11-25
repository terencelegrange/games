/**
 * Monkey Jump - Storage & Games Vault API Integration
 */

const STORAGE_KEY = 'retro_arcade_monkeyjump_hiscore';
const GAME_ID = 'monkeyjump';

export function getLocalHighScore() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch (_) {
    return 0;
  }
}

export function saveLocalHighScore(score) {
  try {
    const current = getLocalHighScore();
    if (score > current) {
      localStorage.setItem(STORAGE_KEY, score.toString());
      return score;
    }
    return current;
  } catch (_) {
    return score;
  }
}

export async function submitMatchRecord({ score, level, result = 'GAME OVER' }) {
  try {
    await fetch('/api/games/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        gameId: GAME_ID,
        score: Math.max(0, parseInt(score, 10) || 0),
        level: Math.max(1, Math.min(255, parseInt(level, 10) || 1)),
        status: 'complete',
        result
      })
    });
  } catch (_) {}
}
