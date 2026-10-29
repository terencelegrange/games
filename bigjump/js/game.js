/**
 * Big Jump Game Engine (1983 Konami Track & Field Long Jump Tribute)
 */

import { MAX_RUN_SPEED, Athlete, Referee, StadiumAudience, AngleMeter, SandParticle } from './entities.js';
import { sound } from './audio.js';

export class BigJumpGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width || 800;
    this.height = canvas.height || 480;
    this.callbacks = callbacks;

    this.foulLineX = 260;
    this.trackY = 330;
    this.pxPerMeter = 45.0; // 45px per 1 meter of sandpit

    this.score = 0;
    this.round = 1;
    this.currentTry = 0; // 0, 1, 2 (3 tries per round)
    this.tries = [null, null, null]; // Distance strings or 'FOUL'
    this.tryDistances = [0, 0, 0];
    this.qualifyDistances = [7.00, 7.50, 8.00, 8.50, 8.95];

    this.state = 'READY'; // READY, RUNNING, CHARGING, IN_FLIGHT, EVALUATING, ROUND_CLEAR, GAME_OVER, PAUSED
    this.evalTimer = 0;
    this.roundTimer = 0;
    this.releasePending = false;
    this.lastAngleTick = 0;
    this.lastKey = null; // Track alternating run inputs

    this.athlete = new Athlete(-180, this.trackY);
    this.referee = new Referee(245, this.trackY);
    this.audience = new StadiumAudience(this.width);
    this.angleMeter = new AngleMeter();
    this.particles = [];
    this.distanceMarkers = [4, 5, 6, 7, 8, 9, 10];
    this.plantFlag = null; // { x, distStr }

    this.initRound();
  }

  getQualifyDistance() {
    const idx = Math.min(this.round - 1, this.qualifyDistances.length - 1);
    return this.qualifyDistances[idx];
  }

  start() {
    this.score = 0;
    this.round = 1;
    this.roundTimer = 0;
    this.savedState = null;
    this.initRound();
  }

  initRound() {
    this.currentTry = 0;
    this.tries = [null, null, null];
    this.tryDistances = [0, 0, 0];
    this.plantFlag = null;
    this.resetTry();

    if (this.callbacks.onRoundUpdate) this.callbacks.onRoundUpdate(this.round);
    if (this.callbacks.onQualifyUpdate) this.callbacks.onQualifyUpdate(`${this.getQualifyDistance().toFixed(2)}m`);
    if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
  }

  resetTry() {
    this.state = 'READY';
    this.evalTimer = 0;
    this.releasePending = false;
    this.plantFlag = null;
    this.lastKey = null;
    this.athlete.reset();
    this.referee.setFlag('NEUTRAL');
    this.angleMeter.active = false;
    this.particles = [];

    if (this.callbacks.onSpeedUpdate) this.callbacks.onSpeedUpdate(0);
    if (this.callbacks.onAngleUpdate) this.callbacks.onAngleUpdate(0);
  }

  togglePause() {
    if (this.state === 'GAME_OVER') return false;
    if (this.state === 'PAUSED') {
      this.state = this.savedState || 'READY';
      if (this.releasePending) {
        this.releasePending = false;
        this.releaseJump();
      }
      return false;
    } else {
      this.savedState = this.state;
      this.state = 'PAUSED';
      return true;
    }
  }

  // Handle alternating Left / Right run taps (or A / D, or virtual buttons)
  handleStep(stepKey = 'L') {
    if (!['READY', 'RUNNING'].includes(this.state)) return;

    if (this.state === 'READY') {
      this.state = 'RUNNING';
    }

    // Award bonus velocity for true alternation, partial for same key
    const isAlternating = this.lastKey !== stepKey;
    this.lastKey = stepKey;
    const accel = isAlternating ? 140 : 55;

    this.athlete.addStepSpeed(accel);
    sound.footstep(this.athlete.speed / MAX_RUN_SPEED);

    if (this.callbacks.onSpeedUpdate) {
      this.callbacks.onSpeedUpdate(Math.round(this.athlete.speed));
    }
  }

  // Press down Jump button -> Start charging launch angle
  startJumpCharge() {
    if (this.state !== 'RUNNING' || this.athlete.speed <= 0 || this.athlete.isFoul) return false;

    this.state = 'CHARGING';
    this.athlete.state = 'CHARGING_ANGLE';
    this.angleMeter.start();
    this.lastAngleTick = this.angleMeter.getAngle();
    return true;
  }

  // Release Jump button -> Commit angle & launch into air
  releaseJump() {
    if (this.state === 'PAUSED' && this.savedState === 'CHARGING') {
      this.releasePending = true;
      return;
    }
    if (this.state !== 'CHARGING') return;

    const angle = this.angleMeter.getAngle();
    this.angleMeter.active = false;
    this.state = 'IN_FLIGHT';
    this.athlete.launchJump(angle, this.foulLineX);
    sound.takeoff();

    if (this.callbacks.onAngleUpdate) {
      this.callbacks.onAngleUpdate(angle);
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || this.state === 'PAUSED' || this.state === 'GAME_OVER') return;

    this.audience.update(dt);
    if (this.state === 'ROUND_CLEAR') {
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        this.round++;
        this.initRound();
      }
      return;
    }

    if (this.state === 'CHARGING') {
      this.angleMeter.update(dt);
      if (this.angleMeter.getAngle() >= this.lastAngleTick + 3) {
        this.lastAngleTick = this.angleMeter.getAngle();
        sound.angleTick(this.lastAngleTick);
      }
      if (this.callbacks.onAngleUpdate) {
        this.callbacks.onAngleUpdate(this.angleMeter.getAngle());
      }
    }

    this.athlete.update(dt, this.foulLineX, this.trackY);

    if (this.callbacks.onSpeedUpdate && (this.state === 'RUNNING' || this.state === 'CHARGING')) {
      this.callbacks.onSpeedUpdate(Math.round(this.athlete.speed));
    }

    // Foul check while running past line without jumping
    if (this.athlete.isFoul && ['RUNNING', 'CHARGING', 'IN_FLIGHT'].includes(this.state)) {
      this.referee.setFlag('RED');
      sound.foulBuzzer();
      this.recordTry(0, true);
    }

    // Touchdown in sand pit
    if (this.athlete.state === 'LANDED' && this.state === 'IN_FLIGHT') {
      this.state = 'EVALUATING';
      this.evalTimer = 2.4;

      // Spawn sand spray particles
      sound.sandLanding();
      for (let i = 0; i < 28; i++) {
        this.particles.push(new SandParticle(this.athlete.x + (Math.random() - 0.5) * 20, this.trackY));
      }

      if (this.athlete.isFoul) {
        this.referee.setFlag('RED');
        sound.foulBuzzer();
        this.recordTry(0, true);
      } else {
        this.referee.setFlag('WHITE');
        sound.refereeWhistle();

        // Calculate distance in meters from take-off line
        const distanceMeters = Math.max(0, (this.athlete.landingX - this.foulLineX) / this.pxPerMeter);
        sound.crowdCheer(distanceMeters);
        this.plantFlag = {
          x: this.athlete.landingX,
          distStr: `${distanceMeters.toFixed(2)}m`
        };
        this.recordTry(distanceMeters, false);
      }
    }

    // Particle physics
    this.particles.forEach(p => p.update(dt));
    this.particles = this.particles.filter(p => p.life > 0);

    // Evaluation timer
    if (this.state === 'EVALUATING') {
      this.evalTimer -= dt;
      if (this.evalTimer <= 0) {
        this.evaluateTryAdvance();
      }
    }
  }

  recordTry(distance, isFoul) {
    if (this.tries[this.currentTry] !== null) return;
    this.state = 'EVALUATING';
    this.evalTimer = 2.4;
    this.angleMeter.active = false;
    this.releasePending = false;
    this.athlete.jumpDistanceMeters = isFoul ? 0 : distance;
    const distStr = isFoul ? 'FOUL' : `${distance.toFixed(2)}m`;
    this.tries[this.currentTry] = distStr;
    this.tryDistances[this.currentTry] = isFoul ? 0 : distance;

    if (!isFoul) {
      // Points scale with distance in centimeters (e.g. 8.42m = 842 points)
      const tryPoints = Math.round(distance * 100);
      this.score += tryPoints;
      if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
    }

    if (this.callbacks.onTryUpdate) {
      this.callbacks.onTryUpdate({
        tryIndex: this.currentTry,
        distanceStr: distStr,
        isFoul
      });
    }
  }

  evaluateTryAdvance() {
    this.currentTry++;

    if (this.currentTry < 3) {
      // Next try in current round
      this.resetTry();
    } else {
      // Round completed: check highest valid jump against qualify threshold
      const best = Math.max(...this.tryDistances);
      const target = this.getQualifyDistance();

      if (best >= target) {
        // Qualified!
        this.state = 'ROUND_CLEAR';
        sound.qualifyFanfare();
        const roundBonus = 1000 + this.round * 500;
        this.score += roundBonus;
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
        if (this.callbacks.onRoundSuccess) {
          this.callbacks.onRoundSuccess({
            round: this.round,
            bestDistance: `${best.toFixed(2)}m`,
            bonus: roundBonus
          });
        }
        this.roundTimer = 3;
      } else {
        // Failed to qualify
        this.state = 'GAME_OVER';
        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver({
            score: this.score,
            round: this.round,
            bestDistance: best > 0 ? `${best.toFixed(2)}m` : 'FOUL'
          });
        }
      }
    }
  }

  get cameraX() {
    // Keep the runner in the left part of the view during the approach.
    // Stop scrolling before the board so the whole landing area stays visible.
    return Math.min(0, this.athlete.x - this.width * 0.22);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Stadium Backdrop
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    const status = this.state === 'PAUSED' ? 'PAUSED — P TO RESUME'
      : this.state === 'READY' ? 'READY AT THE START — TAP LEFT / RIGHT TO RUN'
      : this.state === 'RUNNING' ? 'HOLD SPACE BEFORE THE RED LINE TO PLANT YOUR FOOT'
      : this.state === 'CHARGING' ? `HOLD TO AIM: ${this.angleMeter.getAngle()}° — RELEASE NEAR 45°`
      : this.state === 'IN_FLIGHT' ? `TAKEOFF ${this.athlete.jumpAngle}° — WATCH THE LANDING`
      : this.state === 'EVALUATING' ? `${this.tries[this.currentTry]} — ${this.athlete.isFoul ? 'OVER THE LINE' : 'DISTANCE FROM THE BOARD'}`
      : this.state === 'ROUND_CLEAR' ? 'QUALIFIED! NEXT ROUND'
      : 'GAME OVER';
    ctx.fillText(status, this.width / 2, 29);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`TRY ${Math.min(3, this.currentTry + 1)} / 3     TARGET ${this.getQualifyDistance().toFixed(2)}m`, this.width / 2, 50);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 403, this.width, this.height - 403);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('SPRINT → HOLD SPACE TO STOP & AIM → RELEASE TO JUMP', this.width / 2, 432);
    ctx.fillText('More speed + closer to the board + 45° = a longer jump', this.width / 2, 453);

    // 2. Spectator Bleachers
    this.audience.render(ctx);

    // 3. Grass Verge & Billboard Banner
    ctx.fillStyle = '#22c55e'; // Bright stadium grass
    ctx.fillRect(0, 138, this.width, 95);

    // World objects share one camera; instructions and stands stay fixed.
    const cameraX = this.cameraX;
    ctx.save();
    ctx.translate(-cameraX, 0);

    // Stadium Advertising Boards matching 1983 Konami aesthetic
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(160, 150, 480, 40);
    ctx.strokeRect(160, 150, 480, 40);

    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LONG   JUMP', 400, 178);

    // German / Olympic flag banner
    ctx.fillStyle = '#000000'; ctx.fillRect(660, 155, 36, 10);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(660, 165, 36, 10);
    ctx.fillStyle = '#facc15'; ctx.fillRect(660, 175, 36, 10);

    // 4. Running Track & Sandpit Surface
    // Tartan red-clay track
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(cameraX, 233, this.width, 170);

    // White lane divider lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    [235, 275, 315, 355, 395].forEach(ly => {
      ctx.beginPath();
      ctx.moveTo(cameraX, ly);
      ctx.lineTo(cameraX + this.width, ly);
      ctx.stroke();
    });

    // 5. Sand Pit Geometry (Begins at foul board x=260)
    ctx.save();
    // Angular sand pit entrance matching reference image
    ctx.fillStyle = '#cbd5e1'; // Grey-tan sand
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(this.foulLineX + 6, 280);
    ctx.lineTo(this.width - 20, 280);
    ctx.lineTo(this.width - 20, 390);
    ctx.lineTo(this.foulLineX + 64, 390);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sand grain flecks
    ctx.fillStyle = '#94a3b8';
    for (let i = 0; i < 40; i++) {
      const gx = this.foulLineX + 40 + (i * 17) % 450;
      const gy = 290 + (i * 11) % 90;
      ctx.fillRect(gx, gy, 2, 2);
    }

    // 6. White Take-Off Board & Red Foul Line
    // White board
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.foulLineX - 12, 270, 12, 125);
    // Red plasticine foul indicator strip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.foulLineX, 270, 4, 125);

    // 7. Distance Marker Signs along top of sandpit
    this.distanceMarkers.forEach(m => {
      const mx = this.foulLineX + m * this.pxPerMeter;
      if (mx <= this.width - 30) {
        // White marker placard
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.fillRect(mx - 10, 258, 20, 18);
        ctx.strokeRect(mx - 10, 258, 20, 18);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(m.toString(), mx, 272);
      }
    });

    // 8. Planted Distance Flag (where landed)
    if (this.plantFlag) {
      const fx = this.plantFlag.x;
      // Red flagpole
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, 284);
      ctx.lineTo(fx, 340);
      ctx.stroke();

      // Yellow flag banner with measured distance
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.fillRect(fx, 284, 46, 16);
      ctx.strokeRect(fx, 284, 46, 16);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(this.plantFlag.distStr, fx + 3, 296);
    }

    ctx.restore();

    // 9. Referee
    this.referee.render(ctx);

    // 10. Sand Particles
    this.particles.forEach(p => p.render(ctx));

    // 11. Athlete
    this.athlete.render(ctx);

    // 12. Angle Meter (Dotted arc and [ 45° ] indicator)
    if (this.state === 'CHARGING') {
      this.angleMeter.render(ctx, this.athlete.x, this.athlete.y - 20);
    }
    ctx.restore();
  }
}
