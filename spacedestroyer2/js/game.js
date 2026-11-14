/**
 * Space Destroyer II Game Core Engine
 * 60 FPS requestAnimationFrame loop, Invader Hive Movement, Destructible Bunkers,
 * High-Cadence Mystery UFO Mothership, Falling Power-Up Drops, Multi-Tier Arsenal,
 * Bullet Collision Matrix, Wave Progression, and State Management.
 */

import {
  Fleet,
  LaserCannon,
  Bunker,
  Bullet,
  AlienBomb,
  MysteryShip,
  PowerUpPod,
  ShieldItem,
  MegaBullet,
  MegaExplosion,
  WEAPON_TIERS
} from './entities.js';
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
        size: Math.random() < 0.25 ? 2 : 1,
        speed: 12 + Math.random() * 40,
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
    this.powerUpPods = [];
    this.shieldItems = [];
    this.shieldItemSpawned = false;
    this.shieldItemTimer = 3.5;
    this.explosions = [];
    this.activeMegaBullet = null;
    this.floatingScores = [];
    this.shields = 1; // 1 Shield provided per level
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
    if (this.options.onWeapon) this.options.onWeapon(WEAPON_TIERS[this.cannon.weaponTier]);
    if (this.options.onShield) this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
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
    this.activeMegaBullet = null;
    this.explosions = [];
    this.shields = 1;
    this.shieldItems = [];
    this.shieldItemSpawned = false;
    this.shieldItemTimer = 3.5;
    this.initGameWorld();
    this.start();
  }

  setMoveLeft(val) {
    this.keys.left = Boolean(val);
  }

  setMoveRight(val) {
    this.keys.right = Boolean(val);
  }

  triggerShield() {
    if (this.state === STATES.ROUND_START) {
      this.state = STATES.PLAYING;
    }
    if (this.state !== STATES.PLAYING || !this.cannon.alive) return false;
    if (this.cannon.shieldActive) return false;
    if (this.shields > 0) {
      this.shields--;
      this.cannon.activateShield(6.0);
      sound.shieldActivate();
      this.addFloatingScore('★ SHIELD ACTIVE (6s) ★', this.cannon.x + this.cannon.width / 2, this.cannon.y - 20, '#06b6d4');
      if (this.options.onShield) {
        this.options.onShield(this.shields, true, 6.0);
      }
      return true;
    }
    return false;
  }

  shoot() {
    if (this.state === STATES.ROUND_START) {
      this.state = STATES.PLAYING;
      this.roundStartTimer = 0;
    }
    if (this.state !== STATES.PLAYING || !this.cannon.alive) return;

    const tier = this.cannon.weaponTier;
    const cx = this.cannon.x;
    const cy = this.cannon.y;
    const cw = this.cannon.width;

    if (tier === 0) {
      // 1. Standard Single Center Laser
      this.totalShots++;
      this.playerBullets.push(new Bullet(cx + cw / 2, cy - 8, -560, 0, '#22c55e', '#4ade80'));
    } else if (tier === 1) {
      // 2. Dual Parallel Lasers
      this.totalShots += 2;
      this.playerBullets.push(new Bullet(cx + 8, cy - 8, -560, 0, '#38bdf8', '#0ea5e9'));
      this.playerBullets.push(new Bullet(cx + cw - 8, cy - 8, -560, 0, '#38bdf8', '#0ea5e9'));
    } else if (tier === 2) {
      // 3. "V" Shaped Spread Guns (2 lines spreading out at angles)
      this.totalShots += 2;
      this.playerBullets.push(new Bullet(cx + 10, cy - 8, -540, -125, '#f59e0b', '#fcd34d'));
      this.playerBullets.push(new Bullet(cx + cw - 10, cy - 8, -540, 125, '#f59e0b', '#fcd34d'));
    } else if (tier === 3) {
      // 4. Triple Guns: "V" shape + Straight Center (3 lines of firing)
      this.totalShots += 3;
      this.playerBullets.push(new Bullet(cx + cw / 2, cy - 10, -560, 0, '#ec4899', '#f472b6'));
      this.playerBullets.push(new Bullet(cx + 8, cy - 8, -540, -140, '#ec4899', '#f472b6'));
      this.playerBullets.push(new Bullet(cx + cw - 8, cy - 8, -540, 140, '#ec4899', '#f472b6'));
    } else {
      // 5. Tier 4: Single large bullet that explodes halfway up the level (y = 300)
      // "the user can only fire a second one after the first has exploded"
      if (this.activeMegaBullet && !this.activeMegaBullet.exploded) {
        return;
      }
      this.totalShots++;
      const mega = new MegaBullet(cx + cw / 2, cy - 14, -460, 300);
      this.activeMegaBullet = mega;
      this.playerBullets.push(mega);
    }

    sound.laser(tier);
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
      life: 0.95
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
    this.powerUpPods = [];
    this.shieldItems = [];
    this.shieldItemSpawned = false;
    this.shieldItemTimer = 3.5;
    this.explosions = [];
    this.activeMegaBullet = null;
    this.mysteryShip = new MysteryShip(this.width);
    this.cannon.reset();
    this.initBunkers();

    // Replenish 1 shield per level (capped at 3)
    this.shields = Math.min(3, Math.max(1, this.shields + 1));

    this.state = STATES.ROUND_START;
    this.roundStartTimer = 2.5;

    if (this.options.onWave) this.options.onWave(this.wave);
    if (this.options.onShield) this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
    if (this.options.onInvaders) {
      this.options.onInvaders(this.fleet.getAliveCount(), this.fleet.totalInvaders);
    }
  }

  spawnShieldItem(x = null, y = 50, duration = 5.0) {
    const spawnX = x !== null ? x : 120 + Math.random() * (this.width - 240);
    const item = new ShieldItem(spawnX, y, duration);
    this.shieldItems.push(item);
    this.shieldItemSpawned = true;
    return item;
  }

  handlePlayerDeath() {
    this.lives--;
    this.cannon.destroy();
    if (this.options.onLives) this.options.onLives(this.lives);
    if (this.options.onWeapon) this.options.onWeapon(WEAPON_TIERS[this.cannon.weaponTier]);
    if (this.options.onShield) this.options.onShield(this.shields, false, 0);

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
    // 1. Twinkling background stars
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

    // Check Invasion Failure
    if (this.fleet.getBounds().maxY >= 470) {
      this.handleGameOver('INVASION REACHED BASELINE!');
      return;
    }

    // Mystery UFO Mothership update
    this.mysteryShip.update(dt);

    // 4. Update Falling Power-Up Pods & Cannon Catching
    for (let i = this.powerUpPods.length - 1; i >= 0; i--) {
      const pod = this.powerUpPods[i];
      pod.update(dt);

      if (this.cannon.alive) {
        const c = this.cannon;
        // Generous catch hitbox matching cannon body
        if (
          pod.x >= c.x - 12 &&
          pod.x <= c.x + c.width + 12 &&
          pod.y >= c.y - 12 &&
          pod.y <= c.y + c.height + 12
        ) {
          pod.active = false;
          const res = this.cannon.upgradeWeapon();
          if (res.upgraded) {
            sound.powerUpCollect();
            if (res.tier === 5) {
              this.shields = Math.min(3, this.shields + 1);
              sound.shieldActivate();
              this.addFloatingScore('★ FORCE SHIELD ACTIVATED! ★', c.x + c.width / 2, c.y - 18, '#06b6d4');
              if (this.options.onShield) this.options.onShield(this.shields, true, 6.0);
            } else {
              this.addFloatingScore(`★ ${res.config.name} ★`, c.x + c.width / 2, c.y - 18, res.config.color);
            }
            if (this.options.onWeapon) this.options.onWeapon(res.config);
          } else {
            // Already at Max tier (Tier 5)
            this.score += 500;
            sound.powerUpCollect();
            if (res.shieldRefill) {
              this.shields = Math.min(3, this.shields + 1);
              sound.shieldActivate();
              this.addFloatingScore('★ SHIELD RECHARGED +500 ★', c.x + c.width / 2, c.y - 18, '#06b6d4');
              if (this.options.onShield) this.options.onShield(this.shields, true, 6.0);
            } else {
              this.addFloatingScore('★ MAX POWER +500 ★', c.x + c.width / 2, c.y - 18, '#ec4899');
            }
            if (this.options.onScore) this.options.onScore(this.score);
          }
        }
      }

      if (!pod.active) {
        this.powerUpPods.splice(i, 1);
      }
    }

    // 4b. Spawn & Update Collectible Shield Items (1 per level, provides 5s immunity)
    if (!this.shieldItemSpawned && this.state === STATES.PLAYING) {
      this.shieldItemTimer -= dt;
      if (this.shieldItemTimer <= 0) {
        this.spawnShieldItem();
      }
    }

    for (let i = this.shieldItems.length - 1; i >= 0; i--) {
      const item = this.shieldItems[i];
      item.update(dt);

      if (this.cannon.alive) {
        const c = this.cannon;
        if (
          item.x + item.width >= c.x - 12 &&
          item.x <= c.x + c.width + 12 &&
          item.y + item.height >= c.y - 12 &&
          item.y <= c.y + c.height + 12
        ) {
          item.active = false;
          item.collected = true;
          c.activateShield(item.duration || 5.0);
          sound.shieldActivate();
          this.score += 250;
          this.addFloatingScore('★ 5s FORCE SHIELD! ★', c.x + c.width / 2, c.y - 18, '#06b6d4');
          if (this.options.onScore) this.options.onScore(this.score);
          if (this.options.onShield) {
            this.options.onShield(this.shields, true, c.shieldTimer);
          }
        }
      }

      if (!item.active) {
        this.shieldItems.splice(i, 1);
      }
    }

    // 4c. Update Mega Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.update(dt);
      if (!exp.active) {
        this.explosions.splice(i, 1);
      }
    }

    // 5. Update Player Bullets & Collision Handling
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.update(dt);

      // Check Mega Bullet halfway detonation (explodes halfway up the level, y <= 300)
      if (b.isMega) {
        if (b.detonatePending || b.y <= b.detonateY) {
          b.explode(this);
          if (this.activeMegaBullet === b) this.activeMegaBullet = null;
          this.playerBullets.splice(i, 1);
          continue;
        }
      }

      let bulletConsumed = false;

      // A. Bullet vs Invaders
      for (const inv of this.fleet.invaders) {
        if (
          inv.alive &&
          b.x >= inv.x &&
          b.x <= inv.x + inv.width &&
          b.y >= inv.y &&
          b.y <= inv.y + inv.height
        ) {
          if (b.isMega) {
            b.explode(this);
            if (this.activeMegaBullet === b) this.activeMegaBullet = null;
            bulletConsumed = true;
            break;
          } else {
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
      }

      // B. Bullet vs Mystery UFO (Drops Power-Up Pod!)
      if (!bulletConsumed && this.mysteryShip.active) {
        const ufo = this.mysteryShip;
        if (
          b.x >= ufo.x &&
          b.x <= ufo.x + ufo.width &&
          b.y >= ufo.y &&
          b.y <= ufo.y + ufo.height
        ) {
          if (b.isMega) {
            b.explode(this);
            if (this.activeMegaBullet === b) this.activeMegaBullet = null;
            bulletConsumed = true;
          } else {
            const { points, pod } = ufo.onHit();
            this.totalHits++;
            this.score += points;
            this.addFloatingScore(`★ +${points} ★`, ufo.x + ufo.width / 2, ufo.y - 10, '#ec4899');
            if (this.options.onScore) this.options.onScore(this.score);

            // Add the dropped power-up pod into the active game world
            if (pod) {
              this.powerUpPods.push(pod);
            }

            bulletConsumed = true;
          }
        }
      }

      // C. Bullet vs Bunkers (Shields)
      if (!bulletConsumed) {
        for (const bk of this.bunkers) {
          if (bk.checkHit(b.x, b.y, b.isMega ? 14 : 6)) {
            sound.bunkerHit();
            if (b.isMega) {
              b.explode(this);
              if (this.activeMegaBullet === b) this.activeMegaBullet = null;
            }
            bulletConsumed = true;
            break;
          }
        }
      }

      if (bulletConsumed || !b.active) {
        if (b.isMega && this.activeMegaBullet === b) {
          this.activeMegaBullet = null;
        }
        this.playerBullets.splice(i, 1);
      }
    }

    // 6. Update Alien Bombs & Collision Handling
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
        if (c.shieldActive) {
          const scx = c.x + c.width / 2;
          const scy = c.y + c.height / 2;
          if (Math.hypot(bomb.x - scx, bomb.y - scy) <= 36) {
            bombConsumed = true;
            sound.shieldDeflect();
            c.deflectImpact(bomb.x, bomb.y);
            this.addFloatingScore('DEFLECTED!', bomb.x, bomb.y - 10, '#06b6d4');
          }
        } else if (
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

    // 7. Update Floating Scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const f = this.floatingScores[i];
      f.y += f.vy * dt;
      f.life -= dt;
      f.alpha = Math.max(0, f.life / 0.95);
      if (f.life <= 0) this.floatingScores.splice(i, 1);
    }

    // 8. Stream active shield state to HUD
    if (this.cannon.alive && this.options.onShield) {
      this.options.onShield(this.shields, this.cannon.shieldActive, this.cannon.shieldTimer);
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

    // 3. Render Falling Power-Up Pods
    for (const pod of this.powerUpPods) {
      pod.render(ctx);
    }

    // 3b. Render Falling Shield Items
    for (const item of this.shieldItems) {
      item.render(ctx);
    }

    // 4. Render Invaders Hive
    this.fleet.render(ctx);

    // 5. Render Defense Bunkers
    for (const bk of this.bunkers) {
      bk.render(ctx);
    }

    // 6. Render Player Bullets
    for (const b of this.playerBullets) {
      b.render(ctx);
    }

    // 7. Render Alien Bombs
    for (const bomb of this.alienBombs) {
      bomb.render(ctx);
    }

    // 8. Render Laser Cannon
    this.cannon.render(ctx);

    // 8b. Render Mega Shockwave Explosions
    for (const exp of this.explosions) {
      exp.render(ctx);
    }

    // 9. Floating Score & Upgrade Text
    for (const f of this.floatingScores) {
      ctx.save();
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = f.alpha;
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // 10. Intermission overlays
    if (this.state === STATES.ROUND_START) {
      ctx.fillStyle = 'rgba(6, 9, 19, 0.45)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 20px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`★ WAVE ${this.wave} ★`, this.width / 2, this.height / 2 - 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText('PRESS SPACE TO DEFEND', this.width / 2, this.height / 2 + 20);
    } else if (this.state === STATES.PAUSED) {
      ctx.fillStyle = 'rgba(6, 9, 19, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    }

    ctx.restore();
  }
}
