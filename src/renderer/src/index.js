console.log('[Renderer] index.js entry point');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MedicconProvider } from './store/globalStore';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <MedicconProvider>
      <App />
    </MedicconProvider>
  );
  console.log('[Renderer] App rendered');
} catch (error) {
  console.error('[Renderer] Fatal error:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red;">
      <h1>Render Error</h1>
      <pre>${error.stack}</pre>
    </div>
  `;
}
