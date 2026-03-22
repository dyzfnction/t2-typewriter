import { useState, useEffect, useRef } from 'react'
import PageChargement from './jsx/PageChargement'
import FrameAccueil  from './jsx/FrameAccueil'
import FrameMachine  from './jsx/FrameMachine'
import FrameLivre    from './jsx/FrameLivre'
import StickyRoller  from './jsx/StickyRoller'
import Menu          from './jsx/Menu'
import ScrollHint    from './jsx/ScrollHint'

import {
  PitmansManual,
  FloraOeuvre,
  Bismarck,
  QueenVictoria,
  WhisperPiece,
  BeethovenToday,
  CarnivalPanel,
  Textum2,
  WordsLovely,
  OPiece,
  UnusualLovePoem,
  TypewrittenPortraits,
  LookingForward,
  PatternSeries,
  BarcelonaLove,
} from './jsx/NewOeuvres'

import { FrameDate1890, FrameDate1950, FrameDate1980, FrameDate2000 } from './jsx/FrameDates'

const LOCK_DURATION = 2000

function useScrollLock() {
  const lockedRef    = useRef(false)
  const savedScrollY = useRef(0)
  function lock() {
    if (lockedRef.current) return
    lockedRef.current = true
    savedScrollY.current = window.scrollY
    function prevent() { window.scrollTo(0, savedScrollY.current) }
    window.addEventListener('scroll', prevent, { passive: false })
    setTimeout(() => {
      window.removeEventListener('scroll', prevent)
      lockedRef.current = false
    }, LOCK_DURATION)
  }
  return lock
}

function useSectionLock(ref, lock) {
  const triggered = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !triggered.current) {
        triggered.current = true
        lock()
      }
    }, { threshold: 1.0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
}

function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2 }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

