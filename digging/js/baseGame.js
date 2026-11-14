/**
 * BaseGame - standard contract for all retro arcade games.
 * New games implement this interface to plug seamlessly into the Arcade Dashboard.
 */
export class BaseGame {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.score = 0;
    this.highScore = options.highScore || 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.onScoreUpdate = options.onScoreUpdate || (() => {});
    this.onGameOverCallback = options.onGameOver || (() => {});
    this.onLivesUpdate = options.onLivesUpdate || (() => {});
    this.onLevelUpdate = options.onLevelUpdate || (() => {});
  }

  init() {
    throw new Error('init() must be implemented');
  }

  start() {
    throw new Error('start() must be implemented');
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    if (this.isPaused) this.resume();
    else this.pause();
    return this.isPaused;
  }

  reset() {
    throw new Error('reset() must be implemented');
  }

  destroy() {
    throw new Error('destroy() must be implemented');
  }
}
