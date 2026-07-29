import { useTrial } from '../context/TrialContext'
import { WATERMARK_TEXT } from '../services/trialService'

// Trial watermark. On screen it renders as a subtle notice (so a trial user
// KNOWS before printing that their exports are watermarked and that upgrading
// removes it); in print it becomes a fixed footer on every page (see
// .trial-watermark in index.css). One element covers all window.print()
// export paths app-wide. Never shown to paid users.
export default function TrialWatermark() {
  const { isPaid } = useTrial()
  if (isPaid) return null
  return <div className="trial-watermark">{WATERMARK_TEXT}</div>
}
