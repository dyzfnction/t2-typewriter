import { useEffect, useRef } from 'react'
import { useLang } from './LangContext'
import couverture from '../images/couv.jpg'
import barrieImg  from '../images/barrie-tullett.png'
import keiraImg   from '../images/keirathboneeye.jpg'

export default function FrameLivre() {
  const { t } = useLang()
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
    let done           = false
    let blTimeout      = null
    let scrollAccum    = 0
    let lastDir        = 0

    function setZ() {
      pages.forEach((p, i) => {
        p.style.zIndex = p.classList.contains('flipped') ? i + 1 : N - i
      })
    }

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
        if      (f === 0) cta.textContent = t.livreCTA[0]
        else if (f < N)   cta.textContent = t.livreCTA[1]
        else              cta.textContent = t.livreCTA[2]
      }
    }

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

    function autoClose() {
      isAnimating = true
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
          currentFlipped = 0
          scrollAccum    = 0
          isAnimating    = false
          done           = true
          window.removeEventListener('wheel',     lock, { passive: false })
          window.removeEventListener('touchmove', lock, { passive: false })
          window.removeEventListener('wheel', onWheel, { passive: false })
          updateDecor()
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

    function onWheel(e) {
      if (done) return
      const rect = rail.getBoundingClientRect()
      const inView = rect.top <= 0 && rect.bottom >= window.innerHeight
      if (!inView) return
      if (isAnimating) return
      e.preventDefault()

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
        }
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    setZ()
    updateDecor()

    return () => {
      window.removeEventListener('wheel', onWheel, { passive: false })
      clearTimeout(blTimeout)
    }
  }, [])

  return (
    <>
      <div id="s-livre-rail" ref={railRef}>
        <div id="s-livre-sticky">

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

                {/* p3 : recto = photo Barrie / verso = présentation livre */}
                <div className="lv-page lv-paper" ref={p3Ref}>
                  <div className="lv-face lv-fp lv-fp-r lv-photo-face">
                    <img src={barrieImg} alt="Barrie Tullett" className="lv-barrie" />
                  </div>
                  <div className="lv-face lv-back lv-fp lv-fp-l lv-text-face">
                    <p className="lv-body-text">
                      {t.livreAnthologie}
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
                      {t.livreBarrie}
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

          <div className="lv-bot">
            <blockquote className="livre-quote">
              {t.livreQuote}
              <cite>{t.livreQuoteCite}</cite>
            </blockquote>
          </div>

        </div>
      </div>
    </>
  )
}