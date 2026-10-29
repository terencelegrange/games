/**
 * Digger (1983) 15x10 Tile Grid & Level Maps
 */
export const COLS = 15;
export const ROWS = 10;
export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 32;

export const TILE = {
  EMPTY: 0,
  DIRT: 1,
  EMERALD: 2
};

// Classic Digger Level Layouts
// 1 = Dirt, 0 = Tunnel, 2 = Emerald
export const LEVEL_MAPS = [
  // Level 1
  {
    tiles: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 0: Top corridor
      [1,2,2,1,1,2,2,1,1,2,2,1,1,2,0],
      [1,2,2,1,1,2,2,1,1,2,2,1,1,2,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 3: Middle corridor
      [0,2,1,1,2,2,1,1,2,2,1,1,2,2,1],
      [0,2,1,1,2,2,1,1,2,2,1,1,2,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // Row 6: Lower middle corridor
      [1,2,2,1,1,2,2,1,1,2,2,1,1,2,1],
      [1,2,2,1,1,2,2,1,1,2,2,1,1,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  // Row 9: Bottom corridor
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
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,2,1,2,1,2,1,2,1,2,1,2,1,2,0],
      [1,2,1,2,1,2,1,2,1,2,1,2,1,2,0],
      [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
      [1,1,2,2,1,1,2,2,1,1,2,2,1,1,1],
      [1,1,2,2,1,1,2,2,1,1,2,2,1,1,1],
      [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
      [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
      [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
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

export class DiggerMap {
  constructor(levelIndex = 0) {
    this.levelIndex = levelIndex % LEVEL_MAPS.length;
    this.reset();
  }

  reset(levelIndex = this.levelIndex) {
    this.levelIndex = levelIndex % LEVEL_MAPS.length;
    const template = LEVEL_MAPS[this.levelIndex];

    this.grid = template.tiles.map(row => [...row]);
    this.initialBagConfigs = template.bags.map(b => ({ ...b }));

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
      return 'DIRT';
    }
    if (current === TILE.EMERALD) {
      this.grid[row][col] = TILE.EMPTY;
      this.emeraldsRemaining--;
      return 'EMERALD';
    }
    return null;
  }

  getTile(col, row) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return TILE.EMPTY;
    return this.grid[row][col];
  }
}
