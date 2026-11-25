import { TILE_SIZE, COLS, ROWS } from './map.js';
import { DIRECTIONS } from './pacman.js';

export const GHOST_STATE = {
  HOUSE: 'HOUSE',
  EXITING: 'EXITING',
  CHASE: 'CHASE',
  SCATTER: 'SCATTER',
  FRIGHTENED: 'FRIGHTENED',
  EATEN: 'EATEN',
  ENTERING_HOUSE: 'ENTERING_HOUSE'
};

const OPPOSITES = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

const DOOR_COL = 13;
const DOOR_ROW = 11;
const DOOR_X = DOOR_COL * TILE_SIZE; // 208
const DOOR_Y = DOOR_ROW * TILE_SIZE; // 176
const HOUSE_Y = 14 * TILE_SIZE;      // 224

export class Ghost {
  constructor(name, color, startCol, startRow, scatterCol, scatterRow, map, speedMultiplier = 1.0) {
    this.name = name;
    this.color = color;
    this.startCol = startCol;
    this.startRow = startRow;
    this.scatterCol = scatterCol;
    this.scatterRow = scatterRow;
    this.map = map;

    this.baseSpeed = 1.30; // Reduced by 30% from 1.85 (pixels per frame at 60fps)
    this.speedMultiplier = speedMultiplier;
    this.reset();
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = mult;
    this.updateSpeed();
  }

