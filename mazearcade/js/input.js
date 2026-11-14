/**
 * Unified Keyboard & Touch Input Controller
 */
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.actionCallbacks = new Map();
    this.direction = null;
    this.queuedDirection = null;
    this.enabled = false;

    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onKeyUp = this.handleKeyUp.bind(this);
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);
  }

  attach(targetElement = window) {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    if (targetElement) {
      targetElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
      targetElement.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }
  }

  detach(targetElement = window) {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (targetElement) {
      targetElement.removeEventListener('touchstart', this.onTouchStart);
      targetElement.removeEventListener('touchend', this.onTouchEnd);
    }
    this.keys.clear();
    this.direction = null;
    this.queuedDirection = null;
  }

  onAction(action, callback) {
    if (!this.actionCallbacks.has(action)) {
      this.actionCallbacks.set(action, []);
    }
    this.actionCallbacks.get(action).push(callback);
  }

  triggerAction(action) {
    const list = this.actionCallbacks.get(action);
    if (list) {
      list.forEach(cb => cb());
    }
  }

  handleKeyDown(e) {
    const code = e.code;
    this.keys.add(code);

    // Prevent default scroll on arrow keys and space when active
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    let newDir = null;
    if (code === 'ArrowUp' || code === 'KeyW') newDir = 'UP';
    else if (code === 'ArrowDown' || code === 'KeyS') newDir = 'DOWN';
    else if (code === 'ArrowLeft' || code === 'KeyA') newDir = 'LEFT';
    else if (code === 'ArrowRight' || code === 'KeyD') newDir = 'RIGHT';

    if (newDir) {
      this.queuedDirection = newDir;
      this.triggerAction(`DIR_${newDir}`);
    }

    if (code === 'Space') {
      this.triggerAction('PAUSE');
    } else if (code === 'Escape') {
      this.triggerAction('BACK');
    }
  }

  handleKeyUp(e) {
    this.keys.delete(e.code);
  }

  setDirection(dir) {
    this.queuedDirection = dir;
    this.triggerAction(`DIR_${dir}`);
  }

  getQueuedDirection() {
    return this.queuedDirection;
  }

  consumeDirection() {
    const dir = this.queuedDirection;
    this.direction = dir;
    return dir;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  handleTouchEnd(e) {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 25) {
        if (absX > absY) {
          this.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          this.setDirection(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    }
  }
}
