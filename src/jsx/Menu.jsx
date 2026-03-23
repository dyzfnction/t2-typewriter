import { useRef, useState } from 'react'

// Mapping I–XIII → { era, oeuvre } selon ERA_DATA dans App.jsx
// Ère 0 (1890): PitmansManual, FloraOeuvre, Bismarck, QueenVictoria
// Ère 1 (1950): WhisperPiece, BeethovenToday, CarnivalPanel, Textum2, WordsLovely, OPiece
// Ère 2 (1980): UnusualLovePoem
// Ère 3 (2000): TypewrittenPortraits, LookingForward, PatternSeries, BarcelonaLove
const KEY_NAV = {
  'I':    { era: 0, oeuvre: 0 },
  'II':   { era: 0, oeuvre: 1 },
  'III':  { era: 0, oeuvre: 2 },
  'IV':   { era: 0, oeuvre: 3 },
  'V':    { era: 1, oeuvre: 0 },
  'VI':   { era: 1, oeuvre: 1 },
  'VII':  { era: 1, oeuvre: 2 },
  'VIII': { era: 1, oeuvre: 3 },
  'IX':   { era: 1, oeuvre: 4 },
  'X':    { era: 1, oeuvre: 5 },
  'XI':   { era: 2, oeuvre: 0 },
  'XII':  { era: 3, oeuvre: 0 },
  'XIII': { era: 3, oeuvre: 1 },
  'XIV':  { era: 3, oeuvre: 2 },
  'XV':   { era: 3, oeuvre: 3 },
}

const KEY_ROWS = [
  ['🖨', 'I', 'II', 'III', 'IV', '☰'],
  ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'],
  ['__TOGGLE__', 'XII', 'XIII', 'XIV', 'XV', 'B'],
]

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

export default function Menu({ navigateTo }) {
  const [collapsed, setCollapsed] = useState(false)
  const toggleRef  = useRef(null)
  const keyRefs    = useRef({})   // { label: DOMElement }
  const animating  = useRef(false)

  function snapOffsets() {
    const toggleEl = toggleRef.current
    if (!toggleEl) return {}

    // Reset temporaire pour mesurer les vraies positions naturelles
    Object.values(keyRefs.current).forEach(el => {
      if (!el) return
      el.style.transform = 'none'
      el.style.opacity   = ''
    })

    const tr  = toggleEl.getBoundingClientRect()
    const pcx = tr.left + tr.width / 2
    const pcy = tr.top  + tr.height / 2
    const offsets = {}
    Object.entries(keyRefs.current).forEach(([key, el]) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      offsets[key] = {
        dx: pcx - (r.left + r.width / 2),
        dy: pcy - (r.top  + r.height / 2),
      }
    })
    return offsets
  }

  function animateTo(toCollapsed) {
    if (animating.current) return
    animating.current = true
    const offsets = snapOffsets()  // reset + mesure

    // Si on collapse, les touches sont déjà à leur place naturelle (opacity 1, transform none)
    // Si on expand, il faut les replacer au pivot avant d'animer
    const keys = Object.keys(keyRefs.current)
    if (!toCollapsed) {
      keys.forEach(key => {
        const el  = keyRefs.current[key]
        const pos = offsets[key]
        if (!el || !pos) return
        el.style.transform = `translate(${pos.dx}px, ${pos.dy}px)`
        el.style.opacity   = '0'
      })
    }
    const N = keys.length
    const t0      = performance.now()
    const DUR     = 480

    function frame(now) {
      const t = Math.min(1, (now - t0) / DUR)
      keys.forEach((key, i) => {
        const el  = keyRefs.current[key]
        const pos = offsets[key]
        if (!el || !pos) return
        const d        = toCollapsed ? (i / N) * 0.3 : ((N - 1 - i) / N) * 0.3
        const progress = toCollapsed
          ? easeInOut(clamp((t - d) / (1 - d), 0, 1))
          : 1 - easeInOut(clamp((t - d) / (1 - d), 0, 1))
        el.style.transform = `translate(${pos.dx * progress}px, ${pos.dy * progress}px)`
        el.style.opacity   = String(1 - progress)
      })

      if (t < 1) {
        requestAnimationFrame(frame)
      } else {
        keys.forEach(key => {
          const el  = keyRefs.current[key]
          const pos = offsets[key]
          if (!el || !pos) return
          el.style.transform = toCollapsed ? `translate(${pos.dx}px, ${pos.dy}px)` : ''
          el.style.opacity   = toCollapsed ? '0' : ''
        })
        setCollapsed(toCollapsed)
        animating.current = false
      }
    }
    requestAnimationFrame(frame)
  }

  function handleKeyClick(label) {
    if (KEY_NAV[label]) {
      const { era, oeuvre } = KEY_NAV[label]
      navigateTo?.(era, oeuvre)
    } else if (label === '🖨') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (label === 'B') {
      window.history.back()
    }
  }

  function handleToggle() {
    if (!animating.current) animateTo(!collapsed)
  }

  return (
    <div className="keyboard">
      {KEY_ROWS.map((row, ri) => (
        <div key={ri} className="key-row">
          {row.map(label => {
            const isToggle = label === '__TOGGLE__'

            if (isToggle) {
              return (
                <div
                  key="toggle"
                  className="key-wrap key-toggle"
                  ref={toggleRef}
                  onClick={handleToggle}
                >
                  <div className="key"><span>{collapsed ? '+' : '×'}</span></div>
                  <div className="key-tige" />
                </div>
              )
            }

            return (
              <div
                key={label}
                className="key-wrap"
                ref={el => { keyRefs.current[label] = el }}
                style={{ willChange: 'transform, opacity' }}
                onClick={() => handleKeyClick(label)}
              >
                <div className="key"><span>{label}</span></div>
                <div className="key-tige" />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}