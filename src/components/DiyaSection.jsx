import React, { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
//  DIYA SECTION
//  — Renders the three-diya PNG image (mix-blend-mode: screen so
//    the white background disappears on the dark site background).
//  — Overlays realistic animated SVG flames precisely on each wick.
//    The SVG uses the actual image dimensions (1024×438) as viewBox
//    so percentage positions are exact regardless of display size.
//  — Shows "Created by Rushikesh Kawadkar" in golden text below.
// ═══════════════════════════════════════════════════════════════════

/* ── PNG natural dimensions (used as SVG viewBox) ── */
const IMG_W = 1024;
const IMG_H = 438;

/* ── Wick base positions in original image pixels ── */
// Left diya, Centre diya, Right diya — measured from the uploaded PNG
const WICKS = [
  { x: 213, y: 200, scale: 0.78, dur: '2.35s', delay: '-0.7s',  anim: 'dsFlk1' },
  { x: 512, y: 128, scale: 1.00, dur: '2.00s', delay:   '0s',   anim: 'dsFlk2' },
  { x: 810, y: 200, scale: 0.78, dur: '2.55s', delay: '-1.4s',  anim: 'dsFlk3' },
];

/* ── CSS Keyframes injected once into <head> ── */
const ANIM_ID  = 'diya-section-anim';
const ANIM_CSS = `
@keyframes dsFlk1 {
  0%,100%{ transform:skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity:1.00; }
  12%    { transform:skewX(2.4deg)  scaleX(.89)  scaleY(1.10); opacity:.92; }
  25%    { transform:skewX(-1.8deg) scaleX(1.06) scaleY(.94);  opacity:.97; }
  40%    { transform:skewX(3.1deg)  scaleX(.86)  scaleY(1.13); opacity:.89; }
  55%    { transform:skewX(-1.3deg) scaleX(1.05) scaleY(.96);  opacity:.96; }
  70%    { transform:skewX(2.0deg)  scaleX(.93)  scaleY(1.07); opacity:.94; }
  85%    { transform:skewX(-2.3deg) scaleX(1.04) scaleY(.97);  opacity:.97; }
}
@keyframes dsFlk2 {
  0%,100%{ transform:skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity:1.00; }
  10%    { transform:skewX(1.8deg)  scaleX(.92)  scaleY(1.08); opacity:.94; }
  23%    { transform:skewX(-2.5deg) scaleX(1.07) scaleY(.93);  opacity:.98; }
  38%    { transform:skewX(2.7deg)  scaleX(.88)  scaleY(1.11); opacity:.91; }
  52%    { transform:skewX(-1.0deg) scaleX(1.04) scaleY(.97);  opacity:.97; }
  66%    { transform:skewX(2.2deg)  scaleX(.91)  scaleY(1.08); opacity:.93; }
  80%    { transform:skewX(-1.9deg) scaleX(1.03) scaleY(.98);  opacity:.96; }
  92%    { transform:skewX(1.1deg)  scaleX(.96)  scaleY(1.03); opacity:.95; }
}
@keyframes dsFlk3 {
  0%,100%{ transform:skewX(0deg)    scaleX(1.00) scaleY(1.00); opacity:1.00; }
  8%     { transform:skewX(2.9deg)  scaleX(.87)  scaleY(1.12); opacity:.90; }
  20%    { transform:skewX(-2.0deg) scaleX(1.06) scaleY(.95);  opacity:.97; }
  35%    { transform:skewX(1.5deg)  scaleX(.94)  scaleY(1.06); opacity:.95; }
  50%    { transform:skewX(-3.0deg) scaleX(1.08) scaleY(.92);  opacity:.98; }
  65%    { transform:skewX(2.4deg)  scaleX(.89)  scaleY(1.10); opacity:.91; }
  78%    { transform:skewX(-1.6deg) scaleX(1.04) scaleY(.97);  opacity:.96; }
  90%    { transform:skewX(0.8deg)  scaleX(.97)  scaleY(1.02); opacity:.95; }
}
@keyframes dsGlw {
  0%,100%{ opacity:.35; }
  50%    { opacity:.60; }
}
`;

function ensureAnim() {
  if (!document.getElementById(ANIM_ID)) {
    const s = document.createElement('style');
    s.id = ANIM_ID;
    s.textContent = ANIM_CSS;
    document.head.appendChild(s);
  }
}

/* ── Outer teardrop flame path, base at origin, tip pointing up (−Y) ── */
function flamePath(H, W) {
  return (
    `M0,0` +
    ` C${W*.55},-${H*.25} ${W},-${H*.52} ${W*.60},-${H*.78}` +
    ` C${W*.30},-${H*.92} 0,-${H} 0,-${H}` +
    ` C0,-${H} -${W*.30},-${H*.92} -${W*.60},-${H*.78}` +
    ` C-${W},-${H*.52} -${W*.55},-${H*.25} 0,0 Z`
  );
}
/* ── Bright inner core flame path ── */
function innerPath(H, W) {
  const iH = H * .70, iW = W * .50;
  return (
    `M0,0` +
    ` C${iW*.50},-${iH*.25} ${iW},-${iH*.55} ${iW*.55},-${iH*.82}` +
    ` C${iW*.25},-${iH*.94} 0,-${iH} 0,-${iH}` +
    ` C0,-${iH} -${iW*.25},-${iH*.94} -${iW*.55},-${iH*.82}` +
    ` C-${iW},-${iH*.55} -${iW*.50},-${iH*.25} 0,0 Z`
  );
}

/* ── Single Flame: positioned in the parent SVG's coordinate space ── */
function Flame({ id, x, y, scale, dur, delay, anim }) {
  const p  = `dsf${id}`;
  const H  = 92 * scale;    // total flame height (SVG px)
  const W  = 21 * scale;    // max half-width

  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <linearGradient id={`${p}fo`} x1=".5" y1={0} x2=".5" y2={-H}
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#BB1F00" stopOpacity=".88"/>
          <stop offset="14%"  stopColor="#FF4E00"/>
          <stop offset="36%"  stopColor="#FFA500"/>
          <stop offset="63%"  stopColor="#FFE050"/>
          <stop offset="88%"  stopColor="#FFF8C0" stopOpacity=".65"/>
          <stop offset="100%" stopColor="#FFFFFF"  stopOpacity=".10"/>
        </linearGradient>
        <linearGradient id={`${p}fi`} x1=".5" y1={0} x2=".5" y2={-H * .70}
          gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FF8000"/>
          <stop offset="24%"  stopColor="#FFD000"/>
          <stop offset="58%"  stopColor="#FFF3A8"/>
          <stop offset="100%" stopColor="#FFFFFF"/>
        </linearGradient>
        <radialGradient id={`${p}halo`} cx="50%" cy="75%" r="50%">
          <stop offset="0%"   stopColor="#FFA500" stopOpacity=".52"/>
          <stop offset="48%"  stopColor="#FF7700" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#FF3300" stopOpacity="0"/>
        </radialGradient>
        <filter id={`${p}blm`} x="-90%" y="-70%" width="280%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={3.8 * scale} result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Pulsing warm ambient glow */}
      <ellipse
        cx="0" cy={-H * .32} rx={W * 2.4} ry={H * .52}
        fill={`url(#${p}halo)`}
        style={{ animation: `dsGlw ${dur} ease-in-out infinite`, animationDelay: delay }}
      />

      {/* Flickering flame group */}
      <g style={{
        animation:       `${anim} ${dur} ease-in-out infinite`,
        animationDelay:  delay,
        transformOrigin: '0px 0px',
      }}>
        {/* Outer flame with glow bloom */}
        <path d={flamePath(H, W)} fill={`url(#${p}fo)`} filter={`url(#${p}blm)`}/>
        {/* Bright inner core */}
        <path d={innerPath(H, W)} fill={`url(#${p}fi)`}/>
        {/* White-hot wick hotspot */}
        <ellipse cx="0" cy={-H * .155} rx={W * .28} ry={H * .105} fill="white" opacity=".94"/>
        <ellipse cx="0" cy={-H * .075} rx={W * .15} ry={H * .065} fill="white"/>
      </g>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════
   DEFAULT EXPORT — diya PNG + flame overlays + credit
   ═══════════════════════════════════════════════════════ */
export default function DiyaSection() {
  useEffect(() => { ensureAnim(); }, []);

  return (
    <div
      aria-label="Three ornate Diwali diyas"
      style={{
        position:      'absolute',
        bottom:        '2.5vh',
        left:          '50%',
        transform:     'translateX(-50%)',
        zIndex:        8,
        width:         'min(92vw, 600px)',
        pointerEvents: 'none',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '6px',
      }}
    >
      {/* ─── Image + SVG flame overlay wrapper ─── */}
      <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>

        {/* Original PNG — mix-blend-mode:screen makes white bg invisible */}
        <img
          src="/diyas.png"
          alt=""
          aria-hidden="true"
          style={{
            display:      'block',
            width:        '100%',
            height:       'auto',
            objectFit:    'contain',
            mixBlendMode: 'screen',
            userSelect:   'none',
          }}
        />

        {/* SVG overlay — coordinate system matches PNG pixel dimensions */}
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            position:      'absolute',
            top:           0,
            left:          0,
            width:         '100%',
            height:        '100%',
            overflow:      'visible',
            pointerEvents: 'none',
          }}
        >
          {WICKS.map((w, i) => (
            <Flame key={i} id={i} {...w} />
          ))}
        </svg>
      </div>

      {/* ─── Creator credit ─── */}
      <p
        style={{
          margin:        '0',
          padding:       '0',
          fontFamily:    "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
          fontSize:      'clamp(0.68rem, 1.7vw, 0.88rem)',
          fontStyle:     'italic',
          fontWeight:    400,
          letterSpacing: '0.06em',
          color:         'rgba(255, 215, 80, 0.78)',
          textShadow:    '0 0 10px rgba(255,200,50,0.42), 0 0 22px rgba(255,155,0,0.18)',
          textAlign:     'center',
          userSelect:    'none',
          lineHeight:    1.4,
        }}
      >
        Created by Rushikesh Kawadkar
      </p>
    </div>
  );
}
