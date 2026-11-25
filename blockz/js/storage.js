/**
 * LocalStorage wrapper for High Scores and Game Settings
 */
const STORAGE_PREFIX = 'retro_arcade_';

export const storage = {
  getHighScore(gameId) {
    try {
      const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  setHighScore(gameId, score) {
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
