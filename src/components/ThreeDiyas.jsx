import React, { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
//  THREE DIYAS — Ornate decorative oil lamps in the Diwali style
//
//  Visual reference: illustrated diyas with:
//   • Deep navy/indigo bowl body with intricate gold patterns
//   • Large lotus petal crown radiating around the bowl rim
//   • Inner oil well with warm golden glow & mandala detailing
//   • Tall, elegant multi-layer realistic flame
//   • Warm ground glow beneath each diya
//   • Independent gentle flickering animations
//
//  Placement: absolute, bottom-centre of .night-sky (z:8)
//  Three-diya layout:
//   Left (scale ~0.78, marginBottom for depth) |
//   Centre (scale 1.0, front)                  |
//   Right (scale ~0.78, marginBottom for depth)
// ═══════════════════════════════════════════════════════════════

/* ── CSS Keyframes (injected once into <head>) ── */
const ANIM_ID  = 'three-diyas-anim';
const ANIM_CSS = `
@keyframes d3Flk {
  0%,100% { transform: skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity: 1.00; }
  10%     { transform: skewX(2.1deg)  scaleX(.91)  scaleY(1.09); opacity: .93; }
  22%     { transform: skewX(-1.7deg) scaleX(1.05) scaleY(.95);  opacity: .98; }
  35%     { transform: skewX(2.8deg)  scaleX(.88)  scaleY(1.11); opacity: .91; }
  48%     { transform: skewX(-1.1deg) scaleX(1.04) scaleY(.97);  opacity: .97; }
  62%     { transform: skewX(1.9deg)  scaleX(.93)  scaleY(1.06); opacity: .95; }
  76%     { transform: skewX(-2.1deg) scaleX(1.03) scaleY(.97);  opacity: .98; }
  88%     { transform: skewX(1.1deg)  scaleX(.97)  scaleY(1.02); opacity: .96; }
}
@keyframes d3GlowPulse {
  0%,100% { opacity: .50; transform: scale(1.00); }
  50%     { opacity: .72; transform: scale(1.10); }
}
@keyframes d3SparkRise {
  0%   { transform: translateY(0)   translateX(0)   scaleY(1);   opacity: .9; }
  100% { transform: translateY(-22px) translateX(var(--sx,0px)) scaleY(.4); opacity: 0; }
}
`;

function ensureAnim() {
  if (!document.getElementById(ANIM_ID)) {
    const s = document.createElement('style');
    s.id    = ANIM_ID;
    s.textContent = ANIM_CSS;
    document.head.appendChild(s);
  }
}

/* ── Lotus petal path: pointed leaf, base at origin, tip pointing up (−Y) ── */
function petalD(L, W) {
  const c = W * 0.62;
  return `M0,0 C${c},-${(L * .27).toFixed(2)} ${(W * .82).toFixed(2)},-${(L * .70).toFixed(2)} 0,-${L.toFixed(2)} C-${(W * .82).toFixed(2)},-${(L * .70).toFixed(2)} -${c},-${(L * .27).toFixed(2)} 0,0Z`;
}

/* ── Small spark dots that rise from the flame tip ── */
function Sparks({ uid, flameTopY }) {
  const sparks = [
    { dx: '-3px', dur: '1.8s', delay: '0s',   r: 1.4, col: '#FFE066' },
    { dx:  '4px', dur: '2.2s', delay: '0.7s', r: 1.2, col: '#FFAA00' },
    { dx: '-6px', dur: '1.6s', delay: '1.3s', r: 1.0, col: '#FF7700' },
    { dx:  '2px', dur: '2.0s', delay: '0.4s', r: 1.1, col: '#FFD700' },
  ];
  return (
    <>
      {sparks.map((sp, i) => (
        <circle
          key={i}
          cx="0" cy={flameTopY}
          r={sp.r}
          fill={sp.col}
          style={{
            '--sx': sp.dx,
            animation: `d3SparkRise ${sp.dur} ease-out infinite`,
            animationDelay: sp.delay,
          }}
        />
      ))}
    </>
  );
}

/* ── Single Diya SVG ── */
function DiyaSVG({ uid, dur = '2.1s', delay = '0s' }) {
  const p  = `d3_${uid}`;     // unique id prefix to avoid duplicate SVG ids
  const NP = 16;              // number of lotus petals
  const PL = 24;              // petal length (SVG units)
  const PW = 7.5;             // petal max half-width
  const BRX = 60;             // bowl rim ellipse x-radius
  const BRY = 15;             // bowl rim ellipse y-radius (perspective)
  const BCY = 10;             // bowl centre Y

  /* Compute petal positions + rotations on the rim ellipse */
  const petals = Array.from({ length: NP }, (_, i) => {
    const a  = (i / NP) * 2 * Math.PI - Math.PI / 2;   // −π/2 = top
    const bx = Math.cos(a) * BRX;
    const by = Math.sin(a) * BRY + BCY;
    // Direction from bowl centre to petal base (in the squished ellipse space)
    const outA   = Math.atan2(by - BCY, bx);
    const rotDeg = (outA * 180 / Math.PI) + 90;
    // Perspective: bottom petals (sin=+1) appear full size; top (sin=−1) are foreshortened
    const t  = (Math.sin(a) + 1) / 2;                  // 0 at top → 1 at bottom
    const ps = 0.56 + 0.44 * t;
    // Draw bottom-half petals on top (in front of bowl face)
    const isFront = Math.sin(a) > -0.08;
    return { bx, by, rotDeg, ps, isFront };
  });

  const backPetals  = petals.filter(p => !p.isFront);
  const frontPetals = petals.filter(p =>  p.isFront);

  const flameOriginY = BCY - 12;   // where wick ends / flame starts
  const flameTipY    = flameOriginY - 110; // topmost point of flame in SVG coords

  return (
    <svg
      viewBox="-92 -148 184 192"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <defs>
        {/* ─ Flame gradients ─ */}
        <linearGradient id={`${p}fo`} x1=".5" y1="1" x2=".5" y2="0">
          <stop offset="0%"   stopColor="#CC1100" stopOpacity=".92"/>
          <stop offset="16%"  stopColor="#FF5500"/>
          <stop offset="38%"  stopColor="#FFAA00"/>
          <stop offset="65%"  stopColor="#FFE060"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity=".35"/>
        </linearGradient>
        <linearGradient id={`${p}fi`} x1=".5" y1="1" x2=".5" y2="0">
          <stop offset="0%"   stopColor="#FF7700"/>
          <stop offset="28%"  stopColor="#FFCC00"/>
          <stop offset="62%"  stopColor="#FFF3C0"/>
          <stop offset="100%" stopColor="#FFFFFF"/>
        </linearGradient>
        <radialGradient id={`${p}fh`} cx="50%" cy="76%" r="50%">
          <stop offset="0%"   stopColor="#FF9900" stopOpacity=".68"/>
          <stop offset="50%"  stopColor="#FF6600" stopOpacity=".22"/>
          <stop offset="100%" stopColor="#FF3300" stopOpacity="0"/>
        </radialGradient>

        {/* ─ Bowl body ─ */}
        <radialGradient id={`${p}bw`} cx="33%" cy="26%" r="74%">
          <stop offset="0%"   stopColor="#3E22B2"/>
          <stop offset="46%"  stopColor="#1C0F6C"/>
          <stop offset="100%" stopColor="#0A0740"/>
        </radialGradient>
        <radialGradient id={`${p}bt`} cx="37%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#251388" stopOpacity=".78"/>
          <stop offset="100%" stopColor="#070430" stopOpacity="1"/>
        </radialGradient>

        {/* ─ Oil well ─ */}
        <radialGradient id={`${p}oi`} cx="40%" cy="36%" r="60%">
          <stop offset="0%"   stopColor="#FFD700" stopOpacity=".95"/>
          <stop offset="32%"  stopColor="#FF9900" stopOpacity=".68"/>
          <stop offset="100%" stopColor="#080430"/>
        </radialGradient>

        {/* ─ Lotus petal ─ */}
        <linearGradient id={`${p}pt`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#FFD700"/>
          <stop offset="30%"  stopColor="#FF9F00"/>
          <stop offset="65%"  stopColor="#FF4E00"/>
          <stop offset="100%" stopColor="#C81600"/>
        </linearGradient>

        {/* ─ Ground warm glow ─ */}
        <radialGradient id={`${p}gg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF8800" stopOpacity=".55"/>
          <stop offset="52%"  stopColor="#FF5500" stopOpacity=".20"/>
          <stop offset="100%" stopColor="#FF2200" stopOpacity="0"/>
        </radialGradient>

        {/* ─ Flame bloom glow filter ─ */}
        <filter id={`${p}blm`} x="-80%" y="-70%" width="260%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* ── Ground warm pool ── */}
      <ellipse
        cx="0" cy="42" rx="62" ry="14"
        fill={`url(#${p}gg)`}
        style={{ animation: `d3GlowPulse ${dur} ease-in-out infinite`, animationDelay: delay }}
      />

      {/* ── Back petals (drawn behind bowl) ── */}
      {backPetals.map(({ bx, by, rotDeg, ps }, i) => (
        <g key={`b${i}`} transform={`translate(${bx},${by}) rotate(${rotDeg})`}>
          <path
            d={petalD(PL * ps, PW * Math.max(0.50, ps))}
            fill={`url(#${p}pt)`}
            stroke="#FFD700"
            strokeWidth="0.32"
            opacity="0.80"
          />
        </g>
      ))}

      {/* ── Bowl side wall ── */}
      <path
        d={`M ${-BRX + 3},${BCY}
            C ${-BRX - 1},${BCY + 28} ${-BRX + 13},${BCY + 36} 0,${BCY + 37}
            C ${BRX - 13},${BCY + 36} ${BRX + 1},${BCY + 28} ${BRX - 3},${BCY} Z`}
        fill={`url(#${p}bw)`}
      />

      {/* ── Bowl top face ── */}
      <ellipse cx="0" cy={BCY} rx={BRX} ry={BRY} fill={`url(#${p}bt)`}/>

      {/* ── Gold rim line ── */}
      <ellipse cx="0" cy={BCY} rx={BRX} ry={BRY} fill="none" stroke="#FFD700" strokeWidth="1.7" opacity=".90"/>

      {/* ── Gold dot border around rim ── */}
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * 2 * Math.PI;
        return (
          <circle
            key={i}
            cx={Math.cos(a) * (BRX - 0.5)}
            cy={Math.sin(a) * (BRY - 0.5) + BCY}
            r="1.7" fill="#FFD700" opacity=".84"
          />
        );
      })}

      {/* ── Inner gold accent ring ── */}
      <ellipse cx="0" cy={BCY} rx={BRX - 11} ry={BRY - 3.2} fill="none" stroke="#FFB000" strokeWidth="0.65" opacity=".48"/>

      {/* ── Decorative lotus motifs on bowl wall (three clusters) ── */}
      {[-38, 0, 38].map((ox, mi) => (
        <g key={mi} transform={`translate(${ox}, ${BCY + 21})`}>
          <circle cx="0" cy="0" r="4.8" fill="#EE2E00" opacity=".70"/>
          <circle cx="0" cy="0" r="4.8" fill="none" stroke="#FFD700" strokeWidth="0.75" opacity=".82"/>
          {[0, 60, 120, 180, 240, 300].map(da => {
            const dr = da * Math.PI / 180;
            const ex = Math.cos(dr) * 7.2;
            const ey = Math.sin(dr) * 3.0;
            return (
              <ellipse
                key={da}
                cx={ex} cy={ey}
                rx="3.1" ry="1.5"
                fill="#FF5500"
                opacity=".65"
                transform={`rotate(${da}, ${ex}, ${ey})`}
              />
            );
          })}
        </g>
      ))}

      {/* ── Gold accent line on lower bowl wall ── */}
      <ellipse cx="0" cy={BCY + 14} rx={BRX - 6} ry={BRY * 0.44} fill="none" stroke="#FFD700" strokeWidth="0.62" opacity=".40"/>

      {/* ── Oil well ── */}
      <ellipse cx="0" cy={BCY - 1} rx="35" ry="9.2" fill="#07042A"/>
      <ellipse cx="0" cy={BCY - 1} rx="35" ry="9.2" fill="none" stroke="#FFD700" strokeWidth="0.95" opacity=".65"/>
      <ellipse cx="0" cy={BCY - 1} rx="28" ry="7.2" fill={`url(#${p}oi)`} opacity=".88"/>

      {/* ── Mandala inside oil well ── */}
      <ellipse cx="0" cy={BCY - 1} rx="20" ry="5.6" fill="none" stroke="#FFD700" strokeWidth="0.58" opacity=".52"/>
      <ellipse cx="0" cy={BCY - 1} rx="12" ry="3.4" fill="none" stroke="#FFD700" strokeWidth="0.58" opacity=".52"/>
      {[0, 45, 90, 135].map(da => {
        const dr = da * Math.PI / 180;
        return (
          <line
            key={da}
            x1={-Math.cos(dr) * 19} y1={-Math.sin(dr) * 5.3 + BCY - 1}
            x2={ Math.cos(dr) * 19} y2={ Math.sin(dr) * 5.3 + BCY - 1}
            stroke="#FFD700" strokeWidth="0.48" opacity=".36"
          />
        );
      })}

      {/* ── Front petals (drawn over bowl face — appear in front) ── */}
      {frontPetals.map(({ bx, by, rotDeg, ps }, i) => (
        <g key={`f${i}`} transform={`translate(${bx},${by}) rotate(${rotDeg})`}>
          <path
            d={petalD(PL * ps, PW * Math.max(0.50, ps))}
            fill={`url(#${p}pt)`}
            stroke="#FFD700"
            strokeWidth="0.32"
            opacity="0.93"
          />
          {/* Central vein on petal */}
          <line
            x1="0" y1="-1"
            x2="0" y2={-(PL * ps * 0.66).toFixed(1)}
            stroke="#FFD700" strokeWidth="0.44" opacity=".60"
          />
        </g>
      ))}

      {/* ── Wick ── */}
      <path
        d={`M 0,${BCY - 1} Q 0.8,${BCY - 7} 0,${BCY - 12}`}
        stroke="#3A2800" strokeWidth="1.4" fill="none" strokeLinecap="round"
      />

      {/* ── Flame group (flicker animation applied here) ── */}
      <g
        transform={`translate(0, ${flameOriginY})`}
        style={{
          animation: `d3Flk ${dur} ease-in-out infinite`,
          animationDelay: delay,
          transformOrigin: '0px 0px',
        }}
      >
        {/* Soft ambient halo around flame */}
        <ellipse
          cx="0" cy="-42" rx="32" ry="55"
          fill={`url(#${p}fh)`}
          filter={`url(#${p}blm)`}
        />
        {/* Outer flame body */}
        <path
          d="M0,-110 C14,-86 22,-58 16,-30 C12,-16 7,-6 0,0 C-7,-6 -12,-16 -16,-30 C-22,-58 -14,-86 0,-110Z"
          fill={`url(#${p}fo)`}
        />
        {/* Inner bright core flame */}
        <path
          d="M0,-92 C9,-72 14,-50 10,-25 C7,-13 3,-4 0,0 C-3,-4 -7,-13 -10,-25 C-14,-50 -9,-72 0,-92Z"
          fill={`url(#${p}fi)`}
        />
        {/* White-hot wick glow */}
        <ellipse cx="0" cy="-22" rx="4.0" ry="10" fill="white" opacity=".95"/>
        <ellipse cx="0" cy="-15" rx="2.4" ry=" 6" fill="white"/>
      </g>

      {/* ── Rising sparks from flame tip ── */}
      <Sparks uid={uid} flameTopY={flameTipY + flameOriginY} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   DEFAULT EXPORT — three-diya row, bottom-centre
   ═══════════════════════════════════════════════════ */
export default function ThreeDiyas() {
  useEffect(() => { ensureAnim(); }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position:        'absolute',
        bottom:          '3vh',
        left:            '50%',
        transform:       'translateX(-50%)',
        zIndex:          8,
        display:         'flex',
        alignItems:      'flex-end',
        justifyContent:  'center',
        width:           'min(94vw, 600px)',
        pointerEvents:   'none',
        gap:             '0px',
      }}
    >
      {/* ── Left diya (slightly behind — raised + dimmed) ── */}
      <div style={{ width: 'min(28vw, 168px)', flexShrink: 0, marginBottom: '20px', filter: 'brightness(0.86)' }}>
        <DiyaSVG uid="L" dur="2.38s" delay="-0.85s"/>
      </div>

      {/* ── Centre diya (front, largest) ── */}
      <div style={{ width: 'min(34vw, 204px)', flexShrink: 0, zIndex: 1 }}>
        <DiyaSVG uid="C" dur="2.05s" delay="0s"/>
      </div>

      {/* ── Right diya (slightly behind — raised + dimmed) ── */}
      <div style={{ width: 'min(28vw, 168px)', flexShrink: 0, marginBottom: '20px', filter: 'brightness(0.86)' }}>
        <DiyaSVG uid="R" dur="2.52s" delay="-1.55s"/>
      </div>
    </div>
  );
}
