import { useEffect, useRef, useState } from 'react'

const SEGMENTS = [
  { text: 'A Visual History of Typewriter Art ' },
  { br: true },
  { text: 'from ' },
  { text: '1893', strong: true },
  { text: ' to ' },
  { text: 'Today', strong: true },
]

const CHAR_DELAY   = 55
const JITTER       = 18
const RETURN_PAUSE = 280
const STRONG_DELAY = 48

export default function AppMain({ loadingDone = false }) {
  const [nodes, setNodes]           = useState([])
  const [bookOpen, setBookOpen]     = useState(false)
  const [innerVisible, setInnerVisible] = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [lang, setLang]             = useState('fr')
  const cancelRef = useRef(false)

  /* ── Typewriter titre ── */
  useEffect(() => {
    if (!loadingDone) return
    cancelRef.current = true
    const timeout = setTimeout(() => {
      cancelRef.current = false
      setNodes([])
      const sleep = ms => new Promise(r => setTimeout(r, ms))
      async function type() {
        let id = 0
        for (const seg of SEGMENTS) {
          if (cancelRef.current) return
          if (seg.br) {
            await sleep(RETURN_PAUSE)
            if (cancelRef.current) return
            setNodes(n => [...n, { id: id++, type: 'br' }])
            continue
          }
          if (seg.strong) {
            const nodeId = id++
            setNodes(n => [...n, { id: nodeId, type: 'strong', content: '' }])
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => n.map(node =>
                node.id === nodeId ? { ...node, content: node.content + char } : node
              ))
              await sleep(Math.max(STRONG_DELAY + (Math.random() - 0.5) * JITTER, 20))
            }
          } else {
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => [...n, { id: id++, type: 'text', content: char }])
              await sleep(Math.max(CHAR_DELAY + (Math.random() - 0.5) * JITTER, 20))
            }
          }
        }
      }
      type()
    }, 50)
    return () => { cancelRef.current = true; clearTimeout(timeout) }
  }, [loadingDone])

  /* ── Ouvrir le livre ── */
  function handleOpenBook() {
    if (bookOpen) return
    setBookOpen(true)
    setTimeout(() => setInnerVisible(true), 700)
  }

  return (
    <div className="app-main">

      {/* ── LANGUETTE MENU ── */}
      <button
        className={`menu-languette ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Menu"
      >
        <span>{menuOpen ? '✕' : '☰'}</span>
      </button>

      {/* Panel menu */}
      <div className={`menu-panel ${menuOpen ? 'open' : ''}`}>
        <div className="menu-section-title">LANGUE</div>
        <div className="menu-key-row">
          <button
            className={`menu-touche ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => { setLang('fr'); setMenuOpen(false) }}
          >
            <div className="menu-touche-cap"><span>FR</span></div>
            <div className="menu-touche-tige" />
          </button>
          <button
            className={`menu-touche ${lang === 'en' ? 'active' : ''}`}
            onClick={() => { setLang('en'); setMenuOpen(false) }}
          >
            <div className="menu-touche-cap"><span>EN</span></div>
            <div className="menu-touche-tige" />
          </button>
        </div>
      </div>
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ══════════════════════════════════════
          PAGE 1 — MACHINE À ÉCRIRE
      ══════════════════════════════════════ */}
      <section className="page page-machine">

        <header className="app-header">
          <h1 className="title-flag">
            {nodes.map(node => {
              if (node.type === 'br')     return <br key={node.id} />
              if (node.type === 'strong') return <strong key={node.id}>{node.content}</strong>
              return <span key={node.id}>{node.content}</span>
            })}
          </h1>
        </header>

        <main className="app-content">
          <div className="sheet" />
        </main>

        <div className="keyboard-body">
          <div className="typewriter-roller" />
          <div className="touches-zone">
            <div className="touches">
              <div className="groupe1">
                {['I','II','III','IV'].map(label => (
                  <div className="touche-wrap" key={label}>
                    <div className="touche"><span>{label}</span></div>
                    <div className="touche-tige" />
                  </div>
                ))}
              </div>
              <div className="groupe2">
                {['V','VI','VII','VIII','IX'].map(label => (
                  <div className="touche-wrap" key={label}>
                    <div className="touche"><span>{label}</span></div>
                    <div className="touche-tige" />
                  </div>
                ))}
              </div>
              <div className="groupe3">
                {['X','XI','XII','XIII'].map(label => (
                  <div className="touche-wrap" key={label}>
                    <div className="touche"><span>{label}</span></div>
                    <div className="touche-tige" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════
          PAGE 2 — CONTINUATION MACHINE + LIVRE
      ══════════════════════════════════════ */}
      <section className="page page-livre">

        {/* Haut de la page = continuation du rectangle de la machine, sans touches */}
        <div className="machine-continuation">
          <div className="typewriter-roller" />
          <div className="machine-continuation-body" />
        </div>

        {/* Le livre est posé PAR-DESSUS le rectangle, décalé à droite */}
        <div className="book-stage">

          {/* Dos + pages intérieures (visibles quand ouvert) */}
          <div className="book-back">
            <div className={`book-inner ${innerVisible ? 'visible' : ''}`}>
              <p className="book-inner-text">
                {lang === 'fr'
                  ? <>Chapitre I<br /><br />Il était une fois...</>
                  : <>Chapter I<br /><br />Once upon a time...</>}
              </p>
            </div>
          </div>

          {/* Couverture — se rabat vers la gauche au clic */}
          <div
            className={`book-cover ${bookOpen ? 'open' : ''}`}
            onClick={handleOpenBook}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handleOpenBook()}
          >
            <div className="cover-line" />
            <p className="cover-title">
              {lang === 'fr' ? <>Le Titre<br />du Livre</> : <>The Book<br />Title</>}
            </p>
            <div className="cover-line" />
            {!bookOpen && (
              <span className="cover-hint">
                {lang === 'fr' ? 'Ouvrir →' : 'Open →'}
              </span>
            )}
          </div>

        </div>

      </section>

      {/* ══════════════════════════════════════
          PAGE 3 — CITATION
      ══════════════════════════════════════ */}
      <section className="page page-citation">
        <div className="citation-wrap">
          <span className="guillemet guillemet-open">&ldquo;</span>
          <p className="citation-text">Art is not a thing — it is a way.</p>
          <span className="citation-author">— Elbert Hubbard</span>
          <span className="guillemet guillemet-close">&rdquo;</span>
        </div>
      </section>

    </div>
  )
}