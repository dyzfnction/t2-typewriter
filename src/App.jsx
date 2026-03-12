import { useState, useEffect } from 'react'
import PageChargement from './jsx/PageChargement'
import FrameAccueil  from './jsx/FrameAccueil'
import FrameMachine  from './jsx/FrameMachine'
import FrameLivre    from './jsx/FrameLivre'
import FrameDate     from './jsx/FrameDate'
import StickyRoller  from './jsx/StickyRoller'
import Menu          from './jsx/Menu'

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

      {/* ── 4. DATE ── */}
      <FrameDate />

      {/* ── KEYBOARD fixe (commun à toutes les sections) ── */}
      <div id="keyboard-fixed">
        <Menu />
      </div>

      {/* ── ROLLER fixe ── */}
      <StickyRoller />

      {/* ── LOADER (par-dessus tout) ── */}
      {!loadingDone && <PageChargement onFinish={() => setLoadingDone(true)} />}
    </>
  )
}
