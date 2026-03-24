import { useState, useEffect, useRef, useCallback } from 'react'
import { LangProvider, useLang } from './jsx/LangContext'
import PageChargement from './jsx/PageChargement'
import FrameAccueil  from './jsx/FrameAccueil'
import FrameMachine  from './jsx/FrameMachine'
import FrameLivre    from './jsx/FrameLivre'
import FrameFooter   from './jsx/FrameFooter'
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2 }
function easeOut(t)   { return 1 - Math.pow(1-t, 3) }
function clamp(v,a,b) { return Math.max(a, Math.min(b, v)) }

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

// ─────────────────────────────────────────────────────────────────────────────
// EraRail
//
// S'intègre dans le flux normal du scroll (position: sticky).
// Quand il est visible (intersection), il capture la molette et gère
// lui-même la navigation horizontale + les transitions verticales entre ères.
//
// Architecture interne :
//   vwrap (height: 200%) — wrapper vertical
//     slot-current (top: 0,   height: 50%) — ère visible
//       track — flex horizontal, translate en X selon progress
//         panel date + panels oeuvres
//     slot-next (top: 50%, height: 50%)  — ère en transit (vide sauf pendant animation)
//
// Transitions :
//   Retour chariot avant  : progress→0 (600ms) puis vwrap 0%→-100% (350ms) → swap
//   Retour chariot arrière: vwrap -100%→0% (350ms) + progress 1→0 auto (400+N*200ms)
// ─────────────────────────────────────────────────────────────────────────────

const ERA_DATA = [
  {
    DatePanel: FrameDate1890,
    oeuvres: [
      { Component: PitmansManual },
      { Component: FloraOeuvre   },
      { Component: Bismarck      },
      { Component: QueenVictoria },
    ],
  },
  {
    DatePanel: FrameDate1950,
    oeuvres: [
      { Component: WhisperPiece   },
      { Component: BeethovenToday },
      { Component: CarnivalPanel  },
      { Component: Textum2        },
      { Component: WordsLovely    },
      { Component: OPiece         },
    ],
  },
  {
    DatePanel: FrameDate1980,
    oeuvres: [
      { Component: UnusualLovePoem },
    ],
  },
  {
    DatePanel: FrameDate2000,
    oeuvres: [
      { Component: TypewrittenPortraits },
      { Component: LookingForward       },
      { Component: PatternSeries        },
      { Component: BarcelonaLove        },
    ],
  },
]

