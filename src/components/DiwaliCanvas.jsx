import React, { useEffect, useRef, useCallback } from 'react';

const TAU = Math.PI * 2;

// ── Palette ──────────────────────────────────────────────────
const GOLD  = ['#FFF8DD','#FFF0BB','#FFE566','#FFD700','#FFAB32','#F5D58A','#D9A441','#E8B84B'];
const BRIGHT = ['#FFFFFF','#FFF8DD','#FFFAEE','#FFF0BB'];
function rnd(a,b){ return a + Math.random()*(b-a); }
function rndI(a,b){ return Math.floor(rnd(a,b+1)); }
function gold(){ return GOLD[Math.floor(Math.random()*GOLD.length)]; }
function bright(){ return BRIGHT[Math.floor(Math.random()*BRIGHT.length)]; }

// ── STAR CLASS ────────────────────────────────────────────────
//
//  Two tiers:
//   "bg"      (60%) — tiny background dots scattered across the sky
//   "sparkle" (40%) — crisp 4-point polygon stars with a glowing core
//
//  The 4-point shape is drawn as a proper closed canvas path
//  (8 vertices: 4 outer tips + 4 very-close inner waist points).
//  innerR = outerR × 0.09 → extremely sharp, needle-like points.
//
//  Twinkling: sine-wave on alpha, period 1.2–2.8 s, fully independent.

const STAR_COLORS = [
  '#FFFFFF',   // pure white
  '#FFF9EE',   // warm white
  '#FFFBE0',   // cream
  '#FFF5C5',   // champagne
  '#FFE99A',   // pale gold
];

