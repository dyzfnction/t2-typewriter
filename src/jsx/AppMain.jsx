import { useEffect, useRef, useState } from 'react'

// ── DONNÉES ───────────────────────────────────────────────────────────────────

const TITLE_SEGMENTS = [
  { text: 'A Visual History of Typewriter Art ' },
  { br: true },
  { text: 'from ' },
  { text: '1893', strong: true },
  { text: ' to ' },
  { text: 'Today', strong: true },
]

const ROWS = [
  [
    { label: '🖨', key: 'print' },
    { label: 'I',   key: 'I'   },
    { label: 'II',  key: 'II'  },
    { label: 'III', key: 'III' },
    { label: 'IV',  key: 'IV'  },
    { label: '', key: 'lang' },
  ],
  [
    { label: 'V',    key: 'V'    },
    { label: 'VI',   key: 'VI'   },
    { label: 'VII',  key: 'VII'  },
    { label: 'VIII', key: 'VIII' },
    { label: 'IX',   key: 'IX'   },
  ],
  [
    { label: '+',    key: 'menu' },
    { label: 'X',    key: 'X'    },
    { label: 'XI',   key: 'XI'   },
    { label: 'XII',  key: 'XII'  },
    { label: 'XIII', key: 'XIII' },
    { label: 'B',    key: 'back' },
  ],
]

// Titre section (petite accroche au-dessus)
const BLACK_TITLE = "— La machine à écrire —"

// Textes — deux zones, machine à états typewriter scroll-locked
// HAUT : T1 → T2 → T4
// BAS  : (démarre avec T2) T3 → T5
// T1 seul d'abord, puis T2+T3 en parallèle, puis T4 (haut) quand T3 fini,
// puis T5 (bas) quand T4 fini, puis 5s → transition livre
const T1 = "La machine à écrire, comme toute technologie, est passée de révolutionnaire à son apogée à un symbole sentimental d'obsolescence à notre époque."
const T2 = "La machine à écrire est conçue pour une utilisation très simple. Une feuille de papier est insérée à l'arrière du cylindre (le rouleau)."
const T3 = "Celle-ci avance ensuite vers l'avant, se plaçant derrière un ruban coloré, généralement noir, ou noir et rouge. Lorsqu'une lettre est pressée sur une touche, une barre de frappe se lève."
const T4 = "Celle-ci frappe alors le ruban pour imprimer un caractère sur le papier. Le chariot avance d'une ligne, puis on peut appuyer sur la barre du caractère suivant."
const T5 = "Arrivé en fin de ligne, le chariot est ramené à son point de départ, le cylindre pivote pour préparer la ligne suivante, et le processus se répète jusqu'à ce que la page soit pleine."

const QUOTE        = '"Art is not a thing — it is a way."'
const QUOTE_AUTHOR = 'Elbert Hubbard, 1908'

// ── ZONES DE SCROLL ───────────────────────────────────────────────────────────
//
// wrapper = 1500vh
//
// Chaque "zone de repos" est une plage de scroll où rien de visible ne change.
// L'utilisateur scroll librement pendant ces ~3s, puis la prochaine animation démarre.
//
// 0.000 – 0.040  Accueil (repos)
// 0.040 – 0.080  Fade accueil → noir                   [transition]
// 0.080 – 0.130  REPOS 1→2  (fond noir, rien ne bouge)
// 0.130 – 0.160  Fade in contenu machine
// 0.160 – 0.210  Titre s'écrit au scroll
// 0.210 – 0.235  Segment 0 s'écrit
// 0.235 – 0.260  Segment 1 s'écrit
// 0.260 – 0.285  Segment 2 s'écrit
// 0.285 – 0.310  Segment 3 s'écrit
// 0.310 – 0.370  REPOS 2→3  (fond noir, éléments fade out mi-chemin)
//   0.310 – 0.345  Éléments page 2 font fade out
//   0.345 – 0.370  Fond noir pur
// 0.370 – 0.410  Fade noir → beige
// 0.410 – 1.000  LIVRE + CITATION
//   0.420 – 0.540  Couverture tourne
//   0.560 – 0.670  Page 1 tourne
//   0.690 – 0.800  Page 2 tourne
//   0.820 – 1.000  Citation s'écrit

const S1_FADE_S    = 0.040
const S1_FADE_E    = 0.080

