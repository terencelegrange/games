/**
 * Galactic Shooter - Core Game Engine
 */

import {
  Starfield,
  Fighter,
  Laser,
  AlienBomb,
  Enemy,
  ExplosionParticle,
  generateEntryPath,
  generateDivePath
} from './entities.js';
import { audio } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

export class GalacticShooterGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 480;
    this.height = 640;

    this.starfield = new Starfield(this.width, this.height);
    this.fighter = new Fighter(240, 580);
    this.lasers = [];
    this.alienBombs = [];
    this.enemies = [];
    this.particles = [];
    this.rescuedFighters = []; // liberated ships docking with player

    this.state = 'TITLE'; // 'STAGE_START', 'ENTRY_WAVE', 'BATTLE', 'CHALLENGING_STAGE', 'STAGE_CLEAR', 'GAME_OVER'
    this.stage = 1;
    this.score = 0;
    this.highScore = getLocalHighScore();
    this.lives = 3;
    this.shotsFired = 0;
    this.hits = 0;
    this.gameTimeSeconds = 0;
    this.stateTimer = 0;

    // Formation animation
    this.formationOffset = { x: 0, y: 0 };
    this.formationDirection = 1;

    // Dive & Attack Timers
    this.diveCooldown = 0;
    this.entryWaveIndex = 0;
    this.entrySubWaveTimer = 0;
    this.challengingWaveTimer = 0;
    this.challengingHits = 0;

    // Input state
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
      this.state = 'STAGE_START';
      this.challengingHits = 0;
      this.challengingWaveTimer = 0;
      audio.playChallengingStage();
    } else {
      this.state = 'STAGE_START';
      audio.playStageStart();
    }
  }

  isChallengingStage(stg = this.stage) {
    return stg % 3 === 0;
  }

  buildFormationEnemies() {
    const enemies = [];
    // 40 Enemies total:
    // Row 0: 4 Boss Galagas
    const bossCols = [3, 4, 5, 6];
    for (let i = 0; i < 4; i++) {
      const col = bossCols[i];
      const targetX = 100 + col * 36;
      const targetY = 90;
      enemies.push(new Enemy('boss', col, 0, targetX, targetY));
    }

    // Rows 1 & 2: 8 Red Butterflies each (16 total)
    for (let r = 1; r <= 2; r++) {
      for (let c = 1; c <= 8; c++) {
        const targetX = 64 + c * 36;
        const targetY = 90 + r * 28;
        enemies.push(new Enemy('butterfly', c, r, targetX, targetY));
      }
    }

    // Rows 3 & 4: 10 Blue Bees each (20 total)
    for (let r = 3; r <= 4; r++) {
      for (let c = 0; c <= 9; c++) {
        const targetX = 46 + c * 36;
        const targetY = 90 + r * 28;
        enemies.push(new Enemy('bee', c, r, targetX, targetY));
      }
    }

    return enemies;
  }

  startEntryWaves() {
    this.enemies = this.buildFormationEnemies();
    // Divide 40 enemies into 5 entry waves of 8
    this.entryWaveIndex = 0;
    this.entrySubWaveTimer = 0;
    this.state = 'ENTRY_WAVE';
    this.dispatchEntryWave(0);
  }

  dispatchEntryWave(waveIdx) {
    const waveSize = 8;
    const startIdx = waveIdx * waveSize;
    const side = waveIdx % 2 === 0 ? 'left' : 'right';
    const type = waveIdx < 2 ? 'top' : 'bottom';

    for (let i = 0; i < waveSize; i++) {
      const enemy = this.enemies[startIdx + i];
      if (enemy) {
        enemy.state = 'entry';
        const path = generateEntryPath(type, side, enemy.targetX, enemy.targetY);
        enemy.setPath(path);
      }
    }
  }

  triggerDiveAttack() {
    const eligible = this.enemies.filter(e => e.active && e.state === 'formation');
    if (eligible.length === 0) return;

    // Chance to dispatch a 3-alien convoy: 1 Boss + 2 Escort Butterflies
    const bosses = eligible.filter(e => e.type === 'boss');
    if (bosses.length > 0 && Math.random() < 0.35) {
      const boss = bosses[Math.floor(Math.random() * bosses.length)];
      boss.state = 'diving';
      const dir = boss.x < 240 ? 1 : -1;
      boss.setPath(generateDivePath(boss.x, boss.y, this.fighter.x, 660, dir));
      audio.playAlienDive();

      // Find nearby butterflies to escort
      const escorts = eligible.filter(e => e.type === 'butterfly').slice(0, 2);
      escorts.forEach((esc, idx) => {
        esc.state = 'diving';
        const offset = (idx === 0 ? -30 : 30);
        esc.setPath(generateDivePath(esc.x, esc.y, this.fighter.x + offset, 660, dir));
      });
      return;
    }

    // Otherwise standard single or pair dive
    const count = Math.min(eligible.length, Math.random() < 0.6 ? 1 : 2);
    for (let i = 0; i < count; i++) {
      const enemy = eligible[Math.floor(Math.random() * eligible.length)];
      if (enemy) {
        enemy.state = 'diving';
        const dir = enemy.x < 240 ? 1 : -1;
        enemy.setPath(generateDivePath(enemy.x, enemy.y, this.fighter.x, 660, dir));
        audio.playAlienDive();
      }
    }
  }

  handlePlayerFire() {
    if (this.fighter.isCapturing || !this.fighter.active || this.state === 'GAME_OVER') return;

    this.shotsFired++;
    if (this.fighter.isDual) {
      // Dual Fighter: 2 simultaneous dual-laser streams
      this.lasers.push(new Laser(this.fighter.x - 14, this.fighter.y - 14, -10, true));
      this.lasers.push(new Laser(this.fighter.x + 14, this.fighter.y - 14, -10, true));
      audio.playLaser(true);
    } else {
      // Single Fighter
      this.lasers.push(new Laser(this.fighter.x, this.fighter.y - 14, -9.5, false));
      audio.playLaser(false);
    }
  }

  spawnExplosion(x, y, color = '#facc15', count = 16) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new ExplosionParticle(x, y, color));
    }
  }

  update() {
    if (this.isPaused) return;

    this.starfield.update();
    this.gameTimeSeconds += 1 / 60;

    // Formation Breathing Oscillation
    this.formationOffset.x += 0.4 * this.formationDirection;
    if (Math.abs(this.formationOffset.x) > 24) {
      this.formationDirection *= -1;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // State Machine Transitions
    switch (this.state) {
      case 'STAGE_START':
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (this.isChallengingStage()) {
            this.state = 'CHALLENGING_STAGE';
            this.challengingWaveTimer = 0;
          } else {
            this.startEntryWaves();
          }
        }
        break;

      case 'ENTRY_WAVE':
        this.updateEntryWaves();
        break;

      case 'BATTLE':
        this.updateBattle();
        break;

      case 'CHALLENGING_STAGE':
        this.updateChallengingStage();
        break;

      case 'STAGE_CLEAR':
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.initStage(this.stage + 1);
        }
        break;

      case 'GAME_OVER':
        // Wait on game over
        break;
    }

    // Player controls & bounds
    if (this.fighter.active && !this.fighter.isCapturing) {
      if (this.keys.left) this.fighter.x -= this.fighter.speed;
      if (this.keys.right) this.fighter.x += this.fighter.speed;
    }
    this.fighter.update({ minX: 20, maxX: 460 });

    // Handle single-press / held key firing
    if (this.keys.fire) {
      if (!this.fireLatched) {
        this.handlePlayerFire();
        this.fireLatched = true;
      }
    } else {
      this.fireLatched = false;
    }

    // Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.update();
      if (!l.active) {
        this.lasers.splice(i, 1);
      }
    }

    // Update Alien Bombs
    for (let i = this.alienBombs.length - 1; i >= 0; i--) {
      const b = this.alienBombs[i];
      b.update();
      if (!b.active) {
        this.alienBombs.splice(i, 1);
      }
    }

    // Update Rescued Docking Ships
    for (let i = this.rescuedFighters.length - 1; i >= 0; i--) {
      const rf = this.rescuedFighters[i];
      rf.y += (this.fighter.y - rf.y) * 0.08;
      rf.x += (this.fighter.x - rf.x) * 0.08;
      rf.rotation = (rf.rotation || 0) + 0.1;

      if (Math.hypot(rf.x - this.fighter.x, rf.y - this.fighter.y) < 12) {
        // Successful Dock! Activate Dual Fighter
        this.fighter.isDual = true;
        this.rescuedFighters.splice(i, 1);
        audio.playRescueDock();
        this.spawnExplosion(this.fighter.x, this.fighter.y, '#4ade80', 24);
      }
    }

    // Check collisions
    this.checkCollisions();
  }

  updateEntryWaves() {
    this.entrySubWaveTimer++;
    if (this.entrySubWaveTimer > 100 && this.entryWaveIndex < 4) {
      this.entryWaveIndex++;
      this.entrySubWaveTimer = 0;
      this.dispatchEntryWave(this.entryWaveIndex);
    }

    // Update all active entry enemies
    let anyInEntry = false;
    for (const enemy of this.enemies) {
      if (enemy.active) {
        enemy.update(this.formationOffset);
        if (enemy.state === 'entry') anyInEntry = true;
      }
    }

    // Once all 5 waves entered formation, switch to Battle
    if (this.entryWaveIndex >= 4 && !anyInEntry) {
      this.state = 'BATTLE';
      this.diveCooldown = 60;
    }
  }

  updateBattle() {
    // Enemy dive bomb dispatcher
    this.diveCooldown--;
    if (this.diveCooldown <= 0) {
      this.triggerDiveAttack();
      this.diveCooldown = Math.max(45, 140 - this.stage * 10);
    }

    // Update and alien bomb dropping
    let activeCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.active) {
        activeCount++;
        enemy.update(this.formationOffset);

        // Enemies in diving state drop bombs occasionally
        if (enemy.state === 'diving' && Math.random() < 0.015 && this.alienBombs.length < 8) {
          const vx = (this.fighter.x - enemy.x) * 0.012;
          this.alienBombs.push(new AlienBomb(enemy.x, enemy.y + 10, vx, 3.8));
        }

        // Check Tractor Beam capture
        if (enemy.type === 'boss' && enemy.state === 'tractor' && enemy.tractorBeam) {
          if (!this.fighter.isCapturing && !this.fighter.isCaptured && enemy.tractorBeam.contains(this.fighter)) {
            // Captured!
            this.fighter.isCapturing = true;
            this.fighter.capturedBoss = enemy;
            this.fighter.captureProgress = 0;
            audio.playCapture();
            this.handlePlayerCaptured();
          }
        }
      }
    }

    // Check Stage Clear
    if (activeCount === 0) {
      this.state = 'STAGE_CLEAR';
      this.stateTimer = 90;
      this.score += 1000 + this.stage * 200;
      this.saveHighScore();
    }
  }

  updateChallengingStage() {
    this.challengingWaveTimer++;
    // Spawn 5 waves of 8 acrobatic targets across 600 ticks
    if (this.challengingWaveTimer % 90 === 0 && this.enemies.length < 40) {
      const waveNum = Math.floor(this.challengingWaveTimer / 90);
      const side = waveNum % 2 === 0 ? 'left' : 'right';
      for (let i = 0; i < 8; i++) {
        const e = new Enemy(waveNum % 2 === 0 ? 'butterfly' : 'bee', i, 0, 0, 0);
        e.state = 'diving';
        const startX = side === 'left' ? -30 - i * 20 : 510 + i * 20;
        const p0 = { x: startX, y: 120 + i * 10 };
        const p1 = { x: 240, y: 320 };
        const p2 = { x: side === 'left' ? 380 : 100, y: 460 };
        const p3 = { x: side === 'left' ? 520 : -40, y: 640 };
        const pts = [];
        for (let s = 0; s <= 70; s++) {
          const t = s / 70;
          const u = 1 - t;
          pts.push({
            x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
            y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y
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

    if (this.challengingWaveTimer > 550 && this.enemies.every(e => !e.active)) {
      this.state = 'STAGE_CLEAR';
      this.stateTimer = 120;
      // Bonus evaluation
      let bonus = this.challengingHits * 100;
      if (this.challengingHits >= 40) {
        bonus = 10000; // Perfect bonus!
      }
      this.score += bonus;
      this.saveHighScore();
    }
  }

  handlePlayerCaptured() {
    // If player is in Dual Fighter mode, only 1 ship is captured and 1 remains active
    if (this.fighter.isDual) {
      this.fighter.isDual = false;
      this.fighter.isCapturing = false;
      this.fighter.invulnerableTimer = 120;
      return;
    }

    // Otherwise, single fighter is lost
    setTimeout(() => {
      this.lives--;
      if (this.lives <= 0) {
        this.state = 'GAME_OVER';
        this.saveHighScore();
        submitMatchRecord({
          score: this.score,
          level: this.stage,
          durationSeconds: Math.floor(this.gameTimeSeconds),
          hits: this.hits,
          shotsFired: this.shotsFired
        });
      } else {
        // Respawn new fighter at bottom
        this.fighter = new Fighter(240, 580);
        this.fighter.invulnerableTimer = 180;
      }
    }, 1200);
  }

  handlePlayerHit() {
    if (this.fighter.invulnerableTimer > 0 || this.fighter.isCapturing || !this.fighter.active) return;

    audio.playExplosion('player');
    this.spawnExplosion(this.fighter.x, this.fighter.y, '#ef4444', 32);

    if (this.fighter.isDual) {
      // Degrade from Dual to Single Fighter
      this.fighter.isDual = false;
      this.fighter.invulnerableTimer = 120;
      return;
    }

    this.lives--;
    this.fighter.active = false;

    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
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
      }, 1000);
    }
  }

  checkCollisions() {
    // 1. Lasers vs. Enemies
    for (let li = this.lasers.length - 1; li >= 0; li--) {
      const laser = this.lasers[li];
      if (!laser.active) continue;

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        const eb = enemy.getHitbox();

        if (
          laser.x >= eb.x &&
          laser.x <= eb.x + eb.width &&
          laser.y >= eb.y &&
          laser.y <= eb.y + eb.height
        ) {
          laser.active = false;
          this.hits++;
          enemy.hp--;

          if (this.isChallengingStage()) {
            this.challengingHits++;
          }

          if (enemy.hp <= 0) {
            enemy.active = false;
            if (enemy.tractorBeam) enemy.tractorBeam.stop();

            const pts = enemy.state === 'formation' ? enemy.points : enemy.flightPoints;
            this.score += pts;
            this.saveHighScore();

            const isBoss = enemy.type === 'boss';
            audio.playExplosion(isBoss ? 'boss' : 'normal');
            this.spawnExplosion(enemy.x, enemy.y, isBoss ? '#38bdf8' : '#ef4444', isBoss ? 28 : 16);

            // If this Boss was holding a captured ship, rescue it!
            if (enemy.holdingShip) {
              if (enemy.state === 'diving' || enemy.state === 'tractor') {
                // Liberate ship to dock with player!
                this.rescuedFighters.push({
                  x: enemy.x,
                  y: enemy.y - 20,
                  rotation: 0
                });
              } else {
                // Destroyed in formation: captured ship is also destroyed
                this.spawnExplosion(enemy.x, enemy.y - 20, '#ef4444', 20);
              }
            }
          } else {
            // Damaged Boss (1 hit remaining)
            this.score += 50;
            this.spawnExplosion(enemy.x, enemy.y, '#38bdf8', 8);
          }
          break;
        }
      }
    }

    // 2. Alien Bombs vs. Player
    if (this.fighter.active && this.fighter.invulnerableTimer <= 0) {
      const ph = this.fighter.getHitbox();
      for (const bomb of this.alienBombs) {
        if (!bomb.active) continue;
        if (
          bomb.x >= ph.x &&
          bomb.x <= ph.x + ph.width &&
          bomb.y >= ph.y &&
          bomb.y <= ph.y + ph.height
        ) {
          bomb.active = false;
          this.handlePlayerHit();
          break;
        }
      }
    }

    // 3. Enemy Body vs. Player
    if (this.fighter.active && this.fighter.invulnerableTimer <= 0) {
      const ph = this.fighter.getHitbox();
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.state === 'formation') continue;
        const eb = enemy.getHitbox();

        if (
          ph.x < eb.x + eb.width &&
          ph.x + ph.width > eb.x &&
          ph.y < eb.y + eb.height &&
          ph.y + ph.height > eb.y
        ) {
          enemy.active = false;
          this.spawnExplosion(enemy.x, enemy.y, '#ef4444', 20);
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

    // Deep space starfield
    this.starfield.render(ctx);

    // Render Enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }

    // Render Rescued Docking Ships
    for (const rf of this.rescuedFighters) {
      ctx.save();
      ctx.translate(rf.x, rf.y);
      ctx.rotate(rf.rotation || 0);
      this.fighter.drawSingleShip(ctx, 0, 0, '#4ade80', '#ef4444', '#38bdf8');
      ctx.restore();
    }

    // Render Lasers
    for (const laser of this.lasers) {
      laser.render(ctx);
    }

    // Render Alien Bombs
    for (const bomb of this.alienBombs) {
      bomb.render(ctx);
    }

    // Render Particles
    for (const p of this.particles) {
      p.render(ctx);
    }

    // Render Player
    this.fighter.render(ctx);

    // Render Stage / Banner Overlays on canvas
    if (this.state === 'STAGE_START') {
      ctx.save();
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 8;
      const text = this.isChallengingStage() ? 'CHALLENGING STAGE' : `STAGE ${this.stage}`;
      ctx.fillText(text, this.width / 2, this.height / 2);
      ctx.restore();
    }

    if (this.state === 'STAGE_CLEAR' && this.isChallengingStage()) {
      ctx.save();
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(`NUMBER OF HITS: ${this.challengingHits}`, this.width / 2, this.height / 2 - 20);
      const bonus = this.challengingHits >= 40 ? 'PERFECT! 10000 PTS' : `BONUS: ${this.challengingHits * 100} PTS`;
      ctx.fillStyle = '#ffd700';
      ctx.fillText(bonus, this.width / 2, this.height / 2 + 15);
      ctx.restore();
    }
  }
}
