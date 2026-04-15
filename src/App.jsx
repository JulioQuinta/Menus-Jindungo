console.log("APP.JSX: SCRIPT LOADED");
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPWA from './components/InstallPWA';
import Router from './Router';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <>
        {isOffline && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-1.5 z-[9999] text-xs font-bold uppercase tracking-widest animate-pulse shadow-md flex items-center justify-center gap-2">
            <span>⚠️ SEM LIGAÇÃO À INTERNET - MODO OFFLINE ATIVO</span>
          </div>
        )}
        <InstallPWA />
        <SettingsProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <Router />
          </AuthProvider>
        </SettingsProvider>
      </>
    </ErrorBoundary>
  );
}

export default App;
