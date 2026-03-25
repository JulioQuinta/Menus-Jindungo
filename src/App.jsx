console.log("APP.JSX: SCRIPT LOADED");
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPWA from './components/InstallPWA';
import Router from './Router';

function App() {
  return (
    <ErrorBoundary>
      <>
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
