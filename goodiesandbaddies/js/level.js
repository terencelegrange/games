/**
 * Goodies and Baddies Level 1: The Haunted Graveyard & Forest of Despair
 * Continuous 3,600px scrolling world with multi-layer parallax,
 * destructible ledges, climbable ladders, water moats, and castle gate boss arena.
 */

export class Level1 {
  constructor() {
    this.width = 3600;
    this.height = 500;

    // Solid collision platforms (walkable tops)
    this.platforms = [
      // Sector 1: Graveyard Ground
      { x: 0, y: 400, width: 2150, height: 100, type: 'ground' },

      // Graveyard Elevated Stone Ledges
      { x: 420, y: 310, width: 180, height: 20, type: 'stone' },
      { x: 780, y: 250, width: 220, height: 20, type: 'stone' },
      { x: 1480, y: 300, width: 180, height: 20, type: 'tomb_perch' },

      // Sector 2: Forest Bridges over Dark Water
      { x: 2150, y: 400, width: 140, height: 20, type: 'bridge' },
      // Water Gap 1: 2290 to 2410 (Pit Hazard!)
      { x: 2410, y: 400, width: 180, height: 20, type: 'bridge' },
      // Elevated forest platform
      { x: 2520, y: 290, width: 210, height: 20, type: 'wood' },

      // Sector 3 & 4: Castle Approach & Boss Arena Ground
      { x: 2590, y: 400, width: 1010, height: 100, type: 'stone_ground' }
    ];

    // Climbable ladders
    this.ladders = [
      { x: 530, y: 310, width: 22, height: 90 },
      { x: 920, y: 250, width: 22, height: 150 },
      { x: 1580, y: 300, width: 22, height: 100 },
      { x: 2660, y: 290, width: 22, height: 110 }
    ];

    // Props: Celtic Crosses, Tombstones, Dead Trees, and Castle Gate
    this.props = [
      // Sector 1 Tombs & Crosses
      { x: 120, y: 350, type: 'cross' },
      { x: 280, y: 362, type: 'tombstone' },
      { x: 380, y: 320, type: 'dead_tree' },
      { x: 680, y: 352, type: 'cross' },
      { x: 740, y: 365, type: 'tombstone' },
      { x: 1120, y: 315, type: 'dead_tree' },
      { x: 1320, y: 355, type: 'cross' },
      { x: 1540, y: 255, type: 'cross' }, // Red Arremer perch tomb

      // Sector 2 Forest Trees
      { x: 1980, y: 310, type: 'dead_tree' },
      { x: 2180, y: 310, type: 'dead_tree' },
      { x: 2480, y: 305, type: 'dead_tree' },
      { x: 2820, y: 300, type: 'torch_pillar' },

      // Sector 3 Castle Ramparts & Gate
      { x: 3020, y: 335, type: 'torch_pillar' },
      { x: 3250, y: 335, type: 'torch_pillar' },
      { x: 3520, y: 180, type: 'castle_gate' }
    ];

    // Castle Portcullis gate state
    this.gateOpen = false;
    this.gateProgress = 0; // 0 to 1

    // Golden Key drop entity
    this.key = null;
  }

  spawnKey(x, y) {
    this.key = {
      x,
      y,
      vy: -150,
      active: true,
      sparkleTimer: 0
    };
  }

  update(dt, arthur) {
    // Animate Key falling and resting on ground
    if (this.key && this.key.active) {
      this.key.sparkleTimer += dt;
      if (this.key.y < 370) {
        this.key.vy += 600 * dt;
        this.key.y += this.key.vy * dt;
      } else {
        this.key.y = 370;
        this.key.vy = 0;
      }

      // Check Arthur touching Key
      const dist = Math.hypot(arthur.x + 12 - this.key.x, arthur.y + 16 - this.key.y);
      if (dist < 28) {
        this.key.active = false;
        this.gateOpen = true;
        return 'KEY_COLLECTED';
      }
    }

    if (this.gateOpen && this.gateProgress < 1.0) {
      this.gateProgress = Math.min(1.0, this.gateProgress + dt * 0.8);
    }

    return null;
  }

