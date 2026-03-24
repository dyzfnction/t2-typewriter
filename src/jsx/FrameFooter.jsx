import { useEffect, useRef } from 'react'
import { useLang } from './LangContext'

// ── ASCII bilingue ────────────────────────────────────────────────────────────

const ASCII_LA_FIN = `      ..                             .                        
x .d88"                    oec :    @88>                      
 5888R                    @88888    %8P      u.    u.         
 '888R         u          8"*88%     .     x@88k u@88c.       
  888R      us888u.       8b.      .@88u  ^"8888""8888"       
  888R   .@88 "8888"     u888888> ''888E\`   8888  888R        
  888R   9888  9888       8888R     888E    8888  888R        
  888R   9888  9888       8888P     888E    8888  888R        
  888R   9888  9888       *888>     888E    8888  888R     .  
 .888B . 9888  9888       4888      888&   "*88*" 8888"  .@8c 
 ^*888%  "888*""888"      '888      R888"    ""   'Y"   '%888"
   "%     ^Y"   ^Y'        88R       ""                   ^*  
                           88>                                
                           48                                 
                           '8                                 `

const ASCII_THE_END = `     s                                     
    :8      .uef^"                         
   .88    :d88E                            
  :888ooo \`888E            .u              
-*8888888  888E .z8k    ud8888.            
  8888     888E~?888L :888'8888.           
  8888     888E  888E d888 '88%"           
  8888     888E  888E 8888.+"              
 .8888Lu=  888E  888E 8888L                
 ^%888*    888E  888E '8888c. .+           
   'Y"    m888N= 888>  "88888%             
           \`Y"   888     "YP'              
                J88"                       
                @%                         
              :"                           
                            ..             
                          dF               
              u.    u.   '88bu.            
     .u     x@88k u@88c. '*88888bu         
  ud8888.  ^"8888""8888"   ^"*8888N        
:888'8888.   8888  888R   beWE "888L       
d888 '88%"   8888  888R   888E  888E       
8888.+"      8888  888R   888E  888E       
8888L        8888  888R   888E  888F    .  
'8888c. .+  "*88*" 8888" .888N..888   .@8c 
 "88888%      ""   'Y"    \`"888*""   '%888"
   "YP'                      ""        ^*  `

// ── Textes UI ─────────────────────────────────────────────────────────────────

const TEXTS = {
  fr: {
    readArticle: "Lire l'article",
    buyBook: 'Acheter le livre',
    articleSite: 'The Marginalian',
    articleDesc: "L'histoire complète de l'anthologie racontée par Maria Popova",
    bookTitle: 'Typewriter Art\u00A0: A Modern Anthology',
    bookSub: 'Barrie Tullett — Laurence King Publishing',
    credit: '130 ans de caractères frappés.',
  },
  en: {
    readArticle: 'Read the article',
    buyBook: 'Buy the book',
    articleSite: 'The Marginalian',
    articleDesc: 'The full story of the anthology told by Maria Popova',
    bookTitle: 'Typewriter Art: A Modern Anthology',
    bookSub: 'Barrie Tullett — Laurence King Publishing',
    credit: '130 years of struck characters.',
  },
}

const RIBBON_UNIT = '─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · ─ · '

// ── Composant ─────────────────────────────────────────────────────────────────

export default function FrameFooter({ onScrollBack }) {
  const { lang } = useLang()
  const t       = TEXTS[lang]
  const ascii   = lang === 'fr' ? ASCII_LA_FIN : ASCII_THE_END

  const footerRef = useRef(null)
  const ribbonRef = useRef(null)
  const isActive  = useRef(false)
  const lockedY   = useRef(0)

  // ── Ruban défilant ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = ribbonRef.current
    if (!el) return
    let offset = 0
    let rafId
    function loop() {
      offset -= 0.5
      const half = el.scrollWidth / 2
      if (Math.abs(offset) >= half) offset = 0
      el.style.transform = `translateX(${offset}px)`
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // ── Lock scroll + wheel back ──────────────────────────────────────────────
  useEffect(() => {
    // Bloque le scroll natif quand le footer est actif
    function preventScroll() {
      if (!isActive.current) return
      window.scrollTo(0, lockedY.current)
    }

    let wheelTmr = null
    function onWheel(e) {
      if (!isActive.current) return
      e.preventDefault()
      e.stopPropagation()
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 24
      if (e.deltaMode === 2) dy *= window.innerHeight
      if (wheelTmr || Math.abs(dy) < 10) return
      if (dy < 0) {
        // Scroll vers le haut → retour à la dernière oeuvre
        isActive.current = false
        onScrollBack?.()
        wheelTmr = setTimeout(() => { wheelTmr = null }, 1000)
      }
      // Scroll vers le bas ignoré (on est en bas de page)
      wheelTmr = setTimeout(() => { wheelTmr = null }, 600)
    }

    let touchY = 0
    function onTouchStart(e) {
      if (!isActive.current) return
      touchY = e.touches[0].clientY
    }
    function onTouchMove(e) {
      if (!isActive.current) return
      e.preventDefault()
      const dy = touchY - e.touches[0].clientY
      if (Math.abs(dy) > 50 && dy < 0) {
        isActive.current = false
        onScrollBack?.()
      }
    }

    window.addEventListener('scroll',     preventScroll, { passive: false })
    window.addEventListener('wheel',      onWheel,       { passive: false })
    window.addEventListener('touchstart', onTouchStart,  { passive: true  })
    window.addEventListener('touchmove',  onTouchMove,   { passive: false })

    return () => {
      window.removeEventListener('scroll',     preventScroll)
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
    }
  }, [onScrollBack])

  // ── IntersectionObserver — active quand footer est visible ────────────────
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lockedY.current = el.offsetTop
        window.scrollTo(0, lockedY.current)
        isActive.current = true
      } else {
        isActive.current = false
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <footer id="s-footer" ref={footerRef}>

      {/* ASCII THE END / LA FIN */}
      <div className="footer-the-end" aria-label={lang === 'fr' ? 'La Fin' : 'The End'}>
        <pre className="footer-the-end-ascii">{ascii}</pre>
      </div>

      {/* Ruban défilant */}
      <div className="footer-ribbon-wrap" aria-hidden="true">
        <div ref={ribbonRef} className="footer-ribbon">
          {RIBBON_UNIT.repeat(8)}
        </div>
      </div>

      {/* Cartes liens */}
      <div className="footer-inner">

        <a
          href="https://www.themarginalian.org/2014/05/23/typewriter-art-laurence-king/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-card"
        >
          <span className="footer-card-label">{t.readArticle}</span>
          <span className="footer-card-site">{t.articleSite}</span>
          <span className="footer-card-desc">{t.articleDesc}</span>
          <span className="footer-card-arrow">↗</span>
        </a>

        <div className="footer-sep" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => <span key={i}>│</span>)}
        </div>

        <a
          href="https://www.amazon.fr/dp/1780673477?linkCode=gg2&tag=braipick-20"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-card"
        >
          <span className="footer-card-label">{t.buyBook}</span>
          <span className="footer-card-site">Amazon.fr</span>
          <span className="footer-card-desc footer-card-desc--italic">{t.bookTitle}</span>
          <span className="footer-card-sub">{t.bookSub}</span>
          <span className="footer-card-arrow">↗</span>
        </a>

      </div>

      {/* Bas */}
      <div className="footer-bottom">
        <span className="footer-credit">{t.credit}</span>
      </div>

    </footer>
  )
}