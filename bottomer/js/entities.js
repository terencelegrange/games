/**
 * Bottomer Entities (1983 Bally Midway Tapper Arcade Tribute)
 * Bartender, Counter, Mug, Patron, Tip, GlassShard
 */

export const BAR_ROWS = [
  { index: 0, y: 130, leftX: 75, rightX: 680, tapX: 85 },
  { index: 1, y: 210, leftX: 75, rightX: 700, tapX: 85 },
  { index: 2, y: 290, leftX: 75, rightX: 720, tapX: 85 },
  { index: 3, y: 370, leftX: 75, rightX: 740, tapX: 85 }
];

export class Bartender {
  constructor() {
    this.rowIndex = 0;
    this.x = BAR_ROWS[0].tapX;
    this.y = BAR_ROWS[0].y;
    this.width = 28;
    this.height = 42;

    this.isPouring = false;
    this.pourProgress = 0; // 0 to 1
    this.walkAnimPhase = 0;
    this.facing = 'RIGHT'; // 'RIGHT' or 'LEFT'
    this.walkSpeed = 260; // px/sec
  }

  reset() {
    this.rowIndex = 0;
    this.x = BAR_ROWS[0].tapX;
    this.y = BAR_ROWS[0].y;
    this.isPouring = false;
    this.pourProgress = 0;
    this.walkAnimPhase = 0;
    this.facing = 'RIGHT';
  }

  moveUp() {
    if (this.rowIndex > 0) {
      this.rowIndex--;
      this.x = BAR_ROWS[this.rowIndex].tapX;
      this.y = BAR_ROWS[this.rowIndex].y;
      this.isPouring = false;
    }
  }

  moveDown() {
    if (this.rowIndex < BAR_ROWS.length - 1) {
      this.rowIndex++;
      this.x = BAR_ROWS[this.rowIndex].tapX;
      this.y = BAR_ROWS[this.rowIndex].y;
      this.isPouring = false;
    }
  }

  update(dt, input) {
    const bar = BAR_ROWS[this.rowIndex];
    this.y = bar.y;

    if (this.isPouring) {
      this.pourProgress += dt * 5.0; // ~0.2s pour time
      if (this.pourProgress >= 1.0) {
        this.isPouring = false;
        return 'POUR_COMPLETE';
      }
      return null;
    }

    let moving = false;
    if (input.left) {
      this.x = Math.max(bar.tapX, this.x - this.walkSpeed * dt);
      this.facing = 'LEFT';
      moving = true;
    } else if (input.right) {
      this.x = Math.min(bar.rightX - 20, this.x + this.walkSpeed * dt);
      this.facing = 'RIGHT';
      moving = true;
    }

    if (moving) {
      this.walkAnimPhase += dt * 14;
    } else {
      this.walkAnimPhase = 0;
    }

    return null;
  }

  startPour() {
    if (this.isPouring) return false;
    const bar = BAR_ROWS[this.rowIndex];
    // Can only pour if standing by the beer tap on the left
    if (this.x <= bar.tapX + 15) {
      this.x = bar.tapX;
      this.isPouring = true;
      this.pourProgress = 0;
      this.facing = 'RIGHT';
      return true;
    }
    return false;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const step = Math.sin(this.walkAnimPhase) * 4;

    // 1983 Bally Midway Bartender
    // White shirt & Red bow tie
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, -32 + step * 0.2, 20, 20);

    // Black vest
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, -30 + step * 0.2, 5, 18);
    ctx.fillRect(5, -30 + step * 0.2, 5, 18);

    // Red Bowtie
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -32 + step * 0.2, 6, 4);

    // White Apron
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-8, -14 + step * 0.2, 16, 14);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -14 + step * 0.2, 16, 14);

    // Head, Hair & Handlebar Mustache
    ctx.fillStyle = '#fed7aa'; // Tan skin
    ctx.beginPath();
    ctx.arc(0, -38 + step * 0.2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Dark brown slicked hair
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-7, -46 + step * 0.2, 14, 5);

    // Handlebar Mustache
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(this.facing === 'RIGHT' ? 2 : -2, -36 + step * 0.2, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.facing === 'RIGHT' ? 2 : -4, -39 + step * 0.2, 2, 2);

    // Arms
    if (this.isPouring) {
      // Right arm pulled up pulling tap handle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -28, 12, 4);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(14, -34, 4, 8);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.facing === 'RIGHT' ? 6 : -10, -26 + step * 0.5, 5, 12);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(this.facing === 'RIGHT' ? 7 : -9, -15 + step * 0.5, 4, 4);
    }

    // Legs & Black Shoes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-7, -2, 5, 10 + (step > 0 ? -step : 0));
    ctx.fillRect(2, -2, 5, 10 + (step < 0 ? step : 0));
    ctx.fillStyle = '#000000';
    ctx.fillRect(-8, 7, 7, 4);
    ctx.fillRect(1, 7, 7, 4);

    ctx.restore();
  }
}

