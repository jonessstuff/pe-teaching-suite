import { forwardRef } from 'react'

const SUBJECT_COLORS = {
  'PE':           '#10b981',
  'Health':       '#3b82f6',
  'Family Life':  '#8b5cf6',
  "Driver's Ed":  '#f59e0b',
}

const W = 816
const H = 1056

function splitLines(text, maxChars) {
  if (!text) return ['']
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (test.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function gradeLabel(g) {
  return g === 0 ? 'K' : String(g)
}

const PosterRenderer = forwardRef(function PosterRenderer({ posterContent }, ref) {
  const {
    title = '',
    skill_cue = '',
    steps = [],
    equipment = [],
    subject = 'PE',
    grade_bands = [],
  } = posterContent ?? {}

  const accent = SUBJECT_COLORS[subject] ?? '#6b7280'

  // ── Header layout ──────────────────────────────────────
  const titleLines = splitLines(title, 33)
  const TITLE_LINE_H = 46
  const HEADER_H = 215
  const titleBlockH = titleLines.length * TITLE_LINE_H
  const titleStartY = (HEADER_H / 2) + 18 - titleBlockH / 2

  const gradeStr = grade_bands.length > 0
    ? `${subject} · Grade${grade_bands.length > 1 ? 's' : ''} ${grade_bands.map(gradeLabel).join('/')}`
    : subject

  const badgeText = gradeStr.toUpperCase()
  const badgeW = badgeText.length * 8.2 + 32

  // ── Cue zone ───────────────────────────────────────────
  const CUE_Y = 230
  const CUE_H = 112
  const cueLines = splitLines(skill_cue.toUpperCase(), 34)
  const CUE_LINE_H = 36
  const cueTextStartY = CUE_Y + CUE_H / 2 - (cueLines.length * CUE_LINE_H) / 2 + 24

  // ── Steps layout ───────────────────────────────────────
  const STEPS_TOP = 368
  const STEPS_BTM = 878
  const stepCount = steps.length || 1
  const stepSpacing = (STEPS_BTM - STEPS_TOP) / stepCount
  const CIRCLE_X = 90
  const CIRCLE_R = 36
  const TEXT_X = 152
  const STEP_FONT = 23
  const STEP_LINE_H = 30

  // ── Footer ─────────────────────────────────────────────
  const FOOTER_Y = 902

  return (
    <svg
      ref={ref}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'system-ui, -apple-system, Arial, sans-serif', display: 'block' }}
    >
      {/* Background */}
      <rect width={W} height={H} fill="#ffffff" />

      {/* ── Header band ── */}
      <rect x={0} y={0} width={W} height={HEADER_H} fill={accent} />

      {/* Subject / grade badge */}
      <rect x={48} y={36} width={badgeW} height={28} rx={14} fill="rgba(255,255,255,0.22)" />
      <text
        x={48 + badgeW / 2}
        y={55}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={12}
        fontWeight="700"
        letterSpacing="0.08em"
      >
        {badgeText}
      </text>

      {/* Title */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={titleStartY + i * TITLE_LINE_H}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={titleLines.length > 1 ? 32 : 36}
          fontWeight="700"
        >
          {line}
        </text>
      ))}

      {/* ── Skill cue box ── */}
      <rect x={40} y={CUE_Y} width={W - 80} height={CUE_H} rx={12} fill={accent} fillOpacity="0.09" />
      {/* Left accent bar */}
      <rect x={40} y={CUE_Y} width={7} height={CUE_H} rx={3.5} fill={accent} />
      {/* Opening quote */}
      <text x={68} y={CUE_Y + 32} fill={accent} fontSize={44} fontWeight="700" opacity="0.35" dominantBaseline="auto">"</text>

      {cueLines.map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={cueTextStartY + i * CUE_LINE_H}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#0f172a"
          fontSize={cueLines.length > 1 ? 24 : 28}
          fontWeight="800"
          letterSpacing="0.05em"
        >
          {line}
        </text>
      ))}

      {/* ── Steps ── */}
      {steps.map((step, i) => {
        const cy = STEPS_TOP + (i + 0.5) * stepSpacing
        const lines = splitLines(step.text, 37)
        const totalH = lines.length * STEP_LINE_H
        const textStartY = cy - totalH / 2 + STEP_FONT * 0.38

        return (
          <g key={i}>
            {/* Dotted connector to next step */}
            {i < steps.length - 1 && (
              <line
                x1={CIRCLE_X}
                y1={cy + CIRCLE_R + 6}
                x2={CIRCLE_X}
                y2={cy + stepSpacing - CIRCLE_R - 6}
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 5"
              />
            )}

            {/* Number circle */}
            <circle cx={CIRCLE_X} cy={cy} r={CIRCLE_R} fill={accent} />
            <text
              x={CIRCLE_X}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={26}
              fontWeight="700"
            >
              {step.number}
            </text>

            {/* Step text lines */}
            {lines.map((line, li) => (
              <text
                key={li}
                x={TEXT_X}
                y={textStartY + li * STEP_LINE_H}
                dominantBaseline="middle"
                fill="#1e293b"
                fontSize={STEP_FONT}
                fontWeight={li === 0 ? '600' : '400'}
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}

      {/* ── Footer ── */}
      <line x1={40} y1={FOOTER_Y - 8} x2={W - 40} y2={FOOTER_Y - 8} stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x={0} y={FOOTER_Y} width={W} height={H - FOOTER_Y} fill="#f8fafc" />

      {equipment.length > 0 && (
        <>
          <text
            x={56}
            y={FOOTER_Y + 36}
            fill="#94a3b8"
            fontSize={11}
            fontWeight="700"
            letterSpacing="0.1em"
          >
            EQUIPMENT
          </text>
          <text x={56} y={FOOTER_Y + 66} fill="#475569" fontSize={16}>
            {equipment.join(' · ')}
          </text>
        </>
      )}

      {/* PlansK12 wordmark */}
      <text
        x={W - 52}
        y={FOOTER_Y + 52}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={14}
        fontWeight="600"
      >
        Plans
        <tspan fill={accent}>K12</tspan>
      </text>
    </svg>
  )
})

export default PosterRenderer
