import { useEffect, useRef } from 'react'
import couverture from '../images/couv.jpg'
import barrieImg  from '../images/barrie-tullett.png'
import keiraImg   from '../images/keirathboneeye.jpg'

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

const SEG = 0.2
function getTarget(p) {
  if (p < SEG)     return 0
  if (p < SEG * 2) return 1
  if (p < SEG * 3) return 2
  return 3
}
function getCTA(p) {
  if (p < SEG)     return 'scroll to open ↓'
  if (p < SEG * 3) return 'scroll to continue ↓'
  return 'scroll to close ↓'
}

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

    const pages = [p1Ref.current, p2Ref.current, p3Ref.current]
    const bl    = blRef.current
    const sh    = shRef.current
    const sp    = spRef.current
    const cta   = ctaRef.current
    const N     = 3

    let prev          = 0
    let blTimeout     = null
    let autoRun       = false
    let autoTriggered = false

    function setZ() {
      pages.forEach((p, i) => {
        p.style.zIndex = p.classList.contains('flipped') ? i + 1 : N - i
      })
    }

    function updateDecor(target) {
      sh.classList.toggle('open', target > 0)
      sp.classList.toggle('visible', target > 0)
      clearTimeout(blTimeout)
      if (target === 0) {
        bl.classList.remove('visible')
        bl.style.background = ''
      } else {
        bl.style.background = target === 1 ? '' : '#ffffff'
        blTimeout = setTimeout(() => {
          if (pages.some(p => p.classList.contains('flipped')))
            bl.classList.add('visible')
        }, 650)
      }
    }

    function autoClose() {
      autoRun = true
      let cf = N
      const lock = (e) => e.preventDefault()
      window.addEventListener('wheel',     lock, { passive: false })
      window.addEventListener('touchmove', lock, { passive: false })

      function closeNext() {
        if (cf <= 0) {
          pages.forEach(p => p.classList.remove('fast'))
          sh.classList.remove('open', 'closing')
          sp.classList.remove('visible')
          bl.classList.remove('visible')
          if (cta) cta.textContent = 'scroll to open ↓'
          prev = 0
          autoRun = false
          window.removeEventListener('wheel', lock)
          window.removeEventListener('touchmove', lock)
          // Scroll vers la section suivante (EraRail)
          const bot = rail.getBoundingClientRect().bottom + window.scrollY
          window.scrollTo({ top: bot, behavior: 'smooth' })
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
          updateDecor(cf)
          closeNext()
        }, 440)
      }
      closeNext()
    }

    function onScroll(p) {
      if (autoRun) return
    }

    // FrameLivre pilote ses pages via un progress interne
    // accumulé depuis la molette, indépendamment du scroll natif de la page
    let internalP  = 0
    let isVisible  = false

    // IntersectionObserver — active/désactive la capture molette
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0.5 })
    observer.observe(rail)

    function onWheel(e) {
      if (!isVisible) return
      e.preventDefault()
      const dy = e.deltaY
      const railHeight = rail.offsetHeight - window.innerHeight
      if (railHeight <= 0) return
      internalP = clamp(internalP + dy / railHeight, 0, 1)
      onScroll(internalP)
    }

    function onScrollP(p) {
      if (cta) cta.textContent = getCTA(p)
      if (p >= SEG * 4 && !autoTriggered) {
        autoTriggered = true
        autoClose()
        return
      }
      const target = getTarget(p)
      if (target === prev) return
      pages.forEach((page, i) => {
        if (i < target) page.classList.add('flipped')
        else            page.classList.remove('flipped')
      })
      setZ()
      updateDecor(target)
      prev = target
    }

    // Redéfinit onScroll pour accepter un p direct
    const origOnScroll = onScroll
    onScroll = onScrollP

    window.addEventListener('wheel', onWheel, { passive: false })
    setZ()
    if (cta) cta.textContent = getCTA(0)

    return () => {
      window.removeEventListener('wheel', onWheel)
      observer.disconnect()
      clearTimeout(blTimeout)
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

                <div className="lv-book-left"  ref={blRef} />

                {/* Fond fixe droite — page Keira (visible après le dernier flip) */}
                <div className="lv-book-right">
                  <img src={keiraImg} alt="Keira Rathbone" className="lv-keira" />
                  <span className="lv-keira-label">by Keira Rathbone</span>
                </div>

                <div className="lv-shadow" ref={shRef} />

                {/* Page 3 (dessous) : recto = présentation livre / verso = Keira */}
                <div className="lv-page lv-paper" ref={p3Ref}>
                  <div className="lv-face lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Typewriter Art: A Modern Anthology is a fascinating chronicle of &ldquo;the development of the typewriter as a medium for creating work far beyond anything envisioned by the machine's makers.&rdquo; The book illustrates the history of the genre through ample artwork spanning nearly 130&nbsp;years, as well as interviews with the most prominent artists in the field today.
                    </p>
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-r lv-photo-face">
                    <img src={keiraImg} alt="Keira Rathbone" className="lv-barrie" />
                    <span className="lv-pnum">2</span>
                  </div>
                </div>

                {/* Page 2 (milieu) : recto = présentation Barrie / verso = ASCII Barrie */}
                <div className="lv-page lv-paper" ref={p2Ref}>
                  <div className="lv-face lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Barrie Tullett is Senior Lecturer in Graphic Design at the Lincoln School of Art and Design, and cofounder, with Philippa&nbsp;Wood, of The Caseroom Press, an independent publisher based in Lincoln and Edinburgh. As a freelance graphic designer, his clients have included Canongate Books, Princeton University Press, and Penguin Books.
                    </p>
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-r lv-photo-face">
                    <img src={barrieImg} alt="Barrie Tullett" className="lv-barrie" />
                    <span className="lv-pnum">1</span>
                  </div>
                </div>

                {/* Page 1 (dessus) : recto = couverture / verso = page de garde */}
                <div className="lv-page" ref={p1Ref}>
                  <div className="lv-face lv-cover-front"
                    style={{ backgroundImage: `url(${couverture})` }} />
                  <div className="lv-face lv-back lv-fp lv-fp-r lv-title-face">
                    <span className="lv-title">
                      Typewriter Art
                      <span className="lv-subtitle">A Modern Anthology</span>
                    </span>
                    <div className="lv-rule" />
                    <span className="lv-author">Barrie Tullett</span>
                  </div>
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