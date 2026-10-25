import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Auto-reload on new service worker version to bust stale PWA cache instantly
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>,
)
