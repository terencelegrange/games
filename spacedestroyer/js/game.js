/**
 * Space Destroyer Game Core Engine
 * 60 FPS requestAnimationFrame loop, Invader Hive Movement, Destructible Bunker Erosion,
 * Mystery UFO Mothership, Bullet Collision Matrix, Wave Progression, and State Management.
 */

import { Fleet, LaserCannon, Bunker, Bullet, AlienBomb, MysteryShip } from './entities.js';
import { sound } from './audio.js';

export const STATES = {
  ROUND_START: 'ROUND_START',
  PLAYING: 'PLAYING',
  PLAYER_HIT: 'PLAYER_HIT',
  WAVE_CLEAR: 'WAVE_CLEAR',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER'
};

export class SpaceDestroyerGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options;

    this.width = 800;
    this.height = 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems & Game Entities
    this.wave = 1;
    this.score = 0;
    this.lives = 3;
    this.totalShots = 0;
    this.totalHits = 0;

    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;
    this.waveClearTimer = 0;
    this.respawnTimer = 0;
    this.previousState = STATES.PLAYING;

    // Input States
    this.keys = { left: false, right: false };

    // Starfield Background
    this.stars = [];
    this.initStars();

    // Game Entities
    this.initGameWorld();

    // Timing loop
    this.lastTime = performance.now();
    this.animId = null;

    this.start();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() < 0.2 ? 2 : 1,
        speed: 10 + Math.random() * 35,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  initBunkers() {
    this.bunkers = [];
    const count = 4;
    const spacing = 180;
    const startX = 85;
    for (let i = 0; i < count; i++) {
      this.bunkers.push(new Bunker(startX + i * spacing, 450));
    }
  }

  initGameWorld() {
    this.fleet = new Fleet(this.wave, this.width);
    this.cannon = new LaserCannon(this.width, this.height);
    this.initBunkers();
    this.playerBullets = [];
    this.alienBombs = [];
    this.mysteryShip = new MysteryShip(this.width);
    this.floatingScores = [];
  }

  start() {
    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;
    this.lastTime = performance.now();
    if (this.animId) cancelAnimationFrame(this.animId);
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);

    if (this.options.onScore) this.options.onScore(this.score);
    if (this.options.onWave) this.options.onWave(this.wave);
    if (this.options.onLives) this.options.onLives(this.lives);
    if (this.options.onInvaders) {
      this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
    }
  }

  reset() {
    sound.stopUfo();
    this.wave = 1;
    this.score = 0;
    this.lives = 3;
    this.totalShots = 0;
    this.totalHits = 0;
    this.initGameWorld();
    this.start();
  }

  setMoveLeft(val) {
    this.keys.left = Boolean(val);
  }

  setMoveRight(val) {
    this.keys.right = Boolean(val);
  }

  shoot() {
    if (this.state === STATES.ROUND_START) {
      // Allow instant start on fire without waiting for countdown
      this.state = STATES.PLAYING;
      this.roundStartTimer = 0;
    }
    // Only allow firing during active PLAYING state when cannon is alive
    if (this.state !== STATES.PLAYING || !this.cannon.alive) return;

    // Every spacebar press fires a missile immediately with no delay
    this.totalShots++;
    const bx = this.cannon.x + this.cannon.width / 2;
    const by = this.cannon.y - 8;
    this.playerBullets.push(new Bullet(bx, by, -560));
    sound.laser();
  }

  togglePause() {
    if (this.state === STATES.PLAYING || this.state === STATES.ROUND_START) {
      this.previousState = this.state;
      this.state = STATES.PAUSED;
      sound.stopUfo();
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

  addFloatingScore(text, x, y, color = '#facc15') {
    this.floatingScores.push({
      text,
      x,
      y,
      vy: -40,
      alpha: 1.0,
      color,
      life: 0.85
    });
  }

  handleWaveClear() {
    this.state = STATES.WAVE_CLEAR;
    this.waveClearTimer = 2.2;
    sound.stopUfo();
    sound.waveClear();

    if (this.options.onWaveClear) {
      this.options.onWaveClear(this.wave);
    }
  }

  advanceToNextWave() {
    this.wave++;
    this.fleet = new Fleet(this.wave, this.width);
    this.playerBullets = [];
    this.alienBombs = [];
    this.mysteryShip = new MysteryShip(this.width);
    this.cannon.reset();
    this.initBunkers(); // Restore shields for fresh wave

    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;

    if (this.options.onWave) this.options.onWave(this.wave);
    if (this.options.onInvaders) {
      this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
    }
  }

  handlePlayerDeath() {
    this.lives--;
    this.cannon.destroy();
    if (this.options.onLives) this.options.onLives(this.lives);

    if (this.lives <= 0) {
      this.handleGameOver('CANNON DESTROYED');
    } else {
      this.state = STATES.PLAYER_HIT;
      this.respawnTimer = 1.4;
    }
  }

  handleGameOver(reason = 'GAME OVER') {
    this.state = STATES.GAME_OVER;
    sound.stopUfo();
    sound.gameOver();

    const accuracy = this.totalShots > 0
      ? Math.round((this.totalHits / this.totalShots) * 100)
      : 0;

    if (this.options.onGameOver) {
      this.options.onGameOver({
        score: this.score,
        wave: this.wave,
        accuracy,
        totalHits: this.totalHits,
        totalShots: this.totalShots,
        reason
      });
    }
  }

  loop(currentTime) {
    if (
      this.state !== STATES.PLAYING &&
      this.state !== STATES.ROUND_START &&
      this.state !== STATES.PLAYER_HIT &&
      this.state !== STATES.WAVE_CLEAR
    ) {
      return;
    }

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Update twinkling background stars
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
    }

    // 2. Intermission / Countdown Timers
    if (this.state === STATES.ROUND_START) {
      this.roundStartTimer -= dt;
      this.mysteryShip.update(dt);
      if (this.roundStartTimer <= 0) {
        this.state = STATES.PLAYING;
      }
      return;
    }

    if (this.state === STATES.WAVE_CLEAR) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.advanceToNextWave();
      }
      return;
    }

    if (this.state === STATES.PLAYER_HIT) {
      this.cannon.update(dt, 0);
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.cannon.reset();
        this.state = STATES.PLAYING;
      }
      return;
    }

    // 3. Active Gameplay Updates
    let moveInput = 0;
    if (this.keys.left) moveInput -= 1;
    if (this.keys.right) moveInput += 1;
    this.cannon.update(dt, moveInput);

    // Fleet updates and bomb drops
    this.fleet.update(dt, (bx, by) => {
      this.alienBombs.push(new AlienBomb(bx, by, 240 + (this.wave - 1) * 15));
    });

    // Check Invasion Failure: lowest invader reaches bunker / player baseline
    if (this.fleet.getBounds().maxY >= 470) {
      this.handleGameOver('INVASION REACHED BASELINE!');
      return;
    }

    // Mystery UFO mothership update
    this.mysteryShip.update(dt);

    // 4. Update Player Bullets & Collision Handling
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.update(dt);

      // A. Bullet vs Invaders
      let bulletConsumed = false;
      for (const inv of this.fleet.invaders) {
        if (
          inv.alive &&
          b.x >= inv.x &&
          b.x <= inv.x + inv.width &&
          b.y >= inv.y &&
          b.y <= inv.y + inv.height
        ) {
          inv.onHit();
          sound.invaderHit();
          this.totalHits++;
          this.score += inv.points;
          this.addFloatingScore(`+${inv.points}`, inv.x + inv.width / 2, inv.y, inv.config.color);

          if (this.options.onScore) this.options.onScore(this.score);
          if (this.options.onInvaders) {
            this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
          }

          bulletConsumed = true;
          if (this.fleet.getAliveCount() === 0) {
            this.handleWaveClear();
          }
          break;
        }
      }

      // B. Bullet vs Mystery UFO
      if (!bulletConsumed && this.mysteryShip.active) {
        const ufo = this.mysteryShip;
        if (
          b.x >= ufo.x &&
          b.x <= ufo.x + ufo.width &&
          b.y >= ufo.y &&
          b.y <= ufo.y + ufo.height
        ) {
          const pts = ufo.onHit();
          this.totalHits++;
          this.score += pts;
          this.addFloatingScore(`★ +${pts} ★`, ufo.x + ufo.width / 2, ufo.y - 10, '#facc15');
          if (this.options.onScore) this.options.onScore(this.score);
          bulletConsumed = true;
        }
      }

      // C. Bullet vs Bunkers (Shields)
      if (!bulletConsumed) {
        for (const bk of this.bunkers) {
          if (bk.checkHit(b.x, b.y, 6)) {
            sound.bunkerHit();
            bulletConsumed = true;
            break;
          }
        }
      }

      if (bulletConsumed || !b.active) {
        this.playerBullets.splice(i, 1);
      }
    }

    // 5. Update Alien Bombs & Collision Handling
    for (let i = this.alienBombs.length - 1; i >= 0; i--) {
      const bomb = this.alienBombs[i];
      bomb.update(dt);

      let bombConsumed = false;

      // A. Bomb vs Bunkers
      for (const bk of this.bunkers) {
        if (bk.checkHit(bomb.x, bomb.y, 7)) {
          sound.bunkerHit();
          bombConsumed = true;
          break;
        }
      }

      // B. Bomb vs Player Cannon
      if (!bombConsumed && this.cannon.alive) {
        const c = this.cannon;
        if (
          bomb.x >= c.x &&
          bomb.x <= c.x + c.width &&
          bomb.y >= c.y &&
          bomb.y <= c.y + c.height
        ) {
          bombConsumed = true;
          this.handlePlayerDeath();
        }
      }

      if (bombConsumed || !bomb.active) {
        this.alienBombs.splice(i, 1);
      }
    }

    // 6. Update Floating Scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const f = this.floatingScores[i];
      f.y += f.vy * dt;
      f.life -= dt;
      f.alpha = Math.max(0, f.life / 0.85);
      if (f.life <= 0) this.floatingScores.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Clear cosmos backdrop & render stars
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#ffffff';
    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // 2. Render Mystery UFO Mothership
    this.mysteryShip.render(ctx);

    // 3. Render Invaders Hive
    this.fleet.render(ctx);

    // 4. Render Defense Bunkers
    for (const bk of this.bunkers) {
      bk.render(ctx);
    }

    // 5. Render Projectiles (Lasers & Bombs)
    for (const b of this.playerBullets) {
      b.render(ctx);
    }
    for (const bomb of this.alienBombs) {
      bomb.render(ctx);
    }

    // 6. Render Player Cannon
    this.cannon.render(ctx);

    // 7. Ground / Baseline Barrier Line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 24);
    ctx.lineTo(this.width, this.height - 24);
    ctx.stroke();

    // 8. Render Floating Score Callouts
    for (const f of this.floatingScores) {
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 6;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1.0;

    // 9. Overlays & Banners
    if (this.state === STATES.ROUND_START) {
      this.renderRoundStartOverlay(ctx);
    } else if (this.state === STATES.WAVE_CLEAR) {
      this.renderWaveClearOverlay(ctx);
    } else if (this.state === STATES.PAUSED) {
      this.renderPausedOverlay(ctx);
    }

    ctx.restore();
  }

  renderRoundStartOverlay(ctx) {
    const seconds = Math.max(1, Math.ceil(this.roundStartTimer));

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 200, this.width, 180);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 200); ctx.lineTo(this.width, 200);
    ctx.moveTo(0, 380); ctx.lineTo(this.width, 380);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    ctx.fillText(`★ WAVE ${this.wave} ★`, this.width / 2, 245);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('ALIEN FLEET DESCENDING...', this.width / 2, 285);

    ctx.fillStyle = '#facc15';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`GET READY! ${seconds}`, this.width / 2, 335);

    ctx.restore();
  }

  renderWaveClearOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 210, this.width, 160);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#059669';
    ctx.shadowBlur = 12;
    ctx.fillText(`★ WAVE ${this.wave} CLEARED! ★`, this.width / 2, 270);

    ctx.fillStyle = '#facc15';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText('INCOMING REINFORCEMENTS FASTER & LOWER!', this.width / 2, 320);

    ctx.restore();
  }

  renderPausedOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.width / 2, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('PRESS P TO RESUME', this.width / 2, 320);

    ctx.restore();
  }
}
