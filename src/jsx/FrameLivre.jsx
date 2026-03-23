import { useEffect, useRef } from 'react'
import couverture from '../images/couv.jpg'
import barrieImg  from '../images/barrie-tullett.png'
import keiraImg   from '../images/keirathboneeye.jpg'

// ── Composant principal ───────────────────────────────────────────────────────
export default function FrameLivre() {
  const railRef = useRef(null)
  const p1Ref   = useRef(null)
  const p2Ref   = useRef(null)
  const p3Ref   = useRef(null)
  const blRef   = useRef(null)
  const shRef   = useRef(null)
  const spRef   = useRef(null)
  const ctaRef  = useRef(null)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const pages     = [p1Ref.current, p2Ref.current, p3Ref.current]
    const bl        = blRef.current
    const sh        = shRef.current
    const sp        = spRef.current
    const cta       = ctaRef.current
    const N         = pages.length
    const THRESHOLD = 180

    let currentFlipped = 0
    let isAnimating    = false
    let blTimeout      = null
    let scrollAccum    = 0
    let lastDir        = 0
    let bookActive     = false  // true = page gelée, livre en cours d'interaction
    let everUnlocked   = false  // true = livre déjà parcouru+refermé → ne plus re-locker

    // ── Inject style scroll-lock ──────────────────────────────────────────
    const styleEl = document.createElement('style')
    styleEl.textContent = 'body.book-locked { overflow: hidden !important; }'
    document.head.appendChild(styleEl)

    // ── Verrou / déverrou page ────────────────────────────────────────────
    function lockPage() {
      if (bookActive || everUnlocked) return
      bookActive = true
      window.scrollTo({ top: rail.offsetTop, behavior: 'instant' })
      document.body.classList.add('book-locked')
    }

    function unlockPage(scrollTarget) {
      everUnlocked = true   // Ne plus jamais re-locker automatiquement
      bookActive   = false
      document.body.classList.remove('book-locked')
      if (scrollTarget !== undefined) {
        window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
      }
    }

    // ── Z-index ───────────────────────────────────────────────────────────
    function setZ() {
      pages.forEach((p, i) => {
        p.style.zIndex = p.classList.contains('flipped') ? i + 1 : N - i
      })
    }

    // ── Décorations (shadow, spine, cta) ─────────────────────────────────
    function updateDecor() {
      const f = currentFlipped
      sh.classList.toggle('open', f > 0)
      sp.classList.toggle('visible', f > 0)
      clearTimeout(blTimeout)
      if (f === 0) {
        bl.classList.remove('visible')
        bl.style.background = ''
      } else {
        bl.style.background = f === 1 ? '' : '#ffffff'
        blTimeout = setTimeout(() => {
          if (currentFlipped > 0) bl.classList.add('visible')
        }, 650)
      }
      if (cta) {
        if      (f === 0) cta.textContent = 'scroll to open ↓'
        else if (f < N)   cta.textContent = 'scroll to continue ↓'
        else              cta.textContent = 'scroll to close ↓'
      }
    }

    // ── Retournement pages ────────────────────────────────────────────────
    function next() {
      if (currentFlipped >= N) return
      pages[currentFlipped].classList.add('flipped')
      currentFlipped++
      setZ()
      updateDecor()
    }

    function goBack() {
      if (currentFlipped <= 0) return
      currentFlipped--
      pages[currentFlipped].classList.remove('flipped')
      setZ()
      updateDecor()
    }

    // ── Fermeture automatique après la dernière page ──────────────────────
    function autoClose() {
      isAnimating = true
      let cf = N
      const hardLock = (e) => e.preventDefault()
      window.addEventListener('wheel',     hardLock, { passive: false })
      window.addEventListener('touchmove', hardLock, { passive: false })

      function closeNext() {
        if (cf <= 0) {
          pages.forEach(p => p.classList.remove('fast'))
          sh.classList.remove('open', 'closing')
          sp.classList.remove('visible')
          bl.classList.remove('visible')
          currentFlipped = 0
          scrollAccum    = 0
          isAnimating    = false
          window.removeEventListener('wheel',     hardLock)
          window.removeEventListener('touchmove', hardLock)
          updateDecor()
          // Déverrouille et scrolle juste après le rail
          unlockPage(rail.offsetTop + rail.offsetHeight)
          return
        }
        cf--
        const page = pages[cf]
        page.classList.add('fast')
        page.classList.remove('flipped')
        if (cf === 0) {
          sh.classList.add('closing')
          sh.classList.remove('open')
          bl.classList.remove('visible')
        }
        setZ()
        setTimeout(() => {
          page.classList.remove('fast')
          sh.classList.remove('closing')
          closeNext()
        }, 440)
      }
      closeNext()
    }

    // ── Wheel handler ─────────────────────────────────────────────────────
    function onWheel(e) {
      if (!bookActive) return
      e.preventDefault()
      if (isAnimating) return

      const dir = e.deltaY > 0 ? 1 : -1
      if (dir !== lastDir) { scrollAccum = 0; lastDir = dir }
      scrollAccum += e.deltaY

      if (Math.abs(scrollAccum) < THRESHOLD) return
      scrollAccum = 0

      if (dir > 0) {
        if (currentFlipped < N) {
          isAnimating = true
          next()
          setTimeout(() => { isAnimating = false }, 650)
        } else {
          autoClose()
        }
      } else {
        if (currentFlipped > 0) {
          isAnimating = true
          goBack()
          setTimeout(() => { isAnimating = false }, 650)
        } else {
          // Scroll arrière depuis la couverture → déverrouille vers le haut
          unlockPage(rail.offsetTop - window.innerHeight)
        }
      }
    }

    // ── IntersectionObserver ─────────────────────────────────────────────
    // threshold 0.85 : attend que le rail soit bien visible avant de locker.
    // everUnlocked   : si le livre a déjà été parcouru et refermé, plus de
    //                  re-lock automatique — l'utilisateur scroll librement.
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && !bookActive && !everUnlocked) {
        lockPage()
      }
    }, { threshold: 0.85 })

    observer.observe(rail)
    window.addEventListener('wheel', onWheel, { passive: false })
    setZ()
    updateDecor()

    return () => {
      window.removeEventListener('wheel', onWheel)
      observer.disconnect()
      clearTimeout(blTimeout)
      document.body.classList.remove('book-locked')
      styleEl.remove()
    }
  }, [])

  return (
    <>
      <div id="s-livre-rail" ref={railRef}>
        <div id="s-livre-sticky">

          {/* Zone livre — moitié haute */}
          <div className="lv-top">
            <p className="lv-cta" ref={ctaRef}>scroll to open ↓</p>

            <div className="lv-scene">
              <div className="lv-book">

                <div className="lv-book-left" ref={blRef} />

                {/* Page fixe droite */}
                <div className="lv-book-right">
                  <img src={keiraImg} alt="Keira Rathbone" className="lv-keira" />
                  <span className="lv-keira-label">by Keira Rathbone</span>
                </div>

                <div className="lv-shadow" ref={shRef} />

                {/* Page 3 : texte gauche / photo Barrie droite */}
                <div className="lv-page lv-paper" ref={p3Ref}>
                  <div className="lv-face lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Typewriter Art: A Modern Anthology is a fascinating chronicle of &ldquo;the development of the typewriter as a medium for creating work far beyond anything envisioned by the machine's makers.&rdquo; The book illustrates the history of the genre through ample artwork spanning nearly 130&nbsp;years, as well as interviews with the most prominent artists in the field today.
                    </p>
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-r lv-photo-face">
                    <img src={barrieImg} alt="Barrie Tullett" className="lv-barrie" />
                    <span className="lv-pnum">1</span>
                  </div>
                </div>

                {/* Page 2 : texte gauche / titre droite */}
                <div className="lv-page lv-paper" ref={p2Ref}>
                  <div className="lv-face lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Barrie Tullett is Senior Lecturer in Graphic Design at the Lincoln School of Art and Design, and cofounder, with Philippa&nbsp;Wood, of The Caseroom Press, an independent publisher based in Lincoln and Edinburgh. As a freelance graphic designer, his clients have included Canongate Books, Princeton University Press, and Penguin Books.
                    </p>
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-r lv-title-face">
                    <span className="lv-title">
                      Typewriter Art
                      <span className="lv-subtitle">A Modern Anthology</span>
                    </span>
                    <div className="lv-rule" />
                    <span className="lv-author">Barrie Tullett</span>
                  </div>
                </div>

                {/* Page 1 : couverture / contreplat */}
                <div className="lv-page" ref={p1Ref}>
                  <div className="lv-face lv-cover-front"
                    style={{ backgroundImage: `url(${couverture})` }} />
                  <div className="lv-face lv-back lv-cover-back" />
                </div>

              </div>
              <div className="lv-spine" ref={spRef} />
            </div>
          </div>

          {/* Zone citation — moitié basse */}
          <div className="lv-bot">
            <blockquote className="livre-quote">
              «&nbsp;L'art n'est pas une&nbsp;chose, c'est une&nbsp;manière&nbsp;»
              <cite>Elbert&nbsp;Hubbard, 1908</cite>
            </blockquote>
          </div>

        </div>
      </div>
    </>
  )
}