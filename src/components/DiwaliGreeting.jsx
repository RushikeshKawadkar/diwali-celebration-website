import React, { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// DIWALI GREETING OVERLAY — centered, top-third of screen
// position:fixed full-viewport, pointer-events:none
// Uses a single absolutely-positioned inner wrapper so the text
// is always horizontally centered and sits in the top quarter,
// regardless of mobile browser chrome / dynamic viewport height.
// ═══════════════════════════════════════════════════════════════

export default function DiwaliGreeting({ customName }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`dg-overlay${visible ? ' dg-visible' : ''}`}
      aria-live="polite"
      aria-label="Diwali Greetings"
    >
      <div className="dg-block">
        <h1 className="dg-title">
          {customName ? `Happy Diwali, ${customName}! 🪔` : 'Happy Diwali 🪔'}
        </h1>
        <p className="dg-subtitle">
          Wishing You a Joyful and Prosperous Diwali!
        </p>
        <div className="dg-stars" aria-hidden="true">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>
      </div>
    </div>
  );
}
