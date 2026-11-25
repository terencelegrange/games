(() => {
  // sharpshooter/js/crosshair.js
  var Crosshair = class {
    constructor(canvasWidth = 900, canvasHeight = 500) {
      this.canvasWidth = canvasWidth;
      this.canvasHeight = canvasHeight;
      this.x = canvasWidth / 2;
      this.y = canvasHeight / 2;
      this.baseRadius = 38;
      this.hitRadius = 30;
      this.recoilScale = 1;
      this.muzzleFlashTimer = 0;
      this.flashOpacity = 0;
      this.sparks = [];
    }
    resize(width, height) {
      this.canvasWidth = width;
      this.canvasHeight = height;
      this.x = width / 2;
      this.y = height / 2;
    }
    // Trigger gun firing recoil and muzzle blast
    fire() {
      this.recoilScale = 1.35;
      this.muzzleFlashTimer = 0.09;
      this.flashOpacity = 0.85;
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        this.sparks.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.2 + Math.random() * 0.15,
          maxLife: 0.35,
          color: Math.random() > 0.4 ? "#fef08a" : "#f97316",
          size: 2 + Math.random() * 3
        });
      }
    }
    // Check if a moving target overlaps the central crosshair
    checkHit(target) {
      if (!target || !target.active || target.state === "hit") {
        return { hit: false, bullseye: false, distance: 999 };
      }
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitTolerance = this.hitRadius + target.radius;
      const hit = dist <= hitTolerance;
      const bullseye = dist <= 14;
      return {
        hit,
        bullseye,
        distance: dist
      };
    }
    update(dt = 1 / 60) {
      if (this.recoilScale > 1) {
        this.recoilScale = Math.max(1, this.recoilScale - dt * 2.8);
      }
      if (this.muzzleFlashTimer > 0) {
        this.muzzleFlashTimer -= dt;
        this.flashOpacity = Math.max(0, this.muzzleFlashTimer / 0.09);
      } else {
        this.flashOpacity = 0;
      }
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) {
          this.sparks.splice(i, 1);
        }
      }
    }
    render(ctx) {
      ctx.save();
      if (this.flashOpacity > 0.01) {
        ctx.save();
        const flashGrad = ctx.createRadialGradient(
          this.x,
          this.y,
          10,
          this.x,
          this.y,
          180
        );
        flashGrad.addColorStop(0, `rgba(255, 255, 230, ${this.flashOpacity})`);
        flashGrad.addColorStop(0.3, `rgba(253, 224, 71, ${this.flashOpacity * 0.7})`);
        flashGrad.addColorStop(0.7, `rgba(249, 115, 22, ${this.flashOpacity * 0.3})`);
        flashGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 180, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (const s of this.sparks) {
        const alpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const r = this.baseRadius * this.recoilScale;
      const innerR = 14 * this.recoilScale;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, innerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.x - r - 16, this.y);
      ctx.lineTo(this.x - innerR - 2, this.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x + innerR + 2, this.y);
      ctx.lineTo(this.x + r + 16, this.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - r - 16);
      ctx.lineTo(this.x, this.y - innerR - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + innerR + 2);
      ctx.lineTo(this.x, this.y + r + 16);
      ctx.stroke();
      const notchOffset = r * 0.707;
      ctx.fillStyle = "#ef4444";
      [
        [this.x - notchOffset, this.y - notchOffset],
        [this.x + notchOffset, this.y - notchOffset],
        [this.x - notchOffset, this.y + notchOffset],
        [this.x + notchOffset, this.y + notchOffset]
      ].forEach(([nx, ny]) => {
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // sharpshooter/js/targets.js
  var TARGET_TYPES = {
    1: { id: "duck", name: "MALLARD DUCK", icon: "\u{1F986}", radius: 34 },
    2: { id: "circle", name: "BULLSEYE DISC", icon: "\u{1F3AF}", radius: 32 },
    3: { id: "can", name: "CARNIVAL CAN", icon: "\u{1F96B}", radius: 28 },
    4: { id: "ufo", name: "RETRO SAUCER", icon: "\u{1F6F8}", radius: 34 },
    5: { id: "star", name: "GOLDEN STAR", icon: "\u2B50", radius: 30 },
    6: { id: "balloon", name: "CARNIVAL BALLOON", icon: "\u{1F388}", radius: 30 },
    7: { id: "clay", name: "CLAY PIGEON", icon: "\u{1F94F}", radius: 32 },
    8: { id: "clown", name: "CARNIVAL CLOWN", icon: "\u{1F921}", radius: 34 },
    9: { id: "barrel", name: "WOODEN BARREL", icon: "\u{1F6E2}\uFE0F", radius: 30 },
    10: { id: "asteroid", name: "SPACE ASTEROID", icon: "\u2604\uFE0F", radius: 32 },
    11: { id: "bat", name: "HAUNTED BAT", icon: "\u{1F987}", radius: 32 },
    12: { id: "badge", name: "SHERIFF BADGE", icon: "\u{1FA99}", radius: 30 },
    13: { id: "rocket", name: "RETRO ROCKET", icon: "\u{1F680}", radius: 32 },
    14: { id: "skull", name: "CRYSTAL SKULL", icon: "\u{1F480}", radius: 30 },
    15: { id: "trophy", name: "GOLDEN TROPHY", icon: "\u{1F3C6}", radius: 32 },
    16: { id: "invader", name: "PIXEL INVADER", icon: "\u{1F47E}", radius: 30 },
    17: { id: "dynamite", name: "TNT DYNAMITE", icon: "\u{1F9E8}", radius: 28 },
    18: { id: "plasma", name: "PLASMA SPHERE", icon: "\u{1F52E}", radius: 32 },
    19: { id: "clock", name: "STEAMPUNK CLOCK", icon: "\u23F0", radius: 30 },
    20: { id: "diamond", name: "COSMIC DIAMOND", icon: "\u{1F48E}", radius: 32 }
  };
  var Target = class {
    constructor(config) {
      this.id = config.id;
      this.type = config.type || "duck";
      this.stage = config.stage || 1;
      this.x = config.x || 0;
      this.y = config.y || 250;
      this.baseY = this.y;
      this.vx = config.vx || 200;
      this.direction = config.direction || 1;
      this.radius = config.radius || 32;
      this.active = true;
      this.state = "moving";
      this.animTick = Math.random() * 10;
      this.hitTimer = 0;
      this.rot = 0;
      this.rotSpeed = 0;
      this.vy = 0;
      this.gravity = 980;
      this.particles = [];
    }
    update(dt = 1 / 60) {
      this.animTick += dt;
      if (this.state === "moving") {
        this.x += this.vx * this.direction * dt;
        if (this.type === "ufo") {
          this.y = this.baseY + Math.sin(this.animTick * 5) * 14;
        } else if (this.type === "duck") {
          this.y = this.baseY + Math.sin(this.animTick * 3.5) * 8;
        }
        if (this.direction > 0 && this.x > 900 + this.radius + 20 || this.direction < 0 && this.x < -this.radius - 20) {
          this.state = "escaped";
          this.active = false;
        }
      } else if (this.state === "hit") {
        this.hitTimer += dt;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        this.x += this.vx * 0.3 * this.direction * dt;
        this.rot += this.rotSpeed * dt;
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += (p.gravity || 400) * dt;
          p.life -= dt;
          if (p.life <= 0) {
            this.particles.splice(i, 1);
          }
        }
        if (this.hitTimer > 0.8 || this.y > 550) {
          this.active = false;
        }
      }
    }
    // Trigger hit explosion / feather burst
    onHit(bullseye = false) {
      this.state = "hit";
      this.vy = -260;
      this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 8);
      const count = bullseye ? 18 : 12;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 160;
        let pColor = "#ffffff";
        if (this.type === "duck") {
          pColor = ["#facc15", "#15803d", "#ffffff", "#ea580c"][Math.floor(Math.random() * 4)];
        } else if (this.type === "circle") {
          pColor = ["#ef4444", "#ffffff", "#facc15"][Math.floor(Math.random() * 3)];
        } else if (this.type === "can") {
          pColor = ["#cbd5e1", "#ef4444", "#94a3b8"][Math.floor(Math.random() * 3)];
        } else if (this.type === "ufo") {
          pColor = ["#38bdf8", "#a855f7", "#22d3ee", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "star") {
          pColor = ["#fbbf24", "#f59e0b", "#ffffff"][Math.floor(Math.random() * 3)];
        } else if (this.type === "balloon") {
          pColor = ["#ef4444", "#f87171", "#fee2e2", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "clay") {
          pColor = ["#ea580c", "#f97316", "#fdba74", "#7c2d12"][Math.floor(Math.random() * 4)];
        } else if (this.type === "clown") {
          pColor = ["#ef4444", "#3b82f6", "#facc15", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "barrel") {
          pColor = ["#92400e", "#78350f", "#451a03", "#94a3b8"][Math.floor(Math.random() * 4)];
        } else if (this.type === "asteroid") {
          pColor = ["#64748b", "#475569", "#334155", "#f97316"][Math.floor(Math.random() * 4)];
        } else if (this.type === "bat") {
          pColor = ["#1e1b4b", "#4338ca", "#ef4444", "#312e81"][Math.floor(Math.random() * 4)];
        } else if (this.type === "badge") {
          pColor = ["#facc15", "#eab308", "#ca8a04", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "rocket") {
          pColor = ["#ef4444", "#ffffff", "#38bdf8", "#f97316"][Math.floor(Math.random() * 4)];
        } else if (this.type === "skull") {
          pColor = ["#06b6d4", "#67e8f9", "#ffffff", "#0891b2"][Math.floor(Math.random() * 4)];
        } else if (this.type === "trophy") {
          pColor = ["#facc15", "#fbbf24", "#eab308", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "invader") {
          pColor = ["#10b981", "#34d399", "#059669", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "dynamite") {
          pColor = ["#dc2626", "#ef4444", "#f59e0b", "#fde047"][Math.floor(Math.random() * 4)];
        } else if (this.type === "plasma") {
          pColor = ["#a855f7", "#c084fc", "#38bdf8", "#ffffff"][Math.floor(Math.random() * 4)];
        } else if (this.type === "clock") {
          pColor = ["#d97706", "#b45309", "#fde047", "#78350f"][Math.floor(Math.random() * 4)];
        } else {
          pColor = ["#38bdf8", "#c084fc", "#f43f5e", "#ffffff"][Math.floor(Math.random() * 4)];
        }
        this.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 450,
          life: 0.35 + Math.random() * 0.3,
          maxLife: 0.65,
          color: pColor,
          size: 3 + Math.random() * 4
        });
      }
    }
    render(ctx) {
      if (!this.active && this.particles.length === 0) return;
      for (const p of this.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!this.active) return;
      if (this.state === "moving") {
        ctx.save();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + (this.type === "can" ? 20 : this.type === "circle" ? this.radius - 2 : 18));
        ctx.lineTo(this.x, 268);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.fillRect(this.x - 7, 260, 14, 8);
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(this.x, 264, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.direction < 0) {
        ctx.scale(-1, 1);
      }
      if (this.state === "hit") {
        ctx.rotate(this.rot);
      }
      if (this.type === "duck") {
        this.renderDuck(ctx);
      } else if (this.type === "circle") {
        this.renderCircle(ctx);
      } else if (this.type === "can") {
        this.renderCan(ctx);
      } else if (this.type === "ufo") {
        this.renderUfo(ctx);
      } else if (this.type === "star") {
        this.renderStar(ctx);
      } else if (this.type === "balloon") {
        this.renderBalloon(ctx);
      } else if (this.type === "clay") {
        this.renderClayPigeon(ctx);
      } else if (this.type === "clown") {
        this.renderClown(ctx);
      } else if (this.type === "barrel") {
        this.renderBarrel(ctx);
      } else if (this.type === "asteroid") {
        this.renderAsteroid(ctx);
      } else if (this.type === "bat") {
        this.renderBat(ctx);
      } else if (this.type === "badge") {
        this.renderBadge(ctx);
      } else if (this.type === "rocket") {
        this.renderRocket(ctx);
      } else if (this.type === "skull") {
        this.renderSkull(ctx);
      } else if (this.type === "trophy") {
        this.renderTrophy(ctx);
      } else if (this.type === "invader") {
        this.renderPixelInvader(ctx);
      } else if (this.type === "dynamite") {
        this.renderDynamite(ctx);
      } else if (this.type === "plasma") {
        this.renderPlasma(ctx);
      } else if (this.type === "clock") {
        this.renderClock(ctx);
      } else {
        this.renderDiamond(ctx);
      }
      ctx.restore();
    }
    // --- Target Renderers ---
    renderDuck(ctx) {
      const flap = Math.sin(this.animTick * 14);
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 24, 26, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ca8a04";
      ctx.beginPath();
      ctx.ellipse(0, 4, 22, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(-2, 2);
      ctx.rotate(flap * 0.45);
      ctx.fillStyle = "#a16207";
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#713f12";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(-4, -2, 6, 3);
      ctx.restore();
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(16, -8, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(13, -2, 6, 0.4, Math.PI * 0.85);
      ctx.stroke();
      if (this.state === "hit") {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(17, -11);
        ctx.lineTo(21, -7);
        ctx.moveTo(21, -11);
        ctx.lineTo(17, -7);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(19, -9, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(20, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(25, -9);
      ctx.lineTo(36, -6);
      ctx.lineTo(25, -3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#854d0e";
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-28, -6);
      ctx.lineTo(-20, 6);
      ctx.closePath();
      ctx.fill();
    }
    renderCircle(ctx) {
      const r = this.radius;
      ctx.strokeStyle = "#78716c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, -r - 18);
      ctx.stroke();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    renderCan(ctx) {
      const w = 28;
      const h = 42;
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, "#991b1b");
      grad.addColorStop(0.2, "#ef4444");
      grad.addColorStop(0.5, "#fca5a5");
      grad.addColorStop(0.8, "#ef4444");
      grad.addColorStop(1, "#7f1d1d");
      ctx.fillStyle = grad;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.ellipse(0, -h / 2, w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.ellipse(0, h / 2, w / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-w / 2, -4, w, 8);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("POP", 0, 0);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
    renderUfo(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
      ctx.beginPath();
      ctx.arc(0, -6, 14, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(0, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      const discGrad = ctx.createLinearGradient(0, -8, 0, 10);
      discGrad.addColorStop(0, "#e2e8f0");
      discGrad.addColorStop(0.5, "#64748b");
      discGrad.addColorStop(1, "#334155");
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.stroke();
      const lightPhase = Math.floor(this.animTick * 8) % 4;
      [-20, -7, 7, 20].forEach((lx, idx) => {
        ctx.fillStyle = idx === lightPhase ? "#facc15" : "#ef4444";
        ctx.beginPath();
        ctx.arc(lx, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    renderStar(ctx) {
      const r = this.radius;
      const points = 5;
      const step = Math.PI / points;
      ctx.save();
      ctx.rotate(this.animTick * 2);
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 2 * points; i++) {
        const dist = i % 2 === 0 ? r : r * 0.45;
        const angle = i * step - Math.PI / 2;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // --- Levels 6-10 Target Renderers ---
    renderBalloon(ctx) {
      const floatY = Math.sin(this.animTick * 4) * 3;
      const r = this.radius;
      ctx.save();
      ctx.translate(0, floatY);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.quadraticCurveTo(Math.sin(this.animTick * 6) * 8, r + 18, Math.sin(this.animTick * 4) * 4, r + 36);
      ctx.stroke();
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.moveTo(-4, r + 2);
      ctx.lineTo(4, r + 2);
      ctx.lineTo(0, r - 3);
      ctx.closePath();
      ctx.fill();
      const grad = ctx.createRadialGradient(-6, -6, 2, 0, 0, r);
      grad.addColorStop(0, "#fca5a5");
      grad.addColorStop(0.3, "#ef4444");
      grad.addColorStop(0.85, "#dc2626");
      grad.addColorStop(1, "#991b1b");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.4, 4, 8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    renderClayPigeon(ctx) {
      const w = 32;
      const h = 12;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 8, w, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const grad = ctx.createLinearGradient(0, -h, 0, h);
      grad.addColorStop(0, "#fdba74");
      grad.addColorStop(0.2, "#f97316");
      grad.addColorStop(0.7, "#ea580c");
      grad.addColorStop(1, "#9a3412");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7c2d12";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.ellipse(0, -2, w * 0.7, h * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.ellipse(0, -2, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff7ed";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    renderClown(ctx) {
      ctx.save();
      ctx.fillStyle = "#facc15";
      for (let a = -20; a <= 20; a += 10) {
        ctx.beginPath();
        ctx.arc(a, 24, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.arc(0, 4, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(0, -34);
      ctx.lineTo(16, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, -35, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
      ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(0, 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fca5a5";
      ctx.beginPath();
      ctx.arc(-2, 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 10, 11, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.restore();
    }
    renderBarrel(ctx) {
      const w = 22;
      const h = 26;
      ctx.save();
      const grad = ctx.createLinearGradient(-w, 0, w, 0);
      grad.addColorStop(0, "#451a03");
      grad.addColorStop(0.2, "#78350f");
      grad.addColorStop(0.5, "#b45309");
      grad.addColorStop(0.8, "#78350f");
      grad.addColorStop(1, "#451a03");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.75, -h);
      ctx.quadraticCurveTo(-w, 0, -w * 0.75, h);
      ctx.lineTo(w * 0.75, h);
      ctx.quadraticCurveTo(w, 0, w * 0.75, -h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#290e02";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2.5;
      [-h * 0.65, -h * 0.2, h * 0.2, h * 0.65].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(-w * 0.85, y);
        ctx.lineTo(w * 0.85, y);
        ctx.stroke();
      });
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    renderAsteroid(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.rotate(this.animTick * 1.2);
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(r * 0.8, -r * 0.6);
      ctx.lineTo(r * 0.2, -r);
      ctx.lineTo(-r * 0.6, -r * 0.8);
      ctx.lineTo(-r, -r * 0.2);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.lineTo(-r * 0.2, r * 0.9);
      ctx.lineTo(r * 0.6, r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(-8, -6, 5, 0, Math.PI * 2);
      ctx.arc(6, 6, 6, 0, Math.PI * 2);
      ctx.arc(-4, 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(2, 0);
      ctx.lineTo(6, 6);
      ctx.moveTo(2, 0);
      ctx.lineTo(-2, 8);
      ctx.stroke();
      ctx.restore();
    }
    // --- Levels 11-20 Target Renderers ---
    renderBat(ctx) {
      const wingFlap = Math.sin(this.animTick * 15) * 0.45;
      ctx.save();
      ctx.fillStyle = "#312e81";
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(-6, 0);
      ctx.rotate(wingFlap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-24, -14);
      ctx.quadraticCurveTo(-18, -4, -14, 6);
      ctx.quadraticCurveTo(-8, 2, 0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(6, 0);
      ctx.rotate(-wingFlap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, -14);
      ctx.quadraticCurveTo(18, -4, 14, 6);
      ctx.quadraticCurveTo(8, 2, 0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.ellipse(0, 4, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-9, -14);
      ctx.lineTo(-2, -6);
      ctx.moveTo(6, -4);
      ctx.lineTo(9, -14);
      ctx.lineTo(2, -6);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-2.5, 0, 1.5, 0, Math.PI * 2);
      ctx.arc(2.5, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    renderBadge(ctx) {
      const r = this.radius;
      const points = 6;
      const step = Math.PI / points;
      ctx.save();
      ctx.rotate(this.animTick * 1.5);
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 2 * points; i++) {
        const dist = i % 2 === 0 ? r : r * 0.55;
        const angle = i * step - Math.PI / 2;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fef08a";
      for (let i = 0; i < points; i++) {
        const angle = i * 2 * step - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    renderRocket(ctx) {
      ctx.save();
      ctx.rotate(-0.15);
      const flameH = 12 + Math.random() * 8;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(-6, 18);
      ctx.lineTo(0, 18 + flameH);
      ctx.lineTo(6, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(-3, 18);
      ctx.lineTo(0, 18 + flameH * 0.6);
      ctx.lineTo(3, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-20, 18);
      ctx.lineTo(-8, 16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.lineTo(20, 18);
      ctx.lineTo(8, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.quadraticCurveTo(12, -8, 9, 18);
      ctx.lineTo(-9, 18);
      ctx.quadraticCurveTo(-12, -8, 0, -26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(7, -12);
      ctx.lineTo(-7, -12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, -2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    renderSkull(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
      const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, r);
      grad.addColorStop(0, "#cffafe");
      grad.addColorStop(0.4, "#67e8f9");
      grad.addColorStop(0.8, "#06b6d4");
      grad.addColorStop(1, "#0e7490");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -4, 18, Math.PI, 0);
      ctx.lineTo(14, 8);
      ctx.lineTo(8, 16);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-14, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#0891b2";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#083344";
      ctx.beginPath();
      ctx.ellipse(-7, -2, 5, 6, -0.15, 0, Math.PI * 2);
      ctx.ellipse(7, -2, 5, 6, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-2.5, 8);
      ctx.lineTo(2.5, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#083344";
      ctx.lineWidth = 1.5;
      for (let tx = -5; tx <= 5; tx += 2.5) {
        ctx.beginPath();
        ctx.moveTo(tx, 11);
        ctx.lineTo(tx, 16);
        ctx.stroke();
      }
      ctx.restore();
    }
    renderTrophy(ctx) {
      ctx.save();
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-12, 18, 24, 7);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(-14, 25, 28, 3);
      ctx.fillStyle = "#ca8a04";
      ctx.fillRect(-3, 10, 6, 8);
      const grad = ctx.createLinearGradient(-16, 0, 16, 0);
      grad.addColorStop(0, "#b45309");
      grad.addColorStop(0.25, "#facc15");
      grad.addColorStop(0.5, "#fef08a");
      grad.addColorStop(0.75, "#facc15");
      grad.addColorStop(1, "#92400e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-16, -18);
      ctx.lineTo(16, -18);
      ctx.lineTo(12, 4);
      ctx.quadraticCurveTo(0, 12, -12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-16, -6, 7, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(16, -6, 7, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-6, -12, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    renderPixelInvader(ctx) {
      const s = 3;
      const flap = Math.floor(this.animTick * 6) % 2 === 0;
      ctx.save();
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.fillRect(-1 * s, -6 * s, 2 * s, 1.5 * s);
      ctx.fillRect(-3 * s, -4.5 * s, 6 * s, 1.5 * s);
      ctx.fillRect(-4.5 * s, -3 * s, 9 * s, 1.5 * s);
      ctx.fillRect(-5.5 * s, -1.5 * s, 2 * s, 2 * s);
      ctx.fillRect(-1.5 * s, -1.5 * s, 3 * s, 2 * s);
      ctx.fillRect(3.5 * s, -1.5 * s, 2 * s, 2 * s);
      ctx.fillRect(-4.5 * s, 0.5 * s, 9 * s, 2 * s);
      if (flap) {
        ctx.fillRect(-5.5 * s, 2.5 * s, 2 * s, 3 * s);
        ctx.fillRect(3.5 * s, 2.5 * s, 2 * s, 3 * s);
        ctx.fillRect(-2 * s, 2.5 * s, 4 * s, 1.5 * s);
      } else {
        ctx.fillRect(-3.5 * s, 2.5 * s, 2 * s, 3 * s);
        ctx.fillRect(1.5 * s, 2.5 * s, 2 * s, 3 * s);
        ctx.fillRect(-5.5 * s, 1.5 * s, 2 * s, 2 * s);
        ctx.fillRect(3.5 * s, 1.5 * s, 2 * s, 2 * s);
      }
      ctx.restore();
    }
    renderDynamite(ctx) {
      ctx.save();
      ctx.fillStyle = "#dc2626";
      [-11, 0, 11].forEach((dx) => {
        ctx.fillRect(dx - 5, -16, 10, 32);
        ctx.strokeStyle = "#991b1b";
        ctx.lineWidth = 1;
        ctx.strokeRect(dx - 5, -16, 10, 32);
      });
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-18, -6, 36, 12);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TNT", 0, 0);
      ctx.strokeStyle = "#78716c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.quadraticCurveTo(8, -26, 4, -32);
      ctx.stroke();
      const spark = Math.random() * 3 + 3;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(4, -32, spark, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(4, -32, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    renderPlasma(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 12;
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      coreGrad.addColorStop(0, "#f5d0fe");
      coreGrad.addColorStop(0.3, "#c084fc");
      coreGrad.addColorStop(0.7, "#7e22ce");
      coreGrad.addColorStop(1, "#3b0764");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d8b4fe";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const angle = (this.animTick * 3 + i * Math.PI / 2) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const midR = r * 0.55;
        const midAngle = angle + (Math.random() - 0.5) * 0.4;
        ctx.lineTo(Math.cos(midAngle) * midR, Math.sin(midAngle) * midR);
        ctx.lineTo(Math.cos(angle) * (r - 2), Math.sin(angle) * (r - 2));
        ctx.stroke();
      }
      ctx.restore();
    }
    renderClock(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -r - 5, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#b45309";
      ctx.fillRect(-3, -r - 2, 6, 4);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r * 0.65), Math.sin(a) * (r * 0.65));
        ctx.lineTo(Math.cos(a) * (r * 0.74), Math.sin(a) * (r * 0.74));
        ctx.stroke();
      }
      const minuteA = this.animTick * 4;
      const hourA = this.animTick * 0.6;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(minuteA) * (r * 0.55), Math.sin(minuteA) * (r * 0.55));
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(hourA) * (r * 0.38), Math.sin(hourA) * (r * 0.38));
      ctx.stroke();
      ctx.restore();
    }
    renderDiamond(ctx) {
      const r = this.radius;
      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      const topW = r * 0.65;
      const midW = r;
      const topY = -r * 0.7;
      const midY = -r * 0.15;
      const botY = r;
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, "#cffafe");
      grad.addColorStop(0.35, "#38bdf8");
      grad.addColorStop(0.7, "#c084fc");
      grad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-topW, topY);
      ctx.lineTo(topW, topY);
      ctx.lineTo(midW, midY);
      ctx.lineTo(0, botY);
      ctx.lineTo(-midW, midY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.moveTo(-topW * 0.5, topY);
      ctx.lineTo(0, midY);
      ctx.lineTo(topW * 0.5, topY);
      ctx.moveTo(0, midY);
      ctx.lineTo(0, botY);
      ctx.moveTo(-midW, midY);
      ctx.lineTo(midW, midY);
      ctx.stroke();
      const glint = Math.sin(this.animTick * 6) * 2 + 3;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(topW * 0.4, topY + 4, glint, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
  var TargetManager = class {
    constructor(stage = 1) {
      this.stage = stage;
      this.targets = [];
      this.floatingScores = [];
      this.stageTargetQuota = 10;
      this.conveyorSpacing = 185;
      this.idCounter = 0;
      this.populateInitialTargets();
    }
    reset(stage = 1) {
      this.stage = stage;
      this.targets = [];
      this.floatingScores = [];
      this.populateInitialTargets();
    }
    setStage(stage) {
      this.stage = stage;
      this.targets = [];
      this.floatingScores = [];
      this.populateInitialTargets();
    }
    getStageConfig() {
      const cycleStage = (this.stage - 1) % 20 + 1;
      const def = TARGET_TYPES[cycleStage];
      const baseRamp = 120 + (this.stage - 1) * 15;
      const scaledSpeed = Math.round(baseRamp * Math.pow(1.05, this.stage - 1));
      return {
        type: def.id,
        name: def.name,
        icon: def.icon,
        speed: scaledSpeed,
        radius: def.radius
      };
    }
    populateInitialTargets() {
      this.targets = [];
      const config = this.getStageConfig();
      const spacing = this.conveyorSpacing;
      for (let i = 0; i < 4; i++) {
        const startX = -config.radius - 30 - i * spacing;
        const target = new Target({
          id: ++this.idCounter,
          type: config.type,
          stage: this.stage,
          x: startX,
          y: 250,
          // Central target lane aligning with center crosshair
          vx: config.speed,
          direction: 1,
          // Carnival conveyor moves left to right past crosshair
          radius: config.radius
        });
        this.targets.push(target);
      }
    }
    addFloatingScore(text, x, y, color = "#facc15") {
      this.floatingScores.push({
        text,
        x,
        y,
        vy: -60,
        alpha: 1,
        color,
        life: 0.85
      });
    }
    update(dt = 1 / 60) {
      const config = this.getStageConfig();
      const moving = this.targets.filter((t) => t.active && t.state === "moving");
      let leftmostX = 9999;
      for (const t of moving) {
        if (t.x < leftmostX) leftmostX = t.x;
      }
      if (moving.length < 5 && (leftmostX >= this.conveyorSpacing - 50 || moving.length === 0)) {
        const spawnX = Math.min(-config.radius - 20, leftmostX - this.conveyorSpacing);
        const target = new Target({
          id: ++this.idCounter,
          type: config.type,
          stage: this.stage,
          x: spawnX,
          y: 250,
          vx: config.speed,
          direction: 1,
          radius: config.radius
        });
        this.targets.push(target);
      }
      for (let i = this.targets.length - 1; i >= 0; i--) {
        const t = this.targets[i];
        t.update(dt);
        if (t.state === "escaped") {
          let currentLeftmost = 0;
          for (const m of this.targets) {
            if (m.active && m.state === "moving" && m.x < currentLeftmost) {
              currentLeftmost = m.x;
            }
          }
          t.x = Math.min(-t.radius - 30, currentLeftmost - this.conveyorSpacing);
          t.state = "moving";
          t.active = true;
        }
        if (!t.active && t.particles.length === 0) {
          this.targets.splice(i, 1);
        }
      }
      for (let i = this.floatingScores.length - 1; i >= 0; i--) {
        const f = this.floatingScores[i];
        f.y += f.vy * dt;
        f.life -= dt;
        f.alpha = Math.max(0, f.life / 0.85);
        if (f.life <= 0) {
          this.floatingScores.splice(i, 1);
        }
      }
    }
    render(ctx) {
      for (const t of this.targets) {
        t.render(ctx);
      }
      ctx.save();
      for (const f of this.floatingScores) {
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = "center";
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();
    }
  };

  // sharpshooter/js/audio.js
  var SoundManager = class {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
    // Gunshot burst with sharp transient crack and low thud
    gunshot() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(160, t + 0.14);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
      const punch = this.ctx.createOscillator();
      const punchGain = this.ctx.createGain();
      punch.type = "triangle";
      punch.frequency.setValueAtTime(220, t);
      punch.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      punchGain.gain.setValueAtTime(0.8, t);
      punchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      punch.connect(punchGain);
      punchGain.connect(this.ctx.destination);
      punch.start(t);
      punch.stop(t + 0.15);
    }
    // Target hit sound - dynamically adapts to object type
    targetHit(type = "duck") {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      if (type === "duck") {
        this.duckHit();
      } else if (type === "circle" || type === "badge" || type === "clock") {
        this.circleHit();
      } else if (type === "can") {
        this.canHit();
      } else if (type === "ufo" || type === "invader" || type === "plasma") {
        this.ufoHit();
      } else if (type === "balloon") {
        this.balloonHit();
      } else if (type === "barrel") {
        this.barrelHit();
      } else if (type === "clay" || type === "diamond") {
        this.shatterHit();
      } else if (type === "dynamite" || type === "rocket" || type === "asteroid") {
        this.blastHit();
      } else {
        this.starHit();
      }
    }
    // Duck quack / squawk + pop
    duckHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.18);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    // Bullseye bell chime / ding
    circleHit() {
      const t = this.ctx.currentTime;
      [1046.5, 1567.98].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.4 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(1e-3, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    }
    // Metallic tin can ricochet ping
    canHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(980, t);
      osc.frequency.exponentialRampToValueAtTime(1960, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
    // UFO sci-fi laser explosion
    ufoHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    }
    // Star / balloon festive chime
    starHit() {
      const t = this.ctx.currentTime;
      [659.25, 880, 1318.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.3, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.04 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.22);
      });
    }
    // Carnival balloon snap / pop
    balloonHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.03);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }
    // Wooden barrel hollow thud
    barrelHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.16);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
    // Clay pigeon / cosmic diamond crisp shatter
    shatterHit() {
      const t = this.ctx.currentTime;
      [1200, 1800, 2400].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + idx * 0.02 + 0.15);
        gain.gain.setValueAtTime(0.35 / (idx + 1), t + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.02 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.02);
        osc.stop(t + idx * 0.02 + 0.2);
      });
    }
    // Dynamite / rocket / asteroid deep explosion blast
    blastHit() {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.3);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    }
    // Miss / dry ricochet click
    miss() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    }
    // Stage clear triumphant fanfare
    stageClear() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const t = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        gain.gain.setValueAtTime(0.25, t + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + (i === 3 ? 0.4 : 0.18));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + (i === 3 ? 0.45 : 0.2));
      });
    }
    // Game over sorrowful descending cadence
    gameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const notes = [440, 415.3, 392, 349.23];
      const t = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t + i * 0.18);
        gain.gain.setValueAtTime(0.25, t + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.18 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.18);
        osc.stop(t + i * 0.18 + 0.26);
      });
    }
  };
  var sound = new SoundManager();

  // sharpshooter/js/game.js
  var STATES = {
    READY: "READY",
    ROUND_START: "ROUND_START",
    PLAYING: "PLAYING",
    STAGE_CLEAR: "STAGE_CLEAR",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
  };
  var SharpshooterGame = class {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.options = options;
      this.width = 900;
      this.height = 500;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.crosshair = new Crosshair(this.width, this.height);
      this.targets = new TargetManager(1);
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      this.previousState = STATES.PLAYING;
      this.score = 0;
      this.stage = 1;
      this.lives = 3;
      this.stageHits = 0;
      this.totalShots = 0;
      this.totalHits = 0;
      this.conveyorOffset = 0;
      this.stageClearTimer = 0;
      this.screenShake = 0;
      this.bgAnimTick = 0;
      this.lastTime = performance.now();
      this.animId = null;
      this.start();
    }
    start() {
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      this.lastTime = performance.now();
      if (this.animId) cancelAnimationFrame(this.animId);
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
      const config = this.targets.getStageConfig();
      if (this.options.onStage) this.options.onStage(this.stage, config);
      if (this.options.onProgress) this.options.onProgress(this.stageHits, this.targets.stageTargetQuota);
      if (this.options.onLives) this.options.onLives(this.lives);
      if (this.options.onScore) this.options.onScore(this.score);
    }
    reset() {
      this.score = 0;
      this.stage = 1;
      this.lives = 3;
      this.stageHits = 0;
      this.totalShots = 0;
      this.totalHits = 0;
      this.screenShake = 0;
      this.targets.reset(1);
      if (this.options.onScore) this.options.onScore(0);
      if (this.options.onLives) this.options.onLives(this.lives);
      const config = this.targets.getStageConfig();
      if (this.options.onStage) this.options.onStage(this.stage, config);
      if (this.options.onProgress) this.options.onProgress(0, this.targets.stageTargetQuota);
      this.start();
    }
    // Trigger gun shot
    shoot() {
      if (this.state === STATES.GAME_OVER || this.state === STATES.PAUSED) return;
      if (this.state === STATES.STAGE_CLEAR || this.state === STATES.ROUND_START) return;
      this.totalShots++;
      this.crosshair.fire();
      sound.gunshot();
      this.screenShake = 4.5;
      let hitSomething = false;
      for (const target of this.targets.targets) {
        if (target.active && target.state === "moving") {
          const res = this.crosshair.checkHit(target);
          if (res.hit) {
            hitSomething = true;
            this.totalHits++;
            this.stageHits++;
            this.score += 1;
            target.onHit(res.bullseye);
            sound.targetHit(target.type);
            const banner = res.bullseye ? "\u2605 BULLSEYE +1 \u2605" : "+1";
            const bannerColor = res.bullseye ? "#facc15" : "#4ade80";
            this.targets.addFloatingScore(banner, target.x, target.y - 20, bannerColor);
            if (this.options.onScore) this.options.onScore(this.score);
            if (this.options.onProgress) {
              this.options.onProgress(this.stageHits, this.targets.stageTargetQuota);
            }
            if (this.stageHits >= this.targets.stageTargetQuota) {
              this.handleStageClear();
            }
            break;
          }
        }
      }
      if (!hitSomething) {
        sound.miss();
        this.lives--;
        this.targets.addFloatingScore("MISS", this.crosshair.x, this.crosshair.y - 30, "#ef4444");
        if (this.options.onLives) this.options.onLives(this.lives);
        if (this.lives <= 0) {
          this.handleGameOver();
        }
      }
    }
    handleStageClear() {
      this.state = STATES.STAGE_CLEAR;
      this.stageClearTimer = 2;
      sound.stageClear();
      if (this.options.onStageClear) {
        this.options.onStageClear(this.stage);
      }
    }
    advanceToNextStage() {
      this.stage++;
      this.stageHits = 0;
      this.targets.setStage(this.stage);
      this.state = STATES.ROUND_START;
      this.roundStartTimer = 2.5;
      const config = this.targets.getStageConfig();
      if (this.options.onStage) this.options.onStage(this.stage, config);
      if (this.options.onProgress) this.options.onProgress(0, this.targets.stageTargetQuota);
    }
    togglePause() {
      if (this.state === STATES.PLAYING || this.state === STATES.ROUND_START) {
        this.previousState = this.state;
        this.state = STATES.PAUSED;
        if (this.animId) cancelAnimationFrame(this.animId);
        this.render();
        return true;
      } else if (this.state === STATES.PAUSED) {
        this.state = this.previousState || STATES.PLAYING;
        this.lastTime = performance.now();
        this.animId = requestAnimationFrame(this.loop);
        return false;
      }
      return false;
    }
    handleGameOver() {
      this.state = STATES.GAME_OVER;
      sound.gameOver();
      const accuracy = this.totalShots > 0 ? Math.round(this.totalHits / this.totalShots * 100) : 0;
      if (this.options.onGameOver) {
        this.options.onGameOver({
          score: this.score,
          stage: this.stage,
          accuracy,
          totalHits: this.totalHits,
          totalShots: this.totalShots
        });
      }
    }
    loop(currentTime) {
      if (this.state !== STATES.PLAYING && this.state !== STATES.STAGE_CLEAR && this.state !== STATES.ROUND_START) {
        return;
      }
      const dt = Math.min((currentTime - this.lastTime) / 1e3, 0.1);
      this.lastTime = currentTime;
      this.update(dt);
      this.render();
      this.animId = requestAnimationFrame(this.loop);
    }
    update(dt) {
      this.bgAnimTick += dt;
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 18);
      }
      if (this.state === STATES.STAGE_CLEAR) {
        this.stageClearTimer -= dt;
        this.crosshair.update(dt);
        this.targets.update(dt);
        if (this.stageClearTimer <= 0) {
          this.advanceToNextStage();
        }
        return;
      }
      if (this.state === STATES.ROUND_START) {
        this.roundStartTimer -= dt;
        this.crosshair.update(dt);
        if (this.roundStartTimer <= 0) {
          this.state = STATES.PLAYING;
        }
        return;
      }
      const speed = this.targets.getStageConfig().speed;
      this.conveyorOffset = (this.conveyorOffset + speed * dt) % 24;
      this.crosshair.update(dt);
      this.targets.update(dt);
    }
    render() {
      const ctx = this.ctx;
      ctx.save();
      if (this.screenShake > 0.1) {
        const sx = (Math.random() - 0.5) * this.screenShake;
        const sy = (Math.random() - 0.5) * this.screenShake;
        ctx.translate(sx, sy);
      }
      this.renderGalleryBackground(ctx);
      this.targets.render(ctx);
      this.crosshair.render(ctx);
      if (this.state === STATES.READY) {
        this.renderReadyScreen(ctx);
      } else if (this.state === STATES.ROUND_START) {
        this.renderRoundStartScreen(ctx);
      } else if (this.state === STATES.STAGE_CLEAR) {
        this.renderStageClearScreen(ctx);
      } else if (this.state === STATES.PAUSED) {
        this.renderPausedScreen(ctx);
      }
      ctx.restore();
    }
    // --- Background Scenery ---
    renderGalleryBackground(ctx) {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
      skyGrad.addColorStop(0, "#38bdf8");
      skyGrad.addColorStop(0.65, "#bae6fd");
      skyGrad.addColorStop(1, "#fef08a");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#86efac";
      ctx.beginPath();
      ctx.moveTo(0, 280);
      ctx.bezierCurveTo(240, 220, 380, 260, 600, 230);
      ctx.bezierCurveTo(740, 210, 820, 240, 900, 235);
      ctx.lineTo(900, 350);
      ctx.lineTo(0, 350);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.moveTo(0, 290);
      ctx.bezierCurveTo(180, 260, 340, 285, 520, 265);
      ctx.bezierCurveTo(680, 250, 780, 280, 900, 275);
      ctx.lineTo(900, 350);
      ctx.lineTo(0, 350);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      this.renderCloud(ctx, 120, 70, 48);
      this.renderCloud(ctx, 420, 95, 36);
      this.renderCloud(ctx, 720, 60, 52);
      const wallGrad = ctx.createLinearGradient(0, 320, 0, 500);
      wallGrad.addColorStop(0, "#78350f");
      wallGrad.addColorStop(0.5, "#451a03");
      wallGrad.addColorStop(1, "#290e02");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 320, this.width, 180);
      ctx.strokeStyle = "#290e02";
      ctx.lineWidth = 2;
      for (let x = 60; x < this.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 320);
        ctx.lineTo(x, 500);
        ctx.stroke();
      }
      const counterGrad = ctx.createLinearGradient(0, 310, 0, 324);
      counterGrad.addColorStop(0, "#fde047");
      counterGrad.addColorStop(0.3, "#ca8a04");
      counterGrad.addColorStop(1, "#713f12");
      ctx.fillStyle = counterGrad;
      ctx.fillRect(0, 310, this.width, 14);
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 310, this.width, 14);
      ctx.fillStyle = "#475569";
      for (let px = 90; px < this.width; px += 180) {
        ctx.fillRect(px - 4, 272, 8, 42);
        ctx.strokeStyle = "#1e293b";
        ctx.strokeRect(px - 4, 272, 8, 42);
      }
      const railGrad = ctx.createLinearGradient(0, 266, 0, 274);
      railGrad.addColorStop(0, "#94a3b8");
      railGrad.addColorStop(0.5, "#f8fafc");
      railGrad.addColorStop(1, "#334155");
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, 266, this.width, 8);
      ctx.strokeStyle = "#1e293b";
      ctx.strokeRect(0, 266, this.width, 8);
      const notchSpacing = 24;
      const offset = (this.conveyorOffset || 0) % notchSpacing;
      ctx.fillStyle = "#0f172a";
      for (let nx = -notchSpacing + offset; nx < this.width + notchSpacing; nx += notchSpacing) {
        ctx.fillRect(nx - 2, 268, 4, 4);
      }
      const stripeWidth = 24;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 316, this.width, 8);
      ctx.clip();
      for (let sx = -30; sx < this.width + 30; sx += stripeWidth * 2) {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.moveTo(sx, 324);
        ctx.lineTo(sx + 16, 316);
        ctx.lineTo(sx + 16 + stripeWidth, 316);
        ctx.lineTo(sx + stripeWidth, 324);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      this.renderMarqueeValance(ctx);
    }
    renderCloud(ctx, x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.7, y - r * 0.2, r * 0.75, 0, Math.PI * 2);
      ctx.arc(x + r * 1.3, y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    renderMarqueeValance(ctx) {
      const scallopWidth = 36;
      const count = Math.ceil(this.width / scallopWidth);
      ctx.save();
      for (let i = 0; i < count; i++) {
        const x = i * scallopWidth;
        const isRed = i % 2 === 0;
        ctx.fillStyle = isRed ? "#dc2626" : "#ffffff";
        ctx.beginPath();
        ctx.rect(x, 0, scallopWidth, 20);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + scallopWidth / 2, 20, scallopWidth / 2, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#991b1b";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(x + scallopWidth / 2, 20 + scallopWidth / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(0, 0, this.width, 10);
      ctx.restore();
    }
    // --- Overlay Screens ---
    renderReadyScreen(ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#facc15";
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 10;
      ctx.fillText("SHARPSHOOTER", this.width / 2, 180);
      ctx.fillStyle = "#ffffff";
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText("80s ARCADE SHOOTING GALLERY", this.width / 2, 215);
      if (Math.floor(this.bgAnimTick * 3) % 2 === 0) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText("PRESS SPACEBAR OR CLICK TO FIRE!", this.width / 2, 350);
      }
      ctx.fillStyle = "#94a3b8";
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText("HIT TARGETS WHEN CENTERED IN CROSSHAIR \u2022 1 PT PER HIT", this.width / 2, 385);
    }
    renderRoundStartScreen(ctx) {
      const config = this.targets.getStageConfig();
      const secondsLeft = Math.max(1, Math.ceil(this.roundStartTimer));
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(0, 150, this.width, 200);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.lineTo(this.width, 150);
      ctx.moveTo(0, 350);
      ctx.lineTo(this.width, 350);
      ctx.stroke();
      ctx.fillStyle = "#facc15";
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.shadowColor = "#ca8a04";
      ctx.shadowBlur = 10;
      ctx.fillText(`\u2605 STAGE ${this.stage} \u2605`, this.width / 2, 195);
      ctx.fillStyle = "#ffffff";
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(`TARGET: ${config.icon} ${config.name}`, this.width / 2, 235);
      const pulse = Math.sin(this.bgAnimTick * 8) * 0.1 + 1;
      ctx.fillStyle = "#38bdf8";
      ctx.font = `${Math.round(18 * pulse)}px "Press Start 2P", monospace`;
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 8;
      ctx.fillText(`GET READY... ${secondsLeft}`, this.width / 2, 290);
      ctx.fillStyle = "#94a3b8";
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText("TARGETS APPROACHING FROM THE LEFT \u2022 AIM FOR CENTER", this.width / 2, 325);
      ctx.restore();
    }
    renderStageClearScreen(ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#4ade80";
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.shadowColor = "#15803d";
      ctx.shadowBlur = 12;
      ctx.fillText(`\u2605 STAGE ${this.stage} CLEARED! \u2605`, this.width / 2, 210);
      const nextStage = this.stage + 1;
      const nextCycle = (nextStage - 1) % 20 + 1;
      const nextDef = TARGET_TYPES[nextCycle];
      ctx.fillStyle = "#facc15";
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(`NEXT TARGET: ${nextDef.icon} ${nextDef.name} (FASTER!)`, this.width / 2, 260);
    }
    renderPausedScreen(ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = "#facc15";
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", this.width / 2, 240);
      ctx.fillStyle = "#ffffff";
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText("PRESS P TO RESUME", this.width / 2, 280);
    }
  };

  // sharpshooter/js/storage.js
  var STORAGE_PREFIX = "retro_arcade_";
  var storage = {
    getHighScore(gameId = "sharpshooter") {
      try {
        const val = localStorage.getItem(`${STORAGE_PREFIX}high_${gameId}`);
        return val ? parseInt(val, 10) : 0;
      } catch {
        return 0;
      }
    },
    setHighScore(gameId = "sharpshooter", score) {
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

  // sharpshooter/js/main.js
  var SharpshooterApp = class {
    constructor() {
      this.gameId = "sharpshooter";
      this.gameInstance = null;
      this.soundEnabled = storage.getSetting("sound_enabled", true);
      this.crtEnabled = storage.getSetting("crt_enabled", true);
      this.canvas = document.getElementById("sharpshooter-canvas");
      this.crtOverlay = document.getElementById("crt-overlay");
      this.btnToggleSound = document.getElementById("btn-toggle-sound");
      this.soundIcon = document.getElementById("sound-icon");
      this.btnToggleCrt = document.getElementById("btn-toggle-crt");
      this.hudScore = document.getElementById("hud-score");
      this.hudStage = document.getElementById("hud-stage");
      this.hudTargetName = document.getElementById("hud-target-name");
      this.hudProgress = document.getElementById("hud-progress");
      this.hudLives = document.getElementById("hud-lives");
      this.hudHighScore = document.getElementById("hud-high-score");
      this.floatingBanner = document.getElementById("floating-banner");
      this.btnPauseGame = document.getElementById("btn-pause-game");
      this.btnRestartGame = document.getElementById("btn-restart-game");
      this.btnTriggerFire = document.getElementById("btn-trigger-fire");
      this.gameOverlay = document.getElementById("game-overlay");
      this.overlayFinalScore = document.getElementById("overlay-final-score");
      this.overlayFinalStage = document.getElementById("overlay-final-stage");
      this.overlayFinalAccuracy = document.getElementById("overlay-final-accuracy");
      this.overlayFinalHits = document.getElementById("overlay-final-hits");
      this.overlayRestartBtn = document.getElementById("overlay-restart-btn");
      this.highScore = storage.getHighScore(this.gameId);
      this.init();
    }
    init() {
      this.applySettings();
      this.setupGame();
      this.bindEvents();
      if (this.gameInstance) {
        this.gameInstance.start();
      }
    }
    applySettings() {
      this.soundIcon.textContent = this.soundEnabled ? "\u{1F50A}" : "\u{1F507}";
      this.btnToggleSound.classList.toggle("active", this.soundEnabled);
      this.crtOverlay.classList.toggle("disabled", !this.crtEnabled);
      this.btnToggleCrt.classList.toggle("active", this.crtEnabled);
      this.hudHighScore.textContent = this.highScore.toString().padStart(4, "0");
    }
    setupGame() {
      this.gameInstance = new SharpshooterGame(this.canvas, {
        onScore: (score) => {
          this.hudScore.textContent = score.toString().padStart(4, "0");
          if (score > this.highScore) {
            this.highScore = score;
            this.hudHighScore.textContent = this.highScore.toString().padStart(4, "0");
            storage.setHighScore(this.gameId, this.highScore);
          }
        },
        onStage: (stage, config) => {
          this.hudStage.textContent = stage.toString();
          this.hudTargetName.textContent = `${config.icon} ${config.name}`;
        },
        onProgress: (hits, quota) => {
          let dots = "";
          for (let i = 0; i < quota; i++) {
            dots += i < hits ? "\u25CF" : "\u25CB";
          }
          this.hudProgress.textContent = `${dots} (${hits}/${quota})`;
        },
        onLives: (lives) => {
          const icons = [];
          for (let i = 0; i < 3; i++) {
            icons.push(i < lives ? "\u{1F3AF}" : "\u274C");
          }
          this.hudLives.textContent = icons.join(" ");
        },
        onStageClear: (stage) => {
          this.floatingBanner.textContent = `\u2605 STAGE ${stage} CLEARED! \u2605`;
          this.floatingBanner.classList.add("show");
          setTimeout(() => {
            this.floatingBanner.classList.remove("show");
          }, 1800);
        },
        onGameOver: (stats) => {
          this.handleGameOver(stats);
        }
      });
    }
    handleGameOver(stats) {
      if (stats.score > this.highScore) {
        this.highScore = stats.score;
        storage.setHighScore(this.gameId, this.highScore);
        this.hudHighScore.textContent = this.highScore.toString().padStart(4, "0");
      }
      this.overlayFinalScore.textContent = stats.score.toString().padStart(4, "0");
      this.overlayFinalStage.textContent = `STAGE ${stats.stage}`;
      this.overlayFinalAccuracy.textContent = `${stats.accuracy}%`;
      this.overlayFinalHits.textContent = `${stats.totalHits} / ${stats.totalShots}`;
      this.gameOverlay.classList.add("visible");
      recordGameActivity({
        gameId: "sharpshooter",
        level: Math.max(1, Math.min(255, stats.stage)),
        score: stats.score,
        status: "complete",
        result: `${stats.score} PTS (STAGE ${stats.stage})`
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
        if (["Space", "KeyZ", "KeyX", "Enter"].includes(e.code)) {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) {
            doRestart();
          } else {
            this.gameInstance.shoot();
            if (this.btnTriggerFire) {
              this.btnTriggerFire.classList.add("pressed");
              setTimeout(() => this.btnTriggerFire.classList.remove("pressed"), 120);
            }
          }
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
      this.canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sound.init();
        if (this.gameInstance.state === STATES.GAME_OVER) {
          doRestart();
        } else {
          this.gameInstance.shoot();
        }
      });
      if (this.btnTriggerFire) {
        this.btnTriggerFire.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          sound.init();
          if (this.gameInstance.state === STATES.GAME_OVER) {
            doRestart();
          } else {
            this.gameInstance.shoot();
            this.btnTriggerFire.classList.add("pressed");
          }
        });
        this.btnTriggerFire.addEventListener("pointerup", () => {
          this.btnTriggerFire.classList.remove("pressed");
        });
        this.btnTriggerFire.addEventListener("pointercancel", () => {
          this.btnTriggerFire.classList.remove("pressed");
        });
      }
    }
  };
  function boot() {
    new SharpshooterApp();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
