/**
 * Monkey Jump Game Engine
 */

import { Girder, Ladder, Kong, Barrel, HammerItem, Penny, Jumpman, BonusItem, Fireball } from './entities.js';
import { sound } from './audio.js';

export class MonkeyJumpGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 480;
    this.height = canvas.height || 640;
    this.callbacks = callbacks;

    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.bonus = 5000;
    this.bonusTimer = 0;

    this.state = 'READY'; // READY, PLAYING, STAGE_CLEAR, DYING, GAME_OVER, PAUSED
    this.stateTimer = 0;

    this.girders = [];
    this.ladders = [];
    this.barrels = [];
    this.hammers = [];
    this.bonusItems = [];
    this.fireballs = [];
    this.floatingScores = [];

    this.kong = new Kong(70, 94);
    this.penny = new Penny(230, 56);
    this.jumpman = new Jumpman(40, 576);

    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false
    };

    this.barrelSpawnTimer = 0;
    this.barrelInterval = 3.2;

    this.buildStage();
  }

  buildStage() {
    this.girders = [
      // Tier 0: Ground
      new Girder(0, 600, 480, 600, 14),
      // Tier 1: Slopes up to right
      new Girder(0, 524, 440, 508, 12),
      // Tier 2: Slopes down to left
      new Girder(40, 418, 480, 434, 12),
      // Tier 3: Slopes up to right
      new Girder(0, 344, 440, 328, 12),
      // Tier 4: Slopes down to left
      new Girder(40, 240, 480, 256, 12),
      // Tier 5: Top tier
      new Girder(0, 168, 440, 152, 12),
      // Kong Platform
      new Girder(40, 148, 160, 148, 12),
      // Penny Platform
      new Girder(200, 80, 280, 80, 12)
    ];

    this.ladders = [
      // Tier 0 to 1
      new Ladder(380, 510, 600, false),
      new Ladder(200, 518, 600, true), // Broken

      // Tier 1 to 2
      new Ladder(100, 430, 522, false),
      new Ladder(280, 424, 514, false),

      // Tier 2 to 3
      new Ladder(380, 330, 420, false),
      new Ladder(200, 338, 428, true), // Broken

      // Tier 3 to 4
      new Ladder(100, 252, 342, false),
      new Ladder(280, 246, 334, false),

      // Tier 4 to 5
      new Ladder(380, 154, 242, false),

      // Tier 5 to Penny Platform
      new Ladder(230, 80, 162, false)
    ];

    this.hammers = [
      new HammerItem(110, 412),
      new HammerItem(380, 230)
    ];

    this.bonusItems = [
      new BonusItem('PARASOL', 320, 404),
      new BonusItem('HAT', 160, 226),
      new BonusItem('PURSE', 340, 138)
    ];
  }

  start() {
    this.state = 'PLAYING';
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.resetWave(false);
  }

  resetWave(keepScore = true) {
    if (!keepScore) {
      this.score = 0;
    }
    this.bonus = 5000;
    this.bonusTimer = 0;
    this.barrels = [];
    this.fireballs = [];
    this.floatingScores = [];

    // Recalibrate barrel spawn interval by level
    this.barrelInterval = Math.max(1.4, 3.4 - (this.level - 1) * 0.4);
    this.barrelSpawnTimer = 0.5; // Quick initial barrel

    this.jumpman = new Jumpman(40, 576);
    this.kong = new Kong(70, 94);
    this.penny = new Penny(230, 56);

    // Reset hammers and bonus items
    this.hammers.forEach(h => { h.active = true; });
    this.bonusItems.forEach(b => { b.active = true; });
    sound.stopHammerTheme();

    if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
    if (this.callbacks.onBonusUpdate) this.callbacks.onBonusUpdate(this.bonus);
    if (this.callbacks.onLevelUpdate) this.callbacks.onLevelUpdate(this.level);
  }

  spawnBarrel(x = 120, y = 148) {
    const speed = 2.2 + (this.level - 1) * 0.3;
    const b = new Barrel(x, y, speed);
    this.barrels.push(b);
    sound.barrelToss();
  }

  addFloatingScore(text, x, y, color = '#facc15') {
    this.floatingScores.push({
      text,
      x,
      y,
      color,
      timer: 0.8
    });
  }

  handleJump() {
    if (this.state === 'PLAYING') {
      if (this.jumpman.jump()) {
        sound.jump();
      }
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sound.stopHammerTheme();
      return true;
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.jumpman.state === 'HAMMER') {
        sound.startHammerTheme();
      }
      return false;
    }
    return false;
  }

  update(dt) {
    if (this.state === 'PAUSED' || this.state === 'READY') return;

    if (this.state === 'STAGE_CLEAR') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.level++;
        this.state = 'PLAYING';
        this.resetWave(true);
      }
      return;
    }

    if (this.state === 'DYING') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        if (this.lives <= 0) {
          this.state = 'GAME_OVER';
          if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver({ score: this.score, level: this.level });
          }
        } else {
          this.state = 'PLAYING';
          this.resetWave(true);
        }
      }
      return;
    }

    // Bonus Countdown (100 PTS every 1.8 seconds)
    this.bonusTimer += dt;
    if (this.bonusTimer > 1.8) {
      this.bonusTimer = 0;
      this.bonus = Math.max(0, this.bonus - 100);
      if (this.callbacks.onBonusUpdate) this.callbacks.onBonusUpdate(this.bonus);
    }

    // Kong update and barrel tossing
    this.kong.update(
      dt,
      () => sound.chestBeat(),
      (bx, by) => this.spawnBarrel(bx, by)
    );

    // Penny update
    this.penny.update(dt);

    // Jumpman update
    const prevX = this.jumpman.x;
    this.jumpman.update(dt, this.input, this.girders, this.ladders);
    if (Math.abs(this.jumpman.x - prevX) > 0.5 && this.jumpman.state === 'GROUNDED') {
      // Occasional rhythmic walk step audio
      if (Math.random() < 0.08) sound.step();
    }

    // Barrels update
    this.barrels.forEach(b => {
      b.update(this.girders, this.ladders);
      // Check barrel collision with oil drum at x=40, y=574 on Tier 0
      if (b.active && b.y > 570 && b.x <= 54) {
        b.active = false;
        sound.chestBeat();
        this.addFloatingScore('🔥 FLARE!', 44, 555, '#38bdf8');
        if (this.fireballs.length < 2 + this.level) {
          this.fireballs.push(new Fireball(50, 584));
        }
      }
    });
    this.barrels = this.barrels.filter(b => b.active);

    // Fireballs update
    this.fireballs.forEach(f => f.update(dt, this.girders, this.ladders, this.jumpman.x));
    this.fireballs = this.fireballs.filter(f => f.active);

    // Floating scores update
    this.floatingScores.forEach(fs => {
      fs.timer -= dt;
      fs.y -= 18 * dt;
    });
    this.floatingScores = this.floatingScores.filter(fs => fs.timer > 0);

    // Check Hammers pickup
    if (this.jumpman.state !== 'HAMMER') {
      for (const h of this.hammers) {
        if (h.active) {
          const dx = Math.abs((this.jumpman.x + this.jumpman.width / 2) - (h.x + h.width / 2));
          const dy = Math.abs((this.jumpman.y + this.jumpman.height / 2) - (h.y + h.height / 2));
          if (dx < 16 && dy < 18) {
            h.active = false;
            this.jumpman.startHammer(8.0);
            sound.startHammerTheme();
            this.addFloatingScore('HAMMER TIME!', h.x, h.y, '#f59e0b');
            break;
          }
        }
      }
    }

    // Check Pauline Bonus Items pickup
    const jCenter = { x: this.jumpman.x + this.jumpman.width / 2, y: this.jumpman.y + this.jumpman.height / 2 };
    for (const item of this.bonusItems) {
      if (item.active) {
        const dx = Math.abs(jCenter.x - (item.x + item.width / 2));
        const dy = Math.abs(jCenter.y - (item.y + item.height / 2));
        if (dx < 16 && dy < 18) {
          item.active = false;
          this.score += item.points;
          sound.itemChime();
          if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
          this.addFloatingScore(`+${item.points}`, item.x, item.y - 12, '#ec4899');
        }
      }
    }

    // Check Collisions
    this.checkCollisions();
  }

  checkCollisions() {
    const j = this.jumpman;
    const jCenter = { x: j.x + j.width / 2, y: j.y + j.height / 2 };

    // 1. Victory Check: Contact with Penny platform
    if (j.y <= 90 && Math.abs(j.x - 240) < 40) {
      this.state = 'STAGE_CLEAR';
      this.stateTimer = 2.4;
      sound.stageClear();
      const earnedBonus = this.bonus;
      this.score += earnedBonus;
      if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
      this.addFloatingScore(`+${earnedBonus} BONUS!`, 240, 70, '#fde047');
      if (this.callbacks.onStageClear) this.callbacks.onStageClear(this.level);
      return;
    }

    // 2. Hammer Attack vs. Barrels & Fireballs
    const hammerHitbox = j.getHammerHitbox();

    for (const b of this.barrels) {
      if (!b.active) continue;

      if (hammerHitbox) {
        // Check if hammer smashes barrel (radius-aware intersection)
        const hitX = (b.x + b.radius) >= hammerHitbox.x && (b.x - b.radius) <= (hammerHitbox.x + hammerHitbox.width);
        const hitY = (b.y + b.radius) >= hammerHitbox.y && (b.y - b.radius) <= (hammerHitbox.y + hammerHitbox.height);
        if (hitX && hitY) {
          b.active = false;
          sound.hammerSmash();
          this.score += 300;
          if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
          this.addFloatingScore('+300', b.x, b.y - 12, '#38bdf8');
          continue;
        }
      }

      // Check jumping over barrel (+100 PTS)
      if (
        !b.hoppedByPlayer &&
        j.state === 'JUMPING' &&
        Math.abs(jCenter.x - b.x) < 26 &&
        (j.y + j.height) < b.y + 6 &&
        (j.y + j.height) > b.y - 80
      ) {
        b.hoppedByPlayer = true;
        this.score += 100;
        sound.barrelHop();
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
        this.addFloatingScore('+100', b.x, b.y - 16, '#22c55e');
        continue;
      }

      // Check lethal collision with barrel (Jumpman loses a life)
      const dist = Math.hypot(jCenter.x - b.x, jCenter.y - b.y);
      if (dist < (b.radius + 8) && j.state !== 'HAMMER') {
        this.lives--;
        if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
        sound.death();
        this.state = 'DYING';
        this.stateTimer = 1.6;
        j.state = 'DEAD';
        break;
      }
    }

    // 3. Fireball Collision Checks
    for (const f of this.fireballs) {
      if (!f.active) continue;

      if (hammerHitbox) {
        const hitX = (f.x + 8) >= hammerHitbox.x && (f.x - 8) <= (hammerHitbox.x + hammerHitbox.width);
        const hitY = (f.y + 8) >= hammerHitbox.y && (f.y - 8) <= (hammerHitbox.y + hammerHitbox.height);
        if (hitX && hitY) {
          f.active = false;
          sound.hammerSmash();
          this.score += 300;
          if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
          this.addFloatingScore('+300', f.x, f.y - 12, '#38bdf8');
          continue;
        }
      }

      const dist = Math.hypot(jCenter.x - (f.x + 8), jCenter.y - (f.y + 8));
      if (dist < 16 && j.state !== 'HAMMER') {
        this.lives--;
        if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
        sound.death();
        this.state = 'DYING';
        this.stateTimer = 1.6;
        j.state = 'DEAD';
        break;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep dark retro backdrop
    ctx.fillStyle = '#06060c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Ladders
    this.ladders.forEach(l => l.render(ctx));

    // Render Girders
    this.girders.forEach(g => g.render(ctx));

    // Render Oil Drum on ground floor (sparks & flame)
    this.renderOilDrum(ctx, 40, 574);

    // Render Hammers
    this.hammers.forEach(h => h.render(ctx));

    // Render Pauline Bonus Items (Parasol, Hat, Purse)
    this.bonusItems.forEach(item => item.render(ctx));

    // Render Penny (Damsel)
    this.penny.render(ctx);

    // Render Kong
    this.kong.render(ctx);

    // Render Barrels
    this.barrels.forEach(b => b.render(ctx));

    // Render Fireballs
    this.fireballs.forEach(f => f.render(ctx));

    // Render Jumpman
    this.jumpman.render(ctx);

    // Render Floating Scores
    this.floatingScores.forEach(fs => {
      ctx.save();
      ctx.fillStyle = fs.color;
      ctx.font = 'bold 10px monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(fs.text, fs.x, fs.y);
      ctx.restore();
    });

    // Stage Clear / Heart Animation
    if (this.state === 'STAGE_CLEAR') {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('❤️ RESCUED! ❤️', this.width / 2, 220);
      ctx.restore();
    }
  }

  renderOilDrum(ctx, x, y) {
    ctx.save();
    // Metal oil drum cylinder
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, 22, 26);
    ctx.strokeRect(x, y, 22, 26);

    // "OIL" stencil
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('OIL', x + 5, y + 16);

    // Flickering flames on top
    const fHeight = 6 + Math.floor(Math.random() * 8);
    ctx.fillStyle = Math.random() < 0.5 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + 11, y - fHeight);
    ctx.lineTo(x + 20, y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
