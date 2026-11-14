/**
 * Safari Obstacles: Baobab Trees, Savanna Rocks, Termite Mounds & Flying Vultures
 */

export class ObstacleManager {
  constructor(canvasWidth, groundY) {
    this.canvasWidth = canvasWidth;
    this.groundY = groundY;
    this.obstacles = [];
    this.nextSpawnDistance = 280;
    this.distanceSinceLast = 0;
  }

  reset() {
    this.obstacles = [];
    this.nextSpawnDistance = 280;
    this.distanceSinceLast = 0;
  }

  update(speed, currentScore) {
    // Move existing obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= speed;

      // Update animation frames for animated obstacles (vulture wings)
      if (obs.type === 'vulture') {
        obs.animTick = (obs.animTick || 0) + 1;
        obs.frame = Math.floor(obs.animTick / 7) % 3; // 0: up, 1: glide, 2: down
      }

      // Remove offscreen
      if (obs.x + obs.width < -50) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles
    this.distanceSinceLast += speed;
    if (this.distanceSinceLast >= this.nextSpawnDistance) {
      this.spawnObstacle(currentScore, speed);
      this.distanceSinceLast = 0;
      // Fair spacing based on speed: cheetah must have reaction time and jump space
      const baseGap = 240 + speed * 18;
      this.nextSpawnDistance = baseGap + Math.random() * 260;
    }
  }

  spawnObstacle(currentScore, speed) {
    const types = ['baobab_small', 'rock_boulder', 'rock_cluster', 'baobab_large', 'termite_mound'];

    // Unlock double baobabs after score 150
    if (currentScore > 150) {
      types.push('baobab_twin');
    }

    // Unlock flying vultures after score 200
    if (currentScore > 200) {
      types.push('vulture', 'vulture');
    }

    const type = types[Math.floor(Math.random() * types.length)];
    let obstacle = null;
    const startX = this.canvasWidth + 20;

    switch (type) {
      case 'baobab_small':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 52,
          width: 38,
          height: 52
        };
        break;

      case 'baobab_large':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 68,
          width: 52,
          height: 68
        };
        break;

