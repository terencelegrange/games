/**
 * Tetris 10x20 Playfield Board & Collision Engine
 */
export const COLS = 10;
export const ROWS = 20;

export class TetrisBoard {
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

          // Wall and floor bounds
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
            return true;
          }

          // Existing blocks on board (allow above board y < 0)
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
      if (this.grid[r].every(cell => cell !== 0)) {
        full.push(r);
      }
    }
    return full;
  }

  clearLines(lineIndices) {
    if (lineIndices.length === 0) return;

    // Filter out full rows
    this.grid = this.grid.filter((_, idx) => !lineIndices.includes(idx));

    // Unshift empty rows at top
    while (this.grid.length < ROWS) {
      this.grid.unshift(Array(COLS).fill(0));
    }
  }
}
