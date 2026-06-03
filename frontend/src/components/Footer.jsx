import React from 'react';

export default function Footer() {
  return (
    <footer className="docmod-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/src/assets/docmod.png" alt="DocMod" className="footer-logo" />
          <span className="footer-brand-name">DocMod</span>
        </div>
        <div className="footer-divider" />
        <div className="footer-credits">
          <p className="footer-made-by">Powered by</p>
          <p className="footer-company">Chiza Labs</p>
        </div>
        <div className="footer-divider" />
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy</a>
          <span className="footer-dot">·</span>
          <a href="#" className="footer-link">Terms</a>
          <span className="footer-dot">·</span>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
      <div className="footer-glow" />
    </footer>
  );
}
