import { useRef, useState } from 'react'

const KEY_ROWS = [
  ['🖨', 'I', 'II', 'III', 'IV', '☰'],
  ['V', 'VI', 'VII', 'VIII', 'IX'],
  ['__TOGGLE__', 'X', 'XI', 'XII', 'XIII', 'B'],
]

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

export default function Menu() {
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