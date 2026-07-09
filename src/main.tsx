import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 页面加载前同步应用主题，避免闪烁
try {
  const saved = localStorage.getItem('challenge-theme');
  const isLight =
    saved === 'light' ||
    (saved === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  if (isLight) {
    document.documentElement.classList.add('light');
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
