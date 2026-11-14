import { TILE_SIZE, COLS, ROWS } from './map.js';

export const DIRECTIONS = {
  UP: { x: 0, y: -1, angle: 1.5 * Math.PI },
  DOWN: { x: 0, y: 1, angle: 0.5 * Math.PI },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 },
  NONE: { x: 0, y: 0, angle: 0 }
};

export class Pacman {
  constructor(map, speedMultiplier = 1.0) {
    this.map = map;
    this.startCol = 13;
    this.startRow = 23;
    this.baseSpeed = 1.4; // Reduced by 30% from 2.0 (pixels per frame at 60fps)
    this.speedMultiplier = speedMultiplier;
    this.reset();
  }

  setSpeedMultiplier(multiplier) {
    this.speedMultiplier = multiplier;
    this.speed = this.baseSpeed * (this.speedMultiplier || 1.0);
  }

  reset() {
    this.x = this.startCol * TILE_SIZE;
    this.y = this.startRow * TILE_SIZE;
    this.currentDir = 'LEFT';
    this.nextDir = 'LEFT';
    this.speed = this.baseSpeed * (this.speedMultiplier || 1.0);
    this.mouthAngle = 0.2;
    this.mouthDir = 1;
    this.isDying = false;
    this.deathProgress = 0; // 0 to 1
  }

  setDesiredDirection(dir) {
    if (!DIRECTIONS[dir]) return;
    
    // Immediate 180-degree reversal allowed anytime
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
    if (!dir || (dir.x === 0 && dir.y === 0)) return true;
    const targetCol = col + dir.x;
    const targetRow = row + dir.y;

    // Tunnel exception
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

    // Warp tunnel wrapping
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

    // Check if close enough to tile center to make a turn
    const distToCenter = Math.hypot(this.x - tileCenterX, this.y - tileCenterY);
    if (this.nextDir !== this.currentDir && distToCenter <= Math.max(this.speed, 1.5)) {
      if (this.canMove(currentTileCol, currentTileRow, this.nextDir)) {
        this.x = tileCenterX;
        this.y = tileCenterY;
        this.currentDir = this.nextDir;
      }
    }

    // Move in current direction if not blocked
    const curVec = DIRECTIONS[this.currentDir];
    if (curVec) {
      const willPassCenter = (curVec.x !== 0 && Math.sign(tileCenterX - this.x) !== Math.sign(tileCenterX - (this.x + curVec.x * this.speed))) ||
                             (curVec.y !== 0 && Math.sign(tileCenterY - this.y) !== Math.sign(tileCenterY - (this.y + curVec.y * this.speed)));

      if (willPassCenter && !this.canMove(currentTileCol, currentTileRow, this.currentDir)) {
        // Stop at center of tile
        this.x = tileCenterX;
        this.y = tileCenterY;
      } else {
        this.x += curVec.x * this.speed;
        this.y += curVec.y * this.speed;

        // Animate mouth
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
}
