import { BaseGame } from './baseGame.js';
import { DiggerMap, TILE_WIDTH, TILE_HEIGHT, LEVEL_MAPS } from './map.js';
import { DiggerPlayer } from './digger.js';
import { GoldBag, BAG_STATE } from './bag.js';
import { Monster, MONSTER_TYPE } from './monsters.js';
import { DiggerAudio } from './audio.js';
import { DiggerRenderer } from './renderer.js';
import { InputManager } from './input.js';

export class DiggerGame extends BaseGame {
  constructor(containerElement, options = {}) {
    super(containerElement, options);

    this.lives = 3;
    this.level = 1;
    this.score = 0;
    this.emeraldsInStreak = 0;
    this.floatingScores = [];

    this.gameState = 'READY'; // READY, PLAYING, DYING, LEVEL_CLEAR, GAME_OVER, PAUSED
    this.stateTimer = 110;

    // Bonus Cherry mode
    this.cherry = { active: false, col: 14, row: 0 };
    this.isBonusMode = false;
    this.bonusTimer = 0;
    this.bonusEatMultiplier = 1;

    // Monsters management
    this.monsters = [];
    this.monstersToSpawn = 5;
    this.spawnCooldown = 60;
    this.monstersKilled = 0;

    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.renderer = new DiggerRenderer(this.canvas);

    this.audio = new DiggerAudio();
    if (options.muted) {
      this.audio.setMuted(true);
    }

    this.input = new InputManager();
    this.input.attach(this.container);

    this.speedMultiplier = options.speedMultiplier !== undefined ? Number(options.speedMultiplier) : 0.50;
    this.timeAccumulator = 0;

    this.rafId = null;
    this.lastTime = 0;

    this.init();
  }

  setSpeedMultiplier(multiplier) {
    const val = Number(multiplier);
    if (!isNaN(val) && val > 0) {
      this.speedMultiplier = val;
    }
  }

  init() {
    this.map = new DiggerMap(this.level - 1);
    this.digger = new DiggerPlayer(this.map);

    this.bags = this.map.initialBagConfigs.map(b => new GoldBag(b.col, b.row));
    this.monsters = [];
    this.monstersToSpawn = 5 + (this.level - 1) * 2;
    this.monstersKilled = 0;
    this.spawnCooldown = 60;

    this.cherry = { active: false, col: 14, row: 0 };
    this.isBonusMode = false;
    this.bonusTimer = 0;

    this.bindInputs();
    this.audio.playPopcornBGM();
  }

  bindInputs() {
    this.input.onAction('DIR_UP', () => this.digger.setDirection('UP'));
    this.input.onAction('DIR_DOWN', () => this.digger.setDirection('DOWN'));
    this.input.onAction('DIR_LEFT', () => this.digger.setDirection('LEFT'));
    this.input.onAction('DIR_RIGHT', () => this.digger.setDirection('RIGHT'));

    // Fire weapon on space, F1, or direct action
    this.onFireWeapon = () => {
      if (this.gameState === 'PLAYING') {
        const shot = this.digger.fireWeapon();
        if (shot) {
          this.audio.playShot();
        }
      }
    };
  }

  start() {
    this.isPaused = false;
    this.loop = this.gameLoop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  setMuted(muted) {
    this.audio.setMuted(muted);
  }

  gameLoop(currentTime) {
    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = Math.min(currentTime - this.lastTime, 100);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.timeAccumulator += deltaTime * this.speedMultiplier;
      const step = 1000 / 60; // 60 updates/sec standard arcade rate
      while (this.timeAccumulator >= step - 0.001) {
        this.update();
        this.timeAccumulator = Math.max(0, this.timeAccumulator - step);
      }
    }
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  update() {
    // Floating scores cleanup
    this.floatingScores = this.floatingScores.filter(item => {
      item.timer--;
      return item.timer > 0;
    });

    if (this.gameState === 'READY') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.gameState = 'PLAYING';
        this.audio.playPopcornBGM();
      }
      return;
    }

