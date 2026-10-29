import { COLS, ROWS } from './board.js';

export const BLOCK_SIZE = 22;

export class TetrisRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.wellX = 110;
    this.wellY = 20;
    this.wellW = COLS * BLOCK_SIZE; // 220px
    this.wellH = ROWS * BLOCK_SIZE; // 440px

    this.width = 440;
    this.height = 480;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.fillStyle = '#0a0a14';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawPlayfield(board, lineClearTimer, clearingLines) {
    const ctx = this.ctx;

    // Outer well frame
    ctx.fillStyle = '#05050d';
    ctx.fillRect(this.wellX, this.wellY, this.wellW, this.wellH);

    // Subtle background grid
    ctx.strokeStyle = '#181830';
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(this.wellX + c * BLOCK_SIZE, this.wellY);
      ctx.lineTo(this.wellX + c * BLOCK_SIZE, this.wellY + this.wellH);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(this.wellX, this.wellY + r * BLOCK_SIZE);
      ctx.lineTo(this.wellX + this.wellW, this.wellY + r * BLOCK_SIZE);
      ctx.stroke();
    }

    // Border glowing stroke
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(this.wellX - 1, this.wellY - 1, this.wellW + 2, this.wellH + 2);

    // Render locked blocks on board
    for (let r = 0; r < ROWS; r++) {
      const isClearing = clearingLines && clearingLines.includes(r);
      for (let c = 0; c < COLS; c++) {
        const color = board.grid[r][c];
        if (color !== 0) {
          const bx = this.wellX + c * BLOCK_SIZE;
          const by = this.wellY + r * BLOCK_SIZE;

          if (isClearing && lineClearTimer % 4 < 2) {
            // White flash during clear
            this.drawBlock(bx, by, '#ffffff');
          } else {
            this.drawBlock(bx, by, color);
          }
        }
      }
    }
  }

  drawBlock(x, y, color, alpha = 1.0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    // 3D Bevel Highlights (top & left light, bottom & right dark)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + BLOCK_SIZE - 1, y + 1);
    ctx.lineTo(x + BLOCK_SIZE - 4, y + 4);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + 4, y + BLOCK_SIZE - 4);
    ctx.lineTo(x + 1, y + BLOCK_SIZE - 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + BLOCK_SIZE - 1, y + 1);
    ctx.lineTo(x + BLOCK_SIZE - 1, y + BLOCK_SIZE - 1);
    ctx.lineTo(x + 1, y + BLOCK_SIZE - 1);
    ctx.lineTo(x + 4, y + BLOCK_SIZE - 4);
    ctx.lineTo(x + BLOCK_SIZE - 4, y + BLOCK_SIZE - 4);
    ctx.lineTo(x + BLOCK_SIZE - 4, y + 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawGhostPiece(piece, ghostY) {
    if (!piece) return;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const gx = this.wellX + (piece.x + c) * BLOCK_SIZE;
          const gy = this.wellY + (ghostY + r) * BLOCK_SIZE;
          if (gy >= this.wellY) {
            this.drawGhostBlock(gx, gy, piece.color);
          }
        }
      }
    }
  }

  drawGhostBlock(x, y, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    ctx.strokeRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    ctx.restore();
  }

  drawActivePiece(piece) {
    if (!piece) return;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const bx = this.wellX + (piece.x + c) * BLOCK_SIZE;
          const by = this.wellY + (piece.y + r) * BLOCK_SIZE;
          if (by >= this.wellY) {
            this.drawBlock(bx, by, piece.color);
          }
        }
      }
    }
  }

  drawSidePanels(holdPiece, nextPiece, score, lines, level) {
    const ctx = this.ctx;
    ctx.save();

    // 1. LEFT PANEL: HOLD BOX
    this.drawMiniBox(15, 20, 80, 80, 'HOLD', holdPiece);

    // Left Stats
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ff007f';
    ctx.fillText('LINES', 15, 140);
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lines.toString(), 15, 160);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#00ff66';
    ctx.fillText('LEVEL', 15, 195);
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(level.toString(), 15, 215);

    // 2. RIGHT PANEL: NEXT BOX
    this.drawMiniBox(345, 20, 80, 80, 'NEXT', nextPiece);

    // Right Stats
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('SCORE', 345, 140);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toString(), 345, 160);

    ctx.restore();
  }

  drawMiniBox(x, y, w, h, title, piece) {
    const ctx = this.ctx;
    ctx.save();

    // Box label
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(title, x, y - 6);

    // Box container
    ctx.fillStyle = '#111122';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2c2c4d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Render piece inside box
    if (piece) {
      const miniSize = 14;
      const pw = piece.shape[0].length * miniSize;
      const ph = piece.shape.length * miniSize;
      const offsetX = x + (w - pw) / 2;
      const offsetY = y + (h - ph) / 2;

      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const bx = offsetX + c * miniSize;
            const by = offsetY + r * miniSize;
            ctx.fillStyle = piece.color;
            ctx.fillRect(bx + 1, by + 1, miniSize - 2, miniSize - 2);
          }
        }
      }
    }

    ctx.restore();
  }

  drawOverlay(text, subtext = '', color = '#ffff00') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, this.width / 2, this.height / 2 - 10);

    if (subtext) {
      ctx.shadowBlur = 0;
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtext, this.width / 2, this.height / 2 + 25);
    }

    ctx.restore();
  }
}
