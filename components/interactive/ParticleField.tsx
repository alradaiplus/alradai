'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

/**
 * Subtle gold particle field for the hero background.
 * Kept low-density on purpose — it should whisper, not shout.
 */
export default function ParticleField() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options: ISourceOptions = {
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: { value: 46, density: { enable: true, width: 1200 } },
      color: { value: ['#D4A843', '#F5E9C2'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.15, max: 0.6 },
        animation: { enable: true, speed: 0.4, sync: false },
      },
      size: { value: { min: 0.6, max: 1.8 } },
      move: {
        enable: true,
        speed: 0.35,
        direction: 'none',
        random: true,
        straight: false,
        outModes: { default: 'out' },
      },
      links: {
        enable: true,
        color: '#D4A843',
        distance: 140,
        opacity: 0.08,
        width: 1,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
        resize: { enable: true },
      },
      modes: {
        grab: {
          distance: 180,
          links: { opacity: 0.25 },
        },
      },
    },
  };

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0"
    />
  );
}
