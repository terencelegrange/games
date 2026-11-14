import { TILE_WIDTH, TILE_HEIGHT, COLS, ROWS } from './map.js';

export const MONSTER_TYPE = {
  NOBBIN: 'NOBBIN',
  HOBBIN: 'HOBBIN'
};

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const OPPOSITES = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};

export class Monster {
  constructor(id, col = 14, row = 0, type = MONSTER_TYPE.NOBBIN) {
    this.id = id;
    this.col = col;
    this.row = row;
    this.x = col * TILE_WIDTH;
    this.y = row * TILE_HEIGHT;
    this.type = type;
    this.currentDir = 'LEFT';
    this.baseSpeed = 1.6;
    this.speed = this.baseSpeed;
    this.mutationTimer = 350; // ~6 seconds before transforming to Hobbin
    this.animTimer = 0;
    this.isDead = false;
  }

  update(map, digger, bags, isBonusMode) {
    if (this.isDead) return;

    this.animTimer++;

    // Mutate Nobbin to Hobbin over time (unless in bonus mode)
    if (this.type === MONSTER_TYPE.NOBBIN && !isBonusMode) {
      this.mutationTimer--;
      if (this.mutationTimer <= 0) {
        this.type = MONSTER_TYPE.HOBBIN;
      }
    }

    // Grid center crossing turn decision
    const curCol = Math.round(this.x / TILE_WIDTH);
    const curRow = Math.round(this.y / TILE_HEIGHT);
    const centerX = curCol * TILE_WIDTH;
    const centerY = curRow * TILE_HEIGHT;

    const vec = DIRECTIONS[this.currentDir] || DIRECTIONS.LEFT;
    const nextX = this.x + vec.x * this.speed;
    const nextY = this.y + vec.y * this.speed;

    const crossedX = (vec.x > 0 && this.x < centerX && nextX >= centerX) ||
                     (vec.x < 0 && this.x > centerX && nextX <= centerX);
    const crossedY = (vec.y > 0 && this.y < centerY && nextY >= centerY) ||
                     (vec.y < 0 && this.y > centerY && nextY <= centerY);

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

    // If Hobbin, dig through dirt as it walks!
    if (this.type === MONSTER_TYPE.HOBBIN && !isBonusMode) {
      if (map.isDirt(this.col, this.row)) {
        map.dig(this.col, this.row);
      }
    }
  }

  chooseDirection(map, digger, bags, isBonusMode) {
    const candidates = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
    const validDirs = [];
    const rev = OPPOSITES[this.currentDir];

    for (const dir of candidates) {
      // Avoid immediate 180 reversal unless dead end
      if (dir === rev) continue;

      const vec = DIRECTIONS[dir];
      const targetCol = this.col + vec.x;
      const targetRow = this.row + vec.y;

      if (targetCol < 0 || targetCol >= COLS || targetRow < 0 || targetRow >= ROWS) {
        continue;
      }

      // Check bag collision
      const blockedByBag = bags.some(b => 
        b.col === targetCol && 
        b.row === targetRow && 
        b.state !== 'COLLECTED' && 
        b.state !== 'OPEN_GOLD'
      );
      if (blockedByBag) continue;

      // Nobbins can ONLY move through cleared tunnels
      if (this.type === MONSTER_TYPE.NOBBIN) {
        if (map.isDirt(targetCol, targetRow)) continue;
      }

      // Hobbins can move through both dirt and tunnels!
      validDirs.push(dir);
    }

    if (validDirs.length === 0) {
      this.currentDir = rev || 'LEFT';
      return;
    }

    // Target calculation:
    // If bonus mode, flee from Digger! Otherwise, chase Digger.
    let targetCol = digger.col;
    let targetRow = digger.row;

    if (isBonusMode) {
      // Flee toward opposite corner
      targetCol = (digger.col < COLS / 2) ? COLS - 1 : 0;
      targetRow = (digger.row < ROWS / 2) ? ROWS - 1 : 0;
    }

    // Pick direction closest to target
    let bestDir = validDirs[0];
    let bestDist = Infinity;

    for (const dir of validDirs) {
      const vec = DIRECTIONS[dir];
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
}