function EraRail({ nextSectionRef, onRegisterJump, onRegisterReactivate }) {
  // ── State React ─────────────────────────────────────────────────────────
  const [eraIdx,     setEraIdx]     = useState(0)
  const [dateAnim,   setDateAnim]   = useState(false)
  const [dateZoomOut,setDateZoomOut]= useState(false)

  // stepIndex : index global de l'étape courante dans l'ère
  //   0          = panel date
  //   1          = oeuvre 0, sous-étape image  (canStart=true,  progress=0)
  //   2          = oeuvre 0, sous-étape texte  (canStart=true,  progress=1)
  //   3          = oeuvre 1, sous-étape image
  //   4          = oeuvre 1, sous-étape texte
  //   ...
  //   2*N+1      = dernier step → déclenche retour chariot
  const [stepIndex,  setStepIndex]  = useState(0)
  const [progresses, setProgresses] = useState([])
  const [visibles,   setVisibles]   = useState([])

  // ── Refs ─────────────────────────────────────────────────────────────────
  const eraIdxRef   = useRef(0)
  const stepRef     = useRef(0)        // stepIndex synchrone
  const animating   = useRef(false)
  const stepping    = useRef(false)    // true pendant la transition entre steps
  const isActive    = useRef(false)

  const containerRef = useRef(null)
  const vwrapRef     = useRef(null)
  const trackRef     = useRef(null)

  // ── Calcule les props des oeuvres depuis stepIndex ───────────────────────
  function stateFromStep(step, N) {
    // step 0 = date
    // step 2i-1 = oeuvre i-1 image (progress=0)
    // step 2i   = oeuvre i-1 texte (progress=1)
    const newProg = Array(N).fill(0)
    const newVis  = Array(N).fill(false)
    for (let i = 0; i < N; i++) {
      const imgStep = 1 + i * 2
      const txtStep = 2 + i * 2
      if (step >= imgStep) newVis[i]  = true
      if (step >= txtStep) newProg[i] = 1
      else if (step >= imgStep) newProg[i] = 0
    }
    return { newProg, newVis }
  }

  // ── Applique un step au track (translation horizontale) ──────────────────
  function applyStep(step, N) {
    if (!trackRef.current) return
    // Chaque oeuvre occupe 1 panel. On slide d'un panel à la fois.
    // step 0 = date (translateX 0)
    // step 1,2 = oeuvre 0 (translateX 1*vw)
    // step 3,4 = oeuvre 1 (translateX 2*vw)
    const panelIdx = step === 0 ? 0 : Math.ceil(step / 2)
    const tx = panelIdx * window.innerWidth
    trackRef.current.style.transform = `translateX(-${tx}px)`

    // Date visible seulement sur step 0
    if (step > 0) setDateAnim(false)
  }

  // ── Passe au step suivant avec animation de slide ────────────────────────
  function goToStep(targetStep, N, onDone) {
    if (stepping.current) return
    stepping.current = true

    const currentPanel = stepRef.current === 0 ? 0 : Math.ceil(stepRef.current / 2)
    const targetPanel  = targetStep   === 0 ? 0 : Math.ceil(targetStep / 2)
    const needsSlide   = targetPanel !== currentPanel

    if (needsSlide) {
      // Anime le slide horizontal
      const fromX = currentPanel * window.innerWidth
      const toX   = targetPanel  * window.innerWidth
      const DUR   = 500
      const t0    = performance.now()
      ;(function animSlide(now) {
        const t  = Math.min(1, (now - t0) / DUR)
        const tx = fromX + (toX - fromX) * easeInOut(t)
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${tx}px)`
        if (t < 1) { requestAnimationFrame(animSlide); return }
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${toX}px)`
        stepping.current = false
        onDone?.()
      })(performance.now())
    } else {
      stepping.current = false
      onDone?.()
    }
  }

  // ── Init d'une ère ───────────────────────────────────────────────────────
  function initEra(idx, startStep) {
    const N    = ERA_DATA[idx].oeuvres.length
    const step = startStep ?? 0
    eraIdxRef.current = idx
    stepRef.current   = step

    const { newProg, newVis } = stateFromStep(step, N)
    setEraIdx(idx)
    setStepIndex(step)
    setProgresses(newProg)
    setVisibles(newVis)

    // Date
    setDateAnim(false)
    setDateZoomOut(true)
    if (step === 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDateAnim(true))
      })
    }
  }

  // ── Retour chariot AVANT (fin d'ère → ère suivante) ─────────────────────
  function triggerReturnForward() {
    if (animating.current) return
    animating.current = true

    const fromEra = eraIdxRef.current
    const N       = ERA_DATA[fromEra].oeuvres.length
    const isLast  = fromEra >= ERA_DATA.length - 1

    // Phase 1 — slide retour vers le panel date (translateX → 0), 600ms
    const fromX = N * window.innerWidth
    const DUR1  = 600, t0 = performance.now()
    ;(function animReturn(now) {
      const t  = Math.min(1, (now - t0) / DUR1)
      const tx = fromX * (1 - easeInOut(t))
      if (trackRef.current) trackRef.current.style.transform = `translateX(-${tx}px)`
      if (t < 1) { requestAnimationFrame(animReturn); return }
      if (trackRef.current) trackRef.current.style.transform = 'translateX(0)'

      if (isLast) {
        animating.current = false
        isActive.current = false  // libère le scroll natif avant de naviguer
        if (nextSectionRef?.current) {
          nextSectionRef.current.scrollIntoView({ behavior: 'smooth' })
        }
        return
      }

      // Phase 2 — saut de ligne vers le bas (vwrap 0 → -100svh), 350ms
      const DUR2 = 350, t1 = performance.now()
      const vwrap = vwrapRef.current
      ;(function animJump(now) {
        const t   = Math.min(1, (now - t1) / DUR2)
        const pct = easeOut(t) * 100
        if (vwrap) vwrap.style.transform = `translateY(-${pct}svh)`
        if (t < 1) { requestAnimationFrame(animJump); return }

        if (vwrap) vwrap.style.transform = 'translateY(0)'
        initEra(fromEra + 1, 0)
        animating.current = false
      })(performance.now())
    })(performance.now())
  }

  // ── Retour chariot ARRIÈRE (début d'ère → ère précédente) ───────────────
  function triggerReturnBackward() {
    if (animating.current) return
    if (eraIdxRef.current === 0) return
    animating.current = true

    const prevIdx = eraIdxRef.current - 1
    const N       = ERA_DATA[prevIdx].oeuvres.length

    // Prépare l'ère précédente dans slot-current à progress=1 (dernier panel)
    eraIdxRef.current = prevIdx
    stepRef.current   = N * 2
    const { newProg, newVis } = stateFromStep(N * 2, N)
    setEraIdx(prevIdx)
    setStepIndex(N * 2)
    setProgresses(newProg)
    setVisibles(newVis)
    setDateAnim(false)

    if (trackRef.current) trackRef.current.style.transform = `translateX(-${N * window.innerWidth}px)`
    const vwrap = vwrapRef.current
    if (vwrap) vwrap.style.transform = 'translateY(-100svh)'

    requestAnimationFrame(() => {
      // Phase 1 — saut de ligne vers le haut : -100svh → 0, 350ms
      const DUR1 = 350, t0 = performance.now()
      ;(function animJump(now) {
        const t   = Math.min(1, (now - t0) / DUR1)
        const pct = (1 - easeOut(t)) * 100
        if (vwrap) vwrap.style.transform = `translateY(-${pct}svh)`
        if (t < 1) { requestAnimationFrame(animJump); return }
        if (vwrap) vwrap.style.transform = 'translateY(0)'

        // Phase 2 — slide direct de la dernière oeuvre vers la date, 700ms
        const fromX = N * window.innerWidth
        const DUR2  = 700, t1 = performance.now()
        ;(function animSlide(now) {
          const t  = Math.min(1, (now - t1) / DUR2)
          const tx = fromX * (1 - easeInOut(t))
          if (trackRef.current) trackRef.current.style.transform = `translateX(-${tx}px)`
          if (t < 1) { requestAnimationFrame(animSlide); return }
          if (trackRef.current) trackRef.current.style.transform = 'translateX(0)'

          // Arrivé sur la date
          stepRef.current = 0
          setStepIndex(0)
          setProgresses(Array(N).fill(0))
          setVisibles(Array(N).fill(false))
          setDateAnim(false)
          setDateZoomOut(true)
          requestAnimationFrame(() => requestAnimationFrame(() => setDateAnim(true)))
          animating.current = false
        })(performance.now())
      })(performance.now())
    })
  }

  // ── Avancer d'un step (scroll vers l'avant) ─────────────────────────────
  function stepForward() {
    if (animating.current || stepping.current) return
    const era  = ERA_DATA[eraIdxRef.current]
    const N    = era.oeuvres.length
    const maxStep = N * 2  // dernier step = texte dernière oeuvre
    const next = stepRef.current + 1

    if (next > maxStep) {
      // Fin de l'ère → retour chariot
      triggerReturnForward()
      return
    }

    goToStep(next, N, () => {
      stepRef.current = next
      setStepIndex(next)
      const { newProg, newVis } = stateFromStep(next, N)
      setProgresses(newProg)
      setVisibles(newVis)
      if (next > 0) setDateAnim(false)
    })
  }

  // ── Reculer d'un step (scroll vers l'arrière) ────────────────────────────
  function stepBackward() {
    if (animating.current || stepping.current) return
    const era = ERA_DATA[eraIdxRef.current]
    const N   = era.oeuvres.length
    const prev = stepRef.current - 1

    if (prev < 0) {
      // Début de l'ère → ère précédente
      triggerReturnBackward()
      return
    }

    goToStep(prev, N, () => {
      stepRef.current = prev
      setStepIndex(prev)
      const { newProg, newVis } = stateFromStep(prev, N)
      setProgresses(newProg)
      setVisibles(newVis)
      if (prev === 0) {
        setDateAnim(false)
        setDateZoomOut(true)
        requestAnimationFrame(() => requestAnimationFrame(() => setDateAnim(true)))
      }
    })
  }

  // ── Wrapper advance (détecte direction depuis delta) ─────────────────────
  const advance = useCallback((delta) => {
    if (Math.abs(delta) < 0.005) return
    if (delta > 0) stepForward()
    else stepBackward()
  }, [])

  // ── Jump direct vers une oeuvre (depuis le Menu) ───────────────────────────
  function jumpTo(targetEraIdx, oeuvreIdx) {
    if (animating.current) return
    const N          = ERA_DATA[targetEraIdx].oeuvres.length
    const targetStep = 1 + oeuvreIdx * 2
    initEra(targetEraIdx, targetStep)
    // Applique immédiatement le bon translateX sans animation
    if (trackRef.current) {
      const panelIdx = Math.ceil(targetStep / 2)
      trackRef.current.style.transform = `translateX(-${panelIdx * window.innerWidth}px)`
    }
    // Scroll vers le rail
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    onRegisterJump?.(jumpTo)
  }, [])

  // ── Réactivation depuis le footer (scroll arrière) ───────────────────────
  function reactivate() {
    const el = containerRef.current?.parentElement
    if (!el) return
    const y = el.offsetTop
    window.scrollTo(0, y)
    if (window.__eraRailSetLockedY) window.__eraRailSetLockedY(y)
    isActive.current = true
    // Place sur la dernière oeuvre de la dernière ère
    const lastEra  = ERA_DATA.length - 1
    const N        = ERA_DATA[lastEra].oeuvres.length
    const lastStep = N * 2
    initEra(lastEra, lastStep)
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${N * window.innerWidth}px)`
    }
  }

  useEffect(() => {
    onRegisterReactivate?.(reactivate)
  }, [])

  // ── Capture molette + blocage scroll natif quand EraRail est actif ───────
  useEffect(() => {
    let wheelBuf = 0
    let wheelTmr = null
    let lockedY   = 0

    // Bloque le scroll natif de la page pendant que EraRail est actif
    function preventScroll() {
      if (!isActive.current) return
      window.scrollTo(0, lockedY)
    }

    function onWheel(e) {
      if (!isActive.current) return
      e.preventDefault()
      e.stopPropagation()
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 24
      if (e.deltaMode === 2) dy *= window.innerHeight
      if (wheelTmr) return
      if (Math.abs(dy) < 10) return
      // Ère 0 + step 0 + scroll haut → scroll programmatique vers la section précédente
      if (eraIdxRef.current === 0 && stepRef.current === 0 && dy < 0) {
        isActive.current = false
        window.scrollTo({ top: lockedY - window.innerHeight, behavior: 'smooth' })
        wheelTmr = setTimeout(() => { wheelTmr = null }, 1000)
        return
      }
      advance(dy)
      wheelTmr = setTimeout(() => { wheelTmr = null }, 600)
    }

    let touchY = 0
    let touchBuf = 0
    function onTouchStart(e) {
      if (!isActive.current) return
      touchY   = e.touches[0].clientY
      touchBuf = 0
    }
    function onTouchMove(e) {
      if (!isActive.current) return
      e.preventDefault()
      const dy = touchY - e.touches[0].clientY
      touchY   = e.touches[0].clientY
      touchBuf += dy
      if (Math.abs(touchBuf) > 50) {
        advance(touchBuf)
        touchBuf = 0
      }
    }

    window.addEventListener('scroll',     preventScroll, { passive: false })
    window.addEventListener('wheel',      onWheel,       { passive: false })
    window.addEventListener('touchstart', onTouchStart,  { passive: true  })
    window.addEventListener('touchmove',  onTouchMove,   { passive: false })

    // Expose lockedY pour que l'IntersectionObserver puisse le mettre à jour
    window.__eraRailSetLockedY = (y) => { lockedY = y }

    return () => {
      window.removeEventListener('scroll',     preventScroll)
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      delete window.__eraRailSetLockedY
    }
  }, [advance])

  // ── IntersectionObserver — active/désactive + mémorise la position ───────
  useEffect(() => {
    // On observe le rail (position: relative, dans le flux normal) et non le
    // sticky (position: sticky), dont l'intersection ratio ne dépasse jamais
    // le seuil depuis sa position visuelle collée.
    const el = containerRef.current?.parentElement
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Utilise offsetTop du rail pour un lockedY fiable, indépendant de
        // l'état du smooth-scroll en cours au moment du déclenchement.
        const y = (entry.target).offsetTop
        window.scrollTo(0, y)
        if (window.__eraRailSetLockedY) window.__eraRailSetLockedY(y)
        if (window.__eraRailActive) window.__eraRailActive()
        isActive.current = true
      } else {
        isActive.current = false
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    initEra(0, 0)
  }, [])

  // ── Rendu ────────────────────────────────────────────────────────────────
  const era       = ERA_DATA[eraIdx]
  const DatePanel = era.DatePanel

  return (
    <div
      className="s-horizontal-rail"
      style={{ height: '100svh', position: 'relative' }}
    >
      {/* Sticky container — reste collé en haut pendant tout le scroll de la section */}
      <div
        ref={containerRef}
        className="s-horizontal-sticky"
        style={{ position: 'sticky', top: 0, height: '100svh', overflow: 'hidden' }}
      >
        {/*
          Clipper intermédiaire — position absolute + inset 0 + overflow hidden
          garantit que le slot-next (100svh plus bas) ne déborde jamais dans le viewport.
        */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}>
        {/*
          vwrap : height 200svh pour avoir deux slots de 100svh chacun.
          Quand on translate le vwrap de -100svh, le slot-next remonte dans le viewport.
          slot-current : top 0,      height 100svh → ère visible
          slot-next    : top 100svh, height 100svh → ère en transit
        */}
        <div
          ref={vwrapRef}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '200svh',
            willChange: 'transform',
          }}
        >
          {/* Slot current — ère visible */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '100svh',
            overflow: 'hidden',
          }}>
            {/* Track horizontal */}
            <div
              ref={trackRef}
              style={{
                display: 'flex',
                height: '100%',
                willChange: 'transform',
                width: `${(era.oeuvres.length + 1) * 100}vw`,
              }}
            >
              {/* Panel date */}
              <div className="h-panel">
                <DatePanel animated={dateAnim} zoomOut={dateZoomOut} />
              </div>

              {/* Panels oeuvres */}
              {era.oeuvres.map(({ Component }, i) => (
                <div key={`${eraIdx}-${i}`} className="h-panel">
                  <Component
                    progress={progresses[i] ?? 0}
                    canStart={visibles[i]   ?? false}
                    autoMode={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Slot next — invisible, zone d'atterrissage pour le saut de ligne */}
          <div style={{
            position: 'absolute',
            top: '100svh', left: 0, right: 0,
            height: '100svh',
            overflow: 'hidden',
            visibility: 'hidden',
          }} />
        </div>
        </div> {/* fin clipper */}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function AppInner() {
  const { toggleLang } = useLang()
  const [loadingDone, setLoadingDone] = useState(false)
  const lock = useScrollLock()

  const accueilRef       = useRef(null)
  const machineRef       = useRef(null)
  const livreRef         = useRef(null)
  const afterEraRef      = useRef(null)
  const eraJumpRef       = useRef(null)
  const eraReactivateRef = useRef(null)  // fn pour réveiller EraRail depuis le footer

  // ── Historique simple des sections visitées (pour bouton retour) ─────────
  const sectionHistoryRef = useRef([])
  function pushHistory(name) {
    const h = sectionHistoryRef.current
    if (h[h.length - 1] !== name) h.push(name)
  }
  function goBack() {
    const h = sectionHistoryRef.current
    if (h.length < 2) return
    h.pop() // retirer la section courante
    const prev = h[h.length - 1]
    if (prev === 'accueil') {
      accueilRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (prev === 'machine') {
      machineRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (prev === 'livre') {
      livreRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (prev === 'era') {
      eraReactivateRef.current?.()
    } else if (prev === 'footer') {
      afterEraRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Observe chaque section pour alimenter l'historique
  useEffect(() => {
    const entries = [
      { ref: accueilRef,  name: 'accueil' },
      { ref: machineRef,  name: 'machine' },
      { ref: livreRef,    name: 'livre'   },
      { ref: afterEraRef, name: 'footer'  },
    ]
    const observers = entries.map(({ ref, name }) => {
      const el = ref.current
      if (!el) return null
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) pushHistory(name)
      }, { threshold: 0.5 })
      obs.observe(el)
      return obs
    })
    // EraRail n'a pas de ref directe ici, on écoute via un event global
    window.__eraRailActive = () => pushHistory('era')
    return () => {
      observers.forEach(o => o?.disconnect())
      delete window.__eraRailActive
    }
  }, [])

  useSectionLock(accueilRef, lock)
  useSectionLock(machineRef, lock)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div ref={accueilRef}>
        <FrameAccueil canStart={loadingDone} />
      </div>

      <div ref={machineRef}>
        <FrameMachine />
      </div>

      <div ref={livreRef}>
        <FrameLivre />
      </div>

      {/* Les 4 ères — EraRail gère tout en interne */}
      <EraRail
        nextSectionRef={afterEraRef}
        onRegisterJump={fn => { eraJumpRef.current = fn }}
        onRegisterReactivate={fn => { eraReactivateRef.current = fn }}
      />

      {/* Section footer après les ères */}
      <div ref={afterEraRef}>
        <FrameFooter onScrollBack={() => eraReactivateRef.current?.()} />
      </div>

      <div id="keyboard-fixed"><Menu navigateTo={(era, oeuvre) => {
          console.log('[navigateTo]', era, oeuvre)
          if (era === 'machine') {
            machineRef.current?.scrollIntoView({ behavior: 'smooth' })
          } else if (era === 'toggleLang') {
            toggleLang()
          } else if (era === '__back__') {
            goBack()
          } else {
            eraJumpRef.current?.(era, oeuvre)
          }
        }} /></div>
      <StickyRoller />
      <ScrollHint />
      {!loadingDone && <PageChargement onFinish={() => setLoadingDone(true)} />}
    </>
  )
}

export default function App() {
  return <LangProvider><AppInner /></LangProvider>
}