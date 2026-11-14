/**
 * Goodies and Baddies Main Game Engine & Controller
 * Manages Stage 1 state machine, camera tracking, enemy waves, Arthur life cycles,
 * projectile ballistics, collision resolutions, item drops, and Games Vault submissions.
 */

import { Arthur } from './arthur.js';
import { Enemy } from './enemies.js';
import { Level1 } from './level.js';
import { Projectile, ItemDrop, WEAPON_TYPES } from './weapons.js';
import { checkAABB, checkCircleAABB, checkCircleCircle } from './physics.js';
import { Storage } from './storage.js';
import { sound } from './audio.js';

export class GhostsGame {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.options = options;

    // Game state: 'TITLE', 'STAGE_START', 'PLAYING', 'STAGE_CLEAR', 'GAME_OVER', 'PAUSED'
    this.state = 'TITLE';
    this.previousState = 'TITLE';

    this.score = 0;
    this.highScore = Storage.getHighScore();
    this.timeRemaining = 150.0;

    // Camera viewport offset
    this.cameraX = 0;

    // Checkpoint coordinates
    this.checkpointX = 100;
    this.checkpointY = 366;

    // Emitters & entities
    this.level = new Level1();
    this.arthur = new Arthur(this.checkpointX, this.checkpointY);
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.enemies = [];
    this.itemDrops = [];
    this.particles = [];

    // Screen Shake FX
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    // Spawners & timers
    this.zombieSpawnTimer = 2.0;
    this.stageStartTimer = 0;
    this.stageClearTimer = 0;
    this.gameOverTimer = 0;

