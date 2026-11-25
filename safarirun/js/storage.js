/**
 * LocalStorage wrapper for High Scores, Settings, and Account Record Sync
 */
const STORAGE_PREFIX = 'retro_arcade_';

export const storage = {
  getHighScore(gameId = 'safarirun') {
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  setHighScore(gameId = 'safarirun', score) {
    try {
      const current = this.getHighScore(gameId);
      if (score > current) {
        localStorage.setItem(`${STORAGE_PREFIX}high_${gameId}`, score.toString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  getSetting(key, defaultValue) {
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}opt_${key}`);
      return val !== null ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setSetting(key, value) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}opt_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
};

export async function recordGameActivity(data) {
  try {
    await fetch('/api/games/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });
  } catch (_) {
    // Offline or guest mode continues smoothly
  }
}
