/**
 * Gorillas Computer Ballistic AI
 * Intelligent artillery AI with trajectory simulation, realistic humanized inaccuracy,
 * and adaptive shot correction memory across turns.
 */

import { simulateTrajectory, calculateInitialVelocity, GRAVITY, WIND_FACTOR, VELOCITY_SCALE } from './physics.js';

export class GorillasAI {
  constructor() {
    this.lastShot = null;
    this.shotCount = 0;
  }

  resetRound() {
    this.lastShot = null;
    this.shotCount = 0;
  }

  /**
   * Computes angle and velocity for Computer Gorilla (throwing left toward Player)
   * @param {Object} aiGorilla - {x, y}
   * @param {Object} playerGorilla - {x, y}
   * @param {number} windSpeed - Current wind speed in MPH (-12 to +12)
   */
  calculateShot(aiGorilla, playerGorilla, windSpeed) {
    this.shotCount++;
    const targetX = playerGorilla.x;
    const targetY = playerGorilla.y;
    const startX = aiGorilla.x - 20;
    const startY = aiGorilla.y - 20;

    // If we have previous shot feedback, adaptively correct velocity!
    if (this.lastShot && this.lastShot.impactX !== undefined) {
      const prevError = this.lastShot.impactX - targetX; // > 0 means fell short (right of player), < 0 means overshot
      let newAngle = this.lastShot.angle;
      let newVelocity = this.lastShot.velocity;

      if (Math.abs(prevError) > 15) {
        // Adjust velocity proportionally to close the gap
        // Since throwing left: falling short (impactX > targetX) means needs MORE velocity
        // Overshooting (impactX < targetX) means needs LESS velocity
        const correction = (prevError / 35.0) * (3.0 + Math.random() * 2.5);
        newVelocity = Math.max(15, Math.min(100, Math.round(newVelocity + correction)));
      } else {
        // Very close! Slight micro-tweak
        newVelocity = Math.max(15, Math.min(100, Math.round(newVelocity + (prevError > 0 ? 1 : -1))));
      }

      this.lastShot = { angle: newAngle, velocity: newVelocity };
      return { angle: newAngle, velocity: newVelocity };
    }

    // First shot of the round: Find a viable ballistic solution
    const candidateAngles = [50, 55, 60, 65, 70];
    let bestAngle = 60;
    let bestVelocity = 50;
    let bestDist = Infinity;

    for (const angle of candidateAngles) {
      // Binary search / sweep velocity from 20 to 90
      for (let v = 20; v <= 90; v += 2) {
        const path = simulateTrajectory(startX, startY, angle, v, false, windSpeed, 4.0, 0.04);
        for (const pt of path) {
          const dx = pt.x - targetX;
          const dy = pt.y - targetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestAngle = angle;
            bestVelocity = v;
          }
        }
      }
    }

    // Add realistic early-round human variance (scatter) so computer isn't an instant aimbot
    const varianceFactor = Math.max(0.4, 1.0 - (this.shotCount - 1) * 0.25);
    const angleNoise = (Math.random() * 6 - 3) * varianceFactor;
    const velocityNoise = (Math.random() * 8 - 4) * varianceFactor;

    const finalAngle = Math.max(30, Math.min(85, Math.round(bestAngle + angleNoise)));
    const finalVelocity = Math.max(20, Math.min(95, Math.round(bestVelocity + velocityNoise)));

    this.lastShot = { angle: finalAngle, velocity: finalVelocity };
    return { angle: finalAngle, velocity: finalVelocity };
  }

  recordImpact(impactX) {
    if (this.lastShot) {
      this.lastShot.impactX = impactX;
    }
  }
}