export class Mug {
  constructor(rowIndex, x, type = 'FULL') {
    this.rowIndex = rowIndex;
    this.x = x;
    this.type = type; // 'FULL' or 'EMPTY'
    this.width = 16;
    this.height = 20;
    this.speed = type === 'FULL' ? 250 : -200; // FULL slides right, EMPTY slides left
    this.active = true;
  }

  update(dt) {
    if (!this.active) return null;
    this.previousX = this.x;
    this.x += this.speed * dt;
    const bar = BAR_ROWS[this.rowIndex];

    // Check if mug falls off the end
    if (this.type === 'FULL' && this.x > bar.rightX) {
      this.active = false;
      return 'OFF_RIGHT';
    }
    if (this.type === 'EMPTY' && this.x < bar.leftX - 10) {
      this.active = false;
      return 'OFF_LEFT';
    }
    return null;
  }

  render(ctx) {
    const y = BAR_ROWS[this.rowIndex].y - 8;
    ctx.save();
    ctx.translate(this.x, y);

    // Glass Stein Body
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-6, -14, 12, 14);

    if (this.type === 'FULL') {
      // Rich Amber Beer
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-5, -11, 10, 10);

      // Creamy Frothy Head overflowing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -15, 14, 4);
      ctx.beginPath();
      ctx.arc(-2, -15, 3, 0, Math.PI * 2);
      ctx.arc(3, -15, 3, 0, Math.PI * 2);
      ctx.fill();

      // Foam drip
      ctx.fillRect(4, -12, 2, 4);
    } else {
      // Empty translucent glass with shine highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(-5, -13, 10, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -12, 2, 8);
    }

    // Glass Stein Handle
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, -7, 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }
}

export class Patron {
  constructor(rowIndex, x, type = 'COWBOY', speed = 40) {
    this.rowIndex = rowIndex;
    this.x = x;
    this.type = type; // 'COWBOY', 'GENTLEMAN', 'MINER', 'LADY'
    this.speed = speed;
    this.state = 'WALKING'; // 'WALKING', 'DRINKING', 'EXITED'
    this.drinkTimer = 0;
    this.walkAnimPhase = Math.random() * Math.PI * 2;
    this.width = 28;
    this.height = 42;
    this.slideBackSpeed = 160;
  }

  catchMug() {
    this.state = 'DRINKING';
    this.drinkTimer = 1.1; // Drink for 1.1 seconds while sliding backward
  }

  update(dt) {
    const bar = BAR_ROWS[this.rowIndex];

    if (this.state === 'WALKING') {
      this.x -= this.speed * dt;
      this.walkAnimPhase += dt * 8;

      // Check if patron reaches bartender tap side without being served!
      if (this.x <= bar.leftX + 15) {
        return 'REACHED_BAR';
      }
    } else if (this.state === 'DRINKING') {
      this.drinkTimer -= dt;
      // Slide backward toward the door while gulping
      this.x += this.slideBackSpeed * dt;

      // If pushed all the way back out the door
      if (this.x >= bar.rightX - 10) {
        this.state = 'EXITED';
        return 'EXITED_BAR';
      }

      if (this.drinkTimer <= 0) {
        // Finished drink: slides empty mug back to bartender and continues advancing
        this.state = 'WALKING';
        return 'RETURN_EMPTY';
      }
    }

    return null;
  }

  render(ctx) {
    if (this.state === 'EXITED') return;

    const bar = BAR_ROWS[this.rowIndex];
    const y = bar.y;
    ctx.save();
    ctx.translate(this.x, y);

    const step = Math.sin(this.walkAnimPhase) * 4;

    if (this.type === 'COWBOY') {
      // Cowboy with Stetson hat, plaid shirt, leather vest
      ctx.fillStyle = '#b45309'; // Stetson Hat Brim
      ctx.fillRect(-12, -45, 24, 4);
      ctx.fillRect(-7, -50, 14, 6);

      // Face & Bandana
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -38, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444'; // Red bandana
      ctx.fillRect(-5, -34, 10, 4);

      // Shirt & Vest
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-8, -30, 16, 18);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -28, 4, 14);
      ctx.fillRect(4, -28, 4, 14);

