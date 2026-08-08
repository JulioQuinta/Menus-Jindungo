import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const isElectron = window.navigator.userAgent.toLowerCase().includes('electron') || window.location.protocol === 'file:';
const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>,
)