    if (this.gameState === 'LEVEL_CLEAR') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.nextLevel();
      }
      return;
    }

    if (this.gameState === 'DYING') {
      this.digger.update([], null, null);
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        if (this.lives <= 0) {
          this.gameState = 'GAME_OVER';
          this.audio.stopBGM();
          this.onGameOverCallback(this.score);
        } else {
          this.resetPlayerAndMonsters();
          this.gameState = 'READY';
          this.stateTimer = 90;
        }
      }
      return;
    }

    if (this.gameState !== 'PLAYING') return;

    // Bonus Cherry mode timer
    if (this.isBonusMode) {
      this.bonusTimer--;
      if (this.bonusTimer <= 0) {
        this.isBonusMode = false;
        this.audio.playPopcornBGM();
      }
    }

    // Spawn monsters over time
    if (this.monstersToSpawn > 0 && this.monsters.filter(m => !m.isDead).length < 3) {
      this.spawnCooldown--;
      if (this.spawnCooldown <= 0) {
        const id = Date.now() + Math.random();
        this.monsters.push(new Monster(id, 14, 0, MONSTER_TYPE.NOBBIN));
        this.monstersToSpawn--;
        this.spawnCooldown = Math.max(90, 180 - this.level * 20);
      }
    }

    // Update Digger
    this.digger.update(
      this.bags,
      (col, row) => this.handleEmeraldCollected(col, row),
      (col, row) => this.handleDirtDug(col, row)
    );

    // Update Bags
    this.bags.forEach(bag => {
      bag.update(this.map, this.bags, (fallingBag) => {
        this.checkBagCrush(fallingBag);
      });

      // Check Digger collecting broken gold
      if (bag.state === BAG_STATE.OPEN_GOLD) {
        const dist = Math.hypot(this.digger.x - bag.x, this.digger.y - bag.y);
        if (dist < TILE_WIDTH * 0.75) {
          bag.state = BAG_STATE.COLLECTED;
          this.addScore(500);
          this.audio.playGold();
          this.addFloatingScore('+500', bag.x, bag.y, '#ffff55');
        }
      }
    });

    // Check Shot vs Monsters
    if (this.digger.shot) {
      for (const m of this.monsters) {
        if (!m.isDead) {
          const dist = Math.hypot(this.digger.shot.x - (m.x + TILE_WIDTH / 2), this.digger.shot.y - (m.y + TILE_HEIGHT / 2));
          if (dist < 18) {
            m.isDead = true;
            this.digger.shot = null;
            this.monstersKilled++;
            this.addScore(250);
            this.audio.playCrush();
            this.addFloatingScore('+250', m.x, m.y, '#00ffff');
            break;
          }
        }
      }
    }

    // Update Monsters & check player collision
    for (const m of this.monsters) {
      m.update(this.map, this.digger, this.bags, this.isBonusMode);

      if (!m.isDead) {
        const dist = Math.hypot(this.digger.x - m.x, this.digger.y - m.y);
        if (dist < TILE_WIDTH * 0.7) {
          if (this.isBonusMode) {
            // Eat monster!
            m.isDead = true;
            const points = 200 * this.bonusEatMultiplier;
            this.bonusEatMultiplier *= 2;
            this.addScore(points);
            this.audio.playCrush();
            this.addFloatingScore(`+${points}`, m.x, m.y, '#00ffff');
            this.monstersKilled++;
          } else {
            // Digger killed!
            this.killDigger();
            return;
          }
        }
      }
    }

    // Check Cherry Spawn & Collection
    const emeraldsCollected = this.map.totalEmeralds - this.map.emeraldsRemaining;
    if (!this.cherry.active && emeraldsCollected >= 14 && !this.cherry.spawned) {
      this.cherry.active = true;
      this.cherry.spawned = true;
    }

    if (this.cherry.active) {
      const cherryX = this.cherry.col * TILE_WIDTH;
      const cherryY = this.cherry.row * TILE_HEIGHT;
      if (Math.hypot(this.digger.x - cherryX, this.digger.y - cherryY) < TILE_WIDTH * 0.75) {
        this.cherry.active = false;
        this.isBonusMode = true;
        this.bonusTimer = 340; // ~5.5s
        this.bonusEatMultiplier = 1;
        this.addScore(1000);
        this.audio.playBonusBGM();
        this.addFloatingScore('+1000', cherryX, cherryY, '#ff0000');
      }
    }

    // Win condition: all emeralds cleared OR all level monsters defeated!
    if (this.map.emeraldsRemaining <= 0 || (this.monstersToSpawn <= 0 && this.monsters.every(m => m.isDead))) {
      this.gameState = 'LEVEL_CLEAR';
      this.stateTimer = 90;
      this.audio.stopBGM();
      if (typeof this.options.onLevelClear === 'function') {
        this.options.onLevelClear(this.level, this.score);
      }
    }
  }

  handleEmeraldCollected(col, row) {
    this.emeraldsInStreak++;
    let points = 25;

    // Bonus for 8 consecutive emeralds
    if (this.emeraldsInStreak % 8 === 0) {
      points = 250;
      this.addFloatingScore('+250 BONUS!', col * TILE_WIDTH, row * TILE_HEIGHT, '#55ff55');
    }

    this.addScore(points);
    this.audio.playEmerald();
  }

  handleDirtDug(col, row) {
    this.emeraldsInStreak = 0; // streak resets on plain dirt
    this.audio.playDig();
  }

  checkBagCrush(fallingBag) {
    const bagCenterX = fallingBag.x + TILE_WIDTH / 2;
    const bagCenterY = fallingBag.y + TILE_HEIGHT / 2;

    // Crush Digger
    const distPlayer = Math.hypot(this.digger.x + TILE_WIDTH / 2 - bagCenterX, this.digger.y + TILE_HEIGHT / 2 - bagCenterY);
    if (distPlayer < 20) {
      this.killDigger();
      return;
    }

    // Crush Monsters
    for (const m of this.monsters) {
      if (!m.isDead) {
        const distM = Math.hypot(m.x + TILE_WIDTH / 2 - bagCenterX, m.y + TILE_HEIGHT / 2 - bagCenterY);
        if (distM < 20) {
          m.isDead = true;
          this.monstersKilled++;
          this.addScore(250);
          this.audio.playCrush();
          this.addFloatingScore('+250 CRUSH!', m.x, m.y, '#ffff55');
        }
      }
    }
  }

  killDigger() {
    this.gameState = 'DYING';
    this.stateTimer = 85;
    this.digger.isDying = true;
    this.lives--;
    this.onLivesUpdate(this.lives);
    this.audio.stopBGM();
    this.audio.playFuneralMarch();
  }

  resetPlayerAndMonsters() {
    this.digger.reset();
    this.monsters = [];
    this.spawnCooldown = 40;
    this.isBonusMode = false;
    this.cherry.active = false;
    this.audio.playPopcornBGM();
  }

  nextLevel() {
    this.level++;
    this.onLevelUpdate(this.level);
    this.map.reset(this.level - 1);
    this.bags = this.map.initialBagConfigs.map(b => new GoldBag(b.col, b.row));
    this.resetPlayerAndMonsters();
    this.monstersToSpawn = 5 + (this.level - 1) * 2;
    this.monstersKilled = 0;
    this.gameState = 'READY';
    this.stateTimer = 90;
  }

  addScore(pts) {
    this.score += pts;
    this.onScoreUpdate(this.score);
  }

  addFloatingScore(text, x, y, color) {
    this.floatingScores.push({
      text,
      x,
      y,
      color,
      timer: 40
    });
  }

  render() {
    this.renderer.clear();
    this.renderer.drawMap(this.map);
    this.renderer.drawBags(this.bags);
    this.renderer.drawCherry(this.cherry);
    this.renderer.drawDigger(this.digger);
    this.renderer.drawMonsters(this.monsters, this.isBonusMode);
    this.renderer.drawFloatingScores(this.floatingScores);
    this.renderer.drawWeaponHUD(this.digger);

    if (this.gameState === 'READY') {
      this.renderer.drawOverlay('READY!', `STAGE ${this.level}`, '#ffff55');
    } else if (this.gameState === 'LEVEL_CLEAR') {
      this.renderer.drawOverlay('STAGE CLEARED!', 'BONUS AWARDED', '#55ff55');
    } else if (this.gameState === 'GAME_OVER') {
      this.renderer.drawOverlay('GAME OVER', 'PRESS RETRY', '#ff5555');
    } else if (this.isPaused) {
      this.renderer.drawOverlay('PAUSED', 'PRESS SPACE TO RESUME', '#00ffff');
    }
  }

  pause() {
    super.pause();
    this.audio.stopBGM();
  }

  resume() {
    super.resume();
    if (this.gameState === 'PLAYING') {
      if (this.isBonusMode) this.audio.playBonusBGM();
      else this.audio.playPopcornBGM();
    }
  }

  reset() {
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.timeAccumulator = 0;
    this.onLivesUpdate(this.lives);
    this.onScoreUpdate(this.score);
    this.onLevelUpdate(this.level);
    this.init();
    this.gameState = 'READY';
    this.stateTimer = 90;
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.audio.destroy();
    this.input.detach(this.container);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
