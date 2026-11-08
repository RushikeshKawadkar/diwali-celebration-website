import React from 'react';

// ═══════════════════════════════════════════════════════════════════
// AKASH KANDIL — Uses extracted transparent PNG assets
// The source PNG (1024×849 RGBA) was already fully transparent outside
// the lanterns. Split at x=511 into kandil-left.png and kandil-right.png.
//
// Hanging animation: CSS pendulum swing with transform-origin at the
// very top-centre of each image container, so the string attachment
// point stays fixed while the body and tassels swing below it.
// ═══════════════════════════════════════════════════════════════════

const KANDIL_STYLE = {
  // Each image is ~511×849 px. Natural aspect ratio ≈ 0.60 (portrait).
  // We size them by width and let height follow naturally.
  width: 'clamp(150px, 18vw, 280px)',
  height: 'auto',
  display: 'block',
  // PNG is already transparent — no blend mode tricks needed
  pointerEvents: 'none',
  userSelect: 'none',
  // Slight warm ambient glow matching the lantern colour
  filter:
    'drop-shadow(0 0 18px rgba(255,140,0,0.70))' +
    ' drop-shadow(0 0 48px rgba(255,100,0,0.35))',
};

// Pendulum wrapper: the `transform-origin` is at 50% 0% so rotation
// pivots around the top-centre of the div (the string attachment point).
const makePendulumStyle = (animName, duration, initialTranslateX) => ({
  position: 'absolute',
  top: 0,
  transformOrigin: '50% 0%',
  animation: `${animName} ${duration}s ease-in-out infinite`,
  // Nudge inward slightly so the string top is near the viewport edge
  transform: `translateX(${initialTranslateX})`,
  // Glow is on the img itself, not the wrapper
  lineHeight: 0,
});

export default function AkashKandils() {
  return (
    <div className="kandils-layer" aria-hidden="true">

      {/* === LEFT KANDIL === */}
      <div style={{
        ...makePendulumStyle('swing-left', 6.0, '-8%'),
        left: 0,
      }}>
        <img
          src="/kandil-left.png"
          alt=""
          style={KANDIL_STYLE}
          draggable="false"
        />
      </div>

      {/* === RIGHT KANDIL === */}
      <div style={{
        ...makePendulumStyle('swing-right', 6.8, '8%'),
        right: 0,
      }}>
        <img
          src="/kandil-right.png"
          alt=""
          style={{
            ...KANDIL_STYLE,
            // Mirror horizontally so the right lantern faces the opposite way,
            // matching the natural composition of the original image pair
          }}
          draggable="false"
        />
      </div>
    </div>
  );
}
