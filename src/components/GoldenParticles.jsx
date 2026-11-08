import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// GOLDEN PARTICLES — subtle floating ambient layer
//
// A single <canvas> fixed behind everything (z-index: 3).
// Particles rise slowly from the lower portion of the screen,
// drift gently, and fade out. Completely independent RAF loop.
// No React state mutations — all data lives in refs.
// ═══════════════════════════════════════════════════════════════

const COLORS = [
  '#FFE566', // pale gold
  '#FFD700', // gold
  '#FFCC44', // warm gold
  '#FFAA20', // amber
  '#FFF0AA', // champagne
  '#FFB830', // deep amber
];

function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

class GoldParticle {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.reset(true);
  }

  reset(init = false) {
    // Spawn in the lower 65% of the screen
    this.x = rnd(0, this.w);
    this.y = init
      ? rnd(this.h * 0.35, this.h)        // spread on first load
      : rnd(this.h * 0.70, this.h + 10);  // respawn near bottom

    // Very slow upward drift
    this.vy = -rnd(0.18, 0.55);
    // Gentle horizontal sway
    this.vx      = rnd(-0.12, 0.12);
    this.swayAmp = rnd(0.08, 0.30);
    this.swaySpd = rnd(0.008, 0.022);
    this.swayOff = rnd(0, Math.PI * 2);

    // Visual
    this.r       = rnd(0.7, 2.4);
    this.color   = pick(COLORS);
    this.peakA   = rnd(0.25, 0.75);
    this.alpha   = 0;              // start invisible, fade in
    this.fadingIn  = true;
    this.fadingOut = false;
    this.fadeSpeed = rnd(0.004, 0.012);

    // How far up from spawn before it starts fading out
    this.lifeH   = rnd(this.h * 0.25, this.h * 0.55);
    this.birthY  = this.y;
    this.age     = 0;
    this.active  = true;
  }

  update(t) {
    this.age++;
    // Sway
    this.x += this.vx + Math.sin(t * this.swaySpd + this.swayOff) * this.swayAmp;
    this.y += this.vy;

    // Fade in
    if (this.fadingIn) {
      this.alpha += this.fadeSpeed;
      if (this.alpha >= this.peakA) {
        this.alpha    = this.peakA;
        this.fadingIn = false;
      }
    }

    // Start fading out once it has risen lifeH pixels
    const risen = this.birthY - this.y;
    if (!this.fadingIn && !this.fadingOut && risen >= this.lifeH) {
      this.fadingOut = true;
    }
    if (this.fadingOut) {
      this.alpha -= this.fadeSpeed * 0.8;
      if (this.alpha <= 0) { this.active = false; }
    }

    // Kill if it drifts offscreen sideways
    if (this.x < -10 || this.x > this.w + 10) this.active = false;
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    // Soft glow for slightly brighter particles
    if (this.r > 1.6) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = this.r * 3.5;
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
export default function GoldenParticles() {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    particles: [],
    w: 0, h: 0,
    frameId: null,
    t: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const S = stateRef.current;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      S.w = window.innerWidth;
      S.h = window.innerHeight;
      canvas.width  = Math.round(S.w * dpr);
      canvas.height = Math.round(S.h * dpr);
      canvas.style.width  = S.w + 'px';
      canvas.style.height = S.h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      // Rebuild particles on resize
      const target = particleTarget(S.w, S.h);
      S.particles = Array.from({ length: target }, () => new GoldParticle(S.w, S.h));
    }

    function particleTarget(w, h) {
      // ~40-80 particles depending on screen area; cap for performance
      return Math.min(80, Math.max(40, Math.floor((w * h) / 22000)));
    }

    resize();
    window.addEventListener('resize', resize);

    function loop() {
      if (!canvasRef.current) return;
      const ctx = canvas.getContext('2d');
      S.t++;

      ctx.clearRect(0, 0, S.w, S.h);

      // Replace dead particles
      const target = particleTarget(S.w, S.h);
      for (const p of S.particles) {
        if (!p.active) { p.w = S.w; p.h = S.h; p.reset(); }
        p.update(S.t);
        p.draw(ctx);
      }
      // If we somehow have fewer, top up
      while (S.particles.length < target) {
        S.particles.push(new GoldParticle(S.w, S.h));
      }

      S.frameId = requestAnimationFrame(loop);
    }

    // Stagger initial spawn so particles don't all appear at once
    const startId = setTimeout(() => {
      S.frameId = requestAnimationFrame(loop);
    }, 400);

    const onVis = () => {
      if (document.hidden) {
        if (S.frameId) { cancelAnimationFrame(S.frameId); S.frameId = null; }
      } else {
        if (!S.frameId) S.frameId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearTimeout(startId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      if (S.frameId) cancelAnimationFrame(S.frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,   // above fireworks canvas (z:2), below kandils (z:5)
      }}
    />
  );
}
