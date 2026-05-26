import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerVietnamyServiceWorker } from './utils/pushNotifications'

function syncAppViewport() {
  const viewport = window.visualViewport
  const width = viewport?.width || window.innerWidth
  const height = viewport?.height || window.innerHeight

  document.documentElement.style.setProperty('--app-viewport-width', `${width}px`)
  document.documentElement.style.setProperty('--app-viewport-height', `${height}px`)
}

syncAppViewport()
window.visualViewport?.addEventListener('resize', syncAppViewport)
window.visualViewport?.addEventListener('scroll', syncAppViewport)
window.addEventListener('resize', syncAppViewport)

registerVietnamyServiceWorker().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
