import { useState, useEffect } from 'react'
import typewriterManual from '../images/typewritersmanual.webp'
import isaacPitman      from '../images/isaac-pitman.png'

const LINES = [
  "Pitman's Typewriter\u00A0Manual",
  "by\u00A0Isaac\u00A0Pitman",
  "(1893)",
]

function useTypewriter(lines) {
  const [displayed, setDisplayed] = useState(Array(lines.length).fill(''))

  useEffect(() => {
    let cancelled = false

    function typeLine(index, text, delay, onDone) {
      let i = 0
      setTimeout(function tick() {
        if (cancelled) return
        if (i < text.length) {
          setDisplayed(prev => {
            const next = [...prev]
            next[index] = text.slice(0, i + 1)
            return next
          })
          i++
          setTimeout(tick, 80)
        } else if (onDone) {
          setTimeout(onDone, 200)
        }
      }, delay)
    }

    typeLine(0, lines[0], 400, () =>
      typeLine(1, lines[1], 0, () =>
        typeLine(2, lines[2], 0, null)
      )
    )

    return () => { cancelled = true }
  }, [])

  return displayed
}

export default function FrameOeuvre() {
  const [line1, line2, line3] = useTypewriter(LINES)

  return (
    <div id="s-oeuvre">

      {/* ASCII art en fond */}
      <div className="oeuvre-bg">
        <img src={isaacPitman} alt="" />
      </div>

      {/* Titre avec effet machine à écrire */}
      <header className="oeuvre-header">
        <div className="oeuvre-title-line oeuvre-title-line--italic">{line1}</div>
        <div className="oeuvre-title-line">{line2}</div>
        <div className="oeuvre-title-line">{line3}</div>
      </header>

      {/* Artwork centré */}
      <div className="oeuvre-page">
        <div className="oeuvre-artwork">
          <img
            src={typewriterManual}
            alt="Pitman's Typewriter Manual — Plate VIII"
          />
        </div>
      </div>

    </div>
  )
}