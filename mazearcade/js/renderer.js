import { TILE_SIZE, COLS, ROWS, TILE } from './map.js';
import { DIRECTIONS } from './pacman.js';
import { GHOST_STATE } from './ghost.js';

export class PacmanRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = COLS * TILE_SIZE;
    this.height = ROWS * TILE_SIZE;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.pulseTimer = 0;
  }

  clear() {
    this.ctx.fillStyle = '#000000';
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
          ctx.fillStyle = '#ffb8ff';
          ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
        } else if (tile === TILE.PELLET) {
          ctx.fillStyle = '#ffb8ae';
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILE.ENERGIZER) {
          if (energizerPulse) {
            ctx.fillStyle = '#ffb8ae';
            ctx.shadowColor = '#ffff88';
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

    // Outer wall base
    ctx.fillStyle = '#001133';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Neon wall border strokes
    ctx.strokeStyle = '#2121ff';
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
      // Death unraveling animation
      ctx.fillStyle = '#ffff00';
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

    ctx.fillStyle = '#ffff00';
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
      // Determine body color
      let bodyColor = ghost.color;
      if (isFrightened) {
        bodyColor = ghost.frightenedFlash ? '#ffffff' : '#2121ff';
      }

      // Draw ghost head dome & body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -2, radius, Math.PI, 0, false);
      ctx.lineTo(radius, radius);

      // Wavy tentacles skirt
      const wave = Math.sin(ghost.animationTimer * 0.2) > 0;
      const skirtY = radius;
      const step = (radius * 2) / 3;

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

    // Draw Eyes
    this.drawGhostEyes(ctx, ghost, isFrightened);

    ctx.restore();
  }

  drawGhostEyes(ctx, ghost, isFrightened) {
    if (isFrightened) {
      // Frightened face (small dots and squiggly mouth)
      ctx.fillStyle = ghost.frightenedFlash ? '#ff0000' : '#ffb8ae';
      ctx.beginPath();
      ctx.arc(-4, -2, 2, 0, Math.PI * 2);
      ctx.arc(4, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Wavy mouth
      ctx.strokeStyle = ghost.frightenedFlash ? '#ff0000' : '#ffb8ae';
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

    // Normal or Eaten eyes
    const dir = DIRECTIONS[ghost.currentDir] || DIRECTIONS.UP;
    const pupilOffsetX = dir.x * 2.5;
    const pupilOffsetY = dir.y * 2.5;

    // Sclera (White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -2, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (Blue)
    ctx.fillStyle = '#2121de';
    ctx.beginPath();
    ctx.arc(-4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
    ctx.arc(4 + pupilOffsetX, -2 + pupilOffsetY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFloatingScores(floatingScores) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';

    floatingScores.forEach(item => {
      ctx.fillText(item.points.toString(), item.x + TILE_SIZE / 2, item.y + TILE_SIZE / 2);
    });
    ctx.restore();
  }

  drawOverlay(text, subtext = '', color = '#ffff00') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, this.width / 2, this.height / 2 - 10);

    if (subtext) {
      ctx.shadowBlur = 0;
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtext, this.width / 2, this.height / 2 + 25);
    }
    ctx.restore();
  }
}
