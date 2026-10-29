/**
 * Local storage manager for Goodies and Baddies
 */

const STORAGE_KEY_SOUND = 'ghosts_sound_enabled';
const STORAGE_KEY_CRT = 'ghosts_crt_enabled';
const STORAGE_KEY_HISCORE = 'ghosts_hi_score';

export class Storage {
  static getSoundEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_SOUND);
      return val !== null ? val === 'true' : true; // Default ON
    } catch {
      return true;
    }
  }

  static setSoundEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
    } catch {}
  }

  static getCrtEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_CRT);
      return val !== null ? val === 'true' : true; // Default CRT ON
    } catch {
      return true;
    }
  }

  static setCrtEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY_CRT, String(enabled));
    } catch {}
  }

  static getHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_HISCORE);
      return val ? parseInt(val, 10) : 5000;
    } catch {
      return 5000;
    }
  }

  static setHighScore(score) {
    try {
      localStorage.setItem(STORAGE_KEY_HISCORE, String(score));
    } catch {}
  }
}
