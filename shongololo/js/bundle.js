(() => {
  // shongololo/js/entities.js
  var Shongololo = class {
    constructor(startX = 10, startY = 10, initialLength = 4) {
      this.body = [];
      for (let i = 0; i < initialLength; i++) {
        this.body.push({ x: startX - i, y: startY });
      }
      this.dir = { x: 1, y: 0 };
      this.nextDir = { x: 1, y: 0 };
      this.queuedDir = null;
      this.legsPhase = 0;
      this.dead = false;
    }
    setDirection(dx, dy) {
      if (dx === -this.dir.x && dy === -this.dir.y) return;
      if (this.nextDir.x !== this.dir.x || this.nextDir.y !== this.dir.y) {
        if (dx !== -this.nextDir.x && dy !== -this.nextDir.y) {
          this.queuedDir = { x: dx, y: dy };
        }
      } else {
        this.nextDir = { x: dx, y: dy };
      }
    }
    step(grow = false, wrap = false, cols = 32, rows = 22) {
      if (this.dead) return;
      this.dir = this.nextDir;
      if (this.queuedDir) {
        this.nextDir = this.queuedDir;
        this.queuedDir = null;
      }
      let nextX = this.body[0].x + this.dir.x;
      let nextY = this.body[0].y + this.dir.y;
      if (wrap) {
        nextX = (nextX + cols) % cols;
        nextY = (nextY + rows) % rows;
      }
      const newHead = { x: nextX, y: nextY };
      this.body.unshift(newHead);
      if (!grow) {
        this.body.pop();
      }
      this.legsPhase = 1 - this.legsPhase;
    }
    checkSelfCollision() {
      if (this.body.length < 4) return false;
      const head = this.body[0];
      for (let i = 1; i < this.body.length; i++) {
        if (this.body[i].x === head.x && this.body[i].y === head.y) {
          return true;
        }
      }
      return false;
    }
    render(ctx, cellSize = 14) {
      ctx.save();
      const darkLcd = "#1b2a09";
      const highlightLcd = "#334812";
      for (let i = this.body.length - 1; i >= 0; i--) {
        const seg = this.body[i];
        const px = seg.x * cellSize;
        const py = seg.y * cellSize;
        if (i === 0) {
          ctx.fillStyle = darkLcd;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          const dir = this.dir;
          ctx.strokeStyle = darkLcd;
          ctx.lineWidth = 1.5;
          const centerX = px + cellSize / 2;
          const centerY = py + cellSize / 2;
          if (dir.x === 1) {
            ctx.beginPath();
            ctx.moveTo(px + cellSize - 2, centerY - 3);
            ctx.lineTo(px + cellSize + 3, centerY - 6);
            ctx.moveTo(px + cellSize - 2, centerY + 3);
            ctx.lineTo(px + cellSize + 3, centerY + 6);
            ctx.stroke();
          } else if (dir.x === -1) {
            ctx.beginPath();
            ctx.moveTo(px + 2, centerY - 3);
            ctx.lineTo(px - 3, centerY - 6);
            ctx.moveTo(px + 2, centerY + 3);
            ctx.lineTo(px - 3, centerY + 6);
            ctx.stroke();
          } else if (dir.y === -1) {
            ctx.beginPath();
            ctx.moveTo(centerX - 3, py + 2);
            ctx.lineTo(centerX - 6, py - 3);
            ctx.moveTo(centerX + 3, py + 2);
            ctx.lineTo(centerX + 6, py - 3);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(centerX - 3, py + cellSize - 2);
            ctx.lineTo(centerX - 6, py + cellSize + 3);
            ctx.moveTo(centerX + 3, py + cellSize - 2);
            ctx.lineTo(centerX + 6, py + cellSize + 3);
            ctx.stroke();
          }
          ctx.fillStyle = "#879738";
          ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
        } else {
          ctx.fillStyle = darkLcd;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
          ctx.fillStyle = highlightLcd;
          ctx.fillRect(px + 3, py + 3, cellSize - 6, cellSize - 6);
          ctx.strokeStyle = darkLcd;
          ctx.lineWidth = 1.2;
          const legOffset = (i + this.legsPhase) % 2 === 0 ? -2 : 2;
          if (this.dir.x !== 0) {
            ctx.beginPath();
            ctx.moveTo(px + 3, py + 1);
            ctx.lineTo(px + 3 + legOffset, py - 2);
            ctx.moveTo(px + cellSize - 4, py + 1);
            ctx.lineTo(px + cellSize - 4 - legOffset, py - 2);
            ctx.moveTo(px + 3, py + cellSize - 1);
            ctx.lineTo(px + 3 + legOffset, py + cellSize + 2);
            ctx.moveTo(px + cellSize - 4, py + cellSize - 1);
            ctx.lineTo(px + cellSize - 4 - legOffset, py + cellSize + 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(px + 1, py + 3);
            ctx.lineTo(px - 2, py + 3 + legOffset);
            ctx.moveTo(px + 1, py + cellSize - 4);
            ctx.lineTo(px - 2, py + cellSize - 4 - legOffset);
            ctx.moveTo(px + cellSize - 1, py + 3);
            ctx.lineTo(px + cellSize + 2, py + 3 + legOffset);
            ctx.moveTo(px + cellSize - 1, py + cellSize - 4);
            ctx.lineTo(px + cellSize + 2, py + cellSize - 4 - legOffset);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  };
  var FoodItem = class {
    constructor(x, y, isBonus = false, timer = 10) {
      this.x = x;
      this.y = y;
      this.isBonus = isBonus;
      this.timer = timer;
      this.maxTimer = timer;
      this.active = true;
    }
    update(dt) {
      if (this.isBonus && this.active) {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.active = false;
        }
      }
    }
    render(ctx, cellSize = 14) {
      if (!this.active) return;
      ctx.save();
      const px = this.x * cellSize;
      const py = this.y * cellSize;
      const darkLcd = "#1b2a09";
      if (!this.isBonus) {
        ctx.fillStyle = darkLcd;
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2 + 1, cellSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(px + cellSize / 2 - 1, py + 1, 2, 3);
        ctx.fillRect(px + cellSize / 2 + 1, py, 3, 2);
      } else {
        const blink = Math.sin(this.timer * 12) > 0;
        ctx.fillStyle = darkLcd;
        ctx.beginPath();
        ctx.ellipse(px + cellSize / 2, py + cellSize / 2, cellSize / 2 - 1, cellSize / 2 - 3, 0, 0, Math.PI * 2);
        ctx.fill();
        if (blink) {
          ctx.fillStyle = "#879738";
          ctx.fillRect(px + cellSize / 2 - 1, py + cellSize / 2 - 1, 2, 2);
        }
        ctx.strokeStyle = darkLcd;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 1, py + 3);
        ctx.lineTo(px - 2, py + 1);
        ctx.moveTo(px + cellSize - 1, py + 3);
        ctx.lineTo(px + cellSize + 2, py + 1);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
  var Maze = class {
    constructor(type = "CLASSIC_BOX", cols = 32, rows = 22) {
      this.type = type;
      this.cols = cols;
      this.rows = rows;
      this.walls = /* @__PURE__ */ new Set();
      this.initWalls();
    }
    initWalls() {
      this.walls.clear();
      if (this.type === "CLASSIC_BOX") {
        for (let x = 0; x < this.cols; x++) {
          this.walls.add(`${x},0`);
          this.walls.add(`${x},${this.rows - 1}`);
        }
        for (let y = 0; y < this.rows; y++) {
          this.walls.add(`0,${y}`);
          this.walls.add(`${this.cols - 1},${y}`);
        }
      } else if (this.type === "ACACIA_GROVE") {
        const obstacles = [
          // Top-left copse
          { x: 8, y: 6 },
          { x: 9, y: 6 },
          { x: 8, y: 7 },
          // Bottom-right copse
          { x: 23, y: 15 },
          { x: 24, y: 15 },
          { x: 24, y: 16 },
          // Center rock spine
          { x: 15, y: 10 },
          { x: 16, y: 10 },
          { x: 16, y: 11 }
        ];
        obstacles.forEach((o) => this.walls.add(`${o.x},${o.y}`));
      }
    }
    isWall(x, y) {
      if (this.type === "CLASSIC_BOX") {
        if (x <= 0 || x >= this.cols - 1 || y <= 0 || y >= this.rows - 1) {
          return true;
        }
      }
      return this.walls.has(`${x},${y}`);
    }
    render(ctx, cellSize = 14) {
      ctx.save();
      const darkLcd = "#1b2a09";
      ctx.fillStyle = darkLcd;
      this.walls.forEach((coord) => {
        const [x, y] = coord.split(",").map(Number);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.fillStyle = "#334812";
        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
        ctx.fillStyle = darkLcd;
      });
      ctx.restore();
    }
  };

  // shongololo/js/audio.js
  var ShongololoAudio = class {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    setMuted(muted) {
      this.muted = Boolean(muted);
    }
    toggle() {
      this.setMuted(!this.muted);
      return !this.muted;
    }
    playBeep(freq, duration = 0.04, vol = 0.12) {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.setValueAtTime(vol, now + duration - 5e-3);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {
      }
    }
    step() {
      this.playBeep(1200, 0.015, 0.03);
    }
    eat() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(2600, now);
        osc.frequency.setValueAtTime(3400, now + 0.03);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (_) {
      }
    }
    eatBonus() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [2800, 3600, 4400].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);
          gain.gain.setValueAtTime(0.2, now + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0, now + idx * 0.04 + 0.035);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.035);
        });
      } catch (_) {
      }
    }
    crash() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (_) {
      }
    }
    fanfare() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [
          { f: 659.25, d: 0.08 },
          // E5
          { f: 587.33, d: 0.08 },
          // D5
          { f: 369.99, d: 0.14 },
          // F#4
          { f: 415.3, d: 0.14 },
          // G#4
          { f: 554.37, d: 0.08 },
          // C#5
          { f: 493.88, d: 0.08 },
          // B4
          { f: 293.66, d: 0.14 },
          // D4
          { f: 329.63, d: 0.18 }
          // E4
        ];
        let t = 0;
        notes.forEach((n) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(n.f, now + t);
          gain.gain.setValueAtTime(0.18, now + t);
          gain.gain.setValueAtTime(0.18, now + t + n.d - 0.01);
          gain.gain.linearRampToValueAtTime(0, now + t + n.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + n.d);
          t += n.d + 0.02;
        });
      } catch (_) {
      }
    }
  };
  var sound = new ShongololoAudio();

  // shongololo/js/game.js
  var SPEEDS = {
    1: 0.2,
    2: 0.175,
    3: 0.15,
    4: 0.13,
    5: 0.11,
    6: 0.09,
    7: 0.075,
    8: 0.06,
    9: 0.045
  };
  var ShongololoGame = class {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.callbacks = callbacks;
      this.cols = 30;
      this.rows = 20;
      this.cellSize = 14;
      this.speedLevel = 5;
      this.mazeType = "CLASSIC_BOX";
      this.score = 0;
      this.foodEaten = 0;
      this.state = "READY";
      this.stepTimer = 0;
      this.shongololo = null;
      this.food = null;
      this.bonusBug = null;
      this.maze = null;
      this.init();
    }
    init() {
      this.maze = new Maze(this.mazeType, this.cols, this.rows);
      this.reset();
    }
    setSpeed(level) {
      const l = Math.max(1, Math.min(9, parseInt(level, 10) || 5));
      this.speedLevel = l;
      if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(this.speedLevel);
    }
    setMaze(type) {
      if (["CLASSIC_BOX", "SAVANNAH_WRAP", "ACACIA_GROVE"].includes(type)) {
        this.mazeType = type;
        this.maze = new Maze(this.mazeType, this.cols, this.rows);
        this.reset();
        if (this.callbacks.onMazeUpdate) this.callbacks.onMazeUpdate(this.mazeType);
      }
    }
    reset() {
      this.score = 0;
      this.foodEaten = 0;
      this.stepTimer = 0;
      this.bonusBug = null;
      const startX = Math.floor(this.cols / 3);
      const startY = Math.floor(this.rows / 2);
      this.shongololo = new Shongololo(startX, startY, 4);
      this.spawnFood();
      if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
      if (this.callbacks.onLengthUpdate) this.callbacks.onLengthUpdate(this.shongololo.body.length);
    }
    start() {
      this.reset();
      this.state = "PLAYING";
    }
    togglePause() {
      if (this.state === "PLAYING") {
        this.state = "PAUSED";
        return true;
      } else if (this.state === "PAUSED") {
        this.state = "PLAYING";
        return false;
      }
      return false;
    }
    getRandomFreeCell() {
      const occupied = /* @__PURE__ */ new Set();
      this.shongololo.body.forEach((seg) => occupied.add(`${seg.x},${seg.y}`));
      if (this.mazeType === "CLASSIC_BOX") {
        for (let x = 0; x < this.cols; x++) {
          occupied.add(`${x},0`);
          occupied.add(`${x},${this.rows - 1}`);
        }
        for (let y = 0; y < this.rows; y++) {
          occupied.add(`0,${y}`);
          occupied.add(`${this.cols - 1},${y}`);
        }
      } else if (this.maze) {
        this.maze.walls.forEach((w) => occupied.add(w));
      }
      const free = [];
      for (let x = 1; x < this.cols - 1; x++) {
        for (let y = 1; y < this.rows - 1; y++) {
          if (!occupied.has(`${x},${y}`)) {
            free.push({ x, y });
          }
        }
      }
      if (free.length === 0) return { x: 5, y: 5 };
      const idx = Math.floor(Math.random() * free.length);
      return free[idx];
    }
    spawnFood() {
      const pos = this.getRandomFreeCell();
      this.food = new FoodItem(pos.x, pos.y, false);
    }
    spawnBonusBug() {
      const pos = this.getRandomFreeCell();
      this.bonusBug = new FoodItem(pos.x, pos.y, true, 12);
    }
    handleDirection(dx, dy) {
      if (this.state === "PLAYING" && this.shongololo) {
        this.shongololo.setDirection(dx, dy);
        sound.step();
      }
    }
    update(dt) {
      if (this.state !== "PLAYING") return;
      if (this.bonusBug) {
        this.bonusBug.update(dt);
        if (!this.bonusBug.active) {
          this.bonusBug = null;
        }
      }
      const interval = SPEEDS[this.speedLevel] || 0.11;
      this.stepTimer += dt;
      if (this.stepTimer >= interval) {
        this.stepTimer = 0;
        this.tick();
      }
    }
    tick() {
      const s = this.shongololo;
      const isWrap = this.mazeType !== "CLASSIC_BOX";
      let nextX = s.body[0].x + s.nextDir.x;
      let nextY = s.body[0].y + s.nextDir.y;
      if (isWrap) {
        nextX = (nextX + this.cols) % this.cols;
        nextY = (nextY + this.rows) % this.rows;
      }
      if (this.maze.isWall(nextX, nextY)) {
        this.gameOver("CRASHED INTO WALL");
        return;
      }
      for (let i = 0; i < s.body.length - 1; i++) {
        if (s.body[i].x === nextX && s.body[i].y === nextY) {
          this.gameOver("BIT OWN TAIL");
          return;
        }
      }
      let grow = false;
      if (this.food && nextX === this.food.x && nextY === this.food.y) {
        grow = true;
        sound.eat();
        this.foodEaten++;
        const pts = 10 * this.speedLevel;
        this.score += pts;
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
        this.spawnFood();
        if (this.foodEaten % 5 === 0 && !this.bonusBug) {
          this.spawnBonusBug();
        }
      }
      if (this.bonusBug && this.bonusBug.active && nextX === this.bonusBug.x && nextY === this.bonusBug.y) {
        grow = true;
        sound.eatBonus();
        const bonusPts = 50 * this.speedLevel;
        this.score += bonusPts;
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
        this.bonusBug = null;
      }
      s.step(grow, isWrap, this.cols, this.rows);
      if (this.callbacks.onLengthUpdate) this.callbacks.onLengthUpdate(s.body.length);
    }
    gameOver(reason = "GAME OVER") {
      this.state = "GAME_OVER";
      this.shongololo.dead = true;
      sound.crash();
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver({
          score: this.score,
          length: this.shongololo.body.length,
          speed: this.speedLevel,
          reason
        });
      }
    }
    render() {
      const ctx = this.ctx;
      const w = this.cols * this.cellSize;
      const h = this.rows * this.cellSize;
      ctx.fillStyle = "#879738";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(27, 42, 9, 0.04)";
      for (let x = 0; x < w; x += 2) {
        ctx.fillRect(x, 0, 1, h);
      }
      for (let y = 0; y < h; y += 2) {
        ctx.fillRect(0, y, w, 1);
      }
      if (this.maze) {
        this.maze.render(ctx, this.cellSize);
      }
      if (this.food) {
        this.food.render(ctx, this.cellSize);
      }
      if (this.bonusBug) {
        this.bonusBug.render(ctx, this.cellSize);
      }
      if (this.shongololo) {
        this.shongololo.render(ctx, this.cellSize);
      }
      if (this.state === "GAME_OVER") {
        ctx.save();
        ctx.fillStyle = "rgba(27, 42, 9, 0.85)";
        ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.4);
        ctx.strokeStyle = "#1b2a09";
        ctx.lineWidth = 2;
        ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.4);
        ctx.fillStyle = "#879738";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("SCORE: " + this.score, w / 2, h * 0.46);
        ctx.font = "bold 9px monospace";
        ctx.fillText("PRESS 5 OR TAP", w / 2, h * 0.58);
        ctx.restore();
      }
    }
  };

  // shongololo/js/storage.js
  var STORAGE_KEY = "retro_arcade_shongololo_hiscore";
  var GAME_ID = "shongololo";
  function getLocalHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (_) {
      return 0;
    }
  }
  function saveLocalHighScore(score) {
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
  async function submitMatchRecord({ score, level = 1, result = "GAME OVER" }) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          gameId: GAME_ID,
          score: Math.max(0, parseInt(score, 10) || 0),
          level: Math.max(1, Math.min(255, parseInt(level, 10) || 1)),
          status: "complete",
          result
        })
      });
    } catch (_) {
    }
  }

  // shongololo/js/main.js
  var ShongololoApp = class {
    constructor() {
      this.canvas = document.getElementById("shongololo-canvas");
      this.btnBack = document.getElementById("btn-back-hub");
      this.btnSound = document.getElementById("btn-toggle-sound");
      this.btnPause = document.getElementById("btn-pause-game");
      this.btnRestart = document.getElementById("btn-restart-game");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.hudLength = document.getElementById("hud-length");
      this.hudSpeed = document.getElementById("hud-speed");
      this.hudMaze = document.getElementById("hud-maze");
      this.btnCycleSpeed = document.getElementById("btn-cycle-speed");
      this.btnCycleMaze = document.getElementById("btn-cycle-maze");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayTitle = document.getElementById("overlay-title");
      this.overlayFinalScore = document.getElementById("overlay-final-score");
      this.overlayFinalLength = document.getElementById("overlay-final-length");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.highScore = getLocalHighScore();
      this.hudHighScore.textContent = this.highScore.toString().padStart(4, "0");
      this.soundEnabled = true;
      this.initGame();
      this.bindEvents();
      this.startGameLoop();
    }
    initGame() {
      this.game = new ShongololoGame(this.canvas, {
        onScoreUpdate: (score) => {
          this.hudScore.textContent = score.toString().padStart(4, "0");
          if (score > this.highScore) {
            this.highScore = score;
            saveLocalHighScore(this.highScore);
            this.hudHighScore.textContent = this.highScore.toString().padStart(4, "0");
          }
        },
        onLengthUpdate: (length) => {
          this.hudLength.textContent = length.toString();
        },
        onSpeedUpdate: (speed) => {
          this.hudSpeed.textContent = `SPD ${speed}`;
        },
        onMazeUpdate: (maze) => {
          const names = {
            CLASSIC_BOX: "BOX",
            SAVANNAH_WRAP: "WRAP",
            ACACIA_GROVE: "GROVE"
          };
          this.hudMaze.textContent = names[maze] || maze;
        },
        onGameOver: ({ score, length, speed, reason }) => {
          this.handleGameOver(score, length, speed, reason);
        }
      });
      this.game.start();
    }
    handleGameOver(score, length, speed, reason) {
      this.overlayFinalScore.textContent = score.toString();
      this.overlayFinalLength.textContent = length.toString();
      this.overlayTitle.textContent = reason;
      this.gameOverlay.classList.add("visible");
      submitMatchRecord({
        score,
        level: speed,
        result: `LEN ${length} (${score} PTS)`
      });
    }
    bindEvents() {
      this.btnSound.addEventListener("click", () => {
        this.soundEnabled = sound.toggle();
        this.btnSound.textContent = this.soundEnabled ? "\u{1F50A} SOUND" : "\u{1F507} MUTED";
        this.btnSound.classList.toggle("active", this.soundEnabled);
      });
      this.btnPause.addEventListener("click", () => {
        sound.init();
        const isPaused = this.game.togglePause();
        this.btnPause.textContent = isPaused ? "RESUME" : "PAUSE";
      });
      const doRestart = () => {
        sound.init();
        this.gameOverlay.classList.remove("visible");
        this.game.start();
        this.btnPause.textContent = "PAUSE";
      };
      this.btnRestart.addEventListener("click", doRestart);
      this.overlayRestartBtn.addEventListener("click", doRestart);
      if (this.btnCycleSpeed) {
        this.btnCycleSpeed.addEventListener("click", () => {
          sound.init();
          let next = this.game.speedLevel + 1;
          if (next > 9) next = 1;
          this.game.setSpeed(next);
          this.btnCycleSpeed.textContent = `SPEED: ${next}`;
        });
      }
      if (this.btnCycleMaze) {
        const mazes = ["CLASSIC_BOX", "SAVANNAH_WRAP", "ACACIA_GROVE"];
        this.btnCycleMaze.addEventListener("click", () => {
          sound.init();
          const currentIdx = mazes.indexOf(this.game.mazeType);
          const nextIdx = (currentIdx + 1) % mazes.length;
          this.game.setMaze(mazes[nextIdx]);
          const shortNames = ["BOX", "WRAP", "GROVE"];
          this.btnCycleMaze.textContent = `MAZE: ${shortNames[nextIdx]}`;
        });
      }
      window.addEventListener("keydown", (e) => {
        sound.init();
        if (["ArrowUp", "KeyW", "Numpad8", "Digit2"].includes(e.code)) {
          e.preventDefault();
          this.game.handleDirection(0, -1);
        } else if (["ArrowDown", "KeyS", "Numpad2", "Digit8"].includes(e.code)) {
          e.preventDefault();
          this.game.handleDirection(0, 1);
        } else if (["ArrowLeft", "KeyA", "Numpad4", "Digit4"].includes(e.code)) {
          e.preventDefault();
          this.game.handleDirection(-1, 0);
        } else if (["ArrowRight", "KeyD", "Numpad6", "Digit6"].includes(e.code)) {
          e.preventDefault();
          this.game.handleDirection(1, 0);
        } else if (["Space", "Enter", "Numpad5", "Digit5"].includes(e.code)) {
          e.preventDefault();
          if (this.game.state === "GAME_OVER") {
            doRestart();
          } else {
            this.btnPause.click();
          }
        } else if (e.code === "KeyP") {
          this.btnPause.click();
        } else if (e.code === "KeyM") {
          this.btnSound.click();
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
      const bindKey = (id, action) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          sound.init();
          action();
          el.classList.add("active");
        });
        el.addEventListener("pointerup", () => el.classList.remove("active"));
        el.addEventListener("pointercancel", () => el.classList.remove("active"));
        el.addEventListener("pointerleave", () => el.classList.remove("active"));
      };
      bindKey("key-2", () => this.game.handleDirection(0, -1));
      bindKey("key-8", () => this.game.handleDirection(0, 1));
      bindKey("key-4", () => this.game.handleDirection(-1, 0));
      bindKey("key-6", () => this.game.handleDirection(1, 0));
      bindKey("key-5", () => {
        if (this.game.state === "GAME_OVER") doRestart();
        else this.game.togglePause();
      });
      bindKey("dpad-up", () => this.game.handleDirection(0, -1));
      bindKey("dpad-down", () => this.game.handleDirection(0, 1));
      bindKey("dpad-left", () => this.game.handleDirection(-1, 0));
      bindKey("dpad-right", () => this.game.handleDirection(1, 0));
      let touchStartX = 0;
      let touchStartY = 0;
      this.canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: true });
      this.canvas.addEventListener("touchend", (e) => {
        if (e.changedTouches.length === 1) {
          sound.init();
          if (this.game.state === "GAME_OVER") {
            doRestart();
            return;
          }
          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          const absX = Math.abs(dx);
          const absY = Math.abs(dy);
          if (Math.max(absX, absY) > 20) {
            if (absX > absY) {
              this.game.handleDirection(dx > 0 ? 1 : -1, 0);
            } else {
              this.game.handleDirection(0, dy > 0 ? 1 : -1);
            }
          }
        }
      }, { passive: true });
    }
    startGameLoop() {
      let lastTime = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.1, (now - lastTime) / 1e3);
        lastTime = now;
        this.game.update(dt);
        this.game.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    new ShongololoApp();
  });
})();
