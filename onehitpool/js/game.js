/**
 * One Hit Pool - Main Game Engine
 */

import {
  BALL_RADIUS,
  INNER_RING_RADIUS,
  OUTER_RING_RADIUS,
  Ball,
  ConcentricRings,
  handleCushionBounce,
  resolveBallCollision,
  generateValidLayout
} from './entities.js';
import { poolAudio } from './audio.js';
import { getLocalHighScore, saveLocalHighScore, submitMatchRecord } from './storage.js';

export const GAME_STATES = {
  AIMING: 'AIMING',
  ROLLING: 'ROLLING',
  EVALUATING: 'EVALUATING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  ROUND_FAIL: 'ROUND_FAIL',
  GAME_OVER: 'GAME_OVER'
};

export class OneHitPoolGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.width = canvas.width || 800;
    this.height = canvas.height || 480;

    this.bounds = {
      minX: 38,
      maxX: this.width - 38,
      minY: 38,
      maxY: this.height - 38
    };

    this.score = 0;
    this.highScore = getLocalHighScore();
    this.level = 1;
    this.lives = 3;
    this.streak = 0;

    this.state = GAME_STATES.AIMING;

    this.rings = null;
    this.targetBall = null;
    this.cueBall = null;

    // Aiming & Power state
    this.aimAngle = 0; // Radians
    this.aimPower = 0.45; // 0.05 to 1.0
    this.maxImpulse = 18.0; // Max ball velocity

    this.isDragging = false;
    this.dragStart = null;
    this.currentPointer = { x: 0, y: 0 };

    this.evaluationTimer = 0;
    this.particles = [];

    this.initLevel(this.level);
  }

  initLevel(level = 1) {
    this.level = level;
    const layout = generateValidLayout(this.bounds, {
      ringsRadius: OUTER_RING_RADIUS,
      ballRadius: BALL_RADIUS,
      minBallDist: 110
    });

    this.rings = layout.rings;
    this.targetBall = layout.targetBall;
    this.cueBall = layout.cueBall;

    // Point aim towards target ball initially
    this.aimAngle = Math.atan2(this.targetBall.y - this.cueBall.y, this.targetBall.x - this.cueBall.x);
    this.aimPower = 0.5;
    this.state = GAME_STATES.AIMING;

    this.notifyHud();
  }

  notifyHud() {
    if (this.callbacks.onHudUpdate) {
      this.callbacks.onHudUpdate({
        score: this.score,
        highScore: Math.max(this.score, this.highScore),
        level: this.level,
        lives: this.lives,
        streak: this.streak,
        state: this.state
      });
    }
  }

  // --- Input Handlers ---

  setAimAngle(angle) {
    if (this.state === GAME_STATES.AIMING) {
      this.aimAngle = angle;
    }
  }

  setAimPower(power) {
    if (this.state === GAME_STATES.AIMING) {
      this.aimPower = Math.max(0.08, Math.min(1.0, power));
    }
  }

  startDrag(x, y) {
    if (this.state !== GAME_STATES.AIMING) return;
    this.isDragging = true;
    this.dragStart = { x, y };
    this.currentPointer = { x, y };
  }

  updateDrag(x, y) {
    if (!this.isDragging || this.state !== GAME_STATES.AIMING) return;
    this.currentPointer = { x, y };

    // Pull-back slingshot logic from cue ball or drag position
    const dx = this.cueBall.x - x;
    const dy = this.cueBall.y - y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      this.aimAngle = Math.atan2(dy, dx);
      this.aimPower = Math.min(1.0, dist / 160);
    }
  }

  endDrag() {
    if (!this.isDragging || this.state !== GAME_STATES.AIMING) return;
    this.isDragging = false;

    // Fire shot if power exceeds threshold
    if (this.aimPower >= 0.08) {
      this.shoot();
    }
  }

  shoot() {
    if (this.state !== GAME_STATES.AIMING) return;

    const speed = this.aimPower * this.maxImpulse;
    this.cueBall.vx = Math.cos(this.aimAngle) * speed;
    this.cueBall.vy = Math.sin(this.aimAngle) * speed;

    poolAudio.cueStrike(this.aimPower);
    this.state = GAME_STATES.ROLLING;
    this.notifyHud();
  }

  // --- Update Loop ---

  update(dt = 0.016) {
    this.rings.update(dt);
    this.updateParticles(dt);

    if (this.state === GAME_STATES.ROLLING) {
      this.cueBall.update();
      this.targetBall.update();

      // Table cushion rail bounces
      handleCushionBounce(this.cueBall, this.bounds, (speed) => {
        poolAudio.cushionHit(speed / this.maxImpulse);
      });
      handleCushionBounce(this.targetBall, this.bounds, (speed) => {
        poolAudio.cushionHit(speed / this.maxImpulse);
      });

      // Ball-to-ball elastic collision
      resolveBallCollision(this.cueBall, this.targetBall, (relSpeed) => {
        poolAudio.ballHit(relSpeed / this.maxImpulse);
        this.spawnCollisionSparks(
          (this.cueBall.x + this.targetBall.x) / 2,
          (this.cueBall.y + this.targetBall.y) / 2
        );
      });

      // Check if both balls have come to a complete stop
      if (this.cueBall.isStopped() && this.targetBall.isStopped()) {
        this.state = GAME_STATES.EVALUATING;
        this.evaluateShot();
      }
    }
  }

  evaluateShot() {
    const targetResult = this.rings.evaluateBall(this.targetBall);
    const cueResult = this.rings.evaluateBall(this.cueBall);

    let earnedPoints = 0;
    let message = '';
    let success = false;

    if (targetResult.hit) {
      success = true;
      earnedPoints += targetResult.score + this.level * 100;
      const isInner = targetResult.zone === 'inner';
      message = isInner ? '★ BULLSEYE! 1,000 PTS ★' : '★ TARGET HIT! 500 PTS ★';
      poolAudio.ringScore(isInner);
      this.spawnRingParticles(this.targetBall.x, this.targetBall.y, isInner ? '#fbbf24' : '#06b6d4');

      // Bonus if cue ball also landed in rings
      if (cueResult.hit) {
        const cueBonus = cueResult.score === 1000 ? 500 : 250;
        earnedPoints += cueBonus;
        message += ` + CUE BONUS ${cueBonus} PTS!`;
      }
    } else if (cueResult.hit) {
      // Cue ball alone landed in the concentric rings
      success = true;
      earnedPoints += cueResult.score + this.level * 50;
      const isInner = cueResult.zone === 'inner';
      message = isInner ? '★ CUE BULLSEYE! 1,000 PTS ★' : '★ CUE RING HIT! 500 PTS ★';
      poolAudio.ringScore(isInner);
      this.spawnRingParticles(this.cueBall.x, this.cueBall.y, '#f8fafc');
    }

    if (success) {
      this.score += earnedPoints;
      this.streak += 1;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveLocalHighScore(this.score);
      }
      this.state = GAME_STATES.LEVEL_CLEAR;
      if (this.callbacks.onBanner) {
        this.callbacks.onBanner(message, 'success');
      }

      setTimeout(() => {
        if (this.state === GAME_STATES.LEVEL_CLEAR) {
          poolAudio.levelClear();
          this.initLevel(this.level + 1);
        }
      }, 1600);
    } else {
      // Missed both rings!
      this.lives -= 1;
      this.streak = 0;
      poolAudio.miss();

      if (this.lives > 0) {
        this.state = GAME_STATES.ROUND_FAIL;
        const msg = `MISS! ${this.lives} ${this.lives === 1 ? 'LIFE' : 'LIVES'} REMAINING`;
        if (this.callbacks.onBanner) {
          this.callbacks.onBanner(msg, 'warning');
        }

        setTimeout(() => {
          if (this.state === GAME_STATES.ROUND_FAIL) {
            // Reset table layout for another try
            this.initLevel(this.level);
          }
        }, 1500);
      } else {
        // Game Over
        this.state = GAME_STATES.GAME_OVER;
        saveLocalHighScore(this.score);
        poolAudio.gameOver();

        submitMatchRecord({
          score: this.score,
          wave: this.level,
          result: `${this.score} PTS (LVL ${this.level})`
        });

        if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver({
            finalScore: this.score,
            highScore: this.highScore,
            level: this.level
          });
        }
      }
    }

    this.notifyHud();
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.streak = 0;
    this.initLevel(1);
  }

  // --- Particle FX ---

  spawnCollisionSparks(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03,
        color: '#ffffff',
        size: 2.5
      });
    }
  }

  spawnRingParticles(x, y, color) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        color,
        size: 3.5
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Billiard Table Outer Wood Rail & Bevel
    this.drawTableRail(ctx);

    // 2. Billiard Green Felt
    this.drawFelt(ctx);

    // 3. Concentric Target Rings
    if (this.rings) {
      this.rings.draw(ctx);
    }

    // 4. Aiming Trajectory Guidelines & Cue Stick
    if (this.state === GAME_STATES.AIMING && this.cueBall && this.targetBall) {
      this.drawAimGuidelines(ctx);
      this.drawCueStick(ctx);
    }

    // 5. Balls
    if (this.targetBall) {
      this.targetBall.draw(ctx);
    }
    if (this.cueBall) {
      this.cueBall.draw(ctx);
    }

    // 6. Particle Effects
    this.drawParticles(ctx);
  }

  drawTableRail(ctx) {
    // Rich mahogany wooden frame with rounded corner bevel
    ctx.save();
    ctx.fillStyle = '#2b1408'; // Dark mahogany
    ctx.fillRect(0, 0, this.width, this.height);

    // Outer wood grain border
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.width - 4, this.height - 4);

    // Inner rail wood highlight
    ctx.fillStyle = '#3c1d0e';
    ctx.fillRect(14, 14, this.width - 28, this.height - 28);

    // Diamond sights along rails
    this.drawDiamondSights(ctx);

    // Brass corner pocket accents
    const corners = [
      { x: 38, y: 38 },
      { x: this.width - 38, y: 38 },
      { x: 38, y: this.height - 38 },
      { x: this.width - 38, y: this.height - 38 },
      { x: this.width / 2, y: 38 },
      { x: this.width / 2, y: this.height - 38 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();
    });

    ctx.restore();
  }

  drawDiamondSights(ctx) {
    ctx.save();
    ctx.fillStyle = '#fde68a'; // Inlaid pearl / diamond sights

    const drawSight = (x, y) => {
      ctx.beginPath();
      ctx.moveTo(x, y - 3.5);
      ctx.lineTo(x + 3.5, y);
      ctx.lineTo(x, y + 3.5);
      ctx.lineTo(x - 3.5, y);
      ctx.closePath();
      ctx.fill();
    };

    // Top and bottom sights
    const xStep = (this.width - 76) / 8;
    for (let i = 1; i < 8; i++) {
      if (i === 4) continue; // Skip center pocket
      const x = 38 + i * xStep;
      drawSight(x, 24);
      drawSight(x, this.height - 24);
    }

    // Left and right sights
    const yStep = (this.height - 76) / 4;
    for (let j = 1; j < 4; j++) {
      const y = 38 + j * yStep;
      drawSight(24, y);
      drawSight(this.width - 24, y);
    }
    ctx.restore();
  }

  drawFelt(ctx) {
    ctx.save();

    // Table cushion bumpers
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(
      this.bounds.minX - 4,
      this.bounds.minY - 4,
      this.bounds.maxX - this.bounds.minX + 8,
      this.bounds.maxY - this.bounds.minY + 8
    );

    // Green Felt with central lighting gradient
    const feltGrad = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      60,
      this.width / 2,
      this.height / 2,
      400
    );
    feltGrad.addColorStop(0, '#0f766e');
    feltGrad.addColorStop(0.35, '#047857');
    feltGrad.addColorStop(1, '#064e3b');

    ctx.fillStyle = feltGrad;
    ctx.fillRect(
      this.bounds.minX,
      this.bounds.minY,
      this.bounds.maxX - this.bounds.minX,
      this.bounds.maxY - this.bounds.minY
    );

    // Cushion inner boundary border
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.bounds.minX,
      this.bounds.minY,
      this.bounds.maxX - this.bounds.minX,
      this.bounds.maxY - this.bounds.minY
    );

    ctx.restore();
  }

  drawAimGuidelines(ctx) {
    ctx.save();
    const cx = this.cueBall.x;
    const cy = this.cueBall.y;
    const dirX = Math.cos(this.aimAngle);
    const dirY = Math.sin(this.aimAngle);

    // 1. Find line-sphere intersection with targetBall
    const tx = this.targetBall.x;
    const ty = this.targetBall.y;
    const toTargetX = tx - cx;
    const toTargetY = ty - cy;

    // Projection of target center onto aiming ray
    const proj = toTargetX * dirX + toTargetY * dirY;
    let hitBall = false;
    let hitDistance = Infinity;

    if (proj > 0) {
      const perpDistSq = (toTargetX * toTargetX + toTargetY * toTargetY) - (proj * proj);
      const collisionRadius = BALL_RADIUS * 2;
      if (perpDistSq >= 0 && perpDistSq < collisionRadius * collisionRadius) {
        const d = Math.sqrt(collisionRadius * collisionRadius - perpDistSq);
        hitDistance = proj - d;
        if (hitDistance > 0) {
          hitBall = true;
        }
      }
    }

    // 2. Ray-box intersection with table cushions
    let wallDistance = Infinity;
    if (dirX > 0) wallDistance = Math.min(wallDistance, (this.bounds.maxX - BALL_RADIUS - cx) / dirX);
    if (dirX < 0) wallDistance = Math.min(wallDistance, (this.bounds.minX + BALL_RADIUS - cx) / dirX);
    if (dirY > 0) wallDistance = Math.min(wallDistance, (this.bounds.maxY - BALL_RADIUS - cy) / dirY);
    if (dirY < 0) wallDistance = Math.min(wallDistance, (this.bounds.minY + BALL_RADIUS - cy) / dirY);

    const travelDist = hitBall ? Math.min(hitDistance, wallDistance) : wallDistance;
    const endX = cx + dirX * travelDist;
    const endY = cy + dirY * travelDist;

    // Draw primary trajectory line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    if (hitBall && hitDistance <= wallDistance) {
      // Draw Ghost Cue Ball at collision point
      ctx.beginPath();
      ctx.arc(endX, endY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.stroke();

      // Target ball deflected trajectory vector
      const impactNormX = (tx - endX) / (BALL_RADIUS * 2);
      const impactNormY = (ty - endY) / (BALL_RADIUS * 2);

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + impactNormX * 70, ty + impactNormY * 70);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.stroke();

      // Deflected cue ball secondary vector
      const cuePerpX = dirX - impactNormX * (dirX * impactNormX + dirY * impactNormY);
      const cuePerpY = dirY - impactNormY * (dirX * impactNormX + dirY * impactNormY);
      const cuePerpMag = Math.hypot(cuePerpX, cuePerpY);
      if (cuePerpMag > 0.1) {
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + (cuePerpX / cuePerpMag) * 45, endY + (cuePerpY / cuePerpMag) * 45);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawCueStick(ctx) {
    ctx.save();
    const cx = this.cueBall.x;
    const cy = this.cueBall.y;

    // Pullback offset based on shot power (from 18px to 65px)
    const pullback = 18 + this.aimPower * 48;
    const stickLength = 220;

    // The cue stick lies behind the cue ball opposite to the aim angle
    const backAngle = this.aimAngle + Math.PI;
    const tipX = cx + Math.cos(backAngle) * pullback;
    const tipY = cy + Math.sin(backAngle) * pullback;
    const buttX = tipX + Math.cos(backAngle) * stickLength;
    const buttY = tipY + Math.sin(backAngle) * stickLength;

    // Draw cue stick shadow
    ctx.beginPath();
    ctx.moveTo(tipX + 3, tipY + 4);
    ctx.lineTo(buttX + 5, buttY + 6);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.stroke();

    // Cue stick body gradient (maple wood shaft to dark ebony butt)
    const stickGrad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
    stickGrad.addColorStop(0, '#fef3c7'); // Light maple shaft
    stickGrad.addColorStop(0.55, '#d97706'); // Warm mahogany
    stickGrad.addColorStop(0.85, '#78350f'); // Dark wood
    stickGrad.addColorStop(1, '#1c1917'); // Ebony handle grip

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(buttX, buttY);
    ctx.lineWidth = 5;
    ctx.strokeStyle = stickGrad;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Cue tip: brass ferrule and blue chalk tip
    const ferruleX = tipX + Math.cos(backAngle) * 6;
    const ferruleY = tipY + Math.sin(backAngle) * 6;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(ferruleX, ferruleY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fde047'; // Brass ferrule
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0284c7'; // Blue chalk tip
    ctx.fill();

    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();
  }
}