// ─────────────────────────────────────────────────────────────────────────────
// EraRail — calqué EXACTEMENT sur FloraRail
//
// FloraRail avec 2 oeuvres (Flora, Bismarck) :
//   track width = 300vw  (panel date + panel flora + panel bismarck)
//   p 0.00→0.20 : slide date→Flora         (horizFlora    = p/0.20)
//   p 0.20      : typewriter Flora démarre
//   p 0.40→0.60 : slide vertical Flora
//   p 0.60→0.80 : slide Flora→Bismarck     (horizBismarck = (p-0.60)/0.20)
//                 + fondu croisé Flora→Bismarck
//   p 0.80→1.00 : slide vertical Bismarck
//
// Généralisation à N oeuvres :
//   Chaque oeuvre i occupe un segment de taille SEG = 1/N
//   Slide horiz vers oeuvre i : p de i*SEG à i*SEG + SEG*0.20
//   Typewriter oeuvre i       : p >= i*SEG + SEG*0.20
//   Slide vertical oeuvre i   : p de i*SEG + SEG*0.40 à i*SEG + SEG*0.60
//   Fondu croisé i→i+1        : p de i*SEG + SEG*0.60 à i*SEG + SEG*0.80
//     (simultané avec slide horiz suivant, exactement comme FloraRail)
//
// Fin de rail (identique à HorizontalRail runAutoSequence) :
//   slide vertical remonte → swap date → chariot revient → scroll suivant
// ─────────────────────────────────────────────────────────────────────────────
function EraRail({ id, nextRailRef, DatePanel, oeuvres }) {
  const N   = oeuvres.length
  const SEG = 1 / N

  const railRef  = useRef(null)
  const trackRef = useRef(null)

  // Date
  const [dateAnimated,  setDateAnimated]  = useState(false)
  const [dateZoomOut,   setDateZoomOut]   = useState(false)
  const dateAnimatedRef = useRef(false)

  // Par oeuvre — floraProgress/bismarckProgress/floraOpacity/bismarckOpacity généralisés
  const [progresses, setProgresses] = useState(Array(N).fill(0))
  const [visibles,   setVisibles]   = useState(Array(N).fill(false))
  const [autoMode,   setAutoMode]   = useState(false)
  const visibleRefs   = useRef(Array(N).fill(false))
  const phase3Visited = useRef(false)
  const autoTriggered = useRef(false)
  const autoRunning   = useRef(false)

  // Séquence de fin — identique à HorizontalRail
  function runAutoSequence(track) {
    if (autoRunning.current) return
    autoRunning.current = true

    setAutoMode(true)
    // Bloque le scroll sans mouvement visible : preventDefault sur wheel/touchmove
    function preventWheel(e) { e.preventDefault() }
    function preventTouch(e) { e.preventDefault() }
    window.addEventListener('wheel',     preventWheel, { passive: false })
    window.addEventListener('touchmove', preventTouch, { passive: false })

    // 1. Slide vertical de la dernière oeuvre remonte (800ms)
    const DUR_RETURN = 800
    let t0 = null
    function animateReturn(ts) {
      if (!t0) t0 = ts
      const t = Math.min(1, (ts - t0) / DUR_RETURN)
      setProgresses(prev => { const n=[...prev]; n[N-1]=easeInOut(1-t); return n })
      if (t < 1) { requestAnimationFrame(animateReturn); return }
      setProgresses(prev => { const n=[...prev]; n[N-1]=0; return n })

      setTimeout(() => {
        // Chariot revient de -(N*vw) à 0 en 700ms
        const DUR_CHARIOT = 700
        const fromX = N * window.innerWidth
        let t1 = null
        function animateChariot(ts) {
          if (!t1) t1 = ts
          const t = Math.min(1, (ts - t1) / DUR_CHARIOT)
          track.style.transform = `translateX(-${(1 - easeInOut(t)) * fromX}px)`
          if (t < 1) { requestAnimationFrame(animateChariot); return }

          track.style.transform = 'translateX(0px)'
          window.removeEventListener('wheel',     preventWheel)
          window.removeEventListener('touchmove', preventTouch)

          const nextEl = nextRailRef?.current
          if (nextEl) {
            const top = nextEl.getBoundingClientRect().top + window.scrollY
            window.scrollTo({ top, behavior: 'instant' })
          }

          // Zoom out de la date : la date est revenue, on rejoue l'animation
          setDateZoomOut(true)
          setDateAnimated(false)
          requestAnimationFrame(() => {
            setDateAnimated(true)
            setTimeout(() => setDateZoomOut(false), 800)
          })

          setAutoMode(false)
          phase3Visited.current = false
          autoRunning.current   = false
        }
        requestAnimationFrame(animateChariot)
      }, 500)
    }
    requestAnimationFrame(animateReturn)
  }

  useEffect(() => {
    function onScroll() {
      if (autoRunning.current) return
      const rail  = railRef.current
      const track = trackRef.current
      if (!rail || !track) return

      const railTop    = rail.getBoundingClientRect().top + window.scrollY
      const railHeight = rail.offsetHeight - window.innerHeight
      if (railHeight <= 0) return
      const p = clamp((window.scrollY - railTop) / railHeight, 0, 1)

      // DATE_PAUSE : 5% réservés à la date, pas plus
      const DATE_PAUSE = 0.05
      const q = clamp((p - DATE_PAUSE) / (1 - DATE_PAUSE), 0, 1)

      // ── Reset au scroll arrière ──────────────────────────────────────────
      if (p < 0.10 && autoTriggered.current) {
        phase3Visited.current = false
        autoTriggered.current = false
        setAutoMode(false)
        visibleRefs.current   = Array(N).fill(false)
        setVisibles(Array(N).fill(false))
        setProgresses(Array(N).fill(0))
      }

      // ── Translation horizontale ─────────────────────────────────────────
      // Calqué FloraRail : horizFlora + horizBismarck + ...
      // Au scroll arrière q redescend → totalHoriz redescend → track revient
      let totalHoriz = 0
      for (let i = 0; i < N; i++) {
        totalHoriz += clamp((q - i * SEG) / (SEG * 0.20), 0, 1)
      }
      track.style.transform = `translateX(-${totalHoriz * window.innerWidth}px)`

      // ── Typewriters (one-way) ───────────────────────────────────────────
      for (let i = 0; i < N; i++) {
        if (q >= i * SEG + SEG * 0.20 && !visibleRefs.current[i]) {
          visibleRefs.current[i] = true
        }
      }
      setVisibles(visibleRefs.current.map(v => v))

      // ── Slides verticaux (bidirectionnels) ─────────────────────────────
      // La dernière oeuvre (N-1) reste à 0 — runAutoSequence gère sa remontée
      const newProgresses = Array(N).fill(0)
      for (let i = 0; i < N - 1; i++) {
        newProgresses[i] = easeInOut(
          clamp((q - i * SEG - SEG * 0.40) / (SEG * 0.20), 0, 1)
        )
      }
      newProgresses[N - 1] = 0
      setProgresses(newProgresses)

      // Pas de fondu entre panels — translation pure comme FloraRail

      // Phase 3
      if (q >= (N - 1) * SEG + SEG * 0.40) phase3Visited.current = true

      // Scroll lock à la dernière oeuvre : dès que p≥0.99 et que phase3 est atteinte,
      // tout scroll supplémentaire déclenche immédiatement la séquence auto
      if (p >= 0.95 && phase3Visited.current && !autoTriggered.current && !autoRunning.current && nextRailRef?.current) {
        autoTriggered.current = true
        runAutoSequence(track)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // IntersectionObserver : zoom date quand le rail entre dans le viewport
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !dateAnimatedRef.current) {
        dateAnimatedRef.current = true
        setDateAnimated(true)
      }
      if (!entry.isIntersecting) {
        dateAnimatedRef.current = false
        setDateAnimated(false)
        setDateZoomOut(false)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Hauteur : même ratio que FloraRail → 500svh pour 3 panels (date+2 oeuvres)
  // donc (N+1) * 250svh  (500/2 = 250 par oeuvre)
  const railHeightSvh = (N + 1) * 250

  return (
    <div
      id={id}
      className="s-horizontal-rail"
      ref={railRef}
      style={{ height: `${railHeightSvh}svh` }}
    >
      <div className="s-horizontal-sticky">
        {/* track : (N+1) panels de 100vw — date + N oeuvres */}
        <div
          className="s-horizontal-track"
          ref={trackRef}
          style={{ width: `${(N+1)*100}vw` }}
        >
          {/* Panel 0 : date */}
          <div className="h-panel">
            <DatePanel animated={dateAnimated} zoomOut={dateZoomOut} />
          </div>

          {/* Panels oeuvres — exactement comme Flora/Bismarck dans FloraRail */}
          {oeuvres.map(({ Component }, i) => (
            <div key={i} className="h-panel">
              <Component progress={progresses[i]} canStart={visibles[i]} autoMode={autoMode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [loadingDone, setLoadingDone] = useState(false)
  const lock = useScrollLock()

  const era1890Ref = useRef(null)
  const era1950Ref = useRef(null)
  const era1980Ref = useRef(null)
  const era2000Ref = useRef(null)
  const accueilRef = useRef(null)
  const machineRef = useRef(null)
  const livreRef   = useRef(null)

  useSectionLock(accueilRef, lock)
  useSectionLock(machineRef, lock)
  useSectionLock(livreRef,   lock)

  useEffect(() => {
    // Désactive la restauration de scroll du navigateur
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div ref={accueilRef}><FrameAccueil canStart={loadingDone} /></div>
      <div ref={machineRef}><FrameMachine /></div>
      <div ref={livreRef}><FrameLivre /></div>

      {/* ── Ère 1890–1900 : Pitman, Flora, Bismarck, Victoria ── */}
      <div ref={era1890Ref}>
        <EraRail
          id="s-era-1890"
          nextRailRef={era1950Ref}
          DatePanel={FrameDate1890}
          oeuvres={[
            { Component: PitmansManual },
            { Component: FloraOeuvre },
            { Component: Bismarck },
            { Component: QueenVictoria },
          ]}
        />
      </div>

      {/* ── Ère 1950–1970 ── */}
      <div ref={era1950Ref}>
        <EraRail
          id="s-era-1950"
          nextRailRef={era1980Ref}
          DatePanel={FrameDate1950}
          oeuvres={[
            { Component: WhisperPiece },
            { Component: BeethovenToday },
            { Component: CarnivalPanel },
            { Component: Textum2 },
            { Component: WordsLovely },
            { Component: OPiece },
          ]}
        />
      </div>

      {/* ── Ère 1980 ── */}
      <div ref={era1980Ref}>
        <EraRail
          id="s-era-1980"
          nextRailRef={era2000Ref}
          DatePanel={FrameDate1980}
          oeuvres={[
            { Component: UnusualLovePoem },
          ]}
        />
      </div>

      {/* ── Ère 2000–2012 ── */}
      <div ref={era2000Ref}>
        <EraRail
          id="s-era-2000"
          nextRailRef={null}
          DatePanel={FrameDate2000}
          oeuvres={[
            { Component: TypewrittenPortraits },
            { Component: LookingForward },
            { Component: PatternSeries },
            { Component: BarcelonaLove },
          ]}
        />
      </div>

      <div id="keyboard-fixed"><Menu /></div>
      <StickyRoller />
      <ScrollHint />
      {!loadingDone && <PageChargement onFinish={() => setLoadingDone(true)} />}
    </>
  )
}