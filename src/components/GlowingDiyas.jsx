import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// GLOWING DIYAS — Realistic Clay Oil Lamps with Animated Flames
// ═══════════════════════════════════════════════════════════════

function Diya({ x, y, scale=1, fd='0s', gd='0s', fd2='0.3s', lit=false, onClick }) {
  const s = scale;
  // Bowl is wide (80px) and shallow (32px) at scale=1
  const bw = 80*s, bh = 32*s;

  return (
    <g
      transform={`translate(${x},${y})`}
      aria-hidden="true"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >

      {/* ── INTERACTIVE GLOW BURST (visible when lit) ── */}
      {lit && (
        <ellipse cx="0" cy={bh*0.4} rx={bw*1.2} ry={bh*2.4}
          fill="rgba(255,170,40,0.22)"
          className="diya-burst-glow"/>
      )}
      {lit && (
        <ellipse cx={bw*0.38} cy={-20} rx={22} ry={32}
          fill="rgba(255,220,80,0.28)"
          className="diya-burst-glow"/>
      )}

      {/* ── GROUND GLOW ── */}
      <ellipse cx="0" cy={bh*0.9+4} rx={bw*0.75} ry="10"
        fill="rgba(255,160,40,0.16)"
        filter="url(#dg-blr)"
        style={{animation:`diya-glow-pulse 2.5s ${gd} ease-in-out infinite`}}/>

      {/* ── DIYA BODY — terracotta clay bowl ── */}
      {/* Outer body shadow */}
      <path
        d={`M ${-bw/2+2} 4
            C ${-bw/2+2} ${bh*0.55} ${-bw*0.35} ${bh*0.9} 0 ${bh+2}
            C ${bw*0.35} ${bh*0.9} ${bw/2-2} ${bh*0.55} ${bw/2-2} 4
            L ${bw*0.08} ${-bh*0.22} L ${-bw*0.08} ${-bh*0.22} Z`}
        fill="rgba(30,10,0,0.5)"/>
      {/* Main bowl */}
      <path
        d={`M ${-bw/2} 2
            C ${-bw/2} ${bh*0.5} ${-bw*0.35} ${bh*0.88} 0 ${bh}
            C ${bw*0.35} ${bh*0.88} ${bw/2} ${bh*0.5} ${bw/2} 2
            L ${bw*0.08} ${-bh*0.2} L ${-bw*0.08} ${-bh*0.2} Z`}
        fill="url(#diya-clay)"/>
      {/* Rim highlight band */}
      <path
        d={`M ${-bw/2} 2 L ${bw*0.08} ${-bh*0.2} L ${-bw*0.08} ${-bh*0.2} Z`}
        fill="url(#diya-rim-top)"/>
      {/* Bowl front face sheen */}
      <ellipse cx={-bw*0.12} cy={bh*0.35}
        rx={bw*0.12} ry={bh*0.18}
        fill="rgba(255,200,100,0.14)" transform="rotate(-20,-10,0)"/>

      {/* ── RIM ELLIPSE (top opening of bowl) ── */}
      <ellipse cx="0" cy="2" rx={bw/2} ry={bh*0.16}
        fill="none" stroke="#D9A441" strokeWidth="1.6" strokeOpacity="0.9"/>
      {/* Inner rim shadow */}
      <ellipse cx="0" cy="3" rx={bw*0.4} ry={bh*0.12}
        fill="rgba(50,15,0,0.45)"/>
      {/* Oil surface shimmer */}
      <ellipse cx={-bw*0.08} cy="1" rx={bw*0.22} ry={bh*0.07}
        fill="rgba(255,210,80,0.30)"/>

      {/* ── DECORATIVE RIM DETAILS ── */}
      {/* Thin gold pinstripe */}
      <ellipse cx="0" cy="2" rx={bw/2-2} ry={bh*0.14}
        fill="none" stroke="#F5D58A" strokeWidth="0.6" strokeOpacity="0.6"/>
      {/* Terracotta band with dots */}
      <ellipse cx="0" cy="4" rx={bw/2+1} ry={bh*0.18}
        fill="none" stroke="#A05020" strokeWidth="3" strokeOpacity="0.45"/>
      {[-28,-16,-6,6,16,28].map((dx,i)=>(
        <circle key={i} cx={dx*s} cy="2" r="1.4"
          fill="#D9A441" fillOpacity="0.7"/>
      ))}

      {/* ── BODY TEXTURE LINES ── */}
      {[-1,0,1].map((k,i)=>{
        const wx=(bw/2-6)*0.9;
        return <path key={i}
          d={`M ${-wx*0.6+k*8} 12 Q ${k*4} ${bh*0.55} ${-k*6} ${bh*0.82}`}
          fill="none" stroke="rgba(100,40,0,0.25)" strokeWidth="0.8"/>;
      })}

      {/* ── SPOUT / WICK HOLDER ── */}
      <path
        d={`M ${bw*0.28} -2 Q ${bw*0.52} 0 ${bw*0.44} 6 Q ${bw*0.38} 10 ${bw*0.3} 8`}
        fill="url(#diya-clay)" stroke="#A05020" strokeWidth="0.8"/>

      {/* ── WICK ── */}
      <path d={`M ${bw*0.37} 3 C ${bw*0.40} -2 ${bw*0.42} -8 ${bw*0.38} -18`}
        fill="none" stroke="#3C1A00" strokeWidth="2.2"
        strokeLinecap="round"/>
      {/* Wick glow */}
      <path d={`M ${bw*0.37} 3 C ${bw*0.40} -2 ${bw*0.42} -8 ${bw*0.38} -18`}
        fill="none" stroke="rgba(255,150,30,0.3)" strokeWidth="4"
        strokeLinecap="round"/>

      {/* ── FLAME GROUP ── */}
      <g transform={`translate(${bw*0.38},-20)`}
        style={{transformOrigin:'0 0', animation:`flame-flicker 1.3s ${fd} ease-in-out infinite`}}>
        {/* Layer 1 — outermost ambient glow (CSS animated separately) */}
        <ellipse cx="0" cy="-10" rx="14" ry="22"
          fill="rgba(255,100,10,0.12)"
          style={{animation:`diya-glow-pulse 1.9s ${fd2} ease-in-out infinite`}}/>
        {/* Layer 2 — outer orange flame body */}
        <path d="M -7 0 C -11 -10 -6 -24 0 -34 C 6 -24 11 -10 7 0 C 5 5 -5 5 -7 0 Z"
          fill="rgba(255,100,15,0.80)"/>
        {/* Layer 3 — mid amber-yellow */}
        <path d="M -5 0 C -8 -9 -4 -21 0 -30 C 4 -21 8 -9 5 0 C 3.5 4 -3.5 4 -5 0 Z"
          fill="rgba(255,185,20,0.90)"/>
        {/* Layer 4 — inner bright yellow */}
        <path d="M -3 0 C -5 -8 -2 -17 0 -24 C 2 -17 5 -8 3 0 C 2 3 -2 3 -3 0 Z"
          fill="rgba(255,230,60,0.95)"/>
        {/* Layer 5 — core white-gold */}
        <path d="M -1.5 0 C -2.5 -6 -1 -13 0 -18 C 1 -13 2.5 -6 1.5 0 C 1 2 -1 2 -1.5 0 Z"
          fill="#FFF8CC" fillOpacity="0.97"/>
        {/* Flame tip bright point */}
        <circle cx="0" cy="-19" r="2.2"
          fill="white" fillOpacity="0.85"/>
        <circle cx="0" cy="-19" r="1"
          fill="white" fillOpacity="1"/>
      </g>

      {/* ── WARM LIGHT ON BOWL (near flame) ── */}
      <ellipse cx={bw*0.25} cy="-4" rx="18" ry="12"
        fill="rgba(255,170,40,0.14)"
        style={{animation:`diya-glow-pulse 1.5s ${gd} ease-in-out infinite`}}/>

    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
export default function GlowingDiyas() {
  const [vw, setVw] = useState(1440);
  const [litDiya, setLitDiya] = useState(null); // index 0-3 or null
  const timerRef = useRef(null);

  useEffect(()=>{
    setVw(window.innerWidth);
    const h=()=>setVw(window.innerWidth);
    window.addEventListener('resize',h);
    return ()=>window.removeEventListener('resize',h);
  },[]);

  const handleDiyaClick = useCallback((index) => {
    setLitDiya(index);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLitDiya(null), 2200);
  }, []);

  // Anchor diyas at a fixed Y inside the SVG coordinate space
  // SVG viewBox height = 160, diyas drawn at y=120 so bowl bottom ~152
  const vbH = 160;

  return (
    <div className="diyas-layer" role="group" aria-label="Decorative Diyas - click to brighten">
      <svg
        viewBox={`0 0 ${vw} ${vbH}`}
        preserveAspectRatio="xMidYMax meet"
        style={{
          position:'absolute', bottom:0, left:0,
          width:'100%', height:'auto',
          minHeight:'110px', maxHeight:'160px',
          overflow:'visible',
        }}>
        <defs>
          {/* Clay body gradient — terracotta */}
          <linearGradient id="diya-clay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#C8722A"/>
            <stop offset="30%"  stopColor="#A8521A"/>
            <stop offset="65%"  stopColor="#7A3510"/>
            <stop offset="100%" stopColor="#4A1E06"/>
          </linearGradient>

          {/* Rim top highlight */}
          <linearGradient id="diya-rim-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#E8A040" stopOpacity="0.85"/>
            <stop offset="100%" stopColor="#8B4500" stopOpacity="0.4"/>
          </linearGradient>

          {/* Glow blur */}
          <filter id="dg-blr" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10"/>
          </filter>
        </defs>

        {/* ── LEFT pair ── */}
        <Diya x={vw*0.038} y={118} scale={0.82} fd="0s"   gd="0.4s" fd2="0.2s" lit={litDiya===0} onClick={()=>handleDiyaClick(0)}/>
        <Diya x={vw*0.092} y={126} scale={0.96} fd="0.45s" gd="0.9s" fd2="0.7s" lit={litDiya===1} onClick={()=>handleDiyaClick(1)}/>

        {/* ── RIGHT pair ── */}
        <Diya x={vw*0.908} y={126} scale={0.96} fd="0.25s" gd="0.6s" fd2="0.1s" lit={litDiya===2} onClick={()=>handleDiyaClick(2)}/>
        <Diya x={vw*0.962} y={118} scale={0.82} fd="0.65s" gd="0.2s" fd2="0.9s" lit={litDiya===3} onClick={()=>handleDiyaClick(3)}/>
      </svg>
    </div>
  );
}
