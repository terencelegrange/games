/**
 * Bottomer Game Engine (1983 Bally Midway Tapper Arcade Tribute)
 * Saloon counters, beer sliding, patron serving, empty mug retrieval, tip collection
 */

import { BAR_ROWS, Bartender, Mug, Patron, Tip, GlassShard } from './entities.js';
import { sound } from './audio.js';

export class BottomerGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 800;
    this.height = canvas.height || 480;
    this.callbacks = callbacks;

    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.round = 1;
    this.state = 'PLAYING'; // 'PLAYING', 'LIFE_LOST', 'ROUND_CLEAR', 'GAME_OVER', 'PAUSED'

    this.bartender = new Bartender();
    this.mugs = [];
    this.patrons = [];
    this.tips = [];
    this.shards = [];

    this.patronsToSpawn = 0;
    this.spawnTimer = 0;
    this.transitionTimer = 0;
    this.accumulator = 0;
    this.pourCooldown = 0;
    this.distractionTimer = 0;
    this.lastMistake = '';
    this.feedback = [];

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      pour: false
    };

    this.initRound();
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.round = 1;
    this.initRound();
  }

  initRound() {
    this.state = 'PLAYING';
    this.clearInput();
    this.bartender.reset();
    this.pourCooldown = 0;
    this.distractionTimer = 0;
    this.lastMistake = '';
    this.feedback = [];
    this.mugs = [];
    this.patrons = [];
    this.tips = [];
    this.shards = [];

    // Wave sizing scales with round
    this.patronsToSpawn = 6 + this.round * 3;
    this.spawnTimer = 1.0; // Initial delay before first patron walks in
    this.transitionTimer = 0;

    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
    if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
    if (this.callbacks.onRoundUpdate) this.callbacks.onRoundUpdate(this.round);
  }

  clearInput() {
    Object.keys(this.input).forEach(key => { this.input[key] = false; });
  }

  moveBar(direction) {
    if (this.state !== 'PLAYING') return;
    if (direction < 0) this.bartender.moveUp();
    else this.bartender.moveDown();
  }

  togglePause() {
    if (this.state === 'GAME_OVER') return false;
    this.clearInput();
    if (this.state === 'PAUSED') {
      this.state = this.savedState || 'PLAYING';
      return false;
    } else {
      this.savedState = this.state;
      this.state = 'PAUSED';
      return true;
    }
  }

  handlePour() {
    if (this.state !== 'PLAYING' || this.pourCooldown > 0) return;
    if (this.bartender.startPour()) {
      sound.tapPour();
    }
  }

  spawnPatron() {
    if (this.patronsToSpawn <= 0) return;

    // Pick a row with fewest active patrons to balance counters
    const rowCounts = [0, 0, 0, 0];
    this.patrons.forEach(p => {
      if (p.state !== 'EXITED') rowCounts[p.rowIndex]++;
    });

    let minRow = 0;
    let minCount = rowCounts[0];
    for (let i = 1; i < 4; i++) {
      if (rowCounts[i] < minCount) {
        minCount = rowCounts[i];
        minRow = i;
      }
    }

    const leastBusy = rowCounts.map((count, index) => count === minCount ? index : -1).filter(index => index >= 0);
    minRow = leastBusy[Math.floor(Math.random() * leastBusy.length)];

    const types = ['COWBOY', 'MINER', 'GENTLEMAN', 'LADY'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const speed = 36 + (this.round - 1) * 7 + Math.random() * 12;

    const bar = BAR_ROWS[minRow];
    this.patrons.push(new Patron(minRow, bar.rightX - 5, chosenType, speed));
    this.patronsToSpawn--;

    // Next spawn delay decreases as round increases
    this.spawnTimer = Math.max(1.2, 3.2 - this.round * 0.35 + Math.random() * 0.8);
  }

  onLifeLost(reason = 'MUG_BROKEN', shardX = 110, shardY = 200) {
    if (this.state !== 'PLAYING') return;
    this.clearInput();
    this.lastMistake = { OVERTHROWN_MUG: 'NO CUSTOMER — FULL MUG BROKE', DROPPED_EMPTY: 'MISSED AN EMPTY — GET BACK TO THAT COUNTER', PATRON_REACHED_BAR: 'CUSTOMER REACHED THE TAP — SERVE SOONER' }[reason] || 'MUG BROKEN';
    this.lives--;
    this.state = 'LIFE_LOST';
    this.transitionTimer = 2.0;

    // Spawn glass shattering effect
    sound.glassShatter();
    for (let i = 0; i < 22; i++) {
      this.shards.push(new GlassShard(shardX, shardY));
    }

    if (this.callbacks.onLivesUpdate) {
      this.callbacks.onLivesUpdate(this.lives);
    }

    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
      sound.patronEject();
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver({
          score: this.score,
          round: this.round,
          reason
        });
      }
    }
  }

  addScore(pts, x = this.bartender.x, y = this.bartender.y - 55) {
    this.feedback.push({ text: `+${pts}`, x, y, life: 0.9 });
    this.score += pts;
    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score);
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.accumulator += Math.min(dt, 0.25);
    const step = 1 / 120;
    while (this.accumulator + 1e-9 >= step) {
      this.accumulator -= step;
      this.step(step);
    }
  }

  step(dt) {
    if (this.state === 'PAUSED') return;

    // Transition timers (after losing life or clearing wave)
    if (this.state === 'LIFE_LOST') {
      this.transitionTimer -= dt;
      this.shards.forEach(s => s.update(dt));
      this.shards = this.shards.filter(s => s.life > 0);
      if (this.transitionTimer <= 0) {
        if (this.lives > 0) {
          this.bartender.reset();
          this.mugs = [];
          this.tips = [];
          this.pourCooldown = 0;
          this.distractionTimer = 0;
          // Return remaining customers to a safe approach after a mistake.
          // Leaving a customer at the tap caused an immediate loss of every life.
          const rowSlots = [0, 0, 0, 0];
          this.patrons = this.patrons.filter(p => p.state !== 'EXITED');
          for (const p of this.patrons) {
            p.x = BAR_ROWS[p.rowIndex].rightX - 35 - Math.min(3, rowSlots[p.rowIndex]++) * 55;
            p.state = 'WALKING';
            p.drinkTimer = 0;
          }
          this.spawnTimer = Math.max(1.5, this.spawnTimer);
          this.state = 'PLAYING';
        }
      }
      return;
    }

    if (this.state === 'ROUND_CLEAR') {
      this.transitionTimer -= dt;
      if (this.transitionTimer <= 0) {
        this.round++;
        this.initRound();
      }
      return;
    }

    if (this.state === 'GAME_OVER') {
      this.shards.forEach(s => s.update(dt));
      this.shards = this.shards.filter(s => s.life > 0);
      return;
    }

    this.pourCooldown = Math.max(0, this.pourCooldown - dt);
    this.distractionTimer = Math.max(0, this.distractionTimer - dt);
    this.feedback.forEach(f => { f.life -= dt; f.y -= dt * 24; });
    this.feedback = this.feedback.filter(f => f.life > 0);
    if (this.input.pour && !this.input.left && !this.input.right) this.handlePour();

    // 1. Spawning Patrons
    if (this.patronsToSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnPatron();
      }
    }

    // 2. Update Bartender
    const pourStatus = this.bartender.update(dt, this.input);
    if (pourStatus === 'POUR_COMPLETE') {
      // Release filled beer mug down the counter
      const bar = BAR_ROWS[this.bartender.rowIndex];
      this.mugs.push(new Mug(this.bartender.rowIndex, bar.tapX + 25, 'FULL'));
      this.pourCooldown = 0.16;
      sound.mugSlide();
    }

    // 3. Update Mugs & Check Collisions
    for (let i = this.mugs.length - 1; i >= 0; i--) {
      const mug = this.mugs[i];
      const mugEvent = mug.update(dt);
      const bar = BAR_ROWS[mug.rowIndex];

      // Check Full Mug -> Patron collision
      if (mug.type === 'FULL' && mug.active) {
        for (let p of [...this.patrons].sort((a, b) => a.x - b.x)) {
          if (p.rowIndex === mug.rowIndex && p.state === 'WALKING') {
            // Check collision range
            if (mug.x >= p.x - 20 && mug.x <= p.x + 25) {
              mug.active = false;
              this.mugs.splice(i, 1);

              p.catchMug();
              sound.patronCatch();
              sound.gulpDrink();
              this.addScore(100, p.x, bar.y - 55);

              // 35% chance to drop tip on the counter
              if (Math.random() < 0.35) {
                this.tips.push(new Tip(p.rowIndex, p.x));
              }
              break;
            }
          }
        }
        if (!mug.active) continue;
      }

      // Check Empty Mug -> Bartender catch collision
      if (mug.type === 'EMPTY' && mug.active) {
        if (this.bartender.rowIndex === mug.rowIndex) {
          if (Math.abs(mug.x - this.bartender.x) <= 28) {
            mug.active = false;
            this.mugs.splice(i, 1);
            sound.catchEmpty();
            this.addScore(100);
            continue;
          }
        }
      }

      // Check fall off edges
      if (mugEvent === 'OFF_RIGHT') {
        // Full beer mug flew off the end of the bar! (Unserved overthrow)
        this.mugs.splice(i, 1);
        this.onLifeLost('OVERTHROWN_MUG', bar.rightX, bar.y);
        return;
      } else if (mugEvent === 'OFF_LEFT') {
        // Empty mug slid off the left edge without bartender catching it!
        this.mugs.splice(i, 1);
        this.onLifeLost('DROPPED_EMPTY', bar.leftX, bar.y);
        return;
      }
    }

    // 4. Update Patrons
    for (let i = this.patrons.length - 1; i >= 0; i--) {
      const p = this.patrons[i];
      const patronEvent = this.distractionTimer > 0 && p.state === 'WALKING' ? null : p.update(dt);
      const bar = BAR_ROWS[p.rowIndex];

      if (patronEvent === 'REACHED_BAR') {
        // Unserved patron reached the taps!
        this.onLifeLost('PATRON_REACHED_BAR', bar.leftX, bar.y);
        return;
      } else if (patronEvent === 'EXITED_BAR') {
        // Patron satisfied and pushed out through the saloon swing doors!
        this.addScore(50);
      } else if (patronEvent === 'RETURN_EMPTY') {
        // Patron finished beer and slides empty mug back to bartender!
        this.mugs.push(new Mug(p.rowIndex, p.x - 10, 'EMPTY'));
        sound.emptySlide();
      }
    }

    // 5. Update Tips & Bartender collection
    for (let i = this.tips.length - 1; i >= 0; i--) {
      const tip = this.tips[i];
      tip.update(dt);

      if (tip.life <= 0) {
        this.tips.splice(i, 1);
        continue;
      }

      // Bartender walks over tip to collect
      if (this.bartender.rowIndex === tip.rowIndex) {
        if (Math.abs(this.bartender.x - tip.x) <= 24) {
          this.tips.splice(i, 1);
          sound.tipChime();
          this.addScore(tip.value, tip.x, BAR_ROWS[tip.rowIndex].y - 50);
          this.distractionTimer = 3;
        }
      }
    }

    this.patrons = this.patrons.filter(p => p.state !== 'EXITED');

    // 6. Particle Shards
    this.shards.forEach(s => s.update(dt));
    this.shards = this.shards.filter(s => s.life > 0);

    // 7. Check Wave Clear
    const activePatrons = this.patrons.filter(p => p.state !== 'EXITED').length;
    if (this.patronsToSpawn === 0 && activePatrons === 0 && this.mugs.length === 0) {
      this.clearInput();
      this.state = 'ROUND_CLEAR';
      this.transitionTimer = 3.0;
      sound.waveClear();
      const waveBonus = this.round * 500;
      this.addScore(waveBonus);
      if (this.callbacks.onRoundClear) {
        this.callbacks.onRoundClear({
          round: this.round,
          bonus: waveBonus
        });
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Saloon Wood Paneling Wall
    ctx.fillStyle = '#29170e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Saloon vertical timber slats
    ctx.fillStyle = '#1c0f0a';
    for (let x = 0; x < this.width; x += 40) {
      ctx.fillRect(x, 0, 3, this.height);
    }

    ctx.fillStyle = '#130d09';
    ctx.fillRect(0, 0, this.width, 62);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    const remaining = this.patronsToSpawn + this.patrons.filter(p => p.state !== 'EXITED').length;
    ctx.fillText(`LAST CALL SALOON   •   WAVE ${this.round}   •   ${remaining} CUSTOMERS LEFT`, this.width / 2, 25);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    const status = this.state === 'PAUSED' ? 'PAUSED — P TO RESUME'
      : this.state === 'LIFE_LOST' || this.state === 'GAME_OVER' ? this.lastMistake
      : this.state === 'ROUND_CLEAR' ? 'ALL CUSTOMERS SERVED! NEXT WAVE…'
      : this.distractionTimer > 0 ? `TIP COLLECTED! CUSTOMERS DISTRACTED FOR ${Math.ceil(this.distractionTimer)}s`
      : this.bartender.x > BAR_ROWS[this.bartender.rowIndex].tapX + 15 ? 'WALK LEFT TO RETURN TO THE TAP AND POUR'
      : 'HOLD SPACE TO SERVE • RELEASE BEFORE YOU OVER-SERVE • CATCH THE EMPTIES';
    ctx.fillText(status, this.width / 2, 47);
    ctx.fillStyle = '#130d09';
    ctx.fillRect(0, 415, this.width, 65);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('↑ ↓ CHANGE COUNTER    ← → WALK / COLLECT TIPS    SPACE POUR', this.width / 2, 440);
    ctx.fillStyle = '#67e8f9';
    ctx.fillText('EMPTY MUGS ← return to you. Be on their counter to catch them.', this.width / 2, 461);

    // Golden Saloon Chandeliers & Sconces
    ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
    ctx.beginPath();
    ctx.arc(220, 40, 90, 0, Math.PI * 2);
    ctx.arc(580, 40, 90, 0, Math.PI * 2);
    ctx.fill();

    // 4 Saloon Counters & Taps
    BAR_ROWS.forEach(bar => {
      const selected = bar.index === this.bartender.rowIndex;
      if (selected) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
        ctx.fillRect(bar.leftX - 18, bar.y - 57, bar.rightX - bar.leftX + 30, 79);
      }
      ctx.fillStyle = selected ? '#facc15' : '#a8a29e';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${bar.index + 1}${selected ? ' ›' : ''}`, 35, bar.y - 15);
      const urgent = this.mugs.some(m => m.rowIndex === bar.index && m.type === 'EMPTY' && m.x < 300);
      if (urgent) {
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('← CATCH', 130, bar.y - 58);
      }

      // Counter top drop shadow
      ctx.fillStyle = '#0f0805';
      ctx.fillRect(bar.leftX, bar.y + 6, bar.rightX - bar.leftX, 16);

      // Polished Mahogany Counter Surface
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bar.leftX, bar.y - 2, bar.rightX - bar.leftX, 8);

      // Upper counter highlight
      ctx.fillStyle = '#b45309';
      ctx.fillRect(bar.leftX, bar.y - 2, bar.rightX - bar.leftX, 2);

      // Polished Brass Foot Rail below
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(bar.leftX + 20, bar.y + 20, bar.rightX - bar.leftX - 40, 3);
      ctx.fillRect(bar.leftX + 40, bar.y + 16, 4, 8);
      ctx.fillRect(bar.rightX - 60, bar.y + 16, 4, 8);

      // Brass Beer Tap at Left
      ctx.fillStyle = '#eab308';
      ctx.fillRect(bar.tapX - 6, bar.y - 26, 12, 24); // Tap column
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(bar.tapX - 10, bar.y - 28, 20, 4); // Tap crown
      // Faucet nozzle
      ctx.fillRect(bar.tapX + 4, bar.y - 18, 10, 4);
      ctx.fillRect(bar.tapX + 12, bar.y - 14, 4, 6);

      // Saloon Batwing Swing Doors at Right
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bar.rightX - 4, bar.y - 48, 8, 46);
      ctx.strokeStyle = '#29170e';
      ctx.strokeRect(bar.rightX - 4, bar.y - 48, 8, 46);
    });

    // Render Tips
    this.tips.forEach(t => t.render(ctx));

    // Render Patrons
    this.patrons.forEach(p => p.render(ctx));

    // Render Mugs
    this.mugs.forEach(m => m.render(ctx));

    // Render Bartender
    this.bartender.render(ctx);

    if (this.bartender.isPouring) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(this.bartender.x - 20, this.bartender.y - 62, 40, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(this.bartender.x - 20, this.bartender.y - 62, 40 * this.bartender.pourProgress, 5);
    }
    this.feedback.forEach(f => {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(f.text, f.x, f.y);
    });

    // Render Glass Shards
    this.shards.forEach(s => s.render(ctx));
  }
}
