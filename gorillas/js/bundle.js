(() => {
  // gorillas/js/physics.js
  var GRAVITY = 280;
  var WIND_FACTOR = 16;
  var VELOCITY_SCALE = 4.2;
  function calculateInitialVelocity(angleDeg, velocity, facingRight = true) {
    const rad = Math.max(0, Math.min(90, angleDeg)) * Math.PI / 180;
    const speed = Math.max(1, velocity) * VELOCITY_SCALE;
    const vx = speed * Math.cos(rad) * (facingRight ? 1 : -1);
    const vy = -speed * Math.sin(rad);
    return { vx, vy };
  }
  function simulateTrajectory(startX, startY, angleDeg, velocity, facingRight, windSpeed, maxDuration = 5, timeStep = 0.05) {
    const points = [];
    let { vx, vy } = calculateInitialVelocity(angleDeg, velocity, facingRight);
    const windAccel = windSpeed * WIND_FACTOR;
    let x = startX;
    let y = startY;
    for (let t = 0; t <= maxDuration; t += timeStep) {
      points.push({ x, y });
      vx += windAccel * timeStep;
      vy += GRAVITY * timeStep;
      x += vx * timeStep;
      y += vy * timeStep;
      if (y > 650) break;
    }
    return points;
  }
  function checkCircleCircle(c1x, c1y, r1, c2x, c2y, r2) {
    const dx = c2x - c1x;
    const dy = c2y - c1y;
    const rSum = r1 + r2;
    return dx * dx + dy * dy <= rSum * rSum;
  }
  function carveCrater(ctx, x, y, radius = 24) {
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  var Banana = class {
    constructor({ x, y, angleDeg, velocity, facingRight, windSpeed, throwerId = 1 }) {
      this.x = x;
      this.y = y;
      this.startX = x;
      this.startY = y;
      const initialV = calculateInitialVelocity(angleDeg, velocity, facingRight);
      this.vx = initialV.vx;
      this.vy = initialV.vy;
      this.windSpeed = windSpeed;
      this.radius = 6;
      this.rotation = 0;
      this.rotSpeed = (facingRight ? 1 : -1) * 12;
      this.active = true;
      this.trail = [];
      this.maxTrail = 16;
      this.throwerId = throwerId;
      this.age = 0;
    }
    update(dt) {
      if (!this.active) return;
      this.age += dt;
      const windAccel = this.windSpeed * WIND_FACTOR;
      this.vx += windAccel * dt;
      this.vy += GRAVITY * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.rotation += this.rotSpeed * dt;
      this.trail.push({ x: this.x, y: this.y, life: 1 });
      if (this.trail.length > this.maxTrail) {
        this.trail.shift();
      }
      for (const p of this.trail) {
        p.life -= dt * 1.5;
      }
      this.trail = this.trail.filter((p) => p.life > 0);
    }
    render(ctx) {
      if (!ctx) return;
      for (const p of this.trail) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.life * 0.4)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(5, -1, 3, 2);
      ctx.restore();
    }
  };

  // gorillas/js/skyline.js
  var EGA_BUILDING_COLORS = [
    "#00aaaa",
    // EGA Cyan
    "#aaaaaa",
    // EGA Slate Gray
    "#aa0000",
    // EGA Brick Red
    "#0000aa",
    // EGA Classic Blue
    "#555555"
    // EGA Charcoal
  ];
  var WINDOW_LIT_COLOR = "#ffff55";
  var WINDOW_DARK_COLOR = "#334155";
  var Skyline = class {
    constructor(width = 800, height = 550) {
      this.width = width;
      this.height = height;
      this.buildings = [];
      this.gorilla1 = null;
      this.gorilla2 = null;
      this.sun = { x: width / 2, y: 55, radius: 24, shocked: false, shockTimer: 0 };
      this.terrainCanvas = null;
      this.terrainCtx = null;
      if (typeof document !== "undefined") {
        this.terrainCanvas = document.createElement("canvas");
        this.terrainCanvas.width = width;
        this.terrainCanvas.height = height;
        this.terrainCtx = this.terrainCanvas.getContext("2d", { willReadFrequently: true });
      }
      this.generate();
    }
    generate() {
      this.buildings = [];
      const minWidth = 65;
      const maxWidth = 95;
      let currentX = 2;
      let bIndex = 0;
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
      const b1 = this.buildings[1] || this.buildings[0];
      const g1X = b1.x + b1.width / 2;
      const g1Y = b1.y - 16;
      this.gorilla1 = {
        id: 1,
        name: "PLAYER",
        x: g1X,
        y: g1Y,
        width: 30,
        height: 32,
        facingRight: true,
        state: "idle",
        // 'idle', 'throwing', 'celebrate', 'shock', 'dead'
        animTick: 0,
        buildingId: b1.id
      };
      const targetIdx = Math.max(3, this.buildings.length - 2);
      const b2 = this.buildings[targetIdx] || this.buildings[this.buildings.length - 1];
      const g2X = b2.x + b2.width / 2;
      const g2Y = b2.y - 16;
      this.gorilla2 = {
        id: 2,
        name: "COMPUTER",
        x: g2X,
        y: g2Y,
        width: 30,
        height: 32,
        facingRight: false,
        state: "idle",
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
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
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
      if (y >= this.height - 2) return true;
      if (x < 0 || x > this.width) return false;
      let insideAnyBuilding = false;
      for (const b of this.buildings) {
        if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= this.height) {
          insideAnyBuilding = true;
          break;
        }
      }
      if (!insideAnyBuilding) return false;
      if (this.terrainCtx) {
        try {
          const pixel = this.terrainCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
          return pixel[3] > 32;
        } catch {
          return true;
        }
      }
      return insideAnyBuilding;
    }
    update(dt, banana = null) {
      [this.gorilla1, this.gorilla2].forEach((g) => {
        if (!g) return;
        g.animTick += dt;
        if (g.state === "throwing" && g.animTick > 0.4) {
          g.state = "idle";
        }
      });
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
      this.renderSun(ctx);
      if (this.terrainCanvas) {
        ctx.drawImage(this.terrainCanvas, 0, 0);
      } else {
        for (const b of this.buildings) {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.width, b.height);
        }
      }
      this.renderGorilla(ctx, this.gorilla1);
      this.renderGorilla(ctx, this.gorilla2);
    }
    renderSun(ctx) {
      const { x, y, radius, shocked } = this.sun;
      ctx.save();
      ctx.strokeStyle = "#ffff55";
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
      ctx.fillStyle = "#ffff55";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#000000";
      if (shocked) {
        ctx.beginPath();
        ctx.arc(x - 7, y - 4, 3.5, 0, Math.PI * 2);
        ctx.arc(x + 7, y - 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x - 12, y - 7, 10, 7);
        ctx.fillRect(x + 2, y - 7, 10, 7);
        ctx.fillRect(x - 2, y - 5, 4, 2);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + 4, 9, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }
    renderGorilla(ctx, gorilla) {
      if (!gorilla || gorilla.state === "dead") return;
      ctx.save();
      ctx.translate(gorilla.x, gorilla.y);
      const isCelebrate = gorilla.state === "celebrate";
      const isThrowing = gorilla.state === "throwing";
      const armCycle = Math.floor(gorilla.animTick * 6) % 2;
      ctx.fillStyle = "#854d0e";
      ctx.fillRect(-11, -12, 22, 24);
      ctx.fillStyle = "#ca8a04";
      ctx.fillRect(-7, -4, 14, 14);
      ctx.fillStyle = "#713f12";
      ctx.beginPath();
      ctx.arc(0, -16, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ca8a04";
      ctx.beginPath();
      ctx.ellipse(0, -14, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.fillRect(-2, -15, 1.5, 1.5);
      ctx.fillRect(0.5, -15, 1.5, 1.5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-4, -19, 3, 3);
      ctx.fillRect(1, -19, 3, 3);
      ctx.fillStyle = "#000000";
      ctx.fillRect(gorilla.facingRight ? -3 : -4, -18, 2, 2);
      ctx.fillRect(gorilla.facingRight ? 2 : 1, -18, 2, 2);
      ctx.fillStyle = "#713f12";
      if (isCelebrate) {
        if (armCycle === 0) {
          ctx.fillRect(-16, -24, 6, 16);
          ctx.fillRect(-6, -4, 6, 6);
        } else {
          ctx.fillRect(10, -24, 6, 16);
          ctx.fillRect(0, -4, 6, 6);
        }
      } else if (isThrowing) {
        if (gorilla.facingRight) {
          ctx.fillRect(-15, -6, 5, 14);
          ctx.fillRect(8, -22, 7, 16);
        } else {
          ctx.fillRect(10, -6, 5, 14);
          ctx.fillRect(-15, -22, 7, 16);
        }
      } else {
        ctx.fillRect(-15, -4, 5, 16);
        ctx.fillRect(10, -4, 5, 16);
      }
      ctx.fillStyle = gorilla.id === 1 ? "#38bdf8" : "#f87171";
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText(gorilla.name, 0, -28);
      ctx.restore();
    }
  };

  // gorillas/js/ai.js
  var GorillasAI = class {
    constructor() {
      this.lastShot = null;
      this.shotCount = 0;
    }
    resetRound() {
      this.lastShot = null;
      this.shotCount = 0;
    }
    /**
     * Computes angle and velocity for Computer Gorilla (throwing left toward Player)
     * @param {Object} aiGorilla - {x, y}
     * @param {Object} playerGorilla - {x, y}
     * @param {number} windSpeed - Current wind speed in MPH (-12 to +12)
     */
    calculateShot(aiGorilla, playerGorilla, windSpeed) {
      this.shotCount++;
      const targetX = playerGorilla.x;
      const targetY = playerGorilla.y;
      const startX = aiGorilla.x - 20;
      const startY = aiGorilla.y - 20;
      if (this.lastShot && this.lastShot.impactX !== void 0) {
        const prevError = this.lastShot.impactX - targetX;
        let newAngle = this.lastShot.angle;
        let newVelocity = this.lastShot.velocity;
        if (Math.abs(prevError) > 15) {
          const correction = prevError / 35 * (3 + Math.random() * 2.5);
          newVelocity = Math.max(15, Math.min(100, Math.round(newVelocity + correction)));
        } else {
          newVelocity = Math.max(15, Math.min(100, Math.round(newVelocity + (prevError > 0 ? 1 : -1))));
        }
        this.lastShot = { angle: newAngle, velocity: newVelocity };
        return { angle: newAngle, velocity: newVelocity };
      }
      const candidateAngles = [50, 55, 60, 65, 70];
      let bestAngle = 60;
      let bestVelocity = 50;
      let bestDist = Infinity;
      for (const angle of candidateAngles) {
        for (let v = 20; v <= 90; v += 2) {
          const path = simulateTrajectory(startX, startY, angle, v, false, windSpeed, 4, 0.04);
          for (const pt of path) {
            const dx = pt.x - targetX;
            const dy = pt.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
              bestDist = dist;
              bestAngle = angle;
              bestVelocity = v;
            }
          }
        }
      }
      const varianceFactor = Math.max(0.4, 1 - (this.shotCount - 1) * 0.25);
      const angleNoise = (Math.random() * 6 - 3) * varianceFactor;
      const velocityNoise = (Math.random() * 8 - 4) * varianceFactor;
      const finalAngle = Math.max(30, Math.min(85, Math.round(bestAngle + angleNoise)));
      const finalVelocity = Math.max(20, Math.min(95, Math.round(bestVelocity + velocityNoise)));
      this.lastShot = { angle: finalAngle, velocity: finalVelocity };
      return { angle: finalAngle, velocity: finalVelocity };
    }
    recordImpact(impactX) {
      if (this.lastShot) {
        this.lastShot.impactX = impactX;
      }
    }
  };

  // gorillas/js/audio.js
  var GorillasAudio = class {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.hasInteracted = false;
    }
    init() {
      if (!this.ctx && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
    // Banana throw whoosh sweep
    throwSound() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(330, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
    // Building impact / crater explosion
    explosion() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.28);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.32);
    }
    // Direct Gorilla hit massive blast
    gorillaHit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + 0.55);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.58);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      oscGain.gain.setValueAtTime(0.6, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.52);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    }
    // Celebratory Gorilla chest pound
    chestPound() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [0, 0.1].forEach((delay) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(120, t + delay);
        osc.frequency.exponentialRampToValueAtTime(45, t + delay + 0.08);
        gain.gain.setValueAtTime(0.5, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.1);
      });
    }
    // Victory fanfare arpeggio
    victory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
      const t = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);
        gain.gain.setValueAtTime(0.3, t + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + (idx === notes.length - 1 ? 0.6 : 0.18));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + (idx === notes.length - 1 ? 0.65 : 0.2));
      });
    }
    // Cheerful squeak when sun is startled
    sunShock() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  };
  var sound = new GorillasAudio();

  // gorillas/js/game.js
  var GorillasGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.width = canvas.width;
      this.height = canvas.height;
      this.skyline = new Skyline(this.width, this.height);
      this.ai = new GorillasAI();
      this.state = "PLAYER_AIM";
      this.previousState = "PLAYER_AIM";
      this.playerWins = 0;
      this.aiWins = 0;
      this.targetWins = 3;
      this.round = 1;
      this.wind = 0;
      this.generateWind();
      this.banana = null;
      this.currentThrower = 1;
      this.explosion = null;
      this.screenShake = 0;
      this.particles = [];
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.dragCurrent = { x: 0, y: 0 };
      this.playerAngle = 60;
      this.playerVelocity = 55;
      this.aiTimer = 0;
      this.roundOverTimer = 0;
      this.chestPoundTimer = 0;
      this.lastTime = performance.now();
      this.running = false;
    }
    generateWind() {
      const raw = Math.random() * 24 - 12;
      this.wind = Math.round(raw * 10) / 10;
      if (this.options.onWindChange) {
        this.options.onWindChange(this.wind);
      }
    }
    start() {
      this.running = true;
      this.lastTime = performance.now();
      this.state = "PLAYER_AIM";
      this.updateHUD();
      this.loop();
    }
    stop() {
      this.running = false;
    }
    togglePause() {
      if (this.state === "PAUSED") {
        this.state = this.previousState;
      } else {
        this.previousState = this.state;
        this.state = "PAUSED";
      }
      this.updateHUD();
    }
    resetMatch() {
      this.playerWins = 0;
      this.aiWins = 0;
      this.round = 1;
      this.startNewRound();
    }
    startNewRound() {
      this.generateWind();
      this.skyline.generate();
      this.ai.resetRound();
      this.banana = null;
      this.explosion = null;
      this.particles = [];
      this.currentThrower = 1;
      this.state = "PLAYER_AIM";
      this.updateHUD();
    }
    updateHUD() {
      if (this.options.onStateChange) {
        this.options.onStateChange({
          state: this.state,
          round: this.round,
          playerWins: this.playerWins,
          aiWins: this.aiWins,
          currentThrower: this.currentThrower,
          wind: this.wind,
          playerAngle: this.playerAngle,
          playerVelocity: this.playerVelocity
        });
      }
    }
    // Player triggers throw
    throwBanana(angle = this.playerAngle, velocity = this.playerVelocity) {
      if (this.state !== "PLAYER_AIM") return;
      this.playerAngle = Math.max(0, Math.min(90, Number(angle)));
      this.playerVelocity = Math.max(1, Math.min(100, Number(velocity)));
      const g1 = this.skyline.gorilla1;
      g1.state = "throwing";
      g1.animTick = 0;
      sound.throwSound();
      this.banana = new Banana({
        x: g1.x + 20,
        y: g1.y - 20,
        angleDeg: this.playerAngle,
        velocity: this.playerVelocity,
        facingRight: true,
        windSpeed: this.wind,
        throwerId: 1
      });
      this.currentThrower = 1;
      this.state = "BANANA_FLIGHT";
      this.updateHUD();
    }
    // AI executes throw
    executeAIThrow() {
      const g2 = this.skyline.gorilla2;
      const g1 = this.skyline.gorilla1;
      const shot = this.ai.calculateShot(g2, g1, this.wind);
      g2.state = "throwing";
      g2.animTick = 0;
      sound.throwSound();
      this.banana = new Banana({
        x: g2.x - 20,
        y: g2.y - 20,
        angleDeg: shot.angle,
        velocity: shot.velocity,
        facingRight: false,
        windSpeed: this.wind,
        throwerId: 2
      });
      this.currentThrower = 2;
      this.state = "BANANA_FLIGHT";
      this.updateHUD();
    }
    triggerExplosion(x, y, isGorillaHit = false, hitGorillaId = null) {
      this.explosion = {
        x,
        y,
        radius: isGorillaHit ? 32 : 22,
        timer: 0,
        duration: isGorillaHit ? 0.7 : 0.45,
        isGorillaHit
      };
      this.screenShake = isGorillaHit ? 14 : 7;
      const count = isGorillaHit ? 45 : 25;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * (isGorillaHit ? 220 : 130);
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 20,
          color: ["#ef4444", "#f59e0b", "#fbbf24", "#ffffff", "#38bdf8"][Math.floor(Math.random() * 5)],
          size: 2 + Math.random() * 3,
          life: 0.35 + Math.random() * 0.4
        });
      }
      this.skyline.explodeCrater(x, y, isGorillaHit ? 28 : 22);
      if (isGorillaHit) {
        sound.gorillaHit();
        const victim = hitGorillaId === 1 ? this.skyline.gorilla1 : this.skyline.gorilla2;
        const victor = hitGorillaId === 1 ? this.skyline.gorilla2 : this.skyline.gorilla1;
        if (victim) victim.state = "dead";
        if (victor) {
          victor.state = "celebrate";
          victor.animTick = 0;
        }
        if (hitGorillaId === 2) {
          this.playerWins++;
        } else {
          this.aiWins++;
        }
        this.state = "ROUND_OVER";
        this.roundOverTimer = 3.5;
        sound.victory();
      } else {
        sound.explosion();
        this.state = "EXPLOSION";
      }
      if (this.currentThrower === 2) {
        this.ai.recordImpact(x);
      }
      this.banana = null;
      this.updateHUD();
    }
    update(dt) {
      if (this.state === "PAUSED") return;
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 25);
      }
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter((p) => p.life > 0);
      this.skyline.update(dt, this.banana);
      if (this.state === "BANANA_FLIGHT" && this.banana) {
        this.banana.update(dt);
        const bx = this.banana.x;
        const by = this.banana.y;
        const br = this.banana.radius;
        const g1 = this.skyline.gorilla1;
        const skipG1 = this.banana.throwerId === 1 && this.banana.age < 0.35;
        if (!skipG1 && g1 && g1.state !== "dead" && checkCircleCircle(bx, by, br, g1.x, g1.y, 16)) {
          this.triggerExplosion(bx, by, true, 1);
          return;
        }
        const g2 = this.skyline.gorilla2;
        const skipG2 = this.banana.throwerId === 2 && this.banana.age < 0.35;
        if (!skipG2 && g2 && g2.state !== "dead" && checkCircleCircle(bx, by, br, g2.x, g2.y, 16)) {
          this.triggerExplosion(bx, by, true, 2);
          return;
        }
        if (this.skyline.checkTerrainCollision(bx, by, br)) {
          this.triggerExplosion(bx, by, false);
          return;
        }
        if (by > this.height + 40 || bx < -100 || bx > this.width + 100) {
          this.banana = null;
          this.switchTurn();
        }
      }
      if (this.state === "EXPLOSION" && this.explosion) {
        this.explosion.timer += dt;
        if (this.explosion.timer >= this.explosion.duration) {
          this.explosion = null;
          this.switchTurn();
        }
      }
      if (this.state === "AI_THINKING") {
        this.aiTimer -= dt;
        if (this.aiTimer <= 0) {
          this.executeAIThrow();
        }
      }
      if (this.state === "ROUND_OVER") {
        this.roundOverTimer -= dt;
        this.chestPoundTimer += dt;
        if (this.chestPoundTimer >= 0.5) {
          this.chestPoundTimer = 0;
          sound.chestPound();
        }
        if (this.roundOverTimer <= 0) {
          if (this.playerWins >= this.targetWins || this.aiWins >= this.targetWins) {
            this.state = "MATCH_OVER";
            this.reportMatchVault();
          } else {
            this.round++;
            this.startNewRound();
          }
        }
      }
    }
    switchTurn() {
      if (this.currentThrower === 1) {
        this.currentThrower = 2;
        this.state = "AI_THINKING";
        this.aiTimer = 1;
      } else {
        this.currentThrower = 1;
        this.state = "PLAYER_AIM";
      }
      this.updateHUD();
    }
    reportMatchVault() {
      if (this.options.onMatchComplete) {
        this.options.onMatchComplete({
          playerWins: this.playerWins,
          aiWins: this.aiWins,
          rounds: this.round,
          won: this.playerWins > this.aiWins
        });
      }
    }
    render() {
      const ctx = this.ctx;
      ctx.save();
      if (this.screenShake > 0) {
        const shakeX = (Math.random() * 2 - 1) * this.screenShake;
        const shakeY = (Math.random() * 2 - 1) * this.screenShake;
        ctx.translate(shakeX, shakeY);
      }
      ctx.fillStyle = "#0000aa";
      ctx.fillRect(0, 0, this.width, this.height);
      this.skyline.render(ctx);
      if (this.banana) {
        this.banana.render(ctx);
      }
      if (this.state === "PLAYER_AIM" && this.isDragging) {
        this.renderSlingshotAim(ctx);
      }
      if (this.explosion) {
        const ex = this.explosion;
        const progress = ex.timer / ex.duration;
        const curRadius = ex.radius * (0.4 + progress * 0.8);
        const alpha = Math.max(0, 1 - progress);
        ctx.save();
        const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, curRadius * 1.5);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        grad.addColorStop(0.3, `rgba(253, 224, 71, ${alpha * 0.8})`);
        grad.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.6})`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, curRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const p of this.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      this.renderOverlays(ctx);
      ctx.restore();
    }
    renderSlingshotAim(ctx) {
      const g1 = this.skyline.gorilla1;
      const startX = g1.x + 20;
      const startY = g1.y - 20;
      const path = simulateTrajectory(startX, startY, this.playerAngle, this.playerVelocity, true, this.wind, 1.2, 0.06);
      ctx.save();
      ctx.strokeStyle = "#ffff55";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      path.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
      ctx.stroke();
      ctx.restore();
    }
    renderOverlays(ctx) {
      if (this.state === "PAUSED") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = "#facc15";
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 10);
        ctx.fillStyle = "#ffffff";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("PRESS P TO RESUME", this.width / 2, this.height / 2 + 30);
      } else if (this.state === "ROUND_OVER") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, this.width, 100);
        const winnerText = this.skyline.gorilla2.state === "dead" ? "\u2605 PLAYER SCORES A DIRECT HIT! \u2605" : "\u{1F480} COMPUTER SCORES A DIRECT HIT! \u{1F480}";
        ctx.fillStyle = this.skyline.gorilla2.state === "dead" ? "#4ade80" : "#f87171";
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText(winnerText, this.width / 2, 45);
        ctx.fillStyle = "#ffff55";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`ROUND ${this.round} CLEARED \u2022 GENERATING NEXT SKYLINE...`, this.width / 2, 75);
      } else if (this.state === "MATCH_OVER") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, this.width, this.height);
        const playerWon = this.playerWins > this.aiWins;
        ctx.fillStyle = playerWon ? "#4ade80" : "#f87171";
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillText(playerWon ? "\u2605 VICTORY! \u2605" : "GAME OVER", this.width / 2, 220);
        ctx.fillStyle = "#ffffff";
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: PLAYER ${this.playerWins} - ${this.aiWins} COMPUTER`, this.width / 2, 270);
        ctx.fillStyle = "#ffff55";
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText("PRESS RESTART TO PLAY AGAIN", this.width / 2, 320);
      }
    }
    loop() {
      if (!this.running) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - this.lastTime) / 1e3);
      this.lastTime = now;
      this.update(dt);
      this.render();
      requestAnimationFrame(() => this.loop());
    }
  };

  // gorillas/js/storage.js
  var STORAGE_KEYS = {
    SOUND: "gorillas_sound_enabled",
    CRT: "gorillas_crt_enabled",
    STATS: "gorillas_match_stats"
  };
  var Storage = class {
    static getSoundEnabled() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.SOUND);
        return val === null ? true : val === "true";
      } catch {
        return true;
      }
    }
    static setSoundEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEYS.SOUND, String(enabled));
      } catch {
      }
    }
    static getCrtEnabled() {
      try {
        const val = localStorage.getItem(STORAGE_KEYS.CRT);
        return val === null ? true : val === "true";
      } catch {
        return true;
      }
    }
    static setCrtEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEYS.CRT, String(enabled));
      } catch {
      }
    }
    static getStats() {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.STATS);
        return raw ? JSON.parse(raw) : { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
      } catch {
        return { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
      }
    }
    static recordMatch(playerWon) {
      try {
        const stats = this.getStats();
        stats.matchesPlayed++;
        if (playerWon) stats.playerWins++;
        else stats.aiWins++;
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
        return stats;
      } catch {
        return { matchesPlayed: 0, playerWins: 0, aiWins: 0 };
      }
    }
  };

  // gorillas/js/main.js
  var GorillasApp = class {
    constructor() {
      this.canvas = document.getElementById("gorillas-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.hudPlayerScore = document.getElementById("hud-player-score");
      this.hudAiScore = document.getElementById("hud-ai-score");
      this.hudRound = document.getElementById("hud-round");
      this.hudTurnStatus = document.getElementById("hud-turn-status");
      this.hudWindDir = document.getElementById("hud-wind-dir");
      this.hudWindVal = document.getElementById("hud-wind-val");
      this.windMeterFill = document.getElementById("wind-meter-fill");
      this.inputAngle = document.getElementById("input-angle");
      this.sliderAngle = document.getElementById("slider-angle");
      this.inputVelocity = document.getElementById("input-velocity");
      this.sliderVelocity = document.getElementById("slider-velocity");
      this.btnThrow = document.getElementById("btn-throw");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.btnPause = document.getElementById("btn-pause-game");
      this.btnRestart = document.getElementById("btn-restart-game");
      sound.enabled = Storage.getSoundEnabled();
      this.updateSoundBtnUI();
      this.crtEnabled = Storage.getCrtEnabled();
      this.updateCrtUI();
      this.initGame();
      this.bindEvents();
    }
    initGame() {
      this.game = new GorillasGame(this.canvas, {
        onWindChange: (wind) => this.handleWindChange(wind),
        onStateChange: (stateData) => this.handleStateChange(stateData),
        onMatchComplete: (matchData) => this.handleMatchComplete(matchData)
      });
      this.game.start();
    }
    handleWindChange(wind) {
      if (this.hudWindVal) {
        this.hudWindVal.textContent = `${Math.abs(wind)} MPH`;
      }
      if (this.hudWindDir) {
        if (wind > 0) {
          this.hudWindDir.textContent = "EAST \u25B6";
          this.hudWindDir.style.color = "#38bdf8";
        } else if (wind < 0) {
          this.hudWindDir.textContent = "\u25C0 WEST";
          this.hudWindDir.style.color = "#f87171";
        } else {
          this.hudWindDir.textContent = "CALM \u25C6";
          this.hudWindDir.style.color = "#ffff55";
        }
      }
      if (this.windMeterFill) {
        const pct = Math.min(100, Math.max(0, (wind + 12) / 24 * 100));
        this.windMeterFill.style.width = `${pct}%`;
        this.windMeterFill.style.backgroundColor = wind > 0 ? "#38bdf8" : wind < 0 ? "#f87171" : "#ffff55";
      }
    }
    handleStateChange(data) {
      if (this.hudPlayerScore) this.hudPlayerScore.textContent = data.playerWins;
      if (this.hudAiScore) this.hudAiScore.textContent = data.aiWins;
      if (this.hudRound) this.hudRound.textContent = data.round;
      if (this.hudTurnStatus) {
        if (data.state === "PLAYER_AIM") {
          this.hudTurnStatus.textContent = "\u2605 YOUR TURN - ENTER ANGLE & POWER";
          this.hudTurnStatus.style.color = "#4ade80";
          this.enableControls(true);
        } else if (data.state === "AI_THINKING") {
          this.hudTurnStatus.textContent = "\u{1F916} COMPUTER CALCULATING TRAJECTORY...";
          this.hudTurnStatus.style.color = "#f87171";
          this.enableControls(false);
        } else if (data.state === "BANANA_FLIGHT") {
          this.hudTurnStatus.textContent = "\u{1F34C} BANANA IN FLIGHT...";
          this.hudTurnStatus.style.color = "#ffff55";
          this.enableControls(false);
        } else if (data.state === "ROUND_OVER") {
          this.enableControls(false);
        } else if (data.state === "MATCH_OVER") {
          this.hudTurnStatus.textContent = data.playerWins > data.aiWins ? "\u{1F3C6} MATCH VICTORY!" : "\u{1F480} DEFEAT";
          this.hudTurnStatus.style.color = data.playerWins > data.aiWins ? "#4ade80" : "#f87171";
          this.enableControls(false);
        }
      }
    }
    enableControls(enabled) {
      if (this.inputAngle) this.inputAngle.disabled = !enabled;
      if (this.sliderAngle) this.sliderAngle.disabled = !enabled;
      if (this.inputVelocity) this.inputVelocity.disabled = !enabled;
      if (this.sliderVelocity) this.sliderVelocity.disabled = !enabled;
      if (this.btnThrow) this.btnThrow.disabled = !enabled;
    }
    bindEvents() {
      this.inputAngle.addEventListener("input", (e) => {
        const val = Math.max(0, Math.min(90, Number(e.target.value) || 0));
        this.sliderAngle.value = val;
        this.game.playerAngle = val;
      });
      this.sliderAngle.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.inputAngle.value = val;
        this.game.playerAngle = val;
      });
      this.inputVelocity.addEventListener("input", (e) => {
        const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
        this.sliderVelocity.value = val;
        this.game.playerVelocity = val;
      });
      this.sliderVelocity.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        this.inputVelocity.value = val;
        this.game.playerVelocity = val;
      });
      this.btnThrow.addEventListener("click", () => {
        this.firePlayerBanana();
      });
      this.setupSlingshotAiming();
      window.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.firePlayerBanana();
        } else if (e.key === "p" || e.key === "P") {
          this.game.togglePause();
        } else if (e.key === "m" || e.key === "M") {
          this.toggleSound();
        } else if (e.key === "Escape") {
          window.location.href = "../index.html";
        }
      });
      this.btnToggleSound.addEventListener("click", () => this.toggleSound());
      this.btnToggleCrt.addEventListener("click", () => this.toggleCrt());
      this.btnPause.addEventListener("click", () => this.game.togglePause());
      this.btnRestart.addEventListener("click", () => this.game.resetMatch());
      const btnBypassRotate = document.getElementById("btn-bypass-rotate");
      if (btnBypassRotate) {
        btnBypassRotate.addEventListener("click", () => {
          document.body.classList.add("portrait-bypassed");
        });
      }
    }
    firePlayerBanana() {
      if (this.game.state === "PLAYER_AIM") {
        const a = Number(this.inputAngle.value) || 60;
        const v = Number(this.inputVelocity.value) || 55;
        this.game.throwBanana(a, v);
      }
    }
    setupSlingshotAiming() {
      const canvas = this.canvas;
      const getCanvasPos = (evt) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (evt.clientX - rect.left) * scaleX,
          y: (evt.clientY - rect.top) * scaleY
        };
      };
      canvas.addEventListener("pointerdown", (e) => {
        if (this.game.state !== "PLAYER_AIM") return;
        const pos = getCanvasPos(e);
        const g1 = this.game.skyline.gorilla1;
        if (!g1) return;
        const dist = Math.hypot(pos.x - g1.x, pos.y - g1.y);
        if (dist < 70) {
          this.game.isDragging = true;
          this.game.dragStart = { x: g1.x, y: g1.y };
          this.game.dragCurrent = pos;
          canvas.setPointerCapture(e.pointerId);
        }
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!this.game.isDragging) return;
        const pos = getCanvasPos(e);
        this.game.dragCurrent = pos;
        const dx = this.game.dragStart.x - pos.x;
        const dy = pos.y - this.game.dragStart.y;
        const angleRad = Math.atan2(dy, -dx);
        let angleDeg = Math.round(angleRad * 180 / Math.PI);
        angleDeg = Math.max(10, Math.min(85, angleDeg));
        const pullDist = Math.hypot(dx, dy);
        const power = Math.max(15, Math.min(95, Math.round(pullDist * 0.9)));
        this.inputAngle.value = angleDeg;
        this.sliderAngle.value = angleDeg;
        this.game.playerAngle = angleDeg;
        this.inputVelocity.value = power;
        this.sliderVelocity.value = power;
        this.game.playerVelocity = power;
      });
      const endDrag = (e) => {
        if (!this.game.isDragging) return;
        this.game.isDragging = false;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
        }
        this.firePlayerBanana();
      };
      canvas.addEventListener("pointerup", endDrag);
      canvas.addEventListener("pointercancel", endDrag);
    }
    toggleSound() {
      const newState = sound.toggle();
      Storage.setSoundEnabled(newState);
      this.updateSoundBtnUI();
    }
    updateSoundBtnUI() {
      if (this.soundIcon) {
        this.soundIcon.textContent = sound.enabled ? "\u{1F50A}" : "\u{1F507}";
      }
      if (this.btnToggleSound) {
        this.btnToggleSound.classList.toggle("active", sound.enabled);
      }
    }
    toggleCrt() {
      this.crtEnabled = !this.crtEnabled;
      Storage.setCrtEnabled(this.crtEnabled);
      this.updateCrtUI();
    }
    updateCrtUI() {
      if (this.crtOverlay) {
        this.crtOverlay.style.display = this.crtEnabled ? "block" : "none";
      }
      if (this.btnToggleCrt) {
        this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
        this.btnToggleCrt.textContent = this.crtEnabled ? "CRT: ON" : "CRT: OFF";
      }
    }
    async handleMatchComplete(matchData) {
      const won = matchData.won;
      Storage.recordMatch(won);
      try {
        const payload = {
          gameId: "gorillas",
          score: matchData.playerWins * 100,
          level: matchData.rounds,
          status: "complete",
          result: `${matchData.playerWins} - ${matchData.aiWins} (${won ? "VICTORY" : "DEFEAT"})`
        };
        await fetch("/api/games/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        });
      } catch {
      }
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    new GorillasApp();
  });
})();
