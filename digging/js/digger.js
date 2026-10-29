import { TILE_WIDTH, TILE_HEIGHT, COLS, ROWS } from './map.js';

export const DIRECTIONS = {
  UP: { x: 0, y: -1, angle: -Math.PI / 2 },
  DOWN: { x: 0, y: 1, angle: Math.PI / 2 },
  LEFT: { x: -1, y: 0, angle: Math.PI },
  RIGHT: { x: 1, y: 0, angle: 0 },
  NONE: { x: 0, y: 0, angle: 0 }
};

export class DiggerPlayer {
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
    this.currentDir = 'RIGHT';
    this.nextDir = 'RIGHT';
    this.speed = this.baseSpeed;
    this.isDigging = false;
    this.animFrame = 0;
    this.isDying = false;
    this.deathTimer = 0;

    // Weapon
    this.shot = null;
    this.rechargeTimer = 0;
    this.rechargeMax = 110; // ~1.8 seconds recharge
  }

  setDirection(dir) {
    if (!DIRECTIONS[dir]) return;
    this.nextDir = dir;

    // Immediate 180-degree reversal
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
    // Recharge cooldown
    if (this.rechargeTimer > 0) {
      this.rechargeTimer--;
    }

    // Update active shot
    if (this.shot) {
      this.shot.x += this.shot.dx;
      this.shot.y += this.shot.dy;
      this.shot.life--;

      const shotCol = Math.floor(this.shot.x / TILE_WIDTH);
      const shotRow = Math.floor(this.shot.y / TILE_HEIGHT);

      // Shot extinguished by dirt, bags, or bounds
      if (this.shot.life <= 0 || 
          shotCol < 0 || shotCol >= COLS || shotRow < 0 || shotRow >= ROWS ||
          this.map.isDirt(shotCol, shotRow) ||
          bags.some(b => b.col === shotCol && b.row === shotRow && b.state !== 'COLLECTED')) {
        this.shot = null;
      }
    }

    if (this.isDying) {
      this.deathTimer++;
      return;
    }

    this.animFrame++;

    // Turn alignment
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
    if (!vec || (vec.x === 0 && vec.y === 0)) return;

    let targetSpeed = this.baseSpeed;

    // Check bounds
    const nextX = this.x + vec.x * targetSpeed;
    const nextY = this.y + vec.y * targetSpeed;
    const nextCol = Math.floor((nextX + TILE_WIDTH / 2) / TILE_WIDTH);
    const nextRow = Math.floor((nextY + TILE_HEIGHT / 2) / TILE_HEIGHT);

    if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow >= ROWS) {
      return; // Stop at bounds
    }

    // Check bag collision / push
    const targetBag = bags.find(b => 
      b.col === nextCol && 
      b.row === nextRow && 
      b.state !== 'COLLECTED' && 
      b.state !== 'OPEN_GOLD'
    );

    if (targetBag) {
      // Attempt pushing bag horizontally
      if (vec.y === 0 && targetBag.tryPush(this.currentDir, this.map, bags)) {
        targetSpeed = 1.4; // Pushing slows down
      } else {
        return; // Blocked by bag
      }
    }

    // Check if moving into dirt/emerald
    if (this.map.isDirt(nextCol, nextRow)) {
      targetSpeed = 1.6; // Digging slows down
      const dug = this.map.dig(nextCol, nextRow);
      if (dug === 'EMERALD' && onCollectEmerald) {
        onCollectEmerald(nextCol, nextRow);
      } else if (dug === 'DIRT' && onDigDirt) {
        onDigDirt(nextCol, nextRow);
      }
    }

    this.x += vec.x * targetSpeed;
    this.y += vec.y * targetSpeed;
    this.col = Math.round(this.x / TILE_WIDTH);
    this.row = Math.round(this.y / TILE_HEIGHT);
  }
}
