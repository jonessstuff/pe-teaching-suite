// Print a single artifact (worksheet, warm-up sheet, quiz, …) in isolation.
// Tool outputs often live inside print:hidden containers, so a plain
// window.print() prints the surrounding page instead. This opens a dedicated
// window with ONLY the artifact's DOM + the document's stylesheets, so exactly
// that element prints (and trial users still get the watermark).
export function printArtifact(el, watermark) {
  if (!el) return false
  const w = window.open('', '_blank', 'width=850,height=1100')
  if (!w) return false   // pop-up blocked — let the caller surface a message
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML).join('\n')
  const wm = watermark ? `<div class="trial-watermark-print">${watermark}</div>` : ''
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}<style>@page{margin:0.6in}html,body{background:#fff;margin:0}</style></head><body>${el.outerHTML}${wm}</body></html>`)
  w.document.close()
  w.focus()
  // Let the linked stylesheets load before printing (else it prints unstyled).
  setTimeout(() => { try { w.print() } catch { /* user closed the window */ } }, 450)
  return true
}
