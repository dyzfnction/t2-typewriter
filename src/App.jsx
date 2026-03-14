import { useState, useEffect, useRef } from 'react'
import PageChargement from './jsx/PageChargement'
import FrameAccueil  from './jsx/FrameAccueil'
import FrameMachine  from './jsx/FrameMachine'
import FrameLivre    from './jsx/FrameLivre'
import FrameDate     from './jsx/FrameDate'
import FrameOeuvre   from './jsx/FrameOeuvre'
import StickyRoller  from './jsx/StickyRoller'
import Menu          from './jsx/Menu'

function HorizontalRail() {
  const railRef  = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    function onScroll() {
      const rail  = railRef.current
      const track = trackRef.current
      if (!rail || !track) return

      const railTop    = rail.getBoundingClientRect().top + window.scrollY
      const railHeight = rail.offsetHeight - window.innerHeight
      const p = Math.max(0, Math.min(1, (window.scrollY - railTop) / railHeight))

      track.style.transform = `translateX(-${p * window.innerWidth}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="s-horizontal-rail" ref={railRef}>
      <div id="s-horizontal-sticky">
        <div id="s-horizontal-track" ref={trackRef}>

          {/* ── Panneau gauche : Date ── */}
          <div className="h-panel">
            <FrameDate />
          </div>

          {/* ── Panneau droit : Oeuvre ── */}
          <div className="h-panel">
            <FrameOeuvre />
          </div>

        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [loadingDone, setLoadingDone] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <>
      {/* ── 1. ACCUEIL ── */}
      <FrameAccueil canStart={loadingDone} />

      {/* ── 2. MACHINE (rail scrollable + sticky) ── */}
      <FrameMachine />

      {/* ── 3. LIVRE (rail scrollable + sticky) ── */}
      <FrameLivre />

      {/* ── 4. DATE → 5. OEUVRE (rail horizontal) ── */}
      <HorizontalRail />

      {/* ── KEYBOARD fixe ── */}
      <div id="keyboard-fixed">
        <Menu />
      </div>

      {/* ── ROLLER fixe ── */}
      <StickyRoller />

      {/* ── LOADER ── */}
      {!loadingDone && <PageChargement onFinish={() => setLoadingDone(true)} />}
    </>
  )
}