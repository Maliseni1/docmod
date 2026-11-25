import React from 'react';

export default function Footer() {
  return (
    <footer className="docmod-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/docmod.png" alt="DocMod" className="footer-logo" />
          <span className="footer-brand-name">DocMod</span>
        </div>
        <div className="footer-divider" />
        <div className="footer-credits">
          <p className="footer-made-by">Powered by</p>
          <p className="footer-company">Chiza Labs</p>
        </div>
      </div>
    </footer>
  );
}