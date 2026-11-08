import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// FESTIVE LED SERIES BORDER
//
// Draws individual LED bulbs evenly spaced along all four edges,
// connected by a thin golden wire — matching traditional Diwali /
// Ganpati serial-light decorations.
//
// Animation layers:
//   1. Thin golden wire along the full perimeter
//   2. Individual bulbs (small filled circles with glow)
//   3. Sequential chasing: a brightness wave sweeps around the
//      perimeter, lighting bulbs one after another
//   4. Each bulb has its own gentle random flicker offset
//   5. Corner decorative dot (slightly larger bright bulb)
//   6. Firework-reactive: nearest bulbs brighten on explosion
//
// Canvas: position fixed, full viewport, z-index 20,
// mixBlendMode screen, pointerEvents none.
// ═══════════════════════════════════════════════════════════════

// ── Colour palette ───────────────────────────────────────────────
const WIRE_COLOR    = 'rgba(180, 130, 20, 0.55)';  // thin dark-gold wire
const BULB_OFF      = [160, 90, 10];               // dim amber when "off"
const BULB_MID      = [255, 190, 40];              // warm amber
const BULB_ON       = [255, 245, 180];             // bright warm-white core
const GLOW_COLOR    = [255, 200, 60];              // champagne gold glow

function rgba([r, g, b], a) {
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, +a)).toFixed(3)})`;
}
function lerpRGB(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// ── Build bulb positions along the perimeter ─────────────────────
// Returns array of {x, y, t} where t ∈ [0,1) is perimeter fraction.
function buildBulbs(w, h, spacing) {
  const inset = 6; // px from viewport edge
  const x0 = inset, y0 = inset;
  const x1 = w - inset, y1 = h - inset;
  const fw = x1 - x0, fh = y1 - y0;
  const perim = 2 * (fw + fh);

  // Distribute bulbs evenly; start at top-left corner
  const count = Math.max(8, Math.round(perim / spacing));
  const bulbs = [];

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const d = t * perim;
    let x, y;
    if      (d < fw)            { x = x0 + d;          y = y0; }
    else if (d < fw + fh)       { x = x1;              y = y0 + d - fw; }
    else if (d < 2 * fw + fh)   { x = x1 - (d - fw - fh); y = y1; }
    else                        { x = x0;              y = y1 - (d - 2 * fw - fh); }
    bulbs.push({ x, y, t });
  }
  return bulbs;
}

// ── Draw the wire ─────────────────────────────────────────────────
function drawWire(ctx, w, h, inset = 6) {
  const x0 = inset, y0 = inset;
  ctx.save();
  ctx.strokeStyle = WIRE_COLOR;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.rect(x0, y0, w - inset * 2, h - inset * 2);
  ctx.stroke();
  ctx.restore();
}

// ── Draw one bulb ─────────────────────────────────────────────────
// brightness: 0 = dim off, 1 = fully lit
function drawBulb(ctx, x, y, radius, brightness, isCorner) {
  const r  = isCorner ? radius * 1.5 : radius;
  const br = Math.max(0, Math.min(1, brightness));

  // Colour blend: off → mid → on
  const col = br < 0.5
    ? lerpRGB(BULB_OFF, BULB_MID, br * 2)
    : lerpRGB(BULB_MID, BULB_ON,  (br - 0.5) * 2);

  // Outer glow (only when reasonably bright)
  if (br > 0.15) {
    const glowR = r * (3 + br * 5);
    const grad  = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    const glowA = br * (isCorner ? 0.60 : 0.45);
    grad.addColorStop(0,    rgba(GLOW_COLOR, glowA));
    grad.addColorStop(0.4,  rgba(GLOW_COLOR, glowA * 0.5));
    grad.addColorStop(1,    rgba(GLOW_COLOR, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Bulb body
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(col, 0.30 + br * 0.70);
  ctx.shadowColor = rgba(GLOW_COLOR, br * 0.8);
  ctx.shadowBlur  = r * (2 + br * 4);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Bright core highlight when lit
  if (br > 0.5) {
    ctx.fillStyle = rgba(BULB_ON, (br - 0.5) * 2 * 0.9);
    ctx.shadowBlur = r;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Component ────────────────────────────────────────────────────
export default function LEDBorder() {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    bulbs:       [],
    flickerOff:  [],  // per-bulb random phase offset [0, 2π)
    chaseT:      0,   // chase wave position [0, 1)
    chaseSpeed:  1 / (60 * 3.5),   // one full lap per 3.5 s
    fwBoost:     [],  // per-bulb firework brightness boost [0..1]
    w: 0, h: 0, dpr: 1,
    frameId: null,
    tick: 0,
  });

  // Spacing between bulbs (px). Recalculated on resize.
  const SPACING = 28;
  const BULB_R  = 3.5; // base radius px (at dpr=1)
  const INSET   = 6;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const S = stateRef.current;

    function buildState(w, h) {
      S.bulbs      = buildBulbs(w, h, SPACING);
      S.flickerOff = S.bulbs.map(() => Math.random() * Math.PI * 2);
      S.fwBoost    = new Float32Array(S.bulbs.length);
    }

    function resize() {
      S.dpr = window.devicePixelRatio || 1;
      S.w   = window.innerWidth;
      S.h   = window.innerHeight;
      canvas.width        = Math.round(S.w * S.dpr);
      canvas.height       = Math.round(S.h * S.dpr);
      canvas.style.width  = S.w + 'px';
      canvas.style.height = S.h + 'px';
      canvas.getContext('2d').setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      buildState(S.w, S.h);
    }
    resize();
    window.addEventListener('resize', resize);

    // Firework boost — brighten bulbs near the burst
    function onBurst(e) {
      const { nx = 0.5, ny = 0.5 } = e.detail || {};
      const bx = nx * S.w, by = ny * S.h;
      const radPx = Math.min(S.w, S.h) * 0.35;
      for (let i = 0; i < S.bulbs.length; i++) {
        const { x, y } = S.bulbs[i];
        const dist = Math.hypot(x - bx, y - by);
        const add  = Math.max(0, 1 - dist / radPx) * 0.9;
        S.fwBoost[i] = Math.min(1, S.fwBoost[i] + add);
      }
    }
    window.addEventListener('firework-burst', onBurst);

    function loop() {
      const { w, h, bulbs, flickerOff, fwBoost } = S;
      if (!w || !h || !bulbs.length) {
        S.frameId = requestAnimationFrame(loop);
        return;
      }

      S.tick++;
      S.chaseT = (S.chaseT + S.chaseSpeed) % 1;

      // Decay fw boosts (~1s)
      for (let i = 0; i < fwBoost.length; i++) {
        fwBoost[i] = Math.max(0, fwBoost[i] - 0.016);
      }

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      // ── Wire ─────────────────────────────────────────────────
      drawWire(ctx, w, h, INSET);

      // ── Bulbs ────────────────────────────────────────────────
      const n = bulbs.length;
      // Chase wave: a cosine envelope centred at chaseT,
      // wrapping around the perimeter. Width ~20% of perimeter.
      const WAVE_WIDTH = 0.18;
      // Also: slow ambient breathing so "off" bulbs aren't black
      const breathBase = 0.22 + 0.08 * Math.sin(S.tick * 0.012);

      // Corner indices: bulbs nearest the four corners
      const inset = INSET;
      const corners = [
        { x: inset,     y: inset },
        { x: w - inset, y: inset },
        { x: w - inset, y: h - inset },
        { x: inset,     y: h - inset },
      ];
      const cornerSet = new Set();
      for (const c of corners) {
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.hypot(bulbs[i].x - c.x, bulbs[i].y - c.y);
          if (d < bestDist) { bestDist = d; best = i; }
        }
        cornerSet.add(best);
      }

      for (let i = 0; i < n; i++) {
        const { x, y, t } = bulbs[i];
        const isCorner = cornerSet.has(i);

        // Chase brightness: wrapping cosine distance from wave centre
        let dt = Math.abs(t - S.chaseT);
        if (dt > 0.5) dt = 1 - dt;
        const chaseB = dt < WAVE_WIDTH
          ? 0.5 + 0.5 * Math.cos((dt / WAVE_WIDTH) * Math.PI)
          : 0;

        // Individual flicker: slow sine + small fast sine
        const flick =
          0.5 + 0.3 * Math.sin(S.tick * 0.045 + flickerOff[i]) +
          0.12 * Math.sin(S.tick * 0.18  + flickerOff[i] * 1.7);

        // Combine: ambient base + chase contribution + individual flicker
        const brightness = Math.min(1,
          breathBase +
          chaseB   * (isCorner ? 0.88 : 0.70) +
          flick    * 0.18 +
          fwBoost[i] * 0.55
        );

        drawBulb(ctx, x, y, BULB_R, brightness, isCorner);
      }

      S.frameId = requestAnimationFrame(loop);
    }

    S.frameId = requestAnimationFrame(loop);

    function onVis() {
      if (document.hidden) {
        if (S.frameId) { cancelAnimationFrame(S.frameId); S.frameId = null; }
      } else {
        if (!S.frameId) S.frameId = requestAnimationFrame(loop);
      }
    }
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('firework-burst', onBurst);
      document.removeEventListener('visibilitychange', onVis);
      if (S.frameId) cancelAnimationFrame(S.frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        20,
        mixBlendMode:  'screen',
      }}
    />
  );
}
