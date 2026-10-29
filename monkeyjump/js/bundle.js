(() => {
  // monkeyjump/js/entities.js
  var Girder = class {
    constructor(x1, y1, x2, y2, height = 12) {
      this.x1 = Math.min(x1, x2);
      this.y1 = x1 < x2 ? y1 : y2;
      this.x2 = Math.max(x1, x2);
      this.y2 = x1 < x2 ? y2 : y1;
      this.height = height;
    }
    containsX(x) {
      return x >= this.x1 && x <= this.x2;
    }
    getY(x) {
      if (this.x2 === this.x1) return this.y1;
      const t = Math.max(0, Math.min(1, (x - this.x1) / (this.x2 - this.x1)));
      return this.y1 + t * (this.y2 - this.y1);
    }
    render(ctx) {
      ctx.save();
      const x1 = this.x1;
      const y1 = this.y1;
      const x2 = this.x2;
      const y2 = this.y2;
      const h = this.height;
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, y2 + h);
      ctx.lineTo(x1, y1 + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#fda4af";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 1);
      ctx.lineTo(x2, y2 + 1);
      ctx.stroke();
      const span = x2 - x1;
      const steps = Math.floor(span / 16);
      ctx.strokeStyle = "#9f1239";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < steps; i++) {
        const sx = x1 + i * 16;
        const sy = this.getY(sx);
        const ex = sx + 16;
        const ey = this.getY(ex);
        ctx.beginPath();
        ctx.moveTo(sx, sy + 2);
        ctx.lineTo(ex, ey + h - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex, ey + 2);
        ctx.lineTo(sx, sy + h - 2);
        ctx.stroke();
        ctx.fillStyle = "#ffe4e6";
        ctx.fillRect(sx + 1, sy + 3, 2, 2);
        ctx.fillRect(sx + 1, sy + h - 5, 2, 2);
      }
      ctx.restore();
    }
  };
  var Ladder = class {
    constructor(x, yTop, yBottom, isBroken = false) {
      this.x = x;
      this.yTop = Math.min(yTop, yBottom);
      this.yBottom = Math.max(yTop, yBottom);
      this.width = 16;
      this.isBroken = isBroken;
    }
    contains(px, py, padX = 14, padY = 24) {
      return Math.abs(px - this.x) <= padX && py >= this.yTop - padY && py <= this.yBottom + padY;
    }
    render(ctx) {
      ctx.save();
      const half = this.width / 2;
      const x = this.x;
      const yTop = this.yTop;
      const yBottom = this.yBottom;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      if (!this.isBroken) {
        ctx.beginPath();
        ctx.moveTo(x - half, yTop);
        ctx.lineTo(x - half, yBottom);
        ctx.moveTo(x + half, yTop);
        ctx.lineTo(x + half, yBottom);
        ctx.stroke();
        const rungDist = 8;
        for (let y = yTop + 4; y < yBottom; y += rungDist) {
          ctx.beginPath();
          ctx.moveTo(x - half, y);
          ctx.lineTo(x + half, y);
          ctx.stroke();
        }
      } else {
        const gapY1 = yTop + (yBottom - yTop) * 0.35;
        const gapY2 = yTop + (yBottom - yTop) * 0.65;
        ctx.beginPath();
        ctx.moveTo(x - half, yTop);
        ctx.lineTo(x - half, gapY1);
        ctx.moveTo(x + half, yTop);
        ctx.lineTo(x + half, gapY1);
        ctx.stroke();
        for (let y = yTop + 4; y < gapY1; y += 8) {
          ctx.beginPath();
          ctx.moveTo(x - half, y);
          ctx.lineTo(x + half, y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x - half, gapY2);
        ctx.lineTo(x - half, yBottom);
        ctx.moveTo(x + half, gapY2);
        ctx.lineTo(x + half, yBottom);
        ctx.stroke();
        for (let y = gapY2 + 4; y < yBottom; y += 8) {
          ctx.beginPath();
          ctx.moveTo(x - half, y);
          ctx.lineTo(x + half, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  };
  var Kong = class {
    constructor(x = 60, y = 100) {
      this.x = x;
      this.y = y;
      this.width = 64;
      this.height = 54;
      this.state = "IDLE";
      this.timer = 0;
      this.chestBeatFrame = 0;
      this.hasBarrelInHand = false;
    }
    update(dt, onBeat, onToss) {
      this.timer += dt;
      if (this.state === "IDLE") {
        if (this.timer > 1.8) {
          this.state = "CHEST_BEAT";
          this.timer = 0;
          this.chestBeatFrame = 0;
        }
      } else if (this.state === "CHEST_BEAT") {
        if (this.timer > 0.16) {
          this.timer = 0;
          this.chestBeatFrame++;
          if (typeof onBeat === "function") onBeat();
          if (this.chestBeatFrame >= 4) {
            this.state = "REACH";
            this.timer = 0;
          }
        }
      } else if (this.state === "REACH") {
        if (this.timer > 0.4) {
          this.state = "LIFT";
          this.hasBarrelInHand = true;
          this.timer = 0;
        }
      } else if (this.state === "LIFT") {
        if (this.timer > 0.5) {
          this.state = "TOSS";
          this.timer = 0;
          this.hasBarrelInHand = false;
          if (typeof onToss === "function") onToss(this.x + 48, this.y + 36);
        }
      } else if (this.state === "TOSS") {
        if (this.timer > 0.4) {
          this.state = "IDLE";
          this.timer = 0;
        }
      }
    }
    render(ctx) {
      ctx.save();
      const x = this.x;
      const y = this.y;
      ctx.fillStyle = "#b45309";
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.5;
      [-24, -24].forEach((bx, idx) => {
        const by = y + 16 + idx * 16;
        ctx.beginPath();
        ctx.ellipse(x + bx, by, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(x + bx - 8, by - 2, 16, 4);
        ctx.fillStyle = "#b45309";
      });
      ctx.fillStyle = "#5c2c16";
      ctx.strokeStyle = "#381607";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 14, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(x + 34, y + 16, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 28, y + 11, 4, 4);
      ctx.fillRect(x + 36, y + 11, 4, 4);
      ctx.fillStyle = "#000000";
      ctx.fillRect(x + 30, y + 12, 2, 2);
      ctx.fillRect(x + 38, y + 12, 2, 2);
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + 34, y + 20, 6, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = "#5c2c16";
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 36, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d97706";
      ctx.beginPath();
      ctx.ellipse(x + 32, y + 35, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5c2c16";
      if (this.state === "CHEST_BEAT") {
        const beatOffset = this.chestBeatFrame % 2 === 0 ? -4 : 4;
        ctx.fillRect(x + 16 + beatOffset, y + 28, 12, 12);
        ctx.fillRect(x + 36 - beatOffset, y + 28, 12, 12);
      } else if (this.state === "LIFT") {
        ctx.fillRect(x + 14, y + 4, 10, 24);
        ctx.fillRect(x + 40, y + 4, 10, 24);
        ctx.fillStyle = "#b45309";
        ctx.beginPath();
        ctx.ellipse(x + 32, y - 4, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.stroke();
      } else if (this.state === "REACH") {
        ctx.fillRect(x + 4, y + 24, 20, 10);
        ctx.fillRect(x + 42, y + 28, 12, 16);
      } else {
        ctx.fillRect(x + 10, y + 26, 10, 20);
        ctx.fillRect(x + 44, y + 26, 10, 20);
      }
      ctx.restore();
    }
  };
  var Barrel = class {
    constructor(x, y, speed = 2.2) {
      this.x = x;
      this.y = y;
      this.radius = 9;
      this.speed = speed;
      this.vx = speed;
      this.vy = 0;
      this.rotation = 0;
      this.currentGirder = null;
      this.state = "ROLLING";
      this.ladderTargetY = null;
      this.hoppedByPlayer = false;
      this.active = true;
    }
    update(girders, ladders) {
      if (!this.active) return;
      if (this.state === "ROLLING") {
        this.rotation += this.vx > 0 ? 0.2 : -0.2;
        this.x += this.vx;
        const rollLadder = ladders.find((l) => !l.isBroken && Math.abs(this.x - l.x) < 4 && Math.abs(this.y - l.yTop) < 14);
        if (rollLadder && Math.random() < 0.25) {
          this.state = "LADDER_DOWN";
          this.x = rollLadder.x;
          this.ladderTargetY = rollLadder.yBottom;
          this.vy = 3;
          return;
        }
        let onGirder = null;
        for (const g of girders) {
          if (g.containsX(this.x)) {
            const expectedY = g.getY(this.x) - this.radius;
            if (Math.abs(this.y - expectedY) < 16) {
              onGirder = g;
              this.y = expectedY;
              break;
            }
          }
        }
        if (!onGirder) {
          this.state = "FALLING";
          this.vy = 2;
        } else {
          this.currentGirder = onGirder;
        }
      } else if (this.state === "FALLING") {
        this.vy += 0.35;
        this.y += this.vy;
        for (const g of girders) {
          if (g.containsX(this.x)) {
            const expectedY = g.getY(this.x) - this.radius;
            if (this.y >= expectedY - 6 && this.y <= expectedY + 12) {
              this.y = expectedY;
              this.vy = 0;
              this.vx = -this.vx;
              this.state = "ROLLING";
              this.currentGirder = g;
              break;
            }
          }
        }
        if (this.y > 660) {
          this.active = false;
        }
      } else if (this.state === "LADDER_DOWN") {
        this.y += this.vy;
        this.rotation += 0.3;
        if (this.ladderTargetY && this.y >= this.ladderTargetY - this.radius) {
          this.y = this.ladderTargetY - this.radius;
          this.vy = 0;
          this.vx = -this.vx;
          this.state = "ROLLING";
          this.ladderTargetY = null;
        }
      }
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.radius + 2, -3);
      ctx.lineTo(this.radius - 2, -3);
      ctx.moveTo(-this.radius + 2, 3);
      ctx.lineTo(this.radius - 2, 3);
      ctx.moveTo(0, -this.radius + 1);
      ctx.lineTo(0, this.radius - 1);
      ctx.stroke();
      ctx.restore();
    }
  };
  var HammerItem = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 16;
      this.height = 18;
      this.active = true;
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      const x = this.x;
      const y = this.y;
      ctx.fillStyle = "#d97706";
      ctx.fillRect(x + 7, y + 6, 4, 12);
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.fillRect(x + 2, y, 14, 7);
      ctx.strokeRect(x + 2, y, 14, 7);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 4, y + 2, 3, 2);
      ctx.restore();
    }
  };
  var BonusItem = class {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.width = 18;
      this.height = 18;
      this.active = true;
      this.points = 300;
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.type === "PARASOL") {
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(9, 7, 7, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(9, 7);
        ctx.lineTo(9, 15);
        ctx.arc(7, 15, 2, 0, Math.PI);
        ctx.stroke();
      } else if (this.type === "PURSE") {
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(3, 5, 12, 10);
        ctx.fillStyle = "#fde047";
        ctx.fillRect(7, 9, 4, 3);
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(3, 5, 12, 10);
        ctx.beginPath();
        ctx.arc(9, 5, 4, Math.PI, 0);
        ctx.stroke();
      } else if (this.type === "HAT") {
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(2, 10, 14, 3);
        ctx.beginPath();
        ctx.ellipse(9, 8, 5, 5, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(5, 9, 8, 2);
      }
      ctx.restore();
    }
  };
  var Fireball = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 16;
      this.height = 16;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * 1.3;
      this.vy = 0;
      this.animTimer = 0;
      this.active = true;
      this.climbing = false;
    }
    update(dt, girders, ladders, jumpmanX) {
      if (!this.active) return;
      this.animTimer += dt * 8;
      if (!this.climbing) {
        this.x += this.vx;
        if (this.x < 24) {
          this.x = 24;
          this.vx = Math.abs(this.vx);
        } else if (this.x > 450) {
          this.x = 450;
          this.vx = -Math.abs(this.vx);
        }
        const ladder = ladders.find((l) => !l.isBroken && Math.abs(this.x - l.x) < 6 && Math.abs(this.y + 16 - l.yBottom) < 10);
        if (ladder && Math.random() < 0.015) {
          this.climbing = true;
          this.x = ladder.x - 8;
          this.vy = -1.2;
        }
      } else {
        this.y += this.vy;
        const atTop = girders.some((g) => g.containsX(this.x + 8) && Math.abs(this.y + 16 - g.getY(this.x + 8)) < 6);
        if (atTop) {
          this.climbing = false;
          this.vy = 0;
          this.vx = this.x < jumpmanX ? 1.3 : -1.3;
        }
      }
    }
    render(ctx) {
      if (!this.active) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      const frame = Math.floor(this.animTimer) % 2;
      ctx.fillStyle = frame === 0 ? "#38bdf8" : "#f59e0b";
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = frame === 0 ? "#0284c7" : "#ef4444";
      ctx.beginPath();
      ctx.moveTo(3, 8);
      ctx.lineTo(8, 0);
      ctx.lineTo(13, 8);
      ctx.lineTo(11, 15);
      ctx.lineTo(5, 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(5, 6, 2, 3);
      ctx.fillRect(9, 6, 2, 3);
      ctx.fillStyle = "#000000";
      ctx.fillRect(5, 7, 1, 2);
      ctx.fillRect(9, 7, 1, 2);
      ctx.restore();
    }
  };
  var Penny = class {
    constructor(x = 230, y = 56) {
      this.x = x;
      this.y = y;
      this.width = 20;
      this.height = 24;
      this.timer = 0;
    }
    update(dt) {
      this.timer += dt;
    }
    render(ctx) {
      ctx.save();
      const x = this.x;
      const y = this.y;
      const pulse = 1 + Math.sin(this.timer * 6) * 0.15;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 14, y - 28, 48, 16);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 14, y - 28, 48, 16);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 8px monospace";
      ctx.fillText("HELP! \u2764\uFE0F", x - 10, y - 16);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(x + 3, y, 14, 8);
      ctx.fillStyle = "#fed7aa";
      ctx.fillRect(x + 5, y + 4, 10, 6);
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 10);
      ctx.lineTo(x + 16, y + 10);
      ctx.lineTo(x + 19, y + 24);
      ctx.lineTo(x + 1, y + 24);
      ctx.closePath();
      ctx.fill();
      const armOffset = Math.sin(this.timer * 8) > 0 ? -4 : 0;
      ctx.fillStyle = "#fed7aa";
      ctx.fillRect(x + 1, y + 8 + armOffset, 3, 6);
      ctx.fillRect(x + 16, y + 8 - armOffset, 3, 6);
      ctx.restore();
    }
  };
  var Jumpman = class {
    constructor(x = 40, y = 576) {
      this.x = x;
      this.y = y;
      this.width = 18;
      this.height = 24;
      this.vx = 0;
      this.vy = 0;
      this.facing = "RIGHT";
      this.state = "GROUNDED";
      this.currentGirder = null;
      this.currentLadder = null;
      this.walkAnimTimer = 0;
      this.hammerTimer = 0;
      this.hammerSwingUp = true;
      this.hammerSwingTimer = 0;
      this.jumpOriginGirder = null;
    }
    jump() {
      if (this.state === "GROUNDED") {
        this.state = "JUMPING";
        this.vy = -4.8;
        this.jumpOriginGirder = this.currentGirder;
        return true;
      }
      return false;
    }
    startHammer(duration = 8) {
      this.hammerTimer = duration;
      this.state = "HAMMER";
      this.hammerSwingUp = true;
      this.hammerSwingTimer = 0;
    }
    update(dt, input, girders, ladders) {
      if (this.state === "DEAD") return;
      if (this.hammerTimer > 0) {
        this.hammerTimer -= dt;
        this.hammerSwingTimer += dt;
        if (this.hammerSwingTimer > 0.12) {
          this.hammerSwingTimer = 0;
          this.hammerSwingUp = !this.hammerSwingUp;
        }
        if (this.hammerTimer <= 0) {
          this.hammerTimer = 0;
          this.state = "GROUNDED";
        }
      }
      const moveSpeed = 2.8;
      const climbSpeed = 2;
      if (this.state !== "CLIMBING") {
        if (input.left) {
          this.vx = -moveSpeed;
          this.facing = "LEFT";
          this.walkAnimTimer += dt * 10;
        } else if (input.right) {
          this.vx = moveSpeed;
          this.facing = "RIGHT";
          this.walkAnimTimer += dt * 10;
        } else {
          this.vx = 0;
        }
      }
      if (this.state !== "HAMMER" && this.state !== "JUMPING") {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const nearLadder = ladders.find((l) => !l.isBroken && l.contains(centerX, centerY));
        if (nearLadder) {
          if (input.up) {
            this.state = "CLIMBING";
            this.x = nearLadder.x - this.width / 2;
            this.vx = 0;
            this.vy = -climbSpeed;
            this.currentLadder = nearLadder;
            this.jumpOriginGirder = null;
            this.walkAnimTimer += dt * 8;
          } else if (input.down) {
            this.state = "CLIMBING";
            this.x = nearLadder.x - this.width / 2;
            this.vx = 0;
            this.vy = climbSpeed;
            this.currentLadder = nearLadder;
            this.jumpOriginGirder = null;
            this.walkAnimTimer += dt * 8;
          } else if (this.state === "CLIMBING") {
            this.vy = 0;
          }
        } else if (this.state === "CLIMBING") {
          this.state = "GROUNDED";
          this.vy = 0;
          this.currentLadder = null;
        }
        if (this.state === "CLIMBING" && (input.left || input.right)) {
          const footY = this.y + this.height;
          for (const g of girders) {
            if (g.containsX(centerX)) {
              const surfaceY = g.getY(centerX);
              if (Math.abs(footY - surfaceY) < 10) {
                this.state = "GROUNDED";
                this.currentLadder = null;
                break;
              }
            }
          }
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.state === "JUMPING") {
        this.vy += 0.38;
      }
      if (this.state !== "CLIMBING") {
        let landed = false;
        const footY = this.y + this.height;
        for (const g of girders) {
          if (g.containsX(this.x)) {
            const surfaceY = g.getY(this.x);
            if (this.jumpOriginGirder && g !== this.jumpOriginGirder && surfaceY < this.jumpOriginGirder.getY(this.x) - 15) {
              continue;
            }
            if (footY >= surfaceY - 5 && footY <= surfaceY + 12 && this.vy >= 0) {
              this.y = surfaceY - this.height;
              this.vy = 0;
              this.state = this.hammerTimer > 0 ? "HAMMER" : "GROUNDED";
              this.currentGirder = g;
              this.jumpOriginGirder = null;
              landed = true;
              break;
            }
          }
        }
        if (!landed && this.state === "GROUNDED") {
          this.state = "JUMPING";
          this.vy = 1;
        }
      } else if (this.currentLadder) {
        if (this.y + this.height < this.currentLadder.yTop) {
          this.y = this.currentLadder.yTop - this.height;
          this.state = "GROUNDED";
          this.vy = 0;
        } else if (this.y + this.height > this.currentLadder.yBottom + 2) {
          this.y = this.currentLadder.yBottom - this.height;
          this.state = "GROUNDED";
          this.vy = 0;
        }
      }
      this.x = Math.max(12, Math.min(468, this.x));
      if (this.y > 640) {
        this.y = 600 - this.height;
        this.state = "GROUNDED";
        this.vy = 0;
      }
    }
    getHammerHitbox() {
      if (this.state !== "HAMMER") return null;
      const reach = 26;
      const hx = this.facing === "RIGHT" ? this.x + this.width - 4 : this.x - reach + 4;
      const hy = this.y - 12;
      return { x: hx, y: hy, width: reach, height: this.height + 16 };
    }
    render(ctx) {
      ctx.save();
      const x = Math.round(this.x);
      const y = Math.round(this.y);
      const flip = this.facing === "LEFT";
      if (this.state === "DEAD") {
        ctx.translate(x + this.width / 2, y + this.height / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-this.width / 2, -this.height / 2);
      } else if (flip) {
        ctx.translate(x + this.width, y);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(x, y);
      }
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(3, 0, 12, 5);
      ctx.fillRect(7, 2, 10, 3);
      ctx.fillStyle = "#fed7aa";
      ctx.fillRect(5, 5, 8, 5);
      ctx.fillRect(11, 6, 4, 3);
      ctx.fillStyle = "#000000";
      ctx.fillRect(9, 6, 2, 2);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(8, 8, 7, 3);
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(4, 10, 10, 6);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(5, 14, 8, 6);
      ctx.fillStyle = "#fde047";
      ctx.fillRect(6, 15, 2, 2);
      ctx.fillRect(10, 15, 2, 2);
      const step = Math.floor(this.walkAnimTimer) % 2;
      ctx.fillStyle = "#78350f";
      if (this.state === "JUMPING") {
        ctx.fillRect(1, 18, 5, 5);
        ctx.fillRect(12, 16, 5, 5);
      } else if (this.state === "CLIMBING") {
        if (step === 0) {
          ctx.fillRect(4, 19, 4, 5);
          ctx.fillRect(10, 17, 4, 5);
        } else {
          ctx.fillRect(4, 17, 4, 5);
          ctx.fillRect(10, 19, 4, 5);
        }
      } else {
        if (step === 0) {
          ctx.fillRect(4, 19, 4, 5);
          ctx.fillRect(10, 19, 4, 5);
        } else {
          ctx.fillRect(2, 19, 5, 5);
          ctx.fillRect(11, 19, 5, 5);
        }
      }
      if (this.state === "HAMMER") {
        ctx.save();
        const hx = 14;
        const hy = this.hammerSwingUp ? -12 : 12;
        ctx.fillStyle = "#d97706";
        ctx.fillRect(hx, hy + 4, 4, 16);
        ctx.fillStyle = "#cbd5e1";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.fillRect(hx - 4, hy, 18, 8);
        ctx.strokeRect(hx - 4, hy, 18, 8);
        ctx.restore();
      }
      ctx.restore();
      if (this.state === "DEAD") {
        ctx.save();
        const starAngle = performance.now() / 120;
        ctx.fillStyle = "#fde047";
        for (let s = 0; s < 4; s++) {
          const a = starAngle + s * Math.PI / 2;
          const sx = x + this.width / 2 + Math.cos(a) * 14;
          const sy = y - 4 + Math.sin(a) * 5;
          ctx.fillRect(sx, sy, 3, 3);
        }
        ctx.restore();
      }
    }
  };

  // monkeyjump/js/audio.js
  var MonkeyJumpAudio = class {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.hammerThemeLoop = null;
      this.isHammerPlaying = false;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.muted && this.isHammerPlaying) {
        this.stopHammerTheme();
      }
    }
    toggle() {
      this.setMuted(!this.muted);
      return !this.muted;
    }
    playTone(freq, type = "square", duration = 0.08, startVol = 0.15, endVol = 0.01) {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(startVol, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(1e-4, endVol), now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      } catch (_) {
      }
    }
    step() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (_) {
      }
    }
    jump() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (_) {
      }
    }
    barrelHop() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [660, 880, 1100].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.04);
          gain.gain.setValueAtTime(0.15, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.04 + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.1);
        });
      } catch (_) {
      }
    }
    itemChime() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.18, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.06 + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.15);
        });
      } catch (_) {
      }
    }
    barrelRoll() {
      if (this.muted || !this.ctx) return;
      this.playTone(90, "triangle", 0.06, 0.09, 0.01);
    }
    chestBeat() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (_) {
      }
    }
    barrelToss() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } catch (_) {
      }
    }
    hammerSmash() {
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        this.playTone(110, "square", 0.15, 0.25, 0.01);
      } catch (_) {
      }
    }
    startHammerTheme() {
      if (this.muted || !this.ctx || this.isHammerPlaying) return;
      this.isHammerPlaying = true;
      const notes = [
        { f: 523.25, d: 0.1 },
        // C5
        { f: 587.33, d: 0.1 },
        // D5
        { f: 659.25, d: 0.1 },
        // E5
        { f: 783.99, d: 0.15 },
        // G5
        { f: 659.25, d: 0.1 },
        // E5
        { f: 783.99, d: 0.2 }
        // G5
      ];
      let step = 0;
      this.hammerThemeLoop = setInterval(() => {
        if (this.muted || !this.isHammerPlaying) return;
        const note = notes[step % notes.length];
        this.playTone(note.f, "square", note.d, 0.1, 0.01);
        step++;
      }, 140);
    }
    stopHammerTheme() {
      this.isHammerPlaying = false;
      if (this.hammerThemeLoop) {
        clearInterval(this.hammerThemeLoop);
        this.hammerThemeLoop = null;
      }
    }
    stageClear() {
      this.stopHammerTheme();
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const melody = [
          { f: 523.25, t: 0 },
          // C5
          { f: 659.25, t: 0.12 },
          // E5
          { f: 783.99, t: 0.24 },
          // G5
          { f: 1046.5, t: 0.36 },
          // C6
          { f: 783.99, t: 0.5 },
          // G5
          { f: 1046.5, t: 0.65 }
          // C6
        ];
        melody.forEach((m) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(m.f, now + m.t);
          gain.gain.setValueAtTime(0.25, now + m.t);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + m.t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + m.t);
          osc.stop(now + m.t + 0.2);
        });
      } catch (_) {
      }
    }
    death() {
      this.stopHammerTheme();
      if (this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const tones = [
          { f: 440, t: 0 },
          { f: 415, t: 0.12 },
          { f: 392, t: 0.24 },
          { f: 349, t: 0.36 },
          { f: 220, t: 0.55 }
        ];
        tones.forEach((tone) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(tone.f, now + tone.t);
          gain.gain.setValueAtTime(0.2, now + tone.t);
          gain.gain.exponentialRampToValueAtTime(1e-3, now + tone.t + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + tone.t);
          osc.stop(now + tone.t + 0.18);
        });
      } catch (_) {
      }
    }
  };
  var sound = new MonkeyJumpAudio();

  // monkeyjump/js/game.js
  var MonkeyJumpGame = class {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width || 480;
      this.height = canvas.height || 640;
      this.callbacks = callbacks;
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.bonus = 5e3;
      this.bonusTimer = 0;
      this.state = "READY";
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
        new Ladder(200, 518, 600, true),
        // Broken
        // Tier 1 to 2
        new Ladder(100, 430, 522, false),
        new Ladder(280, 424, 514, false),
        // Tier 2 to 3
        new Ladder(380, 330, 420, false),
        new Ladder(200, 338, 428, true),
        // Broken
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
        new BonusItem("PARASOL", 320, 404),
        new BonusItem("HAT", 160, 226),
        new BonusItem("PURSE", 340, 138)
      ];
    }
    start() {
      this.state = "PLAYING";
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.resetWave(false);
    }
    resetWave(keepScore = true) {
      if (!keepScore) {
        this.score = 0;
      }
      this.bonus = 5e3;
      this.bonusTimer = 0;
      this.barrels = [];
      this.fireballs = [];
      this.floatingScores = [];
      this.barrelInterval = Math.max(1.4, 3.4 - (this.level - 1) * 0.4);
      this.barrelSpawnTimer = 0.5;
      this.jumpman = new Jumpman(40, 576);
      this.kong = new Kong(70, 94);
      this.penny = new Penny(230, 56);
      this.hammers.forEach((h) => {
        h.active = true;
      });
      this.bonusItems.forEach((b) => {
        b.active = true;
      });
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
    addFloatingScore(text, x, y, color = "#facc15") {
      this.floatingScores.push({
        text,
        x,
        y,
        color,
        timer: 0.8
      });
    }
    handleJump() {
      if (this.state === "PLAYING") {
        if (this.jumpman.jump()) {
          sound.jump();
        }
      }
    }
    togglePause() {
      if (this.state === "PLAYING") {
        this.state = "PAUSED";
        sound.stopHammerTheme();
        return true;
      } else if (this.state === "PAUSED") {
        this.state = "PLAYING";
        if (this.jumpman.state === "HAMMER") {
          sound.startHammerTheme();
        }
        return false;
      }
      return false;
    }
    update(dt) {
      if (this.state === "PAUSED" || this.state === "READY") return;
      if (this.state === "STAGE_CLEAR") {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.level++;
          this.state = "PLAYING";
          this.resetWave(true);
        }
        return;
      }
      if (this.state === "DYING") {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.lives <= 0) {
            this.state = "GAME_OVER";
            if (this.callbacks.onGameOver) {
              this.callbacks.onGameOver({ score: this.score, level: this.level });
            }
          } else {
            this.state = "PLAYING";
            this.resetWave(true);
          }
        }
        return;
      }
      this.bonusTimer += dt;
      if (this.bonusTimer > 1.8) {
        this.bonusTimer = 0;
        this.bonus = Math.max(0, this.bonus - 100);
        if (this.callbacks.onBonusUpdate) this.callbacks.onBonusUpdate(this.bonus);
      }
      this.kong.update(
        dt,
        () => sound.chestBeat(),
        (bx, by) => this.spawnBarrel(bx, by)
      );
      this.penny.update(dt);
      const prevX = this.jumpman.x;
      this.jumpman.update(dt, this.input, this.girders, this.ladders);
      if (Math.abs(this.jumpman.x - prevX) > 0.5 && this.jumpman.state === "GROUNDED") {
        if (Math.random() < 0.08) sound.step();
      }
      this.barrels.forEach((b) => {
        b.update(this.girders, this.ladders);
        if (b.active && b.y > 570 && b.x <= 54) {
          b.active = false;
          sound.chestBeat();
          this.addFloatingScore("\u{1F525} FLARE!", 44, 555, "#38bdf8");
          if (this.fireballs.length < 2 + this.level) {
            this.fireballs.push(new Fireball(50, 584));
          }
        }
      });
      this.barrels = this.barrels.filter((b) => b.active);
      this.fireballs.forEach((f) => f.update(dt, this.girders, this.ladders, this.jumpman.x));
      this.fireballs = this.fireballs.filter((f) => f.active);
      this.floatingScores.forEach((fs) => {
        fs.timer -= dt;
        fs.y -= 18 * dt;
      });
      this.floatingScores = this.floatingScores.filter((fs) => fs.timer > 0);
      if (this.jumpman.state !== "HAMMER") {
        for (const h of this.hammers) {
          if (h.active) {
            const dx = Math.abs(this.jumpman.x + this.jumpman.width / 2 - (h.x + h.width / 2));
            const dy = Math.abs(this.jumpman.y + this.jumpman.height / 2 - (h.y + h.height / 2));
            if (dx < 16 && dy < 18) {
              h.active = false;
              this.jumpman.startHammer(8);
              sound.startHammerTheme();
              this.addFloatingScore("HAMMER TIME!", h.x, h.y, "#f59e0b");
              break;
            }
          }
        }
      }
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
            this.addFloatingScore(`+${item.points}`, item.x, item.y - 12, "#ec4899");
          }
        }
      }
      this.checkCollisions();
    }
    checkCollisions() {
      const j = this.jumpman;
      const jCenter = { x: j.x + j.width / 2, y: j.y + j.height / 2 };
      if (j.y <= 90 && Math.abs(j.x - 240) < 40) {
        this.state = "STAGE_CLEAR";
        this.stateTimer = 2.4;
        sound.stageClear();
        const earnedBonus = this.bonus;
        this.score += earnedBonus;
        if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
        this.addFloatingScore(`+${earnedBonus} BONUS!`, 240, 70, "#fde047");
        if (this.callbacks.onStageClear) this.callbacks.onStageClear(this.level);
        return;
      }
      const hammerHitbox = j.getHammerHitbox();
      for (const b of this.barrels) {
        if (!b.active) continue;
        if (hammerHitbox) {
          const hitX = b.x + b.radius >= hammerHitbox.x && b.x - b.radius <= hammerHitbox.x + hammerHitbox.width;
          const hitY = b.y + b.radius >= hammerHitbox.y && b.y - b.radius <= hammerHitbox.y + hammerHitbox.height;
          if (hitX && hitY) {
            b.active = false;
            sound.hammerSmash();
            this.score += 300;
            if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            this.addFloatingScore("+300", b.x, b.y - 12, "#38bdf8");
            continue;
          }
        }
        if (!b.hoppedByPlayer && j.state === "JUMPING" && Math.abs(jCenter.x - b.x) < 26 && j.y + j.height < b.y + 6 && j.y + j.height > b.y - 80) {
          b.hoppedByPlayer = true;
          this.score += 100;
          sound.barrelHop();
          if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
          this.addFloatingScore("+100", b.x, b.y - 16, "#22c55e");
          continue;
        }
        const dist = Math.hypot(jCenter.x - b.x, jCenter.y - b.y);
        if (dist < b.radius + 8 && j.state !== "HAMMER") {
          this.lives--;
          if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
          sound.death();
          this.state = "DYING";
          this.stateTimer = 1.6;
          j.state = "DEAD";
          break;
        }
      }
      for (const f of this.fireballs) {
        if (!f.active) continue;
        if (hammerHitbox) {
          const hitX = f.x + 8 >= hammerHitbox.x && f.x - 8 <= hammerHitbox.x + hammerHitbox.width;
          const hitY = f.y + 8 >= hammerHitbox.y && f.y - 8 <= hammerHitbox.y + hammerHitbox.height;
          if (hitX && hitY) {
            f.active = false;
            sound.hammerSmash();
            this.score += 300;
            if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            this.addFloatingScore("+300", f.x, f.y - 12, "#38bdf8");
            continue;
          }
        }
        const dist = Math.hypot(jCenter.x - (f.x + 8), jCenter.y - (f.y + 8));
        if (dist < 16 && j.state !== "HAMMER") {
          this.lives--;
          if (this.callbacks.onLivesUpdate) this.callbacks.onLivesUpdate(this.lives);
          sound.death();
          this.state = "DYING";
          this.stateTimer = 1.6;
          j.state = "DEAD";
          break;
        }
      }
    }
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#06060c";
      ctx.fillRect(0, 0, this.width, this.height);
      this.ladders.forEach((l) => l.render(ctx));
      this.girders.forEach((g) => g.render(ctx));
      this.renderOilDrum(ctx, 40, 574);
      this.hammers.forEach((h) => h.render(ctx));
      this.bonusItems.forEach((item) => item.render(ctx));
      this.penny.render(ctx);
      this.kong.render(ctx);
      this.barrels.forEach((b) => b.render(ctx));
      this.fireballs.forEach((f) => f.render(ctx));
      this.jumpman.render(ctx);
      this.floatingScores.forEach((fs) => {
        ctx.save();
        ctx.fillStyle = fs.color;
        ctx.font = "bold 10px monospace";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.restore();
      });
      if (this.state === "STAGE_CLEAR") {
        ctx.save();
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("\u2764\uFE0F RESCUED! \u2764\uFE0F", this.width / 2, 220);
        ctx.restore();
      }
    }
    renderOilDrum(ctx, x, y) {
      ctx.save();
      ctx.fillStyle = "#0284c7";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, 22, 26);
      ctx.strokeRect(x, y, 22, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6px monospace";
      ctx.fillText("OIL", x + 5, y + 16);
      const fHeight = 6 + Math.floor(Math.random() * 8);
      ctx.fillStyle = Math.random() < 0.5 ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + 11, y - fHeight);
      ctx.lineTo(x + 20, y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  // monkeyjump/js/storage.js
  var STORAGE_KEY = "retro_arcade_monkeyjump_hiscore";
  var GAME_ID = "monkeyjump";
  function getLocalHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (_) {
      return 0;
    }
  }
  function saveLocalHighScore(score) {
    try {
      const current = getLocalHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEY, score.toString());
        return score;
      }
      return current;
    } catch (_) {
      return score;
    }
  }
  async function submitMatchRecord({ score, level, result = "GAME OVER" }) {
    try {
      await fetch("/api/games/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          gameId: GAME_ID,
          score: Math.max(0, parseInt(score, 10) || 0),
          level: Math.max(1, Math.min(255, parseInt(level, 10) || 1)),
          status: "complete",
          result
        })
      });
    } catch (_) {
    }
  }

  // monkeyjump/js/main.js
  var MonkeyJumpApp = class {
    constructor() {
      this.canvas = document.getElementById("monkey-canvas");
      this.btnBack = document.getElementById("btn-back-hub");
      this.btnSound = document.getElementById("btn-toggle-sound");
      this.btnCrt = document.getElementById("btn-toggle-crt");
      this.btnPause = document.getElementById("btn-pause-game");
      this.btnRestart = document.getElementById("btn-restart-game");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.hudBonus = document.getElementById("hud-bonus");
      this.hudLevel = document.getElementById("hud-level");
      this.hudLives = document.getElementById("hud-lives");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayTitle = document.getElementById("overlay-title");
      this.overlayFinalScore = document.getElementById("overlay-final-score");
      this.overlayFinalStage = document.getElementById("overlay-final-stage");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.floatingBanner = document.getElementById("floating-banner");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.highScore = getLocalHighScore();
      this.hudHighScore.textContent = this.highScore.toString().padStart(6, "0");
      this.soundEnabled = true;
      this.crtEnabled = true;
      this.initGame();
      this.bindEvents();
      this.startGameLoop();
    }
    initGame() {
      this.game = new MonkeyJumpGame(this.canvas, {
        onScoreUpdate: (score) => {
          this.hudScore.textContent = score.toString().padStart(6, "0");
          if (score > this.highScore) {
            this.highScore = score;
            saveLocalHighScore(this.highScore);
            this.hudHighScore.textContent = this.highScore.toString().padStart(6, "0");
          }
        },
        onLivesUpdate: (lives) => {
          this.hudLives.textContent = "\u{1F3C3} ".repeat(Math.max(0, lives)).trim() || "DEAD";
        },
        onBonusUpdate: (bonus) => {
          this.hudBonus.textContent = bonus.toString().padStart(4, "0");
        },
        onLevelUpdate: (level) => {
          this.hudLevel.textContent = level.toString();
        },
        onStageClear: (stage) => {
          this.floatingBanner.textContent = `\u2605 STAGE ${stage} RESCUED! \u2605`;
          this.floatingBanner.classList.add("show");
          setTimeout(() => {
            this.floatingBanner.classList.remove("show");
          }, 2200);
        },
        onGameOver: ({ score, level }) => {
          this.handleGameOver(score, level);
        }
      });
      this.game.start();
    }
    handleGameOver(score, level) {
      this.overlayFinalScore.textContent = score.toString().padStart(6, "0");
      this.overlayFinalStage.textContent = `STAGE ${level}`;
      this.gameOverlay.classList.add("visible");
      submitMatchRecord({
        score,
        level,
        result: `STAGE ${level} (${score} PTS)`
      });
    }
    bindEvents() {
      this.btnSound.addEventListener("click", () => {
        this.soundEnabled = sound.toggle();
        this.btnSound.textContent = this.soundEnabled ? "\u{1F50A} SOUND" : "\u{1F507} MUTED";
        this.btnSound.classList.toggle("active", this.soundEnabled);
      });
      this.btnCrt.addEventListener("click", () => {
        this.crtEnabled = !this.crtEnabled;
        this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
        this.btnCrt.classList.toggle("active", this.crtEnabled);
        this.btnCrt.textContent = this.crtEnabled ? "CRT: ON" : "CRT: OFF";
      });
      this.btnPause.addEventListener("click", () => {
        sound.init();
        const isPaused = this.game.togglePause();
        this.btnPause.textContent = isPaused ? "RESUME" : "PAUSE";
      });
      const doRestart = () => {
        sound.init();
        this.gameOverlay.classList.remove("visible");
        this.game.start();
        this.btnPause.textContent = "PAUSE";
      };
      this.btnRestart.addEventListener("click", doRestart);
      this.overlayRestartBtn.addEventListener("click", doRestart);
      window.addEventListener("keydown", (e) => {
        sound.init();
        if (["ArrowLeft", "KeyA"].includes(e.code)) {
          this.game.input.left = true;
        } else if (["ArrowRight", "KeyD"].includes(e.code)) {
          this.game.input.right = true;
        } else if (["ArrowUp", "KeyW"].includes(e.code)) {
          this.game.input.up = true;
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          this.game.input.down = true;
        } else if (["Space", "KeyZ", "KeyJ"].includes(e.code)) {
          e.preventDefault();
          if (this.game.state === "GAME_OVER") {
            doRestart();
          } else {
            this.game.handleJump();
          }
        } else if (e.code === "KeyP") {
          this.btnPause.click();
        } else if (e.code === "KeyM") {
          this.btnSound.click();
        } else if (e.code === "Escape") {
          window.location.href = "../index.html";
        }
      });
      window.addEventListener("keyup", (e) => {
        if (["ArrowLeft", "KeyA"].includes(e.code)) {
          this.game.input.left = false;
        } else if (["ArrowRight", "KeyD"].includes(e.code)) {
          this.game.input.right = false;
        } else if (["ArrowUp", "KeyW"].includes(e.code)) {
          this.game.input.up = false;
        } else if (["ArrowDown", "KeyS"].includes(e.code)) {
          this.game.input.down = false;
        }
      });
      const bindTouchDir = (id, dirKey) => {
        const el = document.getElementById(id);
        if (!el) return;
        const setOn = (e) => {
          e.preventDefault();
          sound.init();
          this.game.input[dirKey] = true;
          el.classList.add("active");
        };
        const setOff = (e) => {
          e.preventDefault();
          this.game.input[dirKey] = false;
          el.classList.remove("active");
        };
        el.addEventListener("pointerdown", setOn);
        el.addEventListener("pointerup", setOff);
        el.addEventListener("pointercancel", setOff);
        el.addEventListener("pointerleave", setOff);
      };
      bindTouchDir("dpad-left", "left");
      bindTouchDir("dpad-right", "right");
      bindTouchDir("dpad-up", "up");
      bindTouchDir("dpad-down", "down");
      const btnJump = document.getElementById("btn-action-jump");
      if (btnJump) {
        btnJump.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          sound.init();
          if (this.game.state === "GAME_OVER") {
            doRestart();
          } else {
            this.game.handleJump();
            btnJump.classList.add("active");
          }
        });
        btnJump.addEventListener("pointerup", () => btnJump.classList.remove("active"));
        btnJump.addEventListener("pointercancel", () => btnJump.classList.remove("active"));
      }
      this.canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        if (this.game.state === "GAME_OVER") {
          doRestart();
        } else {
          this.game.handleJump();
        }
      });
    }
    startGameLoop() {
      let lastTime = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.1, (now - lastTime) / 1e3);
        lastTime = now;
        this.game.update(dt);
        this.game.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    new MonkeyJumpApp();
  });
})();
