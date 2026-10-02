import './utils/cleanConsole';
import './utils/safeEncoding';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './utils/safeStorage';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';

// Register PWA Service Worker for caching, fast loading, and offline reliability
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version is installed and cached
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

