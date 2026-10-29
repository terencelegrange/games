(() => {
  // goodiesandbaddies/js/physics.js
  var GRAVITY = 920;
  var MAX_FALL_SPEED = 480;
  var WALK_SPEED = 150;
  var JUMP_VELOCITY = -380;
  var CLIMB_SPEED = 115;
  function checkAABB(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function checkCircleAABB(cxOrCircle, cyOrBox, r, bx, by, bw, bh) {
    let cx, cy, rad, bX, bY, bW, bH;
    if (typeof cxOrCircle === "object") {
      cx = cxOrCircle.x;
      cy = cxOrCircle.y;
      rad = cxOrCircle.radius;
      bX = cyOrBox.x;
      bY = cyOrBox.y;
      bW = cyOrBox.width;
      bH = cyOrBox.height;
    } else {
      cx = cxOrCircle;
      cy = cyOrBox;
      rad = r;
      bX = bx;
      bY = by;
      bW = bw;
      bH = bh;
    }
    const closestX = Math.max(bX, Math.min(cx, bX + bW));
    const closestY = Math.max(bY, Math.min(cy, bY + bH));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= rad * rad;
  }
  function findOverlappingLadder(entity, ladders) {
    const eCenterX = entity.x + entity.width / 2;
    const eBottomY = entity.y + entity.height;
    const eTopY = entity.y;
    for (const ladder of ladders) {
      if (eCenterX >= ladder.x - 10 && eCenterX <= ladder.x + ladder.width + 10 && eBottomY >= ladder.y && eTopY <= ladder.y + ladder.height) {
        return ladder;
      }
    }
    return null;
  }

  // goodiesandbaddies/js/weapons.js
  var WEAPON_TYPES = {
    LANCE: {
      id: "lance",
      name: "STEEL LANCE",
      icon: "\u{1F5E1}\uFE0F",
      speed: 480,
      maxActive: 2,
      gravity: 0,
      damage: 1
    },
    DAGGER: {
      id: "dagger",
      name: "FLYING DAGGER",
      icon: "\u{1F52A}",
      speed: 580,
      maxActive: 3,
      gravity: 0,
      damage: 1
    },
    TORCH: {
      id: "torch",
      name: "HOLY TORCH",
      icon: "\u{1F525}",
      speed: 260,
      maxActive: 2,
      gravity: 600,
      damage: 1
    }
  };
  var Projectile = class {
    constructor({ x, y, facingRight, type = "lance" }) {
      this.x = x;
      this.y = y;
      this.startX = x;
      this.facingRight = facingRight;
      this.type = type;
      this.active = true;
      const def = WEAPON_TYPES[type.toUpperCase()] || WEAPON_TYPES.LANCE;
      this.speed = def.speed;
      this.gravity = def.gravity;
      this.damage = def.damage;
      this.vx = (facingRight ? 1 : -1) * this.speed;
      this.vy = type === "torch" ? -180 : 0;
      this.radius = type === "dagger" ? 4 : type === "torch" ? 7 : 6;
      this.width = type === "lance" ? 24 : 12;
      this.height = type === "lance" ? 8 : 10;
      this.isIgnited = false;
      this.burnTimer = 0;
      this.maxBurnTime = 1.4;
      this.rotation = 0;
    }
    update(dt, platforms = [], cameraX = null) {
      if (!this.active) return;
      if (this.isIgnited) {
        this.burnTimer += dt;
        if (this.burnTimer >= this.maxBurnTime) {
          this.active = false;
        }
        return;
      }
      this.vy += this.gravity * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.type === "torch") {
        this.rotation += (this.facingRight ? 1 : -1) * 14 * dt;
        for (const p of platforms) {
          if (this.x >= p.x && this.x <= p.x + p.width && this.y + this.radius >= p.y && this.y - this.radius <= p.y + 12 && this.vy > 0) {
            this.isIgnited = true;
            this.vx = 0;
            this.vy = 0;
            this.y = p.y - 12;
            this.width = 28;
            this.height = 24;
            return;
          }
        }
      }
      if (cameraX !== null) {
        if (this.x < cameraX - 60 || this.x > cameraX + 860 || this.y > 550) {
          this.active = false;
        }
      } else if (Math.abs(this.x - this.startX) > 850 || this.y > 550) {
        this.active = false;
      }
    }
    render(ctx, cameraX) {
      if (!this.active) return;
      const screenX = Math.round(this.x - cameraX);
      const screenY = Math.round(this.y);
      ctx.save();
      if (this.isIgnited) {
        const flicker = (Math.sin(performance.now() * 0.02) + 1) * 0.5;
        const h = 18 + flicker * 8;
        const grad = ctx.createLinearGradient(screenX, screenY - h, screenX, screenY);
        grad.addColorStop(0, "#ffff55");
        grad.addColorStop(0.4, "#f97316");
        grad.addColorStop(1, "#38bdf8");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(screenX - 12, screenY);
        ctx.quadraticCurveTo(screenX - 8, screenY - h, screenX, screenY - h - 4);
        ctx.quadraticCurveTo(screenX + 8, screenY - h, screenX + 12, screenY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(screenX + (Math.random() * 14 - 7), screenY - h + Math.random() * 8, 2, 2);
      } else if (this.type === "lance") {
        ctx.translate(screenX, screenY);
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.fillStyle = "#b45309";
        ctx.fillRect(-12, -2, 20, 4);
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(16, 0);
        ctx.lineTo(8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(9, -1, 3, 2);
      } else if (this.type === "dagger") {
        ctx.translate(screenX, screenY);
        if (!this.facingRight) ctx.scale(-1, 1);
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(8, 0);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-8, -4, 3, 8);
      } else if (this.type === "torch") {
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(8, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(8, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };
  var ItemDrop = class {
    constructor({ x, y, type = "weapon", weaponType = "dagger" }) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.weaponType = weaponType;
      this.width = 20;
      this.height = 20;
      this.vy = -120;
      this.active = true;
      this.life = 12;
      this.groundY = y;
      this.bobTick = 0;
    }
    update(dt, platforms = []) {
      if (!this.active) return;
      this.life -= dt;
      if (this.life <= 0) {
        this.active = false;
        return;
      }
      this.bobTick += dt;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      for (const p of platforms) {
        if (this.x + this.width > p.x && this.x < p.x + p.width && this.y + this.height >= p.y && this.y + this.height <= p.y + 16 && this.vy > 0) {
          this.y = p.y - this.height;
          this.vy = 0;
          break;
        }
      }
    }
    render(ctx, cameraX) {
      if (!this.active) return;
      const sx = Math.round(this.x - cameraX);
      const sy = Math.round(this.y);
      ctx.save();
      if (this.type === "armor") {
        ctx.fillStyle = "#eab308";
        ctx.fillRect(sx, sy + 4, 20, 14);
        ctx.fillStyle = "#ca8a04";
        ctx.strokeRect(sx, sy + 4, 20, 14);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(sx + 8, sy + 8, 4, 5);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(sx + 2, sy + 4, 16, 14);
        ctx.fillStyle = "#475569";
        ctx.fillRect(sx + 4, sy + 1, 12, 3);
        ctx.fillStyle = "#ffff55";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        const icon = this.weaponType === "dagger" ? "\u{1F52A}" : this.weaponType === "torch" ? "\u{1F525}" : "\u{1F5E1}\uFE0F";
        ctx.fillText(icon, sx + 10, sy - 2);
      }
      ctx.restore();
    }
  };

  // goodiesandbaddies/js/arthur.js
  var Arthur = class {
    constructor(x = 100, y = 300) {
      this.x = x;
      this.y = y;
      this.spawnX = x;
      this.spawnY = y;
      this.width = 24;
      this.height = 34;
      this.vx = 0;
      this.vy = 0;
      this.facingRight = true;
      this.armorLevel = 2;
      this.lives = 3;
      this.invulnerableTimer = 0;
      this.state = "IDLE";
      this.grounded = true;
      this.onLadder = false;
      this.jumpVx = 0;
      this.weaponType = "lance";
      this.throwCooldown = 0;
      this.isThrowingAnim = false;
      this.throwAnimTimer = 0;
      this.animTick = 0;
      this.deathTimer = 0;
    }
    resetToCheckpoint(checkpointX = 100, checkpointY = 300) {
      this.x = checkpointX;
      this.y = checkpointY;
      this.vx = 0;
      this.vy = 0;
      this.jumpVx = 0;
      this.facingRight = true;
      this.armorLevel = 2;
      this.invulnerableTimer = 2;
      this.state = "IDLE";
      this.grounded = true;
      this.onLadder = false;
      this.isThrowingAnim = false;
      this.deathTimer = 0;
    }
    takeDamage() {
      if (this.invulnerableTimer > 0 || this.state === "DEAD" || this.state === "HIT") {
        return null;
      }
      if (this.armorLevel === 2) {
        this.armorLevel = 1;
        this.state = "HIT";
        this.invulnerableTimer = 1.6;
        this.vy = -200;
        this.vx = (this.facingRight ? -1 : 1) * 110;
        this.onLadder = false;
        return "ARMOR_LOST";
      } else {
        this.armorLevel = 0;
        this.state = "DEAD";
        this.deathTimer = 2.5;
        this.vx = 0;
        this.vy = -160;
        this.onLadder = false;
        this.lives = Math.max(0, this.lives - 1);
        return "KILLED";
      }
    }
    restoreArmor() {
      if (this.armorLevel === 1) {
        this.armorLevel = 2;
        return true;
      }
      return false;
    }
    throwWeapon(activeProjectiles = []) {
      if (this.state === "DEAD" || this.state === "HIT" || this.throwCooldown > 0) {
        return null;
      }
      const def = WEAPON_TYPES[this.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE;
      const countActive = activeProjectiles.filter((p) => p.active && p.type === this.weaponType).length;
      if (countActive >= def.maxActive) {
        return null;
      }
      this.throwCooldown = this.weaponType === "dagger" ? 0.22 : 0.35;
      this.isThrowingAnim = true;
      this.throwAnimTimer = 0.2;
      const spawnX = this.facingRight ? this.x + this.width + 4 : this.x - 24;
      const spawnY = this.state === "CROUCH" ? this.y + 14 : this.y + 8;
      return new Projectile({
        x: spawnX,
        y: spawnY,
        facingRight: this.facingRight,
        type: this.weaponType
      });
    }
    update(dt, input, platforms, ladders) {
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
      }
      if (this.throwCooldown > 0) {
        this.throwCooldown = Math.max(0, this.throwCooldown - dt);
      }
      if (this.throwAnimTimer > 0) {
        this.throwAnimTimer -= dt;
        if (this.throwAnimTimer <= 0) {
          this.isThrowingAnim = false;
        }
      }
      if (this.state === "DEAD") {
        this.deathTimer -= dt;
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
        this.y += this.vy * dt;
        for (const p of platforms) {
          if (this.x + this.width > p.x && this.x < p.x + p.width && this.y + this.height >= p.y && this.y + this.height <= p.y + 20 && this.vy > 0) {
            this.y = p.y - this.height;
            this.vy = 0;
            break;
          }
        }
        return;
      }
      if (this.state === "HIT") {
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        for (const p of platforms) {
          if (this.x + this.width > p.x && this.x < p.x + p.width && this.y + this.height >= p.y && this.y + this.height <= p.y + 20 && this.vy > 0) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.vx = 0;
            this.state = "IDLE";
            this.grounded = true;
            break;
          }
        }
        return;
      }
      const overlappingLadder = findOverlappingLadder(this, ladders);
      if (overlappingLadder) {
        if ((input.up || input.down) && !this.onLadder) {
          this.onLadder = true;
          this.grounded = false;
          this.vx = 0;
          this.vy = 0;
          this.jumpVx = 0;
          this.x = overlappingLadder.x + overlappingLadder.width / 2 - this.width / 2;
        }
      } else {
        this.onLadder = false;
      }
      if (this.onLadder) {
        this.state = "CLIMB";
        this.height = 34;
        if (input.up) {
          this.vy = -CLIMB_SPEED;
          this.animTick += dt;
        } else if (input.down) {
          this.vy = CLIMB_SPEED;
          this.animTick += dt;
        } else {
          this.vy = 0;
        }
        this.y += this.vy * dt;
        if (input.jump) {
          this.onLadder = false;
          this.vy = JUMP_VELOCITY * 0.85;
          const dismountLeft = input.lastHorizontal ? input.lastHorizontal === "left" : input.left && !input.right;
          const dismountRight = input.lastHorizontal ? input.lastHorizontal === "right" : input.right && !input.left;
          this.jumpVx = dismountLeft ? -WALK_SPEED : dismountRight ? WALK_SPEED : 0;
          this.state = "JUMP";
        }
        return;
      }
      if (this.grounded) {
        const moveLeft = input.lastHorizontal ? input.lastHorizontal === "left" : input.left && !input.right;
        const moveRight = input.lastHorizontal ? input.lastHorizontal === "right" : input.right && !input.left;
        if (moveLeft) {
          this.facingRight = false;
        } else if (moveRight) {
          this.facingRight = true;
        }
        if (input.down) {
          this.state = "CROUCH";
          this.height = 22;
          this.vx = 0;
        } else {
          this.height = 34;
          if (moveLeft) {
            this.vx = -WALK_SPEED;
            this.state = "RUN";
            this.animTick += dt;
          } else if (moveRight) {
            this.vx = WALK_SPEED;
            this.state = "RUN";
            this.animTick += dt;
          } else {
            this.vx = 0;
            this.state = "IDLE";
          }
          if (input.jump) {
            this.grounded = false;
            this.vy = JUMP_VELOCITY;
            this.jumpVx = moveLeft ? -WALK_SPEED : moveRight ? WALK_SPEED : 0;
            this.state = "JUMP";
          }
        }
      } else {
        this.vx = this.jumpVx;
        this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
        this.state = this.vy < 0 ? "JUMP" : "FALL";
        this.height = 34;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.grounded = false;
      for (const p of platforms) {
        const bottom = this.state === "CROUCH" ? this.y + 34 : this.y + this.height;
        if (this.x + this.width > p.x && this.x < p.x + p.width && bottom >= p.y && bottom <= p.y + 20 && this.vy >= 0) {
          this.y = p.y - (this.state === "CROUCH" ? 34 : this.height);
          this.vy = 0;
          this.jumpVx = 0;
          this.grounded = true;
          if (this.state === "JUMP" || this.state === "FALL") {
            this.state = "IDLE";
          }
          break;
        }
      }
      this.x = Math.max(0, this.x);
    }
    render(ctx, cameraX) {
      const sx = Math.round(this.x - cameraX);
      const sy = Math.round(this.y);
      if (this.invulnerableTimer > 0) {
        if (Math.floor(performance.now() / 60) % 2 === 0) {
          return;
        }
      }
      ctx.save();
      ctx.translate(sx, sy);
      if (!this.facingRight) {
        ctx.translate(this.width, 0);
        ctx.scale(-1, 1);
      }
      const isBoxers = this.armorLevel === 1;
      const isDead = this.armorLevel === 0;
      if (isDead) {
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(12, 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(9, 23, 2, 3);
        ctx.fillRect(14, 23, 2, 3);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(2, 28, 7, 3);
        ctx.fillRect(15, 29, 8, 3);
        ctx.fillRect(8, 31, 8, 3);
        ctx.restore();
        return;
      }
      const runFrame = Math.floor(this.animTick * 8) % 4;
      if (!isBoxers) {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(6, 0, 13, 11);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(3, -4, 10, 4);
        ctx.fillRect(1, -2, 4, 3);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 4, 6, 3);
        ctx.fillStyle = "#ffff55";
        ctx.fillRect(14, 5, 2, 1.5);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(6, 0, 13, 11);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(3, -4, 9, 4);
        ctx.fillStyle = "#fbcfe8";
        ctx.fillRect(11, 4, 7, 6);
        ctx.fillStyle = "#78350f";
        ctx.fillRect(13, 8, 6, 3);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(14, 5, 2, 2);
      }
      if (this.state === "CROUCH") {
        if (!isBoxers) {
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(4, 10, 16, 8);
          ctx.fillStyle = "#64748b";
          ctx.fillRect(6, 12, 12, 4);
          ctx.fillStyle = "#475569";
          ctx.fillRect(2, 17, 18, 5);
        } else {
          ctx.fillStyle = "#fbcfe8";
          ctx.fillRect(4, 10, 15, 6);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(3, 15, 17, 7);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(6, 17, 2, 2);
          ctx.fillRect(13, 18, 2, 2);
        }
        if (this.isThrowingAnim) {
          ctx.fillStyle = isBoxers ? "#fbcfe8" : "#cbd5e1";
          ctx.fillRect(16, 11, 8, 4);
        }
      } else {
        if (!isBoxers) {
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(5, 10, 14, 12);
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(7, 11, 9, 3);
          ctx.fillStyle = "#b45309";
          ctx.fillRect(5, 20, 14, 3);
          ctx.fillStyle = "#eab308";
          ctx.fillRect(10, 20, 4, 3);
        } else {
          ctx.fillStyle = "#fbcfe8";
          ctx.fillRect(5, 10, 13, 10);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(4, 19, 15, 7);
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(7, 21, 2, 2);
          ctx.fillRect(13, 22, 2, 2);
        }
        if (this.isThrowingAnim) {
          ctx.fillStyle = isBoxers ? "#fbcfe8" : "#cbd5e1";
          ctx.fillRect(14, 11, 9, 4);
          ctx.fillRect(21, 9, 4, 8);
        } else if (this.state === "CLIMB") {
          ctx.fillStyle = isBoxers ? "#fbcfe8" : "#cbd5e1";
          const climbAlt = Math.floor(this.animTick * 6) % 2;
          if (climbAlt === 0) {
            ctx.fillRect(1, 7, 4, 8);
            ctx.fillRect(18, 12, 4, 8);
          } else {
            ctx.fillRect(1, 12, 4, 8);
            ctx.fillRect(18, 7, 4, 8);
          }
        } else {
          ctx.fillStyle = isBoxers ? "#fbcfe8" : "#94a3b8";
          ctx.fillRect(3, 12, 4, 8);
        }
        if (!isBoxers) {
          ctx.fillStyle = "#475569";
          if (this.state === "RUN") {
            if (runFrame === 0 || runFrame === 2) {
              ctx.fillRect(4, 23, 6, 11);
              ctx.fillRect(13, 23, 6, 11);
            } else if (runFrame === 1) {
              ctx.fillRect(1, 23, 6, 11);
              ctx.fillRect(15, 22, 6, 10);
            } else {
              ctx.fillRect(6, 22, 6, 10);
              ctx.fillRect(12, 23, 6, 11);
            }
          } else if (this.state === "JUMP" || this.state === "FALL") {
            ctx.fillRect(3, 22, 7, 8);
            ctx.fillRect(12, 24, 7, 8);
          } else {
            ctx.fillRect(5, 23, 6, 11);
            ctx.fillRect(13, 23, 6, 11);
          }
        } else {
          ctx.fillStyle = "#fbcfe8";
          ctx.fillRect(5, 25, 4, 4);
          ctx.fillRect(13, 25, 4, 4);
          ctx.fillStyle = "#78350f";
          if (this.state === "RUN") {
            if (runFrame % 2 === 0) {
              ctx.fillRect(4, 28, 6, 6);
              ctx.fillRect(13, 28, 6, 6);
            } else {
              ctx.fillRect(2, 28, 6, 6);
              ctx.fillRect(15, 27, 6, 6);
            }
          } else {
            ctx.fillRect(4, 28, 6, 6);
            ctx.fillRect(13, 28, 6, 6);
          }
        }
      }
      ctx.restore();
    }
  };

  // goodiesandbaddies/js/enemies.js
  var Enemy = class {
    constructor({ x, y, type = "zombie", facingRight = false }) {
      this.x = x;
      this.y = y;
      this.startX = x;
      this.type = type;
      this.facingRight = facingRight;
      this.active = true;
      this.hp = 1;
      this.points = 100;
      this.width = 24;
      this.height = 32;
      this.vx = 0;
      this.vy = 0;
      this.animTick = 0;
      this.hitFlash = 0;
      if (type === "zombie") {
        this.hp = 1;
        this.points = 100;
        this.width = 20;
        this.height = 32;
        this.state = "EMERGING";
        this.emergeY = y;
        this.emergeProgress = 0;
      } else if (type === "bat") {
        this.hp = 1;
        this.points = 200;
        this.width = 22;
        this.height = 18;
        this.baseY = y;
        this.flyTimer = Math.random() * Math.PI;
        this.vx = (facingRight ? 1 : -1) * 140;
      } else if (type === "red_arremer") {
        this.hp = 3;
        this.points = 1e3;
        this.width = 28;
        this.height = 36;
        this.state = "PERCHED";
        this.swoopTarget = { x: 0, y: 0 };
        this.actionTimer = 0;
        this.fireCooldown = 0;
      } else if (type === "plant") {
        this.hp = 2;
        this.points = 400;
        this.width = 26;
        this.height = 34;
        this.shootTimer = 1 + Math.random() * 1.5;
      } else if (type === "boss_cyclops") {
        this.hp = 10;
        this.maxHp = 10;
        this.points = 5e3;
        this.width = 46;
        this.height = 68;
        this.state = "PATROL";
        this.vx = -60;
        this.chargeTimer = 0;
        this.shootCooldown = 2;
      }
    }
    takeDamage(amount = 1) {
      this.hp -= amount;
      this.hitFlash = 0.15;
      if (this.hp <= 0) {
        this.active = false;
        return true;
      }
      return false;
    }
    update(dt, arthur, platforms, enemyProjectiles = [], itemDrops = []) {
      if (!this.active) return;
      this.animTick += dt;
      if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
      if (this.type === "zombie") {
        if (this.state === "EMERGING") {
          this.emergeProgress += dt * 1.8;
          if (this.emergeProgress >= 1) {
            this.state = "WALKING";
            this.facingRight = arthur.x > this.x;
            this.vx = (this.facingRight ? 1 : -1) * 55;
          }
          return;
        }
        this.x += this.vx * dt;
        let onPlatform = false;
        for (const p of platforms) {
          if (this.x + this.width > p.x && this.x < p.x + p.width && this.y + this.height >= p.y && this.y + this.height <= p.y + 16) {
            onPlatform = true;
            this.y = p.y - this.height;
            break;
          }
        }
        if (!onPlatform) {
          this.vy += GRAVITY * dt;
          this.y += this.vy * dt;
        }
      } else if (this.type === "bat") {
        this.flyTimer += dt * 3.5;
        this.x += this.vx * dt;
        this.y = this.baseY + Math.sin(this.flyTimer) * 45;
      } else if (this.type === "red_arremer") {
        const distToArthur = Math.hypot(arthur.x - this.x, arthur.y - this.y);
        if (this.state === "PERCHED") {
          if (distToArthur < 240) {
            this.state = "LAUNCHING";
            this.vy = -180;
          }
        } else if (this.state === "LAUNCHING") {
          this.y += this.vy * dt;
          if (this.y < 180) {
            this.state = "HOVER";
            this.actionTimer = 1;
          }
        } else if (this.state === "HOVER") {
          this.actionTimer -= dt;
          this.facingRight = arthur.x > this.x;
          this.x += (arthur.x > this.x ? 1 : -1) * 40 * dt;
          this.y += Math.sin(this.animTick * 6) * 20 * dt;
          if (this.actionTimer <= 0) {
            const dx = arthur.x - this.x;
            const dy = arthur.y - this.y;
            const len = Math.hypot(dx, dy) || 1;
            enemyProjectiles.push({
              x: this.x + (this.facingRight ? 24 : -4),
              y: this.y + 12,
              vx: dx / len * 220,
              vy: dy / len * 220,
              radius: 5,
              active: true
            });
            this.state = "SWOOP";
            this.swoopTarget = { x: arthur.x, y: arthur.y };
          }
        } else if (this.state === "SWOOP") {
          const dx = this.swoopTarget.x - this.x;
          const dy = this.swoopTarget.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 20 || this.y > 400) {
            this.state = "CLIMBING";
            this.vy = -160;
          } else {
            this.x += dx / dist * 210 * dt;
            this.y += dy / dist * 210 * dt;
          }
        } else if (this.state === "CLIMBING") {
          this.y += this.vy * dt;
          if (this.y <= 190) {
            this.state = "HOVER";
            this.actionTimer = 1.2;
          }
        }
      } else if (this.type === "plant") {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
          this.shootTimer = 2.4;
          const dir = arthur.x > this.x ? 1 : -1;
          enemyProjectiles.push({
            x: this.x + (dir > 0 ? 24 : 0),
            y: this.y + 8,
            vx: dir * 180,
            vy: -60,
            gravity: 400,
            radius: 5,
            active: true
          });
        }
      } else if (this.type === "boss_cyclops") {
        this.facingRight = arthur.x > this.x;
        if (this.state === "PATROL") {
          this.x += this.vx * dt;
          if (this.x < 3050) {
            this.vx = 55;
          } else if (this.x > 3480) {
            this.vx = -55;
          }
          this.shootCooldown -= dt;
          if (this.shootCooldown <= 0) {
            this.shootCooldown = 2.2;
            const dir = this.facingRight ? 1 : -1;
            enemyProjectiles.push({
              x: this.x + (this.facingRight ? 44 : 2),
              y: this.y + 20,
              vx: dir * 260,
              vy: 0,
              radius: 7,
              active: true
            });
          }
          if (this.hp <= 6 && Math.random() < 8e-3) {
            this.state = "CHARGE";
            this.chargeTimer = 1.5;
            this.vx = (this.facingRight ? 1 : -1) * 140;
          }
        } else if (this.state === "CHARGE") {
          this.x += this.vx * dt;
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0 || this.x < 3040 || this.x > 3500) {
            this.state = "PATROL";
            this.vx = this.facingRight ? 55 : -55;
          }
        }
        this.y = 372;
      }
    }
    render(ctx, cameraX) {
      if (!this.active) return;
      const sx = Math.round(this.x - cameraX);
      const sy = Math.round(this.y);
      ctx.save();
      if (this.hitFlash > 0) {
        ctx.filter = "brightness(2.5)";
      }
      if (this.type === "zombie") {
        if (this.state === "EMERGING") {
          const clipH = Math.round(32 * this.emergeProgress);
          ctx.save();
          ctx.beginPath();
          ctx.rect(sx - 4, sy + 32 - clipH, 28, clipH);
          ctx.clip();
          ctx.fillStyle = "#65a30d";
          ctx.fillRect(sx + 3, sy + 32 - clipH, 14, 32);
          ctx.fillStyle = "#3f3f46";
          ctx.fillRect(sx + 2, sy + 38 - clipH, 16, 18);
          ctx.restore();
          ctx.fillStyle = "#78350f";
          ctx.fillRect(sx - 4, sy + 28, 28, 6);
          ctx.fillStyle = "#92400e";
          ctx.fillRect(sx - 2, sy + 26, 24, 3);
          ctx.restore();
          return;
        }
        ctx.translate(sx, sy);
        if (!this.facingRight) {
          ctx.translate(this.width, 0);
          ctx.scale(-1, 1);
        }
        const walkFrame = Math.floor(this.animTick * 4) % 2;
        ctx.fillStyle = "#84cc16";
        ctx.fillRect(5, 0, 11, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(11, 3, 3, 3);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(12, 4, 1.5, 1.5);
        ctx.fillStyle = "#52525b";
        ctx.fillRect(3, 10, 14, 13);
        ctx.fillStyle = "#27272a";
        ctx.fillRect(4, 14, 12, 6);
        ctx.fillStyle = "#84cc16";
        ctx.fillRect(13, 11, 8, 4);
        ctx.fillStyle = "#3f3f46";
        if (walkFrame === 0) {
          ctx.fillRect(4, 23, 5, 9);
          ctx.fillRect(11, 23, 5, 9);
        } else {
          ctx.fillRect(2, 23, 5, 9);
          ctx.fillRect(13, 22, 5, 8);
        }
      } else if (this.type === "bat") {
        ctx.translate(sx + this.width / 2, sy + this.height / 2);
        if (!this.facingRight) ctx.scale(-1, 1);
        const wingFlap = Math.sin(this.animTick * 18);
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(2, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(3, -1, 3, 3);
        ctx.fillStyle = "#047857";
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.lineTo(-12, wingFlap * 9);
        ctx.lineTo(-4, 3);
        ctx.moveTo(4, -2);
        ctx.lineTo(12, wingFlap * 9);
        ctx.lineTo(4, 3);
        ctx.fill();
      } else if (this.type === "red_arremer") {
        ctx.translate(sx, sy);
        if (!this.facingRight) {
          ctx.translate(this.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(6, 4, 16, 18);
        ctx.fillStyle = "#991b1b";
        ctx.beginPath();
        ctx.moveTo(7, 4);
        ctx.lineTo(4, -4);
        ctx.lineTo(10, 4);
        ctx.moveTo(18, 4);
        ctx.lineTo(21, -4);
        ctx.lineTo(15, 4);
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.fillRect(13, 8, 4, 3);
        ctx.fillStyle = "#000000";
        ctx.fillRect(15, 9, 2, 2);
        const wingSpread = this.state === "PERCHED" ? 4 : Math.sin(this.animTick * 12) * 8 + 14;
        ctx.fillStyle = "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(5, 8);
        ctx.lineTo(-wingSpread, 2);
        ctx.lineTo(-2, 16);
        ctx.moveTo(21, 8);
        ctx.lineTo(21 + wingSpread, 2);
        ctx.lineTo(20, 16);
        ctx.fill();
        ctx.fillStyle = "#991b1b";
        ctx.fillRect(6, 22, 6, 12);
        ctx.fillRect(14, 22, 6, 12);
      } else if (this.type === "plant") {
        ctx.translate(sx, sy);
        ctx.fillStyle = "#15803d";
        ctx.fillRect(10, 12, 6, 22);
        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.arc(13, 10, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#facc15";
        ctx.fillRect(1, 7, 8, 6);
      } else if (this.type === "boss_cyclops") {
        ctx.translate(sx, sy);
        if (!this.facingRight) {
          ctx.translate(this.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = "#475569";
        ctx.fillRect(6, 14, 34, 34);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 12, 10, 12);
        ctx.fillRect(36, 12, 10, 12);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(11, 2, 24, 16);
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.moveTo(20, 2);
        ctx.lineTo(23, -16);
        ctx.lineTo(26, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(24, 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(24, 8, 3, 3);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(18, 14, 3, 4);
        ctx.fillRect(26, 14, 3, 4);
        ctx.fillStyle = "#334155";
        const stomp = Math.floor(this.animTick * 4) % 2;
        if (stomp === 0) {
          ctx.fillRect(8, 48, 12, 20);
          ctx.fillRect(26, 48, 12, 20);
        } else {
          ctx.fillRect(6, 46, 12, 22);
          ctx.fillRect(28, 50, 12, 18);
        }
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, -26, 46, 6);
        ctx.fillStyle = "#ef4444";
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.fillRect(1, -25, Math.round(44 * pct), 4);
      }
      ctx.restore();
    }
  };

  // goodiesandbaddies/js/level.js
  var Level1 = class {
    constructor() {
      this.width = 3600;
      this.height = 500;
      this.platforms = [
        // Sector 1: Graveyard Ground
        { x: 0, y: 400, width: 2150, height: 100, type: "ground" },
        // Graveyard Elevated Stone Ledges
        { x: 420, y: 310, width: 180, height: 20, type: "stone" },
        { x: 780, y: 250, width: 220, height: 20, type: "stone" },
        { x: 1480, y: 300, width: 180, height: 20, type: "tomb_perch" },
        // Sector 2: Forest Bridges over Dark Water
        { x: 2150, y: 400, width: 140, height: 20, type: "bridge" },
        // Water Gap 1: 2290 to 2410 (Pit Hazard!)
        { x: 2410, y: 400, width: 180, height: 20, type: "bridge" },
        // Elevated forest platform
        { x: 2520, y: 290, width: 210, height: 20, type: "wood" },
        // Sector 3 & 4: Castle Approach & Boss Arena Ground
        { x: 2590, y: 400, width: 1010, height: 100, type: "stone_ground" }
      ];
      this.ladders = [
        { x: 530, y: 310, width: 22, height: 90 },
        { x: 920, y: 250, width: 22, height: 150 },
        { x: 1580, y: 300, width: 22, height: 100 },
        { x: 2660, y: 290, width: 22, height: 110 }
      ];
      this.props = [
        // Sector 1 Tombs & Crosses
        { x: 120, y: 350, type: "cross" },
        { x: 280, y: 362, type: "tombstone" },
        { x: 380, y: 320, type: "dead_tree" },
        { x: 680, y: 352, type: "cross" },
        { x: 740, y: 365, type: "tombstone" },
        { x: 1120, y: 315, type: "dead_tree" },
        { x: 1320, y: 355, type: "cross" },
        { x: 1540, y: 255, type: "cross" },
        // Red Arremer perch tomb
        // Sector 2 Forest Trees
        { x: 1980, y: 310, type: "dead_tree" },
        { x: 2180, y: 310, type: "dead_tree" },
        { x: 2480, y: 305, type: "dead_tree" },
        { x: 2820, y: 300, type: "torch_pillar" },
        // Sector 3 Castle Ramparts & Gate
        { x: 3020, y: 335, type: "torch_pillar" },
        { x: 3250, y: 335, type: "torch_pillar" },
        { x: 3520, y: 180, type: "castle_gate" }
      ];
      this.gateOpen = false;
      this.gateProgress = 0;
      this.key = null;
    }
    spawnKey(x, y) {
      this.key = {
        x,
        y,
        vy: -150,
        active: true,
        sparkleTimer: 0
      };
    }
    update(dt, arthur) {
      if (this.key && this.key.active) {
        this.key.sparkleTimer += dt;
        if (this.key.y < 370) {
          this.key.vy += 600 * dt;
          this.key.y += this.key.vy * dt;
        } else {
          this.key.y = 370;
          this.key.vy = 0;
        }
        const dist = Math.hypot(arthur.x + 12 - this.key.x, arthur.y + 16 - this.key.y);
        if (dist < 28) {
          this.key.active = false;
          this.gateOpen = true;
          return "KEY_COLLECTED";
        }
      }
      if (this.gateOpen && this.gateProgress < 1) {
        this.gateProgress = Math.min(1, this.gateProgress + dt * 0.8);
      }
      return null;
    }
    renderParallax(ctx, cameraX) {
      ctx.save();
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 400);
      skyGrad.addColorStop(0, "#090d16");
      skyGrad.addColorStop(0.6, "#0f172a");
      skyGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, 500);
      const moonScreenX = 640 - cameraX * 0.03 % 800;
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(moonScreenX, 85, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(moonScreenX + 10, 80, 26, 0, Math.PI * 2);
      ctx.fill();
      const midOffset = -(cameraX * 0.22) % 400;
      ctx.fillStyle = "#1e1b4b";
      for (let x = -200 + midOffset; x < 900; x += 220) {
        ctx.beginPath();
        ctx.moveTo(x, 400);
        ctx.lineTo(x + 110, 240);
        ctx.lineTo(x + 220, 400);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x + 95, 200, 30, 70);
        ctx.beginPath();
        ctx.moveTo(x + 90, 200);
        ctx.lineTo(x + 110, 150);
        ctx.lineTo(x + 130, 200);
        ctx.fill();
      }
      const nearOffset = -(cameraX * 0.45) % 320;
      ctx.fillStyle = "#1e293b";
      for (let x = -200 + nearOffset; x < 950; x += 160) {
        ctx.beginPath();
        ctx.arc(x + 80, 440, 110, Math.PI, 0);
        ctx.fill();
      }
      ctx.restore();
    }
    render(ctx, cameraX) {
      this.renderPlayfield(ctx, cameraX);
    }
    renderPlayfield(ctx, cameraX) {
      ctx.save();
      for (const p of this.platforms) {
        const sx = Math.round(p.x - cameraX);
        const sy = Math.round(p.y);
        if (sx + p.width < -50 || sx > 850) continue;
        if (p.type === "ground" || p.type === "stone_ground") {
          ctx.fillStyle = "#3f3f46";
          ctx.fillRect(sx, sy, p.width, p.height);
          ctx.fillStyle = "#15803d";
          ctx.fillRect(sx, sy, p.width, 6);
          ctx.fillStyle = "#166534";
          ctx.fillRect(sx, sy + 6, p.width, 4);
          ctx.strokeStyle = "#27272a";
          ctx.lineWidth = 1;
          for (let bx = sx; bx < sx + p.width; bx += 32) {
            ctx.beginPath();
            ctx.moveTo(bx, sy + 10);
            ctx.lineTo(bx, sy + p.height);
            ctx.stroke();
          }
        } else if (p.type === "bridge") {
          ctx.fillStyle = "#78350f";
          ctx.fillRect(sx, sy, p.width, p.height);
          ctx.strokeStyle = "#451a03";
          ctx.lineWidth = 2;
          ctx.strokeRect(sx, sy, p.width, p.height);
          for (let bx = sx + 12; bx < sx + p.width; bx += 16) {
            ctx.beginPath();
            ctx.moveTo(bx, sy);
            ctx.lineTo(bx, sy + p.height);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = "#64748b";
          ctx.fillRect(sx, sy, p.width, p.height);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(sx, sy, p.width, 3);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, p.width, p.height);
        }
      }
      const waterSx = Math.round(2290 - cameraX);
      if (waterSx > -150 && waterSx < 850) {
        const waterGrad = ctx.createLinearGradient(0, 420, 0, 500);
        waterGrad.addColorStop(0, "#0284c7");
        waterGrad.addColorStop(1, "#082f49");
        ctx.fillStyle = waterGrad;
        ctx.fillRect(waterSx, 410, 120, 90);
        ctx.fillStyle = "#38bdf8";
        const ripple = Math.sin(performance.now() * 5e-3) * 4;
        ctx.fillRect(waterSx + 20 + ripple, 416, 25, 2);
        ctx.fillRect(waterSx + 70 - ripple, 422, 30, 2);
      }
      for (const l of this.ladders) {
        const sx = Math.round(l.x - cameraX);
        const sy = Math.round(l.y);
        if (sx + l.width < -50 || sx > 850) continue;
        ctx.fillStyle = "#b45309";
        ctx.fillRect(sx, sy, 3, l.height);
        ctx.fillRect(sx + l.width - 3, sy, 3, l.height);
        ctx.fillStyle = "#d97706";
        for (let ry = sy + 6; ry < sy + l.height; ry += 12) {
          ctx.fillRect(sx, ry, l.width, 2.5);
        }
      }
      for (const prop of this.props) {
        const sx = Math.round(prop.x - cameraX);
        const sy = Math.round(prop.y);
        if (sx < -100 || sx > 900) continue;
        if (prop.type === "cross") {
          ctx.fillStyle = "#64748b";
          ctx.fillRect(sx + 8, sy, 8, 48);
          ctx.fillRect(sx, sy + 12, 24, 8);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx + 12, sy + 16, 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (prop.type === "tombstone") {
          ctx.fillStyle = "#475569";
          ctx.beginPath();
          ctx.arc(sx + 10, sy + 10, 10, Math.PI, 0);
          ctx.lineTo(sx + 20, sy + 35);
          ctx.lineTo(sx, sy + 35);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#1e293b";
          ctx.font = "7px sans-serif";
          ctx.fillText("R.I.P.", sx + 2, sy + 22);
        } else if (prop.type === "dead_tree") {
          ctx.fillStyle = "#292524";
          ctx.beginPath();
          ctx.moveTo(sx + 12, sy + 85);
          ctx.lineTo(sx + 18, sy + 40);
          ctx.lineTo(sx + 35, sy + 10);
          ctx.lineTo(sx + 30, sy + 14);
          ctx.lineTo(sx + 18, sy + 32);
          ctx.lineTo(sx + 14, sy);
          ctx.lineTo(sx + 10, sy + 30);
          ctx.lineTo(sx - 10, sy + 15);
          ctx.lineTo(sx - 4, sy + 25);
          ctx.lineTo(sx + 6, sy + 45);
          ctx.lineTo(sx + 2, sy + 85);
          ctx.closePath();
          ctx.fill();
        } else if (prop.type === "torch_pillar") {
          ctx.fillStyle = "#334155";
          ctx.fillRect(sx, sy + 20, 14, 45);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(sx - 2, sy + 16, 18, 5);
          const f = Math.sin(performance.now() * 0.015 + prop.x) * 3;
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.arc(sx + 7, sy + 8 + f, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(sx + 7, sy + 8 + f, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (prop.type === "castle_gate") {
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(sx, sy - 40, 120, 260);
          ctx.fillStyle = "#0f172a";
          for (let bx = sx; bx < sx + 120; bx += 24) {
            ctx.fillRect(bx, sy - 55, 14, 15);
          }
          ctx.fillStyle = "#020617";
          ctx.fillRect(sx + 25, sy + 40, 70, 180);
          const gateRise = Math.round(this.gateProgress * 140);
          ctx.save();
          ctx.beginPath();
          ctx.rect(sx + 25, sy + 40, 70, 180);
          ctx.clip();
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          for (let gx = sx + 32; gx < sx + 90; gx += 11) {
            ctx.beginPath();
            ctx.moveTo(gx, sy + 40 - gateRise);
            ctx.lineTo(gx, sy + 220 - gateRise);
            ctx.stroke();
          }
          for (let gy = sy + 50 - gateRise; gy < sy + 220 - gateRise; gy += 18) {
            ctx.beginPath();
            ctx.moveTo(sx + 25, gy);
            ctx.lineTo(sx + 95, gy);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      if (this.key && this.key.active) {
        const kx = Math.round(this.key.x - cameraX);
        const ky = Math.round(this.key.y);
        ctx.save();
        ctx.fillStyle = "rgba(253, 224, 71, 0.4)";
        ctx.beginPath();
        ctx.arc(kx, ky, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(kx, ky - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(kx, ky - 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#eab308";
        ctx.fillRect(kx - 2, ky - 3, 4, 18);
        ctx.fillRect(kx + 2, ky + 7, 5, 3);
        ctx.fillRect(kx + 2, ky + 12, 4, 3);
        ctx.restore();
      }
      ctx.restore();
    }
  };

  // goodiesandbaddies/js/storage.js
  var STORAGE_KEY_SOUND = "ghosts_sound_enabled";
  var STORAGE_KEY_CRT = "ghosts_crt_enabled";
  var STORAGE_KEY_HISCORE = "ghosts_hi_score";
  var Storage = class {
    static getSoundEnabled() {
      try {
        const val = localStorage.getItem(STORAGE_KEY_SOUND);
        return val !== null ? val === "true" : true;
      } catch {
        return true;
      }
    }
    static setSoundEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
      } catch {
      }
    }
    static getCrtEnabled() {
      try {
        const val = localStorage.getItem(STORAGE_KEY_CRT);
        return val !== null ? val === "true" : true;
      } catch {
        return true;
      }
    }
    static setCrtEnabled(enabled) {
      try {
        localStorage.setItem(STORAGE_KEY_CRT, String(enabled));
      } catch {
      }
    }
    static getHighScore() {
      try {
        const val = localStorage.getItem(STORAGE_KEY_HISCORE);
        return val ? parseInt(val, 10) : 5e3;
      } catch {
        return 5e3;
      }
    }
    static setHighScore(score) {
      try {
        localStorage.setItem(STORAGE_KEY_HISCORE, String(score));
      } catch {
      }
    }
  };

  // goodiesandbaddies/js/audio.js
  var GhostsAudio = class {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.muted = false;
      this.isPlayingBgm = false;
      this.bgmTimer = null;
      this.activeNodes = [];
    }
    init() {
      if (!this.ctx && typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.16;
          this.masterGain.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
    }
    setMuted(muted) {
      this.muted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(muted ? 0 : 0.16, this.ctx.currentTime);
      }
      if (muted) {
        this.stopBGM();
      }
    }
    toggle() {
      this.setMuted(!this.muted);
      return !this.muted;
    }
    // Helper to schedule a tone
    playTone(freq, duration, type = "square", timeOffset = 0, volume = 0.25) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime + timeOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + Math.max(0.02, duration - 0.01));
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + duration);
      this.activeNodes.push({ osc, gain, stopTime: t + duration });
    }
    // -------------------------------------------------------------
    // STAGE 1 THEME: THE HAUNTED GRAVEYARD
    // -------------------------------------------------------------
    playThemeBGM() {
      if (this.muted || this.isPlayingBgm) return;
      this.stopBGM();
      this.init();
      if (!this.ctx) return;
      this.isPlayingBgm = true;
      const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196, A3 = 220, Bb3 = 233.08;
      const C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63, F4 = 349.23, G4 = 392, Ab4 = 415.3, A4 = 440, Bb4 = 466.16, C5 = 523.25, D5 = 587.33;
      const D2 = 73.42, A2 = 110, G2 = 98, F2 = 87.31, E2 = 82.41, Bb2 = 116.54;
      const step = 0.108;
      const melody = [
        // Bar 1-2: Main eerie riff
        { f: D4, d: 2 },
        { f: 0, d: 1 },
        { f: D4, d: 1 },
        { f: F4, d: 2 },
        { f: G4, d: 2 },
        { f: Ab4, d: 3 },
        { f: A4, d: 3 },
        { f: F4, d: 2 },
        { f: D4, d: 4 },
        { f: C4, d: 2 },
        { f: D4, d: 6 },
        { f: 0, d: 4 },
        // Bar 3-4: Ascending tension
        { f: D4, d: 2 },
        { f: F4, d: 2 },
        { f: G4, d: 2 },
        { f: Ab4, d: 2 },
        { f: A4, d: 3 },
        { f: C5, d: 3 },
        { f: Bb4, d: 2 },
        { f: A4, d: 2 },
        { f: G4, d: 2 },
        { f: F4, d: 2 },
        { f: E4, d: 2 },
        { f: D4, d: 4 },
        { f: 0, d: 4 },
        // Bar 5-6: Dramatic cadence
        { f: F4, d: 3 },
        { f: G4, d: 3 },
        { f: A4, d: 2 },
        { f: Bb4, d: 4 },
        { f: A4, d: 2 },
        { f: G4, d: 2 },
        { f: F4, d: 2 },
        { f: E4, d: 2 },
        { f: D4, d: 2 },
        { f: C4, d: 2 },
        { f: D4, d: 6 },
        { f: 0, d: 2 },
        // Bar 7-8: Chilling descent into graveyard loop
        { f: Bb4, d: 3 },
        { f: A4, d: 3 },
        { f: G4, d: 2 },
        { f: A4, d: 3 },
        { f: G4, d: 3 },
        { f: F4, d: 2 },
        { f: G4, d: 2 },
        { f: F4, d: 2 },
        { f: E4, d: 2 },
        { f: Eb4, d: 2 },
        { f: D4, d: 6 },
        { f: 0, d: 4 }
      ];
      const bass = [
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: F2, d: 2 },
        { f: G2, d: 2 },
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: C3, d: 2 },
        { f: C4, d: 2 },
        { f: D2, d: 4 },
        { f: D2, d: 2 },
        { f: D3, d: 2 },
        { f: F2, d: 2 },
        { f: G2, d: 2 },
        { f: A2, d: 2 },
        { f: A3, d: 2 },
        { f: Bb2, d: 2 },
        { f: Bb3, d: 2 },
        { f: A2, d: 2 },
        { f: G2, d: 2 },
        { f: F2, d: 2 },
        { f: E2, d: 2 },
        { f: D2, d: 4 },
        { f: A2, d: 4 },
        { f: Bb2, d: 2 },
        { f: Bb3, d: 2 },
        { f: Bb2, d: 2 },
        { f: Bb3, d: 2 },
        { f: A2, d: 2 },
        { f: A3, d: 2 },
        { f: G2, d: 2 },
        { f: G3, d: 2 },
        { f: F2, d: 2 },
        { f: F3, d: 2 },
        { f: E2, d: 2 },
        { f: E3, d: 2 },
        { f: D2, d: 4 },
        { f: D3, d: 4 }
      ];
      const playLoop = () => {
        if (!this.isPlayingBgm || this.muted) return;
        let mTime = 0;
        melody.forEach((n) => {
          if (n.f > 0) {
            this.playTone(n.f, n.d * step * 0.92, "square", mTime, 0.18);
          }
          mTime += n.d * step;
        });
        let bTime = 0;
        while (bTime < mTime) {
          for (const b of bass) {
            if (bTime >= mTime) break;
            this.playTone(b.f, b.d * step * 0.85, "triangle", bTime, 0.22);
            bTime += b.d * step;
          }
        }
        this.bgmTimer = setTimeout(() => {
          if (this.isPlayingBgm) playLoop();
        }, mTime * 1e3);
      };
      playLoop();
    }
    stopBGM() {
      this.isPlayingBgm = false;
      if (this.bgmTimer) {
        clearTimeout(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
    // -------------------------------------------------------------
    // SFX: ARTHUR ACTIONS
    // -------------------------------------------------------------
    // Jump swoosh
    jump() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.14);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }
    // Lance throw: Crisp metallic woosh
    throwLance() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }
    // Dagger throw: High-speed metallic snap
    throwDagger() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
    // Holy Torch throw
    throwTorch() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(580, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }
    // Ground flame burning crackle
    torchIgnite() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(70, t + 0.25);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    }
    // Arthur takes non-fatal hit: Armor breaks into shards
    armorLost() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.32);
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(550, t);
      osc2.frequency.exponentialRampToValueAtTime(80, t + 0.28);
      gain2.gain.setValueAtTime(0.3, t);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.32);
    }
    // Fatal hit: Skeleton crumbles
    playerDeath() {
      this.stopBGM();
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const drops = [440, 392, 349, 311, 261, 220, 185, 146, 110];
      drops.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.28, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.11);
      });
    }
    // -------------------------------------------------------------
    // SFX: MONSTERS & BOSS
    // -------------------------------------------------------------
    // Zombie popping from ground
    zombieEmerge() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    }
    // Enemy hit / defeated
    enemyKill() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.14);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    }
    // Red Arremer screech
    redArremerScreech() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = "sawtooth";
      osc2.type = "square";
      osc1.frequency.setValueAtTime(980, t);
      osc1.frequency.linearRampToValueAtTime(1400, t + 0.12);
      osc1.frequency.exponentialRampToValueAtTime(600, t + 0.25);
      osc2.frequency.setValueAtTime(1020, t);
      osc2.frequency.linearRampToValueAtTime(1450, t + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(630, t + 0.25);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.26);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.28);
      osc2.stop(t + 0.28);
    }
    // Boss Cyclops hit
    bossHit() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.24);
    }
    // Boss Cyclops defeat explosion
    bossDefeat() {
      this.stopBGM();
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.18;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220 - i * 35, t + delay);
        osc.frequency.exponentialRampToValueAtTime(30, t + delay + 0.22);
        gain.gain.setValueAtTime(0.45, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, t + delay + 0.24);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + delay);
        osc.stop(t + delay + 0.26);
      }
    }
    // -------------------------------------------------------------
    // REWARDS & STAGE CLEAR
    // -------------------------------------------------------------
    // Golden Key sparkle pickup
    keyPickup() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.3, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.2);
      });
    }
    // Weapon / Armor pickup chime
    itemPickup() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.08);
      osc.frequency.setValueAtTime(783.99, t + 0.16);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.32);
    }
    // Stage Clear Fanfare: Capcom 1985 victorious fanfare
    stageClearFanfare() {
      this.stopBGM();
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const melody = [
        { f: 587.33, d: 0.12 },
        // D5
        { f: 587.33, d: 0.12 },
        // D5
        { f: 587.33, d: 0.12 },
        // D5
        { f: 587.33, d: 0.36 },
        // D5
        { f: 466.16, d: 0.24 },
        // Bb4
        { f: 523.25, d: 0.24 },
        // C5
        { f: 587.33, d: 0.48 },
        // D5
        { f: 523.25, d: 0.24 },
        // C5
        { f: 587.33, d: 0.8 }
        // D5 sustain
      ];
      let curTime = t;
      melody.forEach((n) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(n.f, curTime);
        gain.gain.setValueAtTime(0.35, curTime);
        gain.gain.exponentialRampToValueAtTime(0.01, curTime + n.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(curTime);
        osc.stop(curTime + n.d + 0.05);
        curTime += n.d;
      });
    }
  };
  var sound = new GhostsAudio();

  // goodiesandbaddies/js/game.js
  var GhostsGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width;
      this.height = canvas.height;
      this.options = options;
      this.state = "TITLE";
      this.previousState = "TITLE";
      this.score = 0;
      this.highScore = Storage.getHighScore();
      this.timeRemaining = 150;
      this.cameraX = 0;
      this.checkpointX = 100;
      this.checkpointY = 366;
      this.level = new Level1();
      this.arthur = new Arthur(this.checkpointX, this.checkpointY);
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.enemies = [];
      this.itemDrops = [];
      this.particles = [];
      this.shakeTimer = 0;
      this.shakeIntensity = 0;
      this.zombieSpawnTimer = 2;
      this.stageStartTimer = 0;
      this.stageClearTimer = 0;
      this.gameOverTimer = 0;
      this.input = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        fire: false
      };
      this.sound = sound;
      this.initEnemies();
    }
    // Populate fixed stage entities
    initEnemies() {
      this.enemies = [
        // Sector 1: Graveyard Bats & Fearsome Red Arremer
        new Enemy({ x: 620, y: 220, type: "bat", facingRight: false }),
        new Enemy({ x: 1240, y: 210, type: "bat", facingRight: false }),
        new Enemy({ x: 1540, y: 250, type: "red_arremer", facingRight: false }),
        // Sector 2: Forest of Despair Spitters & Bats
        new Enemy({ x: 1950, y: 210, type: "bat", facingRight: true }),
        new Enemy({ x: 2200, y: 366, type: "plant", facingRight: false }),
        new Enemy({ x: 2450, y: 366, type: "plant", facingRight: false }),
        // Sector 4: Level 1 Boss: The Cyclops guarding castle gate
        new Enemy({ x: 3340, y: 372, type: "boss_cyclops", facingRight: false })
      ];
    }
    startNewGame() {
      this.score = 0;
      this.timeRemaining = 150;
      this.checkpointX = 100;
      this.checkpointY = 366;
      this.level = new Level1();
      this.arthur = new Arthur(this.checkpointX, this.checkpointY);
      this.arthur.lives = 3;
      this.arthur.armorLevel = 2;
      this.arthur.weaponType = "lance";
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.itemDrops = [];
      this.particles = [];
      this.cameraX = 0;
      this.initEnemies();
      this.state = "STAGE_START";
      this.stageStartTimer = 2;
      this.sound.stopBGM();
      if (this.options.onHudUpdate) {
        this.options.onHudUpdate(this.getHudData());
      }
    }
    respawnArthur() {
      this.arthur.resetToCheckpoint(this.checkpointX, this.checkpointY);
      this.projectiles = [];
      this.enemyProjectiles = [];
      this.enemies = this.enemies.filter((e) => {
        if (e.type === "zombie" && Math.abs(e.x - this.checkpointX) < 350) {
          return false;
        }
        return true;
      });
      this.state = "PLAYING";
      this.sound.playThemeBGM();
    }
    triggerShake(duration = 0.25, intensity = 4) {
      this.shakeTimer = duration;
      this.shakeIntensity = intensity;
    }
    spawnParticleBurst(x, y, count = 8, color = "#f8fafc", size = 3, speed = 120) {
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.4;
        const spd = speed * (0.6 + Math.random() * 0.8);
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 40,
          color,
          size: size * (0.7 + Math.random() * 0.6),
          alpha: 1,
          life: 0.4 + Math.random() * 0.3
        });
      }
    }
    handleFire() {
      if (this.state !== "PLAYING") return;
      if (this.arthur.grounded) {
        if (this.input.lastHorizontal === "left" || this.input.left && !this.input.right) {
          this.arthur.facingRight = false;
        } else if (this.input.lastHorizontal === "right" || this.input.right && !this.input.left) {
          this.arthur.facingRight = true;
        }
      }
      const proj = this.arthur.throwWeapon(this.projectiles);
      if (proj) {
        this.projectiles.push(proj);
        if (proj.type === "dagger") {
          this.sound.throwDagger();
        } else if (proj.type === "torch") {
          this.sound.throwTorch();
        } else {
          this.sound.throwLance();
        }
      }
    }
    togglePause() {
      if (this.state === "PLAYING") {
        this.previousState = "PLAYING";
        this.state = "PAUSED";
        this.sound.stopBGM();
      } else if (this.state === "PAUSED") {
        this.state = this.previousState;
        this.sound.playThemeBGM();
      }
    }
    getHudData() {
      return {
        score: this.score,
        highScore: this.highScore,
        lives: this.arthur.lives,
        armor: this.arthur.armorLevel,
        weapon: this.arthur.weaponType,
        weaponName: (WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE).name,
        weaponIcon: (WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE).icon,
        time: Math.ceil(this.timeRemaining),
        state: this.state
      };
    }
    update(dt) {
      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.alpha = Math.max(0, p.life / 0.5);
      }
      if (this.state === "TITLE") {
        return;
      }
      if (this.state === "STAGE_START") {
        this.stageStartTimer -= dt;
        if (this.stageStartTimer <= 0) {
          this.state = "PLAYING";
          this.sound.playThemeBGM();
        }
        return;
      }
      if (this.state === "PAUSED") {
        return;
      }
      if (this.state === "STAGE_CLEAR") {
        this.stageClearTimer += dt;
        if (this.arthur.x < 3650) {
          this.arthur.x += 65 * dt;
          this.arthur.state = "WALK";
          this.arthur.facingRight = true;
        }
        if (Math.random() < 0.2) {
          const colors = ["#fef08a", "#38bdf8", "#4ade80", "#f472b6", "#fb923c"];
          const col = colors[Math.floor(Math.random() * colors.length)];
          this.spawnParticleBurst(
            this.cameraX + Math.random() * this.width,
            80 + Math.random() * 200,
            6,
            col,
            4,
            100
          );
        }
        this.cameraX = Math.min(this.level.width - this.width, Math.max(0, this.arthur.x - 300));
        return;
      }
      if (this.state === "GAME_OVER") {
        this.gameOverTimer += dt;
        return;
      }
      if (this.state === "PLAYING") {
        this.timeRemaining = Math.max(0, this.timeRemaining - dt);
        if (this.timeRemaining <= 0 && this.arthur.state !== "DEAD") {
          this.arthur.armorLevel = 0;
          this.arthur.state = "DEAD";
          this.arthur.deathTimer = 2.5;
          this.arthur.lives = Math.max(0, this.arthur.lives - 1);
          this.sound.playerDeath();
        }
        this.arthur.update(dt, this.input, this.level.platforms, this.level.ladders);
        if (this.arthur.x > 1750 && this.checkpointX < 1750) {
          this.checkpointX = 1750;
          this.checkpointY = 366;
        }
        if (this.arthur.y > 450 && this.arthur.state !== "DEAD") {
          this.arthur.armorLevel = 0;
          this.arthur.state = "DEAD";
          this.arthur.deathTimer = 2.5;
          this.arthur.lives = Math.max(0, this.arthur.lives - 1);
          this.triggerShake(0.3, 6);
          this.sound.playerDeath();
        }
        if (this.arthur.state === "DEAD") {
          if (this.arthur.deathTimer <= 0) {
            if (this.arthur.lives > 0) {
              this.respawnArthur();
            } else {
              this.state = "GAME_OVER";
              this.gameOverTimer = 0;
              this.sound.stopBGM();
              if (this.score > this.highScore) {
                this.highScore = this.score;
                Storage.setHighScore(this.highScore);
              }
              if (this.options.onGameOver) {
                this.options.onGameOver(this.score);
              }
            }
          }
        }
        if (this.arthur.x < 2100) {
          this.zombieSpawnTimer -= dt;
          const activeZombies = this.enemies.filter((e) => e.active && e.type === "zombie").length;
          if (this.zombieSpawnTimer <= 0 && activeZombies < 4) {
            this.zombieSpawnTimer = 2.4 + Math.random() * 1.8;
            const offset = (Math.random() < 0.65 ? 1 : -1) * (180 + Math.random() * 140);
            const spawnX = Math.max(60, Math.min(2080, this.arthur.x + offset));
            this.enemies.push(new Enemy({ x: spawnX, y: 368, type: "zombie", facingRight: false }));
            this.sound.zombieEmerge();
          }
        }
        const lvlEvent = this.level.update(dt, this.arthur);
        if (lvlEvent === "KEY_COLLECTED") {
          this.score += 2e3;
          this.sound.keyPickup();
          this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 16, "#fef08a", 4, 160);
        }
        if (this.level.gateOpen && this.arthur.x > 3540) {
          this.state = "STAGE_CLEAR";
          this.stageClearTimer = 0;
          const timeBonus = Math.ceil(this.timeRemaining) * 100;
          this.score += timeBonus;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            Storage.setHighScore(this.highScore);
          }
          this.sound.stageClearFanfare();
          if (this.options.onStageClear) {
            this.options.onStageClear(this.score, timeBonus);
          }
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const p = this.projectiles[i];
          p.update(dt, this.level.platforms, this.cameraX);
          if (p.type === "torch" && p.isIgnited && p.burnTimer > 1.4) {
            this.sound.torchIgnite();
          }
          if (!p.active) {
            this.projectiles.splice(i, 1);
            continue;
          }
          let projRemoved = false;
          for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            let hit = false;
            if (p.isIgnited) {
              hit = checkAABB(
                { x: p.x - 12, y: p.y - 12, width: 24, height: 16 },
                { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
              );
            } else {
              hit = checkCircleAABB(
                { x: p.x, y: p.y, radius: p.radius },
                { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
              );
            }
            if (hit) {
              const destroyed = enemy.takeDamage(p.damage);
              this.spawnParticleBurst(p.x, p.y, 6, "#f59e0b", 3, 90);
              if (enemy.type === "boss_cyclops") {
                this.sound.bossHit();
                this.triggerShake(0.18, 5);
              }
              if (destroyed) {
                this.score += enemy.points;
                this.spawnParticleBurst(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2,
                  14,
                  enemy.type === "red_arremer" ? "#ef4444" : "#65a30d",
                  4,
                  140
                );
                if (enemy.type === "boss_cyclops") {
                  this.sound.bossDefeat();
                  this.triggerShake(0.6, 8);
                  this.level.spawnKey(enemy.x + 16, enemy.y + 20);
                } else {
                  this.sound.enemyKill();
                  if (Math.random() < 0.22) {
                    const roll = Math.random();
                    if (roll < 0.35) {
                      this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: "weapon", weaponType: "dagger" }));
                    } else if (roll < 0.7) {
                      this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: "weapon", weaponType: "torch" }));
                    } else {
                      this.itemDrops.push(new ItemDrop({ x: enemy.x, y: enemy.y, type: "armor" }));
                    }
                  }
                }
              }
              if (!p.isIgnited) {
                p.active = false;
                projRemoved = true;
                this.projectiles.splice(i, 1);
                break;
              }
            }
          }
        }
        for (const enemy of this.enemies) {
          if (!enemy.active) continue;
          if (enemy.type === "red_arremer" && enemy.state === "HOVER" && enemy.actionTimer > 0.9) {
            this.sound.redArremerScreech();
          }
          enemy.update(dt, this.arthur, this.level.platforms, this.enemyProjectiles, this.itemDrops);
          if (this.arthur.state !== "DEAD" && this.arthur.invulnerableTimer <= 0) {
            const touch = checkAABB(
              { x: this.arthur.x + 4, y: this.arthur.y + 4, width: this.arthur.width - 8, height: this.arthur.height - 4 },
              { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
            );
            if (touch) {
              const hitResult = this.arthur.takeDamage();
              if (hitResult === "ARMOR_LOST") {
                this.sound.armorLost();
                this.triggerShake(0.25, 6);
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 12, "#94a3b8", 4, 140);
              } else if (hitResult === "KILLED") {
                this.sound.playerDeath();
                this.triggerShake(0.4, 8);
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 18, "#f8fafc", 4, 160);
              }
            }
          }
        }
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
          const ep = this.enemyProjectiles[i];
          ep.x += ep.vx * dt;
          ep.y += ep.vy * dt;
          if (ep.x < this.cameraX - 100 || ep.x > this.cameraX + this.width + 100) {
            this.enemyProjectiles.splice(i, 1);
            continue;
          }
          if (this.arthur.state !== "DEAD" && this.arthur.invulnerableTimer <= 0) {
            const hit = checkCircleAABB(
              { x: ep.x, y: ep.y, radius: ep.radius || 6 },
              { x: this.arthur.x + 4, y: this.arthur.y + 4, width: this.arthur.width - 8, height: this.arthur.height - 4 }
            );
            if (hit) {
              this.enemyProjectiles.splice(i, 1);
              const hitResult = this.arthur.takeDamage();
              if (hitResult === "ARMOR_LOST") {
                this.sound.armorLost();
                this.triggerShake(0.25, 6);
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 12, "#94a3b8", 4, 140);
              } else if (hitResult === "KILLED") {
                this.sound.playerDeath();
                this.triggerShake(0.4, 8);
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 18, "#f8fafc", 4, 160);
              }
            }
          }
        }
        for (let i = this.itemDrops.length - 1; i >= 0; i--) {
          const item = this.itemDrops[i];
          item.update(dt, this.level.platforms);
          if (!item.active) {
            this.itemDrops.splice(i, 1);
            continue;
          }
          if (this.arthur.state !== "DEAD") {
            const touch = checkAABB(
              { x: this.arthur.x, y: this.arthur.y, width: this.arthur.width, height: this.arthur.height },
              { x: item.x, y: item.y, width: item.width, height: item.height }
            );
            if (touch) {
              item.active = false;
              if (item.type === "armor") {
                const restored = this.arthur.restoreArmor();
                this.score += 500;
                this.sound.itemPickup();
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 10, "#eab308", 3, 110);
              } else {
                this.arthur.weaponType = item.weaponType;
                this.score += 200;
                this.sound.itemPickup();
                this.spawnParticleBurst(this.arthur.x + 12, this.arthur.y + 16, 8, "#38bdf8", 3, 110);
              }
              this.itemDrops.splice(i, 1);
            }
          }
        }
        const targetCamX = this.arthur.x - 300;
        this.cameraX = Math.max(0, Math.min(this.level.width - this.width, targetCamX));
        if (this.options.onHudUpdate) {
          this.options.onHudUpdate(this.getHudData());
        }
      }
    }
    render() {
      this.ctx.save();
      if (this.shakeTimer > 0) {
        const offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
        const offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        this.ctx.translate(offsetX, offsetY);
      }
      this.level.renderParallax(this.ctx, this.cameraX);
      this.level.render(this.ctx, this.cameraX);
      for (const item of this.itemDrops) {
        item.render(this.ctx, this.cameraX);
      }
      for (const enemy of this.enemies) {
        enemy.render(this.ctx, this.cameraX);
      }
      this.ctx.save();
      for (const ep of this.enemyProjectiles) {
        const sx = Math.round(ep.x - this.cameraX);
        const sy = Math.round(ep.y);
        this.ctx.fillStyle = "#ef4444";
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, ep.radius || 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = "#fef08a";
        this.ctx.beginPath();
        this.ctx.arc(sx - 1, sy - 1, (ep.radius || 6) * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
      this.arthur.render(this.ctx, this.cameraX);
      for (const p of this.projectiles) {
        p.render(this.ctx, this.cameraX);
      }
      for (const p of this.particles) {
        const sx = Math.round(p.x - this.cameraX);
        const sy = Math.round(p.y);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
      }
      this.ctx.globalAlpha = 1;
      this.ctx.restore();
      this.renderHUD();
      if (this.state === "TITLE") {
        this.renderTitleScreen();
      } else if (this.state === "STAGE_START") {
        this.renderStageStartScreen();
      } else if (this.state === "PAUSED") {
        this.renderPauseScreen();
      } else if (this.state === "STAGE_CLEAR") {
        this.renderStageClearScreen();
      } else if (this.state === "GAME_OVER") {
        this.renderGameOverScreen();
      }
    }
    renderHUD() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      this.ctx.fillRect(0, 0, this.width, 36);
      this.ctx.font = 'bold 12px "Courier New", monospace';
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#f87171";
      this.ctx.fillText("1UP", 18, 14);
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.fillText(String(this.score).padStart(6, "0"), 50, 14);
      this.ctx.fillStyle = "#fbbf24";
      this.ctx.fillText("HIGH", 150, 14);
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.fillText(String(Math.max(this.score, this.highScore)).padStart(6, "0"), 188, 14);
      this.ctx.fillStyle = "#60a5fa";
      this.ctx.fillText("TIME", 320, 14);
      this.ctx.fillStyle = this.timeRemaining < 30 ? "#ef4444" : "#f8fafc";
      this.ctx.fillText(String(Math.ceil(this.timeRemaining)).padStart(3, "0"), 360, 14);
      const wDef = WEAPON_TYPES[this.arthur.weaponType.toUpperCase()] || WEAPON_TYPES.LANCE;
      this.ctx.fillStyle = "#e2e8f0";
      this.ctx.fillText(`WEAPON: ${wDef.name} ${wDef.icon}`, 440, 14);
      this.ctx.fillStyle = "#38bdf8";
      this.ctx.fillText(`LIVES: ${this.arthur.lives}`, 660, 14);
      const armorIcon = this.arthur.armorLevel === 2 ? "\u{1F6E1}\uFE0F STEEL" : this.arthur.armorLevel === 1 ? "\u{1FA73} BOXER" : "\u{1F480} CRUMBLED";
      this.ctx.fillStyle = this.arthur.armorLevel === 2 ? "#4ade80" : this.arthur.armorLevel === 1 ? "#f59e0b" : "#ef4444";
      this.ctx.fillText(armorIcon, 730, 14);
      this.ctx.restore();
    }
    renderTitleScreen() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(10, 10, 18, 0.82)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#ef4444";
      this.ctx.font = 'bold 36px "Courier New", monospace';
      this.ctx.fillText("GOODIES AND BADDIES", this.width / 2, 140);
      ctxShadow(this.ctx, "#000", 8);
      this.ctx.fillStyle = "#fbbf24";
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.fillText("STAGE 1: THE HAUNTED GRAVEYARD", this.width / 2, 185);
      const blink = Math.floor(Date.now() / 450) % 2 === 0;
      if (blink) {
        this.ctx.fillStyle = "#f8fafc";
        this.ctx.font = 'bold 18px "Courier New", monospace';
        this.ctx.fillText("PRESS SPACE OR CLICK TO START", this.width / 2, 260);
      }
      this.ctx.fillStyle = "#94a3b8";
      this.ctx.font = '13px "Courier New", monospace';
      this.ctx.fillText("ARROWS / WASD : MOVE & CLIMB LADDERS | DOWN : CROUCH", this.width / 2, 330);
      this.ctx.fillText("SPACE / Z : JUMP (COMMITTED TRAJECTORY)", this.width / 2, 355);
      this.ctx.fillText("X / CTRL : THROW WEAPON | P : PAUSE | M : MUTE", this.width / 2, 380);
      this.ctx.fillStyle = "#64748b";
      this.ctx.font = '11px "Courier New", monospace';
      this.ctx.fillText("DEFEAT THE RED ARREMER & CYCLOPS TO CLAIM THE GOLDEN KEY", this.width / 2, 430);
      this.ctx.restore();
    }
    renderStageStartScreen() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#fbbf24";
      this.ctx.font = 'bold 24px "Courier New", monospace';
      this.ctx.fillText("STAGE 1", this.width / 2, this.height / 2 - 25);
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.font = 'bold 16px "Courier New", monospace';
      this.ctx.fillText("THE HAUNTED GRAVEYARD", this.width / 2, this.height / 2 + 15);
      this.ctx.restore();
    }
    renderPauseScreen() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#38bdf8";
      this.ctx.font = 'bold 28px "Courier New", monospace';
      this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 15);
      this.ctx.fillStyle = "#94a3b8";
      this.ctx.font = '14px "Courier New", monospace';
      this.ctx.fillText("PRESS P TO RESUME", this.width / 2, this.height / 2 + 25);
      this.ctx.restore();
    }
    renderStageClearScreen() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#4ade80";
      this.ctx.font = 'bold 32px "Courier New", monospace';
      this.ctx.fillText("STAGE 1 CLEAR!", this.width / 2, 160);
      this.ctx.fillStyle = "#fef08a";
      this.ctx.font = 'bold 20px "Courier New", monospace';
      this.ctx.fillText(`TOTAL SCORE: ${this.score}`, this.width / 2, 220);
      this.ctx.fillStyle = "#38bdf8";
      this.ctx.font = '16px "Courier New", monospace';
      this.ctx.fillText("THE CASTLE GATES HAVE OPENED!", this.width / 2, 270);
      const blink = Math.floor(Date.now() / 450) % 2 === 0;
      if (blink) {
        this.ctx.fillStyle = "#f8fafc";
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillText("PRESS SPACE TO PLAY AGAIN", this.width / 2, 340);
      }
      this.ctx.restore();
    }
    renderGameOverScreen() {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = "#ef4444";
      this.ctx.font = 'bold 36px "Courier New", monospace';
      this.ctx.fillText("GAME OVER", this.width / 2, 170);
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.font = 'bold 18px "Courier New", monospace';
      this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, 230);
      if (this.score >= this.highScore && this.score > 0) {
        this.ctx.fillStyle = "#fbbf24";
        this.ctx.font = 'bold 14px "Courier New", monospace';
        this.ctx.fillText("\u2605 NEW HIGH SCORE! \u2605", this.width / 2, 265);
      }
      const blink = Math.floor(Date.now() / 450) % 2 === 0;
      if (blink) {
        this.ctx.fillStyle = "#e2e8f0";
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillText("PRESS SPACE OR CLICK TO RETRY", this.width / 2, 330);
      }
      this.ctx.restore();
    }
  };
  function ctxShadow(ctx, color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }

  // goodiesandbaddies/js/main.js
  var GhostsApp = class {
    constructor() {
      this.canvas = document.getElementById("ghosts-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.hudScore = document.getElementById("hud-score");
      this.hudHighScore = document.getElementById("hud-hi-score");
      this.hudTime = document.getElementById("hud-time");
      this.hudLives = document.getElementById("hud-lives");
      this.hudArmor = document.getElementById("hud-armor");
      this.hudWeapon = document.getElementById("hud-weapon");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.btnPause = document.getElementById("btn-pause-game");
      this.btnRestart = document.getElementById("btn-restart-game");
      const soundPref = Storage.getSoundEnabled();
      sound.setMuted(!soundPref);
      this.updateSoundBtnUI();
      this.crtEnabled = Storage.getCrtEnabled();
      this.updateCrtUI();
      this.initGame();
      this.bindEvents();
      this.bindTouchControls();
      this.lastTime = performance.now();
      this.loop = (now) => {
        const dt = Math.min((now - this.lastTime) / 1e3, 0.1);
        this.lastTime = now;
        this.game.update(dt);
        this.game.render();
        requestAnimationFrame(this.loop);
      };
      requestAnimationFrame(this.loop);
    }
    initGame() {
      this.game = new GhostsGame(this.canvas, {
        onHudUpdate: (data) => this.handleHudUpdate(data),
        onGameOver: (finalScore) => this.handleGameOver(finalScore),
        onStageClear: (finalScore, timeBonus) => this.handleStageClear(finalScore, timeBonus)
      });
    }
    handleHudUpdate(data) {
      if (this.hudScore) {
        this.hudScore.textContent = String(data.score).padStart(6, "0");
      }
      if (this.hudHighScore) {
        this.hudHighScore.textContent = String(Math.max(data.score, data.highScore)).padStart(6, "0");
      }
      if (this.hudTime) {
        this.hudTime.textContent = String(data.time).padStart(3, "0");
        this.hudTime.style.color = data.time < 30 ? "#ef4444" : "#60a5fa";
      }
      if (this.hudLives) {
        this.hudLives.textContent = `x${data.lives}`;
      }
      if (this.hudArmor) {
        if (data.armor === 2) {
          this.hudArmor.textContent = "STEEL";
          this.hudArmor.className = "hud-badge badge-steel";
        } else if (data.armor === 1) {
          this.hudArmor.textContent = "BOXERS";
          this.hudArmor.className = "hud-badge badge-boxers";
        } else {
          this.hudArmor.textContent = "DEAD";
          this.hudArmor.className = "hud-badge badge-dead";
        }
      }
      if (this.hudWeapon) {
        this.hudWeapon.textContent = `${data.weaponIcon} ${data.weaponName}`;
      }
    }
    async handleGameOver(finalScore) {
      try {
        await fetch("/api/games/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            gameId: "goodiesandbaddies",
            score: Math.max(0, parseInt(finalScore, 10) || 0),
            level: 1,
            status: "complete",
            result: `Defeated in Stage 1 (${finalScore} pts)`
          })
        });
      } catch {
      }
    }
    async handleStageClear(finalScore, timeBonus) {
      try {
        await fetch("/api/games/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            gameId: "goodiesandbaddies",
            score: Math.max(0, parseInt(finalScore, 10) || 0),
            level: 1,
            status: "complete",
            result: `STAGE 1 CLEARED! (${finalScore} pts, +${timeBonus} time bonus)`
          })
        });
      } catch {
      }
    }
    bindEvents() {
      window.addEventListener("keydown", (e) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
          e.preventDefault();
        }
        if (e.key === " " || e.key === "Enter") {
          if (this.game.state === "TITLE" || this.game.state === "GAME_OVER" || this.game.state === "STAGE_CLEAR") {
            this.game.startNewGame();
            return;
          }
        }
        if (e.key === "p" || e.key === "P") {
          this.game.togglePause();
          return;
        }
        if (e.key === "m" || e.key === "M") {
          this.toggleSound();
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" || e.code === "ArrowLeft" || e.code === "KeyA") {
          this.game.input.left = true;
          this.game.input.lastHorizontal = "left";
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = false;
          }
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.code === "ArrowRight" || e.code === "KeyD") {
          this.game.input.right = true;
          this.game.input.lastHorizontal = "right";
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = true;
          }
        }
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.code === "ArrowUp" || e.code === "KeyW") {
          this.game.input.up = true;
        }
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S" || e.code === "ArrowDown" || e.code === "KeyS") {
          this.game.input.down = true;
        }
        if (e.key === " " || e.key === "z" || e.key === "Z" || e.key === "k" || e.key === "K" || e.code === "Space" || e.code === "KeyZ" || e.code === "KeyK") {
          if (!this.game.input.jump) {
            this.game.input.jump = true;
            if (this.game.state === "PLAYING" && this.game.arthur.grounded) {
              this.game.sound.jump();
            }
          }
        }
        if (e.key === "x" || e.key === "X" || e.key === "f" || e.key === "F" || e.key === "c" || e.key === "C" || e.key === "j" || e.key === "J" || e.key === "Control" || e.code === "KeyX" || e.code === "KeyF" || e.code === "KeyC" || e.code === "KeyJ" || e.code === "ControlLeft" || e.code === "ControlRight") {
          this.game.handleFire();
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A" || e.code === "ArrowLeft" || e.code === "KeyA") {
          this.game.input.left = false;
          if (this.game.input.right) {
            this.game.input.lastHorizontal = "right";
            if (this.game.arthur && this.game.arthur.grounded) {
              this.game.arthur.facingRight = true;
            }
          } else if (this.game.input.lastHorizontal === "left") {
            this.game.input.lastHorizontal = null;
          }
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D" || e.code === "ArrowRight" || e.code === "KeyD") {
          this.game.input.right = false;
          if (this.game.input.left) {
            this.game.input.lastHorizontal = "left";
            if (this.game.arthur && this.game.arthur.grounded) {
              this.game.arthur.facingRight = false;
            }
          } else if (this.game.input.lastHorizontal === "right") {
            this.game.input.lastHorizontal = null;
          }
        }
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.code === "ArrowUp" || e.code === "KeyW") {
          this.game.input.up = false;
        }
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S" || e.code === "ArrowDown" || e.code === "KeyS") {
          this.game.input.down = false;
        }
        if (e.key === " " || e.key === "z" || e.key === "Z" || e.key === "k" || e.key === "K" || e.code === "Space" || e.code === "KeyZ" || e.code === "KeyK") {
          this.game.input.jump = false;
        }
      });
      this.canvas.addEventListener("click", () => {
        sound.init();
        if (this.game.state === "TITLE" || this.game.state === "GAME_OVER" || this.game.state === "STAGE_CLEAR") {
          this.game.startNewGame();
        }
      });
      if (this.btnToggleSound) {
        this.btnToggleSound.addEventListener("click", () => this.toggleSound());
      }
      if (this.btnToggleCrt) {
        this.btnToggleCrt.addEventListener("click", () => this.toggleCrt());
      }
      if (this.btnPause) {
        this.btnPause.addEventListener("click", () => this.game.togglePause());
      }
      if (this.btnRestart) {
        this.btnRestart.addEventListener("click", () => {
          sound.init();
          this.game.startNewGame();
        });
      }
      const btnBypassRotate = document.getElementById("btn-bypass-rotate");
      if (btnBypassRotate) {
        btnBypassRotate.addEventListener("click", () => {
          document.body.classList.add("portrait-bypassed");
        });
      }
    }
    bindTouchControls() {
      const bindBtn = (id, onDown, onUp) => {
        const el = document.getElementById(id);
        if (!el) return;
        const startHandler = (e) => {
          e.preventDefault();
          sound.init();
          onDown();
        };
        const endHandler = (e) => {
          e.preventDefault();
          onUp();
        };
        el.addEventListener("touchstart", startHandler, { passive: false });
        el.addEventListener("touchend", endHandler, { passive: false });
        el.addEventListener("mousedown", startHandler);
        el.addEventListener("mouseup", endHandler);
      };
      bindBtn("touch-btn-left", () => {
        this.game.input.left = true;
        this.game.input.lastHorizontal = "left";
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = false;
        }
      }, () => {
        this.game.input.left = false;
        if (this.game.input.right) {
          this.game.input.lastHorizontal = "right";
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = true;
          }
        } else if (this.game.input.lastHorizontal === "left") {
          this.game.input.lastHorizontal = null;
        }
      });
      bindBtn("touch-btn-right", () => {
        this.game.input.right = true;
        this.game.input.lastHorizontal = "right";
        if (this.game.arthur && this.game.arthur.grounded) {
          this.game.arthur.facingRight = true;
        }
      }, () => {
        this.game.input.right = false;
        if (this.game.input.left) {
          this.game.input.lastHorizontal = "left";
          if (this.game.arthur && this.game.arthur.grounded) {
            this.game.arthur.facingRight = false;
          }
        } else if (this.game.input.lastHorizontal === "right") {
          this.game.input.lastHorizontal = null;
        }
      });
      bindBtn("touch-btn-up", () => {
        this.game.input.up = true;
      }, () => {
        this.game.input.up = false;
      });
      bindBtn("touch-btn-down", () => {
        this.game.input.down = true;
      }, () => {
        this.game.input.down = false;
      });
      bindBtn("touch-btn-jump", () => {
        if (this.game.state === "TITLE" || this.game.state === "GAME_OVER" || this.game.state === "STAGE_CLEAR") {
          this.game.startNewGame();
          return;
        }
        this.game.input.jump = true;
        if (this.game.state === "PLAYING" && this.game.arthur.grounded) {
          this.game.sound.jump();
        }
      }, () => {
        this.game.input.jump = false;
      });
      bindBtn("touch-btn-fire", () => {
        if (this.game.state === "TITLE" || this.game.state === "GAME_OVER" || this.game.state === "STAGE_CLEAR") {
          this.game.startNewGame();
          return;
        }
        this.game.handleFire();
      }, () => {
      });
    }
    toggleSound() {
      const newState = sound.toggle();
      Storage.setSoundEnabled(newState);
      this.updateSoundBtnUI();
    }
    updateSoundBtnUI() {
      if (this.soundIcon) {
        this.soundIcon.textContent = !sound.muted ? "\u{1F50A}" : "\u{1F507}";
      }
      if (this.btnToggleSound) {
        this.btnToggleSound.classList.toggle("active", !sound.muted);
      }
    }
    toggleCrt() {
      this.crtEnabled = !this.crtEnabled;
      Storage.setCrtEnabled(this.crtEnabled);
      this.updateCrtUI();
    }
    updateCrtUI() {
      if (this.crtOverlay) {
        this.crtOverlay.style.display = this.crtEnabled ? "block" : "none";
      }
      if (this.btnToggleCrt) {
        this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
        this.btnToggleCrt.textContent = this.crtEnabled ? "CRT: ON" : "CRT: OFF";
      }
    }
  };
  function boot() {
    new GhostsApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