  renderParallax(ctx, cameraX) {
    // 1. Far Celestial Sky & Stars (Speed: 0.05x)
    ctx.save();
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
    skyGrad.addColorStop(0, '#090d16'); // Pitch night black
    skyGrad.addColorStop(0.6, '#0f172a'); // Dark navy slate
    skyGrad.addColorStop(1, '#1e1b4b'); // Spooky purple horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 500);

    // Glowing Crescent Moon
    const moonScreenX = 640 - (cameraX * 0.03) % 800;
    ctx.fillStyle = '#fef08a'; // Pale yellow glow
    ctx.beginPath();
    ctx.arc(moonScreenX, 85, 28, 0, Math.PI * 2);
    ctx.fill();
    // Moon shadow bite
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(moonScreenX + 10, 80, 26, 0, Math.PI * 2);
    ctx.fill();

    // 2. Mid Mountain Silhouettes & Castle Ruins (Speed: 0.22x)
    const midOffset = -(cameraX * 0.22) % 400;
    ctx.fillStyle = '#1e1b4b'; // Deep purple mountain silhouettes
    for (let x = -200 + midOffset; x < 900; x += 220) {
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x + 110, 240);
      ctx.lineTo(x + 220, 400);
      ctx.closePath();
      ctx.fill();

      // Gothic church ruin spire
      ctx.fillRect(x + 95, 200, 30, 70);
      ctx.beginPath();
      ctx.moveTo(x + 90, 200);
      ctx.lineTo(x + 110, 150);
      ctx.lineTo(x + 130, 200);
      ctx.fill();
    }

    // 3. Near Foggy Cemetery Hills (Speed: 0.45x)
    const nearOffset = -(cameraX * 0.45) % 320;
    ctx.fillStyle = '#1e293b'; // Slate fog hills
    for (let x = -200 + nearOffset; x < 950; x += 160) {
      ctx.beginPath();
      ctx.arc(x + 80, 440, 110, Math.PI, 0);
      ctx.fill();
    }

