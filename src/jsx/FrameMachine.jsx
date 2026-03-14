import { useEffect, useRef, useState } from 'react'

const PARAS = [
  "La première machine à\u00A0écrire pratique fut inventée par\u00A0Charles\u00A0Thurber et brevetée en\u00A01843, mais elle ne\u00A0fut jamais produite en\u00A0série.",
  "La machine à\u00A0écrire est passée de\u00A0révolutionnaire à\u00A0son apogée à\u00A0symbole sentimental d'obsolescence à\u00A0notre époque.",
  "Elle fonctionne simplement\u00A0: on\u00A0insère une\u00A0feuille sur\u00A0le cylindre derrière un\u00A0ruban encreur. En\u00A0appuyant sur\u00A0une\u00A0touche, une\u00A0barre frappe le\u00A0ruban pour\u00A0imprimer le\u00A0caractère sur\u00A0le papier.",
  "Le chariot avance ligne par\u00A0ligne et, à\u00A0la\u00A0fin, il\u00A0est ramené au\u00A0départ tandis que le\u00A0cylindre positionne le\u00A0papier pour\u00A0continuer l'écriture.",
]

const TRANS = 0.08

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

export default function FrameMachine() {
  const railRef          = useRef(null)
  const renderedIdxRef   = useRef(-1)
  const targetCountRef   = useRef(0)
  const displayCountRef  = useRef(0)
  const rafMachineRef    = useRef(null)
  const [paraText, setParaText]       = useState('')
  const [paraOpacity, setParaOpacity] = useState(1)

  function animateMachine(text) {
    rafMachineRef.current = null
    const diff = targetCountRef.current - displayCountRef.current
    if (Math.abs(diff) < 0.5) {
      displayCountRef.current = targetCountRef.current
      setParaText(text.slice(0, Math.round(displayCountRef.current)))
      return
    }
    displayCountRef.current += Math.sign(diff) * clamp(Math.abs(diff) * 0.18, 0.4, 12)
    setParaText(text.slice(0, Math.round(displayCountRef.current)))
    rafMachineRef.current = requestAnimationFrame(() => animateMachine(text))
  }

  useEffect(() => {
    function onScroll() {
      const rail = railRef.current
      if (!rail) return
      const railTop    = rail.getBoundingClientRect().top + window.scrollY
      const railHeight = rail.offsetHeight - window.innerHeight
      const p         = clamp((window.scrollY - railTop) / railHeight, 0, 1)
      const segSize   = 1 / PARAS.length
      const paraIndex = clamp(Math.floor(p / segSize), 0, PARAS.length - 1)
      const segProg   = (p - paraIndex * segSize) / segSize
      const text      = PARAS[paraIndex]

      if (paraIndex !== renderedIdxRef.current) {
        if (rafMachineRef.current) { cancelAnimationFrame(rafMachineRef.current); rafMachineRef.current = null }
        setParaText('')
        setParaOpacity(1)
        renderedIdxRef.current  = paraIndex
        displayCountRef.current = 0
        targetCountRef.current  = 0
      }

      if (segProg >= 1 - TRANS && paraIndex < PARAS.length - 1) {
        setParaOpacity(clamp(1 - (segProg - (1 - TRANS)) / TRANS, 0, 1))
        targetCountRef.current  = text.length
        displayCountRef.current = text.length
        setParaText(text)
        return
      }

      setParaOpacity(1)
      targetCountRef.current = easeInOut(clamp(segProg / (1 - TRANS), 0, 1)) * text.length
      if (!rafMachineRef.current) rafMachineRef.current = requestAnimationFrame(() => animateMachine(text))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="s-machine-rail" ref={railRef}>
      <div id="s-machine-sticky">
        <div className="machine-text-zone">
          <div id="machine-para" style={{ opacity: paraOpacity }}>{paraText}</div>
        </div>
        <div className="machine-3d">[ Modèle 3D ]</div>
      </div>
    </div>
  )
}