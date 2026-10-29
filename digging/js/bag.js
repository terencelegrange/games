import { TILE_WIDTH, TILE_HEIGHT, ROWS, COLS } from './map.js';

export const BAG_STATE = {
  RESTING: 'RESTING',
  WOBBLING: 'WOBBLING',
  FALLING: 'FALLING',
  OPEN_GOLD: 'OPEN_GOLD',
  COLLECTED: 'COLLECTED'
};

export class GoldBag {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.x = col * TILE_WIDTH;
    this.y = row * TILE_HEIGHT;
    this.state = BAG_STATE.RESTING;
    this.wobbleTimer = 0;
    this.fallDistance = 0; // Number of rows fallen
    this.fallSpeed = 4.5;
    this.wobbleOffset = 0;
  }

  update(map, otherBags, onCrushEntity) {
    if (this.state === BAG_STATE.COLLECTED) return;

    if (this.state === BAG_STATE.RESTING) {
      // Check if ground beneath is dug out
      const belowRow = this.row + 1;
      const isGroundBelow = belowRow >= ROWS || map.isDirt(this.col, belowRow) || this.isBagBelow(otherBags);

      if (!isGroundBelow) {
        this.state = BAG_STATE.WOBBLING;
        this.wobbleTimer = 22; // ~0.35s wobble
      }
      return;
    }

    if (this.state === BAG_STATE.WOBBLING) {
      this.wobbleTimer--;
      // Shake left/right
      this.wobbleOffset = (this.wobbleTimer % 4 < 2) ? -2 : 2;

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

      // Check collision with monsters/player to crush
      if (onCrushEntity) {
        onCrushEntity(this);
      }

      // Check landing on ground or another bag
      const nextTileY = (this.row + 1) * TILE_HEIGHT;
      const isFloorBelow = (this.row + 1 >= ROWS) || 
                           map.isDirt(this.col, this.row + 1) || 
                           this.isBagBelow(otherBags);

      if (this.y >= nextTileY - this.fallSpeed && isFloorBelow) {
        // Landed on a tile
        this.y = this.row * TILE_HEIGHT;
        const rowsFallen = this.row - (this.startFallRow ?? this.row);

        if (rowsFallen >= 2) {
          // Cracks open into loose gold
          this.state = BAG_STATE.OPEN_GOLD;
        } else {
          // Settles back to resting
          this.state = BAG_STATE.RESTING;
        }
      }
    }
  }

  isBagBelow(otherBags) {
    return otherBags.some(b => 
      b !== this && 
      b.col === this.col && 
      b.row === this.row + 1 && 
      b.state !== BAG_STATE.COLLECTED &&
      b.state !== BAG_STATE.FALLING
    );
  }

  tryPush(dir, map, otherBags) {
    if (this.state !== BAG_STATE.RESTING) return false;

    const targetCol = this.col + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0);
    if (targetCol < 0 || targetCol >= COLS) return false;

    // Must be cleared tunnel in push direction
    if (map.isDirt(targetCol, this.row)) return false;

    // Cannot push into another bag
    const blockedByBag = otherBags.some(b => 
      b !== this && 
      b.col === targetCol && 
      b.row === this.row && 
      b.state !== BAG_STATE.COLLECTED
    );
    if (blockedByBag) return false;

    // Push successful
    this.col = targetCol;
    this.x = targetCol * TILE_WIDTH;
    return true;
  }
}
