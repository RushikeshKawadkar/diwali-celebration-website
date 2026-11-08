import React, { useState } from 'react';
import DiwaliCanvas    from './components/DiwaliCanvas';
import AkashKandils    from './components/AkashKandils';
import GoldenParticles from './components/GoldenParticles';
import DiwaliGreeting  from './components/DiwaliGreeting';
import WishesPanel     from './components/WishesPanel';
import './styles.css';

export default function App() {
  const [customName, setCustomName] = useState('');

  return (
    <div className="night-sky">
      {/* Layer 1: Atmospheric colour overlay */}
      <div className="atmosphere" />

      {/* Layer 2: Stars, rockets, fireworks canvas – click-to-burst */}
      <DiwaliCanvas />

      {/* Layer 3: Floating golden ambient particles (z:3) */}
      <GoldenParticles />

      {/* Layer 5: Akash Kandils (z:5) */}
      <AkashKandils />

      {/* Layer 25: Center overlay – greeting and name input */}
      <div className="center-overlay" aria-label="Diwali Celebration Controls">
        <DiwaliGreeting customName={customName} />
        <WishesPanel onNameChange={setCustomName} />
      </div>

      {/* Creator credit – fixed bottom-centre */}
      <p
        aria-label="Creator credit"
        style={{
          position:      'fixed',
          bottom:        '10px',
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        26,
          margin:        0,
          padding:       0,
          fontFamily:    "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
          fontSize:      'clamp(0.62rem, 1.5vw, 0.82rem)',
          fontStyle:     'italic',
          fontWeight:    400,
          letterSpacing: '0.06em',
          color:         'rgba(255, 215, 80, 0.72)',
          textShadow:    '0 0 10px rgba(255,200,50,0.38), 0 0 20px rgba(255,150,0,0.15)',
          textAlign:     'center',
          pointerEvents: 'none',
          userSelect:    'none',
          whiteSpace:    'nowrap',
        }}
      >
        Created by Rushikesh Kawadkar
      </p>
    </div>
  );
}
