/**
 * Shongololo Entities
 * Millipede, FoodItem, Maze
 */

export class Shongololo {
  constructor(startX = 10, startY = 10, initialLength = 4) {
    this.body = [];
    for (let i = 0; i < initialLength; i++) {
      this.body.push({ x: startX - i, y: startY });
    }
    this.dir = { x: 1, y: 0 };       // Moving RIGHT
    this.nextDir = { x: 1, y: 0 };
    this.queuedDir = null;          // Extra buffer for fast double-taps
    this.legsPhase = 0;             // Alternates 0 and 1 for crawling animation
    this.dead = false;
  }

  setDirection(dx, dy) {
    // Prevent 180° instant reverse suicide
    if (dx === -this.dir.x && dy === -this.dir.y) return;

    if (this.nextDir.x !== this.dir.x || this.nextDir.y !== this.dir.y) {
      // Buffer a second turn if nextDir is already pending
      if (dx !== -this.nextDir.x && dy !== -this.nextDir.y) {
        this.queuedDir = { x: dx, y: dy };
      }
    } else {
      this.nextDir = { x: dx, y: dy };
    }
  }

  step(grow = false, wrap = false, cols = 32, rows = 22) {
    if (this.dead) return;

    // Apply buffered direction
    this.dir = this.nextDir;
    if (this.queuedDir) {
      this.nextDir = this.queuedDir;
      this.queuedDir = null;
    }

    let nextX = this.body[0].x + this.dir.x;
    let nextY = this.body[0].y + this.dir.y;

    if (wrap) {
      nextX = (nextX + cols) % cols;
      nextY = (nextY + rows) % rows;
    }

    const newHead = { x: nextX, y: nextY };
    this.body.unshift(newHead);

    if (!grow) {
      this.body.pop();
    }

    this.legsPhase = 1 - this.legsPhase;
  }

