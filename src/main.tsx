import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './game/store'
import './styles.css'
import { ForgeViewer } from './three/lazy'

// Reste der alten Spukify-App (Service Worker) entfernen
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      {location.hash === '#schmiede' ? (
        <Suspense fallback={null}>
          <ForgeViewer />
        </Suspense>
      ) : (
        <App />
      )}
    </StoreProvider>
  </StrictMode>,
)
