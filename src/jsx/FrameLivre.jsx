import { useEffect, useRef } from 'react'
import couverture from '../images/couv.jpg'
import barrieImg  from '../images/barrie-tullett.png'
import keiraImg   from '../images/keirathboneeye.jpg'

function getCTA(flipped, N) {
  if (flipped === 0)  return 'scroll to open ↓'
  if (flipped < N)    return 'scroll to continue ↓'
  return 'scroll to close ↓'
}

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
    const N     = pages.length  // 3

    let currentFlipped = 0
    let blTimeout      = null
    let autoRun        = false
    let done           = false
    let scrollAccum    = 0
    let lastDir        = 0
    const THRESHOLD    = 180

    function setZ() {
      pages.forEach((p, i) => {
        p.style.zIndex = p.classList.contains('flipped') ? i + 1 : N - i
      })
    }

    function updateDecor(flipped) {
      sh.classList.toggle('open', flipped > 0)
      sp.classList.toggle('visible', flipped > 0)
      clearTimeout(blTimeout)
      if (flipped === 0) {
        bl.classList.remove('visible')
        bl.style.background = ''
      } else {
        bl.style.background = flipped === 1 ? '' : '#ffffff'
        blTimeout = setTimeout(() => {
          if (pages.some(p => p.classList.contains('flipped')))
            bl.classList.add('visible')
        }, 650)
      }
    }

    function next() {
      if (currentFlipped >= N) return
      pages[currentFlipped].classList.add('flipped')
      currentFlipped++
      setZ()
      updateDecor(currentFlipped)
      if (cta) cta.textContent = getCTA(currentFlipped, N)
    }

    function goBack() {
      if (currentFlipped <= 0) return
      currentFlipped--
      pages[currentFlipped].classList.remove('flipped')
      setZ()
      updateDecor(currentFlipped)
      if (cta) cta.textContent = getCTA(currentFlipped, N)
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
          currentFlipped = 0
          scrollAccum = 0
          autoRun = false
          done = true
          window.removeEventListener('wheel', lock, { passive: false })
          window.removeEventListener('touchmove', lock, { passive: false })
          window.removeEventListener('wheel', onWheel, { passive: false })
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

    // Comme le HTML : wheel contrôle tout, preventDefault bloque le scroll page
    function onWheel(e) {
      const rect = rail.getBoundingClientRect()
      const fullyInView = rect.top <= 0 && rect.bottom >= window.innerHeight
      if (!fullyInView) return
      if (autoRun || done) return

      e.preventDefault()

      const dir = e.deltaY > 0 ? 1 : -1
      if (dir !== lastDir) { scrollAccum = 0; lastDir = dir }
      scrollAccum += e.deltaY

      if (Math.abs(scrollAccum) > THRESHOLD) {
        scrollAccum = 0
        if (dir > 0) {
          if (currentFlipped < N) next()
          else autoClose()
        } else {
          goBack()
        }
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    setZ()
    if (cta) cta.textContent = getCTA(0, N)

    return () => {
      window.removeEventListener('wheel', onWheel)
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

                <div className="lv-book-left" ref={blRef} />

                {/* Fixe droite : Keira */}
                <div className="lv-book-right">
                  <img src={keiraImg} alt="Keira Rathbone" className="lv-keira" />
                  <span className="lv-keira-label">by Keira Rathbone</span>
                </div>

                <div className="lv-shadow" ref={shRef} />

                {/* p3 : recto = photo Barrie ASCII / verso = présentation livre */}
                <div className="lv-page lv-paper" ref={p3Ref}>
                  <div className="lv-face lv-fp lv-fp-r lv-photo-face">
                    <img src={barrieImg} alt="Barrie Tullett" className="lv-barrie" />
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Typewriter Art: A Modern Anthology is a fascinating chronicle of &ldquo;the development of the typewriter as a medium for creating work far beyond anything envisioned by the machine's makers.&rdquo; The book illustrates the history of the genre through ample artwork spanning nearly 130&nbsp;years, as well as interviews with the most prominent artists in the field today.
                    </p>
                  </div>
                </div>

                {/* p2 : recto = titre + auteur / verso = présentation Barrie */}
                <div className="lv-page lv-paper" ref={p2Ref}>
                  <div className="lv-face lv-fp lv-fp-r lv-title-face">
                    <span className="lv-title">
                      Typewriter Art
                      <span className="lv-subtitle">A Modern Anthology</span>
                    </span>
                    <div className="lv-rule" />
                    <span className="lv-author">Barrie Tullett</span>
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      Barrie Tullett is Senior Lecturer in Graphic Design at the Lincoln School of Art and Design, and cofounder, with Philippa&nbsp;Wood, of The Caseroom Press, an independent publisher based in Lincoln and Edinburgh. As a freelance graphic designer, his clients have included Canongate Books, Princeton University Press, and Penguin Books.
                    </p>
                  </div>
                </div>

                {/* p1 : recto = couverture / verso = contreplat blanc */}
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