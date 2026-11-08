import React, { useState, useRef, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// CENTER DIYA ARRANGEMENT — interactive, three-diya triangular scene
//
// Each diya:
//  • Has its own persistent lit state (stays lit — no auto-reset)
//  • On click/tap → flame brightens, soft glow expands, tiny sparks rise
//  • Shows a short wish toast near the diya group
//  • When all three are lit, shows a compact final message
//  • Sparks rendered on an overlay <canvas> positioned over the SVG
// ═══════════════════════════════════════════════════════════════

const DIYA_WISHES = [
  '✨ May Happiness light your path!',
  '🌟 May Prosperity bless your home!',
  '🪔 May Peace fill your heart!',
];

const FINAL_MESSAGE =
  'May Your Life Shine with Happiness, Peace and Prosperity. Happy Diwali! 🪔🎆';

// ── Tiny rising-spark particle system ────────────────────────
class RisingSpark {
  constructor(cx, cy) {
    this.x  = cx + (Math.random() - 0.5) * 8;
    this.y  = cy;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = -(Math.random() * 1.4 + 0.6);
    this.alpha = Math.random() * 0.5 + 0.5;
    this.decay = Math.random() * 0.012 + 0.008;
    this.r     = Math.random() * 1.4 + 0.5;
    this.color = Math.random() < 0.6 ? '#FFD060' : '#FFAA20';
    this.active = true;
  }
  update() {
    this.x     += this.vx;
    this.y     += this.vy;
    this.vy    *= 0.985;
    this.vx    *= 0.99;
    this.alpha -= this.decay;
    if (this.alpha <= 0) { this.alpha = 0; this.active = false; }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle   = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Diya SVG subcomponent ─────────────────────────────────────
function DiyaSVG({ lit, fd = '0s', gd = '0s', fd2 = '0.3s' }) {
  const bw = 80, bh = 32;
  const flameX = bw * 0.38;

  return (
    <g aria-hidden="true">
      {/* ── Extra glow burst when lit ── */}
      {lit && (
        <ellipse cx={flameX} cy={-42} rx={28} ry={40}
          fill="rgba(255,200,60,0.22)"
          style={{ animation: 'cd-lit-glow 0.4s ease-out forwards' }} />
      )}
      {lit && (
        <ellipse cx="0" cy={bh * 0.6} rx={bw * 1.1} ry={bh * 1.8}
          fill="rgba(255,150,30,0.14)"
          style={{ animation: 'cd-lit-glow 0.4s ease-out forwards' }} />
      )}

      {/* Ground glow */}
      <ellipse cx="0" cy={bh * 0.9 + 4} rx={bw * 0.75} ry="10"
        fill={lit ? 'rgba(255,180,50,0.40)' : 'rgba(255,160,40,0.18)'}
        filter="url(#cd-blr)"
        style={{ animation: `diya-glow-pulse 2.5s ${gd} ease-in-out infinite`,
                 transition: 'fill 0.4s' }} />

      {/* Body shadow */}
      <path
        d={`M ${-bw/2+2} 4 C ${-bw/2+2} ${bh*0.55} ${-bw*0.35} ${bh*0.9} 0 ${bh+2} C ${bw*0.35} ${bh*0.9} ${bw/2-2} ${bh*0.55} ${bw/2-2} 4 L ${bw*0.08} ${-bh*0.22} L ${-bw*0.08} ${-bh*0.22} Z`}
        fill="rgba(30,10,0,0.5)" />

      {/* Main bowl */}
      <path
        d={`M ${-bw/2} 2 C ${-bw/2} ${bh*0.5} ${-bw*0.35} ${bh*0.88} 0 ${bh} C ${bw*0.35} ${bh*0.88} ${bw/2} ${bh*0.5} ${bw/2} 2 L ${bw*0.08} ${-bh*0.2} L ${-bw*0.08} ${-bh*0.2} Z`}
        fill="url(#cd-clay)" />

      {/* Rim highlight */}
      <path
        d={`M ${-bw/2} 2 L ${bw*0.08} ${-bh*0.2} L ${-bw*0.08} ${-bh*0.2} Z`}
        fill="url(#cd-rim-top)" />

      {/* Rim ellipse */}
      <ellipse cx="0" cy="2" rx={bw / 2} ry={bh * 0.16}
        fill="none" stroke="#D9A441" strokeWidth="1.6" strokeOpacity="0.9" />
      <ellipse cx="0" cy="3" rx={bw * 0.4} ry={bh * 0.12}
        fill="rgba(50,15,0,0.45)" />
      <ellipse cx={-bw * 0.08} cy="1" rx={bw * 0.22} ry={bh * 0.07}
        fill="rgba(255,210,80,0.30)" />

      {/* Decorative dots */}
      {[-28, -16, -6, 6, 16, 28].map((dx, i) => (
        <circle key={i} cx={dx} cy="2" r="1.4" fill="#D9A441" fillOpacity="0.7" />
      ))}

      {/* Spout */}
      <path
        d={`M ${bw*0.28} -2 Q ${bw*0.52} 0 ${bw*0.44} 6 Q ${bw*0.38} 10 ${bw*0.3} 8`}
        fill="url(#cd-clay)" stroke="#A05020" strokeWidth="0.8" />

      {/* Wick */}
      <path d={`M ${bw*0.37} 3 C ${bw*0.40} -2 ${bw*0.42} -8 ${bw*0.38} -18`}
        fill="none" stroke="#3C1A00" strokeWidth="2.2" strokeLinecap="round" />

      {/* Flame group */}
      <g transform={`translate(${flameX},-20)`}
        style={{ transformOrigin: '0 0', animation: `flame-flicker 1.3s ${fd} ease-in-out infinite` }}>

        {/* Outer ambient glow */}
        <ellipse cx="0" cy="-10" rx={lit ? 22 : 14} ry={lit ? 34 : 22}
          fill={lit ? 'rgba(255,130,10,0.30)' : 'rgba(255,100,10,0.12)'}
          style={{ animation: `diya-glow-pulse 1.9s ${fd2} ease-in-out infinite`,
                   transition: 'rx 0.3s, ry 0.3s, fill 0.3s' }} />

        {/* Outer orange flame */}
        <path d="M -7 0 C -11 -10 -6 -24 0 -34 C 6 -24 11 -10 7 0 C 5 5 -5 5 -7 0 Z"
          fill={lit ? 'rgba(255,120,15,0.96)' : 'rgba(255,100,15,0.80)'} />

        {/* Mid amber-yellow */}
        <path d="M -5 0 C -8 -9 -4 -21 0 -30 C 4 -21 8 -9 5 0 C 3.5 4 -3.5 4 -5 0 Z"
          fill={lit ? 'rgba(255,220,30,0.98)' : 'rgba(255,185,20,0.90)'} />

        {/* Inner bright yellow */}
        <path d="M -3 0 C -5 -8 -2 -17 0 -24 C 2 -17 5 -8 3 0 C 2 3 -2 3 -3 0 Z"
          fill={lit ? 'rgba(255,248,80,1)' : 'rgba(255,230,60,0.95)'} />

        {/* Core white-gold */}
        <path d="M -1.5 0 C -2.5 -6 -1 -13 0 -18 C 1 -13 2.5 -6 1.5 0 C 1 2 -1 2 -1.5 0 Z"
          fill={lit ? '#FFFFFF' : '#FFF8CC'} fillOpacity="0.97" />

        {/* Tip */}
        <circle cx="0" cy="-19" r={lit ? 3.5 : 2.2} fill="white" fillOpacity="0.92" />
        <circle cx="0" cy="-19" r={lit ? 2.0 : 1.0} fill="white" fillOpacity="1" />
      </g>

      {/* Warm light on bowl */}
      <ellipse cx={bw * 0.25} cy="-4" rx="18" ry="12"
        fill={lit ? 'rgba(255,200,60,0.36)' : 'rgba(255,170,40,0.14)'}
        style={{ animation: `diya-glow-pulse 1.5s ${gd} ease-in-out infinite`,
                 transition: 'fill 0.3s' }} />
    </g>
  );
}

// ── Spark overlay canvas ──────────────────────────────────────
function SparkCanvas({ emitRef }) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const frameRef  = useRef(null);

  useEffect(() => {
    emitRef.current = (screenX, screenY) => {
      const count = Math.floor(Math.random() * 7) + 8;
      for (let i = 0; i < count; i++) {
        sparksRef.current.push(new RisingSpark(screenX, screenY));
      }
    };
  }, [emitRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = Math.round(window.innerWidth  * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const sp of sparksRef.current) { sp.update(); sp.draw(ctx); }
      sparksRef.current = sparksRef.current.filter(s => s.active);
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 8,
      }}
      aria-hidden="true"
    />
  );
}

// ── Main component ─────────────────────────────────────────────
export default function CenterDiyas() {
  // Persistent lit state — diyas stay lit once clicked
  const [lit, setLit] = useState([false, false, false]);
  // Index of the diya whose wish toast is showing (or null)
  const [activeWish, setActiveWish] = useState(null);
  const wishTimerRef = useRef(null);

  const svgRef  = useRef(null);
  const emitRef = useRef(null);

  const allLit = lit[0] && lit[1] && lit[2];

  // SVG internal coordinate system
  const VW = 420, VH = 140;

  // Diya layout in SVG space: [translateX, translateY, scale]
  const DIYA_LAYOUT = [
    { tx: -135, ty: -28, sc: 0.78, fd: '0.3s', gd: '0.6s', fd2: '0.1s' }, // left
    {  tx: 135, ty: -28, sc: 0.78, fd: '0.7s', gd: '0.2s', fd2: '0.5s' }, // right
    {  tx:   0, ty:   0, sc: 1.00, fd: '0s',   gd: '0.4s', fd2: '0.8s' }, // center
  ];

  // Flame tip in DiyaSVG local space
  const FLAME_LOCAL = { x: 30.4, y: -39 };

  function getFlameScreen(index) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect  = svg.getBoundingClientRect();
    const { tx, ty, sc } = DIYA_LAYOUT[index];
    const svgW = rect.width, svgH = rect.height;
    const vbX  = -VW / 2, vbY = -VH;
    const svgFX = tx + FLAME_LOCAL.x * sc;
    const svgFY = ty + FLAME_LOCAL.y * sc;
    const nx = (svgFX - vbX) / VW;
    const ny = (svgFY - vbY) / VH;
    return {
      x: rect.left + nx * svgW,
      y: rect.top  + ny * svgH,
    };
  }

  const handleDiyaClick = useCallback((index) => {
    setLit(prev => {
      if (prev[index]) return prev; // already lit, do nothing
      const next = [...prev];
      next[index] = true;

      // Show wish unless this click lights the last diya
      const willAllLit = next[0] && next[1] && next[2];
      if (!willAllLit) {
        setActiveWish(index);
        if (wishTimerRef.current) clearTimeout(wishTimerRef.current);
        wishTimerRef.current = setTimeout(() => setActiveWish(null), 3000);
      }

      return next;
    });

    // Emit sparks from flame tip in screen space
    if (emitRef.current) {
      const pos = getFlameScreen(index);
      emitRef.current(pos.x, pos.y);
    }
  }, []); // eslint-disable-line

  useEffect(() => () => { if (wishTimerRef.current) clearTimeout(wishTimerRef.current); }, []);

  return (
    <>
      {/* Spark overlay canvas */}
      <SparkCanvas emitRef={emitRef} />

      <div className="center-diyas-wrap">
        {/* Wish / final message container — sits above the SVG */}
        <div className="cd-wish-container" aria-live="polite">
          {!allLit && DIYA_WISHES.map((wish, i) => (
            <div
              key={i}
              className={`cd-wish-toast${activeWish === i ? ' cd-wish-toast--visible' : ''}`}
              role="status"
            >
              {wish}
            </div>
          ))}
          {allLit && (
            <div className="cd-final-message" role="status">
              {FINAL_MESSAGE}
            </div>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`${-VW / 2} ${-VH} ${VW} ${VH}`}
          preserveAspectRatio="xMidYMax meet"
          className="center-diyas-svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="cd-clay" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#C8722A" />
              <stop offset="30%"  stopColor="#A8521A" />
              <stop offset="65%"  stopColor="#7A3510" />
              <stop offset="100%" stopColor="#4A1E06" />
            </linearGradient>
            <linearGradient id="cd-rim-top" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#E8A040" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8B4500" stopOpacity="0.4"  />
            </linearGradient>
            <filter id="cd-blr" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Left back diya (index 0) */}
          <g
            transform="translate(-135, -28) scale(0.78)"
            onClick={() => handleDiyaClick(0)}
            onTouchEnd={e => { e.preventDefault(); handleDiyaClick(0); }}
            style={{ cursor: lit[0] ? 'default' : 'pointer' }}
            role="button"
            aria-label={lit[0] ? 'Left diya is lit' : 'Left diya — tap to light'}
          >
            <DiyaSVG lit={lit[0]} fd="0.3s" gd="0.6s" fd2="0.1s" />
            <rect x="-50" y="-65" width="100" height="100" fill="transparent" />
          </g>

          {/* Right back diya (index 1) */}
          <g
            transform="translate(135, -28) scale(0.78)"
            onClick={() => handleDiyaClick(1)}
            onTouchEnd={e => { e.preventDefault(); handleDiyaClick(1); }}
            style={{ cursor: lit[1] ? 'default' : 'pointer' }}
            role="button"
            aria-label={lit[1] ? 'Right diya is lit' : 'Right diya — tap to light'}
          >
            <DiyaSVG lit={lit[1]} fd="0.7s" gd="0.2s" fd2="0.5s" />
            <rect x="-50" y="-65" width="100" height="100" fill="transparent" />
          </g>

          {/* Center foreground diya (index 2) */}
          <g
            transform="translate(0, 0) scale(1.0)"
            onClick={() => handleDiyaClick(2)}
            onTouchEnd={e => { e.preventDefault(); handleDiyaClick(2); }}
            style={{ cursor: lit[2] ? 'default' : 'pointer' }}
            role="button"
            aria-label={lit[2] ? 'Center diya is lit' : 'Center diya — tap to light'}
          >
            <DiyaSVG lit={lit[2]} fd="0s" gd="0.4s" fd2="0.8s" />
            <rect x="-50" y="-65" width="100" height="100" fill="transparent" />
          </g>
        </svg>
      </div>
    </>
  );
}
