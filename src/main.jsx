import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/themes/tap-chi.css'
import App from './App.jsx'
import { registerVietnamyServiceWorker } from './utils/pushNotifications'
import { applyStoredTheme } from './lib/theme'

function syncAppViewport() {
  const viewport = window.visualViewport
  const width = viewport?.width || window.innerWidth
  const height = viewport?.height || window.innerHeight
  const offsetLeft = viewport?.offsetLeft || 0
  const offsetTop = viewport?.offsetTop || 0

  // The root is rendered at --ui-scale via CSS `zoom`, so these px dimensions
  // (consumed by full-bleed containers) must be expressed in the zoomed
  // coordinate space to still fill the real screen. iOS also moves the visual
  // viewport when the keyboard focuses an input, so mirror that offset onto the
  // fixed app root to keep the UI aligned with the visible screen.
  const scale = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'),
  ) || 1

  document.documentElement.style.setProperty('--app-viewport-width', `${width / scale}px`)
  document.documentElement.style.setProperty('--app-viewport-height', `${height / scale}px`)
  document.documentElement.style.setProperty('--app-viewport-offset-left', `${offsetLeft / scale}px`)
  document.documentElement.style.setProperty('--app-viewport-offset-top', `${offsetTop / scale}px`)
}

syncAppViewport()
window.visualViewport?.addEventListener('resize', syncAppViewport)
window.visualViewport?.addEventListener('scroll', syncAppViewport)
window.addEventListener('resize', syncAppViewport)

applyStoredTheme()

registerVietnamyServiceWorker().catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