    ctx.restore();
  }

  render(ctx, cameraX) {
    this.renderPlayfield(ctx, cameraX);
  }

  renderPlayfield(ctx, cameraX) {
    ctx.save();

    // 1. Render Platforms & Terrain
    for (const p of this.platforms) {
      const sx = Math.round(p.x - cameraX);
      const sy = Math.round(p.y);

      // Cull platforms outside visible viewport
      if (sx + p.width < -50 || sx > 850) continue;

      if (p.type === 'ground' || p.type === 'stone_ground') {
        // Cemetery ground
        ctx.fillStyle = '#3f3f46'; // Dark cemetery earth
        ctx.fillRect(sx, sy, p.width, p.height);

        // Mossy grass surface strip
        ctx.fillStyle = '#15803d'; // Murky moss green
        ctx.fillRect(sx, sy, p.width, 6);
        ctx.fillStyle = '#166534';
        ctx.fillRect(sx, sy + 6, p.width, 4);

        // Brick masonry texture
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        for (let bx = sx; bx < sx + p.width; bx += 32) {
          ctx.beginPath();
          ctx.moveTo(bx, sy + 10);
          ctx.lineTo(bx, sy + p.height);
          ctx.stroke();
        }
      } else if (p.type === 'bridge') {
        // Wooden bridge planks over dark water pit
        ctx.fillStyle = '#78350f';
        ctx.fillRect(sx, sy, p.width, p.height);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, p.width, p.height);
        for (let bx = sx + 12; bx < sx + p.width; bx += 16) {
          ctx.beginPath();
          ctx.moveTo(bx, sy);
          ctx.lineTo(bx, sy + p.height);
          ctx.stroke();
        }
      } else {
        // Stone / Wooden elevated ledges
        ctx.fillStyle = '#64748b'; // Slate stone
        ctx.fillRect(sx, sy, p.width, p.height);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx, sy, p.width, 3);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, p.width, p.height);
      }
    }

    // Render Water Pit Hazard at X = 2290 to 2410
    const waterSx = Math.round(2290 - cameraX);
    if (waterSx > -150 && waterSx < 850) {
      const waterGrad = ctx.createLinearGradient(0, 420, 0, 500);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(waterSx, 410, 120, 90);

      // Bubbling poisonous water ripples
      ctx.fillStyle = '#38bdf8';
      const ripple = Math.sin(performance.now() * 0.005) * 4;
      ctx.fillRect(waterSx + 20 + ripple, 416, 25, 2);
      ctx.fillRect(waterSx + 70 - ripple, 422, 30, 2);
    }

    // 2. Render Ladders
    for (const l of this.ladders) {
      const sx = Math.round(l.x - cameraX);
      const sy = Math.round(l.y);

      if (sx + l.width < -50 || sx > 850) continue;

      ctx.fillStyle = '#b45309'; // Wood brown ladder rails
      ctx.fillRect(sx, sy, 3, l.height);
      ctx.fillRect(sx + l.width - 3, sy, 3, l.height);

      // Ladder Rungs
      ctx.fillStyle = '#d97706';
      for (let ry = sy + 6; ry < sy + l.height; ry += 12) {
        ctx.fillRect(sx, ry, l.width, 2.5);
      }
    }

    // 3. Render Props (Tombstones, Celtic Crosses, Gnarled Trees, Castle Gate)
    for (const prop of this.props) {
      const sx = Math.round(prop.x - cameraX);
      const sy = Math.round(prop.y);

      if (sx < -100 || sx > 900) continue;

      if (prop.type === 'cross') {
        // Celtic Stone Cross
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx + 8, sy, 8, 48); // Vertical shaft
        ctx.fillRect(sx, sy + 12, 24, 8); // Horizontal bar
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 12, sy + 16, 10, 0, Math.PI * 2);
        ctx.stroke();
      } else if (prop.type === 'tombstone') {
        // Weathered Headstone
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(sx + 10, sy + 10, 10, Math.PI, 0);
        ctx.lineTo(sx + 20, sy + 35);
        ctx.lineTo(sx, sy + 35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.font = '7px sans-serif';
        ctx.fillText('R.I.P.', sx + 2, sy + 22);
      } else if (prop.type === 'dead_tree') {
        // Spooky dead twisted branches
        ctx.fillStyle = '#292524';
        ctx.beginPath();
        ctx.moveTo(sx + 12, sy + 85);
        ctx.lineTo(sx + 18, sy + 40);
        ctx.lineTo(sx + 35, sy + 10);
        ctx.lineTo(sx + 30, sy + 14);
        ctx.lineTo(sx + 18, sy + 32);
        ctx.lineTo(sx + 14, sy);
        ctx.lineTo(sx + 10, sy + 30);
        ctx.lineTo(sx - 10, sy + 15);
        ctx.lineTo(sx - 4, sy + 25);
        ctx.lineTo(sx + 6, sy + 45);
        ctx.lineTo(sx + 2, sy + 85);
        ctx.closePath();
        ctx.fill();
      } else if (prop.type === 'torch_pillar') {
        // Stone pillar with blazing torch
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx, sy + 20, 14, 45);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx - 2, sy + 16, 18, 5);

        // Blazing torch fire
        const f = Math.sin(performance.now() * 0.015 + prop.x) * 3;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(sx + 7, sy + 8 + f, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx + 7, sy + 8 + f, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (prop.type === 'castle_gate') {
        // Grand Stone Castle Ramparts
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx, sy - 40, 120, 260); // High fortress wall

        // Battlements tooth trim
        ctx.fillStyle = '#0f172a';
        for (let bx = sx; bx < sx + 120; bx += 24) {
          ctx.fillRect(bx, sy - 55, 14, 15);
        }

        // Iron Portcullis Gateway Arch
        ctx.fillStyle = '#020617'; // Shadow portal
        ctx.fillRect(sx + 25, sy + 40, 70, 180);

        // Rising Portcullis Grate
        const gateRise = Math.round(this.gateProgress * 140);
        ctx.save();
        ctx.beginPath();
        ctx.rect(sx + 25, sy + 40, 70, 180);
        ctx.clip();

        ctx.strokeStyle = '#94a3b8'; // Iron bars
        ctx.lineWidth = 3;
        for (let gx = sx + 32; gx < sx + 90; gx += 11) {
          ctx.beginPath();
          ctx.moveTo(gx, sy + 40 - gateRise);
          ctx.lineTo(gx, sy + 220 - gateRise);
          ctx.stroke();
        }
        for (let gy = sy + 50 - gateRise; gy < sy + 220 - gateRise; gy += 18) {
          ctx.beginPath();
          ctx.moveTo(sx + 25, gy);
          ctx.lineTo(sx + 95, gy);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // 4. Render Golden Key
    if (this.key && this.key.active) {
      const kx = Math.round(this.key.x - cameraX);
      const ky = Math.round(this.key.y);

      ctx.save();
      // Golden halo
      ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.beginPath();
      ctx.arc(kx, ky, 16, 0, Math.PI * 2);
      ctx.fill();

      // Golden Key sprite
      ctx.fillStyle = '#eab308';
      // Key head ring
      ctx.beginPath();
      ctx.arc(kx, ky - 8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(kx, ky - 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Key shaft and teeth
      ctx.fillStyle = '#eab308';
      ctx.fillRect(kx - 2, ky - 3, 4, 18);
      ctx.fillRect(kx + 2, ky + 7, 5, 3);
      ctx.fillRect(kx + 2, ky + 12, 4, 3);
      ctx.restore();
    }

    ctx.restore();
  }
}
