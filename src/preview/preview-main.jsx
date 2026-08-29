import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import PreviewApp from './PreviewApp'
import { TrialProvider } from '../context/TrialContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TrialProvider><PreviewApp /></TrialProvider>
  </StrictMode>,
)
