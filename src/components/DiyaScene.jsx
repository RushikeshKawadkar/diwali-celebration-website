import React, { useState, useRef, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// DIYA SCENE — Five photorealistic clay oil lamps arranged in a
// layered depth composition below the main Diwali website scene.
//
// Layout (front → back):
//   Center (scale 1.0)  — front, lowest in scene
//   Mid-L / Mid-R (0.80) — slightly behind and higher
//   Far-L / Far-R (0.62) — furthest back, highest
//
// Each diya is a detailed SVG with:
//   • Dark terracotta bowl + gold ornamental patterns
//   • Warm interior oil glow through the rim opening
//   • Multi-layer flame (outer orange → amber → bright yellow-white → white core)
//   • Realistic contact shadow + warm ground pool
//   • Independent CSS flicker animation
//   • Click → flame brightens + tiny rising sparks
// ═══════════════════════════════════════════════════════════════

// ── Flicker animation keyframes (injected once) ─────────────────
const FLICKER_STYLE = `
@keyframes ds5flicker {
  0%   { transform: skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity: 1.00; }
  7%   { transform: skewX(1.8deg)  scaleX(0.93) scaleY(1.05); opacity: 0.95; }
  15%  { transform: skewX(-1.2deg) scaleX(1.03) scaleY(0.97); opacity: 0.99; }
  24%  { transform: skewX(2.4deg)  scaleX(0.89) scaleY(1.08); opacity: 0.92; }
  33%  { transform: skewX(-1.6deg) scaleX(1.04) scaleY(0.95); opacity: 0.97; }
  44%  { transform: skewX(1.0deg)  scaleX(0.95) scaleY(1.04); opacity: 0.96; }
  55%  { transform: skewX(-2.0deg) scaleX(1.02) scaleY(1.02); opacity: 0.94; }
  66%  { transform: skewX(0.6deg)  scaleX(0.92) scaleY(1.06); opacity: 0.93; }
  77%  { transform: skewX(-1.0deg) scaleX(1.03) scaleY(0.96); opacity: 0.98; }
  88%  { transform: skewX(1.4deg)  scaleX(0.94) scaleY(1.04); opacity: 0.96; }
  100% { transform: skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity: 1.00; }
}
`;

// ── Rising spark particle ────────────────────────────────────────
class RisingSpark {
  constructor(cx, cy) {
    this.x     = cx + (Math.random() - 0.5) * 14;
    this.y     = cy;
    this.vx    = (Math.random() - 0.5) * 1.4;
    this.vy    = -(Math.random() * 2.8 + 1.0);
    this.alpha = 0.8 + Math.random() * 0.2;
    this.decay = 0.007 + Math.random() * 0.013;
    this.r     = 0.8 + Math.random() * 1.8;
    this.color = Math.random() < 0.55 ? '#FFD060' : '#FF9920';
    this.active = true;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy *= 0.981;
    this.vx *= 0.988;
    this.alpha -= this.decay;
    if (this.alpha <= 0) { this.active = false; this.alpha = 0; }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Spark overlay canvas ─────────────────────────────────────────
// Fixed-position canvas so sparks always render in screen coordinates.
function SparkCanvas({ emitRef }) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const frameRef  = useRef(null);

  useEffect(() => {
    emitRef.current = (screenX, screenY) => {
      const n = 10 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        sparksRef.current.push(new RisingSpark(screenX, screenY));
      }
    };
  }, [emitRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width        = Math.round(window.innerWidth  * dpr);
      canvas.height       = Math.round(window.innerHeight * dpr);
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    function loop() {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparksRef.current.forEach(s => { s.update(); s.draw(ctx); });
      sparksRef.current = sparksRef.current.filter(s => s.active);
      frameRef.current  = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 45 }} />
  );
}

// ── Single photorealistic diya SVG ──────────────────────────────
// ViewBox: -74 -125 148 170
// Bowl centre at (0,0). Bowl bottom at y≈+28. Flame tip at y≈-115.
function DiyaSVG({ uid, lit, flickerDelay = '0s', onFlamePosRef }) {
  const p   = `d${uid}`;  // short unique prefix for all gradient / filter IDs
  const bw  = 65;          // bowl half-width
  const bh  = 27;          // bowl depth

  // Glow intensities based on lit state
  const intA = lit ? 0.92 : 0.68;   // interior glow alpha
  const outA = lit ? 0.60 : 0.38;   // outer flame glow alpha
  const rimA = lit ? 0.85 : 0.58;   // rim warm light alpha
  const grA  = lit ? 0.42 : 0.24;   // ground pool alpha

  return (
    <svg viewBox="-74 -125 148 170" xmlns="http://www.w3.org/2000/svg"
         ref={onFlamePosRef}
         style={{ overflow: 'visible', width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {/* ── Clay body: dark terracotta with side highlight ── */}
        <radialGradient id={`${p}c`} cx="28%" cy="22%" r="78%">
          <stop offset="0%"   stopColor="#8A3A12" />
          <stop offset="25%"  stopColor="#5A2008" />
          <stop offset="60%"  stopColor="#301005" />
          <stop offset="100%" stopColor="#180600" />
        </radialGradient>

        {/* ── Interior warm glow ── */}
        <radialGradient id={`${p}i`} cx="50%" cy="95%" r="75%">
          <stop offset="0%"   stopColor="#FF9C22" stopOpacity={intA.toFixed(2)} />
          <stop offset="40%"  stopColor="#C05812" stopOpacity={(intA*0.55).toFixed(2)} />
          <stop offset="100%" stopColor="#400800" stopOpacity="0" />
        </radialGradient>

        {/* ── Gold gradient (decorations, rim) ── */}
        <linearGradient id={`${p}g`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%"   stopColor="#F5D040" />
          <stop offset="50%"  stopColor="#C89020" />
          <stop offset="100%" stopColor="#906010" />
        </linearGradient>

        {/* ── Outer flame (orange → transparent) ── */}
        <linearGradient id={`${p}fo`} x1="0%" y1="100%" x2="0%" y2="0%"
                         gradientUnits="userSpaceOnUse" y1="0" y2="-75">
          <stop offset="0%"   stopColor="#FF3800" stopOpacity="0.96" />
          <stop offset="30%"  stopColor="#FF7200" stopOpacity="0.88" />
          <stop offset="65%"  stopColor="#FFBA18" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#FFEE60" stopOpacity="0.00" />
        </linearGradient>

        {/* ── Mid flame (bright amber → pale yellow) ── */}
        <linearGradient id={`${p}fm`} x1="0%" y1="100%" x2="0%" y2="0%"
                         gradientUnits="userSpaceOnUse" y1="0" y2="-68">
          <stop offset="0%"   stopColor="#FF9800" stopOpacity="1.00" />
          <stop offset="45%"  stopColor="#FFE020" stopOpacity="0.95" />
          <stop offset="85%"  stopColor="#FFFACC" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.00" />
        </linearGradient>

        {/* ── Blur filters ── */}
        <filter id={`${p}bl`} x="-200%" y="-120%" width="500%" height="400%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={`${p}bm`} x="-120%" y="-80%" width="340%" height="320%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${p}bs`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* ── CONTACT SHADOW ── */}
      <ellipse cx="3" cy={bh+10} rx={bw*1.05} ry="7"
        fill="rgba(0,0,0,0.60)" filter={`url(#${p}bl)`} />

      {/* ── GROUND WARM LIGHT POOL ── */}
      <ellipse cx="1" cy={bh+6} rx={bw*1.55} ry="18"
        fill={`rgba(255,128,16,${grA.toFixed(2)})`}
        filter={`url(#${p}bl)`}
        style={{ transition: 'fill 0.4s ease' }} />

      {/* ── BOWL DROP SHADOW ── */}
      <path d={`M ${-bw+2} 2 C ${-bw+2} ${bh*0.58} ${-bw*0.52} ${bh*1.08} 0 ${bh+2} C ${bw*0.52} ${bh*1.08} ${bw-2} ${bh*0.58} ${bw-2} 2 Z`}
        fill="rgba(0,0,0,0.58)" transform="translate(5,6)"
        filter={`url(#${p}bs)`} />

      {/* ── MAIN BOWL BODY ── */}
      <path d={`M ${-bw} 0 C ${-bw} ${bh*0.56} ${-bw*0.52} ${bh} 0 ${bh} C ${bw*0.52} ${bh} ${bw} ${bh*0.56} ${bw} 0 Z`}
        fill={`url(#${p}c)`} />

      {/* ── LEFT SIDE CLAY HIGHLIGHT (catches ambient light) ── */}
      <path d={`M ${-bw} 0 C ${-bw} ${bh*0.28} ${-bw*0.88} ${bh*0.56} ${-bw*0.72} ${bh*0.76}`}
        fill="none" stroke="rgba(180,80,24,0.28)" strokeWidth="16"
        strokeLinecap="round" filter={`url(#${p}bs)`} />

      {/* ── DECORATIVE GOLD BAND (horizontal around bowl middle) ── */}
      <path d={`
        M ${-bw+5} ${bh*0.26}
        C ${-bw+3} ${bh*0.44} ${-bw*0.48} ${bh*0.74} 0 ${bh*0.75}
        C ${bw*0.48} ${bh*0.74} ${bw-3} ${bh*0.44} ${bw-5} ${bh*0.26}
        C ${bw-5} ${bh*0.12} ${bw*0.48} ${bh*0.36} 0 ${bh*0.37}
        C ${-bw*0.48} ${bh*0.36} ${-bw+5} ${bh*0.12} ${-bw+5} ${bh*0.26} Z`}
        fill={`url(#${p}g)`} fillOpacity="0.48" />

      {/* ── LOTUS PETAL MOTIF on bowl face ── */}
      <g transform={`translate(0, ${bh*0.52})`}>
        <ellipse cx="0"   cy="0" rx="5.5" ry="9.5" fill={`url(#${p}g)`} fillOpacity="0.62" />
        <ellipse cx="-12" cy="2" rx="4.0" ry="7.0" fill={`url(#${p}g)`} fillOpacity="0.46"
          transform="rotate(-28,-12,2)" />
        <ellipse cx="12"  cy="2" rx="4.0" ry="7.0" fill={`url(#${p}g)`} fillOpacity="0.46"
          transform="rotate(28,12,2)" />
        <ellipse cx="-22" cy="5" rx="3.0" ry="5.5" fill={`url(#${p}g)`} fillOpacity="0.30"
          transform="rotate(-46,-22,5)" />
        <ellipse cx="22"  cy="5" rx="3.0" ry="5.5" fill={`url(#${p}g)`} fillOpacity="0.30"
          transform="rotate(46,22,5)" />
      </g>

      {/* ── GOLD DECORATIVE DOTS along middle band ── */}
      {[-46, -32, -18, -4, 10, 24, 38, 50].map((dx, i) => (
        <circle key={i} cx={dx} cy={bh*0.50} r="1.6"
          fill={`url(#${p}g)`} fillOpacity="0.68" />
      ))}

      {/* ── THIN GOLD PINSTRIPE near top ── */}
      <path d={`M ${-bw+8} ${bh*0.08} C ${-bw+6} ${bh*0.18} ${-bw*0.45} ${bh*0.30} 0 ${bh*0.31} C ${bw*0.45} ${bh*0.30} ${bw-6} ${bh*0.18} ${bw-8} ${bh*0.08}`}
        fill="none" stroke={`url(#${p}g)`} strokeWidth="1.2" strokeOpacity="0.55" />

      {/* ── RIM OPENING ── */}
      {/* Dark inner depth */}
      <ellipse cx="0" cy="0" rx={bw} ry={bh*0.31}
        fill="rgba(8,2,0,0.72)" />
      {/* Interior warm oil glow */}
      <ellipse cx="0" cy="0" rx={bw*0.89} ry={bh*0.27}
        fill={`url(#${p}i)`} style={{ transition: 'fill 0.4s ease' }} />
      {/* Outer gold rim stroke */}
      <ellipse cx="0" cy="0" rx={bw} ry={bh*0.31}
        fill="none" stroke="#C08822" strokeWidth="2.8" strokeOpacity="0.78" />
      {/* Inner warm rim glow */}
      <ellipse cx="0" cy="-1" rx={bw*0.87} ry={bh*0.26}
        fill="none" stroke={`rgba(255,155,42,${rimA.toFixed(2)})`} strokeWidth="2.2"
        style={{ transition: 'stroke 0.4s ease' }} />
      {/* Oil surface shimmer */}
      <ellipse cx="-10" cy="-1" rx={bw*0.32} ry={bh*0.08}
        fill="rgba(255,205,85,0.22)" />

      {/* ── SPOUT ── */}
      <path d={`M ${bw*0.50} -5 Q ${bw*0.96} -5 ${bw*0.89} 5 Q ${bw*0.78} 13 ${bw*0.58} 9`}
        fill={`url(#${p}c)`} stroke="#C08822" strokeWidth="0.9" />

      {/* ── WICK ── */}
      <path d={`M ${bw*0.70} -1 C ${bw*0.73} -7 ${bw*0.71} -15 ${bw*0.68} -24`}
        fill="none" stroke="#2C1002" strokeWidth="2.8" strokeLinecap="round" />
      {/* Wick heat glow */}
      <path d={`M ${bw*0.70} -1 C ${bw*0.73} -7 ${bw*0.71} -15 ${bw*0.68} -24`}
        fill="none" stroke="rgba(255,130,28,0.42)" strokeWidth="5.5"
        strokeLinecap="round" filter={`url(#${p}bs)`} />

      {/* ── FLAME GROUP ── */}
      <g transform={`translate(${bw*0.68}, -24)`}
         style={{ transformOrigin: '0 0',
                  animation: `ds5flicker 1.45s ${flickerDelay} ease-in-out infinite` }}>

        {/* Large ambient glow behind flame */}
        <ellipse cx="0" cy="-30" rx={lit ? 26 : 19} ry={lit ? 58 : 44}
          fill={`rgba(255,128,12,${outA.toFixed(2)})`}
          filter={`url(#${p}bm)`}
          style={{ transition: 'rx 0.35s, ry 0.35s, fill 0.35s' }} />

        {/* Outer orange flame */}
        <path d="M -12 0 C -18 -16 -13 -50 0 -76 C 13 -50 18 -16 12 0 C 9 9 -9 9 -12 0 Z"
          fill={`url(#${p}fo)`} />

        {/* Mid amber-yellow flame */}
        <path d="M -8 0 C -12 -14 -8 -44 0 -68 C 8 -44 12 -14 8 0 C 6 7 -6 7 -8 0 Z"
          fill={`url(#${p}fm)`} />

        {/* Inner bright yellow-white */}
        <path d="M -5 0 C -7.5 -13 -4.5 -38 0 -58 C 4.5 -38 7.5 -13 5 0 C 3.5 6 -3.5 6 -5 0 Z"
          fill={lit ? 'rgba(255,252,205,1.0)' : 'rgba(255,244,168,0.98)'}
          style={{ transition: 'fill 0.35s' }} />

        {/* Core white flame */}
        <path d="M -2.8 0 C -4.2 -11 -2.2 -32 0 -50 C 2.2 -32 4.2 -11 2.8 0 C 2.2 4.5 -2.2 4.5 -2.8 0 Z"
          fill={lit ? '#FFFFFF' : '#FFFBE8'} fillOpacity="0.97"
          style={{ transition: 'fill 0.35s' }} />

        {/* Bright tip ellipse */}
        <ellipse cx="0" cy="-52" rx={lit ? 3.0 : 2.2} ry={lit ? 5.5 : 4.0}
          fill="white" fillOpacity="0.94"
          style={{ transition: 'rx 0.35s, ry 0.35s' }} />
        {/* Core tip dot */}
        <circle cx="0" cy="-52" r={lit ? 1.5 : 1.0}
          fill="white" fillOpacity="1.0" />
      </g>

      {/* ── WARM LIGHT REFLECTION ON BOWL NEAR SPOUT ── */}
      <ellipse cx={bw*0.36} cy="-5" rx="20" ry="12"
        fill={`rgba(255,168,42,${lit ? 0.32 : 0.17})`}
        filter={`url(#${p}bs)`}
        style={{ transition: 'fill 0.4s ease' }} />
    </svg>
  );
}

// ── Diya layout: left% / bottom% / scale / z-index / flicker delay ─
const DIYA_CONFIG = [
  { id: 0, left: '8%',  bottom: '35%', scale: 0.62, zi: 1, fd: '0.55s',  label: 'Far left'   },
  { id: 1, left: '28%', bottom: '22%', scale: 0.80, zi: 3, fd: '0.20s',  label: 'Mid left'   },
  { id: 2, left: '50%', bottom: '6%',  scale: 1.00, zi: 5, fd: '0s',     label: 'Centre'     },
  { id: 3, left: '72%', bottom: '22%', scale: 0.80, zi: 3, fd: '0.82s',  label: 'Mid right'  },
  { id: 4, left: '92%', bottom: '35%', scale: 0.62, zi: 1, fd: '1.10s',  label: 'Far right'  },
];

// ── Main component ────────────────────────────────────────────────
export default function DiyaScene() {
  const [lit, setLit]   = useState([false, false, false, false, false]);
  const svgRefs         = useRef([null, null, null, null, null]);
  const emitRef         = useRef(null);

  // Flame tip in DiyaSVG local space: translate(bw*0.68, -24) + tip at cy=-52
  // → local (bw*0.68, -24 + -52) = (44.2, -76) inside viewBox "-74 -125 148 170"
  // Normalised in viewBox: nx = (44.2 - (-74)) / 148 = 118.2/148 ≈ 0.798
  //                        ny = (-76 - (-125)) / 170 = 49/170 ≈ 0.288
  const FLAME_NX = 0.798, FLAME_NY = 0.288;

  function getFlameScreen(index) {
    const el = svgRefs.current[index];
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + FLAME_NX * rect.width,
      y: rect.top  + FLAME_NY * rect.height,
    };
  }

  const handleClick = useCallback((index) => {
    setLit(prev => {
      const next = [...prev];
      next[index] = true;   // stays lit — no auto-reset
      return next;
    });
    // Emit sparks
    if (emitRef.current) {
      const pos = getFlameScreen(index);
      emitRef.current(pos.x, pos.y);
    }
  }, []); // eslint-disable-line

  return (
    <>
      {/* Inject flicker keyframes once */}
      <style>{FLICKER_STYLE}</style>

      {/* Spark overlay */}
      <SparkCanvas emitRef={emitRef} />

      {/* ── Section wrapper ── */}
      <section className="ds5-section" aria-label="Diya scene">
        {/* Decorative title */}
        <p className="ds5-label">🪔 Light a Diya — Touch to Brighten the Flame</p>

        {/* Diya stage */}
        <div className="ds5-stage">
          {DIYA_CONFIG.map((cfg) => {
            // Box size based on scale: center is 140px wide at scale 1.0
            const boxW = Math.round(140 * cfg.scale);
            const boxH = Math.round(160 * cfg.scale);
            return (
              <button
                key={cfg.id}
                className="ds5-diya-btn"
                aria-label={`${cfg.label} diya — click to light`}
                onClick={() => handleClick(cfg.id)}
                style={{
                  left:      cfg.left,
                  bottom:    cfg.bottom,
                  width:     boxW,
                  height:    boxH,
                  zIndex:    cfg.zi,
                  cursor:    lit[cfg.id] ? 'default' : 'pointer',
                }}
              >
                <DiyaSVG
                  uid={cfg.id}
                  lit={lit[cfg.id]}
                  flickerDelay={cfg.fd}
                  onFlamePosRef={el => { svgRefs.current[cfg.id] = el; }}
                />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
