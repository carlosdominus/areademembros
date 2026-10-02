// Proteção global contra serialização de estruturas circulares (Web Components do VTurb / LitElement)
const originalStringify = JSON.stringify;
JSON.stringify = function (value: any, replacer?: any, space?: any) {
  const seen = new WeakSet();
  const safeReplacer = (key: string, val: any) => {
    if (typeof val === 'object' && val !== null) {
      if (val instanceof Node || val instanceof Window) {
        return `[DOM Node]`;
      }
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    if (typeof replacer === 'function') {
      return replacer(key, val);
    }
    return val;
  };
  try {
    return originalStringify.call(this, value, typeof replacer === 'function' ? safeReplacer : (replacer || safeReplacer), space);
  } catch {
    return '"{}"';
  }
};

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/cacheService';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

