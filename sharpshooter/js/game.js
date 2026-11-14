/**
 * Sharpshooter Core Game Engine
 * 60 FPS delta loop, retro shooting gallery scenery, central crosshair recoil,
 * target hit detection, 1-point scoring, stage progression, and lives management.
 */

import { Crosshair } from './crosshair.js';
import { TargetManager, TARGET_TYPES } from './targets.js';
import { sound } from './audio.js';

export const STATES = {
  READY: 'READY',
  ROUND_START: 'ROUND_START',
  PLAYING: 'PLAYING',
  STAGE_CLEAR: 'STAGE_CLEAR',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class SharpshooterGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.width = 900;
    this.height = 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems
    this.crosshair = new Crosshair(this.width, this.height);
    this.targets = new TargetManager(1);

    // Gameplay Variables
    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;
    this.previousState = STATES.PLAYING;
    this.score = 0;
    this.stage = 1;
    this.lives = 3;
    this.stageHits = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.conveyorOffset = 0;

    // Transition & Animation Timers
    this.stageClearTimer = 0;
    this.screenShake = 0;
    this.bgAnimTick = 0;

    // Timing loop
    this.lastTime = performance.now();
    this.animId = null;

    this.start();
  }

  start() {
    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;
    this.lastTime = performance.now();
    if (this.animId) cancelAnimationFrame(this.animId);
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);

    const config = this.targets.getStageConfig();
    if (this.options.onStage) this.options.onStage(this.stage, config);
    if (this.options.onProgress) this.options.onProgress(this.stageHits, this.targets.stageTargetQuota);
    if (this.options.onLives) this.options.onLives(this.lives);
    if (this.options.onScore) this.options.onScore(this.score);
  }

  reset() {
    this.score = 0;
    this.stage = 1;
    this.lives = 3;
    this.stageHits = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.screenShake = 0;

    this.targets.reset(1);

    if (this.options.onScore) this.options.onScore(0);
    if (this.options.onLives) this.options.onLives(this.lives);
    const config = this.targets.getStageConfig();
    if (this.options.onStage) this.options.onStage(this.stage, config);
    if (this.options.onProgress) this.options.onProgress(0, this.targets.stageTargetQuota);

    this.start();
  }

  // Trigger gun shot
  shoot() {
    if (this.state === STATES.GAME_OVER || this.state === STATES.PAUSED) return;
    if (this.state === STATES.STAGE_CLEAR || this.state === STATES.ROUND_START) return;

    this.totalShots++;
    this.crosshair.fire();
    sound.gunshot();
    this.screenShake = 4.5;

    // Check collision against active moving targets passing through crosshair
    let hitSomething = false;

    for (const target of this.targets.targets) {
      if (target.active && target.state === 'moving') {
        const res = this.crosshair.checkHit(target);
        if (res.hit) {
          hitSomething = true;
          this.totalHits++;
          this.stageHits++;
          this.score += 1; // Exactly 1 point per target

          target.onHit(res.bullseye);
          sound.targetHit(target.type);

          const banner = res.bullseye ? '★ BULLSEYE +1 ★' : '+1';
          const bannerColor = res.bullseye ? '#facc15' : '#4ade80';
          this.targets.addFloatingScore(banner, target.x, target.y - 20, bannerColor);

          if (this.options.onScore) this.options.onScore(this.score);
          if (this.options.onProgress) {
            this.options.onProgress(this.stageHits, this.targets.stageTargetQuota);
          }

          // Check Stage Clear Quota (10 hits)
          if (this.stageHits >= this.targets.stageTargetQuota) {
            this.handleStageClear();
          }
          break; // One bullet hits one target
        }
      }
    }

    if (!hitSomething) {
      sound.miss();
      this.lives--;
      this.targets.addFloatingScore('MISS', this.crosshair.x, this.crosshair.y - 30, '#ef4444');
      if (this.options.onLives) this.options.onLives(this.lives);

      if (this.lives <= 0) {
        this.handleGameOver();
      }
    }
  }

  handleStageClear() {
    this.state = STATES.STAGE_CLEAR;
    this.stageClearTimer = 2.0;
    sound.stageClear();

    if (this.options.onStageClear) {
      this.options.onStageClear(this.stage);
    }
  }

  advanceToNextStage() {
    this.stage++;
    this.stageHits = 0;
    this.targets.setStage(this.stage);
    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;

    const config = this.targets.getStageConfig();
    if (this.options.onStage) this.options.onStage(this.stage, config);
    if (this.options.onProgress) this.options.onProgress(0, this.targets.stageTargetQuota);
  }

  togglePause() {
    if (this.state === STATES.PLAYING || this.state === STATES.ROUND_START) {
      this.previousState = this.state;
      this.state = STATES.PAUSED;
      if (this.animId) cancelAnimationFrame(this.animId);
      this.render();
      return true;
    } else if (this.state === STATES.PAUSED) {
      this.state = this.previousState || STATES.PLAYING;
      this.lastTime = performance.now();
      this.animId = requestAnimationFrame(this.loop);
      return false;
    }
    return false;
  }

  handleGameOver() {
    this.state = STATES.GAME_OVER;
    sound.gameOver();

    const accuracy = this.totalShots > 0
      ? Math.round((this.totalHits / this.totalShots) * 100)
      : 0;

    if (this.options.onGameOver) {
      this.options.onGameOver({
        score: this.score,
        stage: this.stage,
        accuracy,
        totalHits: this.totalHits,
        totalShots: this.totalShots
      });
    }
  }

  loop(currentTime) {
    if (this.state !== STATES.PLAYING && this.state !== STATES.STAGE_CLEAR && this.state !== STATES.ROUND_START) {
      return;
    }

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.bgAnimTick += dt;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 18);
    }

    // Stage clear intermission timer
    if (this.state === STATES.STAGE_CLEAR) {
      this.stageClearTimer -= dt;
      this.crosshair.update(dt);
      this.targets.update(dt);

      if (this.stageClearTimer <= 0) {
        this.advanceToNextStage();
      }
      return;
    }

    // Round start countdown timer (targets stay queued off-screen)
    if (this.state === STATES.ROUND_START) {
      this.roundStartTimer -= dt;
      this.crosshair.update(dt);
      if (this.roundStartTimer <= 0) {
        this.state = STATES.PLAYING;
      }
      return;
    }

    // Update conveyor track animation offset
    const speed = this.targets.getStageConfig().speed;
    this.conveyorOffset = (this.conveyorOffset + speed * dt) % 24;

    // Standard play update
    this.crosshair.update(dt);
    this.targets.update(dt);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0.1) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Draw 80s Shooting Gallery Scenery
    this.renderGalleryBackground(ctx);

    // 2. Draw Moving Targets & Effects
    this.targets.render(ctx);

    // 3. Draw Central Fixed Crosshair
    this.crosshair.render(ctx);

    // 4. Overlays & Messages
    if (this.state === STATES.READY) {
      this.renderReadyScreen(ctx);
    } else if (this.state === STATES.ROUND_START) {
      this.renderRoundStartScreen(ctx);
    } else if (this.state === STATES.STAGE_CLEAR) {
      this.renderStageClearScreen(ctx);
    } else if (this.state === STATES.PAUSED) {
      this.renderPausedScreen(ctx);
    }

    ctx.restore();
  }

  // --- Background Scenery ---

  renderGalleryBackground(ctx) {
    // Vintage Carnival Meadow & Wooden Shooting Booth
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.65, '#bae6fd');
    skyGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Distant Rolling Hills
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.bezierCurveTo(240, 220, 380, 260, 600, 230);
    ctx.bezierCurveTo(740, 210, 820, 240, 900, 235);
    ctx.lineTo(900, 350);
    ctx.lineTo(0, 350);
    ctx.closePath();
    ctx.fill();

    // Midground Darker Forest Ridge
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.bezierCurveTo(180, 260, 340, 285, 520, 265);
    ctx.bezierCurveTo(680, 250, 780, 280, 900, 275);
    ctx.lineTo(900, 350);
    ctx.lineTo(0, 350);
    ctx.closePath();
    ctx.fill();

    // Fluffy Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    this.renderCloud(ctx, 120, 70, 48);
    this.renderCloud(ctx, 420, 95, 36);
    this.renderCloud(ctx, 720, 60, 52);

    // Shooting Gallery Wooden Counter & Mechanical Conveyor Rail
    // Lower Booth Wall (Rich mahogany wood slats)
    const wallGrad = ctx.createLinearGradient(0, 320, 0, 500);
    wallGrad.addColorStop(0, '#78350f');
    wallGrad.addColorStop(0.5, '#451a03');
    wallGrad.addColorStop(1, '#290e02');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 320, this.width, 180);

    // Vertical Wood Plank Lines
    ctx.strokeStyle = '#290e02';
    ctx.lineWidth = 2;
    for (let x = 60; x < this.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 320);
      ctx.lineTo(x, 500);
      ctx.stroke();
    }

    // Heavy Brass Countertop Ledge
    const counterGrad = ctx.createLinearGradient(0, 310, 0, 324);
    counterGrad.addColorStop(0, '#fde047');
    counterGrad.addColorStop(0.3, '#ca8a04');
    counterGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = counterGrad;
    ctx.fillRect(0, 310, this.width, 14);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 310, this.width, 14);

    // Central Target Track / Mechanical Steel Rail (Conveyor line at Y = 266-274)
    // Support posts
    ctx.fillStyle = '#475569';
    for (let px = 90; px < this.width; px += 180) {
      ctx.fillRect(px - 4, 272, 8, 42);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(px - 4, 272, 8, 42);
    }

    // Main Steel Guide Rail
    const railGrad = ctx.createLinearGradient(0, 266, 0, 274);
    railGrad.addColorStop(0, '#94a3b8');
    railGrad.addColorStop(0.5, '#f8fafc');
    railGrad.addColorStop(1, '#334155');
    ctx.fillStyle = railGrad;
    ctx.fillRect(0, 266, this.width, 8);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(0, 266, this.width, 8);

    // Moving conveyor chain notches / gear teeth
    const notchSpacing = 24;
    const offset = (this.conveyorOffset || 0) % notchSpacing;
    ctx.fillStyle = '#0f172a';
    for (let nx = -notchSpacing + offset; nx < this.width + notchSpacing; nx += notchSpacing) {
      ctx.fillRect(nx - 2, 268, 4, 4);
    }

    // Carnival Warning Chevron Stripes along base
    const stripeWidth = 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 316, this.width, 8);
    ctx.clip();
    for (let sx = -30; sx < this.width + 30; sx += stripeWidth * 2) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(sx, 324);
      ctx.lineTo(sx + 16, 316);
      ctx.lineTo(sx + 16 + stripeWidth, 316);
      ctx.lineTo(sx + stripeWidth, 324);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Top Gallery Marquee Valance / Carnival Drapery
    this.renderMarqueeValance(ctx);
  }

  renderCloud(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y - r * 0.2, r * 0.75, 0, Math.PI * 2);
    ctx.arc(x + r * 1.3, y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  renderMarqueeValance(ctx) {
    // Red and White Carnival Scalloped Valance
    const scallopWidth = 36;
    const count = Math.ceil(this.width / scallopWidth);

    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = i * scallopWidth;
      const isRed = i % 2 === 0;

      ctx.fillStyle = isRed ? '#dc2626' : '#ffffff';
      ctx.beginPath();
      ctx.rect(x, 0, scallopWidth, 20);
      ctx.fill();

      // Scalloped bottom
      ctx.beginPath();
      ctx.arc(x + scallopWidth / 2, 20, scallopWidth / 2, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Golden fringe tassel dot
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x + scallopWidth / 2, 20 + scallopWidth / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top Header Board
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, this.width, 10);
    ctx.restore();
  }

  // --- Overlay Screens ---

  renderReadyScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fillText('SHARPSHOOTER', this.width / 2, 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('80s ARCADE SHOOTING GALLERY', this.width / 2, 215);

    // Blinking Prompt
    if (Math.floor(this.bgAnimTick * 3) % 2 === 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText('PRESS SPACEBAR OR CLICK TO FIRE!', this.width / 2, 350);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillText('HIT TARGETS WHEN CENTERED IN CROSSHAIR • 1 PT PER HIT', this.width / 2, 385);
  }

  renderRoundStartScreen(ctx) {
    const config = this.targets.getStageConfig();
    const secondsLeft = Math.max(1, Math.ceil(this.roundStartTimer));

    // Semi-transparent backdrop ribbon
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 150, this.width, 200);

    // Neon amber accent borders
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 150); ctx.lineTo(this.width, 150);
    ctx.moveTo(0, 350); ctx.lineTo(this.width, 350);
    ctx.stroke();

    // Stage Header
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ca8a04';
    ctx.shadowBlur = 10;
    ctx.fillText(`★ STAGE ${this.stage} ★`, this.width / 2, 195);

    // Target type banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText(`TARGET: ${config.icon} ${config.name}`, this.width / 2, 235);

    // GET READY & Countdown with subtle pulse
    const pulse = Math.sin(this.bgAnimTick * 8) * 0.1 + 1.0;
    ctx.fillStyle = '#38bdf8';
    ctx.font = `${Math.round(18 * pulse)}px "Press Start 2P", monospace`;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;
    ctx.fillText(`GET READY... ${secondsLeft}`, this.width / 2, 290);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('TARGETS APPROACHING FROM THE LEFT • AIM FOR CENTER', this.width / 2, 325);

    ctx.restore();
  }

  renderStageClearScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#15803d';
    ctx.shadowBlur = 12;
    ctx.fillText(`★ STAGE ${this.stage} CLEARED! ★`, this.width / 2, 210);

    const nextStage = this.stage + 1;
    const nextCycle = ((nextStage - 1) % 20) + 1;
    const nextDef = TARGET_TYPES[nextCycle];

    ctx.fillStyle = '#facc15';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText(`NEXT TARGET: ${nextDef.icon} ${nextDef.name} (FASTER!)`, this.width / 2, 260);
  }

  renderPausedScreen(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.width / 2, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('PRESS P TO RESUME', this.width / 2, 280);
  }
}
