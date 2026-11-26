import React, { useEffect, useState } from 'react';
import { DocumentIcon, ImageIcon } from './icons';

// Illustrative only - kept to pairs the app can actually convert right now,
// so the hero never promises something the converter below can't do.
// Colors are each format's own conventional "signature" color, not the
// app's single accent - just for this animation, to make formats instantly
// recognizable at a glance.
const CONVERSION_PAIRS = [
  { from: 'PNG', to: 'WEBP', FromIcon: ImageIcon, ToIcon: ImageIcon, fromColor: '#2F8F5B', toColor: '#1B8A9E' },
  { from: 'DOCX', to: 'HTML', FromIcon: DocumentIcon, ToIcon: DocumentIcon, fromColor: '#2B579C', toColor: '#E2572B' },
  { from: 'JPG', to: 'AVIF', FromIcon: ImageIcon, ToIcon: ImageIcon, fromColor: '#D98C2B', toColor: '#7D4F9E' }
];

const CYCLE_MS = 2600;

export default function HeroSection() {
  const [pairIndex, setPairIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPairIndex(i => (i + 1) % CONVERSION_PAIRS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const { from, to, FromIcon, ToIcon, fromColor, toColor } = CONVERSION_PAIRS[pairIndex];

  return (
    <section className="hero-section">
      <div className="hero-row">
        <div className="hero-text">
          <div className="hero-badge">
            Smart File Converter
          </div>

          <h1 className="hero-title">
            Convert anything.
            <br />
            <span className="hero-title-accent">Effortlessly.</span>
          </h1>

          <p className="hero-subtitle">
            DocMod detects your file type and serves only the conversions that make sense.
          </p>
        </div>

        <div className="hero-animation" aria-hidden="true">
          <div className="hero-visual" key={pairIndex}>
            <div className="hero-file hero-file-from">
              <span className="hero-file-icon" style={{ color: fromColor }}><FromIcon /></span>
              <span className="hero-file-ext">{from}</span>
            </div>
            <div className="hero-arrow">
              <div className="hero-arrow-line">
                <div className="hero-arrow-pulse" />
              </div>
              <div className="hero-arrow-head" />
            </div>
            <div className="hero-file hero-file-to">
              <span className="hero-file-icon" style={{ color: toColor }}><ToIcon /></span>
              <span className="hero-file-ext">{to}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
