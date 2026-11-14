(() => {
  // digging/js/baseGame.js
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

  // digging/js/map.js
  var COLS = 15;
  var ROWS = 10;
  var TILE_WIDTH = 32;
  var TILE_HEIGHT = 32;
  var TILE = {
    EMPTY: 0,
    DIRT: 1,
    EMERALD: 2
  };
  var LEVEL_MAPS = [
    // Level 1
    {
      tiles: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Row 0: Top corridor
        [1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 0],
        [1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Row 3: Middle corridor
        [0, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1],
        [0, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Row 6: Lower middle corridor
        [1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 1],
        [1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        // Row 9: Bottom corridor
      ],
      bags: [
        { col: 3, row: 1 },
        { col: 7, row: 1 },
        { col: 11, row: 1 },
        { col: 5, row: 4 },
        { col: 9, row: 4 },
        { col: 3, row: 7 }
      ]
    },
    // Level 2
    {
      tiles: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 0],
        [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 0],
        [0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1],
        [1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0],
        [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
        [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      bags: [
        { col: 2, row: 1 },
        { col: 6, row: 1 },
        { col: 10, row: 1 },
        { col: 4, row: 4 },
        { col: 8, row: 4 },
        { col: 12, row: 4 },
        { col: 6, row: 7 }
      ]
    }
  ];
  var DiggerMap = class {
    constructor(levelIndex = 0) {
      this.levelIndex = levelIndex % LEVEL_MAPS.length;
      this.reset();
    }
    reset(levelIndex = this.levelIndex) {
      this.levelIndex = levelIndex % LEVEL_MAPS.length;
      const template = LEVEL_MAPS[this.levelIndex];
      this.grid = template.tiles.map((row) => [...row]);
      this.initialBagConfigs = template.bags.map((b) => ({ ...b }));
      this.totalEmeralds = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.grid[r][c] === TILE.EMERALD) {
            this.totalEmeralds++;
          }
        }
      }
      this.emeraldsRemaining = this.totalEmeralds;
    }
    isDirt(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      return this.grid[row][col] === TILE.DIRT || this.grid[row][col] === TILE.EMERALD;
    }
    isTunnel(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      return this.grid[row][col] === TILE.EMPTY;
    }
    dig(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
      const current = this.grid[row][col];
      if (current === TILE.DIRT) {
        this.grid[row][col] = TILE.EMPTY;
        return "DIRT";
      }
      if (current === TILE.EMERALD) {
        this.grid[row][col] = TILE.EMPTY;
        this.emeraldsRemaining--;
        return "EMERALD";
      }
      return null;
    }
    getTile(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return TILE.EMPTY;
      return this.grid[row][col];
    }
  };

  // digging/js/digger.js
  var DIRECTIONS = {
    UP: { x: 0, y: -1, angle: -Math.PI / 2 },
    DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
    LEFT: { x: -1, y: 0, angle: Math.PI },
    RIGHT: { x: 1, y: 0, angle: 0 },
    NONE: { x: 0, y: 0, angle: 0 }
  };
  var DiggerPlayer = class {
    constructor(map) {
      this.map = map;
      this.startCol = 7;
      this.startRow = 9;
      this.baseSpeed = 2.2;
      this.reset();
    }
    reset() {
      this.col = this.startCol;
      this.row = this.startRow;
      this.x = this.col * TILE_WIDTH;
      this.y = this.row * TILE_HEIGHT;
      this.currentDir = "RIGHT";
      this.nextDir = "RIGHT";
      this.speed = this.baseSpeed;
      this.isDigging = false;
      this.animFrame = 0;
      this.isDying = false;
      this.deathTimer = 0;
      this.shot = null;
      this.rechargeTimer = 0;
      this.rechargeMax = 110;
    }
    setDirection(dir) {
      if (!DIRECTIONS[dir]) return;
      this.nextDir = dir;
      const cur = DIRECTIONS[this.currentDir];
      const nxt = DIRECTIONS[dir];
      if (cur.x + nxt.x === 0 && cur.y + nxt.y === 0) {
        this.currentDir = dir;
      }
    }
    fireWeapon() {
      if (this.shot || this.rechargeTimer > 0 || this.isDying) return null;
      const dirVec = DIRECTIONS[this.currentDir] || DIRECTIONS.RIGHT;
      this.shot = {
        x: this.x + TILE_WIDTH / 2,
        y: this.y + TILE_HEIGHT / 2,
        dx: dirVec.x * 6.5,
        dy: dirVec.y * 6.5,
        dir: this.currentDir,
        life: 50
      };
      this.rechargeTimer = this.rechargeMax;
      return this.shot;
    }
    update(bags, onCollectEmerald, onDigDirt) {
      if (this.rechargeTimer > 0) {
        this.rechargeTimer--;
      }
      if (this.shot) {
        this.shot.x += this.shot.dx;
        this.shot.y += this.shot.dy;
        this.shot.life--;
        const shotCol = Math.floor(this.shot.x / TILE_WIDTH);
        const shotRow = Math.floor(this.shot.y / TILE_HEIGHT);
        if (this.shot.life <= 0 || shotCol < 0 || shotCol >= COLS || shotRow < 0 || shotRow >= ROWS || this.map.isDirt(shotCol, shotRow) || bags.some((b) => b.col === shotCol && b.row === shotRow && b.state !== "COLLECTED")) {
          this.shot = null;
        }
      }
      if (this.isDying) {
        this.deathTimer++;
        return;
      }
      this.animFrame++;
      const col = Math.round(this.x / TILE_WIDTH);
      const row = Math.round(this.y / TILE_HEIGHT);
      const centerX = col * TILE_WIDTH;
      const centerY = row * TILE_HEIGHT;
      const distToCenter = Math.hypot(this.x - centerX, this.y - centerY);
      if (this.nextDir !== this.currentDir && distToCenter <= this.speed) {
        this.x = centerX;
        this.y = centerY;
        this.currentDir = this.nextDir;
      }
      const vec = DIRECTIONS[this.currentDir];
      if (!vec || vec.x === 0 && vec.y === 0) return;
      let targetSpeed = this.baseSpeed;
      const nextX = this.x + vec.x * targetSpeed;
      const nextY = this.y + vec.y * targetSpeed;
      const nextCol = Math.floor((nextX + TILE_WIDTH / 2) / TILE_WIDTH);
      const nextRow = Math.floor((nextY + TILE_HEIGHT / 2) / TILE_HEIGHT);
      if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) {
        return;
      }
      const targetBag = bags.find(
        (b) => b.col === nextCol && b.row === nextRow && b.state !== "COLLECTED" && b.state !== "OPEN_GOLD"
      );
      if (targetBag) {
        if (vec.y === 0 && targetBag.tryPush(this.currentDir, this.map, bags)) {
          targetSpeed = 1.4;
        } else {
          return;
        }
      }
      if (this.map.isDirt(nextCol, nextRow)) {
        targetSpeed = 1.6;
        const dug = this.map.dig(nextCol, nextRow);
        if (dug === "EMERALD" && onCollectEmerald) {
          onCollectEmerald(nextCol, nextRow);
        } else if (dug === "DIRT" && onDigDirt) {
          onDigDirt(nextCol, nextRow);
        }
      }
      this.x += vec.x * targetSpeed;
      this.y += vec.y * targetSpeed;
      this.col = Math.round(this.x / TILE_WIDTH);
      this.row = Math.round(this.y / TILE_HEIGHT);
    }
  };

  // digging/js/bag.js
  var BAG_STATE = {
    RESTING: "RESTING",
    WOBBLING: "WOBBLING",
    FALLING: "FALLING",
    OPEN_GOLD: "OPEN_GOLD",
    COLLECTED: "COLLECTED"
  };
  var GoldBag = class {
    constructor(col, row) {
      this.col = col;
      this.row = row;
      this.x = col * TILE_WIDTH;
      this.y = row * TILE_HEIGHT;
      this.state = BAG_STATE.RESTING;
      this.wobbleTimer = 0;
      this.fallDistance = 0;
      this.fallSpeed = 4.5;
      this.wobbleOffset = 0;
    }
    update(map, otherBags, onCrushEntity) {
      if (this.state === BAG_STATE.COLLECTED) return;
      if (this.state === BAG_STATE.RESTING) {
        const belowRow = this.row + 1;
        const isGroundBelow = belowRow >= ROWS || map.isDirt(this.col, belowRow) || this.isBagBelow(otherBags);
        if (!isGroundBelow) {
          this.state = BAG_STATE.WOBBLING;
          this.wobbleTimer = 22;
        }
        return;
      }
      if (this.state === BAG_STATE.WOBBLING) {
        this.wobbleTimer--;
        this.wobbleOffset = this.wobbleTimer % 4 < 2 ? -2 : 2;
        if (this.wobbleTimer <= 0) {
          this.wobbleOffset = 0;
          this.state = BAG_STATE.FALLING;
          this.startFallRow = this.row;
        }
        return;
      }
      if (this.state === BAG_STATE.FALLING) {
        this.y += this.fallSpeed;
        this.row = Math.floor(this.y / TILE_HEIGHT);
        if (onCrushEntity) {
          onCrushEntity(this);
        }
        const nextTileY = (this.row + 1) * TILE_HEIGHT;
        const isFloorBelow = this.row + 1 >= ROWS || map.isDirt(this.col, this.row + 1) || this.isBagBelow(otherBags);
        if (this.y >= nextTileY - this.fallSpeed && isFloorBelow) {
          this.y = this.row * TILE_HEIGHT;
          const rowsFallen = this.row - (this.startFallRow ?? this.row);
          if (rowsFallen >= 2) {
            this.state = BAG_STATE.OPEN_GOLD;
          } else {
            this.state = BAG_STATE.RESTING;
          }
        }
      }
    }
    isBagBelow(otherBags) {
      return otherBags.some(
        (b) => b !== this && b.col === this.col && b.row === this.row + 1 && b.state !== BAG_STATE.COLLECTED && b.state !== BAG_STATE.FALLING
      );
    }
    tryPush(dir, map, otherBags) {
      if (this.state !== BAG_STATE.RESTING) return false;
      const targetCol = this.col + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0);
      if (targetCol < 0 || targetCol >= COLS) return false;
      if (map.isDirt(targetCol, this.row)) return false;
      const blockedByBag = otherBags.some(
        (b) => b !== this && b.col === targetCol && b.row === this.row && b.state !== BAG_STATE.COLLECTED
      );
      if (blockedByBag) return false;
      this.col = targetCol;
      this.x = targetCol * TILE_WIDTH;
      return true;
    }
  };

  // digging/js/monsters.js
  var MONSTER_TYPE = {
    NOBBIN: "NOBBIN",
    HOBBIN: "HOBBIN"
  };
  var DIRECTIONS2 = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  };
  var OPPOSITES = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT"
  };
  var Monster = class {
    constructor(id, col = 14, row = 0, type = MONSTER_TYPE.NOBBIN) {
      this.id = id;
      this.col = col;
      this.row = row;
      this.x = col * TILE_WIDTH;
      this.y = row * TILE_HEIGHT;
      this.type = type;
      this.currentDir = "LEFT";
      this.baseSpeed = 1.6;
      this.speed = this.baseSpeed;
      this.mutationTimer = 350;
      this.animTimer = 0;
      this.isDead = false;
    }
    update(map, digger, bags, isBonusMode) {
      if (this.isDead) return;
      this.animTimer++;
      if (this.type === MONSTER_TYPE.NOBBIN && !isBonusMode) {
        this.mutationTimer--;
        if (this.mutationTimer <= 0) {
          this.type = MONSTER_TYPE.HOBBIN;
        }
      }
      const curCol = Math.round(this.x / TILE_WIDTH);
      const curRow = Math.round(this.y / TILE_HEIGHT);
      const centerX = curCol * TILE_WIDTH;
      const centerY = curRow * TILE_HEIGHT;
      const vec = DIRECTIONS2[this.currentDir] || DIRECTIONS2.LEFT;
      const nextX = this.x + vec.x * this.speed;
      const nextY = this.y + vec.y * this.speed;
      const crossedX = vec.x > 0 && this.x < centerX && nextX >= centerX || vec.x < 0 && this.x > centerX && nextX <= centerX;
      const crossedY = vec.y > 0 && this.y < centerY && nextY >= centerY || vec.y < 0 && this.y > centerY && nextY <= centerY;
      if (crossedX || crossedY) {
        this.x = centerX;
        this.y = centerY;
        this.chooseDirection(map, digger, bags, isBonusMode);
      } else {
        this.x = nextX;
        this.y = nextY;
      }
      this.col = Math.round(this.x / TILE_WIDTH);
      this.row = Math.round(this.y / TILE_HEIGHT);
      if (this.type === MONSTER_TYPE.HOBBIN && !isBonusMode) {
        if (map.isDirt(this.col, this.row)) {
          map.dig(this.col, this.row);
        }
      }
    }
    chooseDirection(map, digger, bags, isBonusMode) {
      const candidates = ["UP", "LEFT", "DOWN", "RIGHT"];
      const validDirs = [];
      const rev = OPPOSITES[this.currentDir];
      for (const dir of candidates) {
        if (dir === rev) continue;
        const vec = DIRECTIONS2[dir];
        const targetCol2 = this.col + vec.x;
        const targetRow2 = this.row + vec.y;
        if (targetCol2 < 0 || targetCol2 >= COLS || targetRow2 < 0 || targetRow2 >= ROWS) {
          continue;
        }
        const blockedByBag = bags.some(
          (b) => b.col === targetCol2 && b.row === targetRow2 && b.state !== "COLLECTED" && b.state !== "OPEN_GOLD"
        );
        if (blockedByBag) continue;
        if (this.type === MONSTER_TYPE.NOBBIN) {
          if (map.isDirt(targetCol2, targetRow2)) continue;
        }
        validDirs.push(dir);
      }
      if (validDirs.length === 0) {
        this.currentDir = rev || "LEFT";
        return;
      }
      let targetCol = digger.col;
      let targetRow = digger.row;
      if (isBonusMode) {
        targetCol = digger.col < COLS / 2 ? COLS - 1 : 0;
        targetRow = digger.row < ROWS / 2 ? ROWS - 1 : 0;
      }
      let bestDir = validDirs[0];
      let bestDist = Infinity;
      for (const dir of validDirs) {
        const vec = DIRECTIONS2[dir];
        const nextC = this.col + vec.x;
        const nextR = this.row + vec.y;
        const dist = (nextC - targetCol) ** 2 + (nextR - targetRow) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      }
      this.currentDir = bestDir;
    }
  };

  // digging/js/audio.js
  var DiggerAudio = class {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.muted = false;
      this.bgmTimer = null;
      this.bgmNoteIndex = 0;
      this.currentBgm = null;
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
    // --- Chiptune Melodies ---
    // "Popcorn" Theme (Main Gameplay)
    playPopcornBGM() {
      if (this.muted || this.currentBgm === "popcorn") return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      this.currentBgm = "popcorn";
      const notes = [
        466.16,
        415.3,
        466.16,
        349.23,
        277.18,
        349.23,
        233.08,
        0,
        466.16,
        415.3,
        466.16,
        349.23,
        277.18,
        349.23,
        233.08,
        0,
        466.16,
        523.25,
        554.37,
        523.25,
        554.37,
        466.16,
        523.25,
        466.16,
        523.25,
        415.3,
        466.16,
        415.3,
        466.16,
        392,
        466.16,
        0
      ];
      let noteIdx = 0;
      const interval = 135;
      this.bgmTimer = setInterval(() => {
        if (this.muted) return;
        const freq = notes[noteIdx];
        noteIdx = (noteIdx + 1) % notes.length;
        if (freq > 0) {
          this.playSquareTone(freq, 0.09, 0.15);
        }
      }, interval);
    }
    // "William Tell Overture" (Bonus Cherry Mode)
    playBonusBGM() {
      if (this.muted) return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      this.currentBgm = "bonus";
      const notes = [
        587.33,
        587.33,
        587.33,
        587.33,
        587.33,
        587.33,
        587.33,
        659.25,
        739.99,
        587.33,
        659.25,
        739.99,
        783.99,
        739.99,
        659.25,
        587.33,
        554.37,
        587.33
      ];
      let idx = 0;
      this.bgmTimer = setInterval(() => {
        if (this.muted) return;
        const f = notes[idx];
        idx = (idx + 1) % notes.length;
        if (f > 0) {
          this.playSquareTone(f, 0.08, 0.2);
        }
      }, 110);
    }
    // "Funeral March" (Player Death)
    playFuneralMarch() {
      if (this.muted) return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      const marchNotes = [
        { f: 293.66, d: 0.4 },
        // D4
        { f: 293.66, d: 0.4 },
        // D4
        { f: 293.66, d: 0.4 },
        // D4
        { f: 293.66, d: 0.6 },
        // D4
        { f: 349.23, d: 0.3 },
        // F4
        { f: 329.63, d: 0.3 },
        // E4
        { f: 293.66, d: 0.5 }
        // D4
      ];
      let t = this.ctx.currentTime;
      marchNotes.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(note.f, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(1e-3, t + note.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + note.d);
        t += note.d + 0.05;
      });
    }
    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
      this.currentBgm = null;
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
    // --- Sound Effects ---
    playDig() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    }
    playEmerald() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      this.playSquareTone(987.77, 0.08, 0.2);
    }
    playGold() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.playSquareTone(784, 0.07, 0.25);
      setTimeout(() => {
        this.playSquareTone(1046.5, 0.12, 0.25);
      }, 70);
    }
    playShot() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }
    playCrush() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
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

  // digging/js/renderer.js
  var DiggerRenderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = COLS * TILE_WIDTH;
      this.height = ROWS * TILE_HEIGHT;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx.imageSmoothingEnabled = false;
      this.sparkleTimer = 0;
    }
    clear() {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawMap(map) {
      this.sparkleTimer++;
      const ctx = this.ctx;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = map.getTile(c, r);
          const x = c * TILE_WIDTH;
          const y = r * TILE_HEIGHT;
          if (tile === TILE.DIRT || tile === TILE.EMERALD) {
            ctx.fillStyle = "#aa5500";
            ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
            ctx.fillStyle = "#884400";
            ctx.fillRect(x + 4, y + 4, 3, 3);
            ctx.fillRect(x + 18, y + 12, 3, 3);
            ctx.fillRect(x + 10, y + 22, 3, 3);
            ctx.fillRect(x + 24, y + 26, 3, 3);
            if (tile === TILE.EMERALD) {
              this.drawEmerald(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
            }
          }
        }
      }
    }
    drawEmerald(cx, cy) {
      const ctx = this.ctx;
      const w = 12;
      const h = 14;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "#00aa00";
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(w / 2, -h / 6);
      ctx.lineTo(w / 2, h / 6);
      ctx.lineTo(0, h / 2);
      ctx.lineTo(-w / 2, h / 6);
      ctx.lineTo(-w / 2, -h / 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#55ff55";
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 + 2);
      ctx.lineTo(w / 2 - 2, 0);
      ctx.lineTo(0, h / 2 - 2);
      ctx.lineTo(-w / 2 + 2, 0);
      ctx.closePath();
      ctx.fill();
      if (this.sparkleTimer % 30 < 15) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-2, -h / 2 + 3, 3, 3);
      }
      ctx.restore();
    }
    drawBags(bags) {
      bags.forEach((bag) => {
        if (bag.state === BAG_STATE.COLLECTED) return;
        const drawX = bag.x + (bag.wobbleOffset || 0);
        const drawY = bag.y;
        if (bag.state === BAG_STATE.OPEN_GOLD) {
          this.drawOpenGold(drawX, drawY);
        } else {
          this.drawGoldBag(drawX, drawY);
        }
      });
    }
    drawGoldBag(x, y) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "#ffff55";
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 8, TILE_WIDTH - 8, TILE_HEIGHT - 10, 6);
      ctx.fill();
      ctx.fillStyle = "#ffff55";
      ctx.fillRect(x + 10, y + 2, TILE_WIDTH - 20, 6);
      ctx.fillStyle = "#ff5555";
      ctx.fillRect(x + 9, y + 7, TILE_WIDTH - 18, 3);
      ctx.fillStyle = "#00aa00";
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText("$", x + TILE_WIDTH / 2, y + TILE_HEIGHT - 7);
      ctx.restore();
    }
    drawOpenGold(x, y) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "#ffff55";
      ctx.beginPath();
      ctx.ellipse(x + TILE_WIDTH / 2, y + TILE_HEIGHT - 6, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 10, y + TILE_HEIGHT - 9, 3, 3);
      ctx.fillRect(x + 18, y + TILE_HEIGHT - 8, 3, 3);
      ctx.restore();
    }
    drawDigger(digger) {
      const ctx = this.ctx;
      const cx = digger.x + TILE_WIDTH / 2;
      const cy = digger.y + TILE_HEIGHT / 2;
      ctx.save();
      ctx.translate(cx, cy);
      if (digger.isDying) {
        const r = digger.deathTimer * 2 % 24;
        ctx.fillStyle = "#ff5555";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffff55";
        ctx.fillRect(-r / 2, -r / 2, r, r);
        ctx.restore();
        return;
      }
      const facingRight = digger.currentDir === "RIGHT" || digger.currentDir === "DOWN";
      if (!facingRight && digger.currentDir === "LEFT") {
        ctx.scale(-1, 1);
      }
      ctx.fillStyle = "#ffff55";
      ctx.fillRect(-12, -8, 20, 16);
      ctx.fillStyle = "#ff5555";
      ctx.fillRect(-4, -12, 10, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, -10, 4, 3);
      const drillAngle = digger.animFrame * 0.4 % (Math.PI * 2);
      ctx.fillStyle = "#00aaaa";
      ctx.beginPath();
      ctx.arc(10, 0, 8, drillAngle, drillAngle + Math.PI);
      ctx.fill();
      ctx.fillStyle = "#555555";
      ctx.fillRect(-12, 8, 20, 4);
      ctx.fillStyle = "#000000";
      const wheelOffset = digger.animFrame % 6 < 3 ? 0 : 2;
      ctx.fillRect(-10 + wheelOffset, 9, 4, 2);
      ctx.fillRect(-2 + wheelOffset, 9, 4, 2);
      ctx.restore();
      if (digger.shot) {
        this.drawShot(digger.shot);
      }
    }
    drawShot(shot) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "#00ffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawMonsters(monsters, isBonusMode) {
      monsters.forEach((m) => {
        if (m.isDead) return;
        this.drawMonster(m, isBonusMode);
      });
    }
    drawMonster(m, isBonusMode) {
      const ctx = this.ctx;
      const cx = m.x + TILE_WIDTH / 2;
      const cy = m.y + TILE_HEIGHT / 2;
      ctx.save();
      ctx.translate(cx, cy);
      if (isBonusMode) {
        const flash = m.animTimer % 16 < 8;
        ctx.fillStyle = flash ? "#00ffff" : "#0055aa";
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-5, -3, 3, 3);
        ctx.fillRect(2, -3, 3, 3);
        ctx.restore();
        return;
      }
      if (m.type === MONSTER_TYPE.NOBBIN) {
        ctx.fillStyle = "#ff5555";
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6, -5, 4, 6);
        ctx.fillRect(2, -5, 4, 6);
        ctx.fillStyle = "#0000aa";
        const lookDir = m.currentDir === "LEFT" ? -1 : 1;
        ctx.fillRect(-6 + lookDir, -3, 3, 3);
        ctx.fillRect(2 + lookDir, -3, 3, 3);
        const mouthOpen = m.animTimer % 10 < 5;
        ctx.fillStyle = "#000000";
        if (mouthOpen) {
          ctx.fillRect(-5, 4, 10, 4);
        } else {
          ctx.fillRect(-4, 5, 8, 2);
        }
      } else {
        ctx.fillStyle = "#00aa00";
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff55ff";
        ctx.beginPath();
        ctx.moveTo(-9, -8);
        ctx.lineTo(-13, -13);
        ctx.lineTo(-5, -10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, -8);
        ctx.lineTo(13, -13);
        ctx.lineTo(5, -10);
        ctx.fill();
        ctx.fillStyle = "#ff5555";
        ctx.fillRect(-5, -4, 4, 4);
        ctx.fillRect(1, -4, 4, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-6, 3, 3, 3);
        ctx.fillRect(3, 3, 3, 3);
        ctx.fillRect(-2, 5, 4, 3);
      }
      ctx.restore();
    }
    drawCherry(cherry) {
      if (!cherry || !cherry.active) return;
      const ctx = this.ctx;
      const cx = cherry.col * TILE_WIDTH + TILE_WIDTH / 2;
      const cy = cherry.row * TILE_HEIGHT + TILE_HEIGHT / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "#00aa00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(4, -4, -4, 4);
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(8, -2, 6, 5);
      ctx.stroke();
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(-4, 5, 5, 0, Math.PI * 2);
      ctx.arc(6, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-5, 3, 2, 2);
      ctx.fillRect(5, 4, 2, 2);
      ctx.restore();
    }
    drawFloatingScores(floatingScores) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      floatingScores.forEach((item) => {
        ctx.fillStyle = item.color || "#00ffff";
        ctx.fillText(item.text, item.x + TILE_WIDTH / 2, item.y + TILE_HEIGHT / 2);
      });
      ctx.restore();
    }
    drawWeaponHUD(digger) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = "#8888aa";
      ctx.fillText("WEAPON:", 12, this.height - 8);
      const barX = 75;
      const barY = this.height - 15;
      const barW = 50;
      const barH = 7;
      ctx.strokeStyle = "#555555";
      ctx.strokeRect(barX, barY, barW, barH);
      const chargePct = Math.max(0, 1 - digger.rechargeTimer / digger.rechargeMax);
      ctx.fillStyle = chargePct >= 1 ? "#00ff66" : "#ffff00";
      ctx.fillRect(barX + 1, barY + 1, (barW - 2) * chargePct, barH - 2);
      ctx.restore();
    }
    drawOverlay(text, subtext = "", color = "#ffff55") {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = '18px "Press Start 2P", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillText(text, this.width / 2, this.height / 2 - 12);
      if (subtext) {
        ctx.shadowBlur = 0;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(subtext, this.width / 2, this.height / 2 + 20);
      }
      ctx.restore();
    }
  };

  // digging/js/input.js
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
        if (e.cancelable) e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }
    handleTouchEnd(e) {
      if (e.changedTouches.length === 1) {
        if (e.cancelable) e.preventDefault();
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

  // digging/js/index.js
  var DiggerGame = class extends BaseGame {
    constructor(containerElement, options = {}) {
      super(containerElement, options);
      this.lives = 3;
      this.level = 1;
      this.score = 0;
      this.emeraldsInStreak = 0;
      this.floatingScores = [];
      this.gameState = "READY";
      this.stateTimer = 110;
      this.cherry = { active: false, col: 14, row: 0 };
      this.isBonusMode = false;
      this.bonusTimer = 0;
      this.bonusEatMultiplier = 1;
      this.monsters = [];
      this.monstersToSpawn = 5;
      this.spawnCooldown = 60;
      this.monstersKilled = 0;
      this.canvas = document.createElement("canvas");
      this.container.appendChild(this.canvas);
      this.renderer = new DiggerRenderer(this.canvas);
      this.audio = new DiggerAudio();
      if (options.muted) {
        this.audio.setMuted(true);
      }
      this.input = new InputManager();
      this.input.attach(this.container);
      this.speedMultiplier = options.speedMultiplier !== void 0 ? Number(options.speedMultiplier) : 0.5;
      this.timeAccumulator = 0;
      this.rafId = null;
      this.lastTime = 0;
      this.init();
    }
    setSpeedMultiplier(multiplier) {
      const val = Number(multiplier);
      if (!isNaN(val) && val > 0) {
        this.speedMultiplier = val;
      }
    }
    init() {
      this.map = new DiggerMap(this.level - 1);
      this.digger = new DiggerPlayer(this.map);
      this.bags = this.map.initialBagConfigs.map((b) => new GoldBag(b.col, b.row));
      this.monsters = [];
      this.monstersToSpawn = 5 + (this.level - 1) * 2;
      this.monstersKilled = 0;
      this.spawnCooldown = 60;
      this.cherry = { active: false, col: 14, row: 0 };
      this.isBonusMode = false;
      this.bonusTimer = 0;
      this.bindInputs();
      this.audio.playPopcornBGM();
    }
    bindInputs() {
      this.input.onAction("DIR_UP", () => this.digger.setDirection("UP"));
      this.input.onAction("DIR_DOWN", () => this.digger.setDirection("DOWN"));
      this.input.onAction("DIR_LEFT", () => this.digger.setDirection("LEFT"));
      this.input.onAction("DIR_RIGHT", () => this.digger.setDirection("RIGHT"));
      this.onFireWeapon = () => {
        if (this.gameState === "PLAYING") {
          const shot = this.digger.fireWeapon();
          if (shot) {
            this.audio.playShot();
          }
        }
      };
    }
    start() {
      this.isPaused = false;
      this.loop = this.gameLoop.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }
    setMuted(muted) {
      this.audio.setMuted(muted);
    }
    gameLoop(currentTime) {
      if (!this.lastTime) this.lastTime = currentTime;
      const deltaTime = Math.min(currentTime - this.lastTime, 100);
      this.lastTime = currentTime;
      if (!this.isPaused) {
        this.timeAccumulator += deltaTime * this.speedMultiplier;
        const step = 1e3 / 60;
        while (this.timeAccumulator >= step - 1e-3) {
          this.update();
          this.timeAccumulator = Math.max(0, this.timeAccumulator - step);
        }
      }
      this.render();
      this.rafId = requestAnimationFrame(this.loop);
    }
    update() {
      this.floatingScores = this.floatingScores.filter((item) => {
        item.timer--;
        return item.timer > 0;
      });
      if (this.gameState === "READY") {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.gameState = "PLAYING";
          this.audio.playPopcornBGM();
        }
        return;
      }
      if (this.gameState === "LEVEL_CLEAR") {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.nextLevel();
        }
        return;
      }
      if (this.gameState === "DYING") {
        this.digger.update([], null, null);
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (this.lives <= 0) {
            this.gameState = "GAME_OVER";
            this.audio.stopBGM();
            this.onGameOverCallback(this.score);
          } else {
            this.resetPlayerAndMonsters();
            this.gameState = "READY";
            this.stateTimer = 90;
          }
        }
        return;
      }
      if (this.gameState !== "PLAYING") return;
      if (this.isBonusMode) {
        this.bonusTimer--;
        if (this.bonusTimer <= 0) {
          this.isBonusMode = false;
          this.audio.playPopcornBGM();
        }
      }
      if (this.monstersToSpawn > 0 && this.monsters.filter((m) => !m.isDead).length < 3) {
        this.spawnCooldown--;
        if (this.spawnCooldown <= 0) {
          const id = Date.now() + Math.random();
          this.monsters.push(new Monster(id, 14, 0, MONSTER_TYPE.NOBBIN));
          this.monstersToSpawn--;
          this.spawnCooldown = Math.max(90, 180 - this.level * 20);
        }
      }
      this.digger.update(
        this.bags,
        (col, row) => this.handleEmeraldCollected(col, row),
        (col, row) => this.handleDirtDug(col, row)
      );
      this.bags.forEach((bag) => {
        bag.update(this.map, this.bags, (fallingBag) => {
          this.checkBagCrush(fallingBag);
        });
        if (bag.state === BAG_STATE.OPEN_GOLD) {
          const dist = Math.hypot(this.digger.x - bag.x, this.digger.y - bag.y);
          if (dist < TILE_WIDTH * 0.75) {
            bag.state = BAG_STATE.COLLECTED;
            this.addScore(500);
            this.audio.playGold();
            this.addFloatingScore("+500", bag.x, bag.y, "#ffff55");
          }
        }
      });
      if (this.digger.shot) {
        for (const m of this.monsters) {
          if (!m.isDead) {
            const dist = Math.hypot(this.digger.shot.x - (m.x + TILE_WIDTH / 2), this.digger.shot.y - (m.y + TILE_HEIGHT / 2));
            if (dist < 18) {
              m.isDead = true;
              this.digger.shot = null;
              this.monstersKilled++;
              this.addScore(250);
              this.audio.playCrush();
              this.addFloatingScore("+250", m.x, m.y, "#00ffff");
              break;
            }
          }
        }
      }
      for (const m of this.monsters) {
        m.update(this.map, this.digger, this.bags, this.isBonusMode);
        if (!m.isDead) {
          const dist = Math.hypot(this.digger.x - m.x, this.digger.y - m.y);
          if (dist < TILE_WIDTH * 0.7) {
            if (this.isBonusMode) {
              m.isDead = true;
              const points = 200 * this.bonusEatMultiplier;
              this.bonusEatMultiplier *= 2;
              this.addScore(points);
              this.audio.playCrush();
              this.addFloatingScore(`+${points}`, m.x, m.y, "#00ffff");
              this.monstersKilled++;
            } else {
              this.killDigger();
              return;
            }
          }
        }
      }
      const emeraldsCollected = this.map.totalEmeralds - this.map.emeraldsRemaining;
      if (!this.cherry.active && emeraldsCollected >= 14 && !this.cherry.spawned) {
        this.cherry.active = true;
        this.cherry.spawned = true;
      }
      if (this.cherry.active) {
        const cherryX = this.cherry.col * TILE_WIDTH;
        const cherryY = this.cherry.row * TILE_HEIGHT;
        if (Math.hypot(this.digger.x - cherryX, this.digger.y - cherryY) < TILE_WIDTH * 0.75) {
          this.cherry.active = false;
          this.isBonusMode = true;
          this.bonusTimer = 340;
          this.bonusEatMultiplier = 1;
          this.addScore(1e3);
          this.audio.playBonusBGM();
          this.addFloatingScore("+1000", cherryX, cherryY, "#ff0000");
        }
      }
      if (this.map.emeraldsRemaining <= 0 || this.monstersToSpawn <= 0 && this.monsters.every((m) => m.isDead)) {
        this.gameState = "LEVEL_CLEAR";
        this.stateTimer = 90;
        this.audio.stopBGM();
        if (typeof this.options.onLevelClear === "function") {
          this.options.onLevelClear(this.level, this.score);
        }
      }
    }
    handleEmeraldCollected(col, row) {
      this.emeraldsInStreak++;
      let points = 25;
      if (this.emeraldsInStreak % 8 === 0) {
        points = 250;
        this.addFloatingScore("+250 BONUS!", col * TILE_WIDTH, row * TILE_HEIGHT, "#55ff55");
      }
      this.addScore(points);
      this.audio.playEmerald();
    }
    handleDirtDug(col, row) {
      this.emeraldsInStreak = 0;
      this.audio.playDig();
    }
    checkBagCrush(fallingBag) {
      const bagCenterX = fallingBag.x + TILE_WIDTH / 2;
      const bagCenterY = fallingBag.y + TILE_HEIGHT / 2;
      const distPlayer = Math.hypot(this.digger.x + TILE_WIDTH / 2 - bagCenterX, this.digger.y + TILE_HEIGHT / 2 - bagCenterY);
      if (distPlayer < 20) {
        this.killDigger();
        return;
      }
      for (const m of this.monsters) {
        if (!m.isDead) {
          const distM = Math.hypot(m.x + TILE_WIDTH / 2 - bagCenterX, m.y + TILE_HEIGHT / 2 - bagCenterY);
          if (distM < 20) {
            m.isDead = true;
            this.monstersKilled++;
            this.addScore(250);
            this.audio.playCrush();
            this.addFloatingScore("+250 CRUSH!", m.x, m.y, "#ffff55");
          }
        }
      }
    }
    killDigger() {
      this.gameState = "DYING";
      this.stateTimer = 85;
      this.digger.isDying = true;
      this.lives--;
      this.onLivesUpdate(this.lives);
      this.audio.stopBGM();
      this.audio.playFuneralMarch();
    }
    resetPlayerAndMonsters() {
      this.digger.reset();
      this.monsters = [];
      this.spawnCooldown = 40;
      this.isBonusMode = false;
      this.cherry.active = false;
      this.audio.playPopcornBGM();
    }
    nextLevel() {
      this.level++;
      this.onLevelUpdate(this.level);
      this.map.reset(this.level - 1);
      this.bags = this.map.initialBagConfigs.map((b) => new GoldBag(b.col, b.row));
      this.resetPlayerAndMonsters();
      this.monstersToSpawn = 5 + (this.level - 1) * 2;
      this.monstersKilled = 0;
      this.gameState = "READY";
      this.stateTimer = 90;
    }
    addScore(pts) {
      this.score += pts;
      this.onScoreUpdate(this.score);
    }
    addFloatingScore(text, x, y, color) {
      this.floatingScores.push({
        text,
        x,
        y,
        color,
        timer: 40
      });
    }
    render() {
      this.renderer.clear();
      this.renderer.drawMap(this.map);
      this.renderer.drawBags(this.bags);
      this.renderer.drawCherry(this.cherry);
      this.renderer.drawDigger(this.digger);
      this.renderer.drawMonsters(this.monsters, this.isBonusMode);
      this.renderer.drawFloatingScores(this.floatingScores);
      this.renderer.drawWeaponHUD(this.digger);
      if (this.gameState === "READY") {
        this.renderer.drawOverlay("READY!", `STAGE ${this.level}`, "#ffff55");
      } else if (this.gameState === "LEVEL_CLEAR") {
        this.renderer.drawOverlay("STAGE CLEARED!", "BONUS AWARDED", "#55ff55");
      } else if (this.gameState === "GAME_OVER") {
        this.renderer.drawOverlay("GAME OVER", "PRESS RETRY", "#ff5555");
      } else if (this.isPaused) {
        this.renderer.drawOverlay("PAUSED", "PRESS SPACE TO RESUME", "#00ffff");
      }
    }
    pause() {
      super.pause();
      this.audio.stopBGM();
    }
    resume() {
      super.resume();
      if (this.gameState === "PLAYING") {
        if (this.isBonusMode) this.audio.playBonusBGM();
        else this.audio.playPopcornBGM();
      }
    }
    reset() {
      this.lives = 3;
      this.score = 0;
      this.level = 1;
      this.timeAccumulator = 0;
      this.onLivesUpdate(this.lives);
      this.onScoreUpdate(this.score);
      this.onLevelUpdate(this.level);
      this.init();
      this.gameState = "READY";
      this.stateTimer = 90;
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

  // digging/js/storage.js
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

  // digging/js/main.js
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
  var DiggerCabinetApp = class {
    constructor() {
      this.gameInstance = null;
      this.gameId = "digger";
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.speedList = [0.25, 0.5, 0.75, 1];
      const savedSpeed = Number(storage.getSetting("game_speed", 0.5));
      this.currentSpeed = this.speedList.includes(savedSpeed) ? savedSpeed : 0.5;
      this.canvasContainer = document.getElementById("game-canvas-container");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnToggleSpeed = document.getElementById("btn-toggle-speed");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.btnActionFire = document.getElementById("btn-action-fire");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.hudLivesIcons = document.getElementById("hud-lives-icons");
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
      if (this.btnToggleSpeed) {
        this.btnToggleSpeed.textContent = `SPEED: ${Math.round(this.currentSpeed * 100)}%`;
      }
    }
    cycleSpeed() {
      const idx = this.speedList.indexOf(this.currentSpeed);
      const nextIdx = (idx + 1) % this.speedList.length;
      this.currentSpeed = this.speedList[nextIdx];
      storage.setSetting("game_speed", this.currentSpeed);
      if (this.btnToggleSpeed) {
        this.btnToggleSpeed.textContent = `SPEED: ${Math.round(this.currentSpeed * 100)}%`;
      }
      if (this.gameInstance && typeof this.gameInstance.setSpeedMultiplier === "function") {
        this.gameInstance.setSpeedMultiplier(this.currentSpeed);
      }
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
      if (this.btnToggleSpeed) {
        this.btnToggleSpeed.addEventListener("click", () => {
          this.cycleSpeed();
        });
      }
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
        }
      });
      const triggerFire = (e) => {
        e.preventDefault();
        if (this.gameInstance && typeof this.gameInstance.onFireWeapon === "function") {
          this.gameInstance.onFireWeapon();
        }
      };
      if (this.btnActionFire) {
        this.btnActionFire.addEventListener("mousedown", triggerFire);
        this.btnActionFire.addEventListener("touchstart", triggerFire, { passive: false });
      }
      const dpadButtons = [
        { id: "dpad-up", dir: "UP" },
        { id: "dpad-down", dir: "DOWN" },
        { id: "dpad-left", dir: "LEFT" },
        { id: "dpad-right", dir: "RIGHT" }
      ];
      let touchHoldInterval = null;
      const stopHold = () => {
        if (touchHoldInterval) {
          clearInterval(touchHoldInterval);
          touchHoldInterval = null;
        }
      };
      const startHold = (action) => {
        stopHold();
        action();
        touchHoldInterval = setInterval(action, 100);
      };
      dpadButtons.forEach(({ id, dir }) => {
        const btn = document.getElementById(id);
        if (btn) {
          const trigger = () => {
            if (this.gameInstance && this.gameInstance.input) {
              this.gameInstance.input.setDirection(dir);
            }
          };
          btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            startHold(trigger);
          });
          btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startHold(trigger);
          }, { passive: false });
          btn.addEventListener("mouseup", stopHold);
          btn.addEventListener("mouseleave", stopHold);
          btn.addEventListener("touchend", stopHold);
          btn.addEventListener("touchcancel", stopHold);
        }
      });
      window.addEventListener("mouseup", stopHold);
      window.addEventListener("touchend", stopHold);
      window.addEventListener("keydown", (e) => {
        if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
          }
        } else if (e.code === "KeyS") {
          this.cycleSpeed();
        } else if (e.code === "Space" || e.code === "F1") {
          if (this.gameInstance && typeof this.gameInstance.onFireWeapon === "function") {
            e.preventDefault();
            this.gameInstance.onFireWeapon();
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
      this.gameInstance = new DiggerGame(this.canvasContainer, {
        speedMultiplier: this.currentSpeed,
        muted: !this.soundEnabled,
        highScore,
        onScoreUpdate: (score) => {
          this.hudScore.textContent = score.toString().padStart(4, "0");
          if (score > highScore) {
            this.hudHighScore.textContent = score.toString().padStart(4, "0");
            storage.setHighScore(this.gameId, score);
          }
        },
        onLevelClear: (level, score) => {
          recordGameActivity({ gameId: "digging", level, score, status: "complete", result: "LEVEL CLEAR" });
        },
        onGameOver: (finalScore) => {
          storage.setHighScore(this.gameId, finalScore);
          recordGameActivity({ gameId: "digging", level: this.gameInstance?.level || 1, score: finalScore, status: "complete", result: "GAME OVER" });
        },
        onLivesUpdate: (lives) => {
          this.updateLivesHUD(lives);
        },
        onLevelUpdate: (level) => {
          this.hudLevelNum.textContent = level.toString();
        }
      });
      this.updateLivesHUD(3);
      this.gameInstance.start();
    }
    updateLivesHUD(count) {
      this.hudLivesIcons.innerHTML = "";
      for (let i = 0; i < Math.max(0, count); i++) {
        const icon = document.createElement("div");
        icon.className = "life-icon digger-life";
        this.hudLivesIcons.appendChild(icon);
      }
    }
  };
  function boot() {
    new DiggerCabinetApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
