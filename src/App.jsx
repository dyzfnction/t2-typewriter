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
  const [eraIdx,     setEraIdx]     = useState(0)
  const [dateAnim,   setDateAnim]   = useState(false)
  const [dateZoomOut,setDateZoomOut]= useState(false)
  const [stepIndex,  setStepIndex]  = useState(0)
  const [progresses, setProgresses] = useState([])
  const [visibles,   setVisibles]   = useState([])

  const eraIdxRef   = useRef(0)
  const stepRef     = useRef(0)
  const animating   = useRef(false)
  const stepping    = useRef(false)
  const isActive    = useRef(false)

  const containerRef = useRef(null)
  const vwrapRef     = useRef(null)
  const trackRef     = useRef(null)

  function stateFromStep(step, N) {
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

  function applyStep(step, N) {
    if (!trackRef.current) return
    const panelIdx = step === 0 ? 0 : Math.ceil(step / 2)
    const tx = panelIdx * window.innerWidth
    trackRef.current.style.transform = `translateX(-${tx}px)`
    if (step > 0) setDateAnim(false)
  }

  function goToStep(targetStep, N, onDone) {
    if (stepping.current) return
    stepping.current = true

    const currentPanel = stepRef.current === 0 ? 0 : Math.ceil(stepRef.current / 2)
    const targetPanel  = targetStep   === 0 ? 0 : Math.ceil(targetStep / 2)
    const needsSlide   = targetPanel !== currentPanel

    if (needsSlide) {
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

    setDateAnim(false)
    setDateZoomOut(true)
    if (step === 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDateAnim(true))
      })
    }
  }

  function triggerReturnForward() {
    if (animating.current) return
    animating.current = true

    const fromEra = eraIdxRef.current
    const N       = ERA_DATA[fromEra].oeuvres.length
    const isLast  = fromEra >= ERA_DATA.length - 1

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
        // FIX #3 & #6 : désactive EraRail puis délai avant scroll pour éviter
        // que preventScroll bloque le scrollIntoView
        isActive.current = false
        setTimeout(() => {
          if (nextSectionRef?.current) {
            nextSectionRef.current.scrollIntoView({ behavior: 'smooth' })
          }
        }, 50)
        return
      }

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

  function triggerReturnBackward() {
    if (animating.current) return
    if (eraIdxRef.current === 0) return
    animating.current = true

    const prevIdx = eraIdxRef.current - 1
    const N       = ERA_DATA[prevIdx].oeuvres.length

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
      const DUR1 = 350, t0 = performance.now()
      ;(function animJump(now) {
        const t   = Math.min(1, (now - t0) / DUR1)
        const pct = (1 - easeOut(t)) * 100
        if (vwrap) vwrap.style.transform = `translateY(-${pct}svh)`
        if (t < 1) { requestAnimationFrame(animJump); return }
        if (vwrap) vwrap.style.transform = 'translateY(0)'

        const fromX = N * window.innerWidth
        const DUR2  = 700, t1 = performance.now()
        ;(function animSlide(now) {
          const t  = Math.min(1, (now - t1) / DUR2)
          const tx = fromX * (1 - easeInOut(t))
          if (trackRef.current) trackRef.current.style.transform = `translateX(-${tx}px)`
          if (t < 1) { requestAnimationFrame(animSlide); return }
          if (trackRef.current) trackRef.current.style.transform = 'translateX(0)'

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

  function stepForward() {
    if (animating.current || stepping.current) return
    const era  = ERA_DATA[eraIdxRef.current]
    const N    = era.oeuvres.length
    const maxStep = N * 2
    const next = stepRef.current + 1

    if (next > maxStep) {
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

  function stepBackward() {
    if (animating.current || stepping.current) return
    const era = ERA_DATA[eraIdxRef.current]
    const N   = era.oeuvres.length
    const prev = stepRef.current - 1

    if (prev < 0) {
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

  const advance = useCallback((delta) => {
    if (Math.abs(delta) < 0.005) return
    if (delta > 0) stepForward()
    else stepBackward()
  }, [])

  function jumpTo(targetEraIdx, oeuvreIdx) {
    if (animating.current) return
    const N          = ERA_DATA[targetEraIdx].oeuvres.length
    const targetStep = 1 + oeuvreIdx * 2
    initEra(targetEraIdx, targetStep)
    if (trackRef.current) {
      const panelIdx = Math.ceil(targetStep / 2)
      trackRef.current.style.transform = `translateX(-${panelIdx * window.innerWidth}px)`
    }
    if (containerRef.current) containerRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    onRegisterJump?.(jumpTo)
  }, [])

  function reactivate() {
    const el = containerRef.current?.parentElement
    if (!el) return
    const y = el.offsetTop
    window.scrollTo(0, y)
    if (window.__eraRailSetLockedY) window.__eraRailSetLockedY(y)
    isActive.current = true
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

  // FIX #6 : expose une fonction de désactivation pour le Menu
  useEffect(() => {
    window.__eraRailDeactivate = () => { isActive.current = false }
    return () => { delete window.__eraRailDeactivate }
  }, [])

  useEffect(() => {
    let wheelBuf = 0
    let wheelTmr = null
    let lockedY   = 0

    // FIX #1 : ne bloque pas le scroll si StickyRoller est en train d'être draggé
    function preventScroll() {
      if (!isActive.current) return
      if (window.__rollerDragging) return
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

    window.__eraRailSetLockedY = (y) => { lockedY = y }

    return () => {
      window.removeEventListener('scroll',     preventScroll)
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      delete window.__eraRailSetLockedY
    }
  }, [advance])

  useEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
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

  useEffect(() => {
    initEra(0, 0)
  }, [])

  const era       = ERA_DATA[eraIdx]
  const DatePanel = era.DatePanel

  return (
    <div
      className="s-horizontal-rail"
      style={{ height: '100svh', position: 'relative' }}
    >
      <div
        ref={containerRef}
        className="s-horizontal-sticky"
        style={{ position: 'sticky', top: 0, height: '100svh', overflow: 'hidden' }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}>
        <div
          ref={vwrapRef}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '200svh',
            willChange: 'transform',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '100svh',
            overflow: 'hidden',
          }}>
            <div
              ref={trackRef}
              style={{
                display: 'flex',
                height: '100%',
                willChange: 'transform',
                width: `${(era.oeuvres.length + 1) * 100}vw`,
              }}
            >
              <div className="h-panel">
                <DatePanel animated={dateAnim} zoomOut={dateZoomOut} />
              </div>

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

          <div style={{
            position: 'absolute',
            top: '100svh', left: 0, right: 0,
            height: '100svh',
            overflow: 'hidden',
            visibility: 'hidden',
          }} />
        </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function AppInner({ toggleLangExternal }) {
  const { toggleLang: toggleLangCtx } = useLang()
  const toggleLang = toggleLangExternal ?? toggleLangCtx
  const [loadingDone, setLoadingDone] = useState(false)
  const lock = useScrollLock()

  const accueilRef       = useRef(null)
  const machineRef       = useRef(null)
  const livreRef         = useRef(null)
  const afterEraRef      = useRef(null)
  const eraJumpRef       = useRef(null)
  const eraReactivateRef = useRef(null)

  // FIX #2 : flag pour empêcher pushHistory pendant un goBack()
  const isGoingBackRef = useRef(false)

  const sectionHistoryRef = useRef([])
  function pushHistory(name) {
    // FIX #2 : ignore les intersections déclenchées par la navigation goBack
    if (isGoingBackRef.current) return
    const h = sectionHistoryRef.current
    if (h[h.length - 1] !== name) h.push(name)
  }
  function goBack() {
    const h = sectionHistoryRef.current
    if (h.length < 2) return
    h.pop()
    const prev = h[h.length - 1]

    // FIX #2 : bloque pushHistory pendant la durée de la transition
    isGoingBackRef.current = true
    setTimeout(() => { isGoingBackRef.current = false }, 1400)

    // FIX #6 : désactive EraRail avant tout scrollIntoView
    window.__eraRailDeactivate?.()

    if (prev === 'accueil') {
      setTimeout(() => accueilRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } else if (prev === 'machine') {
      setTimeout(() => machineRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } else if (prev === 'livre') {
      setTimeout(() => livreRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } else if (prev === 'era') {
      eraReactivateRef.current?.()
    } else if (prev === 'footer') {
      setTimeout(() => afterEraRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

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

      <EraRail
        nextSectionRef={afterEraRef}
        onRegisterJump={fn => { eraJumpRef.current = fn }}
        onRegisterReactivate={fn => { eraReactivateRef.current = fn }}
      />

      <div ref={afterEraRef}>
        <FrameFooter onScrollBack={() => eraReactivateRef.current?.()} />
      </div>

      <div id="keyboard-fixed"><Menu navigateTo={(era, oeuvre) => {
          if (era === 'machine') {
            // FIX #6 : désactive EraRail avant de naviguer vers une autre section
            window.__eraRailDeactivate?.()
            setTimeout(() => machineRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
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
  const [lang, setLang] = useState('fr')
  const toggleLang = () => setLang(l => l === 'fr' ? 'en' : 'fr')
  return (
    <LangProvider lang={lang} toggleLang={toggleLang}>
      <AppInner key={lang} toggleLangExternal={toggleLang} />
    </LangProvider>
  )
}
