import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OwnerApp from './OwnerApp';
import './styles/globals.css';

// Determine if running in owner administration mode
const isOwnerPortal =
  import.meta.env.VITE_APP_MODE === 'owner' ||
  (typeof window !== 'undefined' &&
    (window.location.hostname.includes('owner') ||
      window.location.search.includes('mode=owner')));

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isOwnerPortal ? <OwnerApp /> : <App />}
  </React.StrictMode>
);
