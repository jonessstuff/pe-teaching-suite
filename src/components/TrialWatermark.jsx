import { useTrial } from '../context/TrialContext'
import { WATERMARK_TEXT } from '../services/trialService'

// Print-only footer. Hidden on screen (see .trial-watermark in index.css),
// rendered fixed at the bottom of every printed page. Covers all
// window.print() export paths app-wide with a single element.
export default function TrialWatermark() {
  const { isPaid } = useTrial()
  if (isPaid) return null
  return <div className="trial-watermark">{WATERMARK_TEXT}</div>
}
