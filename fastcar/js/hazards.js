/**
 * Fast Car Hazards & Collectibles Manager
 * Oil slicks, hazard barrels, spinning gold coins, and floating score popups.
 */

export class HazardManager {
  constructor(difficulty = 'medium') {
    this.items = []; // Active road objects { id, type, lane, z, animTick }
    this.floatingTexts = []; // Floating score indicators

    this.difficulty = difficulty;
    this.distanceSinceSpawn = 0;
    this.idCounter = 0;
    this.computeNextSpawnDistance();
  }

  reset() {
    this.items = [];
    this.floatingTexts = [];
    this.distanceSinceSpawn = 0;
    this.computeNextSpawnDistance();
  }

  setDifficulty(diff) {
    if (['easy', 'medium', 'hard'].includes(diff)) {
      this.difficulty = diff;
      this.computeNextSpawnDistance();
    }
  }

  computeNextSpawnDistance() {
    // Hard: original dense obstacle frequency (~210 - 280 spacing)
    // Medium: half the obstacles, double the spacing (~420 - 510 spacing)
    // Easy: halve again (1/4 the obstacles, quadruple spacing: ~820 - 980 spacing)
    if (this.difficulty === 'easy') {
      this.spawnDistance = 820 + Math.random() * 160;
    } else if (this.difficulty === 'medium') {
      this.spawnDistance = 420 + Math.random() * 90;
    } else {
      this.spawnDistance = 210 + Math.random() * 70;
    }
  }

  update(speed, dt = 1 / 60) {
    // 1. Move items toward camera
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.z -= speed;
      item.animTick = (item.animTick || 0) + 1;

      // Remove once behind the camera
      if (item.z < -40) {
        this.items.splice(i, 1);
      }
    }

    // 2. Spawn new wave patterns based on difficulty interval
    this.distanceSinceSpawn += speed;
    if (this.distanceSinceSpawn >= this.spawnDistance) {
      this.spawnWave();
      this.distanceSinceSpawn = 0;
      this.computeNextSpawnDistance();
    }

    // 3. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  spawnWave() {
    const lanes = [-1, 0, 1];
    const spawnZ = 1100; // Far ahead at horizon

    if (this.difficulty === 'easy') {
      // EASY: 1/4 the obstacles, mostly coin trails and isolated single obstacles
      const roll = Math.random();
      if (roll < 0.60) {
        // Pure coin run (rewarding relaxed drive)
        const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.addItem('coin', coinLane, spawnZ);
        this.addItem('coin', coinLane, spawnZ + 60);
        this.addItem('coin', coinLane, spawnZ + 120);
      } else {
        // Single isolated obstacle in one lane, 2 completely clear lanes
        const shuffled = [...lanes].sort(() => Math.random() - 0.5);
        const obsType = Math.random() > 0.6 ? 'barrel' : 'oil_slick';
        this.addItem(obsType, shuffled[0], spawnZ);
        this.addItem('coin', shuffled[1], spawnZ + 30);
      }
      return;
    }

    if (this.difficulty === 'medium') {
      // MEDIUM: Half the obstacles of hard mode, balanced arcade fun
      const roll = Math.random();
      if (roll < 0.40) {
        // Triple coin run
        const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.addItem('coin', coinLane, spawnZ);
        this.addItem('coin', coinLane, spawnZ + 60);
        this.addItem('coin', coinLane, spawnZ + 120);
      } else if (roll < 0.85) {
        // 1 single obstacle in 1 lane, coins in 2nd lane, 3rd lane empty
        const shuffled = [...lanes].sort(() => Math.random() - 0.5);
        const obsType = Math.random() > 0.5 ? 'barrel' : 'oil_slick';
        this.addItem(obsType, shuffled[0], spawnZ);
        this.addItem('coin', shuffled[1], spawnZ);
        this.addItem('coin', shuffled[1], spawnZ + 60);
      } else {
        // Mild challenge: 1 barrel + 1 oil slick in separate lanes, 1 clear lane
        const shuffled = [...lanes].sort(() => Math.random() - 0.5);
        this.addItem('barrel', shuffled[0], spawnZ);
        this.addItem('oil_slick', shuffled[1], spawnZ);
        this.addItem('coin', shuffled[2], spawnZ);
      }
      return;
    }

