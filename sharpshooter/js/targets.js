/**
 * Sharpshooter Target Manager & Entity Definitions
 * Stage-specific targets: Ducks, Bullseye Circles, Tin Cans, UFOs, and Stars.
 * Progressive speed scaling, custom 80s arcade vector rendering, and destruction physics.
 */

export const TARGET_TYPES = {
  1: { id: 'duck', name: 'MALLARD DUCK', icon: '🦆', radius: 34 },
  2: { id: 'circle', name: 'BULLSEYE DISC', icon: '🎯', radius: 32 },
  3: { id: 'can', name: 'CARNIVAL CAN', icon: '🥫', radius: 28 },
  4: { id: 'ufo', name: 'RETRO SAUCER', icon: '🛸', radius: 34 },
  5: { id: 'star', name: 'GOLDEN STAR', icon: '⭐', radius: 30 },
  6: { id: 'balloon', name: 'CARNIVAL BALLOON', icon: '🎈', radius: 30 },
  7: { id: 'clay', name: 'CLAY PIGEON', icon: '🥏', radius: 32 },
  8: { id: 'clown', name: 'CARNIVAL CLOWN', icon: '🤡', radius: 34 },
  9: { id: 'barrel', name: 'WOODEN BARREL', icon: '🛢️', radius: 30 },
  10: { id: 'asteroid', name: 'SPACE ASTEROID', icon: '☄️', radius: 32 },
  11: { id: 'bat', name: 'HAUNTED BAT', icon: '🦇', radius: 32 },
  12: { id: 'badge', name: 'SHERIFF BADGE', icon: '🪙', radius: 30 },
  13: { id: 'rocket', name: 'RETRO ROCKET', icon: '🚀', radius: 32 },
  14: { id: 'skull', name: 'CRYSTAL SKULL', icon: '💀', radius: 30 },
  15: { id: 'trophy', name: 'GOLDEN TROPHY', icon: '🏆', radius: 32 },
  16: { id: 'invader', name: 'PIXEL INVADER', icon: '👾', radius: 30 },
  17: { id: 'dynamite', name: 'TNT DYNAMITE', icon: '🧨', radius: 28 },
  18: { id: 'plasma', name: 'PLASMA SPHERE', icon: '🔮', radius: 32 },
  19: { id: 'clock', name: 'STEAMPUNK CLOCK', icon: '⏰', radius: 30 },
  20: { id: 'diamond', name: 'COSMIC DIAMOND', icon: '💎', radius: 32 }
};

