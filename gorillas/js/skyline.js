/**
 * Gorillas Procedural Skyline, Building Mask, and Sun Entity
 * Generates destructible skyscrapers with lit windows, rooftop gorilla positions,
 * and the iconic reactive QBasic smiling sun.
 */

import { carveCrater } from './physics.js';

export const EGA_BUILDING_COLORS = [
  '#00aaaa', // EGA Cyan
  '#aaaaaa', // EGA Slate Gray
  '#aa0000', // EGA Brick Red
  '#0000aa', // EGA Classic Blue
  '#555555'  // EGA Charcoal
];

export const WINDOW_LIT_COLOR = '#ffff55'; // EGA Bright Yellow
export const WINDOW_DARK_COLOR = '#334155'; // Dark Navy Slate

export class Skyline {
  constructor(width = 800, height = 550) {
    this.width = width;
    this.height = height;
    this.buildings = [];
    this.gorilla1 = null;
    this.gorilla2 = null;
    this.sun = { x: width / 2, y: 55, radius: 24, shocked: false, shockTimer: 0 };

    // Offscreen canvas for destructible terrain
    this.terrainCanvas = null;
    this.terrainCtx = null;
    if (typeof document !== 'undefined') {
      this.terrainCanvas = document.createElement('canvas');
      this.terrainCanvas.width = width;
      this.terrainCanvas.height = height;
      this.terrainCtx = this.terrainCanvas.getContext('2d', { willReadFrequently: true });
    }

    this.generate();
  }

  generate() {
    this.buildings = [];
    const minWidth = 65;
    const maxWidth = 95;
    let currentX = 2;
    let bIndex = 0;

    // Generate buildings until screen width is covered
    while (currentX < this.width - 20) {
      const remainingWidth = this.width - currentX;
      if (remainingWidth < 55 && this.buildings.length > 0) {
        this.buildings[this.buildings.length - 1].width += remainingWidth;
        break;
      }
      let bWidth = Math.floor(minWidth + Math.random() * (maxWidth - minWidth));
      if (remainingWidth < maxWidth + 30) {
        bWidth = remainingWidth;
      }

      // Height between 140px and 340px
      const bHeight = Math.floor(150 + Math.random() * 190);
      const bY = this.height - bHeight;
      const color = EGA_BUILDING_COLORS[bIndex % EGA_BUILDING_COLORS.length];

      this.buildings.push({
        id: bIndex,
        x: currentX,
        y: bY,
        width: bWidth,
        height: bHeight,
        color
      });

      currentX += bWidth;
      bIndex++;
    }

    // Place Gorilla 1 on 2nd building (index 1)
    const b1 = this.buildings[1] || this.buildings[0];
    const g1X = b1.x + b1.width / 2;
    const g1Y = b1.y - 16; // Rooftop center
    this.gorilla1 = {
      id: 1,
      name: 'PLAYER',
      x: g1X,
      y: g1Y,
      width: 30,
      height: 32,
      facingRight: true,
      state: 'idle', // 'idle', 'throwing', 'celebrate', 'shock', 'dead'
      animTick: 0,
      buildingId: b1.id
    };

    // Place Gorilla 2 on 2nd or 3rd building from the right
    const targetIdx = Math.max(3, this.buildings.length - 2);
    const b2 = this.buildings[targetIdx] || this.buildings[this.buildings.length - 1];
    const g2X = b2.x + b2.width / 2;
    const g2Y = b2.y - 16;
    this.gorilla2 = {
      id: 2,
      name: 'COMPUTER',
      x: g2X,
      y: g2Y,
      width: 30,
      height: 32,
      facingRight: false,
      state: 'idle',
      animTick: 0,
      buildingId: b2.id
    };

    this.drawSkylineToOffscreen();
  }

