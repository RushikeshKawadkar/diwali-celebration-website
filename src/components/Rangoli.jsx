import React from 'react';

// ═══════════════════════════════════════════════════════════════
// RANGOLI — SVG geometric mandala, bottom-centre, z-index:5
// Drawn with CSS stroke-dashoffset animation for a "being drawn" effect.
// Uses gold, amber, maroon, deep-purple palette.
// ═══════════════════════════════════════════════════════════════

export default function Rangoli() {
  // The entire rangoli is centred at (0,0) inside a viewBox.
  // We translate the SVG so its centre sits at bottom-centre of the screen.
  return (
    <div className="rangoli-wrap" aria-hidden="true">
      <svg
        className="rangoli-svg"
        viewBox="-160 -160 320 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Warm gold gradient for petals */}
          <radialGradient id="rg-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE566" stopOpacity="0.95"/>
            <stop offset="60%"  stopColor="#D9A441" stopOpacity="0.80"/>
            <stop offset="100%" stopColor="#8B4500" stopOpacity="0.50"/>
          </radialGradient>
          <radialGradient id="rg-ruby" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FF6060" stopOpacity="0.90"/>
            <stop offset="100%" stopColor="#8B0000" stopOpacity="0.55"/>
          </radialGradient>
        </defs>

        {/* ── Layer 0: outer ring — 16 dots ── */}
        {Array.from({length:16}, (_,i) => {
          const a = (i/16)*Math.PI*2;
          return (
            <circle key={`od${i}`}
              cx={Math.cos(a)*148} cy={Math.sin(a)*148}
              r="4" fill="#FFE566" fillOpacity="0.70"
              className="rg-dot-outer"
              style={{animationDelay:`${i*0.06}s`}}
            />
          );
        })}

        {/* ── Layer 1: outermost ring ── */}
        <circle cx="0" cy="0" r="148"
          fill="none" stroke="#D9A441" strokeWidth="1.2"
          strokeOpacity="0.55" className="rg-ring rg-ring-1"/>

        {/* ── Layer 2: 16-petal geometric outer ring ── */}
        {Array.from({length:16}, (_,i) => {
          const a = (i/16)*Math.PI*2;
          const x1 = Math.cos(a)*148, y1 = Math.sin(a)*148;
          const a2 = ((i+1)/16)*Math.PI*2;
          const x2 = Math.cos(a2)*148, y2 = Math.sin(a2)*148;
          return (
            <line key={`sp${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#D9A441" strokeWidth="0.8" strokeOpacity="0.40"
              className="rg-spoke"/>
          );
        })}

        {/* Spokes from centre */}
        {Array.from({length:16}, (_,i) => {
          const a = (i/16)*Math.PI*2;
          return (
            <line key={`csp${i}`}
              x1="0" y1="0"
              x2={Math.cos(a)*145} y2={Math.sin(a)*145}
              stroke="#8B4500" strokeWidth="0.6" strokeOpacity="0.30"
              className="rg-spoke"/>
          );
        })}

        {/* ── Layer 3: second ring ── */}
        <circle cx="0" cy="0" r="115"
          fill="none" stroke="#C0802A" strokeWidth="1.8"
          strokeOpacity="0.60" className="rg-ring rg-ring-2"/>

        {/* 8 large outer petals */}
        {Array.from({length:8}, (_,i) => {
          const a = (i/8)*Math.PI*2;
          const bx = Math.cos(a)*115, by = Math.sin(a)*115;
          const c1x = Math.cos(a - Math.PI/16)*80;
          const c1y = Math.sin(a - Math.PI/16)*80;
          const c2x = Math.cos(a + Math.PI/16)*80;
          const c2y = Math.sin(a + Math.PI/16)*80;
          return (
            <path key={`op${i}`}
              d={`M 0 0 C ${c1x} ${c1y} ${bx*0.85} ${by*0.85} ${bx} ${by} C ${bx*0.85} ${by*0.85} ${c2x} ${c2y} 0 0 Z`}
              fill="url(#rg-gold)" stroke="#D9A441" strokeWidth="0.7"
              className="rg-petal rg-petal-outer"
              style={{animationDelay:`${i*0.08}s`}}
            />
          );
        })}

        {/* ── Layer 4: third ring ── */}
        <circle cx="0" cy="0" r="85"
          fill="none" stroke="#8B1A1A" strokeWidth="1.4"
          strokeOpacity="0.65" className="rg-ring rg-ring-3"/>

        {/* 8 mid petals (offset 22.5°) */}
        {Array.from({length:8}, (_,i) => {
          const a = (i/8)*Math.PI*2 + Math.PI/8;
          const bx = Math.cos(a)*85, by = Math.sin(a)*85;
          const c1x = Math.cos(a - Math.PI/20)*58;
          const c1y = Math.sin(a - Math.PI/20)*58;
          const c2x = Math.cos(a + Math.PI/20)*58;
          const c2y = Math.sin(a + Math.PI/20)*58;
          return (
            <path key={`mp${i}`}
              d={`M 0 0 C ${c1x} ${c1y} ${bx*0.85} ${by*0.85} ${bx} ${by} C ${bx*0.85} ${by*0.85} ${c2x} ${c2y} 0 0 Z`}
              fill="url(#rg-ruby)" stroke="#CC3300" strokeWidth="0.6"
              className="rg-petal rg-petal-mid"
              style={{animationDelay:`${i*0.08 + 0.05}s`}}
            />
          );
        })}

        {/* Mid-ring decorative dots */}
        {Array.from({length:8}, (_,i) => {
          const a = (i/8)*Math.PI*2;
          return (
            <circle key={`md${i}`}
              cx={Math.cos(a)*85} cy={Math.sin(a)*85}
              r="4.5" fill="#FFD700" stroke="#8B4500" strokeWidth="1"
              className="rg-dot-mid"
              style={{animationDelay:`${i*0.08}s`}}
            />
          );
        })}

        {/* ── Layer 5: inner ring ── */}
        <circle cx="0" cy="0" r="55"
          fill="none" stroke="#D9A441" strokeWidth="2"
          strokeOpacity="0.75" className="rg-ring rg-ring-4"/>

        {/* 8 inner petals */}
        {Array.from({length:8}, (_,i) => {
          const a = (i/8)*Math.PI*2;
          const bx = Math.cos(a)*55, by = Math.sin(a)*55;
          const c1x = Math.cos(a - Math.PI/18)*36;
          const c1y = Math.sin(a - Math.PI/18)*36;
          const c2x = Math.cos(a + Math.PI/18)*36;
          const c2y = Math.sin(a + Math.PI/18)*36;
          return (
            <path key={`ip${i}`}
              d={`M 0 0 C ${c1x} ${c1y} ${bx*0.88} ${by*0.88} ${bx} ${by} C ${bx*0.88} ${by*0.88} ${c2x} ${c2y} 0 0 Z`}
              fill="url(#rg-gold)" stroke="#C0802A" strokeWidth="0.5"
              className="rg-petal rg-petal-inner"
              style={{animationDelay:`${i*0.07 + 0.15}s`}}
            />
          );
        })}

        {/* ── Layer 6: diamond accents ── */}
        {Array.from({length:8}, (_,i) => {
          const a = (i/8)*Math.PI*2 + Math.PI/8;
          const r = 55;
          return (
            <circle key={`id${i}`}
              cx={Math.cos(a)*r} cy={Math.sin(a)*r}
              r="3.5" fill="#FF6060" stroke="#8B0000" strokeWidth="0.8"
              className="rg-dot-inner"
            />
          );
        })}

        {/* ── Layer 7: innermost ring + core ── */}
        <circle cx="0" cy="0" r="28"
          fill="rgba(255,200,60,0.12)" stroke="#FFD700" strokeWidth="2.2"
          strokeOpacity="0.85" className="rg-ring rg-ring-5"/>

        {/* 4 tiny inner petals */}
        {Array.from({length:4}, (_,i) => {
          const a = (i/4)*Math.PI*2;
          const bx = Math.cos(a)*28, by = Math.sin(a)*28;
          return (
            <path key={`cp${i}`}
              d={`M 0 0 C ${Math.cos(a-0.4)*18} ${Math.sin(a-0.4)*18} ${bx*0.9} ${by*0.9} ${bx} ${by} C ${bx*0.9} ${by*0.9} ${Math.cos(a+0.4)*18} ${Math.sin(a+0.4)*18} 0 0 Z`}
              fill="#FFE566" fillOpacity="0.80" stroke="#D9A441" strokeWidth="0.5"
              className="rg-petal-core"
            />
          );
        })}

        {/* ── Core circles ── */}
        <circle cx="0" cy="0" r="14"
          fill="rgba(255,180,40,0.25)" stroke="#FFD700" strokeWidth="1.8"
          strokeOpacity="0.90"/>
        <circle cx="0" cy="0" r="7"
          fill="rgba(255,230,80,0.55)" stroke="#FFF0AA" strokeWidth="1.2"/>
        <circle cx="0" cy="0" r="3"
          fill="#FFFBE0" fillOpacity="0.95"/>

        {/* ── Corner accent petals (between outer & mid layers) ── */}
        {Array.from({length:16}, (_,i) => {
          const a = (i/16)*Math.PI*2;
          return (
            <circle key={`accent${i}`}
              cx={Math.cos(a)*100} cy={Math.sin(a)*100}
              r="3" fill="#D9A441" fillOpacity="0.55"
              className="rg-dot-mid"
              style={{animationDelay:`${i*0.04}s`}}
            />
          );
        })}
      </svg>
    </div>
  );
}