      case 'baobab_twin':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 62,
          width: 76,
          height: 62
        };
        break;

      case 'rock_boulder':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 32,
          width: 42,
          height: 32
        };
        break;

      case 'rock_cluster':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 26,
          width: 56,
          height: 26
        };
        break;

      case 'termite_mound':
        obstacle = {
          type,
          x: startX,
          y: this.groundY - 58,
          width: 32,
          height: 58
        };
        break;

      case 'vulture': {
        // Altitudes: low (must jump), mid (must duck), high (safe run)
        const altitudeRoll = Math.random();
        let altitude = 'mid';
        let yOffset = 58;

        if (altitudeRoll < 0.35) {
          altitude = 'low';
          yOffset = 30; // low: near ground, jump over
        } else if (altitudeRoll < 0.8) {
          altitude = 'mid';
          yOffset = 58; // mid: head height, duck under
        } else {
          altitude = 'high';
          yOffset = 90; // high: ambient danger
        }

        obstacle = {
          type,
          altitude,
          x: startX,
          y: this.groundY - yOffset,
          width: 46,
          height: 32,
          animTick: 0,
          frame: 0
        };
        break;
      }
    }

    if (obstacle) {
      this.obstacles.push(obstacle);
    }
  }

  getHitboxes(obs) {
    // Generous, fair hitboxes to avoid cheap deaths
    switch (obs.type) {
      case 'baobab_small':
        return [
          { x: obs.x + 8, y: obs.y + 16, w: 22, h: 36 }, // Trunk
          { x: obs.x + 2, y: obs.y + 4,  w: 34, h: 20 }  // Crown
        ];

      case 'baobab_large':
        return [
          { x: obs.x + 12, y: obs.y + 20, w: 28, h: 48 }, // Trunk
          { x: obs.x + 4,  y: obs.y + 4,  w: 44, h: 26 }  // Crown
        ];

      case 'baobab_twin':
        return [
          { x: obs.x + 6,  y: obs.y + 18, w: 64, h: 44 }, // Double trunk
          { x: obs.x + 2,  y: obs.y + 4,  w: 72, h: 24 }  // Double crown
        ];

      case 'rock_boulder':
        return [
          { x: obs.x + 4, y: obs.y + 4, w: obs.width - 8, h: obs.height - 4 }
        ];

      case 'rock_cluster':
        return [
          { x: obs.x + 4, y: obs.y + 4, w: obs.width - 8, h: obs.height - 4 }
        ];

      case 'termite_mound':
        return [
          { x: obs.x + 6, y: obs.y + 6, w: obs.width - 12, h: obs.height - 6 }
        ];

      case 'vulture':
        return [
          { x: obs.x + 8, y: obs.y + 6, w: 30, h: 18 } // Vulture body & core
        ];

      default:
        return [
          { x: obs.x, y: obs.y, w: obs.width, h: obs.height }
        ];
    }
  }

  draw(ctx) {
    for (const obs of this.obstacles) {
      ctx.save();
      switch (obs.type) {
        case 'baobab_small':
          this.drawBaobab(ctx, obs.x, obs.y, 38, 52);
          break;
        case 'baobab_large':
          this.drawBaobab(ctx, obs.x, obs.y, 52, 68);
          break;
        case 'baobab_twin':
          this.drawBaobab(ctx, obs.x, obs.y, 44, 62);
          this.drawBaobab(ctx, obs.x + 30, obs.y + 6, 38, 56);
          break;
        case 'rock_boulder':
          this.drawRockBoulder(ctx, obs.x, obs.y, obs.width, obs.height);
          break;
        case 'rock_cluster':
          this.drawRockCluster(ctx, obs.x, obs.y, obs.width, obs.height);
          break;
        case 'termite_mound':
          this.drawTermiteMound(ctx, obs.x, obs.y, obs.width, obs.height);
          break;
        case 'vulture':
          this.drawVulture(ctx, obs.x, obs.y, obs.width, obs.height, obs.frame);
          break;
      }
      ctx.restore();
    }
  }

  /**
   * Baobab Tree Renderer (Thick iconic African bulbous trunk & spreading crown)
   */
  drawBaobab(ctx, x, y, w, h) {
    const trunkColor = '#78350f';
    const trunkHighlight = '#92400e';
    const branchColor = '#451a03';
    const leafColor = '#15803d';
    const leafHighlight = '#16a34a';

    const trunkBottom = y + h;
    const trunkWidth = w * 0.58;
    const trunkCenter = x + w / 2;

    // 1. Swollen Bulbous Trunk
    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.moveTo(trunkCenter - trunkWidth * 0.6, trunkBottom);
    ctx.quadraticCurveTo(trunkCenter - trunkWidth * 0.75, y + h * 0.5, trunkCenter - trunkWidth * 0.4, y + h * 0.28);
    ctx.lineTo(trunkCenter + trunkWidth * 0.4, y + h * 0.28);
    ctx.quadraticCurveTo(trunkCenter + trunkWidth * 0.75, y + h * 0.5, trunkCenter + trunkWidth * 0.6, trunkBottom);
    ctx.closePath();
    ctx.fill();

    // Trunk Bark Ridges / Highlight
    ctx.strokeStyle = trunkHighlight;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(trunkCenter - 2, trunkBottom - 4);
    ctx.quadraticCurveTo(trunkCenter - 4, y + h * 0.55, trunkCenter - 2, y + h * 0.32);
    ctx.stroke();

    // 2. Gnarly Spreading Branches
    ctx.strokeStyle = branchColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Left branch
    ctx.moveTo(trunkCenter - 4, y + h * 0.3);
    ctx.quadraticCurveTo(trunkCenter - w * 0.35, y + h * 0.2, x + 4, y + 10);
    // Right branch
    ctx.moveTo(trunkCenter + 4, y + h * 0.3);
    ctx.quadraticCurveTo(trunkCenter + w * 0.35, y + h * 0.2, x + w - 4, y + 10);
    // Central upright branch
    ctx.moveTo(trunkCenter, y + h * 0.28);
    ctx.lineTo(trunkCenter, y + 6);
    ctx.stroke();

    // 3. Foliage Tufts (Distinct sparse savanna leaves)
    ctx.fillStyle = leafColor;
    // Left tuft
    ctx.beginPath();
    ctx.arc(x + 6, y + 10, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // Center tuft
    ctx.beginPath();
    ctx.arc(trunkCenter, y + 6, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    // Right tuft
    ctx.beginPath();
    ctx.arc(x + w - 6, y + 10, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Foliage highlights
    ctx.fillStyle = leafHighlight;
    ctx.beginPath();
    ctx.arc(trunkCenter - 2, y + 4, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * African Savanna Granite Boulder
   */
  drawRockBoulder(ctx, x, y, w, h) {
    const rockBase = '#7c2d12';
    const rockLit = '#c2410c';
    const rockShadow = '#431407';

    ctx.fillStyle = rockBase;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h);
    ctx.lineTo(x + 2, y + h * 0.6);
    ctx.lineTo(x + w * 0.25, y + 4);
    ctx.lineTo(x + w * 0.75, y + 2);
    ctx.lineTo(x + w - 2, y + h * 0.5);
    ctx.lineTo(x + w - 4, y + h);
    ctx.closePath();
    ctx.fill();

    // Shading facets
    ctx.fillStyle = rockLit;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + 4);
    ctx.lineTo(x + w * 0.6, y + 3);
    ctx.lineTo(x + w * 0.45, y + h * 0.65);
    ctx.lineTo(x + w * 0.15, y + h * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rockShadow;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.6, y + 3);
    ctx.lineTo(x + w - 2, y + h * 0.5);
    ctx.lineTo(x + w - 4, y + h);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Savanna Rock Cluster
   */
  drawRockCluster(ctx, x, y, w, h) {
    // Left rock
    this.drawRockBoulder(ctx, x, y + 4, w * 0.55, h - 4);
    // Right smaller rock
    this.drawRockBoulder(ctx, x + w * 0.45, y + 8, w * 0.52, h - 8);
  }

  /**
   * African Termite Mound (Tall sculpted earth chimney)
   */
  drawTermiteMound(ctx, x, y, w, h) {
    const moundEarth = '#9a3412';
    const moundHighlight = '#ea580c';
    const moundDark = '#431407';

    ctx.fillStyle = moundEarth;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.35, y + 4);
    ctx.lineTo(x + w * 0.65, y + 4);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w - 2, y + h);
    ctx.closePath();
    ctx.fill();

    // Spire peaks
    ctx.fillStyle = moundHighlight;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h);
    ctx.lineTo(x + w * 0.4, y + 6);
    ctx.lineTo(x + w * 0.55, y + 6);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.closePath();
    ctx.fill();

    // Hollow ventilation chimney holes
    ctx.fillStyle = moundDark;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + 16, 2.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + w * 0.4, y + 34, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * African Vulture (Flying Raptor with 3 wing flapping frames)
   */
  drawVulture(ctx, x, y, w, h, frame = 0) {
    const bodyColor = '#1e293b';
    const wingColor = '#0f172a';
    const headColor = '#dc2626'; // red/pinkish bald head
    const beakColor = '#f59e0b'; // yellow hooked beak

    // Wing angles based on frame (0: wings up, 1: glide, 2: wings down)
    const wingOffsets = [
      { wy1: -14, wy2: -18, wy3: -12 }, // Up
      { wy1: -2,  wy2: -4,  wy3: 0 },   // Glide
      { wy1: 10,  wy2: 14,  wy3: 8 }    // Down
    ][frame];

    const centerX = x + w * 0.45;
    const centerY = y + h * 0.55;

    // 1. Far Wing
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 2);
    ctx.quadraticCurveTo(centerX - 8, centerY + wingOffsets.wy1, centerX - 18, centerY + wingOffsets.wy2);
    ctx.lineTo(centerX - 10, centerY + wingOffsets.wy3);
    ctx.closePath();
    ctx.fill();

    // 2. Body & Tail feathers
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 14, 7, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Fan tail
    ctx.beginPath();
    ctx.moveTo(centerX + 12, centerY - 2);
    ctx.lineTo(centerX + 24, centerY + 2);
    ctx.lineTo(centerX + 22, centerY + 8);
    ctx.lineTo(centerX + 10, centerY + 4);
    ctx.closePath();
    ctx.fill();

    // 3. Near Wing
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 4, centerY);
    ctx.quadraticCurveTo(centerX - 12, centerY + wingOffsets.wy1 + 4, centerX - 22, centerY + wingOffsets.wy2 + 2);
    ctx.lineTo(centerX - 8, centerY + wingOffsets.wy3 + 2);
    ctx.closePath();
    ctx.fill();

    // 4. Hunched Neck & Bald Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    // Neck
    ctx.moveTo(centerX - 10, centerY - 2);
    ctx.lineTo(centerX - 18, centerY - 8);
    ctx.lineTo(centerX - 24, centerY - 6);
    ctx.lineTo(centerX - 12, centerY + 3);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(centerX - 22, centerY - 6, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Hooked Beak
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 25, centerY - 8);
    ctx.lineTo(centerX - 31, centerY - 5);
    ctx.lineTo(centerX - 26, centerY - 2);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 23, centerY - 7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
