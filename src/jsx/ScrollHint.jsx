import { useEffect, useState, useRef } from 'react'

// Détecte la couleur de fond de la section sticky courante
// pour adapter la couleur de la flèche
function useBgColor() {
  const [dark, setDark] = useState(true) // true = fond sombre → flèche claire

  useEffect(() => {
    function update() {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      if (!el) return
      let node = el
      while (node && node !== document.body) {
        const bg = window.getComputedStyle(node).backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          const m = bg.match(/\d+/g)
          if (m) {
            const [r, g, b] = m.map(Number)
            const lum = 0.299*r + 0.587*g + 0.114*b
            setDark(lum < 140)
            return
          }
        }
        node = node.parentElement
      }
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return dark
}

export default function ScrollHint() {
  const [visible,   setVisible]   = useState(false)
  const [onFooter,  setOnFooter]  = useState(false)
  const timerRef = useRef(null)
  const dark     = useBgColor()

  // Cache le hint quand le footer est visible
  useEffect(() => {
    const footer = document.getElementById('s-footer')
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => {
      setOnFooter(entry.isIntersecting)
    }, { threshold: 0.1 })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  function resetTimer() {
    setVisible(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(true), 4000)
  }

  useEffect(() => {
    resetTimer()
    window.addEventListener('scroll',     resetTimer, { passive: true })
    window.addEventListener('touchstart', resetTimer, { passive: true })
    window.addEventListener('click',      resetTimer, { passive: true })
    return () => {
      clearTimeout(timerRef.current)
      window.removeEventListener('scroll',     resetTimer)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('click',      resetTimer)
    }
  }, [])

  const color = dark
    ? 'rgba(255, 251, 232, 0.75)'
    : 'rgba(17, 17, 17, 0.65)'

  return (
    <div
      id="scroll-hint"
      className={visible && !onFooter ? 'visible' : ''}
      style={{ '--hint-color': color }}
    >
      <span className="hint-label">scroll</span>
      <span className="hint-arrow">↓</span>
    </div>
  )
}