    // HARD: Original dense obstacle challenge
    const waveType = Math.random();
    if (waveType < 0.35) {
      // Pattern 1: Coin run in one lane + 1 obstacle in another lane
      const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
      const obsLanes = lanes.filter(l => l !== coinLane);
      const obsLane = obsLanes[Math.floor(Math.random() * obsLanes.length)];
      const obsType = Math.random() > 0.5 ? 'oil_slick' : 'barrel';

      this.addItem('coin', coinLane, spawnZ);
      this.addItem('coin', coinLane, spawnZ + 70);
      this.addItem(obsType, obsLane, spawnZ);

    } else if (waveType < 0.65) {
      // Pattern 2: Oil slick in one lane, barrel in second lane, safe coin in third lane
      const shuffled = [...lanes].sort(() => Math.random() - 0.5);
      this.addItem('barrel', shuffled[0], spawnZ);
      this.addItem('oil_slick', shuffled[1], spawnZ);
      this.addItem('coin', shuffled[2], spawnZ);

    } else if (waveType < 0.85) {
      // Pattern 3: Triple coin jackpot line!
      const targetLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.addItem('coin', targetLane, spawnZ);
      this.addItem('coin', targetLane, spawnZ + 60);
      this.addItem('coin', targetLane, spawnZ + 120);

    } else {
      // Pattern 4: Dual barrels with 1 open lane containing a coin
      const openLane = lanes[Math.floor(Math.random() * lanes.length)];
      lanes.filter(l => l !== openLane).forEach(l => {
        this.addItem('barrel', l, spawnZ);
      });
      this.addItem('coin', openLane, spawnZ);
    }
  }

  addItem(type, lane, z) {
    this.items.push({
      id: ++this.idCounter,
      type,
      lane,
      z,
      animTick: 0
    });
  }

  addFloatingText(text, x, y, color = '#facc15') {
    this.floatingTexts.push({
      text,
      x,
      y,
      alpha: 1.0,
      color
    });
  }

  /**
   * Check collision/pickup with the player car
   * Returns list of triggered events: { type: 'coin' | 'oil_slick' | 'barrel', item, points }
   */
  checkCarCollisions(playerCar) {
    const hits = [];

    // Collision depth window (car is at z = 0 to 30)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (item.z >= 0 && item.z <= 32) {
        // Lateral lane proximity check
        const laneDiff = Math.abs(playerCar.laneOffset - item.lane);

        if (laneDiff < 0.46) {
          if (item.type === 'coin') {
            hits.push({ type: 'coin', item, points: 100 });
            this.addFloatingText('+100', playerCar.x, playerCar.y - 25, '#facc15');
            this.items.splice(i, 1);
          } else if (item.type === 'oil_slick') {
            hits.push({ type: 'oil_slick', item });
            this.addFloatingText('SPIN!', playerCar.x, playerCar.y - 25, '#38bdf8');
            this.items.splice(i, 1);
          } else if (item.type === 'barrel') {
            hits.push({ type: 'barrel', item });
            this.addFloatingText('CRASH!', playerCar.x, playerCar.y - 25, '#ef4444');
            this.items.splice(i, 1);
          }
        }
      }
    }

    return hits;
  }

  draw(ctx, road) {
    // Sort items by distance (furthest Z drawn first)
    const sorted = [...this.items].sort((a, b) => b.z - a.z);

    for (const item of sorted) {
      if (item.z <= 5 || item.z >= 1150) continue;

      const pos = road.getLanePosition(item.lane, item.z);
      if (!pos || pos.scale <= 0.05) continue;

      ctx.save();
      ctx.translate(pos.x, pos.y);

      switch (item.type) {
        case 'coin':
          this.drawCoin(ctx, pos.scale, item.animTick);
          break;
        case 'oil_slick':
          this.drawOilSlick(ctx, pos.scale);
          break;
        case 'barrel':
          this.drawBarrel(ctx, pos.scale);
          break;
      }

      ctx.restore();
    }

    // Draw floating score indicators
    ctx.save();
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  /**
   * 3D Rotating Golden Coin
   */
  drawCoin(ctx, scale, tick = 0) {
    const radius = 22 * scale;
    // Rotation aspect ratio (1.0 -> 0.1 -> 1.0)
    const rotSpeed = 0.08;
    const rotWidth = Math.abs(Math.cos(tick * rotSpeed)) * radius;

    // Outer gold rim
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.8, Math.max(2, rotWidth), radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright gold face
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.8, Math.max(1, rotWidth * 0.75), radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star / dollar shine center
    if (rotWidth > radius * 0.4) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -radius * 0.8, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Dark Shimmering Viscous Oil Slick on Asphalt
   */
  drawOilSlick(ctx, scale) {
    const rx = 36 * scale;
    const ry = 14 * scale;

    // Iridescent oil sheen
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(0.8, '#312e81'); // purple sheen
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rainbow gloss highlight
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath();
    ctx.ellipse(-rx * 0.2, -ry * 0.2, rx * 0.4, ry * 0.3, -0.2, 0, Math.PI);
    ctx.stroke();
  }

  /**
   * Industrial Hazard Barrel with Warning Stripes
   */
  drawBarrel(ctx, scale) {
    const w = 34 * scale;
    const h = 48 * scale;
    const x = -w / 2;
    const y = -h;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 2, w * 0.65, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metal barrel body (Orange/Red)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4 * scale);
    ctx.fill();

    // Hazard yellow/black chevron stripes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 2 * scale, y + h * 0.3, w - 4 * scale, h * 0.35);

    // Black diagonal stripes on hazard band
    ctx.fillStyle = '#0f172a';
    const stripeW = 6 * scale;
    for (let sx = x + 4 * scale; sx < x + w - 4 * scale; sx += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, y + h * 0.3);
      ctx.lineTo(sx + stripeW, y + h * 0.3);
      ctx.lineTo(sx, y + h * 0.65);
      ctx.lineTo(sx - stripeW, y + h * 0.65);
      ctx.closePath();
      ctx.fill();
    }

    // Metal rims (top, mid, bottom)
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.25); ctx.lineTo(x + w, y + h * 0.25);
    ctx.moveTo(x, y + h * 0.75); ctx.lineTo(x + w, y + h * 0.75);
    ctx.stroke();

    // Top barrel lid
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(0, y, w * 0.5, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
