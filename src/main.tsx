import './utils/cleanConsole';
import './utils/safeEncoding';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './utils/safeStorage';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

