# Diwali Night Sky Background Preview

A standalone, full-screen, premium animated Diwali night sky background built with **React + Vite**.

## Features

- 🌠 **180–300 golden stars** — four-point sparkle stars + round star points, all independently twinkling
- 🎆 **Live golden fireworks** — rockets with trails, chrysanthemum/double/sparkle explosions with particle physics
- 🏮 **Two ornate Akash Kandils** — detailed multi-faceted SVG lanterns, upper-left and upper-right, gently swaying
- 🪔 **Four realistic diyas** — clay bowl bodies, layered flames (orange→yellow→white core), flickering
- 🎨 **Midnight-purple to deep indigo sky** with warm golden atmospheric glow
- ⚡ **Single `requestAnimationFrame` loop**, delta-time movement, auto particle cleanup
- 📱 **Fully responsive** — adapts from 320px to 4K, proportional scaling throughout
- ♿ **Respects `prefers-reduced-motion`** (stars still twinkle, fireworks pause)

## Quick Start

```bash
npm install
npm run dev
```

Preview: **http://localhost:5173/**

## Project Structure

```
src/
  App.jsx                   — Root layout (sky + layers)
  main.jsx                  — React entry point
  styles.css                — Global styles + CSS animations
  components/
    DiwaliCanvas.jsx        — Stars, rockets, fireworks (Canvas)
    AkashKandils.jsx        — Two detailed SVG Kandils with swing
    GlowingDiyas.jsx        — SVG diyas with flickering flames
index.html
```
