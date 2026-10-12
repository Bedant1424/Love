import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import OwnerApp from './OwnerApp';
import './styles/globals.css';

export const Root: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Determine if running in owner administration mode:
  // 1. Single-domain route: /admin or /admin/*
  // 2. Rollback domain: hostname includes 'owner' (e.g. nagarjuna-traders-owner.pages.dev)
  // 3. Environment or query parameter overrides: VITE_APP_MODE=owner or ?mode=owner
  const isOwnerPortal =
    import.meta.env.VITE_APP_MODE === 'owner' ||
    (typeof window !== 'undefined' &&
      (currentPath === '/admin' ||
        currentPath.startsWith('/admin/') ||
        window.location.hostname.includes('owner') ||
        window.location.search.includes('mode=owner')));

  return isOwnerPortal ? <OwnerApp /> : <App />;
};

const rootElement = typeof document !== 'undefined' ? document.getElementById('root') : null;
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}

export default Root;
