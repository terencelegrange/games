/**
 * Pseudo-3D Perspective Road Engine (OutRun Style)
 * Renders alternating asphalt scanlines, rumble kerbs, 3-lane dividers, and scaling roadside palm trees.
 */

export class Pseudo3DRoad {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth; // 900
    this.height = canvasHeight; // 460
    this.horizonY = 170;
    this.roadBottomY = this.height;

    this.topRoadWidth = 46;
    this.bottomRoadWidth = 710;

    // Road scroll position
    this.cameraZ = 0;
    this.segmentLength = 40; // Depth of each alternating color stripe
    this.curve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;

    // Roadside palm trees (placed at repeating depth intervals on left and right)
    this.palmInterval = 280;
    this.totalPalms = 18;

    // Coastal clouds
    this.clouds = [
      { x: 100, y: 40, w: 110, h: 30, speed: 0.15 },
      { x: 440, y: 70, w: 140, h: 36, speed: 0.2 },
      { x: 750, y: 35, w: 90, h: 25, speed: 0.12 }
    ];
  }

  reset() {
    this.cameraZ = 0;
    this.curve = 0;
    this.targetCurve = 0;
    this.curveTimer = 0;
  }

  update(speed) {
    // Advance camera through world distance
    this.cameraZ += speed;

    // Dynamic curve shifting (gentle straightaways and curves)
    this.curveTimer += 0.016;
    if (this.curveTimer > 6.0) {
      this.curveTimer = 0;
      // Randomly change curve target: -0.6 (left), 0 (straight), 0.6 (right)
      const choices = [-0.55, 0, 0.55, 0, -0.4, 0.4];
      this.targetCurve = choices[Math.floor(Math.random() * choices.length)];
    }
    this.curve += (this.targetCurve - this.curve) * 0.02;

    // Move clouds
    for (const c of this.clouds) {
      c.x = (c.x - speed * 0.04) % (this.width + 200);
      if (c.x < -150) c.x = this.width + 50;
    }
  }

  /**
   * Projects a world Z position (distance ahead of camera) to screen Y and perspective scale factor.
   * Z = 0 is at camera/car, Z = maxZ is at horizon.
   */
  project(zAhead) {
    const maxZ = 1200;
    if (zAhead < 0 || zAhead > maxZ) return null;

    // Perspective depth compression: zAhead = 0 -> p = 1.0 (bottom); zAhead = maxZ -> p = 0.0 (horizon)
    const p = Math.max(0, Math.min(1, 1 - (zAhead / maxZ)));
    // Non-linear projection for realistic foreshortening
    const scale = Math.pow(p, 1.85);

    const screenY = this.horizonY + scale * (this.roadBottomY - this.horizonY);
    const roadWidth = this.topRoadWidth + scale * (this.bottomRoadWidth - this.topRoadWidth);

    // Lateral curve displacement
    const curveOffset = this.curve * Math.pow(1 - scale, 2) * 160;
    const roadCenterX = (this.width / 2) + curveOffset;

    return {
      screenY,
      roadWidth,
      roadCenterX,
      scale,
      p
    };
  }

  /**
   * Returns screen X, Y and scale for an object located at a specific lane and zAhead distance.
   * lane: -1 (Left), 0 (Center), +1 (Right)
   */
  getLanePosition(laneIndex, zAhead) {
    const proj = this.project(zAhead);
    if (!proj) return null;

    // Lane spacing: 3 lanes occupy the road width
    const laneStep = (proj.roadWidth * 0.31);
    const screenX = proj.roadCenterX + laneIndex * laneStep;

    return {
      x: screenX,
      y: proj.screenY,
      scale: proj.scale,
      width: proj.roadWidth
    };
  }

  draw(ctx) {
    // 1. Draw Sky, Horizon & Ocean
    this.drawBackground(ctx);

    // 2. Draw Pseudo-3D Perspective Road scanlines
    this.drawRoadStripes(ctx);

    // 3. Draw Roadside Palm Trees
    this.drawRoadsidePalms(ctx);
  }

  drawBackground(ctx) {
    // Electric blue sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    skyGrad.addColorStop(0, '#0090f0');
    skyGrad.addColorStop(0.75, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.horizonY);

    // Coastal clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const c of this.clouds) {
      this.drawCloud(ctx, c.x, c.y, c.w, c.h);
    }

    // Distant Ocean on horizon line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, this.horizonY - 14, this.width, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, this.horizonY - 4, this.width, 4);

    // Golden sandy beach border on either side of the road
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);
  }

  drawCloud(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x + w * 0.25, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
    ctx.arc(x + w * 0.5, y + h * 0.35, h * 0.6, 0, Math.PI * 2);
    ctx.arc(x + w * 0.75, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRoadStripes(ctx) {
    // Scanline raster loop from horizon to bottom of screen
    const totalLines = 110;

    let prevY = this.horizonY;
    let prevRoadW = this.topRoadWidth;
    let prevCenterX = this.width / 2;

    for (let i = 1; i <= totalLines; i++) {
      const p = i / totalLines;
      const scale = Math.pow(p, 1.85);

      const y = this.horizonY + scale * (this.roadBottomY - this.horizonY);
      const roadW = this.topRoadWidth + scale * (this.bottomRoadWidth - this.topRoadWidth);
      const curveOffset = this.curve * Math.pow(1 - scale, 2) * 160;
      const centerX = (this.width / 2) + curveOffset;

      // Calculate world distance Z at this screen scanline
      const zWorld = (1 - p) * 1200 + this.cameraZ;
      const segmentIndex = Math.floor(zWorld / this.segmentLength);
      const isEven = segmentIndex % 2 === 0;

      // Color selection
      const asphaltColor = isEven ? '#64748b' : '#475569';
      const kerbColor = isEven ? '#dc2626' : '#ffffff';
      const laneLineColor = isEven ? '#ffffff' : 'transparent';

      const kerbWidth = Math.max(2, roadW * 0.05);

      // Draw asphalt road trapezoid slice
      ctx.fillStyle = asphaltColor;
      ctx.beginPath();
      ctx.moveTo(prevCenterX - prevRoadW / 2, prevY);
      ctx.lineTo(prevCenterX + prevRoadW / 2, prevY);
      ctx.lineTo(centerX + roadW / 2, y);
      ctx.lineTo(centerX - roadW / 2, y);
      ctx.closePath();
      ctx.fill();

      // Left red/white rumble kerb
      ctx.fillStyle = kerbColor;
      ctx.beginPath();
      ctx.moveTo(prevCenterX - prevRoadW / 2 - kerbWidth, prevY);
      ctx.lineTo(prevCenterX - prevRoadW / 2, prevY);
      ctx.lineTo(centerX - roadW / 2, y);
      ctx.lineTo(centerX - roadW / 2 - kerbWidth, y);
      ctx.closePath();
      ctx.fill();

      // Right red/white rumble kerb
      ctx.beginPath();
      ctx.moveTo(prevCenterX + prevRoadW / 2, prevY);
      ctx.lineTo(prevCenterX + prevRoadW / 2 + kerbWidth, prevY);
      ctx.lineTo(centerX + roadW / 2 + kerbWidth, y);
      ctx.lineTo(centerX + roadW / 2, y);
      ctx.closePath();
      ctx.fill();

      // Dashed lane divider markers (dividing into 3 lanes)
      if (laneLineColor !== 'transparent') {
        const laneDividerW = Math.max(1.5, scale * 3.5);
        const laneStep = roadW * 0.31;
        const prevLaneStep = prevRoadW * 0.31;

        ctx.fillStyle = laneLineColor;

        // Left lane divider
        ctx.beginPath();
        ctx.moveTo(prevCenterX - prevLaneStep * 0.5 - laneDividerW / 2, prevY);
        ctx.lineTo(prevCenterX - prevLaneStep * 0.5 + laneDividerW / 2, prevY);
        ctx.lineTo(centerX - laneStep * 0.5 + laneDividerW / 2, y);
        ctx.lineTo(centerX - laneStep * 0.5 - laneDividerW / 2, y);
        ctx.closePath();
        ctx.fill();

        // Right lane divider
        ctx.beginPath();
        ctx.moveTo(prevCenterX + prevLaneStep * 0.5 - laneDividerW / 2, prevY);
        ctx.lineTo(prevCenterX + prevLaneStep * 0.5 + laneDividerW / 2, prevY);
        ctx.lineTo(centerX + laneStep * 0.5 + laneDividerW / 2, y);
        ctx.lineTo(centerX + laneStep * 0.5 - laneDividerW / 2, y);
        ctx.closePath();
        ctx.fill();
      }

      prevY = y;
      prevRoadW = roadW;
      prevCenterX = centerX;
    }
  }

  drawRoadsidePalms(ctx) {
    // Generate palm trees along roadside verges projected by world distance
    const palmList = [];
    const baseOffset = this.cameraZ % this.palmInterval;

    for (let i = 0; i < this.totalPalms; i++) {
      const zAhead = i * this.palmInterval - baseOffset;
      if (zAhead <= 10 || zAhead >= 1150) continue;

      const proj = this.project(zAhead);
      if (!proj) continue;

      const vergeDistance = (proj.roadWidth / 2) + 24 + proj.scale * 45;

      // Left palm
      palmList.push({
        x: proj.roadCenterX - vergeDistance,
        y: proj.screenY,
        scale: proj.scale,
        side: 'left',
        zAhead
      });

      // Right palm
      palmList.push({
        x: proj.roadCenterX + vergeDistance,
        y: proj.screenY,
        scale: proj.scale,
        side: 'right',
        zAhead
      });
    }

    // Sort by distance (draw furthest first)
    palmList.sort((a, b) => b.zAhead - a.zAhead);

    for (const palm of palmList) {
      this.drawPalmTree(ctx, palm.x, palm.y, palm.scale, palm.side);
    }
  }

  drawPalmTree(ctx, x, y, scale, side) {
    if (scale <= 0.05) return;

    ctx.save();
    ctx.translate(x, y);

    const trunkHeight = 110 * scale;
    const trunkWidth = Math.max(3, 11 * scale);
    const lean = side === 'left' ? -20 * scale : 20 * scale;

    // Curved Trunk
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = trunkWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(lean * 0.5, -trunkHeight * 0.6, lean, -trunkHeight);
    ctx.stroke();

    // Trunk Bark Rings
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = Math.max(1, 2 * scale);
    for (let r = 0.2; r < 0.9; r += 0.15) {
      const rx = lean * r;
      const ry = -trunkHeight * r;
      ctx.beginPath();
      ctx.moveTo(rx - trunkWidth * 0.4, ry);
      ctx.lineTo(rx + trunkWidth * 0.4, ry);
      ctx.stroke();
    }

    // Lush Palm Crown (Coconut Fronds)
    const crownX = lean;
    const crownY = -trunkHeight;
    const frondLength = 55 * scale;

    const fronds = [
      { angle: -0.2, len: frondLength * 1.1 },
      { angle: -0.7, len: frondLength * 0.9 },
      { angle: -1.2, len: frondLength * 0.8 },
      { angle: 0.3, len: frondLength * 1.1 },
      { angle: 0.8, len: frondLength * 0.9 },
      { angle: 1.3, len: frondLength * 0.8 }
    ];

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = Math.max(2, 5 * scale);
    ctx.lineCap = 'round';

    for (const f of fronds) {
      const tipX = crownX + Math.cos(f.angle) * f.len;
      const tipY = crownY - Math.sin(f.angle) * f.len * 0.7 + (f.len * 0.25);
      ctx.beginPath();
      ctx.moveTo(crownX, crownY);
      ctx.quadraticCurveTo(crownX + Math.cos(f.angle) * f.len * 0.5, crownY - Math.sin(f.angle) * f.len * 0.8, tipX, tipY);
      ctx.stroke();
    }

    // Highlights on fronds
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = Math.max(1, 2.5 * scale);
    for (const f of fronds) {
      const tipX = crownX + Math.cos(f.angle) * f.len * 0.85;
      const tipY = crownY - Math.sin(f.angle) * f.len * 0.6 + (f.len * 0.2);
      ctx.beginPath();
      ctx.moveTo(crownX, crownY);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
