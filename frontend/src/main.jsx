import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './posthog.js'
import App from './App.jsx'

// Registers the offline-fallback service worker (public/sw.js). It only
// takes effect on a later visit, after this first successful load caches
// the offline page - see sw.js for why that's an unavoidable web platform
// limit, not a bug.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)