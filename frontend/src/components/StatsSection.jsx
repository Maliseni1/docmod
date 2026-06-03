import React, { useState, useEffect, useRef } from 'react';

const BASE_COUNT = 1000;

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();
    startRef.current = startTime;

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export default function StatsSection() {
  const count = useCountUp(BASE_COUNT, 2200);

  return (
    <section className="stats-section">
      <div className="stats-card">
        <div className="stats-icon">⚡</div>
        <div className="stats-number">
          {count.toLocaleString()}
          <span className="stats-plus">+</span>
        </div>
        <div className="stats-label">Conversions Performed</div>
        <div className="stats-sublabel">Trusted by creators worldwide</div>
      </div>
    </section>
  );
}