const TITLE_S      = 0.160
const TITLE_E      = 0.210
// Après TITLE_E, la machine à états typewriter prend le relais (scroll-locked)

const P2_FADEOUT_S = 0.310
const P2_FADEOUT_E = 0.350

const S23_FADE_S   = 0.370
const S23_FADE_E   = 0.410

const CHAR_MS      = 28    // vitesse frappe normale
const CHAR_MS_FAST = 5     // vitesse si scroll pendant écriture

const COVER_S  = 0.420
const COVER_E  = 0.540
const PAGE1_S  = 0.560
const PAGE1_E  = 0.670
const PAGE2_S  = 0.690
const PAGE2_E  = 0.800
const QUOTE_S  = 0.820
const QUOTE_E  = 1.000

const RANGE = 0.85

// ── UTILS ─────────────────────────────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
function lerp01(val, start, end) {
  if (end <= start) return val >= end ? 1 : 0
  return Math.max(0, Math.min(1, (val - start) / (end - start)))
}

// ── COMPOSANT ─────────────────────────────────────────────────────────────────

export default function AppMain({ canStart }) {

  const [nodes, setNodes]                         = useState([])
  const [homeClickMenuOpen, setHomeClickMenuOpen] = useState(true)
  const [blackMenuOpen, setBlackMenuOpen]         = useState(false)

  const cancelRef = useRef(false)

  const blackOverlayRef   = useRef(null)
  const beigeOverlayRef   = useRef(null)
  const headerRef         = useRef(null)
  const blackContentRef   = useRef(null)
  const blackTitleRef     = useRef(null)
  // Deux zones de texte séparées : haut et bas
  const blackTopRef       = useRef(null)
  const blackBotRef       = useRef(null)

  const bookSectionRef     = useRef(null)
  const coverRef           = useRef(null)
  const page1Ref           = useRef(null)
  const page2Ref           = useRef(null)
  const slotLeftInner1Ref  = useRef(null)
  const slotRightInner1Ref = useRef(null)
  const slotLeftInner2Ref  = useRef(null)
  const slotRightInner2Ref = useRef(null)
  const quoteTextRef       = useRef(null)
  const quoteAuthorRef     = useRef(null)

  const homeScrollMenuRef = useRef(null)
  const homeClickMenuRef  = useRef(null)
  const blackMenuRef      = useRef(null)
  const wrapperRef        = useRef(null)
  const keyElRefs         = useRef({})

  const s = useRef({
    scrollPct:     0,
    menuProgress:  0,
    menuCollapsed: false,
    menuAnimating: false,
    sorted:        [],
    // Machine à états typewriter
    twPhase:       'idle',   // 'idle'|'title'|'tw'|'done'
    // État de chaque zone (haut/bas)
    topText:       '',       // texte actuellement affiché en haut
    botText:       '',       // texte actuellement affiché en bas
    topTarget:     '',       // texte cible haut
    botTarget:     '',       // texte cible bas
    topCur:        0,        // nb chars écrits
    botCur:        0,
    topDone:       false,    // zone finie
    botDone:       false,
    // Séquence
    seqStep:       0,        // 0=T1, 1=T2+T3, 2=T4, 3=T5, 4=wait5s, 5=livre
    scrollLocked:  false,
    lockedScrollY: 0,
    charMs:        CHAR_MS,
    twLastTick:    0,
    wait5Timer:    null,     // timer pour les 5s
    titleCur:      0,        // chars du titre scroll-driven
    titleDone:     false,
  })

  useEffect(() => { window.scrollTo(0, 0) }, [])

  // ── TYPEWRITER TITRE ACCUEIL ──────────────────────────────────────────────
  useEffect(() => {
    if (!canStart) return
    cancelRef.current = true
    const timeout = setTimeout(() => {
      cancelRef.current = false
      setNodes([])
      const sleep = ms => new Promise(r => setTimeout(r, ms))
      async function type() {
        let id = 0
        for (const seg of TITLE_SEGMENTS) {
          if (cancelRef.current) return
          if (seg.br) {
            await sleep(280); if (cancelRef.current) return
            setNodes(n => [...n, { id: id++, type: 'br' }]); continue
          }
          if (seg.strong) {
            const nodeId = id++
            setNodes(n => [...n, { id: nodeId, type: 'strong', content: '' }])
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => n.map(nd => nd.id === nodeId ? { ...nd, content: nd.content + char } : nd))
              await sleep(Math.max(48 + (Math.random() - 0.5) * 18, 20))
            }
          } else {
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => [...n, { id: id++, type: 'text', content: char }])
              await sleep(Math.max(55 + (Math.random() - 0.5) * 18, 20))
            }
          }
        }
      }
      type()
    }, 50)
    return () => { cancelRef.current = true; clearTimeout(timeout) }
  }, [canStart])

  // ── COMPUTE ORDER ─────────────────────────────────────────────────────────
  function computeOrder() {
    const menuEl = homeScrollMenuRef.current
    if (!menuEl) return
    const menuTouche = menuEl.querySelector('.touche')
    if (!menuTouche) return
    const tr = menuTouche.getBoundingClientRect()
    const menuCx = tr.left + tr.width / 2
    const menuCy = tr.top + tr.height / 2
    const items = Object.entries(keyElRefs.current)
      .filter(([, el]) => el)
      .map(([key, el]) => {
        const touche = el.querySelector('.touche')
        if (!touche) return null
        const r = touche.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = menuCx - cx
        const dy = menuCy - cy
        return { key, el, dx, dy, dist: Math.hypot(dx, dy) }
      })
      .filter(Boolean)
      .sort((a, b) => a.dist - b.dist)
    s.current.sorted = items
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    const { scrollPct, menuProgress, menuCollapsed, sorted } = s.current
    const N = sorted.length
    if (!N) return

    const fadeBlack = easeInOut(lerp01(scrollPct, S1_FADE_S, S1_FADE_E))
    if (blackOverlayRef.current)
      blackOverlayRef.current.style.opacity = String(fadeBlack)

    const fadeP2Out = easeInOut(lerp01(scrollPct, P2_FADEOUT_S, P2_FADEOUT_E))

    const fadeBeige = easeInOut(lerp01(scrollPct, S23_FADE_S, S23_FADE_E))
    if (beigeOverlayRef.current)
      beigeOverlayRef.current.style.opacity = String(fadeBeige)

    if (headerRef.current)
      headerRef.current.style.opacity = String(1 - fadeBlack)

    // Touches page 1
    if (scrollPct < S1_FADE_E) {
      sorted.forEach((item, i) => {
        const iRev = N - 1 - i
        const pScroll = lerp01(scrollPct, 0, S1_FADE_S)
        const sStart = (iRev / N) * RANGE
        const sEnd = Math.min(1, sStart + RANGE / N + 0.1)
        const easedScroll = easeInOut(lerp01(pScroll, sStart, sEnd))
        const cStart = (iRev / N) * RANGE
        const cEnd = Math.min(1, cStart + RANGE / N + 0.1)
        const easedClose = easeInOut(lerp01(menuProgress, cStart, cEnd))
        const openP = 1 - menuProgress
        const oStart = (i / N) * RANGE
        const oEnd = Math.min(1, oStart + RANGE / N + 0.1)
        const easedOpen = easeInOut(lerp01(openP, oStart, oEnd))
        const easedMenu = menuCollapsed ? easedClose : (1 - easedOpen)
        const eased = Math.max(easedScroll, easedMenu)
        item.el.style.transform = `translate(${item.dx * eased}px, ${item.dy * eased}px)`
        item.el.style.opacity = String(1 - eased)
        item.el.style.transition = 'none'
      })
    }

    // Boutons menu
    const onHome  = fadeBlack <= 0.02
    const onBlack = fadeBlack >= 0.98 && fadeBeige <= 0.02
    if (homeScrollMenuRef.current) {
      homeScrollMenuRef.current.style.opacity = onHome ? '1' : '0'
      homeScrollMenuRef.current.style.pointerEvents = onHome ? 'auto' : 'none'
    }
    if (homeClickMenuRef.current) {
      homeClickMenuRef.current.style.opacity = onHome ? '1' : '0'
      homeClickMenuRef.current.style.pointerEvents = onHome ? 'auto' : 'none'
    }
    if (blackMenuRef.current) {
      blackMenuRef.current.style.opacity = onBlack ? '1' : '0'
      blackMenuRef.current.style.pointerEvents = onBlack ? 'auto' : 'none'
    }

    // Page 2 opacité globale
    const p2FadeIn  = easeInOut(lerp01(fadeBlack, 0.85, 1))
    const p2Opacity = p2FadeIn * (1 - fadeP2Out) * (1 - fadeBeige)
    if (blackContentRef.current)
      blackContentRef.current.style.opacity = String(p2Opacity)

    // Titre section : s'affiche avec le contenu noir (pas scroll-driven char par char)
    if (blackTitleRef.current)
      blackTitleRef.current.textContent = BLACK_TITLE

    // Déclencher la machine typewriter quand le scroll atteint TITLE_E
    const st = s.current
    if (!st.titleDone && scrollPct >= TITLE_E) {
      st.titleDone   = true
      st.twPhase     = 'tw'
      startSeqStep(0)
    }

    // Section livre
    if (bookSectionRef.current) {
      bookSectionRef.current.style.opacity = String(fadeBeige)
      bookSectionRef.current.style.pointerEvents = fadeBeige > 0.5 ? 'auto' : 'none'
    }

    // Couverture 0° → -180°
    const coverP = easeInOut(lerp01(scrollPct, COVER_S, COVER_E))
    if (coverRef.current)
      coverRef.current.style.transform = `rotateY(${-180 * coverP}deg)`

    // Slot 1 fade in quand couverture posée
    const afterCover = easeInOut(lerp01(coverP, 0.75, 1.0))
    if (slotLeftInner1Ref.current)  slotLeftInner1Ref.current.style.opacity  = String(afterCover)
    if (slotRightInner1Ref.current) slotRightInner1Ref.current.style.opacity = String(afterCover)

    // Page 1 — visible dès que couverture se lève
    const p1visible = easeInOut(lerp01(coverP, 0.10, 0.35))
    if (page1Ref.current) page1Ref.current.style.opacity = String(p1visible)

    const page1P = easeInOut(lerp01(scrollPct, PAGE1_S, PAGE1_E))
    if (page1Ref.current)
      page1Ref.current.style.transform = `rotateY(${-180 * page1P}deg)`

    // Slot 2 fade in quand page 1 posée
    const afterPage1 = easeInOut(lerp01(page1P, 0.75, 1.0))
    if (slotLeftInner2Ref.current)  slotLeftInner2Ref.current.style.opacity  = String(afterPage1)
    if (slotRightInner2Ref.current) slotRightInner2Ref.current.style.opacity = String(afterPage1)

    // Page 2 — visible dès que page 1 se lève
    const p2visible = easeInOut(lerp01(page1P, 0.10, 0.35))
    if (page2Ref.current) page2Ref.current.style.opacity = String(p2visible)

    const page2P = easeInOut(lerp01(scrollPct, PAGE2_S, PAGE2_E))
    if (page2Ref.current)
      page2Ref.current.style.transform = `rotateY(${-180 * page2P}deg)`

    // Citation s'écrit au scroll
    const quoteChars = Math.round(lerp01(scrollPct, QUOTE_S, QUOTE_E) * QUOTE.length)
    if (quoteTextRef.current)
      quoteTextRef.current.textContent = QUOTE.slice(0, quoteChars)
    if (quoteAuthorRef.current)
      quoteAuthorRef.current.style.opacity = lerp01(scrollPct, QUOTE_S, QUOTE_E) >= 1 ? '1' : '0'
  }

  // ── SCROLL ────────────────────────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const st = s.current
      const el = wrapperRef.current
      if (!el) return

      // Bloquer le scroll pendant l'écriture
      if (st.scrollLocked) {
        window.scrollTo(0, st.lockedScrollY)
        return
      }

      const total = el.offsetHeight - window.innerHeight
      const prev  = st.scrollPct
      st.scrollPct = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0
      const cur = st.scrollPct

      // Accélérer si scroll pendant écriture
      if ((st.topTarget && st.topCur < st.topTarget.length) ||
          (st.botTarget && st.botCur < st.botTarget.length)) {
        if (cur > prev) st.charMs = CHAR_MS_FAST
      }

      // Réarmer le timer 5s si l'utilisateur scroll pendant l'attente
      if (st.seqStep === 4 && cur > prev) {
        scheduleBookTransition()
      }

      if (cur >= S1_FADE_S && st.menuProgress < 1 && !st.menuAnimating) {
        st.menuCollapsed = true; st.menuProgress = 1
      }
      if (cur < S1_FADE_S && st.menuCollapsed) {
        st.menuCollapsed = false; st.menuProgress = 0
        setHomeClickMenuOpen(true)
        const { sorted } = st
        const N = sorted.length
        sorted.forEach((item, i) => {
          item.el.style.transition = 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s ease'
          item.el.style.transitionDelay = `${(i / N) * 0.3}s`
          item.el.style.transform = 'translate(0px, 0px)'
          item.el.style.opacity = '1'
        })
      }
      render()
    }
    window.addEventListener('scroll', onScroll, { passive: false })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── MACHINE À ÉTATS TYPEWRITER ────────────────────────────────────────────
  // Séquence :
  //   step 0 : HAUT = T1 (seul, bas vide)              → scroll-locked
  //   step 1 : HAUT efface T1 → écrit T2, BAS écrit T3  → scroll-locked (parallèle)
  //            quand T3 fini → step 2
  //   step 2 : HAUT efface T2 → écrit T4               → scroll-locked
  //            quand T4 fini → step 3
  //   step 3 : BAS efface T3 → écrit T5                → scroll-locked
  //            quand T5 fini → step 4
  //   step 4 : attente 5s sans nouveau scroll → transition vers livre
  function startSeqStep(step) {
    const st = s.current
    st.seqStep     = step
    st.topCur      = 0
    st.botCur      = 0
    st.topDone     = false
    st.botDone     = false
    st.charMs      = CHAR_MS
    st.scrollLocked  = true
    st.lockedScrollY = window.scrollY

    if (step === 0) {
      // Haut : écrire T1. Bas : vide (considéré fini d'office).
      st.topText   = ''
      st.botText   = ''
      st.topTarget = T1
      st.botTarget = null
      st.botDone   = true   // pas de bas à ce step
    } else if (step === 1) {
      // Haut : effacer T1 puis écrire T2 (on efface en vidant instantanément)
      // Bas : écrire T3 en parallèle
      st.topText   = ''   // effacement instantané
      st.botText   = ''
      st.topTarget = T2
      st.botTarget = T3
      if (blackTopRef.current) blackTopRef.current.textContent = ''
      if (blackBotRef.current) blackBotRef.current.textContent = ''
    } else if (step === 2) {
      // Haut : effacer T2 → écrire T4. Bas reste avec T3.
      st.topText   = ''
      st.topTarget = T4
      st.botTarget = null  // bas ne bouge pas
      st.botDone   = true  // bas considéré fini pour ce step
      if (blackTopRef.current) blackTopRef.current.textContent = ''
    } else if (step === 3) {
      // Bas : effacer T3 → écrire T5. Haut reste avec T4.
      st.botText   = ''
      st.topTarget = null  // haut ne bouge pas
      st.topDone   = true  // haut considéré fini
      st.botTarget = T5
      if (blackBotRef.current) blackBotRef.current.textContent = ''
    } else if (step === 4) {
      // Tout est écrit, on libère le scroll et on attend 5s
      st.scrollLocked = false
      // Le timer repart à chaque scroll (reset dans onScroll)
      scheduleBookTransition()
    }
  }

  function scheduleBookTransition() {
    const st = s.current
    if (st.wait5Timer) clearTimeout(st.wait5Timer)
    st.wait5Timer = setTimeout(() => {
      doBookTransition()
    }, 5000)
  }

  function doBookTransition() {
    // Déclencher le scroll jusqu'à P2_FADEOUT_S puis laisser continuer
    const st = s.current
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const total = wrapper.offsetHeight - window.innerHeight
    const targetY = P2_FADEOUT_S * total
    window.scrollTo({ top: targetY, behavior: 'smooth' })
  }

  // RAF typewriter — tourne en permanence
  useEffect(() => {
    let rafId
    function twTick(now) {
      rafId = requestAnimationFrame(twTick)
      const st = s.current
      if (st.twPhase !== 'tw') return
      if (now - st.twLastTick < st.charMs) return
      st.twLastTick = now

      const step = st.seqStep
      if (step >= 4) return

      // Écrire le haut
      if (st.topTarget && !st.topDone) {
        if (st.topCur < st.topTarget.length) {
          st.topCur++
          const txt = st.topTarget.slice(0, st.topCur)
          if (blackTopRef.current) blackTopRef.current.textContent = txt
        } else {
          st.topDone = true
        }
      }

      // Écrire le bas (en parallèle si les deux ont un target)
      if (st.botTarget && !st.botDone) {
        if (st.botCur < st.botTarget.length) {
          st.botCur++
          const txt = st.botTarget.slice(0, st.botCur)
          if (blackBotRef.current) blackBotRef.current.textContent = txt
        } else {
          st.botDone = true
        }
      }

      // Transitions entre steps quand les zones sont finies
      if (st.topDone && st.botDone) {
        if (step === 0) {
          startSeqStep(1)
        } else if (step === 1) {
          // T3 (bas) est fini → passer à T4 (haut)
          startSeqStep(2)
        } else if (step === 2) {
          // T4 (haut) est fini → passer à T5 (bas)
          startSeqStep(3)
        } else if (step === 3) {
          // T5 (bas) est fini → attente 5s
          startSeqStep(4)
        }
      }
    }
    rafId = requestAnimationFrame(twTick)
    return () => cancelAnimationFrame(rafId)
  }, [])
  function animateMenuTo(target) {
    const st = s.current
    if (st.menuAnimating) return
    st.menuAnimating = true
    const from = st.menuProgress; const t0 = performance.now()
    function step(now) {
      const t = Math.min(1, (now - t0) / 600)
      st.menuProgress = from + (target - from) * easeInOut(t)
      st.menuCollapsed = st.menuProgress > 0.5
      render()
      if (t < 1) requestAnimationFrame(step)
      else { st.menuProgress = target; st.menuCollapsed = target === 1; st.menuAnimating = false; render() }
    }
    requestAnimationFrame(step)
  }
  function handleHomeScrollMenuClick() {
    const st = s.current
    if (st.menuAnimating) return
    animateMenuTo(st.menuCollapsed ? 0 : 1)
  }
  function toggleKeys(open) {
    const { sorted } = s.current; const N = sorted.length
    sorted.forEach((item, i) => {
      const iRev = N - 1 - i
      if (open) {
        item.el.style.transition = 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s ease'
        item.el.style.transitionDelay = `${(i / N) * 0.3}s`
        item.el.style.transform = 'translate(0px, 0px)'
        item.el.style.opacity = '1'
      } else {
        item.el.style.transition = 'transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s ease'
        item.el.style.transitionDelay = `${(iRev / N) * 0.3}s`
        item.el.style.transform = `translate(${item.dx}px, ${item.dy}px)`
        item.el.style.opacity = '0'
      }
    })
  }
  function handleHomeClickMenuClick() {
    setHomeClickMenuOpen(prev => { toggleKeys(!prev); return !prev })
  }
  function handleBlackMenuClick() {
    setBlackMenuOpen(prev => { toggleKeys(!prev); return !prev })
  }

  // ── MOUNT ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      computeOrder(); render()
      const { sorted } = s.current
      sorted.forEach(item => {
        item.el.style.transition = 'none'
        item.el.style.transitionDelay = '0s'
        item.el.style.transform = 'translate(0px, 0px)'
        item.el.style.opacity = '1'
      })
    }, 200)
    window.addEventListener('resize', computeOrder)
    return () => { clearTimeout(t); window.removeEventListener('resize', computeOrder) }
  }, [])

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="app-scroll-wrapper" style={{ height: '1500vh' }}>
      <div className="app-main">

        <div ref={blackOverlayRef} className="app-fade-overlay" style={{ opacity: 0, zIndex: 10 }} />

        <div ref={beigeOverlayRef} style={{
          position: 'absolute', inset: 0, background: '#FFFBE8',
          opacity: 0, pointerEvents: 'none', zIndex: 30,
        }} />

        {/* ── PAGE 2 : machine noire ── */}
        <div ref={blackContentRef} className="app-black-content" style={{ opacity: 0, zIndex: 20 }}>
          <h2 ref={blackTitleRef} className="app-black-title" />
          <div className="app-black-image">
            <div className="app-black-image-placeholder" />
          </div>
          {/* Zone HAUT — sous le titre */}
          <p
            ref={blackTopRef}
            style={{
              position: 'absolute',
              top: '6.5rem',
              left: '2.5rem', right: '2.5rem',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '0.85rem',
              lineHeight: 1.8,
              letterSpacing: '0.04em',
              color: 'rgba(255,251,232,0.85)',
            }}
          />
          {/* Zone BAS — au-dessus du bas */}
          <p
            ref={blackBotRef}
            style={{
              position: 'absolute',
              bottom: '5rem', left: '2.5rem', right: '2.5rem',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '0.85rem',
              lineHeight: 1.8,
              letterSpacing: '0.04em',
              color: 'rgba(255,251,232,0.75)',
            }}
          />
        </div>

        {/* ── PAGE 3 : livre + citation ── */}
        <div ref={bookSectionRef} style={{
          position: 'absolute', inset: 0, zIndex: 31,
          opacity: 0, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column',
          background: '#FFFBE8',
        }}>

          {/* Livre */}
          <div style={{
            flex: '0 0 58%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'relative',
              width: 'min(560px, 92vw)',
              height: 'min(380px, 66vw)',
              display: 'flex',
              perspective: '1400px',
              perspectiveOrigin: 'center center',
            }}>

              {/* Slot gauche — vide au départ */}
              <div style={{
                flex: 1, height: '100%',
                background: 'linear-gradient(160deg,#ede4c8,#e0d5b0)',
                borderRadius: '6px 0 0 6px',
                boxShadow: 'inset -6px 0 16px rgba(0,0,0,0.18)',
                overflow: 'hidden', position: 'relative',
              }}>
                <div ref={slotLeftInner1Ref} style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.6rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.65rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Introduction</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.7rem', color: '#444', lineHeight: 1.85 }}>
                    From the earliest typewriter experiments of the 1890s, artists discovered a new medium hidden inside an office machine.
                  </p>
                </div>
                <div ref={slotLeftInner2Ref} style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.6rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.65rem', color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Chapter I</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.7rem', color: '#444', lineHeight: 1.85 }}>
                    The machine that was built for correspondence became, in certain hands, a tool of extraordinary intimacy.
                  </p>
                </div>
              </div>

              {/* Reliure */}
              <div style={{
                width: '8px', flexShrink: 0, zIndex: 20,
                background: 'linear-gradient(90deg,#a89468,#c8b080,#a89468)',
                boxShadow: '0 0 6px rgba(0,0,0,0.2)',
              }} />

              {/* Slot droit */}
              <div style={{
                flex: 1, height: '100%',
                background: 'linear-gradient(160deg,#f0e8d0,#ede4c8)',
                borderRadius: '0 6px 6px 0',
                boxShadow: 'inset 6px 0 14px rgba(0,0,0,0.10)',
                overflow: 'hidden', position: 'relative',
              }}>
                <div ref={slotRightInner1Ref} style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.6rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#111', textAlign: 'center' }}>Typewriter Art</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.62rem', color: '#888', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', width: '80%' }}>A Modern Anthology</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.68rem', color: '#555', lineHeight: 1.85 }}>
                    A sweeping anthology tracing typewriter art from 1893 through to today's revival.
                  </p>
                </div>
                <div ref={slotRightInner2Ref} style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.5rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '1rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#111', textAlign: 'center' }}>Origins</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.68rem', color: '#555', lineHeight: 1.85 }}>
                    The typewriter was patented in 1868. By 1893, the first known examples appeared — intricate portraits made entirely with punctuation.
                  </p>
                </div>
              </div>

              {/* Couverture noire — demi-droite, pivot sur reliure */}
              <div ref={coverRef} style={{
                position: 'absolute', top: 0, right: 0,
                width: 'calc(50% - 4px)', height: '100%',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                zIndex: 15,
                transform: 'rotateY(0deg)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(150deg,#222018,#0e0e09)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: '6px 0 20px rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '0.75rem', padding: '2rem 1.5rem',
                }}>
                  <div style={{ width: '65%', height: '1px', background: 'rgba(255,251,232,0.28)' }} />
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '1rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#FFFBE8', textAlign: 'center', lineHeight: 1.45 }}>
                    TYPEWRITER<br />ART
                  </p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,251,232,0.38)' }}>A Modern Anthology</p>
                  <div style={{ width: '65%', height: '1px', background: 'rgba(255,251,232,0.28)' }} />
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(160deg,#f5eed8,#ede4c8)',
                  borderRadius: '6px 0 0 6px',
                  boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.07)',
                }} />
              </div>

              {/* Page 1 */}
              <div ref={page1Ref} style={{
                position: 'absolute', top: 0, right: 0,
                width: 'calc(50% - 4px)', height: '100%',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                zIndex: 12, transform: 'rotateY(0deg)', opacity: 0,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(160deg,#ede4c8,#e5d9b8)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: '4px 0 14px rgba(0,0,0,0.28)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.6rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.6rem', color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Barrie Tullett</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.75rem', fontWeight: 700, color: '#333', textAlign: 'center', lineHeight: 1.5 }}>Typographer<br />&amp; Artist</p>
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(160deg,#f2ebda,#e8dfc8)',
                  borderRadius: '6px 0 0 6px',
                  boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.06)',
                }} />
              </div>

              {/* Page 2 */}
              <div ref={page2Ref} style={{
                position: 'absolute', top: 0, right: 0,
                width: 'calc(50% - 4px)', height: '100%',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                zIndex: 11, transform: 'rotateY(0deg)', opacity: 0,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(160deg,#ede4c8,#e5d9b8)',
                  borderRadius: '0 6px 6px 0',
                  boxShadow: '4px 0 14px rgba(0,0,0,0.22)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '2rem', gap: '0.5rem',
                }}>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.6rem', color: '#999', letterSpacing: '0.12em', textTransform: 'uppercase' }}>1893 — 2024</p>
                  <p style={{ fontFamily: "'Courier New',monospace", fontSize: '0.7rem', color: '#444', lineHeight: 1.8, textAlign: 'center' }}>From the typewriter<br />to the screen</p>
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(160deg,#f2ebda,#e8dfc8)',
                  borderRadius: '6px 0 0 6px',
                  boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.06)',
                }} />
              </div>

            </div>
          </div>

          {/* Citation */}
          <div style={{
            flex: 1, background: '#0f0e0c',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', overflow: 'hidden',
          }}>
            <span style={{
              position: 'absolute', top: '-0.15em', left: '0.05em',
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(90px, 24vw, 140px)',
              lineHeight: 1, color: 'rgba(255,255,255,0.07)',
              userSelect: 'none', pointerEvents: 'none',
            }}>"</span>
            <div style={{ textAlign: 'center', maxWidth: '300px', zIndex: 1 }}>
              <p ref={quoteTextRef} style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(0.75rem, 2.2vw, 0.95rem)',
                fontStyle: 'italic',
                color: 'rgba(255,251,232,0.82)',
                lineHeight: 1.9, minHeight: '1.5em',
              }} />
              <p ref={quoteAuthorRef} style={{
                marginTop: '1rem',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.6rem', letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.28)',
                opacity: 0, transition: 'opacity 0.8s ease',
              }}>— {QUOTE_AUTHOR}</p>
            </div>
            <span style={{
              position: 'absolute', bottom: '-0.3em', right: '0.05em',
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(90px, 24vw, 140px)',
              lineHeight: 1, color: 'rgba(255,255,255,0.07)',
              userSelect: 'none', pointerEvents: 'none',
            }}>"</span>
          </div>

        </div>

        {/* Header page 1 */}
        <header ref={headerRef} className="app-header">
          <h1 className="title-flag">
            {nodes.map(node => {
              if (node.type === 'br')     return <br key={node.id} />
              if (node.type === 'strong') return <strong key={node.id}>{node.content}</strong>
              return <span key={node.id}>{node.content}</span>
            })}
          </h1>
        </header>

        {/* Clavier */}
        <div className="keyboard-body">
          <div className="touches-zone">
            <div className="touches">
              {ROWS.map((row, ri) => (
                <div key={ri} className={`groupe${ri + 1}`}>
                  {row.map(t => {
                    if (t.key === 'menu') {
                      return (
                        <div key="menu-slot" style={{ position: 'relative' }}>
                          <div ref={homeScrollMenuRef} className="touche-wrap is-menu" onClick={handleHomeScrollMenuClick}>
                            <div className="touche"><span>↕</span></div>
                            <div className="touche-tige" />
                          </div>
                          <div ref={homeClickMenuRef} className="touche-wrap is-menu" onClick={handleHomeClickMenuClick}
                            style={{ position: 'absolute', top: 0, left: 0, opacity: 1, pointerEvents: 'auto', zIndex: 5 }}>
                            <div className="touche"><span>{homeClickMenuOpen ? '×' : '+'}</span></div>
                            <div className="touche-tige" />
                          </div>
                          <div ref={blackMenuRef} className="touche-wrap is-menu" onClick={handleBlackMenuClick}
                            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', zIndex: 6 }}>
                            <div className="touche"><span>{blackMenuOpen ? '×' : '+'}</span></div>
                            <div className="touche-tige" />
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={t.key} className="touche-wrap" ref={el => { keyElRefs.current[t.key] = el }}>
                        <div className="touche"><span>{t.label}</span></div>
                        <div className="touche-tige" />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}