// Builds a 4-point star path centred at (x, y).
// outerR = half-width of each ray tip from centre.
// innerR is set internally to ~9% of outerR for razor-sharp points.
function fourPointPath(ctx, x, y, outerR) {
  const innerR = outerR * 0.09;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI / 4) - Math.PI / 2; // start at top
    const r     = (i % 2 === 0) ? outerR : innerR;
    const px    = x + Math.cos(angle) * r;
    const py    = y + Math.sin(angle) * r;
    (i === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

class Star {
  constructor(w, h) { this.w = w; this.h = h; this.init(); }

  init() {
    this.x = rnd(0, this.w);
    this.y = rnd(0, this.h);

    const roll = Math.random();
    if (roll < 0.60) {
      // ── Background dot ─────────────────────────────────────
      this.tier      = 'bg';
      this.coreR     = rnd(0.6, 1.6);   // tiny
      this.outerR    = 0;
      this.peakAlpha = rnd(0.55, 0.85);
      this.minAlpha  = rnd(0.18, 0.38);
    } else {
      // ── 4-point sparkle star ───────────────────────────────
      this.tier      = 'sparkle';
      this.coreR     = rnd(1.5, 3.0);   // bright centre 3–6 px diameter
      this.outerR    = rnd(6, 13);       // ray half-length → total 12–26 px
      this.peakAlpha = rnd(0.80, 1.00);
      this.minAlpha  = rnd(0.28, 0.50);
    }

    this.color        = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    // Period 1.2–2.8 s → speed = 2π/T → [2.24, 5.24] rad/s
    this.twinkleSpeed = rnd(2.24, 5.24);
    this.phase        = rnd(0, TAU);
    this.alpha        = rnd(this.minAlpha, this.peakAlpha);
  }

  update(dt) {
    this.phase += this.twinkleSpeed * (dt * 0.001);
    const t    = 0.5 + 0.5 * Math.sin(this.phase);
    this.alpha = this.minAlpha + (this.peakAlpha - this.minAlpha) * t;
  }

  draw(ctx) {
    const { x, y, coreR, outerR, alpha, color, tier } = this;
    ctx.save();

    if (tier === 'bg') {
      // ── Simple glowing dot ────────────────────────────────
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur  = coreR * 4;
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(x, y, coreR, 0, TAU);
      ctx.fill();

    } else {
      // ── 4-point sparkle star ──────────────────────────────

      // Layer 1: restrained soft halo — only around centre, not giant blob
      const haloR   = coreR * 4.5;
      const haloMax = alpha * 0.38;
      const g = ctx.createRadialGradient(x, y, 0, x, y, haloR);
      g.addColorStop(0,   `rgba(255,245,190,${haloMax.toFixed(3)})`);
      g.addColorStop(0.5, `rgba(255,230,140,${(haloMax * 0.3).toFixed(3)})`);
      g.addColorStop(1,   'rgba(255,210,100,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle   = g;
      ctx.beginPath();
      ctx.arc(x, y, haloR, 0, TAU);
      ctx.fill();

      // Layer 2: 4-point star polygon — sharp, tapered rays
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur  = coreR * 5;
      ctx.fillStyle   = color;
      fourPointPath(ctx, x, y, outerR);
      ctx.fill();

      // Layer 3: hot white core — the bright central point
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur  = coreR * 6;
      ctx.fillStyle   = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, coreR, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}


// ── ROCKET ───────────────────────────────────────────────────
class Rocket {
  constructor(w, h) {
    this.alive         = true;
    this.shouldExplode = false;
    this.hasClimbed    = false;   // guards apex trigger from firing at launch
    this.x  = rnd(w * 0.08, w * 0.92);
    this.y  = h + 6;
    // Target altitude upper 15–40% of screen
    this.targetY = rnd(h * 0.15, h * 0.40);
    this.targetX = Math.max(w * 0.05, Math.min(w * 0.95,
                    this.x + rnd(-w * 0.18, w * 0.18)));
    // Speed guaranteed to reach target: v² = 2g·d + buffer
    const vertDist = Math.abs(this.y - this.targetY);
    // Minimum speed to reach targetY, plus 30–60% margin
    const minSpd = Math.sqrt(2 * 480 * vertDist);  // worst-case gravity
    const spd0   = minSpd * rnd(1.30, 1.65);        // always overpowers gravity
    const dist   = Math.hypot(this.targetX - this.x, this.targetY - this.y);
    this.vx = (this.targetX - this.x) / dist * spd0;
    this.vy = (this.targetY - this.y) / dist * spd0; // negative (upward)
    this.gravity  = rnd(280, 420);   // px/s² — rocket decelerates naturally
    this.wobble   = rnd(-40, 40);
    this.trail    = [];
    this.maxTrail = rndI(8, 14);     // short trail — prevents screen-spanning lines
    this.color    = Math.random() < 0.5 ? '#FFD060' : '#FFAA30';
    this.size     = rnd(2.5, 3.8);
    this.sparks   = [];
    this.sparkTimer = 0;
  }

  update(dt) {
    if (!this.alive) return;
    const s = dt / 1000;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();
    // Physics
    this.vx += this.wobble * s * 0.12;
    this.vy += this.gravity * s;    // positive gravity decelerates upward vy
    this.x  += this.vx * s;
    this.y  += this.vy * s;

    // Track that rocket was actually climbing (vy < 0 = moving upward)
    if (this.vy < 0) this.hasClimbed = true;

    // ── Three explosion triggers — at least one always fires ────
    // T1: Close to target point
    const closeEnough = Math.hypot(this.x - this.targetX, this.y - this.targetY) < 28;
    // T2: Apex — vy turned positive (falling) AFTER climbing. Fires wherever rocket is.
    const atApex      = this.vy >= 0 && this.hasClimbed;
    // T3: Overshoot — rocket flew above target altitude
    const overshot    = this.y <= this.targetY;

    if (closeEnough || atApex || overshot) {
      this.alive = false;
      this.shouldExplode = true;
    }

    // Tiny falling sparks from trail
    this.sparkTimer += dt;
    if (this.sparkTimer > 35) {
      this.sparkTimer = 0;
      if (Math.random() < 0.55) {
        this.sparks.push({
          x: this.x + rnd(-3, 3), y: this.y + rnd(-3, 3),
          vx: rnd(-30, 30), vy: rnd(18, 70),
          a: rnd(0.5, 0.9), decay: rnd(1.4, 2.8), r: rnd(0.5, 1.3),
        });
      }
    }
    for (const sp of this.sparks) {
      sp.x += sp.vx * s; sp.y += sp.vy * s;
      sp.vy += 110 * s;
      sp.a  -= sp.decay * s;
    }
    this.sparks = this.sparks.filter(sp => sp.a > 0);
  }

  draw(ctx) {
    // Short tapered trail
    if (this.trail.length >= 2) {
      ctx.lineCap = 'round';
      for (let i = 1; i < this.trail.length; i++) {
        const p = this.trail[i - 1], q = this.trail[i];
        const t = i / this.trail.length;
        ctx.save();
        ctx.globalAlpha = t * t * 0.88;
        ctx.strokeStyle = t > 0.7 ? '#FFFAE0' : this.color;
        ctx.lineWidth   = this.size * t * 0.9;
        ctx.shadowColor = '#FFD060';
        ctx.shadowBlur  = 10 * t;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Tiny falling sparks
    for (const sp of this.sparks) {
      if (sp.a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.a);
      ctx.fillStyle = '#FFB020';
      ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // Rocket head
    if (this.alive) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#FFE566'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.40;
      ctx.fillStyle = '#FFD060';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 2.0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
}

// ── FLASH ─────────────────────────────────────────────────────
// Instantaneous bright radial burst at the moment of explosion.
// Pushed into the particles array so it rides the same update/draw loop.
class Flash {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r      = 4;
    this.maxR   = rnd(30, 60);
    this.alpha  = 1.0;
    this.active = true;
    this.children = []; // needed so particle-loop filter works
  }
  update(dt) {
    const s = dt / 1000;
    // Expand quickly then die
    this.r    += (this.maxR - this.r) * Math.min(1, s * 16);
    this.alpha -= 5.0 * s;
    if (this.alpha <= 0) { this.alpha = 0; this.active = false; }
  }
  draw(ctx) {
    if (!this.active) return;
    const a = Math.max(0, this.alpha);
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0,    `rgba(255,255,255,${a.toFixed(3)})`);
    g.addColorStop(0.25, `rgba(255,248,180,${(a * 0.80).toFixed(3)})`);
    g.addColorStop(0.60, `rgba(255,200,80,${(a * 0.35).toFixed(3)})`);
    g.addColorStop(1,    'rgba(255,150,40,0)');
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle   = g;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// ── PARTICLE ─────────────────────────────────────────────────
// Key design principles vs the old version:
// 1. NO ctx.save()/restore() inside trail loop — eliminates thousands of
//    expensive GPU state-stack operations per frame that caused jank.
// 2. NO shadowBlur on trail segments — only on the head dot. Shadow on every
//    stroke segment blurs the whole canvas and kills performance.
// 3. Proper heat-colour model: white-hot → cream-gold → base colour → orange-red.
// 4. Position trail renders as connected line segments (thin at tail, thick at head).
// 5. Crackle children for secondary micro-spark splits near end of life.
class Particle {
  constructor(x, y, cfg = {}) {
    this.x = x; this.y = y;
    const angle = cfg.angle !== undefined ? cfg.angle : rnd(0, TAU);
    const spd   = cfg.speed !== undefined ? cfg.speed : rnd(100, 360);
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.gravity = cfg.gravity !== undefined ? cfg.gravity : rnd(70, 150);
    this.drag    = cfg.drag    !== undefined ? cfg.drag    : rnd(0.62, 0.88);
    this.alpha   = 1.0;
    this.decay   = cfg.decay !== undefined ? cfg.decay : rnd(0.28, 0.58);
    this.color   = cfg.color || gold();
    this.size    = cfg.size  !== undefined ? cfg.size  : rnd(1.2, 3.2);
    this.bright  = cfg.bright || false;
    this.trail   = [{ x, y }];
    this.maxTr   = cfg.trailLen !== undefined ? cfg.trailLen : rndI(6, 12);
    this.active  = true;
    this.crackle  = cfg.crackle  || false;
    this.crackled = false;
    this.children = [];
  }

  // Heat colour model: bright white → cream gold → base → orange → red
  _heat(a) {
    if (a > 0.78) return '#FFFFFF';
    if (a > 0.58) return '#FFF4C0';
    if (a > 0.38) return this.color;
    if (a > 0.18) return '#FF9500';
    return '#FF5500';
  }

  update(dt) {
    if (!this.active && this.children.length === 0) return;
    const s = dt / 1000;
    if (this.active) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTr) this.trail.shift();
      this.x  += this.vx * s;
      this.y  += this.vy * s;
      this.vy += this.gravity * s;
      const d = Math.min(this.drag * s, 0.92);
      this.vx *= (1 - d);
      this.vy *= (1 - d * 0.5);
      this.alpha -= this.decay * s;
      // Crackle: split into micro-children near end of life
      if (this.crackle && !this.crackled && this.alpha < 0.20) {
        this.crackled = true;
        const nc = rndI(2, 5);
        for (let i = 0; i < nc; i++) {
          this.children.push({
            x: this.x, y: this.y,
            vx: this.vx * rnd(0.3, 0.7) + rnd(-55, 55),
            vy: this.vy * rnd(0.3, 0.7) + rnd(-55, 55),
            a: rnd(0.50, 0.85),
            r: this.size * rnd(0.25, 0.55),
            color: this.color,
          });
        }
      }
      if (this.alpha <= 0) { this.alpha = 0; this.active = false; }
    }
    for (const c of this.children) {
      c.x += c.vx * s; c.y += c.vy * s;
      c.vy += 100 * s;
      c.vx *= (1 - 0.78 * s);
      c.a  -= 1.6 * s;
    }
    this.children = this.children.filter(c => c.a > 0);
  }

  draw(ctx) {
    if (!this.active && this.children.length === 0) return;
    ctx.save();   // isolate ALL particle state — prevents bleed to next particle/system
    const a = Math.max(0, this.alpha);
    const n = this.trail.length;

    // ── Spark trail: connected segments, no per-segment save/restore ──
    if (n >= 2 && a > 0) {
      ctx.lineCap = 'round';
      for (let i = 1; i < n; i++) {
        const p = this.trail[i - 1], q = this.trail[i];
        const t = i / n;
        ctx.globalAlpha = a * t * t * 0.90;
        ctx.strokeStyle = this._heat(a * t);
        ctx.lineWidth   = Math.max(0.25, this.size * 0.50 * t);
        ctx.shadowBlur  = 0;    // no blur on trail — keeps lines crisp and fast
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }

    // ── Spark head ──
    if (a > 0) {
      const r = Math.max(0.3, this.size * Math.pow(a, 0.55));
      ctx.globalAlpha = a;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = r * (this.bright ? 10 : 6);
      ctx.fillStyle   = this._heat(a);
      ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, TAU); ctx.fill();
    }

    // ── Crackle micro-children ──
    ctx.shadowBlur = 4;
    for (const c of this.children) {
      if (c.a <= 0) continue;
      ctx.globalAlpha = Math.max(0, c.a);
      ctx.fillStyle   = c.color;
      ctx.shadowColor = c.color;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.fill();
    }

    ctx.restore();  // restores globalAlpha, shadowBlur, strokeStyle, lineWidth, lineCap
  }
}

// ── EXPLOSION FACTORY ─────────────────────────────────────────
// Gaussian-ish speed: peak near midpoint, no hard edges → organic burst shapes.
function gaussSpd(lo, hi) {
  return lo + (rnd(0,1) + rnd(0,1)) * 0.5 * (hi - lo);
}

// Colour palettes: gold, amber, fire, violet+gold, cool white
const BURST_PALETTES = [
  ['#FFD700','#FFAA20','#FFCC40','#FFF0AA'],   // Diwali gold
  ['#FF8C00','#FF6000','#FFB840','#FFDD80'],   // amber-orange
  ['#FFD700','#FF6600','#FFAA00','#FF9900'],   // fire orange
  ['#CC80FF','#AA50EE','#FFD700','#FFB830'],   // violet + gold
  ['#FF4400','#CC2200','#FF9966','#FFB080'],   // deep red-orange
];
function burstPalette() { return BURST_PALETTES[rndI(0, BURST_PALETTES.length - 1)]; }

function explode(x, y) {
  const out  = [];
  const roll = Math.random();
  const pal  = burstPalette();
  const pCol = () => pal[rndI(0, pal.length - 1)];
  // Scale: 18% chance of a small distant burst for perceptual depth
  const scale = Math.random() < 0.18 ? rnd(0.50, 0.72) : rnd(1.05, 1.45);

  const C = cfg => new Particle(x, y, cfg);

  // ── Always: initial bright flash ──────────────────────────
  out.push(new Flash(x, y));

  if (roll < 0.28) {
    // ── CHRYSANTHEMUM ─────────────────────────────────────────
    const n = Math.round(rndI(140, 210) * scale);
    for (let i = 0; i < n; i++) {
      out.push(C({
        angle:    rnd(0, TAU),
        speed:    gaussSpd(70, 360) * scale,
        size:     rnd(0.9, 2.2) * scale,
        decay:    rnd(0.20, 0.48),
        gravity:  rnd(50, 130),
        drag:     rnd(0.58, 0.84),
        color:    pCol(),
        trailLen: rndI(6, 12),    // SHORT — prevents screen-spanning lines
        bright:   Math.random() < 0.18,
        crackle:  Math.random() < 0.12,
      }));
    }
    for (let i = 0; i < 24; i++) {
      out.push(C({ angle: rnd(0,TAU), speed: gaussSpd(18,72)*scale,
        size:1.8*scale, decay:1.2, gravity:18, drag:0.76,
        color:'#FFF8CC', bright:true, trailLen:4 }));
    }

  } else if (roll < 0.52) {
    // ── WILLOW ───────────────────────────────────────────────
    const n = Math.round(rndI(130, 185) * scale);
    for (let i = 0; i < n; i++) {
      const upward = Math.random() < 0.65;
      const angle  = upward
        ? rnd(-Math.PI * 0.96, -Math.PI * 0.04)
        : rnd(-Math.PI * 0.04,  Math.PI * 1.04);
      out.push(C({
        angle,
        speed:    gaussSpd(100, 320) * scale,
        size:     rnd(0.8, 2.0) * scale,
        decay:    rnd(0.15, 0.36),
        gravity:  rnd(120, 200),
        drag:     rnd(0.32, 0.60),
        color:    pCol(),
        trailLen: rndI(10, 18),   // moderate — enough for willow droop, not screen-spanning
        bright:   Math.random() < 0.14,
        crackle:  Math.random() < 0.22,
      }));
    }
    for (let i = 0; i < 16; i++) {
      out.push(C({ angle:rnd(0,TAU), speed:gaussSpd(14,52)*scale,
        size:1.4*scale, decay:1.4, gravity:6, drag:0.84,
        color:'#FFFBE0', bright:true, trailLen:4 }));
    }

  } else if (roll < 0.72) {
    // ── PEONY ────────────────────────────────────────────────
    const n     = Math.round(rndI(90, 145) * scale);
    const base  = gaussSpd(155, 275) * scale;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * TAU + rnd(-0.20, 0.20);
      out.push(C({
        angle, speed: base * rnd(0.80, 1.20),
        size:     rnd(1.2, 3.2) * scale,
        decay:    rnd(0.22, 0.46),
        gravity:  rnd(40, 100),
        drag:     rnd(0.66, 0.88),
        color:    pCol(),
        trailLen: rndI(6, 12),
        bright:   Math.random() < 0.35,
        crackle:  Math.random() < 0.10,
      }));
    }
    for (let i = 0; i < 22; i++) {
      out.push(C({ angle:rnd(0,TAU), speed:gaussSpd(18,78)*scale,
        size:1.2*scale, decay:0.92, gravity:12, drag:0.80,
        color:'#FFFFFF', bright:true, trailLen:4 }));
    }

  } else if (roll < 0.87) {
    // ── CRACKLING RING ────────────────────────────────────────
    const nOut = Math.round(rndI(80, 120) * scale);
    for (let i = 0; i < nOut; i++) {
      const angle = (i / nOut) * TAU + rnd(-0.28, 0.28);
      out.push(C({
        angle, speed: gaussSpd(155, 360) * scale,
        size:     rnd(1.0, 2.8) * scale,
        decay:    rnd(0.26, 0.54),
        gravity:  rnd(58, 125),
        drag:     rnd(0.60, 0.84),
        color:    pCol(),
        trailLen: rndI(6, 12),
        crackle:  Math.random() < 0.42,
      }));
    }
    const nIn = Math.round(rndI(40, 65) * scale);
    for (let i = 0; i < nIn; i++) {
      out.push(C({
        angle:rnd(0,TAU), speed:gaussSpd(28,105)*scale,
        size:rnd(0.8,2.2)*scale, decay:rnd(0.18,0.40),
        gravity:rnd(22,68), drag:rnd(0.46,0.72),
        color:pal[0], trailLen:rndI(5, 9), bright:true,
      }));
    }
    for (let i = 0; i < 18; i++) {
      out.push(C({ angle:rnd(0,TAU), speed:gaussSpd(8,40)*scale,
        size:1.4*scale, decay:1.05, gravity:4, drag:0.90,
        color:'#FFFFFF', bright:true, trailLen:3 }));
    }

  } else {
    // ── SMALL DISTANT BURST ───────────────────────────────────
    const n = Math.round(rndI(48, 75) * 0.52);
    for (let i = 0; i < n; i++) {
      out.push(C({
        angle:rnd(0,TAU), speed:gaussSpd(65,205)*0.52,
        size:rnd(0.7,1.8)*0.7, decay:rnd(0.34,0.68),
        gravity:rnd(38,90), drag:rnd(0.65,0.90),
        color:pCol(), trailLen:rndI(4, 8),
      }));
    }
    for (let i = 0; i < 8; i++) {
      out.push(C({ angle:rnd(0,TAU), speed:gaussSpd(8,32)*0.52,
        size:0.9, decay:1.3, gravity:4, drag:0.87,
        color:'#FFFFFF', bright:true, trailLen:2 }));
    }
  }

  return out;
}

// ── AMBIENT SPARK ────────────────────────────────────────────
class Spark {
  constructor(w, h) {
    this.x  = rnd(0, w);
    this.y  = rnd(h * 0.15, h * 0.88);
    this.vx = rnd(-25, 25);
    this.vy = rnd(-50, -6);
    this.alpha = rnd(0.35, 0.80);
    this.decay = rnd(0.08, 0.25);
    this.r     = rnd(0.7, 1.8);
    this.color = gold();
    this.active = true;
  }
  update(dt) {
    const s = dt / 1000;
    this.x += this.vx * s; this.y += this.vy * s;
    this.vy += 40 * s;
    this.alpha -= this.decay * s;
    if (this.alpha <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// ── REACT COMPONENT ──────────────────────────────────────────
export default function DiwaliCanvas() {
  const canvasRef = useRef(null);
  const S = useRef({
    stars:[], rockets:[], particles:[], sparks:[],
    lastTime:0,
    rocketTimer:0, rocketInterval:400,   // start firing quickly
    sparkTimer:0,  sparkInterval:120,
    w:0, h:0,
    frameId:null,
  });

  const initStars = useCallback((w, h) => {
    // 180–280 stars: enough to fill the sky without crowding
    const n = Math.min(280, Math.max(180, Math.floor((w * h) / 5500)));
    S.current.stars = Array.from({ length: n }, () => new Star(w, h));
  }, []);

  const handleResize = useCallback(() => {
    const cvs = canvasRef.current; if(!cvs) return;
    const dpr = window.devicePixelRatio||1;
    const w=window.innerWidth, h=window.innerHeight;
    cvs.width  = Math.round(w*dpr);
    cvs.height = Math.round(h*dpr);
    cvs.style.width  = w+'px';
    cvs.style.height = h+'px';
    const ctx = cvs.getContext('2d');
    ctx.scale(dpr,dpr);
    S.current.w=w; S.current.h=h;
    initStars(w,h);
  },[initStars]);

  useEffect(()=>{
    const cvs = canvasRef.current; if(!cvs) return;
    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = ts => {
      const s = S.current;
      if(!s.lastTime) s.lastTime=ts;
      const dt = Math.min(ts-s.lastTime, 50);
      s.lastTime = ts;

      const cv = canvasRef.current; if(!cv) return;
      const ctx = cv.getContext('2d');
      const {w,h} = s;

      ctx.clearRect(0,0,w,h);

      // Stars
      for(const star of s.stars){ star.update(dt); star.draw(ctx); }

      // Rocket spawning — "PAT PAT PAT" rapid Diwali rhythm
      s.rocketTimer += dt;
      if(s.rocketTimer >= s.rocketInterval) {
        s.rocketTimer = 0;
        // Base interval: 300–800 ms for a lively continuous display
        s.rocketInterval = rnd(300, 800);
        s.rockets.push(new Rocket(w,h));
        // 40% chance: second rocket launches immediately (PAT-PAT)
        if(Math.random() < 0.40) s.rockets.push(new Rocket(w,h));
        // 18% chance: third for a PAT-PAT-PAT triple salvo
        if(Math.random() < 0.18) s.rockets.push(new Rocket(w,h));
      }

      // Rockets
      const boom = [];
      const nextR = [];
      for(const r of s.rockets) {
        r.update(dt); r.draw(ctx);
        if(r.shouldExplode){
          boom.push({x:r.x, y:r.y});
          r.shouldExplode = false;
          // Don't keep rocket — it's done. Trail sparks are in r.sparks
          // and already drawn this frame; they fade naturally next frames.
        } else if(r.alive || r.trail.length>0 || r.sparks.length>0) {
          nextR.push(r);
        }
      }
      s.rockets = nextR;
      for(const b of boom){
        const pts=explode(b.x,b.y);
        for(const p of pts) s.particles.push(p);

      }

      // Particles — keep alive if main body OR crackle children still visible
      const nextP = [];
      for(const p of s.particles){
        p.update(dt); p.draw(ctx);
        if(p.active || p.children.length > 0) nextP.push(p);
      }
      s.particles = nextP;

      // Ambient sparks
      s.sparkTimer += dt;
      if(s.sparkTimer >= s.sparkInterval) {
        s.sparkTimer=0;
        if(s.sparks.length<60) s.sparks.push(new Spark(w,h));
      }
      const nextSp=[];
      for(const sp of s.sparks){ sp.update(dt); sp.draw(ctx); if(sp.active) nextSp.push(sp); }
      s.sparks = nextSp;

      s.frameId = requestAnimationFrame(animate);
    };

    const onVis = () => {
      const s=S.current;
      if(document.hidden){ if(s.frameId){cancelAnimationFrame(s.frameId);s.frameId=null;} }
      else { s.lastTime=0; s.frameId=requestAnimationFrame(animate); }
    };
    document.addEventListener('visibilitychange',onVis);
    S.current.frameId = requestAnimationFrame(animate);

    return ()=>{
      window.removeEventListener('resize',handleResize);
      document.removeEventListener('visibilitychange',onVis);
      if(S.current.frameId) cancelAnimationFrame(S.current.frameId);
    };
  },[handleResize]);

  // ── Click-to-burst (window-level, skips interactive elements) ──
  // The canvas itself has pointer-events: none (CSS) so it never
  // intercepts clicks intended for the name input, buttons, or
  // any other interactive UI element.  Instead we listen on the
  // window and bail out when the click originated inside a focusable
  // or form element so those still work normally.
  const handleCanvasClick = useCallback(e => {
    // Skip if the user clicked on / inside an interactive element
    const tag = e.target?.tagName?.toUpperCase?.() ?? '';
    if (['INPUT','BUTTON','TEXTAREA','SELECT','A','LABEL'].includes(tag)) return;
    if (e.target?.closest?.('input, button, textarea, select, a, label, [role="button"]')) return;

    const s = S.current;
    if (s.particles.length > 400) return;
    const cv = canvasRef.current; if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pts = explode(x, y);
    for (const p of pts) s.particles.push(p);
  }, []);

  // ── Touch-to-burst (window-level, skips interactive elements) ──
  const handleCanvasTouch = useCallback(e => {
    const tag = e.target?.tagName?.toUpperCase?.() ?? '';
    if (['INPUT','BUTTON','TEXTAREA','SELECT','A','LABEL'].includes(tag)) return;
    if (e.target?.closest?.('input, button, textarea, select, a, label, [role="button"]')) return;

    const s = S.current;
    if (s.particles.length > 400) return;
    const cv = canvasRef.current; if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const pts = explode(x, y);
    for (const p of pts) s.particles.push(p);
  }, []);

  // Attach burst listeners to window so pointer-events:none on canvas
  // doesn't block them, while interactive elements still work normally.
  useEffect(() => {
    window.addEventListener('click',    handleCanvasClick,   { passive: true });
    window.addEventListener('touchend', handleCanvasTouch,   { passive: true });
    return () => {
      window.removeEventListener('click',    handleCanvasClick);
      window.removeEventListener('touchend', handleCanvasTouch);
    };
  }, [handleCanvasClick, handleCanvasTouch]);

  return (
    <canvas
      ref={canvasRef}
      className="fireworks-canvas"
      aria-hidden="true"
      // pointer-events: none kept via CSS (.fireworks-canvas) so the
      // canvas never intercepts clicks meant for the input / buttons.
    />
  );
}
