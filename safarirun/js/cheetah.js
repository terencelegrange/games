/**
 * Cheetah Player Entity
 * High-performance procedural canvas renderer & physics engine
 */

export class Cheetah {
  constructor(canvasWidth, groundY) {
    this.canvasWidth = canvasWidth;
    this.groundY = groundY; // Ground line (y = 240)

    // Baseline placement
    this.x = 70;
    this.y = this.groundY; // y is bottom of paws

    // Dimensions
    this.normalWidth = 76;
    this.normalHeight = 44;
    this.duckWidth = 86;
    this.duckHeight = 22;

    this.width = this.normalWidth;
    this.height = this.normalHeight;

    // Movement & Physics
    this.vy = 0;
    this.jumpForce = -13.2;
    this.minJumpForce = -5.8;
    this.gravity = 0.64;
    this.fastFallGravity = 1.45;

    // State flags
    this.isGrounded = true;
    this.isJumping = false;
    this.isDucking = false;
    this.isDead = false;

    // Animation tracking
    this.distance = 0;
    this.animFrame = 0;
    this.totalFrames = 6;
    this.dustParticles = [];
  }

  reset() {
    this.y = this.groundY;
    this.vy = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isDucking = false;
    this.isDead = false;
    this.width = this.normalWidth;
    this.height = this.normalHeight;
    this.distance = 0;
    this.animFrame = 0;
    this.dustParticles = [];
  }

