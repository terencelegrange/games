(() => {
  // fastcar/js/road.js
  var Pseudo3DRoad = class {
    constructor(canvasWidth, canvasHeight) {
      this.width = canvasWidth;
      this.height = canvasHeight;
      this.horizonY = 170;
      this.roadBottomY = this.height;
      this.topRoadWidth = 46;
      this.bottomRoadWidth = 710;
      this.cameraZ = 0;
      this.segmentLength = 40;
      this.curve = 0;
      this.targetCurve = 0;
      this.curveTimer = 0;
      this.palmInterval = 280;
      this.totalPalms = 18;
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
      this.cameraZ += speed;
      this.curveTimer += 0.016;
      if (this.curveTimer > 6) {
        this.curveTimer = 0;
        const choices = [-0.55, 0, 0.55, 0, -0.4, 0.4];
        this.targetCurve = choices[Math.floor(Math.random() * choices.length)];
      }
      this.curve += (this.targetCurve - this.curve) * 0.02;
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
      const p = Math.max(0, Math.min(1, 1 - zAhead / maxZ));
      const scale = Math.pow(p, 1.85);
      const screenY = this.horizonY + scale * (this.roadBottomY - this.horizonY);
      const roadWidth = this.topRoadWidth + scale * (this.bottomRoadWidth - this.topRoadWidth);
      const curveOffset = this.curve * Math.pow(1 - scale, 2) * 160;
      const roadCenterX = this.width / 2 + curveOffset;
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
      const laneStep = proj.roadWidth * 0.31;
      const screenX = proj.roadCenterX + laneIndex * laneStep;
      return {
        x: screenX,
        y: proj.screenY,
        scale: proj.scale,
        width: proj.roadWidth
      };
    }
    draw(ctx) {
      this.drawBackground(ctx);
      this.drawRoadStripes(ctx);
      this.drawRoadsidePalms(ctx);
    }
    drawBackground(ctx) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.horizonY);
      skyGrad.addColorStop(0, "#0090f0");
      skyGrad.addColorStop(0.75, "#38bdf8");
      skyGrad.addColorStop(1, "#bae6fd");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.horizonY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (const c of this.clouds) {
        this.drawCloud(ctx, c.x, c.y, c.w, c.h);
      }
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, this.horizonY - 14, this.width, 14);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(0, this.horizonY - 4, this.width, 4);
      ctx.fillStyle = "#fef08a";
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
        const centerX = this.width / 2 + curveOffset;
        const zWorld = (1 - p) * 1200 + this.cameraZ;
        const segmentIndex = Math.floor(zWorld / this.segmentLength);
        const isEven = segmentIndex % 2 === 0;
        const asphaltColor = isEven ? "#64748b" : "#475569";
        const kerbColor = isEven ? "#dc2626" : "#ffffff";
        const laneLineColor = isEven ? "#ffffff" : "transparent";
        const kerbWidth = Math.max(2, roadW * 0.05);
        ctx.fillStyle = asphaltColor;
        ctx.beginPath();
        ctx.moveTo(prevCenterX - prevRoadW / 2, prevY);
        ctx.lineTo(prevCenterX + prevRoadW / 2, prevY);
        ctx.lineTo(centerX + roadW / 2, y);
        ctx.lineTo(centerX - roadW / 2, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = kerbColor;
        ctx.beginPath();
        ctx.moveTo(prevCenterX - prevRoadW / 2 - kerbWidth, prevY);
        ctx.lineTo(prevCenterX - prevRoadW / 2, prevY);
        ctx.lineTo(centerX - roadW / 2, y);
        ctx.lineTo(centerX - roadW / 2 - kerbWidth, y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(prevCenterX + prevRoadW / 2, prevY);
        ctx.lineTo(prevCenterX + prevRoadW / 2 + kerbWidth, prevY);
        ctx.lineTo(centerX + roadW / 2 + kerbWidth, y);
        ctx.lineTo(centerX + roadW / 2, y);
        ctx.closePath();
        ctx.fill();
        if (laneLineColor !== "transparent") {
          const laneDividerW = Math.max(1.5, scale * 3.5);
          const laneStep = roadW * 0.31;
          const prevLaneStep = prevRoadW * 0.31;
          ctx.fillStyle = laneLineColor;
          ctx.beginPath();
          ctx.moveTo(prevCenterX - prevLaneStep * 0.5 - laneDividerW / 2, prevY);
          ctx.lineTo(prevCenterX - prevLaneStep * 0.5 + laneDividerW / 2, prevY);
          ctx.lineTo(centerX - laneStep * 0.5 + laneDividerW / 2, y);
          ctx.lineTo(centerX - laneStep * 0.5 - laneDividerW / 2, y);
          ctx.closePath();
          ctx.fill();
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
      const palmList = [];
      const baseOffset = this.cameraZ % this.palmInterval;
      for (let i = 0; i < this.totalPalms; i++) {
        const zAhead = i * this.palmInterval - baseOffset;
        if (zAhead <= 10 || zAhead >= 1150) continue;
        const proj = this.project(zAhead);
        if (!proj) continue;
        const vergeDistance = proj.roadWidth / 2 + 24 + proj.scale * 45;
        palmList.push({
          x: proj.roadCenterX - vergeDistance,
          y: proj.screenY,
          scale: proj.scale,
          side: "left",
          zAhead
        });
        palmList.push({
          x: proj.roadCenterX + vergeDistance,
          y: proj.screenY,
          scale: proj.scale,
          side: "right",
          zAhead
        });
      }
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
      const lean = side === "left" ? -20 * scale : 20 * scale;
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = trunkWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(lean * 0.5, -trunkHeight * 0.6, lean, -trunkHeight);
      ctx.stroke();
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = Math.max(1, 2 * scale);
      for (let r = 0.2; r < 0.9; r += 0.15) {
        const rx = lean * r;
        const ry = -trunkHeight * r;
        ctx.beginPath();
        ctx.moveTo(rx - trunkWidth * 0.4, ry);
        ctx.lineTo(rx + trunkWidth * 0.4, ry);
        ctx.stroke();
      }
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
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = Math.max(2, 5 * scale);
      ctx.lineCap = "round";
      for (const f of fronds) {
        const tipX = crownX + Math.cos(f.angle) * f.len;
        const tipY = crownY - Math.sin(f.angle) * f.len * 0.7 + f.len * 0.25;
        ctx.beginPath();
        ctx.moveTo(crownX, crownY);
        ctx.quadraticCurveTo(crownX + Math.cos(f.angle) * f.len * 0.5, crownY - Math.sin(f.angle) * f.len * 0.8, tipX, tipY);
        ctx.stroke();
      }
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = Math.max(1, 2.5 * scale);
      for (const f of fronds) {
        const tipX = crownX + Math.cos(f.angle) * f.len * 0.85;
        const tipY = crownY - Math.sin(f.angle) * f.len * 0.6 + f.len * 0.2;
        ctx.beginPath();
        ctx.moveTo(crownX, crownY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // fastcar/js/car.js
  var PlayerCar = class {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.y = 400;
      this.baseWidth = 118;
      this.baseHeight = 52;
      this.targetLane = 0;
      this.currentLane = 0;
      this.laneOffset = 0;
      this.x = this.canvasWidth / 2;
      this.roll = 0;
      this.prevX = this.x;
      this.isSpinning = false;
      this.spinAngle = 0;
      this.spinTimer = 0;
      this.isInvulnerable = false;
      this.invulnerableTimer = 0;
      this.exhaustParticles = [];
      this.skidMarks = [];
    }
    reset() {
      this.targetLane = 0;
      this.currentLane = 0;
      this.laneOffset = 0;
      this.x = this.canvasWidth / 2;
      this.roll = 0;
      this.isSpinning = false;
      this.spinAngle = 0;
      this.spinTimer = 0;
      this.isInvulnerable = false;
      this.invulnerableTimer = 0;
      this.exhaustParticles = [];
    }
    steerLeft() {
      if (this.isSpinning) return;
      if (this.targetLane > -1) {
        this.targetLane--;
      }
    }
    steerRight() {
      if (this.isSpinning) return;
      if (this.targetLane < 1) {
        this.targetLane++;
      }
    }
    spinOut() {
      if (this.isSpinning) return;
      this.isSpinning = true;
      this.spinAngle = 0;
      this.spinTimer = 0.85;
      this.spawnSkidSmoke(14);
    }
    hitHazard() {
      if (this.isInvulnerable) return false;
      this.isInvulnerable = true;
      this.invulnerableTimer = 2;
      this.spawnCrashSparks(18);
      return true;
    }
    update(road, speed, dt = 1 / 60) {
      const laneLerpSpeed = 10;
      this.laneOffset += (this.targetLane - this.laneOffset) * Math.min(1, dt * laneLerpSpeed);
      const proj = road.project(0);
      if (proj) {
        const laneStep = proj.roadWidth * 0.31;
        this.x = proj.roadCenterX + this.laneOffset * laneStep;
      }
      const dx = this.x - this.prevX;
      this.prevX = this.x;
      const targetRoll = Math.max(-0.16, Math.min(0.16, dx * 0.018));
      this.roll += (targetRoll - this.roll) * 0.25;
      if (this.isSpinning) {
        this.spinTimer -= dt;
        this.spinAngle += dt * Math.PI * 4;
        this.spawnSkidSmoke(2);
        if (this.spinTimer <= 0) {
          this.isSpinning = false;
          this.spinAngle = 0;
        }
      }
      if (this.isInvulnerable) {
        this.invulnerableTimer -= dt;
        if (this.invulnerableTimer <= 0) {
          this.isInvulnerable = false;
        }
      }
      if (speed > 2 && Math.random() < 0.65) {
        this.spawnExhaust();
      }
      for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
        const p = this.exhaustParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size += p.growth;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.exhaustParticles.splice(i, 1);
        }
      }
    }
    spawnExhaust() {
      const leftExhaustX = this.x - 34;
      const rightExhaustX = this.x + 34;
      const exhaustY = this.y + 14;
      [leftExhaustX, rightExhaustX].forEach((exX) => {
        this.exhaustParticles.push({
          x: exX + (Math.random() - 0.5) * 4,
          y: exhaustY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1.5 + Math.random() * 2,
          size: 3,
          growth: 0.2,
          alpha: 0.6,
          decay: 0.035,
          color: "#94a3b8"
        });
      });
    }
    spawnSkidSmoke(count = 6) {
      for (let i = 0; i < count; i++) {
        this.exhaustParticles.push({
          x: this.x + (Math.random() - 0.5) * 60,
          y: this.y + 10 + Math.random() * 8,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 2,
          size: 4 + Math.random() * 4,
          growth: 0.4,
          alpha: 0.8,
          decay: 0.03,
          color: "#e2e8f0"
        });
      }
    }
    spawnCrashSparks(count = 16) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 6;
        this.exhaustParticles.push({
          x: this.x + (Math.random() - 0.5) * 40,
          y: this.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 1,
          size: 2.5,
          growth: -0.05,
          alpha: 1,
          decay: 0.04,
          color: Math.random() > 0.4 ? "#facc15" : "#ef4444"
        });
      }
    }
    getHitbox() {
      return {
        x: this.x - 48,
        y: this.y - 28,
        w: 96,
        h: 40
      };
    }
    draw(ctx) {
      ctx.save();
      for (const p of this.exhaustParticles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (this.isInvulnerable && Math.floor(this.invulnerableTimer * 12) % 2 === 0) {
        return;
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.isSpinning) {
        ctx.rotate(this.spinAngle);
      } else {
        ctx.rotate(this.roll);
      }
      this.drawOutRunSportsCar(ctx);
      ctx.restore();
    }
    drawOutRunSportsCar(ctx) {
      const carRed = "#dc2626";
      const carLightRed = "#ef4444";
      const carDarkRed = "#991b1b";
      const blackTrim = "#0f172a";
      const chrome = "#e2e8f0";
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 18, 58, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-56, 4, 18, 16);
      ctx.fillRect(38, 4, 18, 16);
      ctx.fillStyle = blackTrim;
      ctx.fillRect(-54, 8, 14, 12);
      ctx.fillRect(40, 8, 14, 12);
      ctx.fillStyle = carRed;
      ctx.beginPath();
      ctx.moveTo(-58, 8);
      ctx.lineTo(-54, -14);
      ctx.lineTo(-44, -20);
      ctx.lineTo(44, -20);
      ctx.lineTo(54, -14);
      ctx.lineTo(58, 8);
      ctx.lineTo(48, 16);
      ctx.lineTo(-48, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = carLightRed;
      ctx.beginPath();
      ctx.moveTo(-44, -20);
      ctx.lineTo(44, -20);
      ctx.lineTo(42, -16);
      ctx.lineTo(-42, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = carDarkRed;
      ctx.fillRect(-58, 2, 8, 10);
      ctx.fillRect(50, 2, 8, 10);
      ctx.strokeStyle = chrome;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-36, -20);
      ctx.lineTo(-32, -34);
      ctx.lineTo(32, -34);
      ctx.lineTo(36, -20);
      ctx.stroke();
      ctx.fillStyle = "rgba(186, 230, 253, 0.6)";
      ctx.beginPath();
      ctx.moveTo(-34, -20);
      ctx.lineTo(-30, -32);
      ctx.lineTo(30, -32);
      ctx.lineTo(34, -20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(-14, -28, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(-19, -23, 10, 6);
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(14, -27, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(9, -22, 10, 5);
      ctx.fillStyle = blackTrim;
      ctx.beginPath();
      ctx.roundRect(-20, -26, 12, 8, 3);
      ctx.roundRect(8, -26, 12, 8, 3);
      ctx.fill();
      ctx.fillStyle = carRed;
      ctx.fillRect(-42, -26, 6, 4);
      ctx.fillRect(36, -26, 6, 4);
      ctx.fillStyle = blackTrim;
      ctx.fillRect(-44, -12, 88, 18);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      for (let sl = -10; sl <= 4; sl += 4) {
        ctx.beginPath();
        ctx.moveTo(-42, sl);
        ctx.lineTo(42, sl);
        ctx.stroke();
      }
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.fillRect(-42, -9, 84, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(-42, -9, 8, 5);
      ctx.fillRect(34, -9, 8, 5);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-6, -9, 12, 4);
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-14, 0, 28, 9);
      ctx.strokeStyle = blackTrim;
      ctx.lineWidth = 1;
      ctx.strokeRect(-14, 0, 28, 9);
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(-10, 3, 20, 3);
      ctx.fillStyle = chrome;
      ctx.fillRect(-38, 12, 8, 5);
      ctx.fillRect(30, 12, 8, 5);
      ctx.fillStyle = blackTrim;
      ctx.beginPath();
      ctx.arc(-34, 15, 2.5, 0, Math.PI * 2);
      ctx.arc(34, 15, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // fastcar/js/hazards.js
  var HazardManager = class {
    constructor(difficulty = "medium") {
      this.items = [];
      this.floatingTexts = [];
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
      if (["easy", "medium", "hard"].includes(diff)) {
        this.difficulty = diff;
        this.computeNextSpawnDistance();
      }
    }
    computeNextSpawnDistance() {
      if (this.difficulty === "easy") {
        this.spawnDistance = 820 + Math.random() * 160;
      } else if (this.difficulty === "medium") {
        this.spawnDistance = 420 + Math.random() * 90;
      } else {
        this.spawnDistance = 210 + Math.random() * 70;
      }
    }
    update(speed, dt = 1 / 60) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        item.z -= speed;
        item.animTick = (item.animTick || 0) + 1;
        if (item.z < -40) {
          this.items.splice(i, 1);
        }
      }
      this.distanceSinceSpawn += speed;
      if (this.distanceSinceSpawn >= this.spawnDistance) {
        this.spawnWave();
        this.distanceSinceSpawn = 0;
        this.computeNextSpawnDistance();
      }
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
      const spawnZ = 1100;
      if (this.difficulty === "easy") {
        const roll = Math.random();
        if (roll < 0.6) {
          const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
          this.addItem("coin", coinLane, spawnZ);
          this.addItem("coin", coinLane, spawnZ + 60);
          this.addItem("coin", coinLane, spawnZ + 120);
        } else {
          const shuffled = [...lanes].sort(() => Math.random() - 0.5);
          const obsType = Math.random() > 0.6 ? "barrel" : "oil_slick";
          this.addItem(obsType, shuffled[0], spawnZ);
          this.addItem("coin", shuffled[1], spawnZ + 30);
        }
        return;
      }
      if (this.difficulty === "medium") {
        const roll = Math.random();
        if (roll < 0.4) {
          const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
          this.addItem("coin", coinLane, spawnZ);
          this.addItem("coin", coinLane, spawnZ + 60);
          this.addItem("coin", coinLane, spawnZ + 120);
        } else if (roll < 0.85) {
          const shuffled = [...lanes].sort(() => Math.random() - 0.5);
          const obsType = Math.random() > 0.5 ? "barrel" : "oil_slick";
          this.addItem(obsType, shuffled[0], spawnZ);
          this.addItem("coin", shuffled[1], spawnZ);
          this.addItem("coin", shuffled[1], spawnZ + 60);
        } else {
          const shuffled = [...lanes].sort(() => Math.random() - 0.5);
          this.addItem("barrel", shuffled[0], spawnZ);
          this.addItem("oil_slick", shuffled[1], spawnZ);
          this.addItem("coin", shuffled[2], spawnZ);
        }
        return;
      }
      const waveType = Math.random();
      if (waveType < 0.35) {
        const coinLane = lanes[Math.floor(Math.random() * lanes.length)];
        const obsLanes = lanes.filter((l) => l !== coinLane);
        const obsLane = obsLanes[Math.floor(Math.random() * obsLanes.length)];
        const obsType = Math.random() > 0.5 ? "oil_slick" : "barrel";
        this.addItem("coin", coinLane, spawnZ);
        this.addItem("coin", coinLane, spawnZ + 70);
        this.addItem(obsType, obsLane, spawnZ);
      } else if (waveType < 0.65) {
        const shuffled = [...lanes].sort(() => Math.random() - 0.5);
        this.addItem("barrel", shuffled[0], spawnZ);
        this.addItem("oil_slick", shuffled[1], spawnZ);
        this.addItem("coin", shuffled[2], spawnZ);
      } else if (waveType < 0.85) {
        const targetLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.addItem("coin", targetLane, spawnZ);
        this.addItem("coin", targetLane, spawnZ + 60);
        this.addItem("coin", targetLane, spawnZ + 120);
      } else {
        const openLane = lanes[Math.floor(Math.random() * lanes.length)];
        lanes.filter((l) => l !== openLane).forEach((l) => {
          this.addItem("barrel", l, spawnZ);
        });
        this.addItem("coin", openLane, spawnZ);
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
    addFloatingText(text, x, y, color = "#facc15") {
      this.floatingTexts.push({
        text,
        x,
        y,
        alpha: 1,
        color
      });
    }
    /**
     * Check collision/pickup with the player car
     * Returns list of triggered events: { type: 'coin' | 'oil_slick' | 'barrel', item, points }
     */
    checkCarCollisions(playerCar) {
      const hits = [];
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.z >= 0 && item.z <= 32) {
          const laneDiff = Math.abs(playerCar.laneOffset - item.lane);
          if (laneDiff < 0.46) {
            if (item.type === "coin") {
              hits.push({ type: "coin", item, points: 100 });
              this.addFloatingText("+100", playerCar.x, playerCar.y - 25, "#facc15");
              this.items.splice(i, 1);
            } else if (item.type === "oil_slick") {
              hits.push({ type: "oil_slick", item });
              this.addFloatingText("SPIN!", playerCar.x, playerCar.y - 25, "#38bdf8");
              this.items.splice(i, 1);
            } else if (item.type === "barrel") {
              hits.push({ type: "barrel", item });
              this.addFloatingText("CRASH!", playerCar.x, playerCar.y - 25, "#ef4444");
              this.items.splice(i, 1);
            }
          }
        }
      }
      return hits;
    }
    draw(ctx, road) {
      const sorted = [...this.items].sort((a, b) => b.z - a.z);
      for (const item of sorted) {
        if (item.z <= 5 || item.z >= 1150) continue;
        const pos = road.getLanePosition(item.lane, item.z);
        if (!pos || pos.scale <= 0.05) continue;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        switch (item.type) {
          case "coin":
            this.drawCoin(ctx, pos.scale, item.animTick);
            break;
          case "oil_slick":
            this.drawOilSlick(ctx, pos.scale);
            break;
          case "barrel":
            this.drawBarrel(ctx, pos.scale);
            break;
        }
        ctx.restore();
      }
      ctx.save();
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = "center";
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
      const rotSpeed = 0.08;
      const rotWidth = Math.abs(Math.cos(tick * rotSpeed)) * radius;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.8, Math.max(2, rotWidth), radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.8, Math.max(1, rotWidth * 0.75), radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      if (rotWidth > radius * 0.4) {
        ctx.fillStyle = "#ffffff";
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
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(0.8, "#312e81");
      grad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#06b6d4";
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(0, 2, w * 0.65, h * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4 * scale);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.fillRect(x + 2 * scale, y + h * 0.3, w - 4 * scale, h * 0.35);
      ctx.fillStyle = "#0f172a";
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
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.25);
      ctx.lineTo(x + w, y + h * 0.25);
      ctx.moveTo(x, y + h * 0.75);
      ctx.lineTo(x + w, y + h * 0.75);
      ctx.stroke();
      ctx.fillStyle = "#c2410c";
      ctx.beginPath();
      ctx.ellipse(0, y, w * 0.5, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // fastcar/js/audio.js
  var FastCarAudio = class {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.engineOsc = null;
      this.engineGain = null;
      this.isEngineRunning = false;
      try {
        const saved = localStorage.getItem("retro_arcade_sound_fastcar");
        if (saved !== null) this.enabled = saved === "true";
      } catch (_) {
      }
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      try {
        localStorage.setItem("retro_arcade_sound_fastcar", String(this.enabled));
      } catch (_) {
      }
      if (!this.enabled && this.isEngineRunning) {
        this.stopEngine();
      }
      return this.enabled;
    }
    startEngine() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx || this.isEngineRunning) return;
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = "sawtooth";
        this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
        this.isEngineRunning = true;
      } catch (_) {
      }
    }
    updateEngine(speedRatio) {
      if (!this.isEngineRunning || !this.ctx || !this.engineOsc) return;
      try {
        const targetFreq = 50 + speedRatio * 110;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
      } catch (_) {
      }
    }
    stopEngine() {
      if (!this.isEngineRunning) return;
      try {
        if (this.engineGain && this.ctx) {
          this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        }
        setTimeout(() => {
          if (this.engineOsc) {
            this.engineOsc.stop();
            this.engineOsc.disconnect();
            this.engineOsc = null;
          }
          this.isEngineRunning = false;
        }, 60);
      } catch (_) {
        this.isEngineRunning = false;
      }
    }
    coin() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [
          { f: 987.77, t: now, d: 0.08 },
          { f: 1318.51, t: now + 0.07, d: 0.16 }
        ].forEach((note) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(note.f, note.t);
          gain.gain.setValueAtTime(0.2, note.t);
          gain.gain.exponentialRampToValueAtTime(1e-3, note.t + note.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(note.t);
          osc.stop(note.t + note.d);
        });
      } catch (_) {
      }
    }
    skid() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } catch (_) {
      }
    }
    crash() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.48);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
      } catch (_) {
      }
    }
    combo() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [
          { f: 523.25, t: now, d: 0.08 },
          { f: 659.25, t: now + 0.08, d: 0.08 },
          { f: 783.99, t: now + 0.16, d: 0.18 }
        ].forEach((note) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(note.f, note.t);
          gain.gain.setValueAtTime(0.18, note.t);
          gain.gain.exponentialRampToValueAtTime(1e-3, note.t + note.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(note.t);
          osc.stop(note.t + note.d);
        });
      } catch (_) {
      }
    }
  };
  var sound = new FastCarAudio();

  // fastcar/js/game.js
  var STATES = {
    READY: "READY",
    RACING: "RACING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
  };
  var FastCarGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.width = 900;
      this.height = 460;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.difficulty = options.difficulty || "medium";
      this.road = new Pseudo3DRoad(this.width, this.height);
      this.playerCar = new PlayerCar(this.width, this.height);
      this.hazards = new HazardManager(this.difficulty);
      this.state = STATES.READY;
      this.score = 0;
      this.distance = 0;
      this.coins = 0;
      this.combo = 1;
      this.lives = 3;
      this.currentStage = 1;
      this.minSpeed = 50;
      this.cruiseSpeed = 150;
      this.maxSpeed = 240;
      this.speed = this.cruiseSpeed;
      this.topSpeed = this.speed;
      this.isAccelerating = false;
      this.isBraking = false;
      this.screenShake = 0;
      this.lastTime = 0;
      this.accumulator = 0;
      this.fixedStep = 1 / 60;
      this.animId = null;
      this.render();
    }
    start() {
      if (this.state === STATES.RACING) return;
      this.state = STATES.RACING;
      this.lastTime = performance.now();
      this.accumulator = 0;
      sound.startEngine();
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
    }
    reset() {
      this.state = STATES.READY;
      this.score = 0;
      this.distance = 0;
      this.coins = 0;
      this.combo = 1;
      this.lives = 3;
      this.currentStage = 1;
      this.speed = this.cruiseSpeed;
      this.topSpeed = this.speed;
      this.isAccelerating = false;
      this.isBraking = false;
      this.screenShake = 0;
      this.road.reset();
      this.playerCar.reset();
      this.hazards.reset();
      if (this.options.onScore) this.options.onScore(0);
      if (this.options.onCoins) this.options.onCoins(0);
      if (this.options.onSpeed) this.options.onSpeed(this.speed);
      if (this.options.onLives) this.options.onLives(this.lives);
      if (this.options.onLevelUpdate) this.options.onLevelUpdate(this.currentStage);
      sound.stopEngine();
      this.render();
    }
    setDifficulty(diff) {
      if (["easy", "medium", "hard"].includes(diff)) {
        this.difficulty = diff;
        this.hazards.setDifficulty(diff);
      }
    }
    steerLeft() {
      if (this.state === STATES.READY) {
        this.start();
      }
      if (this.state === STATES.RACING) {
        this.playerCar.steerLeft();
      }
    }
    steerRight() {
      if (this.state === STATES.READY) {
        this.start();
      }
      if (this.state === STATES.RACING) {
        this.playerCar.steerRight();
      }
    }
    setAccelerating(val) {
      if (this.state === STATES.READY && val) {
        this.start();
      }
      this.isAccelerating = val;
    }
    setBraking(val) {
      this.isBraking = val;
    }
    togglePause() {
      if (this.state === STATES.RACING) {
        this.state = STATES.PAUSED;
        sound.stopEngine();
        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
        return true;
      } else if (this.state === STATES.PAUSED) {
        this.state = STATES.RACING;
        sound.startEngine();
        this.lastTime = performance.now();
        this.animId = requestAnimationFrame(this.loop);
        return false;
      }
      return false;
    }
    loop(currentTime) {
      if (this.state !== STATES.RACING) return;
      const frameTime = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      this.accumulator += frameTime;
      while (this.accumulator >= this.fixedStep) {
        this.update(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
      this.render();
      if (this.state === STATES.RACING) {
        this.animId = requestAnimationFrame(this.loop);
      }
    }
    update(dt) {
      if (this.playerCar.isSpinning) {
        this.speed = Math.max(this.minSpeed, this.speed - 120 * dt);
      } else if (this.isAccelerating) {
        this.speed = Math.min(this.maxSpeed, this.speed + 65 * dt);
      } else if (this.isBraking) {
        this.speed = Math.max(this.minSpeed, this.speed - 90 * dt);
      } else {
        if (this.speed > this.cruiseSpeed) {
          this.speed = Math.max(this.cruiseSpeed, this.speed - 25 * dt);
        } else if (this.speed < this.cruiseSpeed) {
          this.speed = Math.min(this.cruiseSpeed, this.speed + 35 * dt);
        }
      }
      const currentSpeedInt = Math.round(this.speed);
      if (currentSpeedInt > this.topSpeed) {
        this.topSpeed = currentSpeedInt;
      }
      const worldSpeed = this.speed / 160 * 12;
      const speedRatio = (this.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed);
      sound.updateEngine(speedRatio);
      this.road.update(worldSpeed);
      this.playerCar.update(this.road, worldSpeed, dt);
      this.hazards.update(worldSpeed, dt);
      const events = this.hazards.checkCarCollisions(this.playerCar);
      for (const ev of events) {
        if (ev.type === "coin") {
          sound.coin();
          this.coins++;
          const points = 100 * this.combo;
          this.score += points;
          if (this.options.onCoins) this.options.onCoins(this.coins);
          if (this.options.onScore) this.options.onScore(this.score);
          if (this.coins % 2 === 0 && this.combo < 5) {
            this.combo++;
            sound.combo();
            if (this.options.onCombo) this.options.onCombo(this.combo);
          }
        } else if (ev.type === "oil_slick") {
          sound.skid();
          this.playerCar.spinOut();
          this.combo = 1;
          this.speed = Math.max(this.minSpeed, this.speed * 0.55);
        } else if (ev.type === "barrel") {
          if (this.playerCar.hitHazard()) {
            sound.crash();
            this.screenShake = 16;
            this.combo = 1;
            this.lives--;
            this.speed = Math.max(this.minSpeed, this.speed * 0.45);
            if (this.options.onLives) this.options.onLives(this.lives);
            if (this.lives <= 0) {
              this.handleGameOver();
              return;
            }
          }
        }
      }
      this.distance += worldSpeed * 0.2;
      this.score += Math.round(worldSpeed * 0.4);
      const calculatedStage = Math.floor(this.distance / 600) + 1;
      if (calculatedStage > this.currentStage) {
        this.currentStage = calculatedStage;
        sound.combo();
        if (this.options.onStageAdvance) {
          this.options.onStageAdvance(this.currentStage);
        }
        if (this.options.onLevelUpdate) {
          this.options.onLevelUpdate(this.currentStage);
        }
      }
      if (this.options.onScore) this.options.onScore(this.score);
      if (this.options.onSpeed) this.options.onSpeed(currentSpeedInt);
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - 1.5);
      }
    }
    handleGameOver() {
      this.state = STATES.GAME_OVER;
      sound.stopEngine();
      if (this.options.onGameOver) {
        this.options.onGameOver({
          score: this.score,
          coins: this.coins,
          topSpeed: this.topSpeed,
          distance: Math.round(this.distance),
          stage: this.currentStage,
          difficulty: this.difficulty
        });
      }
      this.render();
    }
    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.save();
      if (this.screenShake > 0) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        this.ctx.translate(sx, sy);
      }
      this.road.draw(this.ctx);
      this.hazards.draw(this.ctx, this.road);
      this.playerCar.draw(this.ctx);
      this.ctx.restore();
      if (this.state === STATES.READY) {
        this.drawPrompt("PRESS LEFT / RIGHT OR TAP TO DRIVE", "DODGE OIL SLICKS & BARRELS \u2022 COLLECT COINS");
      } else if (this.state === STATES.PAUSED) {
        this.drawPrompt("GAME PAUSED", "PRESS P OR PAUSE BUTTON TO RESUME");
      }
    }
    drawPrompt(mainText, subText) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(9, 13, 22, 0.72)";
      this.ctx.fillRect(0, 160, this.width, 110);
      this.ctx.fillStyle = "#ef4444";
      this.ctx.font = '16px "Press Start 2P", monospace';
      this.ctx.textAlign = "center";
      this.ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(mainText, this.width / 2, 210);
      this.ctx.fillStyle = "#fef08a";
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(subText, this.width / 2, 242);
      this.ctx.restore();
    }
  };

  // fastcar/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
    getHighScore(gameId = "fastcar") {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
        return val ? parseInt(val, 10) : 0;
      } catch {
        return 0;
      }
    },
    setHighScore(gameId = "fastcar", score) {
      try {
        const current = this.getHighScore(gameId);
        if (score > current) {
          localStorage.setItem(`${STORAGE_PREFIX}high_${gameId}`, score.toString());
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    getSetting(key, defaultValue) {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}opt_${key}`);
        return val !== null ? JSON.parse(val) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    setSetting(key, value) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}opt_${key}`, JSON.stringify(value));
      } catch {
      }
    }
  };
  async function recordGameActivity(data) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });
    } catch (_) {
    }
  }

  // fastcar/js/main.js
  var FastCarApp = class {
    constructor() {
      this.gameId = "fastcar";
      this.gameInstance = null;
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.difficulty = storage.getSetting("difficulty", "medium");
      this.canvas = document.getElementById("fastcar-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.hudScore = document.getElementById("hud-score");
      this.hudLevel = document.getElementById("hud-level");
      this.hudSpeed = document.getElementById("hud-speed");
      this.hudCoins = document.getElementById("hud-coins");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.lifeCars = [
        document.getElementById("life-1"),
        document.getElementById("life-2"),
        document.getElementById("life-3")
      ];
      this.diffButtons = document.querySelectorAll(".diff-btn");
      this.floatingBanner = document.getElementById("floating-banner");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayFinalScore = document.getElementById("overlay-final-score");
      this.overlayFinalStage = document.getElementById("overlay-final-stage");
      this.overlayFinalCoins = document.getElementById("overlay-final-coins");
      this.overlayFinalSpeed = document.getElementById("overlay-final-speed");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.btnSteerLeft = document.getElementById("btn-steer-left");
      this.btnSteerRight = document.getElementById("btn-steer-right");
      this.btnAccel = document.getElementById("btn-accel");
      this.btnBrake = document.getElementById("btn-brake");
      this.highScore = storage.getHighScore(this.gameId);
      this.init();
    }
    init() {
      this.applySettings();
      this.setupGame();
      this.bindEvents();
    }
    applySettings() {
      this.soundIcon.textContent = this.soundEnabled ? "\u{1F50A}" : "\u{1F507}";
      this.btnToggleSound.classList.toggle("active", this.soundEnabled);
      this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
      this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, "0");
      if (this.hudLevel) {
        this.hudLevel.textContent = "1";
      }
      this.diffButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.diff === this.difficulty);
      });
    }
    setupGame() {
      this.gameInstance = new FastCarGame(this.canvas, {
        difficulty: this.difficulty,
        onScore: (score) => {
          this.hudScore.textContent = score.toString().padStart(6, "0");
          if (score > this.highScore) {
            this.highScore = score;
            this.hudHighScore.textContent = this.highScore.toString().padStart(6, "0");
            storage.setHighScore(this.gameId, this.highScore);
          }
        },
        onSpeed: (speedKmH) => {
          this.hudSpeed.textContent = `${speedKmH.toString().padStart(3, "0")} KM/H`;
        },
        onCoins: (coins) => {
          this.hudCoins.textContent = `\u{1F7E1} ${coins.toString().padStart(2, "0")}`;
        },
        onLevelUpdate: (level) => {
          if (this.hudLevel) {
            this.hudLevel.textContent = level;
          }
        },
        onStageAdvance: (stage) => {
          this.floatingBanner.textContent = `\u26A1 STAGE ${stage} REACHED! \u26A1`;
          this.floatingBanner.classList.add("show");
          setTimeout(() => {
            this.floatingBanner.classList.remove("show");
          }, 2e3);
        },
        onCombo: (multiplier) => {
          this.floatingBanner.textContent = `\u2605 COIN COMBO x${multiplier} \u2605`;
          this.floatingBanner.classList.add("show");
          setTimeout(() => {
            this.floatingBanner.classList.remove("show");
          }, 1600);
        },
        onLives: (lives) => {
          this.lifeCars.forEach((icon, idx) => {
            if (icon) {
              icon.classList.toggle("lost", idx >= lives);
            }
          });
        },
        onGameOver: (stats) => {
          this.handleGameOver(stats);
        }
      });
    }
    handleGameOver(stats) {
      if (stats.score > this.highScore) {
        this.highScore = stats.score;
        storage.setHighScore(this.gameId, this.highScore);
        this.hudHighScore.textContent = this.highScore.toString().padStart(6, "0");
      }
      this.overlayFinalScore.textContent = stats.score.toString().padStart(6, "0");
      if (this.overlayFinalStage) {
        this.overlayFinalStage.textContent = `STAGE ${stats.stage || 1}`;
      }
      this.overlayFinalCoins.textContent = stats.coins.toString();
      this.overlayFinalSpeed.textContent = `${stats.topSpeed} KM/H`;
      this.gameOverlay.classList.add("visible");
      recordGameActivity({
        gameId: "fastcar",
        level: Math.max(1, Math.min(255, stats.stage || 1)),
        score: stats.score,
        status: "complete",
        result: "RACE OVER"
      });
    }
    bindEvents() {
      this.btnToggleSound.addEventListener("click", () => {
        this.soundEnabled = sound.toggle();
        storage.setSetting("sound_enabled", this.soundEnabled);
        this.applySettings();
      });
      this.btnToggleCrt.addEventListener("click", () => {
        this.crtEnabled = !this.crtEnabled;
        storage.setSetting("crt_enabled", this.crtEnabled);
        this.applySettings();
      });
      const btnBypassRotate = document.getElementById("btn-bypass-rotate");
      if (btnBypassRotate) {
        btnBypassRotate.addEventListener("click", () => {
          document.body.classList.add("portrait-bypassed");
        });
      }
      this.diffButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const diff = btn.dataset.diff;
          if (["easy", "medium", "hard"].includes(diff)) {
            this.difficulty = diff;
            storage.setSetting("difficulty", diff);
            this.diffButtons.forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
            if (this.gameInstance) {
              this.gameInstance.setDifficulty(diff);
            }
          }
        });
      });
      this.btnPauseGame.addEventListener("click", () => {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
        }
      });
      const doRestart = () => {
        this.gameOverlay.classList.remove("visible");
        if (this.gameInstance) {
          this.gameInstance.reset();
          this.gameInstance.start();
          this.btnPauseGame.textContent = "PAUSE";
        }
      };
      this.btnRestartGame.addEventListener("click", doRestart);
      this.overlayRestartBtn.addEventListener("click", doRestart);
      window.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "KeyA", "Numpad4"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
          else this.gameInstance.steerLeft();
        } else if (["ArrowRight", "KeyD", "Numpad6"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
          else this.gameInstance.steerRight();
        } else if (["ArrowUp", "KeyW"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          this.gameInstance.setAccelerating(true);
          this.btnAccel.classList.add("pressed");
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          this.gameInstance.setBraking(true);
          this.btnBrake.classList.add("pressed");
        } else if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
          }
        } else if (e.code === "KeyM") {
          this.btnToggleSound.click();
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
      window.addEventListener("keyup", (e) => {
        if (["ArrowUp", "KeyW"].includes(e.code)) {
          this.gameInstance.setAccelerating(false);
          this.btnAccel.classList.remove("pressed");
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          this.gameInstance.setBraking(false);
          this.btnBrake.classList.remove("pressed");
        }
      });
      this.btnSteerLeft.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
        else this.gameInstance.steerLeft();
      });
      this.btnSteerRight.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) doRestart();
        else this.gameInstance.steerRight();
      });
      const startAccel = (e) => {
        e.preventDefault();
        sound.init();
        this.gameInstance.setAccelerating(true);
        this.btnAccel.classList.add("pressed");
      };
      const stopAccel = (e) => {
        e.preventDefault();
        this.gameInstance.setAccelerating(false);
        this.btnAccel.classList.remove("pressed");
      };
      this.btnAccel.addEventListener("pointerdown", startAccel);
      this.btnAccel.addEventListener("pointerup", stopAccel);
      this.btnAccel.addEventListener("pointercancel", stopAccel);
      const startBrake = (e) => {
        e.preventDefault();
        sound.init();
        this.gameInstance.setBraking(true);
        this.btnBrake.classList.add("pressed");
      };
      const stopBrake = (e) => {
        e.preventDefault();
        this.gameInstance.setBraking(false);
        this.btnBrake.classList.remove("pressed");
      };
      this.btnBrake.addEventListener("pointerdown", startBrake);
      this.btnBrake.addEventListener("pointerup", stopBrake);
      this.btnBrake.addEventListener("pointercancel", stopBrake);
      this.canvas.addEventListener("pointerdown", (e) => {
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
          return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width / 2) {
          this.gameInstance.steerLeft();
        } else {
          this.gameInstance.steerRight();
        }
      });
    }
  };
  function boot() {
    new FastCarApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
