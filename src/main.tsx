import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './game/store'
import './styles.css'

// Reste der alten Spukify-App (Service Worker) entfernen
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
