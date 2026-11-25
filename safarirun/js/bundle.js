(() => {
  // safarirun/js/cheetah.js
  var Cheetah = class {
    constructor(canvasWidth, groundY) {
      this.canvasWidth = canvasWidth;
      this.groundY = groundY;
      this.x = 70;
      this.y = this.groundY;
      this.normalWidth = 76;
      this.normalHeight = 44;
      this.duckWidth = 86;
      this.duckHeight = 22;
      this.width = this.normalWidth;
      this.height = this.normalHeight;
      this.vy = 0;
      this.jumpForce = -13.2;
      this.minJumpForce = -5.8;
      this.gravity = 0.64;
      this.fastFallGravity = 1.45;
      this.isGrounded = true;
      this.isJumping = false;
      this.isDucking = false;
      this.isDead = false;
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
        if (!this.isGrounded) {
          this.vy += 0.8;
        }
      } else {
        this.width = this.normalWidth;
        this.height = this.normalHeight;
      }
    }
    update(speed, dt = 1 / 60) {
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
      this.distance += speed;
      this.animFrame = Math.floor(this.distance / 12 % this.totalFrames);
      if (this.isGrounded && Math.random() < 0.4) {
        this.spawnDust(1, 0);
      }
      if (!this.isGrounded) {
        const currentGravity = this.isDucking && this.vy > 0 ? this.fastFallGravity : this.gravity;
        this.vy += currentGravity;
        this.y += this.vy;
        if (this.y >= this.groundY) {
          this.y = this.groundY;
          this.vy = 0;
          this.isGrounded = true;
          this.isJumping = false;
          this.spawnDust(5, -1);
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
          color: Math.random() > 0.4 ? "#b45309" : "#d97706"
        });
      }
    }
    getHitboxes() {
      const topY = this.y - this.height;
      if (this.isDucking) {
        return [
          { x: this.x + 4, y: topY + 4, w: this.width - 8, h: this.height - 4 }
        ];
      }
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
      ctx.save();
      for (const p of this.dustParticles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
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
      const furColor = "#f59e0b";
      const underbellyColor = "#fef3c7";
      const spotColor = "#1c1917";
      const spineFlex = [-3, 0, 3, 1, -2, -4][frame];
      const headBob = [1, 0, -2, -1, 1, 2][frame];
      const tailY = [-28, -25, -22, -26, -30, -32][frame];
      const tailAngle = [-0.1, 0.1, 0.35, 0.2, -0.05, -0.2][frame];
      const legCycles = [
        // 0: Compression (all tucked under)
        { fl: { x: 38, y: -6 }, fr: { x: 44, y: -4 }, hl: { x: 18, y: -4 }, hr: { x: 24, y: -6 } },
        // 1: Extension start (reaching)
        { fl: { x: 50, y: -2 }, fr: { x: 42, y: -8 }, hl: { x: 10, y: -8 }, hr: { x: 20, y: -4 } },
        // 2: Full Extension (flying bullet)
        { fl: { x: 62, y: 0 }, fr: { x: 54, y: -4 }, hl: { x: 4, y: -10 }, hr: { x: 12, y: -8 } },
        // 3: Front plant (front paws down, body swinging over)
        { fl: { x: 54, y: 0 }, fr: { x: 60, y: 0 }, hl: { x: 12, y: -6 }, hr: { x: 6, y: -12 } },
        // 4: Hind sweep (back paws driving ground)
        { fl: { x: 38, y: -10 }, fr: { x: 46, y: -6 }, hl: { x: 22, y: 0 }, hr: { x: 16, y: -2 } },
        // 5: Contract (springing into gather)
        { fl: { x: 30, y: -8 }, fr: { x: 36, y: -10 }, hl: { x: 26, y: -2 }, hr: { x: 20, y: -4 } }
      ][frame];
      ctx.fillStyle = "#d97706";
      this.drawLeg(ctx, 16, -20 + spineFlex, legCycles.hr.x, legCycles.hr.y, 4.5);
      ctx.fillStyle = "#d97706";
      this.drawLeg(ctx, 48, -22 + spineFlex, legCycles.fr.x, legCycles.fr.y, 4);
      ctx.save();
      ctx.strokeStyle = furColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(12, -22 + spineFlex);
      ctx.quadraticCurveTo(-4, tailY + 4, -14, tailY + tailAngle * 20);
      ctx.stroke();
      ctx.strokeStyle = spotColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-10, tailY + tailAngle * 14);
      ctx.lineTo(-14, tailY + tailAngle * 20);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.moveTo(10, -22 + spineFlex);
      ctx.quadraticCurveTo(32, -26 + spineFlex * 1.3, 52, -24 + spineFlex);
      ctx.lineTo(52, -14 + spineFlex);
      ctx.quadraticCurveTo(32, -12 + spineFlex * 0.5, 12, -14 + spineFlex);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = underbellyColor;
      ctx.beginPath();
      ctx.moveTo(20, -14 + spineFlex);
      ctx.quadraticCurveTo(36, -13 + spineFlex * 0.5, 50, -16 + spineFlex);
      ctx.lineTo(48, -12 + spineFlex);
      ctx.quadraticCurveTo(34, -10 + spineFlex * 0.5, 18, -12 + spineFlex);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = furColor;
      this.drawLeg(ctx, 14, -20 + spineFlex, legCycles.hl.x, legCycles.hl.y, 5);
      ctx.fillStyle = furColor;
      this.drawLeg(ctx, 50, -22 + spineFlex, legCycles.fl.x, legCycles.fl.y, 4.5);
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.moveTo(48, -24 + spineFlex);
      ctx.lineTo(58, -34 + headBob);
      ctx.lineTo(68, -30 + headBob);
      ctx.lineTo(64, -22 + headBob);
      ctx.lineTo(50, -16 + spineFlex);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(56, -34 + headBob, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.arc(56, -34 + headBob, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(62, -31 + headBob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spotColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(62, -30 + headBob);
      ctx.quadraticCurveTo(63, -26 + headBob, 65, -23 + headBob);
      ctx.stroke();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(68, -29 + headBob, 1.5, 0, Math.PI * 2);
      ctx.fill();
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
      const furColor = "#f59e0b";
      const underbellyColor = "#fef3c7";
      const spotColor = "#1c1917";
      const tilt = Math.max(-0.25, Math.min(0.25, this.vy * 0.02));
      ctx.rotate(tilt);
      ctx.fillStyle = "#d97706";
      this.drawLeg(ctx, 16, -20, 2, -10, 4);
      this.drawLeg(ctx, 48, -22, 64, -8, 4);
      ctx.save();
      ctx.strokeStyle = furColor;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
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
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.moveTo(10, -22);
      ctx.quadraticCurveTo(32, -28, 52, -24);
      ctx.lineTo(52, -14);
      ctx.quadraticCurveTo(32, -12, 12, -14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = underbellyColor;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.quadraticCurveTo(36, -13, 50, -16);
      ctx.lineTo(48, -12);
      ctx.quadraticCurveTo(34, -10, 18, -12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = furColor;
      this.drawLeg(ctx, 14, -20, 6, -12, 4.5);
      this.drawLeg(ctx, 50, -22, 68, -6, 4.5);
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.moveTo(48, -24);
      ctx.lineTo(58, -34);
      ctx.lineTo(70, -30);
      ctx.lineTo(66, -22);
      ctx.lineTo(50, -16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(57, -34, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(63, -31, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spotColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(63, -30);
      ctx.quadraticCurveTo(64, -26, 66, -23);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(70, -29, 1.5, 0, Math.PI * 2);
      ctx.fill();
      this.drawSpots(ctx, [
        { x: 18, y: -20 },
        { x: 28, y: -23 },
        { x: 38, y: -20 },
        { x: 44, y: -22 }
      ]);
    }
    /**
     * Duck / Low Prowl Pose (Sliding beneath overhead obstacles)
     */
    drawDuckPose(ctx) {
      const furColor = "#f59e0b";
      const underbellyColor = "#fef3c7";
      const spotColor = "#1c1917";
      const crawl = Math.floor(this.distance / 10 % 2);
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
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.moveTo(8, -12);
      ctx.lineTo(60, -12);
      ctx.lineTo(76, -10);
      ctx.lineTo(76, -4);
      ctx.lineTo(60, -4);
      ctx.lineTo(8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = underbellyColor;
      ctx.fillRect(18, -6, 44, 3);
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.ellipse(62, -13, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(70, -9, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spotColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, -8);
      ctx.lineTo(72, -5);
      ctx.stroke();
      ctx.fillStyle = furColor;
      const flX = crawl === 0 ? 68 : 58;
      const frX = crawl === 0 ? 58 : 68;
      const hlX = crawl === 0 ? 20 : 12;
      const hrX = crawl === 0 ? 12 : 20;
      ctx.fillRect(flX, -3, 6, 3);
      ctx.fillRect(frX, -3, 6, 3);
      ctx.fillRect(hlX, -3, 6, 3);
      ctx.fillRect(hrX, -3, 6, 3);
      this.drawSpots(ctx, [
        { x: 16, y: -9 },
        { x: 28, y: -10 },
        { x: 40, y: -9 },
        { x: 52, y: -10 }
      ]);
    }
    /**
     * Stumble / Crash Game Over Pose
     */
    drawDeadPose(ctx) {
      const furColor = "#f59e0b";
      const spotColor = "#1c1917";
      ctx.rotate(0.18);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(10, -8, 14, 4);
      ctx.fillRect(44, -10, 16, 4);
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.roundRect(10, -22, 46, 16, 6);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(60, -24, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = spotColor;
      ctx.lineWidth = 2;
      const ex = 62;
      const ey = -24;
      ctx.beginPath();
      ctx.moveTo(ex - 3, ey - 3);
      ctx.lineTo(ex + 3, ey + 3);
      ctx.moveTo(ex + 3, ey - 3);
      ctx.lineTo(ex - 3, ey + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(63, -20);
      ctx.lineTo(64, -15);
      ctx.stroke();
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
      ctx.lineCap = "round";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      const midX = (hipX + pawX) / 2 + (hipX < 30 ? -4 : 4);
      const midY = (hipY + pawY) / 2 - 2;
      ctx.moveTo(hipX, hipY);
      ctx.quadraticCurveTo(midX, midY, pawX, pawY);
      ctx.stroke();
      ctx.restore();
    }
    drawSpots(ctx, spots) {
      ctx.fillStyle = "#1c1917";
      for (const spot of spots) {
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // safarirun/js/obstacle.js
  var ObstacleManager = class {
    constructor(canvasWidth, groundY) {
      this.canvasWidth = canvasWidth;
      this.groundY = groundY;
      this.obstacles = [];
      this.nextSpawnDistance = 280;
      this.distanceSinceLast = 0;
    }
    reset() {
      this.obstacles = [];
      this.nextSpawnDistance = 280;
      this.distanceSinceLast = 0;
    }
    update(speed, currentScore) {
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= speed;
        if (obs.type === "vulture") {
          obs.animTick = (obs.animTick || 0) + 1;
          obs.frame = Math.floor(obs.animTick / 7) % 3;
        }
        if (obs.x + obs.width < -50) {
          this.obstacles.splice(i, 1);
        }
      }
      this.distanceSinceLast += speed;
      if (this.distanceSinceLast >= this.nextSpawnDistance) {
        this.spawnObstacle(currentScore, speed);
        this.distanceSinceLast = 0;
        const baseGap = 240 + speed * 18;
        this.nextSpawnDistance = baseGap + Math.random() * 260;
      }
    }
    spawnObstacle(currentScore, speed) {
      const types = ["baobab_small", "rock_boulder", "rock_cluster", "baobab_large", "termite_mound"];
      if (currentScore > 150) {
        types.push("baobab_twin");
      }
      if (currentScore > 200) {
        types.push("vulture", "vulture");
      }
      const type = types[Math.floor(Math.random() * types.length)];
      let obstacle = null;
      const startX = this.canvasWidth + 20;
      switch (type) {
        case "baobab_small":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 52,
            width: 38,
            height: 52
          };
          break;
        case "baobab_large":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 68,
            width: 52,
            height: 68
          };
          break;
        case "baobab_twin":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 62,
            width: 76,
            height: 62
          };
          break;
        case "rock_boulder":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 32,
            width: 42,
            height: 32
          };
          break;
        case "rock_cluster":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 26,
            width: 56,
            height: 26
          };
          break;
        case "termite_mound":
          obstacle = {
            type,
            x: startX,
            y: this.groundY - 58,
            width: 32,
            height: 58
          };
          break;
        case "vulture": {
          const altitudeRoll = Math.random();
          let altitude = "mid";
          let yOffset = 58;
          if (altitudeRoll < 0.35) {
            altitude = "low";
            yOffset = 30;
          } else if (altitudeRoll < 0.8) {
            altitude = "mid";
            yOffset = 58;
          } else {
            altitude = "high";
            yOffset = 90;
          }
          obstacle = {
            type,
            altitude,
            x: startX,
            y: this.groundY - yOffset,
            width: 46,
            height: 32,
            animTick: 0,
            frame: 0
          };
          break;
        }
      }
      if (obstacle) {
        this.obstacles.push(obstacle);
      }
    }
    getHitboxes(obs) {
      switch (obs.type) {
        case "baobab_small":
          return [
            { x: obs.x + 8, y: obs.y + 16, w: 22, h: 36 },
            // Trunk
            { x: obs.x + 2, y: obs.y + 4, w: 34, h: 20 }
            // Crown
          ];
        case "baobab_large":
          return [
            { x: obs.x + 12, y: obs.y + 20, w: 28, h: 48 },
            // Trunk
            { x: obs.x + 4, y: obs.y + 4, w: 44, h: 26 }
            // Crown
          ];
        case "baobab_twin":
          return [
            { x: obs.x + 6, y: obs.y + 18, w: 64, h: 44 },
            // Double trunk
            { x: obs.x + 2, y: obs.y + 4, w: 72, h: 24 }
            // Double crown
          ];
        case "rock_boulder":
          return [
            { x: obs.x + 4, y: obs.y + 4, w: obs.width - 8, h: obs.height - 4 }
          ];
        case "rock_cluster":
          return [
            { x: obs.x + 4, y: obs.y + 4, w: obs.width - 8, h: obs.height - 4 }
          ];
        case "termite_mound":
          return [
            { x: obs.x + 6, y: obs.y + 6, w: obs.width - 12, h: obs.height - 6 }
          ];
        case "vulture":
          return [
            { x: obs.x + 8, y: obs.y + 6, w: 30, h: 18 }
            // Vulture body & core
          ];
        default:
          return [
            { x: obs.x, y: obs.y, w: obs.width, h: obs.height }
          ];
      }
    }
    draw(ctx) {
      for (const obs of this.obstacles) {
        ctx.save();
        switch (obs.type) {
          case "baobab_small":
            this.drawBaobab(ctx, obs.x, obs.y, 38, 52);
            break;
          case "baobab_large":
            this.drawBaobab(ctx, obs.x, obs.y, 52, 68);
            break;
          case "baobab_twin":
            this.drawBaobab(ctx, obs.x, obs.y, 44, 62);
            this.drawBaobab(ctx, obs.x + 30, obs.y + 6, 38, 56);
            break;
          case "rock_boulder":
            this.drawRockBoulder(ctx, obs.x, obs.y, obs.width, obs.height);
            break;
          case "rock_cluster":
            this.drawRockCluster(ctx, obs.x, obs.y, obs.width, obs.height);
            break;
          case "termite_mound":
            this.drawTermiteMound(ctx, obs.x, obs.y, obs.width, obs.height);
            break;
          case "vulture":
            this.drawVulture(ctx, obs.x, obs.y, obs.width, obs.height, obs.frame);
            break;
        }
        ctx.restore();
      }
    }
    /**
     * Baobab Tree Renderer (Thick iconic African bulbous trunk & spreading crown)
     */
    drawBaobab(ctx, x, y, w, h) {
      const trunkColor = "#78350f";
      const trunkHighlight = "#92400e";
      const branchColor = "#451a03";
      const leafColor = "#15803d";
      const leafHighlight = "#16a34a";
      const trunkBottom = y + h;
      const trunkWidth = w * 0.58;
      const trunkCenter = x + w / 2;
      ctx.fillStyle = trunkColor;
      ctx.beginPath();
      ctx.moveTo(trunkCenter - trunkWidth * 0.6, trunkBottom);
      ctx.quadraticCurveTo(trunkCenter - trunkWidth * 0.75, y + h * 0.5, trunkCenter - trunkWidth * 0.4, y + h * 0.28);
      ctx.lineTo(trunkCenter + trunkWidth * 0.4, y + h * 0.28);
      ctx.quadraticCurveTo(trunkCenter + trunkWidth * 0.75, y + h * 0.5, trunkCenter + trunkWidth * 0.6, trunkBottom);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = trunkHighlight;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(trunkCenter - 2, trunkBottom - 4);
      ctx.quadraticCurveTo(trunkCenter - 4, y + h * 0.55, trunkCenter - 2, y + h * 0.32);
      ctx.stroke();
      ctx.strokeStyle = branchColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trunkCenter - 4, y + h * 0.3);
      ctx.quadraticCurveTo(trunkCenter - w * 0.35, y + h * 0.2, x + 4, y + 10);
      ctx.moveTo(trunkCenter + 4, y + h * 0.3);
      ctx.quadraticCurveTo(trunkCenter + w * 0.35, y + h * 0.2, x + w - 4, y + 10);
      ctx.moveTo(trunkCenter, y + h * 0.28);
      ctx.lineTo(trunkCenter, y + 6);
      ctx.stroke();
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      ctx.arc(x + 6, y + 10, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(trunkCenter, y + 6, w * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 6, y + 10, w * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = leafHighlight;
      ctx.beginPath();
      ctx.arc(trunkCenter - 2, y + 4, w * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    /**
     * African Savanna Granite Boulder
     */
    drawRockBoulder(ctx, x, y, w, h) {
      const rockBase = "#7c2d12";
      const rockLit = "#c2410c";
      const rockShadow = "#431407";
      ctx.fillStyle = rockBase;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h);
      ctx.lineTo(x + 2, y + h * 0.6);
      ctx.lineTo(x + w * 0.25, y + 4);
      ctx.lineTo(x + w * 0.75, y + 2);
      ctx.lineTo(x + w - 2, y + h * 0.5);
      ctx.lineTo(x + w - 4, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rockLit;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.25, y + 4);
      ctx.lineTo(x + w * 0.6, y + 3);
      ctx.lineTo(x + w * 0.45, y + h * 0.65);
      ctx.lineTo(x + w * 0.15, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rockShadow;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.6, y + 3);
      ctx.lineTo(x + w - 2, y + h * 0.5);
      ctx.lineTo(x + w - 4, y + h);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
    }
    /**
     * Savanna Rock Cluster
     */
    drawRockCluster(ctx, x, y, w, h) {
      this.drawRockBoulder(ctx, x, y + 4, w * 0.55, h - 4);
      this.drawRockBoulder(ctx, x + w * 0.45, y + 8, w * 0.52, h - 8);
    }
    /**
     * African Termite Mound (Tall sculpted earth chimney)
     */
    drawTermiteMound(ctx, x, y, w, h) {
      const moundEarth = "#9a3412";
      const moundHighlight = "#ea580c";
      const moundDark = "#431407";
      ctx.fillStyle = moundEarth;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + h);
      ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.5, x + w * 0.35, y + 4);
      ctx.lineTo(x + w * 0.65, y + 4);
      ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.5, x + w - 2, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = moundHighlight;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + h);
      ctx.lineTo(x + w * 0.4, y + 6);
      ctx.lineTo(x + w * 0.55, y + 6);
      ctx.lineTo(x + w * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = moundDark;
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + 16, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(x + w * 0.4, y + 34, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    /**
     * African Vulture (Flying Raptor with 3 wing flapping frames)
     */
    drawVulture(ctx, x, y, w, h, frame = 0) {
      const bodyColor = "#1e293b";
      const wingColor = "#0f172a";
      const headColor = "#dc2626";
      const beakColor = "#f59e0b";
      const wingOffsets = [
        { wy1: -14, wy2: -18, wy3: -12 },
        // Up
        { wy1: -2, wy2: -4, wy3: 0 },
        // Glide
        { wy1: 10, wy2: 14, wy3: 8 }
        // Down
      ][frame];
      const centerX = x + w * 0.45;
      const centerY = y + h * 0.55;
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 2);
      ctx.quadraticCurveTo(centerX - 8, centerY + wingOffsets.wy1, centerX - 18, centerY + wingOffsets.wy2);
      ctx.lineTo(centerX - 10, centerY + wingOffsets.wy3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 14, 7, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX + 12, centerY - 2);
      ctx.lineTo(centerX + 24, centerY + 2);
      ctx.lineTo(centerX + 22, centerY + 8);
      ctx.lineTo(centerX + 10, centerY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY);
      ctx.quadraticCurveTo(centerX - 12, centerY + wingOffsets.wy1 + 4, centerX - 22, centerY + wingOffsets.wy2 + 2);
      ctx.lineTo(centerX - 8, centerY + wingOffsets.wy3 + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY - 2);
      ctx.lineTo(centerX - 18, centerY - 8);
      ctx.lineTo(centerX - 24, centerY - 6);
      ctx.lineTo(centerX - 12, centerY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX - 22, centerY - 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = beakColor;
      ctx.beginPath();
      ctx.moveTo(centerX - 25, centerY - 8);
      ctx.lineTo(centerX - 31, centerY - 5);
      ctx.lineTo(centerX - 26, centerY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(centerX - 23, centerY - 7, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // safarirun/js/background.js
  var SafariBackground = class {
    constructor(canvasWidth, canvasHeight, groundY) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.groundY = groundY;
      this.farScroll = 0;
      this.midScroll = 0;
      this.groundScroll = 0;
      this.cloudScroll = 0;
      this.timeOfDayIndex = 0;
      this.timeOfDayProgress = 0;
      this.stars = [];
      for (let i = 0; i < 45; i++) {
        this.stars.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * (this.groundY - 90),
          size: Math.random() * 1.8 + 0.6,
          alpha: Math.random() * 0.8 + 0.2
        });
      }
      this.clouds = [
        { x: 120, y: 40, w: 90, h: 24, speed: 0.2 },
        { x: 420, y: 70, w: 120, h: 28, speed: 0.25 },
        { x: 740, y: 35, w: 80, h: 22, speed: 0.18 }
      ];
      this.groundElements = [];
      for (let i = 0; i < 28; i++) {
        this.groundElements.push({
          x: Math.random() * (this.canvasWidth + 200),
          type: Math.random() > 0.4 ? "grass" : "pebble",
          size: Math.random() * 6 + 4
        });
      }
    }
    reset() {
      this.farScroll = 0;
      this.midScroll = 0;
      this.groundScroll = 0;
      this.cloudScroll = 0;
      this.timeOfDayIndex = 0;
      this.timeOfDayProgress = 0;
    }
    update(speed, score) {
      this.farScroll = (this.farScroll + speed * 0.08) % 1800;
      this.midScroll = (this.midScroll + speed * 0.28) % 900;
      this.groundScroll = (this.groundScroll + speed) % 60;
      this.cloudScroll = (this.cloudScroll + speed * 0.12) % (this.canvasWidth + 200);
      for (const c of this.clouds) {
        c.x -= speed * 0.14;
        if (c.x + c.w < -20) {
          c.x = this.canvasWidth + Math.random() * 80;
          c.y = 25 + Math.random() * 60;
        }
      }
      for (const el of this.groundElements) {
        el.x -= speed;
        if (el.x < -20) {
          el.x = this.canvasWidth + Math.random() * 60;
        }
      }
      const cycleLength = 400;
      const totalPhase = score / cycleLength % 4;
      this.timeOfDayIndex = Math.floor(totalPhase);
      this.timeOfDayProgress = totalPhase - this.timeOfDayIndex;
    }
    getTimeOfDayName() {
      const names = ["SAVANNA NOON", "CRIMSON SUNSET", "STARLIT NIGHT", "GOLDEN DAWN"];
      return names[this.timeOfDayIndex] || "SAVANNA NOON";
    }
    draw(ctx) {
      this.drawSky(ctx);
      this.drawFarHorizon(ctx);
      this.drawMidground(ctx);
      this.drawGround(ctx);
    }
    drawSky(ctx) {
      const palettes = [
        // 0: Noon (warm amber to golden sand)
        { top: "#fed7aa", bot: "#fef3c7", sun: "#f59e0b", isNight: false },
        // 1: Sunset (purple-crimson to fiery orange)
        { top: "#701a75", bot: "#ea580c", sun: "#f97316", isNight: false },
        // 2: Night (deep navy to dark indigo)
        { top: "#090d16", bot: "#1e1b4b", sun: "#fef08a", isNight: true },
        // 3: Dawn (lavender to golden peach)
        { top: "#4c1d95", bot: "#fed7aa", sun: "#fbbf24", isNight: false }
      ];
      const current = palettes[this.timeOfDayIndex];
      const next = palettes[(this.timeOfDayIndex + 1) % palettes.length];
      const t = this.timeOfDayProgress;
      const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
      grad.addColorStop(0, this.lerpColor(current.top, next.top, t));
      grad.addColorStop(1, this.lerpColor(current.bot, next.bot, t));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.canvasWidth, this.groundY);
      if (this.timeOfDayIndex === 1 || this.timeOfDayIndex === 2 || this.timeOfDayIndex === 3) {
        let nightAlpha = 0;
        if (this.timeOfDayIndex === 2) nightAlpha = 0.85;
        else if (this.timeOfDayIndex === 1) nightAlpha = t * 0.85;
        else if (this.timeOfDayIndex === 3) nightAlpha = (1 - t) * 0.85;
        if (nightAlpha > 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          for (const star of this.stars) {
            ctx.globalAlpha = star.alpha * nightAlpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      ctx.save();
      if (current.isNight || this.timeOfDayIndex === 1 && t > 0.6 || this.timeOfDayIndex === 3 && t < 0.4) {
        ctx.fillStyle = "#fef08a";
        ctx.shadowColor = "rgba(254, 240, 138, 0.6)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 110, 50, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = current.top;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 118, 46, 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = current.sun;
        ctx.shadowColor = current.sun;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(this.canvasWidth - 120, 60, 26, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = current.isNight ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.55)";
      for (const c of this.clouds) {
        this.drawCloud(ctx, c.x, c.y, c.w, c.h);
      }
      ctx.restore();
    }
    drawCloud(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.arc(x + w * 0.25, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
      ctx.arc(x + w * 0.5, y + h * 0.35, h * 0.6, 0, Math.PI * 2);
      ctx.arc(x + w * 0.75, y + h * 0.5, h * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFarHorizon(ctx) {
      ctx.save();
      const horizonY = this.groundY - 10;
      const isNight = this.timeOfDayIndex === 2;
      const mountainColor = isNight ? "#1e1b4b" : "#9a3412";
      const snowColor = isNight ? "#94a3b8" : "#ffffff";
      const baseOffset = -this.farScroll;
      for (let loop = 0; loop < 3; loop++) {
        const startX = baseOffset + loop * 900;
        if (startX > this.canvasWidth || startX + 900 < 0) continue;
        const kiliX = startX + 280;
        const kiliPeakY = horizonY - 110;
        ctx.fillStyle = mountainColor;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(kiliX - 180, horizonY);
        ctx.quadraticCurveTo(kiliX - 70, horizonY - 60, kiliX - 35, kiliPeakY);
        ctx.lineTo(kiliX + 35, kiliPeakY);
        ctx.quadraticCurveTo(kiliX + 70, horizonY - 60, kiliX + 180, horizonY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = snowColor;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(kiliX - 35, kiliPeakY);
        ctx.lineTo(kiliX + 35, kiliPeakY);
        ctx.lineTo(kiliX + 28, kiliPeakY + 12);
        ctx.lineTo(kiliX + 10, kiliPeakY + 8);
        ctx.lineTo(kiliX - 10, kiliPeakY + 14);
        ctx.lineTo(kiliX - 28, kiliPeakY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = isNight ? "#0f172a" : "#451a03";
        ctx.globalAlpha = 0.4;
        this.drawDistantAcacia(ctx, startX + 100, horizonY - 36, 42);
        this.drawDistantAcacia(ctx, startX + 680, horizonY - 32, 38);
        this.drawDistantGiraffe(ctx, startX + 540, horizonY - 38);
        this.drawDistantElephant(ctx, startX + 780, horizonY - 24);
      }
      ctx.restore();
    }
    drawDistantAcacia(ctx, x, y, size) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.quadraticCurveTo(x + 4, y + size * 0.5, x, y + size * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + 4, y + size * 0.25, size * 0.55, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawDistantGiraffe(ctx, x, y) {
      ctx.beginPath();
      ctx.ellipse(x, y + 24, 12, 6, -0.2, 0, Math.PI * 2);
      ctx.moveTo(x + 6, y + 22);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x + 16, y);
      ctx.lineTo(x + 10, y + 26);
      ctx.arc(x + 14, y, 2.5, 0, Math.PI * 2);
      ctx.moveTo(x - 6, y + 24);
      ctx.lineTo(x - 6, y + 38);
      ctx.moveTo(x + 6, y + 24);
      ctx.lineTo(x + 6, y + 38);
      ctx.stroke();
      ctx.fill();
    }
    drawDistantElephant(ctx, x, y) {
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 14, 10, 0, 0, Math.PI * 2);
      ctx.arc(x - 12, y + 10, 7, 0, Math.PI * 2);
      ctx.moveTo(x - 16, y + 10);
      ctx.quadraticCurveTo(x - 20, y + 16, x - 18, y + 24);
      ctx.rect(x - 10, y + 16, 5, 8);
      ctx.rect(x + 5, y + 16, 5, 8);
      ctx.fill();
      ctx.stroke();
    }
    drawMidground(ctx) {
      ctx.save();
      const isNight = this.timeOfDayIndex === 2;
      ctx.fillStyle = isNight ? "#1e293b" : "#b45309";
      ctx.globalAlpha = 0.55;
      const baseOffset = -this.midScroll;
      for (let loop = 0; loop < 2; loop++) {
        const startX = baseOffset + loop * 900;
        ctx.beginPath();
        ctx.moveTo(startX, this.groundY);
        ctx.quadraticCurveTo(startX + 220, this.groundY - 30, startX + 450, this.groundY - 10);
        ctx.quadraticCurveTo(startX + 680, this.groundY - 26, startX + 900, this.groundY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    drawGround(ctx) {
      const isNight = this.timeOfDayIndex === 2;
      const earthBase = isNight ? "#1e1b4b" : "#78350f";
      const earthSurface = isNight ? "#312e81" : "#d97706";
      const grassColor = isNight ? "#064e3b" : "#65a30d";
      ctx.fillStyle = earthBase;
      ctx.fillRect(0, this.groundY, this.canvasWidth, this.canvasHeight - this.groundY);
      ctx.fillStyle = earthSurface;
      ctx.fillRect(0, this.groundY - 3, this.canvasWidth, 3);
      ctx.strokeStyle = isNight ? "#3730a3" : "#b45309";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = -this.groundScroll; x < this.canvasWidth + 60; x += 45) {
        ctx.moveTo(x, this.groundY + 8);
        ctx.lineTo(x + 16, this.groundY + 8);
        ctx.moveTo(x + 22, this.groundY + 16);
        ctx.lineTo(x + 32, this.groundY + 16);
      }
      ctx.stroke();
      for (const el of this.groundElements) {
        if (el.x > -20 && el.x < this.canvasWidth + 20) {
          if (el.type === "grass") {
            ctx.strokeStyle = grassColor;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(el.x, this.groundY);
            ctx.lineTo(el.x - 3, this.groundY - el.size);
            ctx.moveTo(el.x + 2, this.groundY);
            ctx.lineTo(el.x + 1, this.groundY - el.size * 1.2);
            ctx.moveTo(el.x + 4, this.groundY);
            ctx.lineTo(el.x + 6, this.groundY - el.size * 0.9);
            ctx.stroke();
          } else {
            ctx.fillStyle = isNight ? "#475569" : "#92400e";
            ctx.beginPath();
            ctx.ellipse(el.x, this.groundY + 3, el.size * 0.6, el.size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    lerpColor(a, b, t) {
      const ah = parseInt(a.replace("#", ""), 16);
      const bh = parseInt(b.replace("#", ""), 16);
      const ar = ah >> 16 & 255;
      const ag = ah >> 8 & 255;
      const ab = ah & 255;
      const br = bh >> 16 & 255;
      const bg = bh >> 8 & 255;
      const bb = bh & 255;
      const rr = Math.round(ar + (br - ar) * t);
      const rg = Math.round(ag + (bg - ag) * t);
      const rb = Math.round(ab + (bb - ab) * t);
      return `rgb(${rr}, ${rg}, ${rb})`;
    }
  };

  // safarirun/js/audio.js
  var SoundEngine = class {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      try {
        const saved = localStorage.getItem("retro_arcade_sound_safarirun");
        if (saved !== null) this.enabled = saved === "true";
      } catch (_) {
      }
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      try {
        localStorage.setItem("retro_arcade_sound_safarirun", String(this.enabled));
      } catch (_) {
      }
      return this.enabled;
    }
    playTone(freq, type = "sine", duration = 0.1, startVol = 0.25, endVol = 0.01) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(startVol, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(endVol, 1e-4), now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {
      }
    }
    jump() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (_) {
      }
    }
    duck() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (_) {
      }
    }
    milestone() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [
          { f: 1046.5, t: now, d: 0.12 },
          { f: 1567.98, t: now + 0.12, d: 0.22 }
        ].forEach((note) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(note.f, note.t);
          gain.gain.setValueAtTime(0.12, note.t);
          gain.gain.exponentialRampToValueAtTime(1e-3, note.t + note.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(note.t);
          osc.stop(note.t + note.d);
        });
      } catch (_) {
      }
    }
    hit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      } catch (_) {
      }
    }
  };
  var sound = new SoundEngine();

  // safarirun/js/game.js
  var STATES = {
    READY: "READY",
    RUNNING: "RUNNING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
  };
  var SafariRunGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.width = 900;
      this.height = 300;
      this.groundY = 240;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.cheetah = new Cheetah(this.width, this.groundY);
      this.obstacles = new ObstacleManager(this.width, this.groundY);
      this.background = new SafariBackground(this.width, this.height, this.groundY);
      this.state = STATES.READY;
      this.score = 0;
      this.distanceAccumulator = 0;
      this.lastMilestone = 0;
      this.baseSpeed = 6.5;
      this.currentSpeed = this.baseSpeed;
      this.maxSpeed = 13.5;
      this.lastTime = 0;
      this.accumulator = 0;
      this.fixedStep = 1 / 60;
      this.animId = null;
      this.render();
    }
    start() {
      if (this.state === STATES.RUNNING) return;
      this.state = STATES.RUNNING;
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
    }
    reset() {
      this.state = STATES.READY;
      this.score = 0;
      this.distanceAccumulator = 0;
      this.lastMilestone = 0;
      this.currentSpeed = this.baseSpeed;
      this.cheetah.reset();
      this.obstacles.reset();
      this.background.reset();
      if (this.options.onScore) this.options.onScore(0);
      if (this.options.onSpeed) this.options.onSpeed(60, 0.2);
      if (this.options.onTimeOfDay) this.options.onTimeOfDay("SAVANNA NOON");
      this.render();
    }
    jump() {
      if (this.state === STATES.READY) {
        this.start();
        sound.jump();
        this.cheetah.jump();
        return;
      }
      if (this.state === STATES.GAME_OVER) {
        this.reset();
        this.start();
        sound.jump();
        this.cheetah.jump();
        return;
      }
      if (this.state === STATES.RUNNING) {
        if (this.cheetah.jump()) {
          sound.jump();
        }
      }
    }
    cutJump() {
      if (this.state === STATES.RUNNING) {
        this.cheetah.cutJump();
      }
    }
    duck(isDown) {
      if (this.state === STATES.RUNNING) {
        this.cheetah.duck(isDown);
        if (isDown) sound.duck();
      }
    }
    togglePause() {
      if (this.state === STATES.RUNNING) {
        this.state = STATES.PAUSED;
        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
        return true;
      } else if (this.state === STATES.PAUSED) {
        this.state = STATES.RUNNING;
        this.lastTime = performance.now();
        this.animId = requestAnimationFrame(this.loop);
        return false;
      }
      return false;
    }
    loop(currentTime) {
      if (this.state !== STATES.RUNNING) return;
      const frameTime = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      this.accumulator += frameTime;
      while (this.accumulator >= this.fixedStep) {
        this.update(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
      this.render();
      if (this.state === STATES.RUNNING) {
        this.animId = requestAnimationFrame(this.loop);
      }
    }
    update(dt) {
      this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + this.score * 35e-4);
      const speedRatio = (this.currentSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
      const cheetahKmH = Math.round(60 + speedRatio * 60);
      if (this.options.onSpeed) {
        this.options.onSpeed(cheetahKmH, 0.2 + speedRatio * 0.8);
      }
      this.background.update(this.currentSpeed, this.score);
      this.cheetah.update(this.currentSpeed, dt);
      this.obstacles.update(this.currentSpeed, this.score);
      this.distanceAccumulator += this.currentSpeed * 0.06;
      const newScore = Math.floor(this.distanceAccumulator);
      if (newScore !== this.score) {
        this.score = newScore;
        if (this.options.onScore) this.options.onScore(this.score);
        if (this.score >= this.lastMilestone + 100) {
          this.lastMilestone = Math.floor(this.score / 100) * 100;
          sound.milestone();
          if (this.options.onMilestone) this.options.onMilestone(this.lastMilestone);
        }
      }
      if (this.options.onTimeOfDay) {
        this.options.onTimeOfDay(this.background.getTimeOfDayName());
      }
      this.checkCollisions();
    }
    checkCollisions() {
      const cheetahBoxes = this.cheetah.getHitboxes();
      for (const obs of this.obstacles.obstacles) {
        const obsBoxes = this.obstacles.getHitboxes(obs);
        for (const cb of cheetahBoxes) {
          for (const ob of obsBoxes) {
            if (cb.x < ob.x + ob.w && cb.x + cb.w > ob.x && cb.y < ob.y + ob.h && cb.y + cb.h > ob.y) {
              this.handleCrash();
              return;
            }
          }
        }
      }
    }
    handleCrash() {
      this.state = STATES.GAME_OVER;
      this.cheetah.isDead = true;
      sound.hit();
      const speedTier = Math.min(10, Math.max(1, Math.floor(this.score / 200) + 1));
      if (this.options.onGameOver) {
        this.options.onGameOver(this.score, speedTier);
      }
      this.render();
    }
    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.background.draw(this.ctx);
      this.obstacles.draw(this.ctx);
      this.cheetah.draw(this.ctx);
      if (this.state === STATES.READY) {
        this.drawPrompt("PRESS SPACE OR TAP TO SPRINT", "LEAP OVER BAOBABS & DUCK UNDER VULTURES");
      } else if (this.state === STATES.PAUSED) {
        this.drawPrompt("GAME PAUSED", "PRESS P OR PAUSE BUTTON TO RESUME");
      }
    }
    drawPrompt(mainText, subText) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(15, 12, 10, 0.65)";
      this.ctx.fillRect(0, 80, this.width, 100);
      this.ctx.fillStyle = "#f59e0b";
      this.ctx.font = '16px "Press Start 2P", monospace';
      this.ctx.textAlign = "center";
      this.ctx.shadowColor = "rgba(245, 158, 11, 0.8)";
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(mainText, this.width / 2, 126);
      this.ctx.fillStyle = "#f5f5f4";
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(subText, this.width / 2, 154);
      this.ctx.restore();
    }
  };

  // safarirun/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
    getHighScore(gameId = "safarirun") {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
        return val ? parseInt(val, 10) : 0;
      } catch {
        return 0;
      }
    },
    setHighScore(gameId = "safarirun", score) {
      try {
        const current = this.getHighScore(gameId);
        if (score > current) {
          localStorage.setItem(`${STORAGE_PREFIX}high_${gameId}`, score.toString());
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    getSetting(key, defaultValue) {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}opt_${key}`);
        return val !== null ? JSON.parse(val) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    setSetting(key, value) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}opt_${key}`, JSON.stringify(value));
      } catch {
      }
    }
  };
  async function recordGameActivity(data) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data)
      });
    } catch (_) {
    }
  }

  // safarirun/js/main.js
  var SafariRunApp = class {
    constructor() {
      this.gameId = "safarirun";
      this.gameInstance = null;
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.canvas = document.getElementById("safari-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.milestoneBadge = document.getElementById("milestone-badge");
      this.speedBarFill = document.getElementById("speed-bar-fill");
      this.speedText = document.getElementById("speed-text");
      this.timeOfDayLabel = document.getElementById("time-of-day-label");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayTitle = document.getElementById("overlay-title");
      this.overlaySub = document.getElementById("overlay-sub");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.btnVirtualJump = document.getElementById("btn-virtual-jump");
      this.btnVirtualDuck = document.getElementById("btn-virtual-duck");
      this.highScore = storage.getHighScore(this.gameId);
      this.init();
    }
    init() {
      this.applySettings();
      this.setupGame();
      this.bindEvents();
    }
    applySettings() {
      this.soundIcon.textContent = this.soundEnabled ? "\u{1F50A}" : "\u{1F507}";
      this.btnToggleSound.classList.toggle("active", this.soundEnabled);
      this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
      this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
      this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
    }
    setupGame() {
      this.gameInstance = new SafariRunGame(this.canvas, {
        onScore: (score) => {
          this.hudScore.textContent = score.toString().padStart(5, "0");
          if (score > this.highScore) {
            this.highScore = score;
            this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
            storage.setHighScore(this.gameId, this.highScore);
          }
        },
        onMilestone: (milestone) => {
          this.hudScore.classList.add("flash");
          this.milestoneBadge.textContent = `\u2605 +${milestone} SAFARI PTS \u2605`;
          this.milestoneBadge.classList.add("show");
          setTimeout(() => {
            this.hudScore.classList.remove("flash");
            this.milestoneBadge.classList.remove("show");
          }, 1800);
        },
        onSpeed: (speedKmH, fillRatio) => {
          this.speedText.textContent = `${speedKmH} KM/H`;
          this.speedBarFill.style.width = `${Math.min(100, Math.round(fillRatio * 100))}%`;
        },
        onTimeOfDay: (name) => {
          this.timeOfDayLabel.textContent = name;
        },
        onGameOver: (finalScore, speedTier) => {
          this.handleGameOver(finalScore, speedTier);
        }
      });
    }
    handleGameOver(score, speedTier) {
      if (score > this.highScore) {
        this.highScore = score;
        storage.setHighScore(this.gameId, this.highScore);
        this.hudHighScore.textContent = this.highScore.toString().padStart(5, "0");
      }
      this.overlayTitle.textContent = "GAME OVER";
      this.overlaySub.textContent = `DISTANCE: ${score.toLocaleString()} PTS \u2022 VELOCITY TIER ${speedTier}`;
      this.gameOverlay.classList.add("visible");
      recordGameActivity({
        gameId: "safarirun",
        level: speedTier,
        score,
        status: "complete",
        result: "GAME OVER"
      });
    }
    bindEvents() {
      this.btnToggleSound.addEventListener("click", () => {
        this.soundEnabled = sound.toggle();
        storage.setSetting("sound_enabled", this.soundEnabled);
        this.applySettings();
      });
      this.btnToggleCrt.addEventListener("click", () => {
        this.crtEnabled = !this.crtEnabled;
        storage.setSetting("crt_enabled", this.crtEnabled);
        this.applySettings();
      });
      const btnBypassRotate = document.getElementById("btn-bypass-rotate");
      if (btnBypassRotate) {
        btnBypassRotate.addEventListener("click", () => {
          document.body.classList.add("portrait-bypassed");
        });
      }
      this.btnPauseGame.addEventListener("click", () => {
        if (this.gameInstance) {
          const isPaused = this.gameInstance.togglePause();
          this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
        }
      });
      const doRestart = () => {
        this.gameOverlay.classList.remove("visible");
        if (this.gameInstance) {
          this.gameInstance.reset();
          this.gameInstance.start();
          this.btnPauseGame.textContent = "PAUSE";
        }
      };
      this.btnRestartGame.addEventListener("click", doRestart);
      this.overlayRestartBtn.addEventListener("click", doRestart);
      window.addEventListener("keydown", (e) => {
        if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) {
            doRestart();
          } else {
            this.gameInstance.jump();
            this.btnVirtualJump.classList.add("pressed");
          }
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          this.gameInstance.duck(true);
          this.btnVirtualDuck.classList.add("pressed");
        } else if (e.code === "KeyP") {
          if (this.gameInstance) {
            const isPaused = this.gameInstance.togglePause();
            this.btnPauseGame.textContent = isPaused ? "RESUME" : "PAUSE";
          }
        } else if (e.code === "KeyM") {
          this.btnToggleSound.click();
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
      window.addEventListener("keyup", (e) => {
        if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
          this.gameInstance.cutJump();
          this.btnVirtualJump.classList.remove("pressed");
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          this.gameInstance.duck(false);
          this.btnVirtualDuck.classList.remove("pressed");
        }
      });
      const jumpStart = (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.jump();
          this.btnVirtualJump.classList.add("pressed");
        }
      };
      const jumpEnd = (e) => {
        e.preventDefault();
        this.gameInstance.cutJump();
        this.btnVirtualJump.classList.remove("pressed");
      };
      this.btnVirtualJump.addEventListener("pointerdown", jumpStart);
      this.btnVirtualJump.addEventListener("pointerup", jumpEnd);
      this.btnVirtualJump.addEventListener("pointercancel", jumpEnd);
      const duckStart = (e) => {
        e.preventDefault();
        sound.init();
        this.gameInstance.duck(true);
        this.btnVirtualDuck.classList.add("pressed");
      };
      const duckEnd = (e) => {
        e.preventDefault();
        this.gameInstance.duck(false);
        this.btnVirtualDuck.classList.remove("pressed");
      };
      this.btnVirtualDuck.addEventListener("pointerdown", duckStart);
      this.btnVirtualDuck.addEventListener("pointerup", duckEnd);
      this.btnVirtualDuck.addEventListener("pointercancel", duckEnd);
      this.canvas.addEventListener("pointerdown", (e) => {
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.jump();
        }
      });
    }
  };
  function boot() {
    new SafariRunApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
