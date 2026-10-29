(() => {
  // galacticshooter/js/entities.js
  function getBezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }
  function generateDivePath(startX, startY, targetX, targetY, direction = 1) {
    const points = [];
    const steps = 60;
    const p0 = { x: startX, y: startY };
    const p1 = { x: startX + 80 * direction, y: startY - 60 };
    const p2 = { x: startX + 160 * direction, y: startY + 120 };
    const p3 = { x: targetX, y: targetY };
    for (let i = 0; i <= steps; i++) {
      points.push(getBezierPoint(p0, p1, p2, p3, i / steps));
    }
    return points;
  }
  function generateEntryPath(type, startSide, targetGridX, targetGridY) {
    const points = [];
    const steps = 70;
    const startX = startSide === "left" ? -40 : 520;
    const startY = type === "top" ? 60 : 380;
    const p0 = { x: startX, y: startY };
    const p1 = { x: startSide === "left" ? 200 : 280, y: startY + (type === "top" ? 180 : -140) };
    const p2 = { x: startSide === "left" ? 120 : 360, y: targetGridY + 80 };
    const p3 = { x: targetGridX, y: targetGridY };
    for (let i = 0; i <= steps; i++) {
      points.push(getBezierPoint(p0, p1, p2, p3, i / steps));
    }
    return points;
  }
  var Starfield = class {
    constructor(width = 480, height = 640) {
      this.width = width;
      this.height = height;
      this.stars = [];
      this.colors = ["#ffffff", "#38bdf8", "#facc15", "#f472b6", "#a78bfa"];
      this.init();
    }
    init() {
      this.stars = [];
      for (let i = 0; i < 75; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          speed: 0.4 + Math.random() * 2.2,
          size: Math.random() < 0.25 ? 2 : 1,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }
    update() {
      for (const star of this.stars) {
        star.y += star.speed;
        star.twinkle += 0.05;
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        }
      }
    }
    render(ctx) {
      ctx.save();
      for (const star of this.stars) {
        const alpha = 0.5 + Math.sin(star.twinkle) * 0.4;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
        ctx.fillRect(star.x, star.y, star.size, star.size);
      }
      ctx.restore();
    }
  };
  var Fighter = class {
    constructor(x = 240, y = 580) {
      this.x = x;
      this.y = y;
      this.width = 28;
      this.height = 24;
      this.speed = 4.2;
      this.isDual = false;
      this.isCaptured = false;
      this.isCapturing = false;
      this.capturedBoss = null;
      this.captureProgress = 0;
      this.respawnTimer = 0;
      this.invulnerableTimer = 0;
      this.active = true;
    }
    getHitbox() {
      const w = this.isDual ? 56 : 28;
      return {
        x: this.x - w / 2,
        y: this.y - this.height / 2,
        width: w,
        height: this.height
      };
    }
    update(bounds = { minX: 20, maxX: 460 }) {
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer--;
      }
      if (this.isCapturing && this.capturedBoss) {
        this.captureProgress = Math.min(1, this.captureProgress + 0.015);
        const targetX = this.capturedBoss.x;
        const targetY = this.capturedBoss.y + 36;
        this.x += (targetX - this.x) * 0.08 + Math.sin(this.captureProgress * Math.PI * 8) * 3;
        this.y += (targetY - this.y) * 0.08;
        if (this.captureProgress >= 1 || Math.hypot(this.x - targetX, this.y - targetY) < 6) {
          this.isCapturing = false;
          this.isCaptured = true;
          this.capturedBoss.holdingShip = true;
        }
        return;
      }
      const halfW = (this.isDual ? 56 : 28) / 2;
      this.x = Math.max(bounds.minX + halfW, Math.min(bounds.maxX - halfW, this.x));
    }
    render(ctx) {
      if (!this.active) return;
      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
        return;
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.isCapturing) {
        ctx.rotate(this.captureProgress * Math.PI * 6);
      }
      if (this.isDual) {
        this.drawSingleShip(ctx, -14, 0, "#ffffff", "#ef4444", "#38bdf8");
        this.drawSingleShip(ctx, 14, 0, "#ffffff", "#ef4444", "#38bdf8");
      } else {
        this.drawSingleShip(ctx, 0, 0, "#ffffff", "#ef4444", "#38bdf8");
      }
      ctx.restore();
    }
    drawSingleShip(ctx, offsetX, offsetY, hullColor, stripeColor, engineColor) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(6, 6);
      ctx.lineTo(12, 10);
      ctx.lineTo(8, 12);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 10);
      ctx.lineTo(-4, 8);
      ctx.lineTo(-8, 12);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = stripeColor;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = engineColor;
      ctx.fillRect(-12, 6, 3, 5);
      ctx.fillRect(9, 6, 3, 5);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(-3, 10);
      ctx.lineTo(0, 14 + Math.random() * 3);
      ctx.lineTo(3, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
  var Laser = class {
    constructor(x, y, vy = -9.5, isDual = false) {
      this.x = x;
      this.y = y;
      this.vy = vy;
      this.width = 3;
      this.height = 12;
      this.isDual = isDual;
      this.active = true;
    }
    update() {
      this.y += this.vy;
      if (this.y < -20) this.active = false;
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = this.isDual ? "#4ade80" : "#38bdf8";
      ctx.shadowColor = this.isDual ? "#4ade80" : "#38bdf8";
      ctx.shadowBlur = 6;
      ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
      ctx.restore();
    }
  };
  var AlienBomb = class {
    constructor(x, y, vx = 0, vy = 3.6) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = 3;
      this.active = true;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y > 660 || this.x < -20 || this.x > 500) {
        this.active = false;
      }
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
  var TractorBeam = class {
    constructor(boss) {
      this.boss = boss;
      this.active = false;
      this.length = 0;
      this.maxLength = 420;
      this.baseWidth = 14;
      this.bottomWidth = 80;
      this.pulse = 0;
    }
    start() {
      this.active = true;
      this.length = 0;
    }
    stop() {
      this.active = false;
      this.length = 0;
    }
    update() {
      if (!this.active) return;
      this.pulse += 0.15;
      if (this.length < this.maxLength) {
        this.length = Math.min(this.maxLength, this.length + 8);
      }
    }
    contains(player) {
      if (!this.active || this.length < 80) return false;
      const px = player.x;
      const py = player.y;
      const topY = this.boss.y + 12;
      const botY = topY + this.length;
      if (py < topY || py > botY) return false;
      const ratio = (py - topY) / this.length;
      const currentHalfWidth = (this.baseWidth + (this.bottomWidth - this.baseWidth) * ratio) / 2;
      return Math.abs(px - this.boss.x) <= currentHalfWidth;
    }
    render(ctx) {
      if (!this.active || this.length <= 0) return;
      ctx.save();
      const topX = this.boss.x;
      const topY = this.boss.y + 10;
      const botY = topY + this.length;
      const halfBot = this.bottomWidth / 2;
      const halfTop = this.baseWidth / 2;
      const grad = ctx.createLinearGradient(topX, topY, topX, botY);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.7)");
      grad.addColorStop(0.5, "rgba(192, 132, 252, 0.5)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.1)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(topX - halfTop, topY);
      ctx.lineTo(topX + halfTop, topY);
      ctx.lineTo(topX + halfBot, botY);
      ctx.lineTo(topX - halfBot, botY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      const rings = 6;
      for (let i = 1; i <= rings; i++) {
        const ringRatio = (i / rings + this.pulse * 0.1) % 1;
        const ringY = topY + ringRatio * this.length;
        const ringHalfW = (halfTop + (halfBot - halfTop) * ringRatio) * (0.8 + Math.sin(this.pulse + i) * 0.2);
        ctx.beginPath();
        ctx.ellipse(topX, ringY, ringHalfW, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };
  var Enemy = class {
    constructor(type, gridCol, gridRow, targetX, targetY) {
      this.type = type;
      this.gridCol = gridCol;
      this.gridRow = gridRow;
      this.targetX = targetX;
      this.targetY = targetY;
      this.x = targetX;
      this.y = targetY;
      this.width = 24;
      this.height = 20;
      this.state = "formation";
      this.hp = type === "boss" ? 2 : 1;
      this.points = type === "boss" ? 150 : type === "butterfly" ? 80 : 50;
      this.flightPoints = type === "boss" ? 400 : type === "butterfly" ? 160 : 100;
      this.path = [];
      this.pathIndex = 0;
      this.animFrame = 0;
      this.animTimer = 0;
      this.holdingShip = false;
      this.tractorBeam = type === "boss" ? new TractorBeam(this) : null;
      this.tractorDuration = 0;
      this.active = true;
    }
    getHitbox() {
      return {
        x: this.x - this.width / 2,
        y: this.y - this.height / 2,
        width: this.width,
        height: this.height
      };
    }
    setPath(pathPoints) {
      this.path = pathPoints;
      this.pathIndex = 0;
    }
    update(formationOffset = { x: 0, y: 0 }) {
      this.animTimer++;
      if (this.animTimer % 12 === 0) {
        this.animFrame = (this.animFrame + 1) % 2;
      }
      if (this.state === "formation") {
        this.x = this.targetX + formationOffset.x;
        this.y = this.targetY + formationOffset.y;
        return;
      }
      if (this.state === "entry" || this.state === "diving") {
        if (this.path && this.pathIndex < this.path.length) {
          const pt = this.path[this.pathIndex];
          this.x = pt.x;
          this.y = pt.y;
          this.pathIndex++;
          if (this.type === "boss" && !this.holdingShip && this.state === "diving" && this.pathIndex === 30 && Math.random() < 0.45) {
            this.state = "tractor";
            this.tractorDuration = 180;
            this.tractorBeam.start();
          }
        } else {
          if (this.state === "entry") {
            this.state = "formation";
          } else {
            this.y = -20;
            this.state = "returning";
          }
        }
        return;
      }
      if (this.state === "tractor") {
        this.tractorBeam.update();
        this.tractorDuration--;
        if (this.tractorDuration <= 0) {
          this.tractorBeam.stop();
          this.state = "diving";
        }
        return;
      }
      if (this.state === "returning") {
        const dx = this.targetX + formationOffset.x - this.x;
        const dy = this.targetY + formationOffset.y - this.y;
        this.x += dx * 0.08;
        this.y += dy * 0.08;
        if (Math.hypot(dx, dy) < 4) {
          this.state = "formation";
        }
      }
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.type === "boss") {
        this.drawBoss(ctx);
      } else if (this.type === "butterfly") {
        this.drawButterfly(ctx);
      } else {
        this.drawBee(ctx);
      }
      if (this.holdingShip) {
        this.drawCapturedShip(ctx);
      }
      ctx.restore();
      if (this.tractorBeam && this.state === "tractor") {
        this.tractorBeam.render(ctx);
      }
    }
    drawBoss(ctx) {
      const primary = this.hp === 2 ? "#22c55e" : "#38bdf8";
      const accent = "#facc15";
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(-6, -12);
      ctx.lineTo(-2, -6);
      ctx.lineTo(2, -6);
      ctx.lineTo(6, -12);
      ctx.lineTo(10, -8);
      ctx.lineTo(8, 2);
      ctx.lineTo(-8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = primary;
      const flap = this.animFrame === 0 ? 0 : 2;
      ctx.fillRect(-12, -2 + flap, 4, 8);
      ctx.fillRect(8, -2 + flap, 4, 8);
    }
    drawButterfly(ctx) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-2, -8, 4, 4);
      ctx.fillRect(-4, -10, 2, 2);
      ctx.fillRect(2, -10, 2, 2);
      ctx.fillStyle = "#f87171";
      const flap = this.animFrame === 0 ? 0 : 3;
      ctx.beginPath();
      ctx.moveTo(-10, -4 + flap);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-8, 8 - flap);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, -4 + flap);
      ctx.lineTo(2, 0);
      ctx.lineTo(8, 8 - flap);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-2, -2, 4, 8);
    }
    drawBee(ctx) {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-2, -6, 4, 4);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-4, -2, 8, 4);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(-4, 2, 8, 4);
      ctx.fillStyle = "#e0f2fe";
      const flap = this.animFrame === 0 ? -1 : 2;
      ctx.fillRect(-8, -4 + flap, 4, 6);
      ctx.fillRect(4, -4 + flap, 4, 6);
    }
    drawCapturedShip(ctx) {
      ctx.save();
      ctx.translate(0, -22);
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(4, 4);
      ctx.lineTo(8, 6);
      ctx.lineTo(0, 6);
      ctx.lineTo(-8, 6);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };
  var ExplosionParticle = class {
    constructor(x, y, color = "#facc15") {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.color = color;
      this.alpha = 1;
      this.size = 2 + Math.random() * 3;
      this.life = 25 + Math.floor(Math.random() * 15);
      this.maxLife = this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }
    render(ctx) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // galacticshooter/js/audio.js
  var SoundEffects = class {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.tractorOsc = null;
      this.tractorGain = null;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    toggleMute() {
      this.muted = !this.muted;
      if (this.muted && this.tractorOsc) {
        this.stopTractorBeam();
      }
      return this.muted;
    }
    playLaser(isDual = false) {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isDual ? "sawtooth" : "square";
        osc.frequency.setValueAtTime(isDual ? 980 : 880, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (_) {
      }
    }
    playAlienDive() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(850, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } catch (_) {
      }
    }
    startTractorBeam() {
      if (this.muted || !this.ctx || this.tractorOsc) return;
      try {
        const now = this.ctx.currentTime;
        this.tractorOsc = this.ctx.createOscillator();
        this.tractorGain = this.ctx.createGain();
        this.tractorOsc.type = "sawtooth";
        this.tractorOsc.frequency.setValueAtTime(180, now);
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(8, now);
        lfoGain.gain.setValueAtTime(60, now);
        lfo.connect(this.tractorOsc.frequency);
        lfo.start(now);
        this.tractorGain.gain.setValueAtTime(0.12, now);
        this.tractorOsc.connect(this.tractorGain);
        this.tractorGain.connect(this.ctx.destination);
        this.tractorOsc.start(now);
        this.tractorLfo = lfo;
      } catch (_) {
      }
    }
    stopTractorBeam() {
      if (this.tractorOsc) {
        try {
          this.tractorGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
          this.tractorOsc.stop(this.ctx.currentTime + 0.05);
          if (this.tractorLfo) this.tractorLfo.stop(this.ctx.currentTime + 0.05);
        } catch (_) {
        }
        this.tractorOsc = null;
        this.tractorGain = null;
        this.tractorLfo = null;
      }
    }
    playCapture() {
      if (this.muted || !this.ctx) return;
      this.stopTractorBeam();
      try {
        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392, 523.25, 440, 349.23, 293.66, 220];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.15, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + (idx + 1) * 0.08);
        });
      } catch (_) {
      }
    }
    playRescueDock() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [392, 523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.06);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + (idx + 1) * 0.06);
        });
      } catch (_) {
      }
    }
    playExplosion(type = "normal") {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const duration = type === "boss" ? 0.45 : type === "player" ? 0.6 : 0.25;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(type === "boss" ? 500 : 350, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + duration);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(type === "boss" ? 0.35 : 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + duration);
      } catch (_) {
      }
    }
    playStageStart() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const melody = [
          { f: 523.25, d: 0.1 },
          { f: 659.25, d: 0.1 },
          { f: 783.99, d: 0.1 },
          { f: 1046.5, d: 0.25 }
        ];
        let offset = 0;
        melody.forEach((note) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(note.f, now + offset);
          gain.gain.setValueAtTime(0.12, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + note.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + note.d);
          offset += note.d;
        });
      } catch (_) {
      }
    }
    playChallengingStage() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880, 740, 880];
        let offset = 0;
        notes.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.15, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
          offset += 0.1;
        });
      } catch (_) {
      }
    }
  };
  var audio = new SoundEffects();

  // galacticshooter/js/storage.js
  var STORAGE_KEY = "retro_arcade_galacticshooter_hiscore";
  var GAME_ID = "galacticshooter";
  function getLocalHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (_) {
      return 0;
    }
  }
  function saveLocalHighScore(score) {
    try {
      const current = getLocalHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEY, score.toString());
        return score;
      }
      return current;
    } catch (_) {
      return score;
    }
  }
  async function submitMatchRecord({ score, level = 1, durationSeconds, hits = 0, shotsFired = 0, result }) {
    const accuracy = shotsFired > 0 ? Math.min(100, Math.round(hits / shotsFired * 100)) : 0;
    const resultText = result || `STAGE ${level} (${accuracy}% ACC)`;
    saveLocalHighScore(score);
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          gameId: GAME_ID,
          score: Math.max(0, parseInt(score, 10) || 0),
          level: Math.max(1, Math.min(255, parseInt(level, 10) || 1)),
          status: "complete",
          result: String(resultText).slice(0, 32)
        })
      });
    } catch (_) {
    }
    return { success: true };
  }

  // galacticshooter/js/game.js
  var GalacticShooterGame = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = 480;
      this.height = 640;
      this.starfield = new Starfield(this.width, this.height);
      this.fighter = new Fighter(240, 580);
      this.lasers = [];
      this.alienBombs = [];
      this.enemies = [];
      this.particles = [];
      this.rescuedFighters = [];
      this.state = "TITLE";
      this.stage = 1;
      this.score = 0;
      this.highScore = getLocalHighScore();
      this.lives = 3;
      this.shotsFired = 0;
      this.hits = 0;
      this.gameTimeSeconds = 0;
      this.stateTimer = 0;
      this.formationOffset = { x: 0, y: 0 };
      this.formationDirection = 1;
      this.diveCooldown = 0;
      this.entryWaveIndex = 0;
      this.entrySubWaveTimer = 0;
      this.challengingWaveTimer = 0;
      this.challengingHits = 0;
      this.keys = { left: false, right: false, fire: false };
      this.fireLatched = false;
      this.isPaused = false;
    }
    startNewGame() {
      this.stage = 1;
      this.score = 0;
      this.lives = 3;
      this.shotsFired = 0;
      this.hits = 0;
      this.gameTimeSeconds = 0;
      this.fighter = new Fighter(240, 580);
      this.lasers = [];
      this.alienBombs = [];
      this.particles = [];
      this.rescuedFighters = [];
      this.initStage(this.stage);
    }
    initStage(stageNum) {
      this.stage = stageNum;
      this.lasers = [];
      this.alienBombs = [];
      this.enemies = [];
      this.rescuedFighters = [];
      this.stateTimer = 120;
      this.formationOffset = { x: 0, y: 0 };
      const isChallenging = this.isChallengingStage(stageNum);
      if (isChallenging) {
        this.state = "STAGE_START";
        this.challengingHits = 0;
        this.challengingWaveTimer = 0;
        audio.playChallengingStage();
      } else {
        this.state = "STAGE_START";
        audio.playStageStart();
      }
    }
    isChallengingStage(stg = this.stage) {
      return stg % 3 === 0;
    }
    buildFormationEnemies() {
      const enemies = [];
      const bossCols = [3, 4, 5, 6];
      for (let i = 0; i < 4; i++) {
        const col = bossCols[i];
        const targetX = 100 + col * 36;
        const targetY = 90;
        enemies.push(new Enemy("boss", col, 0, targetX, targetY));
      }
      for (let r = 1; r <= 2; r++) {
        for (let c = 1; c <= 8; c++) {
          const targetX = 64 + c * 36;
          const targetY = 90 + r * 28;
          enemies.push(new Enemy("butterfly", c, r, targetX, targetY));
        }
      }
      for (let r = 3; r <= 4; r++) {
        for (let c = 0; c <= 9; c++) {
          const targetX = 46 + c * 36;
          const targetY = 90 + r * 28;
          enemies.push(new Enemy("bee", c, r, targetX, targetY));
        }
      }
      return enemies;
    }
    startEntryWaves() {
      this.enemies = this.buildFormationEnemies();
      this.entryWaveIndex = 0;
      this.entrySubWaveTimer = 0;
      this.state = "ENTRY_WAVE";
      this.dispatchEntryWave(0);
    }
    dispatchEntryWave(waveIdx) {
      const waveSize = 8;
      const startIdx = waveIdx * waveSize;
      const side = waveIdx % 2 === 0 ? "left" : "right";
      const type = waveIdx < 2 ? "top" : "bottom";
      for (let i = 0; i < waveSize; i++) {
        const enemy = this.enemies[startIdx + i];
        if (enemy) {
          enemy.state = "entry";
          const path = generateEntryPath(type, side, enemy.targetX, enemy.targetY);
          enemy.setPath(path);
        }
      }
    }
    triggerDiveAttack() {
      const eligible = this.enemies.filter((e) => e.active && e.state === "formation");
      if (eligible.length === 0) return;
      const bosses = eligible.filter((e) => e.type === "boss");
      if (bosses.length > 0 && Math.random() < 0.35) {
        const boss = bosses[Math.floor(Math.random() * bosses.length)];
        boss.state = "diving";
        const dir = boss.x < 240 ? 1 : -1;
        boss.setPath(generateDivePath(boss.x, boss.y, this.fighter.x, 660, dir));
        audio.playAlienDive();
        const escorts = eligible.filter((e) => e.type === "butterfly").slice(0, 2);
        escorts.forEach((esc, idx) => {
          esc.state = "diving";
          const offset = idx === 0 ? -30 : 30;
          esc.setPath(generateDivePath(esc.x, esc.y, this.fighter.x + offset, 660, dir));
        });
        return;
      }
      const count = Math.min(eligible.length, Math.random() < 0.6 ? 1 : 2);
      for (let i = 0; i < count; i++) {
        const enemy = eligible[Math.floor(Math.random() * eligible.length)];
        if (enemy) {
          enemy.state = "diving";
          const dir = enemy.x < 240 ? 1 : -1;
          enemy.setPath(generateDivePath(enemy.x, enemy.y, this.fighter.x, 660, dir));
          audio.playAlienDive();
        }
      }
    }
    handlePlayerFire() {
      if (this.fighter.isCapturing || !this.fighter.active || this.state === "GAME_OVER") return;
      this.shotsFired++;
      if (this.fighter.isDual) {
        this.lasers.push(new Laser(this.fighter.x - 14, this.fighter.y - 14, -10, true));
        this.lasers.push(new Laser(this.fighter.x + 14, this.fighter.y - 14, -10, true));
        audio.playLaser(true);
      } else {
        this.lasers.push(new Laser(this.fighter.x, this.fighter.y - 14, -9.5, false));
        audio.playLaser(false);
      }
    }
    spawnExplosion(x, y, color = "#facc15", count = 16) {
      for (let i = 0; i < count; i++) {
        this.particles.push(new ExplosionParticle(x, y, color));
      }
    }
    update() {
      if (this.isPaused) return;
      this.starfield.update();
      this.gameTimeSeconds += 1 / 60;
      this.formationOffset.x += 0.4 * this.formationDirection;
      if (Math.abs(this.formationOffset.x) > 24) {
        this.formationDirection *= -1;
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.life <= 0) this.particles.splice(i, 1);
      }
      switch (this.state) {
        case "STAGE_START":
          this.stateTimer--;
          if (this.stateTimer <= 0) {
            if (this.isChallengingStage()) {
              this.state = "CHALLENGING_STAGE";
              this.challengingWaveTimer = 0;
            } else {
              this.startEntryWaves();
            }
          }
          break;
        case "ENTRY_WAVE":
          this.updateEntryWaves();
          break;
        case "BATTLE":
          this.updateBattle();
          break;
        case "CHALLENGING_STAGE":
          this.updateChallengingStage();
          break;
        case "STAGE_CLEAR":
          this.stateTimer--;
          if (this.stateTimer <= 0) {
            this.initStage(this.stage + 1);
          }
          break;
        case "GAME_OVER":
          break;
      }
      if (this.fighter.active && !this.fighter.isCapturing) {
        if (this.keys.left) this.fighter.x -= this.fighter.speed;
        if (this.keys.right) this.fighter.x += this.fighter.speed;
      }
      this.fighter.update({ minX: 20, maxX: 460 });
      if (this.keys.fire) {
        if (!this.fireLatched) {
          this.handlePlayerFire();
          this.fireLatched = true;
        }
      } else {
        this.fireLatched = false;
      }
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.update();
        if (!l.active) {
          this.lasers.splice(i, 1);
        }
      }
      for (let i = this.alienBombs.length - 1; i >= 0; i--) {
        const b = this.alienBombs[i];
        b.update();
        if (!b.active) {
          this.alienBombs.splice(i, 1);
        }
      }
      for (let i = this.rescuedFighters.length - 1; i >= 0; i--) {
        const rf = this.rescuedFighters[i];
        rf.y += (this.fighter.y - rf.y) * 0.08;
        rf.x += (this.fighter.x - rf.x) * 0.08;
        rf.rotation = (rf.rotation || 0) + 0.1;
        if (Math.hypot(rf.x - this.fighter.x, rf.y - this.fighter.y) < 12) {
          this.fighter.isDual = true;
          this.rescuedFighters.splice(i, 1);
          audio.playRescueDock();
          this.spawnExplosion(this.fighter.x, this.fighter.y, "#4ade80", 24);
        }
      }
      this.checkCollisions();
    }
    updateEntryWaves() {
      this.entrySubWaveTimer++;
      if (this.entrySubWaveTimer > 100 && this.entryWaveIndex < 4) {
        this.entryWaveIndex++;
        this.entrySubWaveTimer = 0;
        this.dispatchEntryWave(this.entryWaveIndex);
      }
      let anyInEntry = false;
      for (const enemy of this.enemies) {
        if (enemy.active) {
          enemy.update(this.formationOffset);
          if (enemy.state === "entry") anyInEntry = true;
        }
      }
      if (this.entryWaveIndex >= 4 && !anyInEntry) {
        this.state = "BATTLE";
        this.diveCooldown = 60;
      }
    }
    updateBattle() {
      this.diveCooldown--;
      if (this.diveCooldown <= 0) {
        this.triggerDiveAttack();
        this.diveCooldown = Math.max(45, 140 - this.stage * 10);
      }
      let activeCount = 0;
      for (const enemy of this.enemies) {
        if (enemy.active) {
          activeCount++;
          enemy.update(this.formationOffset);
          if (enemy.state === "diving" && Math.random() < 0.015 && this.alienBombs.length < 8) {
            const vx = (this.fighter.x - enemy.x) * 0.012;
            this.alienBombs.push(new AlienBomb(enemy.x, enemy.y + 10, vx, 3.8));
          }
          if (enemy.type === "boss" && enemy.state === "tractor" && enemy.tractorBeam) {
            if (!this.fighter.isCapturing && !this.fighter.isCaptured && enemy.tractorBeam.contains(this.fighter)) {
              this.fighter.isCapturing = true;
              this.fighter.capturedBoss = enemy;
              this.fighter.captureProgress = 0;
              audio.playCapture();
              this.handlePlayerCaptured();
            }
          }
        }
      }
      if (activeCount === 0) {
        this.state = "STAGE_CLEAR";
        this.stateTimer = 90;
        this.score += 1e3 + this.stage * 200;
        this.saveHighScore();
      }
    }
    updateChallengingStage() {
      this.challengingWaveTimer++;
      if (this.challengingWaveTimer % 90 === 0 && this.enemies.length < 40) {
        const waveNum = Math.floor(this.challengingWaveTimer / 90);
        const side = waveNum % 2 === 0 ? "left" : "right";
        for (let i = 0; i < 8; i++) {
          const e = new Enemy(waveNum % 2 === 0 ? "butterfly" : "bee", i, 0, 0, 0);
          e.state = "diving";
          const startX = side === "left" ? -30 - i * 20 : 510 + i * 20;
          const p0 = { x: startX, y: 120 + i * 10 };
          const p1 = { x: 240, y: 320 };
          const p2 = { x: side === "left" ? 380 : 100, y: 460 };
          const p3 = { x: side === "left" ? 520 : -40, y: 640 };
          const pts = [];
          for (let s = 0; s <= 70; s++) {
            const t = s / 70;
            const u = 1 - t;
            pts.push({
              x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
              y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
            });
          }
          e.setPath(pts);
          this.enemies.push(e);
        }
      }
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (enemy.active) {
          enemy.update(this.formationOffset);
          if (enemy.y > 660 || enemy.x < -60 || enemy.x > 540) {
            enemy.active = false;
          }
        }
      }
      if (this.challengingWaveTimer > 550 && this.enemies.every((e) => !e.active)) {
        this.state = "STAGE_CLEAR";
        this.stateTimer = 120;
        let bonus = this.challengingHits * 100;
        if (this.challengingHits >= 40) {
          bonus = 1e4;
        }
        this.score += bonus;
        this.saveHighScore();
      }
    }
    handlePlayerCaptured() {
      if (this.fighter.isDual) {
        this.fighter.isDual = false;
        this.fighter.isCapturing = false;
        this.fighter.invulnerableTimer = 120;
        return;
      }
      setTimeout(() => {
        this.lives--;
        if (this.lives <= 0) {
          this.state = "GAME_OVER";
          this.saveHighScore();
          submitMatchRecord({
            score: this.score,
            level: this.stage,
            durationSeconds: Math.floor(this.gameTimeSeconds),
            hits: this.hits,
            shotsFired: this.shotsFired
          });
        } else {
          this.fighter = new Fighter(240, 580);
          this.fighter.invulnerableTimer = 180;
        }
      }, 1200);
    }
    handlePlayerHit() {
      if (this.fighter.invulnerableTimer > 0 || this.fighter.isCapturing || !this.fighter.active) return;
      audio.playExplosion("player");
      this.spawnExplosion(this.fighter.x, this.fighter.y, "#ef4444", 32);
      if (this.fighter.isDual) {
        this.fighter.isDual = false;
        this.fighter.invulnerableTimer = 120;
        return;
      }
      this.lives--;
      this.fighter.active = false;
      if (this.lives <= 0) {
        this.state = "GAME_OVER";
        this.saveHighScore();
        submitMatchRecord({
          score: this.score,
          level: this.stage,
          durationSeconds: Math.floor(this.gameTimeSeconds),
          hits: this.hits,
          shotsFired: this.shotsFired
        });
      } else {
        setTimeout(() => {
          this.fighter = new Fighter(240, 580);
          this.fighter.invulnerableTimer = 180;
        }, 1e3);
      }
    }
    checkCollisions() {
      for (let li = this.lasers.length - 1; li >= 0; li--) {
        const laser = this.lasers[li];
        if (!laser.active) continue;
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;
          const eb = enemy.getHitbox();
          if (laser.x >= eb.x && laser.x <= eb.x + eb.width && laser.y >= eb.y && laser.y <= eb.y + eb.height) {
            laser.active = false;
            this.hits++;
            enemy.hp--;
            if (this.isChallengingStage()) {
              this.challengingHits++;
            }
            if (enemy.hp <= 0) {
              enemy.active = false;
              if (enemy.tractorBeam) enemy.tractorBeam.stop();
              const pts = enemy.state === "formation" ? enemy.points : enemy.flightPoints;
              this.score += pts;
              this.saveHighScore();
              const isBoss = enemy.type === "boss";
              audio.playExplosion(isBoss ? "boss" : "normal");
              this.spawnExplosion(enemy.x, enemy.y, isBoss ? "#38bdf8" : "#ef4444", isBoss ? 28 : 16);
              if (enemy.holdingShip) {
                if (enemy.state === "diving" || enemy.state === "tractor") {
                  this.rescuedFighters.push({
                    x: enemy.x,
                    y: enemy.y - 20,
                    rotation: 0
                  });
                } else {
                  this.spawnExplosion(enemy.x, enemy.y - 20, "#ef4444", 20);
                }
              }
            } else {
              this.score += 50;
              this.spawnExplosion(enemy.x, enemy.y, "#38bdf8", 8);
            }
            break;
          }
        }
      }
      if (this.fighter.active && this.fighter.invulnerableTimer <= 0) {
        const ph = this.fighter.getHitbox();
        for (const bomb of this.alienBombs) {
          if (!bomb.active) continue;
          if (bomb.x >= ph.x && bomb.x <= ph.x + ph.width && bomb.y >= ph.y && bomb.y <= ph.y + ph.height) {
            bomb.active = false;
            this.handlePlayerHit();
            break;
          }
        }
      }
      if (this.fighter.active && this.fighter.invulnerableTimer <= 0) {
        const ph = this.fighter.getHitbox();
        for (const enemy of this.enemies) {
          if (!enemy.active || enemy.state === "formation") continue;
          const eb = enemy.getHitbox();
          if (ph.x < eb.x + eb.width && ph.x + ph.width > eb.x && ph.y < eb.y + eb.height && ph.y + ph.height > eb.y) {
            enemy.active = false;
            this.spawnExplosion(enemy.x, enemy.y, "#ef4444", 20);
            this.handlePlayerHit();
            break;
          }
        }
      }
    }
    saveHighScore() {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveLocalHighScore(this.highScore);
      }
    }
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.starfield.render(ctx);
      for (const enemy of this.enemies) {
        enemy.render(ctx);
      }
      for (const rf of this.rescuedFighters) {
        ctx.save();
        ctx.translate(rf.x, rf.y);
        ctx.rotate(rf.rotation || 0);
        this.fighter.drawSingleShip(ctx, 0, 0, "#4ade80", "#ef4444", "#38bdf8");
        ctx.restore();
      }
      for (const laser of this.lasers) {
        laser.render(ctx);
      }
      for (const bomb of this.alienBombs) {
        bomb.render(ctx);
      }
      for (const p of this.particles) {
        p.render(ctx);
      }
      this.fighter.render(ctx);
      if (this.state === "STAGE_START") {
        ctx.save();
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 8;
        const text = this.isChallengingStage() ? "CHALLENGING STAGE" : `STAGE ${this.stage}`;
        ctx.fillText(text, this.width / 2, this.height / 2);
        ctx.restore();
      }
      if (this.state === "STAGE_CLEAR" && this.isChallengingStage()) {
        ctx.save();
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.fillText(`NUMBER OF HITS: ${this.challengingHits}`, this.width / 2, this.height / 2 - 20);
        const bonus = this.challengingHits >= 40 ? "PERFECT! 10000 PTS" : `BONUS: ${this.challengingHits * 100} PTS`;
        ctx.fillStyle = "#ffd700";
        ctx.fillText(bonus, this.width / 2, this.height / 2 + 15);
        ctx.restore();
      }
    }
  };

  // galacticshooter/js/main.js
  window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    const game = new GalacticShooterGame(canvas);
    const hudScore = document.getElementById("hud-score");
    const hudHighScore = document.getElementById("hud-high-score");
    const hudLives = document.getElementById("hud-lives");
    const hudStage = document.getElementById("hud-stage");
    const overlayTitle = document.getElementById("overlay-title");
    const overlayStats = document.getElementById("overlay-stats");
    const overlayBtn = document.getElementById("overlay-btn");
    const uiOverlay = document.getElementById("ui-overlay");
    const muteBtn = document.getElementById("btn-mute");
    window.addEventListener("keydown", (e) => {
      audio.init();
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        game.keys.left = true;
        e.preventDefault();
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        game.keys.right = true;
        e.preventDefault();
      } else if (e.code === "Space" || e.code === "KeyZ" || e.code === "KeyJ") {
        game.keys.fire = true;
        e.preventDefault();
      } else if (e.code === "KeyP") {
        game.isPaused = !game.isPaused;
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        game.keys.left = false;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        game.keys.right = false;
      } else if (e.code === "Space" || e.code === "KeyZ" || e.code === "KeyJ") {
        game.keys.fire = false;
      }
    });
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnFire = document.getElementById("btn-fire");
    const setupTouch = (elem, pressFn, releaseFn) => {
      if (!elem) return;
      elem.addEventListener("pointerdown", (e) => {
        audio.init();
        e.preventDefault();
        elem.classList.add("active");
        pressFn();
      });
      const end = (e) => {
        e.preventDefault();
        elem.classList.remove("active");
        releaseFn();
      };
      elem.addEventListener("pointerup", end);
      elem.addEventListener("pointercancel", end);
      elem.addEventListener("pointerleave", end);
    };
    setupTouch(btnLeft, () => {
      game.keys.left = true;
    }, () => {
      game.keys.left = false;
    });
    setupTouch(btnRight, () => {
      game.keys.right = true;
    }, () => {
      game.keys.right = false;
    });
    setupTouch(btnFire, () => {
      game.keys.fire = true;
    }, () => {
      game.keys.fire = false;
    });
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        const isMuted = audio.toggleMute();
        muteBtn.textContent = isMuted ? "\u{1F507} UNMUTE" : "\u{1F50A} SOUND";
      });
    }
    overlayBtn.addEventListener("click", () => {
      audio.init();
      uiOverlay.classList.add("hidden");
      game.startNewGame();
    });
    let lastTime = performance.now();
    function gameLoop(now) {
      requestAnimationFrame(gameLoop);
      game.update();
      game.render();
      if (hudScore) hudScore.textContent = game.score.toString().padStart(6, "0");
      if (hudHighScore) hudHighScore.textContent = game.highScore.toString().padStart(6, "0");
      if (hudStage) hudStage.textContent = `STAGE ${game.stage}`;
      if (hudLives) {
        const lifeIcons = [];
        for (let i = 0; i < Math.max(0, game.lives); i++) {
          lifeIcons.push("\u{1F680}");
        }
        if (game.fighter.isDual) {
          lifeIcons.push("\u2728[DUAL]");
        }
        hudLives.innerHTML = lifeIcons.join(" ");
      }
      if (game.state === "GAME_OVER" && uiOverlay.classList.contains("hidden")) {
        overlayTitle.textContent = "MISSION FAILED";
        overlayTitle.classList.remove("win");
        const acc = game.shotsFired > 0 ? Math.round(game.hits / game.shotsFired * 100) : 0;
        overlayStats.innerHTML = `
        FINAL SCORE: <span>${game.score}</span><br>
        SECTOR REACHED: <span>STAGE ${game.stage}</span><br>
        ACCURACY: <span>${acc}%</span> (${game.hits}/${game.shotsFired})
      `;
        overlayBtn.textContent = "PLAY AGAIN \u279C";
        uiOverlay.classList.remove("hidden");
      }
    }
    requestAnimationFrame(gameLoop);
  });
})();