  updateSpeed() {
    const mult = this.speedMultiplier || 1.0;
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
    this.currentDir = 'LEFT';
    this.state = this.name === 'Blinky' ? GHOST_STATE.SCATTER : GHOST_STATE.HOUSE;
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
      case 'Blinky': return 0;
      case 'Pinky': return 50;   // ~0.8s
      case 'Inky': return 220;   // ~3.5s
      case 'Clyde': return 380;  // ~6.3s
      default: return 0;
    }
  }

  setFrightened(durationFrames = 360) {
    if (this.state === GHOST_STATE.EATEN || 
        this.state === GHOST_STATE.ENTERING_HOUSE) {
      return;
    }

    this.frightenedTimer = durationFrames;
    this.frightenedFlash = false;

    // Only set speed and state if already active in maze
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
    this.updateSpeed(); // Fast eyes returning home
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

    // 1. In House Waiting State
    if (this.state === GHOST_STATE.HOUSE) {
      if (this.houseExitTimer > 0) {
        this.houseExitTimer--;
        // Bob up and down inside house
        const centerY = this.startRow * TILE_SIZE;
        this.y = centerY + Math.sin(this.animationTimer * 0.12) * 3;
        return;
      }
      // Timer finished -> begin exit sequence
      this.state = GHOST_STATE.EXITING;
    }

    // 2. Exiting House Sequence
    if (this.state === GHOST_STATE.EXITING) {
      // Step A: Align horizontally to door column (DOOR_X)
      const diffX = DOOR_X - this.x;
      if (Math.abs(diffX) > 1.2) {
        this.x += Math.sign(diffX) * 1.5;
        this.currentDir = diffX > 0 ? 'RIGHT' : 'LEFT';
        return;
      }
      this.x = DOOR_X;

      // Step B: Move vertically UP through gate to corridor (DOOR_Y)
      const diffY = DOOR_Y - this.y;
      if (Math.abs(diffY) > 1.5) {
        this.y += Math.sign(diffY) * 1.5;
        this.currentDir = 'UP';
        return;
      }

      // Step C: Fully exited outside the gate
      this.x = DOOR_X;
      this.y = DOOR_Y;
      this.state = globalFrightened ? GHOST_STATE.FRIGHTENED : globalState;
      this.updateSpeed();
      this.currentDir = 'LEFT';
      this.lastTileCol = DOOR_COL;
      this.lastTileRow = DOOR_ROW;
      return;
    }

    // 3. Eaten Eyes Approaching Gate Door
    if (this.state === GHOST_STATE.EATEN) {
      const distToDoor = Math.hypot(this.x - DOOR_X, this.y - DOOR_Y);
      if (distToDoor <= this.speed + 2) {
        // Reached door outside house, start entering
        this.x = DOOR_X;
        this.y = DOOR_Y;
        this.state = GHOST_STATE.ENTERING_HOUSE;
        this.currentDir = 'DOWN';
        return;
      }
    }

    // 4. Entering House to Regenerate
    if (this.state === GHOST_STATE.ENTERING_HOUSE) {
      this.x = DOOR_X;
      this.currentDir = 'DOWN';
      this.y += 2.0 * (this.speedMultiplier || 1.0);

      if (this.y >= HOUSE_Y) {
        // Reached inside of house -> revive!
        this.y = HOUSE_Y;
        this.state = GHOST_STATE.HOUSE;
        this.houseExitTimer = 45; // ~0.75s pause to display revived ghost before exiting
        this.updateSpeed();
        this.frightenedTimer = 0;
      }
      return;
    }

    // 5. Frightened Timer Countdown
    if (this.state === GHOST_STATE.FRIGHTENED) {
      this.frightenedTimer--;
      this.frightenedFlash = this.frightenedTimer < 120 && Math.floor(this.frightenedTimer / 15) % 2 === 1;
      if (this.frightenedTimer <= 0) {
        this.state = globalState;
        this.updateSpeed();
      }
    }

    // 6. Active Maze Traversal (CHASE, SCATTER, FRIGHTENED, EATEN navigating to door)
    this.updateGridMovement(pacman, blinky, globalState);
  }

  updateGridMovement(pacman, blinky, globalState) {
    const vec = DIRECTIONS[this.currentDir] || { x: 0, y: 0 };
    if (vec.x === 0 && vec.y === 0) return;

    // Tunnel wrap-around at row 14
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

    // Detect if this step crosses the center of the tile
    const crossedX = (vec.x > 0 && this.x < centerX && nextX >= centerX) ||
                     (vec.x < 0 && this.x > centerX && nextX <= centerX);
    const crossedY = (vec.y > 0 && this.y < centerY && nextY >= centerY) ||
                     (vec.y < 0 && this.y > centerY && nextY <= centerY);

    const isNewTile = currentTileCol !== this.lastTileCol || currentTileRow !== this.lastTileRow;

    if ((crossedX || crossedY) && isNewTile) {
      const remainder = crossedX ? Math.abs(nextX - centerX) : Math.abs(nextY - centerY);

      // Snap to tile center
      this.x = centerX;
      this.y = centerY;
      this.lastTileCol = currentTileCol;
      this.lastTileRow = currentTileRow;

      // Choose next direction at intersection
      this.chooseNextDirection(pacman, blinky, globalState);

      // Apply remaining step in the new direction
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
      return { col: DOOR_COL, row: DOOR_ROW }; // Gate door
    }

    if (this.state === GHOST_STATE.SCATTER) {
      return { col: this.scatterCol, row: this.scatterRow };
    }

    // CHASE State target calculations
    const pCol = pacman.getCol();
    const pRow = pacman.getRow();
    const pDir = DIRECTIONS[pacman.currentDir] || { x: 0, y: 0 };

    switch (this.name) {
      case 'Blinky':
        return { col: pCol, row: pRow };

      case 'Pinky':
        return { col: pCol + pDir.x * 4, row: pRow + pDir.y * 4 };

      case 'Inky': {
        const aheadCol = pCol + pDir.x * 2;
        const aheadRow = pRow + pDir.y * 2;
        const bCol = blinky ? blinky.getCol() : pCol;
        const bRow = blinky ? blinky.getRow() : pRow;
        return {
          col: aheadCol + (aheadCol - bCol),
          row: aheadRow + (aheadRow - bRow)
        };
      }

      case 'Clyde': {
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

    const candidates = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
    const validDirs = [];
    const reverseDir = OPPOSITES[this.currentDir];

    for (const dir of candidates) {
      // Ghosts cannot reverse 180 degrees at intersections
      if (dir === reverseDir) continue;

      const vec = DIRECTIONS[dir];
      const nextCol = currentCol + vec.x;
      const nextRow = currentRow + vec.y;

      // Tunnel exception
      if (nextRow === 14 && (nextCol < 0 || nextCol >= COLS)) {
        validDirs.push(dir);
        continue;
      }

      // Wall check
      if (this.map.isWall(nextCol, nextRow)) continue;

      // Gate check: only allowed when entering house
      if (this.map.isGate(nextCol, nextRow)) {
        if (this.state !== GHOST_STATE.EATEN && this.state !== GHOST_STATE.ENTERING_HOUSE) {
          continue;
        }
      }

      validDirs.push(dir);
    }

    if (validDirs.length === 0) {
      this.currentDir = reverseDir || 'LEFT';
      return;
    }

    if (this.state === GHOST_STATE.FRIGHTENED) {
      // Random direction at intersections
      const randIdx = Math.floor(Math.random() * validDirs.length);
      this.currentDir = validDirs[randIdx];
      return;
    }

    // Pick direction closest to target tile
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
}
