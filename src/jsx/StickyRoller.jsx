import { useEffect, useRef, useState } from 'react'

export default function StickyRoller() {
  const [ballLeft, setBallLeft] = useState(-12)
  const dragging = useRef(false)
  const rollerRef = useRef(null)

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

  function pctFromX(clientX) {
    const bar = rollerRef.current
    if (!bar) return 0
    const { left, width } = bar.getBoundingClientRect()
    return clamp((clientX - left) / width, 0, 1)
  }

  function scrollToPct(pct) {
    const total = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo({ top: pct * total })
  }

  function updateBall() {
    if (dragging.current) return
    const total = document.documentElement.scrollHeight - window.innerHeight
    const pct   = total > 0 ? clamp(window.scrollY / total, 0, 1) : 0
    const bar   = rollerRef.current
    if (!bar) return
    setBallLeft(pct * (bar.offsetWidth - 24))
  }

  useEffect(() => {
    window.addEventListener('scroll', updateBall, { passive: true })
    window.addEventListener('resize', updateBall)
    return () => {
      window.removeEventListener('scroll', updateBall)
      window.removeEventListener('resize', updateBall)
    }
  }, [])

  function onMouseDown(e) {
    e.preventDefault()
    dragging.current = true
    // FIX #1 : signale à EraRail de ne pas bloquer le scroll pendant le drag
    window.__rollerDragging = true

    const move = e => {
      const pct = pctFromX(e.clientX)
      const bar = rollerRef.current
      if (bar) setBallLeft(pct * (bar.offsetWidth - 24))
      scrollToPct(pct)
    }
    const up = () => {
      dragging.current = false
      window.__rollerDragging = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  function onTouchStart() {
    dragging.current = true
    // FIX #1 : signale à EraRail de ne pas bloquer le scroll pendant le drag
    window.__rollerDragging = true

    const move = e => {
      const pct = pctFromX(e.touches[0].clientX)
      const bar = rollerRef.current
      if (bar) setBallLeft(pct * (bar.offsetWidth - 24))
      scrollToPct(pct)
    }
    const end = () => {
      dragging.current = false
      window.__rollerDragging = false
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)
  }

  function onBarClick(e) {
    if (e.target !== e.currentTarget) return
    const pct = pctFromX(e.clientX)
    const bar = rollerRef.current
    if (bar) setBallLeft(pct * (bar.offsetWidth - 24))
    scrollToPct(pct)
  }

  return (
    <div id="roller" ref={rollerRef} onClick={onBarClick}>
      <div
        id="roller-ball"
        style={{ left: ballLeft + 'px' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      />
    </div>
  )
}
