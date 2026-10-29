/**
 * Storage and High Score Management for Bottomer (Tapper Tribute)
 */

const STORAGE_KEY = 'retro_arcade_bottomer_hiscore';
const GAME_ID = 'bottomer';

export function getLocalHighScore() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveLocalHighScore(score) {
  try {
    const current = getLocalHighScore();
    if (score > current) {
      localStorage.setItem(STORAGE_KEY, score.toString());
      localStorage.setItem(`retro_arcade_high_${GAME_ID}`, score.toString());
    }
  } catch {}
}

export async function submitMatchRecord({ score, level = 1, result = 'GAME_OVER' }) {
  saveLocalHighScore(score);
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
        result: String(result).slice(0, 32)
      })
    });
  } catch {}
}