      // Jeans & Boots
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-6, -12, 5, 14 + (step > 0 ? -step : 0));
      ctx.fillRect(1, -12, 5, 14 + (step < 0 ? step : 0));
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-7, 2, 6, 4);
      ctx.fillRect(1, 2, 6, 4);
    } else if (this.type === 'MINER') {
      // Bearded Miner with red flannel & suspenders
      ctx.fillStyle = '#475569'; // Miner slouch cap
      ctx.fillRect(-9, -46, 18, 5);

      // Face & big bushy grey/brown beard
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -38, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#71717a'; // Bushy beard
      ctx.fillRect(-6, -35, 12, 9);

      // Red Flannel
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-9, -29, 18, 17);
      // Dark suspenders
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -29, 2, 17);
      ctx.fillRect(4, -29, 2, 17);

      // Dungarees & Work boots
      ctx.fillStyle = '#334155';
      ctx.fillRect(-7, -12, 6, 14 + (step > 0 ? -step : 0));
      ctx.fillRect(1, -12, 6, 14 + (step < 0 ? step : 0));
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-8, 2, 7, 4);
      ctx.fillRect(1, 2, 7, 4);
    } else if (this.type === 'GENTLEMAN') {
      // Top hat gentleman with monocle & tuxedo
      ctx.fillStyle = '#0f172a'; // Tall Top Hat
      ctx.fillRect(-10, -44, 20, 3);
      ctx.fillRect(-6, -56, 12, 12);
      ctx.fillStyle = '#e11d48'; // Hat red ribbon
      ctx.fillRect(-6, -46, 12, 2);

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -38, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15'; // Gold monocle
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -40, 4, 4);

      // Tuxedo
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, -30, 16, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -30, 6, 14);

      // Slacks & dress shoes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -12, 5, 14 + (step > 0 ? -step : 0));
      ctx.fillRect(1, -12, 5, 14 + (step < 0 ? step : 0));
      ctx.fillStyle = '#020617';
      ctx.fillRect(-7, 2, 6, 4);
      ctx.fillRect(1, 2, 6, 4);
    } else {
      // Saloon Lady with feather hairpin & emerald dress
      ctx.fillStyle = '#f43f5e'; // Pink feather
      ctx.fillRect(4, -50, 3, 10);
      ctx.fillStyle = '#78350f'; // Auburn hair
      ctx.fillRect(-7, -46, 14, 8);

      // Face
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -38, 6, 0, Math.PI * 2);
      ctx.fill();

      // Emerald Victorian Corset Dress
      ctx.fillStyle = '#059669';
      ctx.fillRect(-8, -30, 16, 26);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-10, -10, 20, 14);

      // Shoes
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(-6, 4, 5, 3);
      ctx.fillRect(1, 4, 5, 3);
    }

    // Raised beer mug if drinking
    if (this.state === 'DRINKING') {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-14, -36, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-15, -39, 10, 3);
    }

    ctx.restore();
  }
}

export class Tip {
  constructor(rowIndex, x) {
    this.rowIndex = rowIndex;
    this.x = x;
    this.life = 10.0; // 10 seconds to collect
    this.value = 150;
    this.twinklePhase = 0;
  }

  update(dt) {
    this.life -= dt;
    this.twinklePhase += dt * 8;
  }

  render(ctx) {
    if (this.life <= 0) return;
    const y = BAR_ROWS[this.rowIndex].y - 8;
    ctx.save();
    ctx.translate(this.x, y);

    const glow = Math.sin(this.twinklePhase) * 0.3 + 0.7;

    // Gold Coin Stack
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(250, 204, 21, ${glow})`;
    ctx.beginPath();
    ctx.ellipse(0, -3, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer star
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -7, 2, 2);

    ctx.restore();
  }
}

export class GlassShard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI - Math.PI;
    const speed = 60 + Math.random() * 140;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 0.5 + Math.random() * 0.3;
    this.size = 2 + Math.random() * 4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 15;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 450 * dt; // Gravity
    this.rotation += this.rotSpeed * dt;
    this.life -= dt;
  }

  render(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }
}
