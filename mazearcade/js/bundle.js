(() => {
  // mazearcade/js/baseGame.js
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

  // mazearcade/js/map.js
  var TILE_SIZE = 16;
  var COLS = 28;
  var ROWS = 31;
  var TILE = {
    EMPTY: 0,
    WALL: 1,
    PELLET: 2,
    ENERGIZER: 3,
    GATE: 4,
    HOUSE: 5
  };
  var INITIAL_MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 4, 4, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 5, 5, 5, 5, 5, 5, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 5, 5, 5, 5, 5, 5, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
    // Row 14: Tunnel exits
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 5, 5, 5, 5, 5, 5, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
    [1, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 3, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];
  var GameMap = class {
    constructor() {
      this.reset();
    }
    reset() {
      this.grid = INITIAL_MAP.map((row) => [...row]);
      this.totalPellets = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.grid[r][c] === TILE.PELLET || this.grid[r][c] === TILE.ENERGIZER) {
            this.totalPellets++;
          }
        }
      }
      this.pelletsRemaining = this.totalPellets;
    }
    isWall(col, row) {
      if (row === 14 && (col < 0 || col >= COLS)) {
        return false;
      }
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
        return true;
      }
      return this.grid[row][col] === TILE.WALL;
    }
    isGate(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      return this.grid[row][col] === TILE.GATE;
    }
    isHouse(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      return this.grid[row][col] === TILE.HOUSE;
    }
    getTile(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return TILE.EMPTY;
      return this.grid[row][col];
    }
    consumePellet(col, row) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
      const tile = this.grid[row][col];
      if (tile === TILE.PELLET) {
        this.grid[row][col] = TILE.EMPTY;
        this.pelletsRemaining--;
        return "PELLET";
      }
      if (tile === TILE.ENERGIZER) {
        this.grid[row][col] = TILE.EMPTY;
        this.pelletsRemaining--;
        return "ENERGIZER";
      }
      return null;
    }
  };

  // mazearcade/js/pacman.js
  var DIRECTIONS = {
    UP: { x: 0, y: -1, angle: 1.5 * Math.PI },
    DOWN: { x: 0, y: 1, angle: 0.5 * Math.PI },
    LEFT: { x: -1, y: 0, angle: Math.PI },
    RIGHT: { x: 1, y: 0, angle: 0 },
    NONE: { x: 0, y: 0, angle: 0 }
  };
  var Pacman = class {
    constructor(map, speedMultiplier = 1) {
      this.map = map;
      this.startCol = 13;
      this.startRow = 23;
      this.baseSpeed = 1.4;
      this.speedMultiplier = speedMultiplier;
      this.reset();
    }
    setSpeedMultiplier(multiplier) {
      this.speedMultiplier = multiplier;
      this.speed = this.baseSpeed * (this.speedMultiplier || 1);
    }
    reset() {
      this.x = this.startCol * TILE_SIZE;
      this.y = this.startRow * TILE_SIZE;
      this.currentDir = "LEFT";
      this.nextDir = "LEFT";
      this.speed = this.baseSpeed * (this.speedMultiplier || 1);
      this.mouthAngle = 0.2;
      this.mouthDir = 1;
      this.isDying = false;
      this.deathProgress = 0;
    }
    setDesiredDirection(dir) {
      if (!DIRECTIONS[dir]) return;
      const cur = DIRECTIONS[this.currentDir];
      const next = DIRECTIONS[dir];
      if (cur && cur.x + next.x === 0 && cur.y + next.y === 0) {
        this.currentDir = dir;
        this.nextDir = dir;
        return;
      }
      this.nextDir = dir;
    }
    canMove(col, row, dirName) {
      const dir = DIRECTIONS[dirName];
      if (!dir || dir.x === 0 && dir.y === 0) return true;
      const targetCol = col + dir.x;
      const targetRow = row + dir.y;
      if (targetRow === 14 && (targetCol < 0 || targetCol >= COLS)) {
        return true;
      }
      return !this.map.isWall(targetCol, targetRow) && !this.map.isGate(targetCol, targetRow);
    }
    update() {
      if (this.isDying) {
        this.deathProgress = Math.min(1, this.deathProgress + 0.02);
        return;
      }
      const mapWidth = COLS * TILE_SIZE;
      if (this.x < -TILE_SIZE / 2) {
        this.x = mapWidth - TILE_SIZE / 2;
      } else if (this.x > mapWidth - TILE_SIZE / 2) {
        this.x = -TILE_SIZE / 2;
      }
      const currentTileCol = Math.round(this.x / TILE_SIZE);
      const currentTileRow = Math.round(this.y / TILE_SIZE);
      const tileCenterX = currentTileCol * TILE_SIZE;
      const tileCenterY = currentTileRow * TILE_SIZE;
      const distToCenter = Math.hypot(this.x - tileCenterX, this.y - tileCenterY);
      if (this.nextDir !== this.currentDir && distToCenter <= Math.max(this.speed, 1.5)) {
        if (this.canMove(currentTileCol, currentTileRow, this.nextDir)) {
          this.x = tileCenterX;
          this.y = tileCenterY;
          this.currentDir = this.nextDir;
        }
      }
      const curVec = DIRECTIONS[this.currentDir];
      if (curVec) {
        const willPassCenter = curVec.x !== 0 && Math.sign(tileCenterX - this.x) !== Math.sign(tileCenterX - (this.x + curVec.x * this.speed)) || curVec.y !== 0 && Math.sign(tileCenterY - this.y) !== Math.sign(tileCenterY - (this.y + curVec.y * this.speed));
        if (willPassCenter && !this.canMove(currentTileCol, currentTileRow, this.currentDir)) {
          this.x = tileCenterX;
          this.y = tileCenterY;
        } else {
          this.x += curVec.x * this.speed;
          this.y += curVec.y * this.speed;
          this.mouthAngle += 0.025 * this.mouthDir;
          if (this.mouthAngle >= 0.45) {
            this.mouthAngle = 0.45;
            this.mouthDir = -1;
          } else if (this.mouthAngle <= 0.04) {
            this.mouthAngle = 0.04;
            this.mouthDir = 1;
          }
        }
      }
    }
    getCol() {
      return Math.round(this.x / TILE_SIZE);
    }
    getRow() {
      return Math.round(this.y / TILE_SIZE);
    }
  };

  // mazearcade/js/ghost.js
  var GHOST_STATE = {
    HOUSE: "HOUSE",
    EXITING: "EXITING",
    CHASE: "CHASE",
    SCATTER: "SCATTER",
    FRIGHTENED: "FRIGHTENED",
    EATEN: "EATEN",
    ENTERING_HOUSE: "ENTERING_HOUSE"
  };
  var OPPOSITES = {
    UP: "DOWN",
    DOWN: "UP",
    LEFT: "RIGHT",
    RIGHT: "LEFT"
  };
  var DOOR_COL = 13;
  var DOOR_ROW = 11;
  var DOOR_X = DOOR_COL * TILE_SIZE;
  var DOOR_Y = DOOR_ROW * TILE_SIZE;
  var HOUSE_Y = 14 * TILE_SIZE;
  var Ghost = class {
    constructor(name, color, startCol, startRow, scatterCol, scatterRow, map, speedMultiplier = 1) {
      this.name = name;
      this.color = color;
      this.startCol = startCol;
      this.startRow = startRow;
      this.scatterCol = scatterCol;
      this.scatterRow = scatterRow;
      this.map = map;
      this.baseSpeed = 1.3;
      this.speedMultiplier = speedMultiplier;
      this.reset();
    }
    setSpeedMultiplier(mult) {
      this.speedMultiplier = mult;
      this.updateSpeed();
    }
    updateSpeed() {
      const mult = this.speedMultiplier || 1;
      if (this.state === GHOST_STATE.EATEN || this.state === GHOST_STATE.ENTERING_HOUSE) {
        this.speed = this.baseSpeed * 2.1 * mult;
      } else if (this.state === GHOST_STATE.FRIGHTENED) {
        this.speed = this.baseSpeed * 0.55 * mult;
      } else {
        this.speed = this.baseSpeed * mult;
      }
    }
    reset() {
      this.x = this.startCol * TILE_SIZE;
      this.y = this.startRow * TILE_SIZE;
      this.currentDir = "LEFT";
      this.state = this.name === "Blinky" ? GHOST_STATE.SCATTER : GHOST_STATE.HOUSE;
      this.updateSpeed();
      this.frightenedTimer = 0;
      this.frightenedFlash = false;
      this.houseExitTimer = this.getInitialHouseDelay();
      this.animationTimer = 0;
      this.lastTileCol = -1;
      this.lastTileRow = -1;
    }
    getInitialHouseDelay() {
      switch (this.name) {
        case "Blinky":
          return 0;
        case "Pinky":
          return 50;
        // ~0.8s
        case "Inky":
          return 220;
        // ~3.5s
        case "Clyde":
          return 380;
        // ~6.3s
        default:
          return 0;
      }
    }
    setFrightened(durationFrames = 360) {
      if (this.state === GHOST_STATE.EATEN || this.state === GHOST_STATE.ENTERING_HOUSE) {
        return;
      }
      this.frightenedTimer = durationFrames;
      this.frightenedFlash = false;
      if (this.state === GHOST_STATE.CHASE || this.state === GHOST_STATE.SCATTER) {
        this.state = GHOST_STATE.FRIGHTENED;
        this.updateSpeed();
        if (OPPOSITES[this.currentDir]) {
          this.currentDir = OPPOSITES[this.currentDir];
        }
      }
    }
    eat() {
      this.state = GHOST_STATE.EATEN;
      this.updateSpeed();
      this.frightenedTimer = 0;
      this.frightenedFlash = false;
    }
    getCol() {
      return Math.round(this.x / TILE_SIZE);
    }
    getRow() {
      return Math.round(this.y / TILE_SIZE);
    }
    update(pacman, blinky, globalState, globalFrightened = false) {
      this.animationTimer++;
      if (this.state === GHOST_STATE.HOUSE) {
        if (this.houseExitTimer > 0) {
          this.houseExitTimer--;
          const centerY = this.startRow * TILE_SIZE;
          this.y = centerY + Math.sin(this.animationTimer * 0.12) * 3;
          return;
        }
        this.state = GHOST_STATE.EXITING;
      }
      if (this.state === GHOST_STATE.EXITING) {
        const diffX = DOOR_X - this.x;
        if (Math.abs(diffX) > 1.2) {
          this.x += Math.sign(diffX) * 1.5;
          this.currentDir = diffX > 0 ? "RIGHT" : "LEFT";
          return;
        }
        this.x = DOOR_X;
        const diffY = DOOR_Y - this.y;
        if (Math.abs(diffY) > 1.5) {
          this.y += Math.sign(diffY) * 1.5;
          this.currentDir = "UP";
          return;
        }
        this.x = DOOR_X;
        this.y = DOOR_Y;
        this.state = globalFrightened ? GHOST_STATE.FRIGHTENED : globalState;
        this.updateSpeed();
        this.currentDir = "LEFT";
        this.lastTileCol = DOOR_COL;
        this.lastTileRow = DOOR_ROW;
        return;
      }
      if (this.state === GHOST_STATE.EATEN) {
        const distToDoor = Math.hypot(this.x - DOOR_X, this.y - DOOR_Y);
        if (distToDoor <= this.speed + 2) {
          this.x = DOOR_X;
          this.y = DOOR_Y;
          this.state = GHOST_STATE.ENTERING_HOUSE;
          this.currentDir = "DOWN";
          return;
        }
      }
      if (this.state === GHOST_STATE.ENTERING_HOUSE) {
        this.x = DOOR_X;
        this.currentDir = "DOWN";
        this.y += 2 * (this.speedMultiplier || 1);
        if (this.y >= HOUSE_Y) {
          this.y = HOUSE_Y;
          this.state = GHOST_STATE.HOUSE;
          this.houseExitTimer = 45;
          this.updateSpeed();
          this.frightenedTimer = 0;
        }
        return;
      }
      if (this.state === GHOST_STATE.FRIGHTENED) {
        this.frightenedTimer--;
        this.frightenedFlash = this.frightenedTimer < 120 && Math.floor(this.frightenedTimer / 15) % 2 === 1;
        if (this.frightenedTimer <= 0) {
          this.state = globalState;
          this.updateSpeed();
        }
      }
      this.updateGridMovement(pacman, blinky, globalState);
    }
    updateGridMovement(pacman, blinky, globalState) {
      const vec = DIRECTIONS[this.currentDir] || { x: 0, y: 0 };
      if (vec.x === 0 && vec.y === 0) return;
      const mapWidth = COLS * TILE_SIZE;
      if (this.x < -TILE_SIZE / 2) {
        this.x = mapWidth - TILE_SIZE / 2;
        return;
      } else if (this.x > mapWidth - TILE_SIZE / 2) {
        this.x = -TILE_SIZE / 2;
        return;
      }
      const currentTileCol = Math.round(this.x / TILE_SIZE);
      const currentTileRow = Math.round(this.y / TILE_SIZE);
      const centerX = currentTileCol * TILE_SIZE;
      const centerY = currentTileRow * TILE_SIZE;
      const nextX = this.x + vec.x * this.speed;
      const nextY = this.y + vec.y * this.speed;
      const crossedX = vec.x > 0 && this.x < centerX && nextX >= centerX || vec.x < 0 && this.x > centerX && nextX <= centerX;
      const crossedY = vec.y > 0 && this.y < centerY && nextY >= centerY || vec.y < 0 && this.y > centerY && nextY <= centerY;
      const isNewTile = currentTileCol !== this.lastTileCol || currentTileRow !== this.lastTileRow;
      if ((crossedX || crossedY) && isNewTile) {
        const remainder = crossedX ? Math.abs(nextX - centerX) : Math.abs(nextY - centerY);
        this.x = centerX;
        this.y = centerY;
        this.lastTileCol = currentTileCol;
        this.lastTileRow = currentTileRow;
        this.chooseNextDirection(pacman, blinky, globalState);
        const newVec = DIRECTIONS[this.currentDir];
        if (newVec) {
          this.x += newVec.x * remainder;
          this.y += newVec.y * remainder;
        }
      } else {
        this.x = nextX;
        this.y = nextY;
      }
    }
    getTargetTile(pacman, blinky, globalState) {
      if (this.state === GHOST_STATE.EATEN) {
        return { col: DOOR_COL, row: DOOR_ROW };
      }
      if (this.state === GHOST_STATE.SCATTER) {
        return { col: this.scatterCol, row: this.scatterRow };
      }
      const pCol = pacman.getCol();
      const pRow = pacman.getRow();
      const pDir = DIRECTIONS[pacman.currentDir] || { x: 0, y: 0 };
      switch (this.name) {
        case "Blinky":
          return { col: pCol, row: pRow };
        case "Pinky":
          return { col: pCol + pDir.x * 4, row: pRow + pDir.y * 4 };
        case "Inky": {
          const aheadCol = pCol + pDir.x * 2;
          const aheadRow = pRow + pDir.y * 2;
          const bCol = blinky ? blinky.getCol() : pCol;
          const bRow = blinky ? blinky.getRow() : pRow;
          return {
            col: aheadCol + (aheadCol - bCol),
            row: aheadRow + (aheadRow - bRow)
          };
        }
        case "Clyde": {
          const dist = Math.hypot(this.getCol() - pCol, this.getRow() - pRow);
          if (dist > 8) {
            return { col: pCol, row: pRow };
          } else {
            return { col: this.scatterCol, row: this.scatterRow };
          }
        }
        default:
          return { col: pCol, row: pRow };
      }
    }
    chooseNextDirection(pacman, blinky, globalState) {
      const currentCol = this.getCol();
      const currentRow = this.getRow();
      const candidates = ["UP", "LEFT", "DOWN", "RIGHT"];
      const validDirs = [];
      const reverseDir = OPPOSITES[this.currentDir];
      for (const dir of candidates) {
        if (dir === reverseDir) continue;
        const vec = DIRECTIONS[dir];
        const nextCol = currentCol + vec.x;
        const nextRow = currentRow + vec.y;
        if (nextRow === 14 && (nextCol < 0 || nextCol >= COLS)) {
          validDirs.push(dir);
          continue;
        }
        if (this.map.isWall(nextCol, nextRow)) continue;
        if (this.map.isGate(nextCol, nextRow)) {
          if (this.state !== GHOST_STATE.EATEN && this.state !== GHOST_STATE.ENTERING_HOUSE) {
            continue;
          }
        }
        validDirs.push(dir);
      }
      if (validDirs.length === 0) {
        this.currentDir = reverseDir || "LEFT";
        return;
      }
      if (this.state === GHOST_STATE.FRIGHTENED) {
        const randIdx = Math.floor(Math.random() * validDirs.length);
        this.currentDir = validDirs[randIdx];
        return;
      }
      const target = this.getTargetTile(pacman, blinky, globalState);
      let bestDir = validDirs[0];
      let bestDist = Infinity;
      for (const dir of validDirs) {
        const vec = DIRECTIONS[dir];
        const nextCol = currentCol + vec.x;
        const nextRow = currentRow + vec.y;
        const dist = (nextCol - target.col) ** 2 + (nextRow - target.row) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      }
      this.currentDir = bestDir;
    }
  };

  // mazearcade/js/audio.js
  var PacmanAudio = class {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.muted = false;
      this.wakaAlternator = false;
      this.sirenOsc = null;
      this.sirenGain = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.15;
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
        this.masterGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
      }
      if (muted) {
        this.stopSiren();
      }
    }
    playChomp() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      const freq = this.wakaAlternator ? 480 : 330;
      this.wakaAlternator = !this.wakaAlternator;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.08);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.085);
    }
    playEatGhost() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.3);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    }
    playDeath() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      const steps = [
        { f: 600, dur: 0.1 },
        { f: 550, dur: 0.1 },
        { f: 500, dur: 0.1 },
        { f: 450, dur: 0.1 },
        { f: 400, dur: 0.1 },
        { f: 350, dur: 0.1 },
        { f: 300, dur: 0.1 },
        { f: 250, dur: 0.15 },
        { f: 180, dur: 0.2 },
        { f: 100, dur: 0.3 }
      ];
      let timeOffset = 0;
      osc.frequency.setValueAtTime(steps[0].f, t);
      steps.forEach((step) => {
        osc.frequency.setValueAtTime(step.f, t + timeOffset);
        timeOffset += step.dur;
      });
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + timeOffset);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + timeOffset);
    }
    playStartJingle() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [
        { f: 493.88, d: 0.12 },
        // B4
        { f: 987.77, d: 0.12 },
        // B5
        { f: 739.99, d: 0.12 },
        // F#5
        { f: 622.25, d: 0.12 },
        // D#5
        { f: 987.77, d: 0.1 },
        // B5
        { f: 739.99, d: 0.15 },
        // F#5
        { f: 622.25, d: 0.25 }
        // D#5
      ];
      let offset = 0;
      notes.forEach((note) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(note.f, t + offset);
        gain.gain.setValueAtTime(0.25, t + offset);
        gain.gain.exponentialRampToValueAtTime(1e-3, t + offset + note.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + offset);
        osc.stop(t + offset + note.d);
        offset += note.d + 0.02;
      });
    }
    startSiren() {
      if (this.muted || this.sirenOsc) return;
      this.init();
      if (!this.ctx) return;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = "sawtooth";
      this.sirenOsc.frequency.setValueAtTime(200, this.ctx.currentTime);
      const lfo = this.ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 4;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 60;
      lfo.connect(this.sirenOsc.frequency);
      lfo.start();
      this.sirenGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);
      this.sirenOsc.start();
    }
    stopSiren() {
      if (this.sirenOsc) {
        try {
          this.sirenOsc.stop();
          this.sirenOsc.disconnect();
        } catch {
        }
        this.sirenOsc = null;
        this.sirenGain = null;
      }
    }
    destroy() {
      this.stopSiren();
      if (this.ctx) {
        try {
          this.ctx.close();
        } catch {
        }
        this.ctx = null;
      }
    }
  };

  // mazearcade/js/renderer.js
  var PacmanRenderer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = COLS * TILE_SIZE;
      this.height = ROWS * TILE_SIZE;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.pulseTimer = 0;
    }
    clear() {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    drawMap(map) {
      this.pulseTimer++;
      const energizerPulse = Math.sin(this.pulseTimer * 0.1) > -0.2;
      const ctx = this.ctx;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = map.getTile(c, r);
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;
          if (tile === TILE.WALL) {
            this.drawWallTile(c, r, map);
          } else if (tile === TILE.GATE) {
            ctx.fillStyle = "#ffb8ff";
            ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
          } else if (tile === TILE.PELLET) {
            ctx.fillStyle = "#ffb8ae";
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === TILE.ENERGIZER) {
            if (energizerPulse) {
              ctx.fillStyle = "#ffb8ae";
              ctx.shadowColor = "#ffff88";
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
      }
    }
    drawWallTile(c, r, map) {
      const ctx = this.ctx;
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const half = TILE_SIZE / 2;
      ctx.fillStyle = "#001133";
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = "#2121ff";
      ctx.lineWidth = 2.5;
      const top = map.isWall(c, r - 1);
      const bottom = map.isWall(c, r + 1);
      const left = map.isWall(c - 1, r);
      const right = map.isWall(c + 1, r);
      ctx.beginPath();
      if (!top) {
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + TILE_SIZE, y + 2);
      }
      if (!bottom) {
        ctx.moveTo(x, y + TILE_SIZE - 2);
        ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE - 2);
      }
      if (!left) {
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + 2, y + TILE_SIZE);
      }
      if (!right) {
        ctx.moveTo(x + TILE_SIZE - 2, y);
        ctx.lineTo(x + TILE_SIZE - 2, y + TILE_SIZE);
      }
      ctx.stroke();
    }
    drawPacman(pacman) {
      const ctx = this.ctx;
      const centerX = pacman.x + TILE_SIZE / 2;
      const centerY = pacman.y + TILE_SIZE / 2;
      const radius = TILE_SIZE * 0.75;
      ctx.save();
      ctx.translate(centerX, centerY);
      if (pacman.isDying) {
        ctx.fillStyle = "#ffff00";
        const open = Math.PI * pacman.deathProgress;
        if (open < Math.PI) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, open, Math.PI * 2 - open);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        return;
      }
      const dirInfo = DIRECTIONS[pacman.currentDir] || DIRECTIONS.RIGHT;
      ctx.rotate(dirInfo.angle);
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      const mouth = pacman.mouthAngle * Math.PI;
      ctx.arc(0, 0, radius, mouth, Math.PI * 2 - mouth);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    drawGhost(ghost) {
      const ctx = this.ctx;
      const centerX = ghost.x + TILE_SIZE / 2;
      const centerY = ghost.y + TILE_SIZE / 2;
      const radius = TILE_SIZE * 0.7;
      ctx.save();
      ctx.translate(centerX, centerY);
      const isEaten = ghost.state === GHOST_STATE.EATEN || ghost.state === GHOST_STATE.ENTERING_HOUSE;
      const isFrightened = ghost.state === GHOST_STATE.FRIGHTENED;
      if (!isEaten) {
        let bodyColor = ghost.color;
        if (isFrightened) {
          bodyColor = ghost.frightenedFlash ? "#ffffff" : "#2121ff";
        }
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -2, radius, Math.PI, 0, false);
        ctx.lineTo(radius, radius);
        const wave = Math.sin(ghost.animationTimer * 0.2) > 0;
        const skirtY = radius;
        const step = radius * 2 / 3;
        if (wave) {
          ctx.lineTo(radius - step * 0.5, skirtY - 3);
          ctx.lineTo(radius - step, skirtY);
          ctx.lineTo(radius - step * 1.5, skirtY - 3);
          ctx.lineTo(radius - step * 2, skirtY);
          ctx.lineTo(radius - step * 2.5, skirtY - 3);
          ctx.lineTo(-radius, skirtY);
        } else {
          ctx.lineTo(radius - step * 0.5, skirtY);
          ctx.lineTo(radius - step, skirtY - 3);
          ctx.lineTo(radius - step * 1.5, skirtY);
          ctx.lineTo(radius - step * 2, skirtY - 3);
          ctx.lineTo(radius - step * 2.5, skirtY);
          ctx.lineTo(-radius, skirtY - 3);
        }
        ctx.closePath();
        ctx.fill();
      }
      this.drawGhostEyes(ctx, ghost, isFrightened);
      ctx.restore();
    }
    drawGhostEyes(ctx, ghost, isFrightened) {
      if (isFrightened) {
        ctx.fillStyle = ghost.frightenedFlash ? "#ff0000" : "#ffb8ae";
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ghost.frightenedFlash ? "#ff0000" : "#ffb8ae";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, 5);
        ctx.lineTo(-3, 3);
        ctx.lineTo(0, 5);
        ctx.lineTo(3, 3);
        ctx.lineTo(6, 5);
        ctx.stroke();
        return;
      }
      const dir = DIRECTIONS[ghost.currentDir] || DIRECTIONS.UP;
      const pupilOffsetX = dir.x * 2.5;
      const pupilOffsetY = dir.y * 2.5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(-4, -2, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(4, -2, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2121de";
      ctx.beginPath();
      ctx.arc(-4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
      ctx.arc(4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFloatingScores(floatingScores) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillStyle = "#00ffff";
      floatingScores.forEach((item) => {
        ctx.fillText(item.points.toString(), item.x + TILE_SIZE / 2, item.y + TILE_SIZE / 2);
      });
      ctx.restore();
    }
    drawOverlay(text, subtext = "", color = "#ffff00") {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(text, this.width / 2, this.height / 2 - 10);
      if (subtext) {
        ctx.shadowBlur = 0;
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = "#ffffff";
        ctx.fillText(subtext, this.width / 2, this.height / 2 + 25);
      }
      ctx.restore();
    }
  };

  // mazearcade/js/input.js
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

  // mazearcade/js/index.js
  var PacmanGame = class extends BaseGame {
    constructor(containerElement, options = {}) {
      super(containerElement, options);
      this.lives = 3;
      this.level = 1;
      this.score = 0;
      this.ghostEatMultiplier = 1;
      this.floatingScores = [];
      this.cycleTimer = 0;
      this.globalGhostState = GHOST_STATE.SCATTER;
      this.gameState = "READY";
      this.stateTimer = 120;
      this.canvas = document.createElement("canvas");
      this.container.appendChild(this.canvas);
      this.renderer = new PacmanRenderer(this.canvas);
      this.audio = new PacmanAudio();
      if (options.muted) {
        this.audio.setMuted(true);
      }
      this.input = new InputManager();
      this.input.attach(this.container);
      this.speedMultiplier = options.speed || 1;
      this.rafId = null;
      this.lastTime = 0;
      this.accumulator = 0;
      this.init();
    }
    setSpeed(multiplier) {
      this.speedMultiplier = Number(multiplier) || 1;
      if (this.pacman) {
        this.pacman.setSpeedMultiplier(this.speedMultiplier);
      }
      if (this.ghosts) {
        this.ghosts.forEach((g) => g.setSpeedMultiplier(this.speedMultiplier));
      }
    }
    init() {
      this.map = new GameMap();
      this.pacman = new Pacman(this.map, this.speedMultiplier);
      this.ghosts = [
        new Ghost("Blinky", "#ff0000", 13, 11, 25, 0, this.map, this.speedMultiplier),
        new Ghost("Pinky", "#ffb8ff", 13, 14, 2, 0, this.map, this.speedMultiplier),
        new Ghost("Inky", "#00ffff", 11, 14, 27, 31, this.map, this.speedMultiplier),
        new Ghost("Clyde", "#ffb851", 15, 14, 0, 31, this.map, this.speedMultiplier)
      ];
      this.blinky = this.ghosts[0];
      this.input.onAction("DIR_UP", () => this.pacman.setDesiredDirection("UP"));
      this.input.onAction("DIR_DOWN", () => this.pacman.setDesiredDirection("DOWN"));
      this.input.onAction("DIR_LEFT", () => this.pacman.setDesiredDirection("LEFT"));
      this.input.onAction("DIR_RIGHT", () => this.pacman.setDesiredDirection("RIGHT"));
      this.audio.playStartJingle();
    }
    start() {
      this.isPaused = false;
      this.loop = this.gameLoop.bind(this);
      this.rafId = requestAnimationFrame(this.loop);
    }
    setMuted(muted) {
      this.audio.setMuted(muted);
    }
    resetPositions() {
      this.pacman.reset();
      this.ghosts.forEach((g) => g.reset());
      this.ghostEatMultiplier = 1;
      this.globalGhostState = GHOST_STATE.SCATTER;
      this.cycleTimer = 0;
    }
    nextLevel() {
      this.level++;
      this.onLevelUpdate(this.level);
      this.map.reset();
      this.resetPositions();
      this.gameState = "READY";
      this.stateTimer = 90;
      this.audio.playStartJingle();
    }
    gameLoop(currentTime) {
      if (!this.lastTime) {
        this.lastTime = currentTime;
        this.accumulator = 0;
      }
      const dt = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      if (!this.isPaused) {
        const step = 1 / 60;
        this.accumulator = (this.accumulator || 0) + dt;
        while (this.accumulator >= step) {
          this.update();
          this.accumulator -= step;
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
        this.pacman.update();
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (this.lives <= 0) {
            this.gameState = "GAME_OVER";
            this.audio.stopSiren();
            this.onGameOverCallback(this.score);
          } else {
            this.resetPositions();
            this.gameState = "READY";
            this.stateTimer = 90;
          }
        }
        return;
      }
      if (this.gameState !== "PLAYING") return;
      this.cycleTimer++;
      const cyclePhase = Math.floor(this.cycleTimer / 60) % 27;
      if (cyclePhase < 7) {
        this.globalGhostState = GHOST_STATE.SCATTER;
      } else {
        this.globalGhostState = GHOST_STATE.CHASE;
      }
      this.pacman.update();
      const pCol = this.pacman.getCol();
      const pRow = this.pacman.getRow();
      const pelletType = this.map.consumePellet(pCol, pRow);
      if (pelletType === "PELLET") {
        this.addScore(10);
        this.audio.playChomp();
      } else if (pelletType === "ENERGIZER") {
        this.addScore(50);
        this.ghostEatMultiplier = 1;
        this.audio.startSiren();
        const frightenedDuration = Math.max(180, 420 - (this.level - 1) * 40);
        this.ghosts.forEach((g) => g.setFrightened(frightenedDuration));
      }
      if (this.map.pelletsRemaining <= 0) {
        this.gameState = "LEVEL_CLEAR";
        this.stateTimer = 90;
        this.audio.stopSiren();
        if (typeof this.options.onLevelClear === "function") {
          this.options.onLevelClear(this.level, this.score);
        }
        return;
      }
      const isGlobalFrightened = this.ghosts.some((g) => g.state === GHOST_STATE.FRIGHTENED);
      let anyFrightened = false;
      for (const ghost of this.ghosts) {
        ghost.update(this.pacman, this.blinky, this.globalGhostState, isGlobalFrightened);
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
          anyFrightened = true;
        }
        const dist = Math.hypot(this.pacman.x - ghost.x, this.pacman.y - ghost.y);
        if (dist < TILE_SIZE * 0.75) {
          if (ghost.state === GHOST_STATE.FRIGHTENED) {
            const points = 200 * this.ghostEatMultiplier;
            this.ghostEatMultiplier *= 2;
            this.addScore(points);
            this.audio.playEatGhost();
            ghost.eat();
            this.floatingScores.push({
              points,
              x: ghost.x,
              y: ghost.y,
              timer: 45
            });
          } else if (ghost.state !== GHOST_STATE.EATEN && ghost.state !== GHOST_STATE.ENTERING_HOUSE && ghost.state !== GHOST_STATE.HOUSE && ghost.state !== GHOST_STATE.EXITING) {
            this.gameState = "DYING";
            this.stateTimer = 90;
            this.pacman.isDying = true;
            this.lives--;
            this.onLivesUpdate(this.lives);
            this.audio.stopSiren();
            this.audio.playDeath();
            break;
          }
        }
      }
      if (!anyFrightened) {
        this.audio.stopSiren();
      }
    }
    addScore(pts) {
      this.score += pts;
      this.onScoreUpdate(this.score);
    }
    render() {
      this.renderer.clear();
      this.renderer.drawMap(this.map);
      this.renderer.drawPacman(this.pacman);
      for (const ghost of this.ghosts) {
        this.renderer.drawGhost(ghost);
      }
      this.renderer.drawFloatingScores(this.floatingScores);
      if (this.gameState === "READY") {
        this.renderer.drawOverlay("READY!", "GET READY!", "#ffff00");
      } else if (this.gameState === "LEVEL_CLEAR") {
        this.renderer.drawOverlay("CLEARED!", "BONUS STAGE", "#00ffcc");
      } else if (this.gameState === "GAME_OVER") {
        this.renderer.drawOverlay("GAME OVER", "PRESS RETRY", "#ff2255");
      } else if (this.isPaused) {
        this.renderer.drawOverlay("PAUSED", "PRESS SPACE TO RESUME", "#00e5ff");
      }
    }
    pause() {
      super.pause();
      this.audio.stopSiren();
    }
    resume() {
      super.resume();
    }
    reset() {
      this.lives = 3;
      this.score = 0;
      this.level = 1;
      this.onLivesUpdate(this.lives);
      this.onScoreUpdate(this.score);
      this.onLevelUpdate(this.level);
      this.map.reset();
      this.resetPositions();
      this.gameState = "READY";
      this.stateTimer = 90;
      this.audio.playStartJingle();
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

  // mazearcade/js/storage.js
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

  // mazearcade/js/main.js
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
  var PacmanCabinetApp = class {
    constructor() {
      this.gameInstance = null;
      this.gameId = "pacman";
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.gameSpeed = storage.getSetting("game_speed", 1);
      this.canvasContainer = document.getElementById("game-canvas-container");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.speedBtns = document.querySelectorAll(".speed-btn");
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
      this.speedBtns.forEach((btn) => {
        const spd = parseFloat(btn.dataset.speed) || 1;
        btn.classList.toggle("active", spd === this.gameSpeed);
      });
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
      this.speedBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const speed = parseFloat(btn.dataset.speed) || 1;
          this.gameSpeed = speed;
          storage.setSetting("game_speed", this.gameSpeed);
          this.applySettings();
          if (this.gameInstance && typeof this.gameInstance.setSpeed === "function") {
            this.gameInstance.setSpeed(this.gameSpeed);
          }
        });
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
        }
      });
      const dpadButtons = [
        { id: "dpad-up", dir: "UP" },
        { id: "dpad-down", dir: "DOWN" },
        { id: "dpad-left", dir: "LEFT" },
        { id: "dpad-right", dir: "RIGHT" }
      ];
      dpadButtons.forEach(({ id, dir }) => {
        const btn = document.getElementById(id);
        if (btn) {
          const trigger = (e) => {
            e.preventDefault();
            if (this.gameInstance && this.gameInstance.input) {
              this.gameInstance.input.setDirection(dir);
            }
          };
          btn.addEventListener("mousedown", trigger);
          btn.addEventListener("touchstart", trigger, { passive: false });
        }
      });
      let touchStartX = 0;
      let touchStartY = 0;
      this.canvasContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
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
          if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
          if (Math.abs(dx) > Math.abs(dy)) {
            this.gameInstance.input.setDirection(dx > 0 ? "RIGHT" : "LEFT");
          } else {
            this.gameInstance.input.setDirection(dy > 0 ? "DOWN" : "UP");
          }
        }
      }, { passive: false });
      window.addEventListener("keydown", (e) => {
        if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
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
      this.gameInstance = new PacmanGame(this.canvasContainer, {
        muted: !this.soundEnabled,
        speed: this.gameSpeed,
        highScore,
        onScoreUpdate: (score) => {
          this.hudScore.textContent = score.toString().padStart(4, "0");
          if (score > highScore) {
            this.hudHighScore.textContent = score.toString().padStart(4, "0");
            storage.setHighScore(this.gameId, score);
          }
        },
        onLevelClear: (level, score) => {
          recordGameActivity({ gameId: "mazearcade", level, score, status: "complete", result: "LEVEL CLEAR" });
        },
        onGameOver: (finalScore) => {
          storage.setHighScore(this.gameId, finalScore);
          recordGameActivity({ gameId: "mazearcade", level: this.gameInstance?.level || 1, score: finalScore, status: "complete", result: "GAME OVER" });
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
        icon.className = "life-icon";
        this.hudLivesIcons.appendChild(icon);
      }
    }
  };
  function boot() {
    new PacmanCabinetApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