  checkSelfCollision() {
    if (this.body.length < 4) return false;
    const head = this.body[0];
    for (let i = 1; i < this.body.length; i++) {
      if (this.body[i].x === head.x && this.body[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  render(ctx, cellSize = 14) {
    ctx.save();
    const darkLcd = '#1b2a09';
    const highlightLcd = '#334812';

    // Render millipede segments from tail to head
    for (let i = this.body.length - 1; i >= 0; i--) {
      const seg = this.body[i];
      const px = seg.x * cellSize;
      const py = seg.y * cellSize;

      if (i === 0) {
        // Head segment with eyes & antennae
        ctx.fillStyle = darkLcd;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

        // Antennae
        const dir = this.dir;
        ctx.strokeStyle = darkLcd;
        ctx.lineWidth = 1.5;
        const centerX = px + cellSize / 2;
        const centerY = py + cellSize / 2;

        if (dir.x === 1) { // Moving RIGHT
          ctx.beginPath();
          ctx.moveTo(px + cellSize - 2, centerY - 3);
          ctx.lineTo(px + cellSize + 3, centerY - 6);
          ctx.moveTo(px + cellSize - 2, centerY + 3);
          ctx.lineTo(px + cellSize + 3, centerY + 6);
          ctx.stroke();
        } else if (dir.x === -1) { // Moving LEFT
          ctx.beginPath();
          ctx.moveTo(px + 2, centerY - 3);
          ctx.lineTo(px - 3, centerY - 6);
          ctx.moveTo(px + 2, centerY + 3);
          ctx.lineTo(px - 3, centerY + 6);
          ctx.stroke();
        } else if (dir.y === -1) { // Moving UP
          ctx.beginPath();
          ctx.moveTo(centerX - 3, py + 2);
          ctx.lineTo(centerX - 6, py - 3);
          ctx.moveTo(centerX + 3, py + 2);
          ctx.lineTo(centerX + 6, py - 3);
          ctx.stroke();
        } else { // Moving DOWN
          ctx.beginPath();
          ctx.moveTo(centerX - 3, py + cellSize - 2);
          ctx.lineTo(centerX - 6, py + cellSize + 3);
          ctx.moveTo(centerX + 3, py + cellSize - 2);
          ctx.lineTo(centerX + 6, py + cellSize + 3);
          ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#879738'; // Green LCD contrast eye dot
        ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
      } else {
        // Body segment
        ctx.fillStyle = darkLcd;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

        // Inner segment ridge
        ctx.fillStyle = highlightLcd;
        ctx.fillRect(px + 3, py + 3, cellSize - 6, cellSize - 6);

        // Little animated millipede legs on either flank!
        ctx.strokeStyle = darkLcd;
        ctx.lineWidth = 1.2;
        const legOffset = ((i + this.legsPhase) % 2 === 0) ? -2 : 2;

        if (this.dir.x !== 0) {
          // Horizontal moving: legs top & bottom
          ctx.beginPath();
          ctx.moveTo(px + 3, py + 1);
          ctx.lineTo(px + 3 + legOffset, py - 2);
          ctx.moveTo(px + cellSize - 4, py + 1);
          ctx.lineTo(px + cellSize - 4 - legOffset, py - 2);

          ctx.moveTo(px + 3, py + cellSize - 1);
          ctx.lineTo(px + 3 + legOffset, py + cellSize + 2);
          ctx.moveTo(px + cellSize - 4, py + cellSize - 1);
          ctx.lineTo(px + cellSize - 4 - legOffset, py + cellSize + 2);
          ctx.stroke();
        } else {
          // Vertical moving: legs left & right
          ctx.beginPath();
          ctx.moveTo(px + 1, py + 3);
          ctx.lineTo(px - 2, py + 3 + legOffset);
          ctx.moveTo(px + 1, py + cellSize - 4);
          ctx.lineTo(px - 2, py + cellSize - 4 - legOffset);

          ctx.moveTo(px + cellSize - 1, py + 3);
          ctx.lineTo(px + cellSize + 2, py + 3 + legOffset);
          ctx.moveTo(px + cellSize - 1, py + cellSize - 4);
          ctx.lineTo(px + cellSize + 2, py + cellSize - 4 - legOffset);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}

export class FoodItem {
  constructor(x, y, isBonus = false, timer = 10.0) {
    this.x = x;
    this.y = y;
    this.isBonus = isBonus;
    this.timer = timer;
    this.maxTimer = timer;
    this.active = true;
  }

  update(dt) {
    if (this.isBonus && this.active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = false;
      }
    }
  }

  render(ctx, cellSize = 14) {
    if (!this.active) return;
    ctx.save();
    const px = this.x * cellSize;
    const py = this.y * cellSize;
    const darkLcd = '#1b2a09';

    if (!this.isBonus) {
      // Marula Fruit (circle with stem/leaf)
      ctx.fillStyle = darkLcd;
      ctx.beginPath();
      ctx.arc(px + cellSize / 2, py + cellSize / 2 + 1, cellSize / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Stem / leaf at top
      ctx.fillRect(px + cellSize / 2 - 1, py + 1, 2, 3);
      ctx.fillRect(px + cellSize / 2 + 1, py, 3, 2);
    } else {
      // Golden Sun Beetle (Bonus Bug)
      const blink = Math.sin(this.timer * 12) > 0;
      ctx.fillStyle = darkLcd;

      // Shell
      ctx.beginPath();
      ctx.ellipse(px + cellSize / 2, py + cellSize / 2, cellSize / 2 - 1, cellSize / 2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if (blink) {
        // Center shell gleam
        ctx.fillStyle = '#879738';
        ctx.fillRect(px + cellSize / 2 - 1, py + cellSize / 2 - 1, 2, 2);
      }

      // Beetle legs
      ctx.strokeStyle = darkLcd;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 1, py + 3);
      ctx.lineTo(px - 2, py + 1);
      ctx.moveTo(px + cellSize - 1, py + 3);
      ctx.lineTo(px + cellSize + 2, py + 1);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class Maze {
  constructor(type = 'CLASSIC_BOX', cols = 32, rows = 22) {
    this.type = type;
    this.cols = cols;
    this.rows = rows;
    this.walls = new Set();
    this.initWalls();
  }

  initWalls() {
    this.walls.clear();

    if (this.type === 'CLASSIC_BOX') {
      // Solid outer walls
      for (let x = 0; x < this.cols; x++) {
        this.walls.add(`${x},0`);
        this.walls.add(`${x},${this.rows - 1}`);
      }
      for (let y = 0; y < this.rows; y++) {
        this.walls.add(`0,${y}`);
        this.walls.add(`${this.cols - 1},${y}`);
      }
    } else if (this.type === 'ACACIA_GROVE') {
      // Scattered acacia trees / rock obstacles with open borders
      const obstacles = [
        // Top-left copse
        { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 7 },
        // Bottom-right copse
        { x: 23, y: 15 }, { x: 24, y: 15 }, { x: 24, y: 16 },
        // Center rock spine
        { x: 15, y: 10 }, { x: 16, y: 10 }, { x: 16, y: 11 }
      ];
      obstacles.forEach(o => this.walls.add(`${o.x},${o.y}`));
    }
    // 'SAVANNAH_WRAP' has 0 walls (entirely open wrap-around)
  }

  isWall(x, y) {
    if (this.type === 'CLASSIC_BOX') {
      if (x <= 0 || x >= this.cols - 1 || y <= 0 || y >= this.rows - 1) {
        return true;
      }
    }
    return this.walls.has(`${x},${y}`);
  }

  render(ctx, cellSize = 14) {
    ctx.save();
    const darkLcd = '#1b2a09';
    ctx.fillStyle = darkLcd;

    this.walls.forEach(coord => {
      const [x, y] = coord.split(',').map(Number);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

      // Checkered Nokia border brick pattern
      ctx.fillStyle = '#334812';
      ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = darkLcd;
    });

    ctx.restore();
  }
}
