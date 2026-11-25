(() => {
  // blockz/js/baseGame.js
  var BaseGame = class {
    constructor(containerElement, options = {}) {
      this.container = containerElement;
      this.options = options;
      this.score = 0;
      this.highScore = options.highScore || 0;
      this.isPaused = false;
      this.isGameOver = false;
      this.onScoreUpdate = options.onScoreUpdate || (() => {
      });
      this.onGameOverCallback = options.onGameOver || (() => {
      });
      this.onLivesUpdate = options.onLivesUpdate || (() => {
      });
      this.onLevelUpdate = options.onLevelUpdate || (() => {
      });
    }
    init() {
      throw new Error("init() must be implemented");
    }
    start() {
      throw new Error("start() must be implemented");
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
      throw new Error("reset() must be implemented");
    }
    destroy() {
      throw new Error("destroy() must be implemented");
    }
  };

  // blockz/js/board.js
  var COLS = 10;
  var ROWS = 20;
  var TetrisBoard = class {
    constructor() {
      this.reset();
    }
    reset() {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      this.clearingLines = [];
    }
    collides(piece, offsetX = 0, offsetY = 0, customShape = piece.shape) {
      const shape = customShape;
      const px = piece.x + offsetX;
      const py = piece.y + offsetY;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const boardX = px + c;
            const boardY = py + r;
            if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
              return true;
            }
            if (boardY >= 0 && this.grid[boardY][boardX] !== 0) {
              return true;
            }
          }
        }
      }
      return false;
    }
    lock(piece) {
      let toppedOut = false;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const boardX = piece.x + c;
            const boardY = piece.y + r;
            if (boardY < 0) {
              toppedOut = true;
            } else if (boardY < ROWS && boardX >= 0 && boardX < COLS) {
              this.grid[boardY][boardX] = piece.color;
            }
          }
        }
      }
      return toppedOut;
    }
    getGhostY(piece) {
      let ghostY = piece.y;
      while (!this.collides(piece, 0, ghostY - piece.y + 1)) {
        ghostY++;
      }
      return ghostY;
    }
    findFullLines() {
      const full = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.grid[r].every((cell) => cell !== 0)) {
          full.push(r);
        }
      }
      return full;
    }
    clearLines(lineIndices) {
      if (lineIndices.length === 0) return;
      this.grid = this.grid.filter((_, idx) => !lineIndices.includes(idx));
      while (this.grid.length < ROWS) {
        this.grid.unshift(Array(COLS).fill(0));
      }
    }
  };

  // blockz/js/tetromino.js
  var TETROMINOES = {
    I: {
      name: "I",
      color: "#00ffff",
      glowColor: "rgba(0, 255, 255, 0.6)",
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    },
    O: {
      name: "O",
      color: "#ffff00",
      glowColor: "rgba(255, 255, 0, 0.6)",
      shape: [
        [1, 1],
        [1, 1]
      ]
    },
    T: {
      name: "T",
      color: "#b026ff",
      glowColor: "rgba(176, 38, 255, 0.6)",
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    S: {
      name: "S",
      color: "#00ff66",
      glowColor: "rgba(0, 255, 102, 0.6)",
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ]
    },
    Z: {
      name: "Z",
      color: "#ff2255",
      glowColor: "rgba(255, 34, 85, 0.6)",
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ]
    },
    J: {
      name: "J",
      color: "#0088ff",
      glowColor: "rgba(0, 136, 255, 0.6)",
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
      ]
    },
    L: {
      name: "L",
      color: "#ff9900",
      glowColor: "rgba(255, 153, 0, 0.6)",
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
      ]
    }
  };
  function rotateMatrix(matrix, clockwise = true) {
    const n = matrix.length;
    const result = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (clockwise) {
          result[c][n - 1 - r] = matrix[r][c];
        } else {
          result[n - 1 - c][r] = matrix[r][c];
        }
      }
    }
    return result;
  }
  var Randomizer = class {
    constructor() {
      this.bag = [];
    }
    next() {
      if (this.bag.length === 0) {
        this.bag = ["I", "O", "T", "S", "Z", "J", "L"];
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      const type = this.bag.pop();
      const proto = TETROMINOES[type];
      return {
        type: proto.name,
        color: proto.color,
        glowColor: proto.glowColor,
        shape: proto.shape.map((row) => [...row]),
        x: Math.floor((10 - proto.shape[0].length) / 2),
        y: proto.name === "I" ? -1 : 0
      };
    }
  };

  // blockz/js/audio.js
  var TetrisAudio = class {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.muted = false;
      this.bgmTimer = null;
      this.isPlayingBgm = false;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.12;
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    setMuted(muted) {
      this.muted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx.currentTime);
      }
      if (muted) {
        this.stopBGM();
      }
    }
    // "Korobeiniki" (Tetris Type A Theme)
    playThemeBGM() {
      if (this.muted || this.isPlayingBgm) return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      this.isPlayingBgm = true;
      const E5 = 659.25, B4 = 493.88, C5 = 523.25, D5 = 587.33;
      const A4 = 440, Gs4 = 415.3, E4 = 329.63, F5 = 698.46;
      const melody = [
        { f: E5, d: 2 },
        { f: B4, d: 1 },
        { f: C5, d: 1 },
        { f: D5, d: 2 },
        { f: C5, d: 1 },
        { f: B4, d: 1 },
        { f: A4, d: 2 },
        { f: A4, d: 1 },
        { f: C5, d: 1 },
        { f: E5, d: 2 },
        { f: D5, d: 1 },
        { f: C5, d: 1 },
        { f: B4, d: 3 },
        { f: C5, d: 1 },
        { f: D5, d: 2 },
        { f: E5, d: 2 },
        { f: C5, d: 2 },
        { f: A4, d: 2 },
        { f: A4, d: 2 },
        { f: 0, d: 2 },
        { f: D5, d: 3 },
        { f: F5, d: 1 },
        { f: A4, d: 2 },
        { f: Gs4, d: 1 },
        { f: F5, d: 1 },
        { f: E5, d: 3 },
        { f: C5, d: 1 },
        { f: E5, d: 2 },
        { f: D5, d: 1 },
        { f: C5, d: 1 },
        { f: B4, d: 2 },
        { f: B4, d: 1 },
        { f: C5, d: 1 },
        { f: D5, d: 2 },
        { f: E5, d: 2 },
        { f: C5, d: 2 },
        { f: A4, d: 2 },
        { f: A4, d: 2 },
        { f: 0, d: 2 }
      ];
      let noteIndex = 0;
      const beatMs = 140;
      const scheduleNext = () => {
        if (!this.isPlayingBgm || this.muted) return;
        const note = melody[noteIndex];
        noteIndex = (noteIndex + 1) % melody.length;
        if (note.f > 0) {
          this.playSquareTone(note.f, note.d * beatMs * 0.85 / 1e3, 0.16);
        }
        this.bgmTimer = setTimeout(scheduleNext, note.d * beatMs);
      };
      scheduleNext();
    }
    stopBGM() {
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
      this.isPlayingBgm = false;
    }
    playSquareTone(freq, duration, vol = 0.15) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration);
    }
    playMove() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.playSquareTone(330, 0.03, 0.08);
    }
    playRotate() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.playSquareTone(580, 0.05, 0.1);
    }
    playDrop() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.playSquareTone(180, 0.08, 0.2);
    }
    playLineClear() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(0.2, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(1e-3, t + i * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * 0.06);
        osc.stop(t + i * 0.06 + 0.12);
      });
    }
    playTetris() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t + i * 0.08);
        gain.gain.setValueAtTime(0.25, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(1e-3, t + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.25);
      });
    }
    playGameOver() {
      if (this.muted) return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.6);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.6);
    }
    destroy() {
      this.stopBGM();
      if (this.ctx) {
        try {
          this.ctx.close();
        } catch {
        }
        this.ctx = null;
      }
    }
  };

  // blockz/js/renderer.js
  var BLOCK_SIZE = 22;
  var TetrisRenderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.wellX = 110;
      this.wellY = 20;
      this.wellW = COLS * BLOCK_SIZE;
      this.wellH = ROWS * BLOCK_SIZE;
      this.width = 440;
      this.height = 480;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx.imageSmoothingEnabled = false;
    }
    clear() {
      this.ctx.fillStyle = "#0a0a14";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawPlayfield(board, lineClearTimer, clearingLines) {
      const ctx = this.ctx;
      ctx.fillStyle = "#05050d";
      ctx.fillRect(this.wellX, this.wellY, this.wellW, this.wellH);
      ctx.strokeStyle = "#181830";
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(this.wellX + c * BLOCK_SIZE, this.wellY);
        ctx.lineTo(this.wellX + c * BLOCK_SIZE, this.wellY + this.wellH);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(this.wellX, this.wellY + r * BLOCK_SIZE);
        ctx.lineTo(this.wellX + this.wellW, this.wellY + r * BLOCK_SIZE);
        ctx.stroke();
      }
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(this.wellX - 1, this.wellY - 1, this.wellW + 2, this.wellH + 2);
      for (let r = 0; r < ROWS; r++) {
        const isClearing = clearingLines && clearingLines.includes(r);
        for (let c = 0; c < COLS; c++) {
          const color = board.grid[r][c];
          if (color !== 0) {
            const bx = this.wellX + c * BLOCK_SIZE;
            const by = this.wellY + r * BLOCK_SIZE;
            if (isClearing && lineClearTimer % 4 < 2) {
              this.drawBlock(bx, by, "#ffffff");
            } else {
              this.drawBlock(bx, by, color);
            }
          }
        }
      }
    }
    drawBlock(x, y, color, alpha = 1) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 1);
      ctx.lineTo(x + BLOCK_SIZE - 1, y + 1);
      ctx.lineTo(x + BLOCK_SIZE - 4, y + 4);
      ctx.lineTo(x + 4, y + 4);
      ctx.lineTo(x + 4, y + BLOCK_SIZE - 4);
      ctx.lineTo(x + 1, y + BLOCK_SIZE - 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.moveTo(x + BLOCK_SIZE - 1, y + 1);
      ctx.lineTo(x + BLOCK_SIZE - 1, y + BLOCK_SIZE - 1);
      ctx.lineTo(x + 1, y + BLOCK_SIZE - 1);
      ctx.lineTo(x + 4, y + BLOCK_SIZE - 4);
      ctx.lineTo(x + BLOCK_SIZE - 4, y + BLOCK_SIZE - 4);
      ctx.lineTo(x + BLOCK_SIZE - 4, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    drawGhostPiece(piece, ghostY) {
      if (!piece) return;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const gx = this.wellX + (piece.x + c) * BLOCK_SIZE;
            const gy = this.wellY + (ghostY + r) * BLOCK_SIZE;
            if (gy >= this.wellY) {
              this.drawGhostBlock(gx, gy, piece.color);
            }
          }
        }
      }
    }
    drawGhostBlock(x, y, color) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
      ctx.strokeRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
      ctx.restore();
    }
    drawActivePiece(piece) {
      if (!piece) return;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const bx = this.wellX + (piece.x + c) * BLOCK_SIZE;
            const by = this.wellY + (piece.y + r) * BLOCK_SIZE;
            if (by >= this.wellY) {
              this.drawBlock(bx, by, piece.color);
            }
          }
        }
      }
    }
    drawSidePanels(holdPiece, nextPiece, score, lines, level) {
      const ctx = this.ctx;
      ctx.save();
      this.drawMiniBox(15, 20, 80, 80, "HOLD", holdPiece);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#ff007f";
      ctx.fillText("LINES", 15, 140);
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(lines.toString(), 15, 160);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#00ff66";
      ctx.fillText("LEVEL", 15, 195);
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(level.toString(), 15, 215);
      this.drawMiniBox(345, 20, 80, 80, "NEXT", nextPiece);
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#ffff00";
      ctx.fillText("SCORE", 345, 140);
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(score.toString(), 345, 160);
      ctx.restore();
    }
    drawMiniBox(x, y, w, h, title, piece) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#00ffff";
      ctx.fillText(title, x, y - 6);
      ctx.fillStyle = "#111122";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#2c2c4d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      if (piece) {
        const miniSize = 14;
        const pw = piece.shape[0].length * miniSize;
        const ph = piece.shape.length * miniSize;
        const offsetX = x + (w - pw) / 2;
        const offsetY = y + (h - ph) / 2;
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c]) {
              const bx = offsetX + c * miniSize;
              const by = offsetY + r * miniSize;
              ctx.fillStyle = piece.color;
              ctx.fillRect(bx + 1, by + 1, miniSize - 2, miniSize - 2);
            }
          }
        }
      }
      ctx.restore();
    }
    drawOverlay(text, subtext = "", color = "#ffff00") {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = '18px "Press Start 2P", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(text, this.width / 2, this.height / 2 - 10);
      if (subtext) {
        ctx.shadowBlur = 0;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(subtext, this.width / 2, this.height / 2 + 25);
      }
      ctx.restore();
    }
  };

  // blockz/js/input.js
  var InputManager = class {
    constructor() {
      this.keys = /* @__PURE__ */ new Set();
      this.actionCallbacks = /* @__PURE__ */ new Map();
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
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      if (targetElement) {
        targetElement.addEventListener("touchstart", this.onTouchStart, { passive: false });
        targetElement.addEventListener("touchend", this.onTouchEnd, { passive: false });
      }
    }
    detach(targetElement = window) {
      if (!this.enabled) return;
      this.enabled = false;
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("keyup", this.onKeyUp);
      if (targetElement) {
        targetElement.removeEventListener("touchstart", this.onTouchStart);
        targetElement.removeEventListener("touchend", this.onTouchEnd);
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
        list.forEach((cb) => cb());
      }
    }
    handleKeyDown(e) {
      const code = e.code;
      this.keys.add(code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
        e.preventDefault();
      }
      let newDir = null;
      if (code === "ArrowUp" || code === "KeyW") newDir = "UP";
      else if (code === "ArrowDown" || code === "KeyS") newDir = "DOWN";
      else if (code === "ArrowLeft" || code === "KeyA") newDir = "LEFT";
      else if (code === "ArrowRight" || code === "KeyD") newDir = "RIGHT";
      if (newDir) {
        this.queuedDirection = newDir;
        this.triggerAction(`DIR_${newDir}`);
      }
      if (code === "Space") {
        this.triggerAction("PAUSE");
      } else if (code === "Escape") {
        this.triggerAction("BACK");
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
            this.setDirection(dx > 0 ? "RIGHT" : "LEFT");
          } else {
            this.setDirection(dy > 0 ? "DOWN" : "UP");
          }
        }
      }
    }
  };

  // blockz/js/index.js
  var TetrisGame = class extends BaseGame {
    constructor(containerElement, options = {}) {
      super(containerElement, options);
      this.level = 1;
      this.score = 0;
      this.lines = 0;
      this.gameState = "PLAYING";
      this.dropCounter = 0;
      this.lockTimer = 0;
      this.lockDelayMax = 30;
      this.holdPiece = null;
      this.canHold = true;
      this.clearingLines = [];
      this.clearAnimationTimer = 0;
      this.canvas = document.createElement("canvas");
      this.container.appendChild(this.canvas);
      this.renderer = new TetrisRenderer(this.canvas);
      this.audio = new TetrisAudio();
      if (options.muted) {
        this.audio.setMuted(true);
      }
      this.input = new InputManager();
      this.input.attach(this.container);
      this.rafId = null;
      this.lastTime = 0;
      this.init();
    }
    init() {
      this.board = new TetrisBoard();
      this.randomizer = new Randomizer();
      this.currentPiece = this.randomizer.next();
      this.nextPiece = this.randomizer.next();
      this.holdPiece = null;
      this.canHold = true;
      this.bindInputs();
      this.audio.playThemeBGM();
    }
    bindInputs() {
      this.input.onAction("DIR_LEFT", () => this.movePiece(-1));
      this.input.onAction("DIR_RIGHT", () => this.movePiece(1));
      this.input.onAction("DIR_DOWN", () => this.softDrop());
      this.input.onAction("DIR_UP", () => this.rotatePiece(true));
    }
    // Called when Fire button / Space / Action is triggered
    onActionTrigger() {
      if (this.gameState === "PLAYING") {
        this.hardDrop();
      }
    }
    // Hold action (C key or hold button)
    onHoldTrigger() {
      if (this.gameState !== "PLAYING" || !this.canHold) return;
      this.audio.playRotate();
      if (!this.holdPiece) {
        this.holdPiece = {
          type: this.currentPiece.type,
          color: this.currentPiece.color,
          shape: this.currentPiece.shape
        };
        this.spawnNextPiece();
      } else {
        const temp = {
          type: this.currentPiece.type,
          color: this.currentPiece.color,
          shape: this.currentPiece.shape
        };
        const proto = this.holdPiece;
        this.currentPiece = {
          type: proto.type,
          color: proto.color,
          shape: proto.shape.map((r) => [...r]),
          x: Math.floor((10 - proto.shape[0].length) / 2),
          y: proto.type === "I" ? -1 : 0
        };
        this.holdPiece = temp;
      }
      this.canHold = false;
    }
    start() {
      this.isPaused = false;
      this.loop = this.gameLoop.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }
    setMuted(muted) {
      this.audio.setMuted(muted);
    }
    getDropInterval() {
      return Math.max(3, Math.floor(48 - (this.level - 1) * 4));
    }
    gameLoop(currentTime) {
      if (!this.lastTime) this.lastTime = currentTime;
      this.lastTime = currentTime;
      if (!this.isPaused) {
        this.update();
      }
      this.render();
      this.rafId = requestAnimationFrame(this.loop);
    }
    update() {
      if (this.gameState === "CLEARING") {
        this.clearAnimationTimer--;
        if (this.clearAnimationTimer <= 0) {
          this.board.clearLines(this.clearingLines);
          this.clearingLines = [];
          this.gameState = "PLAYING";
          this.spawnNextPiece();
        }
        return;
      }
      if (this.gameState !== "PLAYING") return;
      this.dropCounter++;
      const interval = this.getDropInterval();
      const isTouchingFloor = this.board.collides(this.currentPiece, 0, 1);
      if (isTouchingFloor) {
        this.lockTimer++;
        if (this.lockTimer >= this.lockDelayMax) {
          this.lockCurrentPiece();
        }
      } else {
        this.lockTimer = 0;
        if (this.dropCounter >= interval) {
          this.dropCounter = 0;
          this.currentPiece.y++;
        }
      }
    }
    movePiece(dx) {
      if (this.gameState !== "PLAYING") return;
      if (!this.board.collides(this.currentPiece, dx, 0)) {
        this.currentPiece.x += dx;
        this.audio.playMove();
        if (this.board.collides(this.currentPiece, 0, 1)) {
          this.lockTimer = 0;
        }
      }
    }
    rotatePiece(clockwise = true) {
      if (this.gameState !== "PLAYING") return;
      const rotated = rotateMatrix(this.currentPiece.shape, clockwise);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!this.board.collides(this.currentPiece, kick, 0, rotated)) {
          this.currentPiece.x += kick;
          this.currentPiece.shape = rotated;
          this.audio.playRotate();
          if (this.board.collides(this.currentPiece, 0, 1)) {
            this.lockTimer = 0;
          }
          return;
        }
      }
    }
    softDrop() {
      if (this.gameState !== "PLAYING") return;
      if (!this.board.collides(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
        this.addScore(1);
        this.dropCounter = 0;
      }
    }
    hardDrop() {
      if (this.gameState !== "PLAYING") return;
      const ghostY = this.board.getGhostY(this.currentPiece);
      const dropDistance = ghostY - this.currentPiece.y;
      this.currentPiece.y = ghostY;
      this.addScore(dropDistance * 2);
      this.audio.playDrop();
      this.lockCurrentPiece();
    }
    lockCurrentPiece() {
      const toppedOut = this.board.lock(this.currentPiece);
      this.audio.playDrop();
      if (toppedOut) {
        this.triggerGameOver();
        return;
      }
      const fullLines = this.board.findFullLines();
      if (fullLines.length > 0) {
        this.clearingLines = fullLines;
        this.gameState = "CLEARING";
        this.clearAnimationTimer = 14;
        const count = fullLines.length;
        this.lines += count;
        const scoreTable = [0, 100, 300, 500, 800];
        const pts = (scoreTable[count] || 800) * this.level;
        this.addScore(pts);
        if (count === 4) {
          this.audio.playTetris();
        } else {
          this.audio.playLineClear();
        }
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel !== this.level) {
          this.level = newLevel;
          this.onLevelUpdate(this.level);
        }
      } else {
        this.spawnNextPiece();
      }
    }
    spawnNextPiece() {
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.randomizer.next();
      this.canHold = true;
      this.dropCounter = 0;
      this.lockTimer = 0;
      if (this.board.collides(this.currentPiece, 0, 0)) {
        this.triggerGameOver();
      }
    }
    triggerGameOver() {
      this.gameState = "GAME_OVER";
      this.audio.playGameOver();
      this.onGameOverCallback(this.score);
    }
    addScore(pts) {
      this.score += pts;
      this.onScoreUpdate(this.score);
    }
    render() {
      this.renderer.clear();
      this.renderer.drawPlayfield(this.board, this.clearAnimationTimer, this.clearingLines);
      if (this.gameState === "PLAYING") {
        const ghostY = this.board.getGhostY(this.currentPiece);
        this.renderer.drawGhostPiece(this.currentPiece, ghostY);
        this.renderer.drawActivePiece(this.currentPiece);
      }
      this.renderer.drawSidePanels(this.holdPiece, this.nextPiece, this.score, this.lines, this.level);
      if (this.gameState === "GAME_OVER") {
        this.renderer.drawOverlay("GAME OVER", "PRESS RETRY", "#ff2255");
      } else if (this.isPaused) {
        this.renderer.drawOverlay("PAUSED", "PRESS P TO RESUME", "#00ffff");
      }
    }
    pause() {
      super.pause();
      this.audio.stopBGM();
    }
    resume() {
      super.resume();
      if (this.gameState === "PLAYING") {
        this.audio.playThemeBGM();
      }
    }
    reset() {
      this.level = 1;
      this.score = 0;
      this.lines = 0;
      this.onScoreUpdate(this.score);
      this.onLevelUpdate(this.level);
      this.board.reset();
      this.init();
      this.gameState = "PLAYING";
    }
    destroy() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.audio.destroy();
      this.input.detach(this.container);
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
    }
  };

  // blockz/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
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
      }
    }
  };

  // blockz/js/main.js
  async function recordGameActivity(data) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });
    } catch (_) {
    }
  }
  var TetrisCabinetApp = class {
    constructor() {
      this.gameInstance = null;
      this.gameId = "tetris";
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.canvasContainer = document.getElementById("game-canvas-container");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.btnActionDrop = document.getElementById("btn-action-drop");
      this.btnActionHold = document.getElementById("btn-action-hold");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.hudLinesNum = document.getElementById("hud-lines-num");
      this.hudLevelNum = document.getElementById("hud-level-num");
      this.init();
    }
    init() {
      this.applySettings();
      this.bindEvents();
      this.launchGame();
    }
    applySettings() {
      this.soundIcon.textContent = this.soundEnabled ? "\u{1F50A}" : "\u{1F507}";
      this.btnToggleSound.classList.toggle("active", this.soundEnabled);
      this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
      this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
    }
    bindEvents() {
      this.btnToggleSound.addEventListener("click", () => {
        this.soundEnabled = !this.soundEnabled;
        storage.setSetting("sound_enabled", this.soundEnabled);
        this.applySettings();
        if (this.gameInstance && typeof this.gameInstance.setMuted === "function") {
          this.gameInstance.setMuted(!this.soundEnabled);
        }
      });
      this.btnToggleCrt.addEventListener("click", () => {
        this.crtEnabled = !this.crtEnabled;
        storage.setSetting("crt_enabled", this.crtEnabled);
        this.applySettings();
      });
      this.btnPauseGame.addEventListener("click", () => {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
        }
      });
      this.btnRestartGame.addEventListener("click", () => {
        if (this.gameInstance) {
          this.gameInstance.reset();
          this.btnPauseGame.textContent = "PAUSE";
          this.hudLinesNum.textContent = "0";
        }
      });
      if (this.btnActionDrop) {
        const dropHandler = (e) => {
          e.preventDefault();
          if (this.gameInstance && typeof this.gameInstance.onActionTrigger === "function") {
            this.gameInstance.onActionTrigger();
          }
        };
        this.btnActionDrop.addEventListener("mousedown", dropHandler);
        this.btnActionDrop.addEventListener("touchstart", dropHandler, { passive: false });
      }
      if (this.btnActionHold) {
        const holdHandler = (e) => {
          e.preventDefault();
          if (this.gameInstance && typeof this.gameInstance.onHoldTrigger === "function") {
            this.gameInstance.onHoldTrigger();
          }
        };
        this.btnActionHold.addEventListener("mousedown", holdHandler);
        this.btnActionHold.addEventListener("touchstart", holdHandler, { passive: false });
      }
      const dpadButtons = [
        { id: "dpad-up", dir: "UP" },
        { id: "dpad-down", dir: "DOWN" },
        { id: "dpad-left", dir: "LEFT" },
        { id: "dpad-right", dir: "RIGHT" }
      ];
      dpadButtons.forEach(({ id, dir }) => {
        const btn = document.getElementById(id);
        if (btn) {
          let holdInterval = null;
          const trigger = (e) => {
            e.preventDefault();
            if (this.gameInstance && this.gameInstance.input) {
              this.gameInstance.input.setDirection(dir);
            }
            btn.classList.add("pressed");
            clearInterval(holdInterval);
            if (dir === "LEFT" || dir === "RIGHT" || dir === "DOWN") {
              holdInterval = setInterval(() => {
                if (this.gameInstance && this.gameInstance.input) {
                  this.gameInstance.input.setDirection(dir);
                }
              }, 110);
            }
          };
          const stopTrigger = () => {
            btn.classList.remove("pressed");
            clearInterval(holdInterval);
            holdInterval = null;
          };
          btn.addEventListener("mousedown", trigger);
          btn.addEventListener("mouseup", stopTrigger);
          btn.addEventListener("mouseleave", stopTrigger);
          btn.addEventListener("touchstart", trigger, { passive: false });
          btn.addEventListener("touchend", stopTrigger);
          btn.addEventListener("touchcancel", stopTrigger);
        }
      });
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;
      this.canvasContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = performance.now();
        }
      }, { passive: true });
      this.canvasContainer.addEventListener("touchmove", (e) => {
        e.preventDefault();
      }, { passive: false });
      this.canvasContainer.addEventListener("touchend", (e) => {
        if (!this.gameInstance || !this.gameInstance.input) return;
        if (e.changedTouches.length === 1) {
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          const elapsed = performance.now() - touchStartTime;
          if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && elapsed < 250) {
            this.gameInstance.input.setDirection("UP");
            return;
          }
          if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) >= 20) {
              this.gameInstance.input.setDirection(dx > 0 ? "RIGHT" : "LEFT");
            }
          } else {
            if (dy >= 25) {
              this.gameInstance.input.setDirection("DOWN");
            } else if (dy <= -35 && typeof this.gameInstance.onActionTrigger === "function") {
              this.gameInstance.onActionTrigger();
            }
          }
        }
      }, { passive: false });
      window.addEventListener("keydown", (e) => {
        if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
          }
        } else if (e.code === "Space") {
          if (this.gameInstance && typeof this.gameInstance.onActionTrigger === "function") {
            e.preventDefault();
            this.gameInstance.onActionTrigger();
          }
        } else if (e.code === "KeyC" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
          if (this.gameInstance && typeof this.gameInstance.onHoldTrigger === "function") {
            e.preventDefault();
            this.gameInstance.onHoldTrigger();
          }
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
    }
    launchGame() {
      this.canvasContainer.innerHTML = "";
      const highScore = storage.getHighScore(this.gameId);
      this.hudHighScore.textContent = highScore.toString().padStart(4, "0");
      this.hudScore.textContent = "0000";
      this.hudLevelNum.textContent = "1";
      this.hudLinesNum.textContent = "0";
      this.gameInstance = new TetrisGame(this.canvasContainer, {
        muted: !this.soundEnabled,
        highScore,
        onScoreUpdate: (score) => {
          this.hudScore.textContent = score.toString().padStart(4, "0");
          if (this.gameInstance && typeof this.gameInstance.lines !== "undefined") {
            this.hudLinesNum.textContent = this.gameInstance.lines.toString();
          }
          if (score > highScore) {
            this.hudHighScore.textContent = score.toString().padStart(4, "0");
            storage.setHighScore(this.gameId, score);
          }
        },
        onGameOver: (finalScore) => {
          storage.setHighScore(this.gameId, finalScore);
          recordGameActivity({ gameId: "blockz", level: this.gameInstance?.level || 1, score: finalScore, status: "complete", result: "GAME OVER" });
        },
        onLevelUpdate: (level) => {
          this.hudLevelNum.textContent = level.toString();
          if (level > 1 && this.gameInstance) {
            recordGameActivity({ gameId: "blockz", level, score: this.gameInstance.score, status: "complete", result: "LEVEL ADVANCE" });
          }
        }
      });
      this.gameInstance.start();
    }
  };
  function boot() {
    new TetrisCabinetApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
