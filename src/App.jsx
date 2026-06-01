console.log("APP.JSX: SCRIPT LOADED");
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPWA from './components/InstallPWA';
import Router from './Router';
import { useNetworkStatus } from './hooks/useNetworkStatus'; // [NEW] QA & Performance

function App() {
  const { isOnline, isSlow } = useNetworkStatus();

  return (
    <ErrorBoundary>
      <>
        {!isOnline && (
          <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-1.5 z-[9999] text-xs font-bold uppercase tracking-widest animate-pulse shadow-md flex items-center justify-center gap-2">
            <span>⚠️ SEM LIGAÇÃO À INTERNET - MODO OFFLINE ATIVO</span>
          </div>
        )}
        {isSlow && isOnline && (
          <div className="fixed top-0 left-0 w-full bg-yellow-600 text-black text-center py-1 z-[9999] text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center justify-center gap-2">
            <span>⚠️ Ligação à rede lenta detetada</span>
          </div>
        )}
        <InstallPWA />
        <SettingsProvider>
          <AuthProvider>
            <Toaster 
              position="top-right" 
              containerStyle={{ zIndex: 999999 }}
              toastOptions={{
                style: {
                  zIndex: 999999
                }
              }}
            />
            <Router />
          </AuthProvider>
        </SettingsProvider>
      </>
    </ErrorBoundary>
  );
}

export default App;