  drawSkylineToOffscreen() {
    if (!this.terrainCtx) return;
    const ctx = this.terrainCtx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const b of this.buildings) {
      // Draw building block
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Building outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Window grid: 4px x 7px windows spaced regularly
      const winW = 4;
      const winH = 7;
      const stepX = 9;
      const stepY = 13;
      const startX = b.x + 5;
      const endX = b.x + b.width - 5;
      const startY = b.y + 8;
      const endY = this.height - 10;

      for (let wy = startY; wy < endY; wy += stepY) {
        for (let wx = startX; wx < endX; wx += stepX) {
          const isLit = Math.random() < 0.65;
          ctx.fillStyle = isLit ? WINDOW_LIT_COLOR : WINDOW_DARK_COLOR;
          ctx.fillRect(wx, wy, winW, winH);
        }
      }
    }
  }

  /**
   * Explodes a crater out of the skyline terrain
   */
  explodeCrater(x, y, radius = 22) {
    if (this.terrainCtx) {
      carveCrater(this.terrainCtx, x, y, radius);
    }
  }

  /**
   * Tests whether point (x, y) collides with remaining solid building terrain
   */
  checkTerrainCollision(x, y, radius = 4) {
    // Check out of bounds at ground level
    if (y >= this.height - 2) return true;
    if (x < 0 || x > this.width) return false;

    // Quick bounding box check against all buildings
    let insideAnyBuilding = false;
    for (const b of this.buildings) {
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= this.height) {
        insideAnyBuilding = true;
        break;
      }
    }
    if (!insideAnyBuilding) return false;

    // Sample terrain pixel alpha
    if (this.terrainCtx) {
      try {
        const pixel = this.terrainCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return pixel[3] > 32; // Solid masonry has alpha > 32; blasted crater has alpha 0
      } catch {
        return true;
      }
    }

    return insideAnyBuilding;
  }

  update(dt, banana = null) {
    // Update gorilla animations
    [this.gorilla1, this.gorilla2].forEach(g => {
      if (!g) return;
      g.animTick += dt;
      if (g.state === 'throwing' && g.animTick > 0.4) {
        g.state = 'idle';
      }
    });

    // Sun reaction to flying banana
    if (banana && banana.active) {
      const dx = banana.x - this.sun.x;
      const dy = banana.y - this.sun.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 48) {
        this.sun.shocked = true;
        this.sun.shockTimer = 0.8;
      }
    }

    if (this.sun.shockTimer > 0) {
      this.sun.shockTimer -= dt;
      if (this.sun.shockTimer <= 0) {
        this.sun.shocked = false;
      }
    }
  }

  render(ctx) {
    if (!ctx) return;

    // 1. Draw smiling retro Sun in the sky
    this.renderSun(ctx);

    // 2. Draw destructible buildings terrain layer
    if (this.terrainCanvas) {
      ctx.drawImage(this.terrainCanvas, 0, 0);
    } else {
      // Fallback for non-canvas environments
      for (const b of this.buildings) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      }
    }

    // 3. Draw Gorillas
    this.renderGorilla(ctx, this.gorilla1);
    this.renderGorilla(ctx, this.gorilla2);
  }

  renderSun(ctx) {
    const { x, y, radius, shocked } = this.sun;

    ctx.save();
    // Sun rays
    ctx.strokeStyle = '#ffff55';
    ctx.lineWidth = 2;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x1 = x + Math.cos(angle) * (radius + 2);
      const y1 = y + Math.sin(angle) * (radius + 2);
      const x2 = x + Math.cos(angle) * (radius + 9);
      const y2 = y + Math.sin(angle) * (radius + 9);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Sun face disk
    ctx.fillStyle = '#ffff55'; // EGA bright yellow
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#000000';
    if (shocked) {
      // Wide open shocked eyes
      ctx.beginPath();
      ctx.arc(x - 7, y - 4, 3.5, 0, Math.PI * 2);
      ctx.arc(x + 7, y - 4, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Shocked "O" mouth
      ctx.beginPath();
      ctx.arc(x, y + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cool smiling sun with sunglasses
      ctx.fillStyle = '#1e293b';
      // Sunglasses frames
      ctx.fillRect(x - 12, y - 7, 10, 7);
      ctx.fillRect(x + 2, y - 7, 10, 7);
      ctx.fillRect(x - 2, y - 5, 4, 2);

      // Smile
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 4, 9, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderGorilla(ctx, gorilla) {
    if (!gorilla || gorilla.state === 'dead') return;

    ctx.save();
    ctx.translate(gorilla.x, gorilla.y);

    const isCelebrate = gorilla.state === 'celebrate';
    const isThrowing = gorilla.state === 'throwing';
    const armCycle = Math.floor(gorilla.animTick * 6) % 2;

    // Gorilla Body (EGA Dark Gray / Brown)
    ctx.fillStyle = '#854d0e'; // Warm dark gorilla fur
    ctx.fillRect(-11, -12, 22, 24);

    // Chest plate / Belly
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-7, -4, 14, 14);

    // Gorilla Head
    ctx.fillStyle = '#713f12';
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Muzzle & nostrils
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(0, -14, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(-2, -15, 1.5, 1.5);
    ctx.fillRect(0.5, -15, 1.5, 1.5);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -19, 3, 3);
    ctx.fillRect(1, -19, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(gorilla.facingRight ? -3 : -4, -18, 2, 2);
    ctx.fillRect(gorilla.facingRight ? 2 : 1, -18, 2, 2);

    // Arms rendering based on state
    ctx.fillStyle = '#713f12';
    if (isCelebrate) {
      // Alternating chest pound & victory pose
      if (armCycle === 0) {
        // Left arm up, right arm pounding chest
        ctx.fillRect(-16, -24, 6, 16); // Left arm raised high
        ctx.fillRect(-6, -4, 6, 6);   // Right fist beating chest
      } else {
        // Right arm up, left arm pounding chest
        ctx.fillRect(10, -24, 6, 16);  // Right arm raised high
        ctx.fillRect(0, -4, 6, 6);    // Left fist beating chest
      }
    } else if (isThrowing) {
      // Throwing arm extended forward & upward
      if (gorilla.facingRight) {
        ctx.fillRect(-15, -6, 5, 14); // Back arm down
        ctx.fillRect(8, -22, 7, 16);  // Throwing arm up & forward
      } else {
        ctx.fillRect(10, -6, 5, 14);  // Back arm down
        ctx.fillRect(-15, -22, 7, 16); // Throwing arm up & forward
      }
    } else {
      // Idle resting arms
      ctx.fillRect(-15, -4, 5, 16);
      ctx.fillRect(10, -4, 5, 16);
    }

    // Name tag above head
    ctx.fillStyle = gorilla.id === 1 ? '#38bdf8' : '#f87171';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gorilla.name, 0, -28);

    ctx.restore();
  }
}
