/**
 * Gorillas LocalStorage & Stats Persistence
 */

const STORAGE_KEYS = {
  SOUND: 'gorillas_sound_enabled',
  CRT: 'gorillas_crt_enabled',
  STATS: 'gorillas_match_stats'
};

export class Storage {
  static getSoundEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SOUND);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  static setSoundEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
    } catch {
      // ignore
    }
  }

  static getCrtEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.CRT);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  static setCrtEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.CRT, String(enabled));
    } catch {
      // ignore
    }
  }

  static getStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      return raw ? JSON.parse(raw) : { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
    } catch {
      return { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
    }
  }

  static recordMatch(playerWon) {
    try {
      const stats = this.getStats();
      stats.matchesPlayed++;
      if (playerWon) stats.playerWins++;
      else stats.aiWins++;
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      return stats;
    } catch {
      return { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
    }
  }
}
