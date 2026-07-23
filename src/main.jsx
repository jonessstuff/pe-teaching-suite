import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Service worker registration (autoUpdate). With skipWaiting + clientsClaim in
// the generated SW, registerSW reloads the page automatically once a new SW
// takes control — so a fresh build's module list replaces the cached one.
//
// The gap this closes: a standalone mobile PWA can stay open for days (or sit
// backgrounded), and the browser won't check for a new SW on its own. We force
// that check on an interval and whenever the app regains focus, so new modules
// show up without a reinstall or manual cache clear.
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      const checkForUpdate = () => {
        // Only ping the server when we're actually online.
        if (navigator.onLine === false) return
        registration.update().catch(() => {})
      }

      // Hourly poll while the app stays open.
      setInterval(checkForUpdate, 60 * 60 * 1000)

      // And an immediate check each time the PWA returns to the foreground —
      // the common case after being backgrounded on mobile.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
      window.addEventListener('focus', checkForUpdate)
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
