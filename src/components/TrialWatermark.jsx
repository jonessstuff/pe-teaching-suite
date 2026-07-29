import { createPortal } from 'react-dom'
import { useTrial } from '../context/TrialContext'
import { WATERMARK_TEXT } from '../services/trialService'

// Trial watermark. Renders TWO things so a trial user knows BEFORE printing and
// the mark repeats on EVERY printed page:
//   • an on-screen, in-flow notice (mounted in the content column), and
//   • a print-only fixed footer PORTALED to <body>. The portal is essential:
//     a nested position:fixed element collapses to a single page in Chrome's
//     print output, so a trial user could discard one sheet for a clean copy.
//     As a direct child of <body> it repeats on every page.
// Never shown to paid users (isPaid short-circuits). See .trial-watermark-screen
// / .trial-watermark-print in index.css.
export default function TrialWatermark() {
  const { isPaid } = useTrial()
  if (isPaid) return null
  return (
    <>
      <div className="trial-watermark-screen">{WATERMARK_TEXT}</div>
      {createPortal(
        <div className="trial-watermark-print">{WATERMARK_TEXT}</div>,
        document.body,
      )}
    </>
  )
}