export class Target {
  constructor(config) {
    this.id = config.id;
    this.type = config.type || 'duck';
    this.stage = config.stage || 1;
    this.x = config.x || 0;
    this.y = config.y || 250;
    this.baseY = this.y;
    this.vx = config.vx || 200;
    this.direction = config.direction || 1; // 1 = left-to-right, -1 = right-to-left
    this.radius = config.radius || 32;

    this.active = true;
    this.state = 'moving'; // 'moving', 'hit', 'escaped'

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

    if (this.state === 'moving') {
      this.x += this.vx * this.direction * dt;

      // UFO gentle wave motion
      if (this.type === 'ufo') {
        this.y = this.baseY + Math.sin(this.animTick * 5.0) * 14;
      } else if (this.type === 'duck') {
        this.y = this.baseY + Math.sin(this.animTick * 3.5) * 8;
      }

      // Check if completely escaped off-screen
      if ((this.direction > 0 && this.x > 900 + this.radius + 20) ||
          (this.direction < 0 && this.x < -this.radius - 20)) {
        this.state = 'escaped';
        this.active = false;
      }
    } else if (this.state === 'hit') {
      this.hitTimer += dt;
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.x += (this.vx * 0.3 * this.direction) * dt;
      this.rot += this.rotSpeed * dt;

      // Update particle fragments
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
    this.state = 'hit';
    this.vy = -260; // Pop upward on bullet impact
    this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 8);

    const count = bullseye ? 18 : 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      let pColor = '#ffffff';

      if (this.type === 'duck') {
        pColor = ['#facc15', '#15803d', '#ffffff', '#ea580c'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'circle') {
        pColor = ['#ef4444', '#ffffff', '#facc15'][Math.floor(Math.random() * 3)];
      } else if (this.type === 'can') {
        pColor = ['#cbd5e1', '#ef4444', '#94a3b8'][Math.floor(Math.random() * 3)];
      } else if (this.type === 'ufo') {
        pColor = ['#38bdf8', '#a855f7', '#22d3ee', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'star') {
        pColor = ['#fbbf24', '#f59e0b', '#ffffff'][Math.floor(Math.random() * 3)];
      } else if (this.type === 'balloon') {
        pColor = ['#ef4444', '#f87171', '#fee2e2', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'clay') {
        pColor = ['#ea580c', '#f97316', '#fdba74', '#7c2d12'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'clown') {
        pColor = ['#ef4444', '#3b82f6', '#facc15', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'barrel') {
        pColor = ['#92400e', '#78350f', '#451a03', '#94a3b8'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'asteroid') {
        pColor = ['#64748b', '#475569', '#334155', '#f97316'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'bat') {
        pColor = ['#1e1b4b', '#4338ca', '#ef4444', '#312e81'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'badge') {
        pColor = ['#facc15', '#eab308', '#ca8a04', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'rocket') {
        pColor = ['#ef4444', '#ffffff', '#38bdf8', '#f97316'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'skull') {
        pColor = ['#06b6d4', '#67e8f9', '#ffffff', '#0891b2'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'trophy') {
        pColor = ['#facc15', '#fbbf24', '#eab308', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'invader') {
        pColor = ['#10b981', '#34d399', '#059669', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'dynamite') {
        pColor = ['#dc2626', '#ef4444', '#f59e0b', '#fde047'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'plasma') {
        pColor = ['#a855f7', '#c084fc', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 4)];
      } else if (this.type === 'clock') {
        pColor = ['#d97706', '#b45309', '#fde047', '#78350f'][Math.floor(Math.random() * 4)];
      } else {
        pColor = ['#38bdf8', '#c084fc', '#f43f5e', '#ffffff'][Math.floor(Math.random() * 4)];
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

    // Draw debris particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    if (!this.active) return;

    // Draw carnival mounting post down to moving conveyor track
    if (this.state === 'moving') {
      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + (this.type === 'can' ? 20 : (this.type === 'circle' ? this.radius - 2 : 18)));
      ctx.lineTo(this.x, 268);
      ctx.stroke();

      // Mechanical bracket & pivot bolt
      ctx.fillStyle = '#64748b';
      ctx.fillRect(this.x - 7, 260, 14, 8);
      ctx.fillStyle = '#facc15';
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
    if (this.state === 'hit') {
      ctx.rotate(this.rot);
    }

    // Render by type
    if (this.type === 'duck') {
      this.renderDuck(ctx);
    } else if (this.type === 'circle') {
      this.renderCircle(ctx);
    } else if (this.type === 'can') {
      this.renderCan(ctx);
    } else if (this.type === 'ufo') {
      this.renderUfo(ctx);
    } else if (this.type === 'star') {
      this.renderStar(ctx);
    } else if (this.type === 'balloon') {
      this.renderBalloon(ctx);
    } else if (this.type === 'clay') {
      this.renderClayPigeon(ctx);
    } else if (this.type === 'clown') {
      this.renderClown(ctx);
    } else if (this.type === 'barrel') {
      this.renderBarrel(ctx);
    } else if (this.type === 'asteroid') {
      this.renderAsteroid(ctx);
    } else if (this.type === 'bat') {
      this.renderBat(ctx);
    } else if (this.type === 'badge') {
      this.renderBadge(ctx);
    } else if (this.type === 'rocket') {
      this.renderRocket(ctx);
    } else if (this.type === 'skull') {
      this.renderSkull(ctx);
    } else if (this.type === 'trophy') {
      this.renderTrophy(ctx);
    } else if (this.type === 'invader') {
      this.renderPixelInvader(ctx);
    } else if (this.type === 'dynamite') {
      this.renderDynamite(ctx);
    } else if (this.type === 'plasma') {
      this.renderPlasma(ctx);
    } else if (this.type === 'clock') {
      this.renderClock(ctx);
    } else {
      this.renderDiamond(ctx);
    }

    ctx.restore();
  }

  // --- Target Renderers ---

  renderDuck(ctx) {
    // Flapping wing cycle
    const flap = Math.sin(this.animTick * 14);

    // Body shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (warm mallard brown / golden yellow)
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing
    ctx.save();
    ctx.translate(-2, 2);
    ctx.rotate(flap * 0.45);
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Wing feather stripe
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-4, -2, 6, 3);
    ctx.restore();

    // Neck & Head (Emerald green mallard)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(16, -8, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White neck ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(13, -2, 6, 0.4, Math.PI * 0.85);
    ctx.stroke();

    // Eye
    if (this.state === 'hit') {
      // "X" eye when shot
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(17, -11); ctx.lineTo(21, -7);
      ctx.moveTo(21, -11); ctx.lineTo(17, -7);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(19, -9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(20, -9, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orange Bill / Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(25, -9);
    ctx.lineTo(36, -6);
    ctx.lineTo(25, -3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tail Feathers
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-28, -6);
    ctx.lineTo(-20, 6);
    ctx.closePath();
    ctx.fill();
  }

  renderCircle(ctx) {
    // Vintage Carnival Shooting Gallery Bullseye Target
    const r = this.radius;

    // Hanging support bar
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, -r - 18);
    ctx.stroke();

    // Outer Target Rim
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Ring 1 (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Ring 2 (White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.50, 0, Math.PI * 2);
    ctx.fill();

    // Center Bullseye (Yellow / Red)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderCan(ctx) {
    // 3D Vintage Soda / Soup Tin Can
    const w = 28;
    const h = 42;

    // Can body with metallic gradient
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.2, '#ef4444');
    grad.addColorStop(0.5, '#fca5a5');
    grad.addColorStop(0.8, '#ef4444');
    grad.addColorStop(1, '#7f1d1d');

    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Metallic Rim Top
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Metallic Rim Bottom
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(0, h / 2, w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // White label stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2, -4, w, 8);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('POP', 0, 0);

    // Can outline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
  }

  renderUfo(ctx) {
    // Retro Sci-Fi Flying Saucer
    const r = this.radius;

    // Glowing energy aura
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;

    // Upper Glass Cockpit Dome
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.arc(0, -6, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Little Alien Silhouette inside
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(0, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Saucer Metallic Disc Body
    const discGrad = ctx.createLinearGradient(0, -8, 0, 10);
    discGrad.addColorStop(0, '#e2e8f0');
    discGrad.addColorStop(0.5, '#64748b');
    discGrad.addColorStop(1, '#334155');

    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Underside Pulsating Porthole Lights
    const lightPhase = Math.floor(this.animTick * 8) % 4;
    [-20, -7, 7, 20].forEach((lx, idx) => {
      ctx.fillStyle = idx === lightPhase ? '#facc15' : '#ef4444';
      ctx.beginPath();
      ctx.arc(lx, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  renderStar(ctx) {
    // 5-Point Spinning Carnival Bonus Star
    const r = this.radius;
    const points = 5;
    const step = Math.PI / points;

    ctx.save();
    ctx.rotate(this.animTick * 2);
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
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
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Jewel
    ctx.fillStyle = '#ef4444';
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

    // Helium string
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.quadraticCurveTo(Math.sin(this.animTick * 6) * 8, r + 18, Math.sin(this.animTick * 4) * 4, r + 36);
    ctx.stroke();

    // Balloon knot
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(-4, r + 2);
    ctx.lineTo(4, r + 2);
    ctx.lineTo(0, r - 3);
    ctx.closePath();
    ctx.fill();

    // Balloon body (glossy cherry red)
    const grad = ctx.createRadialGradient(-6, -6, 2, 0, 0, r);
    grad.addColorStop(0, '#fca5a5');
    grad.addColorStop(0.3, '#ef4444');
    grad.addColorStop(0.85, '#dc2626');
    grad.addColorStop(1, '#991b1b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shiny specular highlight crescent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.4, 4, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderClayPigeon(ctx) {
    // Fluorescent Orange Trap/Skeet Aerodynamic Clay Disc
    const w = 32;
    const h = 12;

    ctx.save();
    // Disc body shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, w, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim (deep blaze orange)
    const grad = ctx.createLinearGradient(0, -h, 0, h);
    grad.addColorStop(0, '#fdba74');
    grad.addColorStop(0.2, '#f97316');
    grad.addColorStop(0.7, '#ea580c');
    grad.addColorStop(1, '#9a3412');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stepped inner aerodynamic ring
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(0, -2, w * 0.7, h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center bullseye groove
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, -2, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff7ed';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  renderClown(ctx) {
    // Vintage Midway Laughing Clown Target Cutout
    ctx.save();

    // Ruffled carnival neck collar
    ctx.fillStyle = '#facc15';
    for (let a = -20; a <= 20; a += 10) {
      ctx.beginPath();
      ctx.arc(a, 24, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Clown face (pale white porcelain)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 4, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointed cone party hat
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(0, -34);
    ctx.lineTo(16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hat yellow pompom
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -35, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Painted blue star eyes
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
    ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Big red cherry clown nose
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(-2, 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wide painted carnival grin
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 10, 11, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
  }

  renderBarrel(ctx) {
    // Rolling Oak Whiskey / Root-Beer Wooden Keg
    const w = 22;
    const h = 26;

    ctx.save();
    // Oak staves gradient
    const grad = ctx.createLinearGradient(-w, 0, w, 0);
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.2, '#78350f');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(0.8, '#78350f');
    grad.addColorStop(1, '#451a03');

    ctx.fillStyle = grad;
    // Bulging barrel barrel shape
    ctx.beginPath();
    ctx.moveTo(-w * 0.75, -h);
    ctx.quadraticCurveTo(-w, 0, -w * 0.75, h);
    ctx.lineTo(w * 0.75, h);
    ctx.quadraticCurveTo(w, 0, w * 0.75, -h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#290e02';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Metal hoops
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    [-h * 0.65, -h * 0.2, h * 0.2, h * 0.65].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.85, y);
      ctx.lineTo(w * 0.85, y);
      ctx.stroke();
    });

    // Cork bunghole
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderAsteroid(ctx) {
    // Tumbling craggy space rock with glowing magma fissures
    const r = this.radius;

    ctx.save();
    ctx.rotate(this.animTick * 1.2);

    ctx.fillStyle = '#334155';
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
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Craters
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-8, -6, 5, 0, Math.PI * 2);
    ctx.arc(6, 6, 6, 0, Math.PI * 2);
    ctx.arc(-4, 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Molten orange fissure cracks
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -5); ctx.lineTo(2, 0); ctx.lineTo(6, 6);
    ctx.moveTo(2, 0); ctx.lineTo(-2, 8);
    ctx.stroke();

    ctx.restore();
  }

  // --- Levels 11-20 Target Renderers ---

  renderBat(ctx) {
    // Gothic Haunted Vampire Bat
    const wingFlap = Math.sin(this.animTick * 15) * 0.45;

    ctx.save();

    // Wings
    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 1.5;

    // Left Wing
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

    // Right Wing
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

    // Bat furry body
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(0, 4, 7, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pointed ears
    ctx.beginPath();
    ctx.moveTo(-6, -4); ctx.lineTo(-9, -14); ctx.lineTo(-2, -6);
    ctx.moveTo(6, -4); ctx.lineTo(9, -14); ctx.lineTo(2, -6);
    ctx.fill();

    // Glowing red eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-2.5, 0, 1.5, 0, Math.PI * 2);
    ctx.arc(2.5, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderBadge(ctx) {
    // 6-Pointed Metallic Golden Sheriff Star Badge
    const r = this.radius;
    const points = 6;
    const step = Math.PI / points;

    ctx.save();
    ctx.rotate(this.animTick * 1.5);

    // Gold star
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
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
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ball tips at points
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < points; i++) {
      const angle = i * 2 * step - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center circular seal
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  renderRocket(ctx) {
    // Retro 1950s/80s Tin-Toy Space Rocket
    ctx.save();
    ctx.rotate(-0.15);

    // Animated thruster exhaust flame
    const flameH = 12 + Math.random() * 8;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-6, 18);
    ctx.lineTo(0, 18 + flameH);
    ctx.lineTo(6, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(-3, 18);
    ctx.lineTo(0, 18 + flameH * 0.6);
    ctx.lineTo(3, 18);
    ctx.closePath();
    ctx.fill();

    // Red stabilizer delta fins
    ctx.fillStyle = '#dc2626';
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

    // Fuselage (sleek white body)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.quadraticCurveTo(12, -8, 9, 18);
    ctx.lineTo(-9, 18);
    ctx.quadraticCurveTo(-12, -8, 0, -26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red nose cone
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(7, -12);
    ctx.lineTo(-7, -12);
    ctx.closePath();
    ctx.fill();

    // Circular cyan cockpit window
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  renderSkull(ctx) {
    // Glowing Crystal Skull Arcane Relic
    const r = this.radius;

    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;

    // Cranium
    const grad = ctx.createRadialGradient(-4, -6, 2, 0, 0, r);
    grad.addColorStop(0, '#cffafe');
    grad.addColorStop(0.4, '#67e8f9');
    grad.addColorStop(0.8, '#06b6d4');
    grad.addColorStop(1, '#0e7490');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -4, 18, Math.PI, 0);
    ctx.lineTo(14, 8);
    ctx.lineTo(8, 16);
    ctx.lineTo(-8, 16);
    ctx.lineTo(-14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hollow eye sockets
    ctx.fillStyle = '#083344';
    ctx.beginPath();
    ctx.ellipse(-7, -2, 5, 6, -0.15, 0, Math.PI * 2);
    ctx.ellipse(7, -2, 5, 6, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Nasal cavity
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(-2.5, 8);
    ctx.lineTo(2.5, 8);
    ctx.closePath();
    ctx.fill();

    // Grinning teeth lines
    ctx.strokeStyle = '#083344';
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
    // Shining Golden Championship Goblet
    ctx.save();

    // Mahogany / marble pedestal
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-12, 18, 24, 7);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-14, 25, 28, 3);

    // Stem
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-3, 10, 6, 8);

    // Goblet bowl
    const grad = ctx.createLinearGradient(-16, 0, 16, 0);
    grad.addColorStop(0, '#b45309');
    grad.addColorStop(0.25, '#facc15');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(0.75, '#facc15');
    grad.addColorStop(1, '#92400e');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(16, -18);
    ctx.lineTo(12, 4);
    ctx.quadraticCurveTo(0, 12, -12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Handles
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-16, -6, 7, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(16, -6, 7, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    // Sparkle star glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderPixelInvader(ctx) {
    // Authentic 8-Bit Space Alien Sprite
    const s = 3.0;
    const flap = Math.floor(this.animTick * 6) % 2 === 0;

    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 8;

    // Upper head & antennae
    ctx.fillRect(-1 * s, -6 * s, 2 * s, 1.5 * s);
    ctx.fillRect(-3 * s, -4.5 * s, 6 * s, 1.5 * s);
    ctx.fillRect(-4.5 * s, -3 * s, 9 * s, 1.5 * s);

    // Eyes
    ctx.fillRect(-5.5 * s, -1.5 * s, 2 * s, 2 * s);
    ctx.fillRect(-1.5 * s, -1.5 * s, 3 * s, 2 * s);
    ctx.fillRect(3.5 * s, -1.5 * s, 2 * s, 2 * s);

    // Torso
    ctx.fillRect(-4.5 * s, 0.5 * s, 9 * s, 2 * s);

    // Animated tentacles (Flap A vs B)
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
    // Triple Bundled Red TNT Sticks with Burning Fuse
    ctx.save();

    // Dynamite sticks (3 vertical sticks)
    ctx.fillStyle = '#dc2626';
    [-11, 0, 11].forEach(dx => {
      ctx.fillRect(dx - 5, -16, 10, 32);
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx - 5, -16, 10, 32);
    });

    // Black tape band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -6, 36, 12);

    // White TNT text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 0, 0);

    // Burning fuse wire
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(8, -26, 4, -32);
    ctx.stroke();

    // Fuse flame spark
    const spark = Math.random() * 3 + 3;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(4, -32, spark, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -32, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderPlasma(ctx) {
    // Crackling Electric Plasma Sphere
    const r = this.radius;

    ctx.save();
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;

    // Glowing core
    const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    coreGrad.addColorStop(0, '#f5d0fe');
    coreGrad.addColorStop(0.3, '#c084fc');
    coreGrad.addColorStop(0.7, '#7e22ce');
    coreGrad.addColorStop(1, '#3b0764');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8b4fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Electric lightning discharge arcs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (this.animTick * 3 + (i * Math.PI) / 2) % (Math.PI * 2);
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
    // Steampunk Brass Pocket Watch
    const r = this.radius;

    ctx.save();
    // Top winding crown & loop
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -r - 5, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-3, -r - 2, 6, 4);

    // Brass watch case
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dial face (parchment white)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Roman numeral tick marks
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r * 0.65), Math.sin(a) * (r * 0.65));
      ctx.lineTo(Math.cos(a) * (r * 0.74), Math.sin(a) * (r * 0.74));
      ctx.stroke();
    }

    // Rotating minute and hour hands
    const minuteA = this.animTick * 4;
    const hourA = this.animTick * 0.6;

    ctx.strokeStyle = '#1e293b';
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
    // Brilliant-Cut Cosmic Prismatic Diamond
    const r = this.radius;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    // Diamond gem contour
    const topW = r * 0.65;
    const midW = r;
    const topY = -r * 0.7;
    const midY = -r * 0.15;
    const botY = r;

    // Prismatic gradient
    const grad = ctx.createLinearGradient(-r, -r, r, r);
    grad.addColorStop(0, '#cffafe');
    grad.addColorStop(0.35, '#38bdf8');
    grad.addColorStop(0.7, '#c084fc');
    grad.addColorStop(1, '#f43f5e');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-topW, topY);
    ctx.lineTo(topW, topY);
    ctx.lineTo(midW, midY);
    ctx.lineTo(0, botY);
    ctx.lineTo(-midW, midY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Internal facet lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-topW * 0.5, topY);
    ctx.lineTo(0, midY);
    ctx.lineTo(topW * 0.5, topY);
    ctx.moveTo(0, midY);
    ctx.lineTo(0, botY);
    ctx.moveTo(-midW, midY);
    ctx.lineTo(midW, midY);
    ctx.stroke();

    // Star glint shine
    const glint = Math.sin(this.animTick * 6) * 2 + 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(topW * 0.4, topY + 4, glint, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class TargetManager {
  constructor(stage = 1) {
    this.stage = stage;
    this.targets = [];
    this.floatingScores = [];

    this.stageTargetQuota = 10; // 10 targets per stage
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
    // 20 unique stage targets; loops into endless beyond stage 20
    const cycleStage = ((this.stage - 1) % 20) + 1;
    const def = TARGET_TYPES[cycleStage];

    // Continuous monotonic speed scaling with 5% compounding boost per level on top of the base progression:
    // (120 + (stage - 1) * 15) * (1.05)^(stage - 1)
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

    // Queue 4 initial targets off-screen to the left (X <= -config.radius - 30)
    // so no targets start on-screen or past the crosshair before the round begins
    for (let i = 0; i < 4; i++) {
      const startX = -config.radius - 30 - (i * spacing);
      const target = new Target({
        id: ++this.idCounter,
        type: config.type,
        stage: this.stage,
        x: startX,
        y: 250, // Central target lane aligning with center crosshair
        vx: config.speed,
        direction: 1, // Carnival conveyor moves left to right past crosshair
        radius: config.radius
      });
      this.targets.push(target);
    }
  }

  addFloatingScore(text, x, y, color = '#facc15') {
    this.floatingScores.push({
      text,
      x,
      y,
      vy: -60,
      alpha: 1.0,
      color,
      life: 0.85
    });
  }

  update(dt = 1 / 60) {
    const config = this.getStageConfig();

    // 1. Maintain carnival conveyor stream: spawn new target if leftmost target has moved forward
    const moving = this.targets.filter(t => t.active && t.state === 'moving');
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

    // 2. Update all active targets
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.update(dt);

      // Carnival continuous conveyor: if target reached the right edge without being shot,
      // it loops under and cycles back from the left entrance
      if (t.state === 'escaped') {
        let currentLeftmost = 0;
        for (const m of this.targets) {
          if (m.active && m.state === 'moving' && m.x < currentLeftmost) {
            currentLeftmost = m.x;
          }
        }
        t.x = Math.min(-t.radius - 30, currentLeftmost - this.conveyorSpacing);
        t.state = 'moving';
        t.active = true;
      }

      if (!t.active && t.particles.length === 0) {
        this.targets.splice(i, 1);
      }
    }

    // 3. Update floating score indicators
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
    // Render all targets
    for (const t of this.targets) {
      t.render(ctx);
    }

    // Render floating score banners (+1, BULLSEYE!)
    ctx.save();
    for (const f of this.floatingScores) {
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }
}
