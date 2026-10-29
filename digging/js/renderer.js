import { COLS, ROWS, TILE_WIDTH, TILE_HEIGHT, TILE } from './map.js';
import { BAG_STATE } from './bag.js';
import { MONSTER_TYPE } from './monsters.js';

export class DiggerRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = COLS * TILE_WIDTH;   // 480px
    this.height = ROWS * TILE_HEIGHT; // 320px

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;

    this.sparkleTimer = 0;
  }

  clear() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawMap(map) {
    this.sparkleTimer++;
    const ctx = this.ctx;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = map.getTile(c, r);
        const x = c * TILE_WIDTH;
        const y = r * TILE_HEIGHT;

        if (tile === TILE.DIRT || tile === TILE.EMERALD) {
          // Textured CGA Dirt Block
          ctx.fillStyle = '#aa5500';
          ctx.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);

          // Subtle pixel grain
          ctx.fillStyle = '#884400';
          ctx.fillRect(x + 4, y + 4, 3, 3);
          ctx.fillRect(x + 18, y + 12, 3, 3);
          ctx.fillRect(x + 10, y + 22, 3, 3);
          ctx.fillRect(x + 24, y + 26, 3, 3);

          if (tile === TILE.EMERALD) {
            this.drawEmerald(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
          }
        }
      }
    }
  }

  drawEmerald(cx, cy) {
    const ctx = this.ctx;
    const w = 12;
    const h = 14;

    ctx.save();
    ctx.translate(cx, cy);

    // Green Diamond
    ctx.fillStyle = '#00aa00';
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, -h / 6);
    ctx.lineTo(w / 2, h / 6);
    ctx.lineTo(0, h / 2);
    ctx.lineTo(-w / 2, h / 6);
    ctx.lineTo(-w / 2, -h / 6);
    ctx.closePath();
    ctx.fill();

    // Inner bright facet
    ctx.fillStyle = '#55ff55';
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 + 2);
    ctx.lineTo(w / 2 - 2, 0);
    ctx.lineTo(0, h / 2 - 2);
    ctx.lineTo(-w / 2 + 2, 0);
    ctx.closePath();
    ctx.fill();

    // Glint highlight
    if (this.sparkleTimer % 30 < 15) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -h / 2 + 3, 3, 3);
    }

    ctx.restore();
  }

  drawBags(bags) {
    bags.forEach(bag => {
      if (bag.state === BAG_STATE.COLLECTED) return;

      const drawX = bag.x + (bag.wobbleOffset || 0);
      const drawY = bag.y;

      if (bag.state === BAG_STATE.OPEN_GOLD) {
        this.drawOpenGold(drawX, drawY);
      } else {
        this.drawGoldBag(drawX, drawY);
      }
    });
  }

  drawGoldBag(x, y) {
    const ctx = this.ctx;
    ctx.save();

    // Sack Body (Golden Yellow)
    ctx.fillStyle = '#ffff55';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 8, TILE_WIDTH - 8, TILE_HEIGHT - 10, 6);
    ctx.fill();

    // Tied Top Knot
    ctx.fillStyle = '#ffff55';
    ctx.fillRect(x + 10, y + 2, TILE_WIDTH - 20, 6);

    // Red Binding Cord
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x + 9, y + 7, TILE_WIDTH - 18, 3);

    // Dollar Symbol ($)
    ctx.fillStyle = '#00aa00';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$', x + TILE_WIDTH / 2, y + TILE_HEIGHT - 7);

    ctx.restore();
  }

  drawOpenGold(x, y) {
    const ctx = this.ctx;
    ctx.save();

    // Mound of sparkling gold coins
    ctx.fillStyle = '#ffff55';
    ctx.beginPath();
    ctx.ellipse(x + TILE_WIDTH / 2, y + TILE_HEIGHT - 6, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin shine highlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + TILE_HEIGHT - 9, 3, 3);
    ctx.fillRect(x + 18, y + TILE_HEIGHT - 8, 3, 3);

    ctx.restore();
  }

  drawDigger(digger) {
    const ctx = this.ctx;
    const cx = digger.x + TILE_WIDTH / 2;
    const cy = digger.y + TILE_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (digger.isDying) {
      // Disintegration / explosion
      const r = (digger.deathTimer * 2) % 24;
      ctx.fillStyle = '#ff5555';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffff55';
      ctx.fillRect(-r / 2, -r / 2, r, r);
      ctx.restore();
      return;
    }

    // Vehicle Body
    const facingRight = digger.currentDir === 'RIGHT' || digger.currentDir === 'DOWN';
    if (!facingRight && digger.currentDir === 'LEFT') {
      ctx.scale(-1, 1);
    }

    // Main Cart Body (Golden Yellow)
    ctx.fillStyle = '#ffff55';
    ctx.fillRect(-12, -8, 20, 16);

    // Cabin Dome / Eye
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(-4, -12, 10, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -10, 4, 3);

    // Spinning Front Drill / Scoop
    const drillAngle = (digger.animFrame * 0.4) % (Math.PI * 2);
    ctx.fillStyle = '#00aaaa';
    ctx.beginPath();
    ctx.arc(10, 0, 8, drillAngle, drillAngle + Math.PI);
    ctx.fill();

    // Tread Wheels
    ctx.fillStyle = '#555555';
    ctx.fillRect(-12, 8, 20, 4);
    ctx.fillStyle = '#000000';
    const wheelOffset = (digger.animFrame % 6 < 3) ? 0 : 2;
    ctx.fillRect(-10 + wheelOffset, 9, 4, 2);
    ctx.fillRect(-2 + wheelOffset, 9, 4, 2);

    ctx.restore();

    // Draw active shot if any
    if (digger.shot) {
      this.drawShot(digger.shot);
    }
  }

  drawShot(shot) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMonsters(monsters, isBonusMode) {
    monsters.forEach(m => {
      if (m.isDead) return;
      this.drawMonster(m, isBonusMode);
    });
  }

  drawMonster(m, isBonusMode) {
    const ctx = this.ctx;
    const cx = m.x + TILE_WIDTH / 2;
    const cy = m.y + TILE_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);

    if (isBonusMode) {
      // Frightened / Vulnerable (Blue/Cyan flashing)
      const flash = (m.animTimer % 16 < 8);
      ctx.fillStyle = flash ? '#00ffff' : '#0055aa';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, -3, 3, 3);
      ctx.fillRect(2, -3, 3, 3);
      ctx.restore();
      return;
    }

    if (m.type === MONSTER_TYPE.NOBBIN) {
      // Classic Nobbin (Red round monster)
      ctx.fillStyle = '#ff5555';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Big Eyes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -5, 4, 6);
      ctx.fillRect(2, -5, 4, 6);
      ctx.fillStyle = '#0000aa';
      const lookDir = m.currentDir === 'LEFT' ? -1 : 1;
      ctx.fillRect(-6 + lookDir, -3, 3, 3);
      ctx.fillRect(2 + lookDir, -3, 3, 3);

      // Chomping mouth
      const mouthOpen = (m.animTimer % 10 < 5);
      ctx.fillStyle = '#000000';
      if (mouthOpen) {
        ctx.fillRect(-5, 4, 10, 4);
      } else {
        ctx.fillRect(-4, 5, 8, 2);
      }
    } else {
      // Hobbin (Mutated green/magenta digger monster)
      ctx.fillStyle = '#00aa00';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Horns / Mandibles
      ctx.fillStyle = '#ff55ff';
      ctx.beginPath();
      ctx.moveTo(-9, -8);
      ctx.lineTo(-13, -13);
      ctx.lineTo(-5, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(9, -8);
      ctx.lineTo(13, -13);
      ctx.lineTo(5, -10);
      ctx.fill();

      // Fierce red eyes
      ctx.fillStyle = '#ff5555';
      ctx.fillRect(-5, -4, 4, 4);
      ctx.fillRect(1, -4, 4, 4);

      // Jagged teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, 3, 3, 3);
      ctx.fillRect(3, 3, 3, 3);
      ctx.fillRect(-2, 5, 4, 3);
    }

    ctx.restore();
  }

  drawCherry(cherry) {
    if (!cherry || !cherry.active) return;
    const ctx = this.ctx;
    const cx = cherry.col * TILE_WIDTH + TILE_WIDTH / 2;
    const cy = cherry.row * TILE_HEIGHT + TILE_HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Stem
    ctx.strokeStyle = '#00aa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(4, -4, -4, 4);
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(8, -2, 6, 5);
    ctx.stroke();

    // Cherries
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-4, 5, 5, 0, Math.PI * 2);
    ctx.arc(6, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, 3, 2, 2);
    ctx.fillRect(5, 4, 2, 2);

    ctx.restore();
  }

  drawFloatingScores(floatingScores) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    floatingScores.forEach(item => {
      ctx.fillStyle = item.color || '#00ffff';
      ctx.fillText(item.text, item.x + TILE_WIDTH / 2, item.y + TILE_HEIGHT / 2);
    });
    ctx.restore();
  }

  drawWeaponHUD(digger) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#8888aa';
    ctx.fillText('WEAPON:', 12, this.height - 8);

    // Recharge progress bar
    const barX = 75;
    const barY = this.height - 15;
    const barW = 50;
    const barH = 7;

    ctx.strokeStyle = '#555555';
    ctx.strokeRect(barX, barY, barW, barH);

    const chargePct = Math.max(0, 1 - (digger.rechargeTimer / digger.rechargeMax));
    ctx.fillStyle = chargePct >= 1 ? '#00ff66' : '#ffff00';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * chargePct, barH - 2);

    ctx.restore();
  }

  drawOverlay(text, subtext = '', color = '#ffff55') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = '18px "Press Start 2P", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(text, this.width / 2, this.height / 2 - 12);

    if (subtext) {
      ctx.shadowBlur = 0;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtext, this.width / 2, this.height / 2 + 20);
    }
    ctx.restore();
  }
}
