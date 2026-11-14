/**
 * Safari Background & Atmosphere Engine
 * Multi-layer parallax savanna, day-dusk-night cycle, Kilimanjaro silhouette, and wildlife.
 */

export class SafariBackground {
  constructor(canvasWidth, canvasHeight, groundY) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = groundY;

    // Parallax scroll offsets
    this.farScroll = 0;
    this.midScroll = 0;
    this.groundScroll = 0;
    this.cloudScroll = 0;

    // Sky cycle (0: Day, 1: Sunset/Dusk, 2: Night, 3: Dawn)
    this.timeOfDayIndex = 0;
    this.timeOfDayProgress = 0;

    // Starfield for night sky
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * (this.groundY - 90),
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    // Clouds
    this.clouds = [
      { x: 120, y: 40, w: 90, h: 24, speed: 0.2 },
      { x: 420, y: 70, w: 120, h: 28, speed: 0.25 },
      { x: 740, y: 35, w: 80, h: 22, speed: 0.18 }
    ];

    // Savanna grass tufts & pebbles along ground
    this.groundElements = [];
    for (let i = 0; i < 28; i++) {
      this.groundElements.push({
        x: Math.random() * (this.canvasWidth + 200),
        type: Math.random() > 0.4 ? 'grass' : 'pebble',
        size: Math.random() * 6 + 4
      });
    }
  }

  reset() {
    this.farScroll = 0;
    this.midScroll = 0;
    this.groundScroll = 0;
    this.cloudScroll = 0;
    this.timeOfDayIndex = 0;
    this.timeOfDayProgress = 0;
  }

  update(speed, score) {
    // Parallax speeds
    this.farScroll = (this.farScroll + speed * 0.08) % 1800;
    this.midScroll = (this.midScroll + speed * 0.28) % 900;
    this.groundScroll = (this.groundScroll + speed) % 60;
    this.cloudScroll = (this.cloudScroll + speed * 0.12) % (this.canvasWidth + 200);

    // Update clouds
    for (const c of this.clouds) {
      c.x -= speed * 0.14;
      if (c.x + c.w < -20) {
        c.x = this.canvasWidth + Math.random() * 80;
        c.y = 25 + Math.random() * 60;
      }
    }

    // Update ground pebbles/grass
    for (const el of this.groundElements) {
      el.x -= speed;
      if (el.x < -20) {
        el.x = this.canvasWidth + Math.random() * 60;
      }
    }

    // Day / Night Atmosphere Progression (cycle every 400 score points)
    const cycleLength = 400;
    const totalPhase = (score / cycleLength) % 4;
    this.timeOfDayIndex = Math.floor(totalPhase);
    this.timeOfDayProgress = totalPhase - this.timeOfDayIndex;
  }

  getTimeOfDayName() {
    const names = ['SAVANNA NOON', 'CRIMSON SUNSET', 'STARLIT NIGHT', 'GOLDEN DAWN'];
    return names[this.timeOfDayIndex] || 'SAVANNA NOON';
  }

  draw(ctx) {
    // 1. Sky Gradient & Celestial Body
    this.drawSky(ctx);

    // 2. Far Horizon (Kilimanjaro & Savanna Silhouettes)
    this.drawFarHorizon(ctx);

    // 3. Midground (Rolling Savanna Hills & Bush Silhouettes)
    this.drawMidground(ctx);

    // 4. Savanna Ground Line & Terrain
    this.drawGround(ctx);
  }

  drawSky(ctx) {
    // Color palettes for phases: [TopSky, HorizonSky, Sun/MoonColor]
    const palettes = [
      // 0: Noon (warm amber to golden sand)
      { top: '#fed7aa', bot: '#fef3c7', sun: '#f59e0b', isNight: false },
      // 1: Sunset (purple-crimson to fiery orange)
      { top: '#701a75', bot: '#ea580c', sun: '#f97316', isNight: false },
      // 2: Night (deep navy to dark indigo)
      { top: '#090d16', bot: '#1e1b4b', sun: '#fef08a', isNight: true },
      // 3: Dawn (lavender to golden peach)
      { top: '#4c1d95', bot: '#fed7aa', sun: '#fbbf24', isNight: false }
    ];

    const current = palettes[this.timeOfDayIndex];
    const next = palettes[(this.timeOfDayIndex + 1) % palettes.length];
    const t = this.timeOfDayProgress;

    // Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, this.lerpColor(current.top, next.top, t));
    grad.addColorStop(1, this.lerpColor(current.bot, next.bot, t));

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvasWidth, this.groundY);

    // Stars at night
    if (this.timeOfDayIndex === 1 || this.timeOfDayIndex === 2 || this.timeOfDayIndex === 3) {
      let nightAlpha = 0;
      if (this.timeOfDayIndex === 2) nightAlpha = 0.85;
      else if (this.timeOfDayIndex === 1) nightAlpha = t * 0.85;
      else if (this.timeOfDayIndex === 3) nightAlpha = (1 - t) * 0.85;

      if (nightAlpha > 0) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        for (const star of this.stars) {
          ctx.globalAlpha = star.alpha * nightAlpha;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Sun or Moon
    ctx.save();
    if (current.isNight || (this.timeOfDayIndex === 1 && t > 0.6) || (this.timeOfDayIndex === 3 && t < 0.4)) {
      // Crescent Moon
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = 'rgba(254, 240, 138, 0.6)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(this.canvasWidth - 110, 50, 18, 0, Math.PI * 2);
      ctx.fill();
      // Cutout for crescent
      ctx.fillStyle = current.top;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.canvasWidth - 118, 46, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden African Sun
      ctx.fillStyle = current.sun;
      ctx.shadowColor = current.sun;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(this.canvasWidth - 120, 60, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Clouds
    ctx.save();
    ctx.fillStyle = current.isNight ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.55)';
    for (const c of this.clouds) {
      this.drawCloud(ctx, c.x, c.y, c.w, c.h);
    }
    ctx.restore();
  }

  drawCloud(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x + w * 0.25, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
    ctx.arc(x + w * 0.5, y + h * 0.35, h * 0.6, 0, Math.PI * 2);
    ctx.arc(x + w * 0.75, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFarHorizon(ctx) {
    ctx.save();
    const horizonY = this.groundY - 10;
    const isNight = this.timeOfDayIndex === 2;
    const mountainColor = isNight ? '#1e1b4b' : '#9a3412';
    const snowColor = isNight ? '#94a3b8' : '#ffffff';

    // Repeating panoramic mountain range (Mount Kilimanjaro silhouette)
    const baseOffset = -this.farScroll;

    for (let loop = 0; loop < 3; loop++) {
      const startX = baseOffset + loop * 900;
      if (startX > this.canvasWidth || startX + 900 < 0) continue;

      // 1. Mount Kilimanjaro
      const kiliX = startX + 280;
      const kiliPeakY = horizonY - 110;
      ctx.fillStyle = mountainColor;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(kiliX - 180, horizonY);
      ctx.quadraticCurveTo(kiliX - 70, horizonY - 60, kiliX - 35, kiliPeakY);
      ctx.lineTo(kiliX + 35, kiliPeakY); // flat wide volcanic crater top
      ctx.quadraticCurveTo(kiliX + 70, horizonY - 60, kiliX + 180, horizonY);
      ctx.closePath();
      ctx.fill();

      // Snow-capped crater peak
      ctx.fillStyle = snowColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(kiliX - 35, kiliPeakY);
      ctx.lineTo(kiliX + 35, kiliPeakY);
      ctx.lineTo(kiliX + 28, kiliPeakY + 12);
      ctx.lineTo(kiliX + 10, kiliPeakY + 8);
      ctx.lineTo(kiliX - 10, kiliPeakY + 14);
      ctx.lineTo(kiliX - 28, kiliPeakY + 10);
      ctx.closePath();
      ctx.fill();

      // 2. Distant Flat-Topped Acacia Silhouette
      ctx.fillStyle = isNight ? '#0f172a' : '#451a03';
      ctx.globalAlpha = 0.4;
      this.drawDistantAcacia(ctx, startX + 100, horizonY - 36, 42);
      this.drawDistantAcacia(ctx, startX + 680, horizonY - 32, 38);

      // 3. Wandering Wildlife Silhouette (Giraffe / Elephant in distance)
      this.drawDistantGiraffe(ctx, startX + 540, horizonY - 38);
      this.drawDistantElephant(ctx, startX + 780, horizonY - 24);
    }

    ctx.restore();
  }

  drawDistantAcacia(ctx, x, y, size) {
    // Slender trunk and umbrella canopy
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.quadraticCurveTo(x + 4, y + size * 0.5, x, y + size * 0.3);
    ctx.stroke();

    // Spreading canopy umbrella
    ctx.beginPath();
    ctx.ellipse(x + 4, y + size * 0.25, size * 0.55, size * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDistantGiraffe(ctx, x, y) {
    // Tall neck silhouette
    ctx.beginPath();
    // Body
    ctx.ellipse(x, y + 24, 12, 6, -0.2, 0, Math.PI * 2);
    // Neck
    ctx.moveTo(x + 6, y + 22);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 10, y + 26);
    // Head
    ctx.arc(x + 14, y, 2.5, 0, Math.PI * 2);
    // Legs
    ctx.moveTo(x - 6, y + 24); ctx.lineTo(x - 6, y + 38);
    ctx.moveTo(x + 6, y + 24); ctx.lineTo(x + 6, y + 38);
    ctx.stroke();
    ctx.fill();
  }

  drawDistantElephant(ctx, x, y) {
    ctx.beginPath();
    // Heavy body
    ctx.ellipse(x, y + 12, 14, 10, 0, 0, Math.PI * 2);
    // Head & trunk
    ctx.arc(x - 12, y + 10, 7, 0, Math.PI * 2);
    ctx.moveTo(x - 16, y + 10);
    ctx.quadraticCurveTo(x - 20, y + 16, x - 18, y + 24);
    // Legs
    ctx.rect(x - 10, y + 16, 5, 8);
    ctx.rect(x + 5, y + 16, 5, 8);
    ctx.fill();
    ctx.stroke();
  }

  drawMidground(ctx) {
    ctx.save();
    const isNight = this.timeOfDayIndex === 2;
    ctx.fillStyle = isNight ? '#1e293b' : '#b45309';
    ctx.globalAlpha = 0.55;

    // Rolling gentle savanna dunes
    const baseOffset = -this.midScroll;
    for (let loop = 0; loop < 2; loop++) {
      const startX = baseOffset + loop * 900;
      ctx.beginPath();
      ctx.moveTo(startX, this.groundY);
      ctx.quadraticCurveTo(startX + 220, this.groundY - 30, startX + 450, this.groundY - 10);
      ctx.quadraticCurveTo(startX + 680, this.groundY - 26, startX + 900, this.groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawGround(ctx) {
    const isNight = this.timeOfDayIndex === 2;
    const earthBase = isNight ? '#1e1b4b' : '#78350f';
    const earthSurface = isNight ? '#312e81' : '#d97706';
    const grassColor = isNight ? '#064e3b' : '#65a30d';

    // 1. Solid Ground under floor
    ctx.fillStyle = earthBase;
    ctx.fillRect(0, this.groundY, this.canvasWidth, this.canvasHeight - this.groundY);

    // 2. Ground Surface Horizon Line
    ctx.fillStyle = earthSurface;
    ctx.fillRect(0, this.groundY - 3, this.canvasWidth, 3);

    // 3. Scrolling Dirt Marks & Savanna Texture
    ctx.strokeStyle = isNight ? '#3730a3' : '#b45309';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -this.groundScroll; x < this.canvasWidth + 60; x += 45) {
      ctx.moveTo(x, this.groundY + 8);
      ctx.lineTo(x + 16, this.groundY + 8);
      ctx.moveTo(x + 22, this.groundY + 16);
      ctx.lineTo(x + 32, this.groundY + 16);
    }
    ctx.stroke();

    // 4. Grass Tufts & Scattered Savanna Pebbles
    for (const el of this.groundElements) {
      if (el.x > -20 && el.x < this.canvasWidth + 20) {
        if (el.type === 'grass') {
          ctx.strokeStyle = grassColor;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(el.x, this.groundY);
          ctx.lineTo(el.x - 3, this.groundY - el.size);
          ctx.moveTo(el.x + 2, this.groundY);
          ctx.lineTo(el.x + 1, this.groundY - el.size * 1.2);
          ctx.moveTo(el.x + 4, this.groundY);
          ctx.lineTo(el.x + 6, this.groundY - el.size * 0.9);
          ctx.stroke();
        } else {
          ctx.fillStyle = isNight ? '#475569' : '#92400e';
          ctx.beginPath();
          ctx.ellipse(el.x, this.groundY + 3, el.size * 0.6, el.size * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  lerpColor(a, b, t) {
    const ah = parseInt(a.replace('#', ''), 16);
    const bh = parseInt(b.replace('#', ''), 16);
    const ar = (ah >> 16) & 255; const ag = (ah >> 8) & 255; const ab = ah & 255;
    const br = (bh >> 16) & 255; const bg = (bh >> 8) & 255; const bb = bh & 255;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return `rgb(${rr}, ${rg}, ${rb})`;
  }
}