  jump() {
    if (this.isGrounded && !this.isDead) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
      this.spawnDust(6, -2);
      return true;
    }
    return false;
  }

  cutJump() {
    // Variable jump height: release jump button early to shorten leap
    if (this.isJumping && this.vy < this.minJumpForce) {
      this.vy = this.minJumpForce;
    }
  }

  duck(isDown) {
    if (this.isDead) return;
    this.isDucking = isDown;

    if (this.isDucking) {
      this.width = this.duckWidth;
      this.height = this.duckHeight;
      // Fast fall if ducking in the air
      if (!this.isGrounded) {
        this.vy += 0.8;
      }
    } else {
      this.width = this.normalWidth;
      this.height = this.normalHeight;
    }
  }

  update(speed, dt = 1 / 60) {
    // Dust particles
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x -= p.vx + speed * 0.4;
      p.y += p.vy;
      p.size = Math.max(0, p.size - p.decay);
      p.alpha = Math.max(0, p.alpha - 0.03);
      if (p.alpha <= 0 || p.size <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }

    if (this.isDead) return;

    // Distance and animation stride
    this.distance += speed;
    this.animFrame = Math.floor((this.distance / 12) % this.totalFrames);

    // Ground dust emission during sprint
    if (this.isGrounded && Math.random() < 0.4) {
      this.spawnDust(1, 0);
    }

    // Vertical physics
    if (!this.isGrounded) {
      const currentGravity = (this.isDucking && this.vy > 0) ? this.fastFallGravity : this.gravity;
      this.vy += currentGravity;
      this.y += this.vy;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.spawnDust(5, -1); // Landing puff
      }
    }
  }

  spawnDust(count = 3, vyImpulse = 0) {
    for (let i = 0; i < count; i++) {
      this.dustParticles.push({
        x: this.x + 8 + Math.random() * 20,
        y: this.groundY - 2 + Math.random() * 4,
        vx: 1 + Math.random() * 3,
        vy: vyImpulse + (Math.random() - 0.5) * 1.5,
        size: 2.5 + Math.random() * 3.5,
        decay: 0.08,
        alpha: 0.75 + Math.random() * 0.25,
        color: Math.random() > 0.4 ? '#b45309' : '#d97706'
      });
    }
  }

  getHitboxes() {
    // Multi-box collision boundaries tailored to cheetah posture
    const topY = this.y - this.height;

    if (this.isDucking) {
      // Sleek low prowl box
      return [
        { x: this.x + 4, y: topY + 4, w: this.width - 8, h: this.height - 4 }
      ];
    }

    // Normal running/jumping hitboxes: Head + Torso/Body + Legs
    return [
      // Head & Neck
      { x: this.x + 48, y: topY + 2, w: 22, h: 20 },
      // Main Body
      { x: this.x + 14, y: topY + 12, w: 42, h: 22 },
      // Legs / Lower body
      { x: this.x + 8, y: topY + 26, w: 54, h: 18 }
    ];
  }

  draw(ctx) {
    // 1. Draw dust particles
    ctx.save();
    for (const p of this.dustParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Cheetah
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDead) {
      this.drawDeadPose(ctx);
    } else if (this.isDucking) {
      this.drawDuckPose(ctx);
    } else if (!this.isGrounded) {
      this.drawLeapPose(ctx);
    } else {
      this.drawGallopPose(ctx, this.animFrame);
    }

    ctx.restore();
  }

  /**
   * Gallop Sprint Animation Cycle (6 frames of feline rotary gallop)
   */
  drawGallopPose(ctx, frame) {
    // Colors
    const furColor = '#f59e0b';
    const underbellyColor = '#fef3c7';
    const spotColor = '#1c1917';

    // Cycle offsets
    // Frame 0: compression, 1: front stretch, 2: full airborne leap, 3: front plant, 4: hind surge, 5: regroup
    const spineFlex = [ -3, 0, 3, 1, -2, -4 ][frame];
    const headBob = [ 1, 0, -2, -1, 1, 2 ][frame];

    // Tail swing
    const tailY = [ -28, -25, -22, -26, -30, -32 ][frame];
    const tailAngle = [ -0.1, 0.1, 0.35, 0.2, -0.05, -0.2 ][frame];

    // Leg coordinates [frontLeft, frontRight, hindLeft, hindRight]
    const legCycles = [
      // 0: Compression (all tucked under)
      { fl: { x: 38, y: -6 }, fr: { x: 44, y: -4 }, hl: { x: 18, y: -4 }, hr: { x: 24, y: -6 } },
      // 1: Extension start (reaching)
      { fl: { x: 50, y: -2 }, fr: { x: 42, y: -8 }, hl: { x: 10, y: -8 }, hr: { x: 20, y: -4 } },
      // 2: Full Extension (flying bullet)
      { fl: { x: 62, y: 0 },  fr: { x: 54, y: -4 }, hl: { x: 4,  y: -10 }, hr: { x: 12, y: -8 } },
      // 3: Front plant (front paws down, body swinging over)
      { fl: { x: 54, y: 0 },  fr: { x: 60, y: 0 },  hl: { x: 12, y: -6 }, hr: { x: 6,  y: -12 } },
      // 4: Hind sweep (back paws driving ground)
      { fl: { x: 38, y: -10 }, fr: { x: 46, y: -6 }, hl: { x: 22, y: 0 },  hr: { x: 16, y: -2 } },
      // 5: Contract (springing into gather)
      { fl: { x: 30, y: -8 }, fr: { x: 36, y: -10 }, hl: { x: 26, y: -2 }, hr: { x: 20, y: -4 } }
    ][frame];

    // --- Far Hind Leg ---
    ctx.fillStyle = '#d97706';
    this.drawLeg(ctx, 16, -20 + spineFlex, legCycles.hr.x, legCycles.hr.y, 4.5);

    // --- Far Front Leg ---
    ctx.fillStyle = '#d97706';
    this.drawLeg(ctx, 48, -22 + spineFlex, legCycles.fr.x, legCycles.fr.y, 4);

    // --- Tail ---
    ctx.save();
    ctx.strokeStyle = furColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, -22 + spineFlex);
    ctx.quadraticCurveTo(-4, tailY + 4, -14, tailY + tailAngle * 20);
    ctx.stroke();
    // Tail black tuft
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-10, tailY + tailAngle * 14);
    ctx.lineTo(-14, tailY + tailAngle * 20);
    ctx.stroke();
    ctx.restore();

    // --- Torso / Body ---
    ctx.fillStyle = furColor;
    ctx.beginPath();
    // Flexible spine curve
    ctx.moveTo(10, -22 + spineFlex); // rump
    ctx.quadraticCurveTo(32, -26 + spineFlex * 1.3, 52, -24 + spineFlex); // back
    ctx.lineTo(52, -14 + spineFlex); // chest
    ctx.quadraticCurveTo(32, -12 + spineFlex * 0.5, 12, -14 + spineFlex); // belly
    ctx.closePath();
    ctx.fill();

    // --- White Underbelly & Chest ---
    ctx.fillStyle = underbellyColor;
    ctx.beginPath();
    ctx.moveTo(20, -14 + spineFlex);
    ctx.quadraticCurveTo(36, -13 + spineFlex * 0.5, 50, -16 + spineFlex);
    ctx.lineTo(48, -12 + spineFlex);
    ctx.quadraticCurveTo(34, -10 + spineFlex * 0.5, 18, -12 + spineFlex);
    ctx.closePath();
    ctx.fill();

    // --- Near Hind Leg ---
    ctx.fillStyle = furColor;
    this.drawLeg(ctx, 14, -20 + spineFlex, legCycles.hl.x, legCycles.hl.y, 5);

    // --- Near Front Leg ---
    ctx.fillStyle = furColor;
    this.drawLeg(ctx, 50, -22 + spineFlex, legCycles.fl.x, legCycles.fl.y, 4.5);

    // --- Head, Neck & Ears ---
    ctx.fillStyle = furColor;
    ctx.beginPath();
    // Neck
    ctx.moveTo(48, -24 + spineFlex);
    ctx.lineTo(58, -34 + headBob); // top of head
    ctx.lineTo(68, -30 + headBob); // snout/nose
    ctx.lineTo(64, -22 + headBob); // chin
    ctx.lineTo(50, -16 + spineFlex); // throat
    ctx.closePath();
    ctx.fill();

    // Ear
    ctx.beginPath();
    ctx.arc(56, -34 + headBob, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(56, -34 + headBob, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(62, -31 + headBob, 2, 0, Math.PI * 2);
    ctx.fill();

    // Characteristic Cheetah Black Tear Mark (eye to jaw)
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(62, -30 + headBob);
    ctx.quadraticCurveTo(63, -26 + headBob, 65, -23 + headBob);
    ctx.stroke();

    // Black nose tip
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(68, -29 + headBob, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Cheetah Spots on Torso
    this.drawSpots(ctx, [
      { x: 18, y: -20 + spineFlex },
      { x: 26, y: -23 + spineFlex },
      { x: 34, y: -19 + spineFlex },
      { x: 42, y: -22 + spineFlex },
      { x: 24, y: -16 + spineFlex },
      { x: 38, y: -15 + spineFlex },
      { x: 46, y: -18 + spineFlex }
    ]);
  }

  /**
   * Leaping / Airborne Pose (aerodynamic stretch)
   */
  drawLeapPose(ctx) {
    const furColor = '#f59e0b';
    const underbellyColor = '#fef3c7';
    const spotColor = '#1c1917';

    // Tilt angle based on vertical velocity
    const tilt = Math.max(-0.25, Math.min(0.25, this.vy * 0.02));
    ctx.rotate(tilt);

    // Far Legs
    ctx.fillStyle = '#d97706';
    this.drawLeg(ctx, 16, -20, 2, -10, 4); // Back leg trailing
    this.drawLeg(ctx, 48, -22, 64, -8, 4); // Front leg reaching

    // Tail lifted high
    ctx.save();
    ctx.strokeStyle = furColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, -22);
    ctx.quadraticCurveTo(-6, -34, -14, -38);
    ctx.stroke();
    ctx.strokeStyle = spotColor;
    ctx.beginPath();
    ctx.moveTo(-10, -36);
    ctx.lineTo(-14, -38);
    ctx.stroke();
    ctx.restore();

    // Body
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(10, -22);
    ctx.quadraticCurveTo(32, -28, 52, -24);
    ctx.lineTo(52, -14);
    ctx.quadraticCurveTo(32, -12, 12, -14);
    ctx.closePath();
    ctx.fill();

    // Underbelly
    ctx.fillStyle = underbellyColor;
    ctx.beginPath();
    ctx.moveTo(20, -14);
    ctx.quadraticCurveTo(36, -13, 50, -16);
    ctx.lineTo(48, -12);
    ctx.quadraticCurveTo(34, -10, 18, -12);
    ctx.closePath();
    ctx.fill();

    // Near Legs
    ctx.fillStyle = furColor;
    this.drawLeg(ctx, 14, -20, 6, -12, 4.5);
    this.drawLeg(ctx, 50, -22, 68, -6, 4.5);

    // Head
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(48, -24);
    ctx.lineTo(58, -34);
    ctx.lineTo(70, -30);
    ctx.lineTo(66, -22);
    ctx.lineTo(50, -16);
    ctx.closePath();
    ctx.fill();

    // Ear
    ctx.beginPath();
    ctx.arc(57, -34, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(63, -31, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tear mark
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(63, -30);
    ctx.quadraticCurveTo(64, -26, 66, -23);
    ctx.stroke();

    // Nose
    ctx.beginPath();
    ctx.arc(70, -29, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Spots
    this.drawSpots(ctx, [
      { x: 18, y: -20 }, { x: 28, y: -23 }, { x: 38, y: -20 }, { x: 44, y: -22 }
    ]);
  }

  /**
   * Duck / Low Prowl Pose (Sliding beneath overhead obstacles)
   */
  drawDuckPose(ctx) {
    const furColor = '#f59e0b';
    const underbellyColor = '#fef3c7';
    const spotColor = '#1c1917';

    // Horizontal crawl frame
    const crawl = Math.floor((this.distance / 10) % 2);

    // Tail flat behind
    ctx.save();
    ctx.strokeStyle = furColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(-6, -12, -18, -10);
    ctx.stroke();
    ctx.strokeStyle = spotColor;
    ctx.beginPath();
    ctx.moveTo(-14, -11);
    ctx.lineTo(-18, -10);
    ctx.stroke();
    ctx.restore();

    // Low, streamlined torso
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(60, -12);
    ctx.lineTo(76, -10); // low head
    ctx.lineTo(76, -4);
    ctx.lineTo(60, -4);
    ctx.lineTo(8, -4);
    ctx.closePath();
    ctx.fill();

    // Underbelly
    ctx.fillStyle = underbellyColor;
    ctx.fillRect(18, -6, 44, 3);

    // Flattened ears
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(62, -13, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye focused forward
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(70, -9, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Tear mark
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(70, -8);
    ctx.lineTo(72, -5);
    ctx.stroke();

    // Paws paddling low
    ctx.fillStyle = furColor;
    const flX = crawl === 0 ? 68 : 58;
    const frX = crawl === 0 ? 58 : 68;
    const hlX = crawl === 0 ? 20 : 12;
    const hrX = crawl === 0 ? 12 : 20;

    ctx.fillRect(flX, -3, 6, 3);
    ctx.fillRect(frX, -3, 6, 3);
    ctx.fillRect(hlX, -3, 6, 3);
    ctx.fillRect(hrX, -3, 6, 3);

    // Spots
    this.drawSpots(ctx, [
      { x: 16, y: -9 }, { x: 28, y: -10 }, { x: 40, y: -9 }, { x: 52, y: -10 }
    ]);
  }

  /**
   * Stumble / Crash Game Over Pose
   */
  drawDeadPose(ctx) {
    const furColor = '#f59e0b';
    const spotColor = '#1c1917';

    ctx.rotate(0.18); // Tilted back from impact

    // Limbs splayed
    ctx.fillStyle = '#d97706';
    ctx.fillRect(10, -8, 14, 4);
    ctx.fillRect(44, -10, 16, 4);

    // Torso
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.roundRect(10, -22, 46, 16, 6);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(60, -24, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cartoon 'X' eye
    ctx.strokeStyle = spotColor;
    ctx.lineWidth = 2;
    const ex = 62;
    const ey = -24;
    ctx.beginPath();
    ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3);
    ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3);
    ctx.stroke();

    // Tear mark
    ctx.beginPath();
    ctx.moveTo(63, -20);
    ctx.lineTo(64, -15);
    ctx.stroke();

    // Drooping tail
    ctx.strokeStyle = furColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(-4, -6);
    ctx.stroke();
  }

  drawLeg(ctx, hipX, hipY, pawX, pawY, width = 4.5) {
    ctx.save();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    // Mid-joint knee bend
    const midX = (hipX + pawX) / 2 + (hipX < 30 ? -4 : 4);
    const midY = (hipY + pawY) / 2 - 2;
    ctx.moveTo(hipX, hipY);
    ctx.quadraticCurveTo(midX, midY, pawX, pawY);
    ctx.stroke();
    ctx.restore();
  }

  drawSpots(ctx, spots) {
    ctx.fillStyle = '#1c1917';
    for (const spot of spots) {
      ctx.beginPath();
      ctx.arc(spot.x, spot.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
