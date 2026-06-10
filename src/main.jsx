import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerVietnamyServiceWorker } from './utils/pushNotifications'

function syncAppViewport() {
  const viewport = window.visualViewport
  const width = viewport?.width || window.innerWidth
  const height = viewport?.height || window.innerHeight

  // The root is rendered at --ui-scale via CSS `zoom`, so these px dimensions
  // (consumed by full-bleed containers) must be expressed in the zoomed
  // coordinate space to still fill the real screen.
  const scale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'),
  ) || 1

  document.documentElement.style.setProperty('--app-viewport-width', `${width / scale}px`)
  document.documentElement.style.setProperty('--app-viewport-height', `${height / scale}px`)
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