    // Controls input state
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      fire: false
    };

    this.sound = sound;
    this.initEnemies();
  }

  // Populate fixed stage entities
  initEnemies() {
    this.enemies = [
      // Sector 1: Graveyard Bats & Fearsome Red Arremer
      new Enemy({ x: 620, y: 220, type: 'bat', facingRight: false }),
      new Enemy({ x: 1240, y: 210, type: 'bat', facingRight: false }),
      new Enemy({ x: 1540, y: 250, type: 'red_arremer', facingRight: false }),

      // Sector 2: Forest of Despair Spitters & Bats
      new Enemy({ x: 1950, y: 210, type: 'bat', facingRight: true }),
      new Enemy({ x: 2200, y: 366, type: 'plant', facingRight: false }),
      new Enemy({ x: 2450, y: 366, type: 'plant', facingRight: false }),

      // Sector 4: Level 1 Boss: The Cyclops guarding castle gate
      new Enemy({ x: 3340, y: 372, type: 'boss_cyclops', facingRight: false })
    ];
  }

  startNewGame() {
    this.score = 0;
    this.timeRemaining = 150.0;
    this.checkpointX = 100;
    this.checkpointY = 366;

    this.level = new Level1();
    this.arthur = new Arthur(this.checkpointX, this.checkpointY);
    this.arthur.lives = 3;
    this.arthur.armorLevel = 2;
    this.arthur.weaponType = 'lance';

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.itemDrops = [];
    this.particles = [];
    this.cameraX = 0;

    this.initEnemies();

    this.state = 'STAGE_START';
    this.stageStartTimer = 2.0;
    this.sound.stopBGM();
    if (this.options.onHudUpdate) {
      this.options.onHudUpdate(this.getHudData());
    }
  }

  respawnArthur() {
    this.arthur.resetToCheckpoint(this.checkpointX, this.checkpointY);
    this.projectiles = [];
    this.enemyProjectiles = [];

    // Clear immediate threatening zombies near spawn
    this.enemies = this.enemies.filter(e => {
      if (e.type === 'zombie' && Math.abs(e.x - this.checkpointX) < 350) {
        return false;
      }
      return true;
    });

    this.state = 'PLAYING';
    this.sound.playThemeBGM();
  }

  triggerShake(duration = 0.25, intensity = 4) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  spawnParticleBurst(x, y, count = 8, color = '#f8fafc', size = 3, speed = 120) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 40,
        color,
        size: size * (0.7 + Math.random() * 0.6),
        alpha: 1.0,
        life: 0.4 + Math.random() * 0.3
      });
    }
  }

  handleFire() {
    if (this.state !== 'PLAYING') return;

    // Immediately synchronize facing direction if grounded so quick turn-around shots work on frame 1
    if (this.arthur.grounded) {
      if (this.input.lastHorizontal === 'left' || (this.input.left && !this.input.right)) {
        this.arthur.facingRight = false;
      } else if (this.input.lastHorizontal === 'right' || (this.input.right && !this.input.left)) {
        this.arthur.facingRight = true;
      }
    }

    const proj = this.arthur.throwWeapon(this.projectiles);
    if (proj) {
      this.projectiles.push(proj);
      if (proj.type === 'dagger') {
        this.sound.throwDagger();
      } else if (proj.type === 'torch') {
        this.sound.throwTorch();
      } else {
        this.sound.throwLance();
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.previousState = 'PLAYING';
      this.state = 'PAUSED';
      this.sound.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = this.previousState;
      this.sound.playThemeBGM();
    }
  }

  getHudData() {
    return {
      score: this.score,
      highScore: this.highScore,
      lives: this.arthur.lives,
      armor: this.arthur.armorLevel,
      weapon: this.arthur.weaponType,
      weaponName: (WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE).name,
      weaponIcon: (WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE).icon,
      time: Math.ceil(this.timeRemaining),
      state: this.state
    };
  }

  update(dt) {
    // Screen shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    // Update floating particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // Particle gravity
      p.alpha = Math.max(0, p.life / 0.5);
    }

    // -----------------------------------------------------------
    // STATE: TITLE
    // -----------------------------------------------------------
    if (this.state === 'TITLE') {
      return;
    }

    // -----------------------------------------------------------
    // STATE: STAGE_START
    // -----------------------------------------------------------
    if (this.state === 'STAGE_START') {
      this.stageStartTimer -= dt;
      if (this.stageStartTimer <= 0) {
        this.state = 'PLAYING';
        this.sound.playThemeBGM();
      }
      return;
    }

    // -----------------------------------------------------------
    // STATE: PAUSED
    // -----------------------------------------------------------
    if (this.state === 'PAUSED') {
      return;
    }

    // -----------------------------------------------------------
    // STATE: STAGE_CLEAR
    // -----------------------------------------------------------
    if (this.state === 'STAGE_CLEAR') {
      this.stageClearTimer += dt;

      // Arthur victory walk into castle
      if (this.arthur.x < 3650) {
        this.arthur.x += 65 * dt;
        this.arthur.state = 'WALK';
        this.arthur.facingRight = true;
      }

      // Confetti / celebratory sparkle bursts
      if (Math.random() < 0.2) {
        const colors = ['#fef08a', '#38bdf8', '#4ade80', '#f472b6', '#fb923c'];
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.spawnParticleBurst(
          this.cameraX + Math.random() * this.width,
          80 + Math.random() * 200,
          6,
          col,
          4,
          100
        );
      }

      this.cameraX = Math.min(this.level.width - this.width, Math.max(0, this.arthur.x - 300));
      return;
    }

    // -----------------------------------------------------------
    // STATE: GAME_OVER
    // -----------------------------------------------------------
    if (this.state === 'GAME_OVER') {
      this.gameOverTimer += dt;
      return;
    }

    // -----------------------------------------------------------
    // STATE: PLAYING
    // -----------------------------------------------------------
    if (this.state === 'PLAYING') {
      // 1. Timer countdown
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0 && this.arthur.state !== 'DEAD') {
        // Out of time: Arthur instantly crumbles into skeleton
        this.arthur.armorLevel = 0;
        this.arthur.state = 'DEAD';
        this.arthur.deathTimer = 2.5;
        this.arthur.lives = Math.max(0, this.arthur.lives - 1);
        this.sound.playerDeath();
      }

      // 2. Arthur update
      this.arthur.update(dt, this.input, this.level.platforms, this.level.ladders);

      // Mid-stage checkpoint (after Red Arremer, before water hazard)
      if (this.arthur.x > 1750 && this.checkpointX < 1750) {
        this.checkpointX = 1750;
        this.checkpointY = 366;
      }

      // Water pit hazard death (Sector 2 water gaps: 2290 to 2410)
      if (this.arthur.y > 450 && this.arthur.state !== 'DEAD') {
        this.arthur.armorLevel = 0;
        this.arthur.state = 'DEAD';
        this.arthur.deathTimer = 2.5;
        this.arthur.lives = Math.max(0, this.arthur.lives - 1);
        this.triggerShake(0.3, 6);
        this.sound.playerDeath();
      }

      // Handle Arthur Death animation completion
      if (this.arthur.state === 'DEAD') {
        if (this.arthur.deathTimer <= 0) {
          if (this.arthur.lives > 0) {
            this.respawnArthur();
          } else {
            this.state = 'GAME_OVER';
            this.gameOverTimer = 0;
            this.sound.stopBGM();
            if (this.score > this.highScore) {
              this.highScore = this.score;
              Storage.setHighScore(this.highScore);
            }
            if (this.options.onGameOver) {
              this.options.onGameOver(this.score);
            }
          }
        }
      }

      // 3. Dynamic Zombie Spawners in Graveyard
      if (this.arthur.x < 2100) {
        this.zombieSpawnTimer -= dt;
        const activeZombies = this.enemies.filter(e => e.active && e.type === 'zombie').length;
        if (this.zombieSpawnTimer <= 0 && activeZombies < 4) {
          this.zombieSpawnTimer = 2.4 + Math.random() * 1.8;
          // Spawn ahead or behind Arthur
          const offset = (Math.random() < 0.65 ? 1 : -1) * (180 + Math.random() * 140);
          const spawnX = Math.max(60, Math.min(2080, this.arthur.x + offset));
          this.enemies.push(new Enemy({ x: spawnX, y: 368, type: 'zombie', facingRight: false }));
          this.sound.zombieEmerge();
        }
      }

      // 4. Update Level
      const lvlEvent = this.level.update(dt, this.arthur);
      if (lvlEvent === 'KEY_COLLECTED') {
        this.score += 2000;
        this.sound.keyPickup();
        this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 16, '#fef08a', 4, 160);
      }

      // Castle Entrance Clear Condition: Arthur walks through opened gate
      if (this.level.gateOpen && this.arthur.x > 3540) {
        this.state = 'STAGE_CLEAR';
        this.stageClearTimer = 0;
        const timeBonus = Math.ceil(this.timeRemaining) * 100;
        this.score += timeBonus;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          Storage.setHighScore(this.highScore);
        }
        this.sound.stageClearFanfare();
        if (this.options.onStageClear) {
          this.options.onStageClear(this.score, timeBonus);
        }
      }

      // 5. Update Arthur Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt, this.level.platforms, this.cameraX);

        // Torch ground ignition sound
        if (p.type === 'torch' && p.isIgnited && p.burnTimer > 1.4) {
          this.sound.torchIgnite();
        }

        if (!p.active) {
          this.projectiles.splice(i, 1);
          continue;
        }

        // Projectile vs Enemy collision
        let projRemoved = false;
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;

          let hit = false;
          if (p.isIgnited) {
            // Ground flame has wider hitbox
            hit = checkAABB(
              { x: p.x - 12, y: p.y - 12, width: 24, height: 16 },
              { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
            );
          } else {
            hit = checkCircleAABB(
              { x: p.x, y: p.y, radius: p.radius },
              { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
            );
          }

          if (hit) {
            const destroyed = enemy.takeDamage(p.damage);
            this.spawnParticleBurst(p.x, p.y, 6, '#f59e0b', 3, 90);

            if (enemy.type === 'boss_cyclops') {
              this.sound.bossHit();
              this.triggerShake(0.18, 5);
            }

            if (destroyed) {
              this.score += enemy.points;
              this.spawnParticleBurst(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                14,
                enemy.type === 'red_arremer' ? '#ef4444' : '#65a30d',
                4,
                140
              );

              if (enemy.type === 'boss_cyclops') {
                this.sound.bossDefeat();
                this.triggerShake(0.6, 8);
                // Boss drops the Golden Key!
                this.level.spawnKey(enemy.x + 16, enemy.y + 20);
              } else {
                this.sound.enemyKill();

                // 20% Item drop chance upon normal enemy defeat
                if (Math.random() < 0.22) {
                  const roll = Math.random();
                  if (roll < 0.35) {
                    this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: 'weapon', weaponType: 'dagger' }));
                  } else if (roll < 0.70) {
                    this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: 'weapon', weaponType: 'torch' }));
                  } else {
                    this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: 'armor' }));
                  }
                }
              }
            }

            // Dagger and Lance disappear on impact; Torch continues burning
            if (!p.isIgnited) {
              p.active = false;
              projRemoved = true;
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }

      // 6. Update Enemies & Enemy Projectiles
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        // Red Arremer sound trigger when startled
        if (enemy.type === 'red_arremer' && enemy.state === 'HOVER' && enemy.actionTimer > 0.9) {
          this.sound.redArremerScreech();
        }

        enemy.update(dt, this.arthur, this.level.platforms, this.enemyProjectiles, this.itemDrops);

        // Enemy touch collision with Arthur
        if (this.arthur.state !== 'DEAD' && this.arthur.invulnerableTimer <= 0) {
          const touch = checkAABB(
            { x: this.arthur.x + 4, y: this.arthur.y + 4, width: this.arthur.width - 8, height: this.arthur.height - 4 },
            { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
          );

          if (touch) {
            const hitResult = this.arthur.takeDamage();
            if (hitResult === 'ARMOR_LOST') {
              this.sound.armorLost();
              this.triggerShake(0.25, 6);
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 12, '#94a3b8', 4, 140);
            } else if (hitResult === 'KILLED') {
              this.sound.playerDeath();
              this.triggerShake(0.4, 8);
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 18, '#f8fafc', 4, 160);
            }
          }
        }
      }

      // 7. Update Enemy Projectiles (Spitter seeds, Boss fireballs)
      for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
        const ep = this.enemyProjectiles[i];
        ep.x += ep.vx * dt;
        ep.y += ep.vy * dt;

        // Cull out of bounds
        if (ep.x < this.cameraX - 100 || ep.x > this.cameraX + this.width + 100) {
          this.enemyProjectiles.splice(i, 1);
          continue;
        }

        // Enemy projectile hits Arthur
        if (this.arthur.state !== 'DEAD' && this.arthur.invulnerableTimer <= 0) {
          const hit = checkCircleAABB(
            { x: ep.x, y: ep.y, radius: ep.radius || 6 },
            { x: this.arthur.x + 4, y: this.arthur.y + 4, width: this.arthur.width - 8, height: this.arthur.height - 4 }
          );

          if (hit) {
            this.enemyProjectiles.splice(i, 1);
            const hitResult = this.arthur.takeDamage();
            if (hitResult === 'ARMOR_LOST') {
              this.sound.armorLost();
              this.triggerShake(0.25, 6);
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 12, '#94a3b8', 4, 140);
            } else if (hitResult === 'KILLED') {
              this.sound.playerDeath();
              this.triggerShake(0.4, 8);
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 18, '#f8fafc', 4, 160);
            }
          }
        }
      }

      // 8. Update Item Drops
      for (let i = this.itemDrops.length - 1; i >= 0; i--) {
        const item = this.itemDrops[i];
        item.update(dt, this.level.platforms);
        if (!item.active) {
          this.itemDrops.splice(i, 1);
          continue;
        }

        // Arthur collects Item Drop
        if (this.arthur.state !== 'DEAD') {
          const touch = checkAABB(
            { x: this.arthur.x, y: this.arthur.y, width: this.arthur.width, height: this.arthur.height },
            { x: item.x, y: item.y, width: item.width, height: item.height }
          );

          if (touch) {
            item.active = false;
            if (item.type === 'armor') {
              const restored = this.arthur.restoreArmor();
              this.score += 500;
              this.sound.itemPickup();
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 10, '#eab308', 3, 110);
            } else {
              this.arthur.weaponType = item.weaponType;
              this.score += 200;
              this.sound.itemPickup();
              this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 8, '#38bdf8', 3, 110);
            }
            this.itemDrops.splice(i, 1);
          }
        }
      }

      // 9. Camera horizontal smoothing following Arthur
      const targetCamX = this.arthur.x - 300;
      this.cameraX = Math.max(0, Math.min(this.level.width - this.width, targetCamX));

      // Notify HUD update
      if (this.options.onHudUpdate) {
        this.options.onHudUpdate(this.getHudData());
      }
    }
  }

  render() {
    this.ctx.save();

    // Screen Shake effect
    if (this.shakeTimer > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.ctx.translate(offsetX, offsetY);
    }

    // 1. Render Level Parallax Backdrop
    this.level.renderParallax(this.ctx, this.cameraX);

    // 2. Render Platforms, Ladders, Props, and Castle
    this.level.render(this.ctx, this.cameraX);

    // 3. Render Item Drops
    for (const item of this.itemDrops) {
      item.render(this.ctx, this.cameraX);
    }

    // 4. Render Active Enemies
    for (const enemy of this.enemies) {
      enemy.render(this.ctx, this.cameraX);
    }

    // 5. Render Enemy Projectiles
    this.ctx.save();
    for (const ep of this.enemyProjectiles) {
      const sx = Math.round(ep.x - this.cameraX);
      const sy = Math.round(ep.y);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, ep.radius || 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(sx - 1, sy - 1, (ep.radius || 6) * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 6. Render Arthur
    this.arthur.render(this.ctx, this.cameraX);

    // 7. Render Arthur Projectiles
    for (const p of this.projectiles) {
      p.render(this.ctx, this.cameraX);
    }

    // 8. Render Particles
    for (const p of this.particles) {
      const sx = Math.round(p.x - this.cameraX);
      const sy = Math.round(p.y);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1.0;

    this.ctx.restore();

    // 9. Render HUD overlay
    this.renderHUD();

    // 10. Render Fullscreen State Overlays
    if (this.state === 'TITLE') {
      this.renderTitleScreen();
    } else if (this.state === 'STAGE_START') {
      this.renderStageStartScreen();
    } else if (this.state === 'PAUSED') {
      this.renderPauseScreen();
    } else if (this.state === 'STAGE_CLEAR') {
      this.renderStageClearScreen();
    } else if (this.state === 'GAME_OVER') {
      this.renderGameOverScreen();
    }
  }

  renderHUD() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    this.ctx.fillRect(0, 0, this.width, 36);

    this.ctx.font = 'bold 12px "Courier New", monospace';
    this.ctx.textBaseline = 'middle';

    // 1UP SCORE
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillText('1UP', 18, 14);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(String(this.score).padStart(6, '0'), 50, 14);

    // HI SCORE
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillText('HIGH', 150, 14);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillText(String(Math.max(this.score, this.highScore)).padStart(6, '0'), 188, 14);

    // TIME
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillText('TIME', 320, 14);
    this.ctx.fillStyle = this.timeRemaining < 30 ? '#ef4444' : '#f8fafc';
    this.ctx.fillText(String(Math.ceil(this.timeRemaining)).padStart(3, '0'), 360, 14);

    // WEAPON
    const wDef = WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE;
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.fillText(`WEAPON: ${wDef.name} ${wDef.icon}`, 440, 14);

    // LIVES & ARMOR
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillText(`LIVES: ${this.arthur.lives}`, 660, 14);

    const armorIcon = this.arthur.armorLevel === 2 ? '🛡️ STEEL' : (this.arthur.armorLevel === 1 ? '🩳 BOXER' : '💀 CRUMBLED');
    this.ctx.fillStyle = this.arthur.armorLevel === 2 ? '#4ade80' : (this.arthur.armorLevel === 1 ? '#f59e0b' : '#ef4444');
    this.ctx.fillText(armorIcon, 730, 14);

    this.ctx.restore();
  }

  renderTitleScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(10, 10, 18, 0.82)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Gothic Title
    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.fillText("GOODIES AND BADDIES", this.width / 2, 140);

    ctxShadow(this.ctx, '#000', 8);
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText('STAGE 1: THE HAUNTED GRAVEYARD', this.width / 2, 185);

    // Blinking Press Start
    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = 'bold 18px "Courier New", monospace';
      this.ctx.fillText('PRESS SPACE OR CLICK TO START', this.width / 2, 260);
    }

    // Instructions
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '13px "Courier New", monospace';
    this.ctx.fillText('ARROWS / WASD : MOVE & CLIMB LADDERS | DOWN : CROUCH', this.width / 2, 330);
    this.ctx.fillText('SPACE / Z : JUMP (COMMITTED TRAJECTORY)', this.width / 2, 355);
    this.ctx.fillText('X / CTRL : THROW WEAPON | P : PAUSE | M : MUTE', this.width / 2, 380);

    this.ctx.fillStyle = '#64748b';
    this.ctx.font = '11px "Courier New", monospace';
    this.ctx.fillText('DEFEAT THE RED ARREMER & CYCLOPS TO CLAIM THE GOLDEN KEY', this.width / 2, 430);

    this.ctx.restore();
  }

  renderStageStartScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = 'bold 24px "Courier New", monospace';
    this.ctx.fillText('STAGE 1', this.width / 2, this.height / 2 - 25);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText('THE HAUNTED GRAVEYARD', this.width / 2, this.height / 2 + 15);

    this.ctx.restore();
  }

  renderPauseScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = 'bold 28px "Courier New", monospace';
    this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 15);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillText('PRESS P TO RESUME', this.width / 2, this.height / 2 + 25);

    this.ctx.restore();
  }

  renderStageClearScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = '#4ade80';
    this.ctx.font = 'bold 32px "Courier New", monospace';
    this.ctx.fillText('STAGE 1 CLEAR!', this.width / 2, 160);

    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 20px "Courier New", monospace';
    this.ctx.fillText(`TOTAL SCORE: ${this.score}`, this.width / 2, 220);

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText('THE CASTLE GATES HAVE OPENED!', this.width / 2, 270);

    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.fillText('PRESS SPACE TO PLAY AGAIN', this.width / 2, 340);
    }

    this.ctx.restore();
  }

  renderGameOverScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.fillText('GAME OVER', this.width / 2, 170);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = 'bold 18px "Courier New", monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, 230);

    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = 'bold 14px "Courier New", monospace';
      this.ctx.fillText('★ NEW HIGH SCORE! ★', this.width / 2, 265);
    }

    const blink = Math.floor(Date.now() / 450) % 2 === 0;
    if (blink) {
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.fillText('PRESS SPACE OR CLICK TO RETRY', this.width / 2, 330);
    }

    this.ctx.restore();
  }
}

function ctxShadow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
