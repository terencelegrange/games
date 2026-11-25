/**
 * Gorillas Main Game State Controller
 * Manages turn-based round loop, ballistic collisions, explosion particles,
 * screen shake, wind generation, AI coordination, and UI updates.
 */

import { Banana, checkCircleCircle, checkCircleAABB, simulateTrajectory } from './physics.js';
import { Skyline } from './skyline.js';
import { GorillasAI } from './ai.js';
import { sound } from './audio.js';

export class GorillasGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;
    this.width = canvas.width;
    this.height = canvas.height;

    this.skyline = new Skyline(this.width, this.height);
    this.ai = new GorillasAI();

    // Game state: 'PLAYER_AIM', 'BANANA_FLIGHT', 'EXPLOSION', 'AI_THINKING', 'ROUND_OVER', 'MATCH_OVER', 'PAUSED'
    this.state = 'PLAYER_AIM';
    this.previousState = 'PLAYER_AIM';

    // Scores
    this.playerWins = 0;
    this.aiWins = 0;
    this.targetWins = 3; // First to 3 wins match
    this.round = 1;

    // Atmospheric wind (-12 to +12 MPH)
    this.wind = 0;
    this.generateWind();

    // Active projectile
    this.banana = null;
    this.currentThrower = 1; // 1 = Player, 2 = Computer

    // Explosions and visual FX
    this.explosion = null;
    this.screenShake = 0;
    this.particles = [];

    // Slingshot drag aiming state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };

    // Player inputs
    this.playerAngle = 60;
    this.playerVelocity = 55;

    // Timers
    this.aiTimer = 0;
    this.roundOverTimer = 0;
    this.chestPoundTimer = 0;

    // Animation frame tracking
    this.lastTime = performance.now();
    this.running = false;
  }

  generateWind() {
    // Generate wind between -12 and +12 MPH
    const raw = (Math.random() * 24 - 12);
    this.wind = Math.round(raw * 10) / 10;
    if (this.options.onWindChange) {
      this.options.onWindChange(this.wind);
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.state = 'PLAYER_AIM';
    this.updateHUD();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  togglePause() {
    if (this.state === 'PAUSED') {
      this.state = this.previousState;
    } else {
      this.previousState = this.state;
      this.state = 'PAUSED';
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
    this.state = 'PLAYER_AIM';
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
    if (this.state !== 'PLAYER_AIM') return;

    this.playerAngle = Math.max(0, Math.min(90, Number(angle)));
    this.playerVelocity = Math.max(1, Math.min(100, Number(velocity)));

    const g1 = this.skyline.gorilla1;
    g1.state = 'throwing';
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
    this.state = 'BANANA_FLIGHT';
    this.updateHUD();
  }

  // AI executes throw
  executeAIThrow() {
    const g2 = this.skyline.gorilla2;
    const g1 = this.skyline.gorilla1;
    const shot = this.ai.calculateShot(g2, g1, this.wind);

    g2.state = 'throwing';
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
    this.state = 'BANANA_FLIGHT';
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

    // Create vibrant arcade sparks
    const count = isGorillaHit ? 45 : 25;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isGorillaHit ? 220 : 130);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color: ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff', '#38bdf8'][Math.floor(Math.random() * 5)],
        size: 2 + Math.random() * 3,
        life: 0.35 + Math.random() * 0.4
      });
    }

    // Carve building terrain crater
    this.skyline.explodeCrater(x, y, isGorillaHit ? 28 : 22);

    if (isGorillaHit) {
      sound.gorillaHit();
      const victim = hitGorillaId === 1 ? this.skyline.gorilla1 : this.skyline.gorilla2;
      const victor = hitGorillaId === 1 ? this.skyline.gorilla2 : this.skyline.gorilla1;
      if (victim) victim.state = 'dead';
      if (victor) {
        victor.state = 'celebrate';
        victor.animTick = 0;
      }

      if (hitGorillaId === 2) {
        // Player defeated AI
        this.playerWins++;
      } else {
        // AI defeated Player
        this.aiWins++;
      }

      this.state = 'ROUND_OVER';
      this.roundOverTimer = 3.5;
      sound.victory();
    } else {
      sound.explosion();
      this.state = 'EXPLOSION';
    }

    if (this.currentThrower === 2) {
      this.ai.recordImpact(x);
    }

    this.banana = null;
    this.updateHUD();
  }

  update(dt) {
    if (this.state === 'PAUSED') return;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt; // Particle gravity
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Update skyline and gorillas
    this.skyline.update(dt, this.banana);

    // Update Banana flight
    if (this.state === 'BANANA_FLIGHT' && this.banana) {
      this.banana.update(dt);

      const bx = this.banana.x;
      const by = this.banana.y;
      const br = this.banana.radius;

      // 1. Check collision with Gorilla 1 (skip if Gorilla 1 is thrower and within launch grace period)
      const g1 = this.skyline.gorilla1;
      const skipG1 = (this.banana.throwerId === 1 && this.banana.age < 0.35);
      if (!skipG1 && g1 && g1.state !== 'dead' && checkCircleCircle(bx, by, br, g1.x, g1.y, 16)) {
        this.triggerExplosion(bx, by, true, 1);
        return;
      }

      // 2. Check collision with Gorilla 2 (skip if Gorilla 2 is thrower and within launch grace period)
      const g2 = this.skyline.gorilla2;
      const skipG2 = (this.banana.throwerId === 2 && this.banana.age < 0.35);
      if (!skipG2 && g2 && g2.state !== 'dead' && checkCircleCircle(bx, by, br, g2.x, g2.y, 16)) {
        this.triggerExplosion(bx, by, true, 2);
        return;
      }

      // 3. Check collision with solid buildings
      if (this.skyline.checkTerrainCollision(bx, by, br)) {
        this.triggerExplosion(bx, by, false);
        return;
      }

      // 4. Check out of bounds
      if (by > this.height + 40 || bx < -100 || bx > this.width + 100) {
        // Banana lost into the void
        this.banana = null;
        this.switchTurn();
      }
    }

    // Update Explosion decay
    if (this.state === 'EXPLOSION' && this.explosion) {
      this.explosion.timer += dt;
      if (this.explosion.timer >= this.explosion.duration) {
        this.explosion = null;
        this.switchTurn();
      }
    }

    // Update AI Thinking delay
    if (this.state === 'AI_THINKING') {
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        this.executeAIThrow();
      }
    }

    // Update Round Over delay & victory celebration
    if (this.state === 'ROUND_OVER') {
      this.roundOverTimer -= dt;
      this.chestPoundTimer += dt;
      if (this.chestPoundTimer >= 0.5) {
        this.chestPoundTimer = 0;
        sound.chestPound();
      }

      if (this.roundOverTimer <= 0) {
        if (this.playerWins >= this.targetWins || this.aiWins >= this.targetWins) {
          this.state = 'MATCH_OVER';
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
      // Switch to AI
      this.currentThrower = 2;
      this.state = 'AI_THINKING';
      this.aiTimer = 1.0;
    } else {
      // Switch to Player
      this.currentThrower = 1;
      this.state = 'PLAYER_AIM';
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

    // Screen shake translation
    if (this.screenShake > 0) {
      const shakeX = (Math.random() * 2 - 1) * this.screenShake;
      const shakeY = (Math.random() * 2 - 1) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Classic QBasic EGA Deep Blue / Twilight Sky
    ctx.fillStyle = '#0000aa'; // Authentic QBasic deep sky blue
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render Skyline (Sun, Buildings, Gorillas)
    this.skyline.render(ctx);

    // 3. Render Banana and smoke trail
    if (this.banana) {
      this.banana.render(ctx);
    }

    // 4. Render Slingshot Drag Aiming Guide Line
    if (this.state === 'PLAYER_AIM' && this.isDragging) {
      this.renderSlingshotAim(ctx);
    }

    // 5. Render Explosion Flash & Blast Wave
    if (this.explosion) {
      const ex = this.explosion;
      const progress = ex.timer / ex.duration;
      const curRadius = ex.radius * (0.4 + progress * 0.8);
      const alpha = Math.max(0, 1.0 - progress);

      ctx.save();
      // Outer blast glow
      const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, curRadius * 1.5);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.3, `rgba(253, 224, 71, ${alpha * 0.8})`);
      grad.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, curRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Render Overlays (Pause, Round Winner, Match Winner)
    this.renderOverlays(ctx);

    ctx.restore();
  }

  renderSlingshotAim(ctx) {
    const g1 = this.skyline.gorilla1;
    const startX = g1.x + 20;
    const startY = g1.y - 20;

    // Draw trajectory dots preview
    const path = simulateTrajectory(startX, startY, this.playerAngle, this.playerVelocity, true, this.wind, 1.2, 0.06);

    ctx.save();
    ctx.strokeStyle = '#ffff55';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    path.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw pull line from gorilla hand
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
    ctx.stroke();

    ctx.restore();
  }

  renderOverlays(ctx) {
    if (this.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#facc15';
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 10);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS P TO RESUME', this.width / 2, this.height / 2 + 30);
    } else if (this.state === 'ROUND_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, this.width, 100);

      const winnerText = this.skyline.gorilla2.state === 'dead' ? '★ PLAYER SCORES A DIRECT HIT! ★' : '💀 COMPUTER SCORES A DIRECT HIT! 💀';
      ctx.fillStyle = this.skyline.gorilla2.state === 'dead' ? '#4ade80' : '#f87171';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(winnerText, this.width / 2, 45);

      ctx.fillStyle = '#ffff55';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`ROUND ${this.round} CLEARED • GENERATING NEXT SKYLINE...`, this.width / 2, 75);
    } else if (this.state === 'MATCH_OVER') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      const playerWon = this.playerWins > this.aiWins;
      ctx.fillStyle = playerWon ? '#4ade80' : '#f87171';
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(playerWon ? '★ VICTORY! ★' : 'GAME OVER', this.width / 2, 220);

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`FINAL SCORE: PLAYER ${this.playerWins} - ${this.aiWins} COMPUTER`, this.width / 2, 270);

      ctx.fillStyle = '#ffff55';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS RESTART TO PLAY AGAIN', this.width / 2, 320);
    }
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.loop());
  }
}
