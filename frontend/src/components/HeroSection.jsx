import React from 'react';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-blob hero-blob-1" />
      <div className="hero-blob hero-blob-2" />
      <div className="hero-blob hero-blob-3" />
      
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Smart File Converter
        </div>
        
        <h1 className="hero-title">
          Convert anything.
          <br />
          <span className="hero-title-accent">Effortlessly.</span>
        </h1>
        
        <p className="hero-subtitle">
          DocMod detects your file type and serves only the conversions that make sense. 
          No clutter. No confusion. Just results.
        </p>
        
        <div className="hero-visual">
          <div className="hero-file hero-file-from">
            <span className="hero-file-icon">📄</span>
            <span className="hero-file-ext">PDF</span>
          </div>
          <div className="hero-arrow">
            <div className="hero-arrow-line" />
            <div className="hero-arrow-head" />
          </div>
          <div className="hero-file hero-file-to">
            <span className="hero-file-icon">🖼️</span>
            <span className="hero-file-ext">PNG</span>
          </div>
        </div>
      </div>
      
      <div className="hero-scroll-hint">
        <div className="hero-scroll-mouse">
          <div className="hero-scroll-wheel" />
        </div>
      </div>
    </section>
  );
}