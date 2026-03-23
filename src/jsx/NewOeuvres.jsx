// ─────────────────────────────────────────────────────────────────────────────
// Tous les nouveaux composants d'oeuvres
// Chacun est un wrapper mince sur OeuvreLayout, calqué sur PitmansManual.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

// Images
import queenVictoriaImg    from '../images/queenvictoria.webp'
import whisperPieceImg     from '../images/whisperpiece.webp'
import beethovenImg        from '../images/beethoventoday.webp'
import carnivalImg         from '../images/carnival.webp'
import textumImg           from '../images/textum2.webp'
import wordsImg            from '../images/the-words-we-use-are-lovely.webp'
import oImg                from '../images/O.webp'
import unusualImg          from '../images/unusual-love-poem.webp'
import typewrittenImg      from '../images/typewritten-portraits.webp'
import lookingImg          from '../images/lookingforward.webp'
import patternImg          from '../images/the-pattern-serie.webp'
import barcelonaImg        from '../images/barcelona-love-letters.webp'

// Bg portraits
import alanRiddellImg      from '../images/alan-riddell.png'
import bobCobbingImg       from '../images/bob-cobbing.png'
import mccafferyImg        from '../images/steve-mccaffery.png'
import barrieImg           from '../images/barrie-tullett.png'
import vickiImg            from '../images/vicki-simpson.png'
import miroImg             from '../images/miroljub-todorovic.png'
import keiraImg            from '../images/keira-rathbone.png'

// ── Shared hooks ──────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function jitter(base) { return Math.max(16, base + (Math.random() - 0.5) * 12) }

function useTypewriter(lines, canStart) {
  const [displayed, setDisplayed] = useState(Array(lines.length).fill(''))
  const cancelRef = useRef(false)
  useEffect(() => {
    if (!canStart) return
    cancelRef.current = false
    setDisplayed(Array(lines.length).fill(''))
    function typeLine(index, text, delay, onDone) {
      let i = 0
      setTimeout(function tick() {
        if (cancelRef.current) return
        if (i < text.length) {
          setDisplayed(prev => { const n=[...prev]; n[index]=text.slice(0,i+1); return n })
          i++; setTimeout(tick, 80)
        } else if (onDone) setTimeout(onDone, 200)
      }, delay)
    }
    typeLine(0, lines[0], 400, () => typeLine(1, lines[1], 0, () => typeLine(2, lines[2], 0, null)))
    return () => { cancelRef.current = true }
  }, [canStart])
  return displayed
}

function useSegmentTypewriter(segments1, segments2, canStart) {
  const [nodes1, setNodes1] = useState([])
  const [nodes2, setNodes2] = useState([])
  const cancelRef = useRef(false)
  useEffect(() => {
    if (!canStart) return
    cancelRef.current = false
    setNodes1([]); setNodes2([])
    async function writeSegments(segments, setNodes) {
      let id = 0
      for (const seg of segments) {
        if (cancelRef.current) return
        const nodeId = id++
        const style = seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal'
        setNodes(n => [...n, { id: nodeId, style, content: '' }])
        for (const char of seg.text) {
          if (cancelRef.current) return
          setNodes(n => n.map(nd => nd.id===nodeId ? {...nd, content: nd.content+char} : nd))
          await sleep(jitter(44))
        }
      }
    }
    async function run() {
      await writeSegments(segments1, setNodes1)
      if (cancelRef.current) return
      await sleep(350)
      await writeSegments(segments2, setNodes2)
    }
    run()
    return () => { cancelRef.current = true }
  }, [canStart])
  return [nodes1, nodes2]
}

function renderNode(node) {
  if (node.style === 'bold')   return <strong key={node.id}>{node.content}</strong>
  if (node.style === 'italic') return <em key={node.id}>{node.content}</em>
  return <span key={node.id}>{node.content}</span>
}

function OeuvreLayout({ lines, p1, p2, totalChars, imageOeuvre, imageBg, progress, canStart, autoMode = false, bgColor = '#fafafa' }) {
  const [descStarted, setDescStarted] = useState(false)
  const [imgVisible,  setImgVisible]  = useState(false)
  const prevCanStart = useRef(false)

  useEffect(() => {
    if (canStart && !prevCanStart.current) {
      if (autoMode) {
        setImgVisible(true)
      } else {
        setImgVisible(false)
        const t = setTimeout(() => setImgVisible(true), 50)
        return () => clearTimeout(t)
      }
    }
    if (!canStart && prevCanStart.current) {
      setImgVisible(false)
      setDescStarted(false)
      setShowArtist(false)
    }
    prevCanStart.current = canStart
  }, [canStart, autoMode])

  useEffect(() => {
    if (progress > 0.4 && !descStarted && !autoMode) setDescStarted(true)
    if (progress <= 0.1 && descStarted) setDescStarted(false)
  }, [progress, autoMode])

  const [line1, line2, line3] = useTypewriter(lines, canStart)
  const [nodes1, nodes2]      = useSegmentTypewriter(p1, p2, descStarted)

  const imgOpacity  = autoMode ? 1 : Math.max(0, 1 - (progress - 0.3) / 0.15)
  const descOpacity = autoMode ? 0 : Math.min(1, Math.max(0, (progress - 0.4) / 0.15))

  return (
    <div className="ov2-panel" style={{ background: bgColor }}>
      <div className="ov2-bg">
        <img src={imageBg || imageOeuvre} alt="" />
      </div>
      <header className="ov2-header">
        <div className="ov2-title-italic">{line1}</div>
        <div className="ov2-title-sub">{line2} {line3}</div>
      </header>
      <div className="ov2-content">
        {canStart && (
          <div
            className={`ov2-image${imgVisible ? ' ov2-image--visible' : ''}`}
            style={{ opacity: imgOpacity, pointerEvents: imgOpacity < 0.1 ? 'none' : 'auto' }}
          >
            <img src={imageOeuvre} alt={lines[0]} />
          </div>
        )}
        <div className="ov2-desc" style={{ opacity: descOpacity, pointerEvents: descOpacity < 0.1 ? 'none' : 'auto' }}>
          <p className="ov2-para">{nodes1.map(renderNode)}</p>
          {nodes2.length > 0 && <p className="ov2-para">{nodes2.map(renderNode)}</p>}
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Queen Victoria
// ─────────────────────────────────────────────────────────────────────────────
export function QueenVictoria({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#edeae0"
    imageOeuvre={queenVictoriaImg} imageBg={queenVictoriaImg}
    totalChars={490}
    lines={['\u2018Queen Victoria\u2019', 'unknown artist', '(c. 1898)']}
    p1={[
      { text: 'Queen Victoria' },
      { text: ' (' }, { text: '1819\u20131901', bold: true }, { text: ') reigned for 63 years, making her the ' },
      { text: 'longest-reigning British monarch', italic: true },
      { text: ' of the 19th century. This typewritten portrait was likely produced by an anonymous typist in ' },
      { text: 'celebration', bold: true }, { text: ' of her Diamond Jubilee.' },
    ]}
    p2={[
      { text: 'Executed with remarkable skill, the portrait captures Victoria\u2019s ' },
      { text: 'iconic profile', italic: true },
      { text: ' using only the characters of a standard typewriter. The work stands as a testament to the ' },
      { text: 'technical virtuosity', bold: true }, { text: ' of early operators.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Whisper Piece — Bob Cobbing (1970)
// ─────────────────────────────────────────────────────────────────────────────
export function WhisperPiece({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#e8e8e8"
    imageOeuvre={whisperPieceImg} imageBg={bobCobbingImg}
    totalChars={480}
    lines={['\u2018Whisper Piece\u2019', 'by Bob Cobbing', '(1970)']}
    p1={[
      { text: 'Bob Cobbing' },
      { text: ' (' }, { text: '1920\u20132002', bold: true }, { text: ') was a British ' },
      { text: 'sound poet and visual artist', italic: true },
      { text: ' who used the typewriter, photocopier and duplicating machines to create dense typographic textures. His work operates as ' },
      { text: 'scores for performance', bold: true }, { text: '.' },
    ]}
    p2={[
      { text: '\u2018Whisper Piece\u2019 is a visual-sound poem where typewritten characters are arranged in patterns evoking the ' },
      { text: 'act of whispering', italic: true },
      { text: ' \u2014 breath, silence and intimacy. The ' },
      { text: 'typographic composition', bold: true },
      { text: ' mimics sound through visual density.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Beethoven Today — Bob Cobbing (1967)
// ─────────────────────────────────────────────────────────────────────────────
export function BeethovenToday({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#e8e8e8"
    imageOeuvre={beethovenImg} imageBg={bobCobbingImg}
    totalChars={500}
    lines={['\u2018Beethoven Today\u2019', 'by Bob Cobbing', '(1967)']}
    p1={[
      { text: 'Bob Cobbing' },
      { text: ' (' }, { text: '1920\u20132002', bold: true }, { text: ') was a British ' },
      { text: 'sound poet and visual artist', italic: true },
      { text: ' who pushed the boundaries of language beyond meaning. He used the typewriter, photocopier, and ' },
      { text: 'duplicating machines', bold: true },
      { text: ' to create dense typographic textures operating as scores for performance.' },
    ]}
    p2={[
      { text: '\u2018Beethoven Today\u2019 is a circular composition on ' },
      { text: 'yellow paper', italic: true },
      { text: ', where layers of text accumulate en une ' },
      { text: 'masse presque musicale', bold: true },
      { text: ' de marques, \u00E9voquant \u00E0 la fois la densit\u00E9 orchestrale et les limites de la page imprim\u00E9e.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Carnival Panel — Steve McCaffery (1967–75)
// ─────────────────────────────────────────────────────────────────────────────
export function CarnivalPanel({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#e5e5e5"
    imageOeuvre={carnivalImg} imageBg={mccafferyImg}
    totalChars={470}
    lines={['Panel from \u2018Carnival\u2019', 'by Steve McCaffery', '(1967\u201375)']}
    p1={[
      { text: 'Steve McCaffery' },
      { text: ' (b. ' }, { text: '1947', bold: true }, { text: ') is a British-Canadian ' },
      { text: 'language poet', italic: true },
      { text: ' whose work investigates the materiality of language. His ' },
      { text: 'Carnival', bold: true }, { text: ' is a major work of typewriter poetry.' },
    ]}
    p2={[
      { text: 'Composed over eight years, ' },
      { text: 'Carnival', italic: true },
      { text: ' consists of 16 perforated panels that can be dismantled and reassembled. Each panel is un dense ' },
      { text: 'visual poem', bold: true },
      { text: ' produced on a typewriter, challenging the linearity of reading.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Textum 2 — Miroljub Todorović (1973)
// ─────────────────────────────────────────────────────────────────────────────
export function Textum2({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#e8e8e8"
    imageOeuvre={textumImg} imageBg={miroImg}
    totalChars={440}
    lines={['\u2018Textum 2\u2019', 'by Miroljub Todorovi\u010d', '(1973)']}
    p1={[
      { text: 'Miroljub Todorovi\u010d' },
      { text: ' (b. ' }, { text: '1940', bold: true }, { text: ') is a Serbian poet and founder of ' },
      { text: 'Signalism', italic: true },
      { text: ', a Yugoslav neo-avant-garde movement combining typewriter art, concrete poetry and visual language.' },
    ]}
    p2={[
      { text: '\u2018Textum 2\u2019 is a composition produced on an ' },
      { text: 'Olivetti Lettera 32', italic: true },
      { text: ', using overlapping characters in red and black to create a ' },
      { text: 'woven textile effect', bold: true },
      { text: '. The title itself refers to the Latin for \u201Cwoven\u201D.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// The words we use are lovely — J.P. Ward (1973)
// ─────────────────────────────────────────────────────────────────────────────
export function WordsLovely({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f5f2ec"
    imageOeuvre={wordsImg} imageBg={wordsImg}
    totalChars={460}
    lines={['\u2018the words we use are lovely\u2019', 'by J.P. Ward', '(1973)']}
    p1={[
      { text: 'J.P. Ward is a poet whose work explores the ' },
      { text: 'visual and sonic dimensions', italic: true },
      { text: ' of language. This piece bridges ' },
      { text: 'concrete poetry', bold: true },
      { text: ' and visual art, using the typewriter to create a composition both textual and pictorial.' },
    ]}
    p2={[
      { text: 'This spiral composition radiates outward from a ' },
      { text: 'typographic centre', bold: true },
      { text: ', with words in rotating rays. The repetition creates a ' },
      { text: 'meditative rhythm', italic: true },
      { text: ' that transforms reading into an almost visual experience.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// O — Alan Riddell (1975–1976)
// ─────────────────────────────────────────────────────────────────────────────
export function OPiece({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#e8e8e8"
    imageOeuvre={oImg} imageBg={alanRiddellImg}
    totalChars={480}
    lines={['\u2018O\u2019', 'by Alan Riddell', '(1975\u20131976)']}
    p1={[
      { text: 'Alan Riddell' },
      { text: ' (' }, { text: '1927\u20131977', bold: true }, { text: ') was a Scottish poet and key figure in ' },
      { text: 'concrete poetry', italic: true },
      { text: ', a movement exploring the visual dimensions of language. He used the typewriter as both tool and medium, where ' },
      { text: 'form becomes content', bold: true }, { text: '.' },
    ]}
    p2={[
      { text: '\u2018O\u2019 is one of Riddell\u2019s most celebrated works \u2014 a ' },
      { text: 'geometric typewriter composition', bold: true },
      { text: ' built from overlapping coloured ribbons forming a diamond of concentric frames. The work bridges ' },
      { text: 'Op Art and concrete poetry', italic: true }, { text: '.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Unusual Love Poem — Alan Riddell (1975)
// ─────────────────────────────────────────────────────────────────────────────
export function UnusualLovePoem({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f5f2ec"
    imageOeuvre={unusualImg} imageBg={alanRiddellImg}
    totalChars={420}
    lines={['\u2018Unusual Love Poem\u2019', 'by Alan Riddell', '(1975)']}
    p1={[
      { text: 'Dans cette oeuvre, Alan Riddell utilise le ' },
      { text: 'contour de deux bouteilles', italic: true },
      { text: ' construit enti\u00E8rement de caract\u00E8res typographiques r\u00E9p\u00E9t\u00E9s. Les \u00E9tiquettes \u2014 \u201Cbottle of love\u201D et \u201Cbottle of kisses\u201D \u2014 sont inscrites en ' },
      { text: 'type monospace', bold: true }, { text: '.' },
    ]}
    p2={[
      { text: 'La pi\u00E8ce appartient aux ' },
      { text: 'shaped poems', italic: true },
      { text: ' de Riddell, o\u00F9 la forme visuelle et le contenu verbal sont ins\u00E9parables. La machine \u00E0 \u00E9crire devient un moyen de ' },
      { text: 'dessiner avec des mots', bold: true }, { text: '.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Typewritten Portraits — Nadine Faye James (2007)
// ─────────────────────────────────────────────────────────────────────────────
export function TypewrittenPortraits({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f2f0ea"
    imageOeuvre={typewrittenImg} imageBg={typewrittenImg}
    totalChars={450}
    lines={['from \u2018Typewritten Portraits\u2019', 'by Nadine Faye James', '(2007)']}
    p1={[
      { text: 'Nadine Faye James creates ' },
      { text: 'intimate portraits', bold: true },
      { text: ' of friends and family using only the characters of a vintage typewriter, capturing personality through ' },
      { text: 'typographic texture', italic: true }, { text: '.' },
    ]}
    p2={[
      { text: 'The series demonstrates the enduring appeal of ' },
      { text: 'analogue processes', bold: true },
      { text: ' in the digital age, and the unique warmth that the typewriter brings to portrait art.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Looking Forward — Keira Rathbone (2010)
// ─────────────────────────────────────────────────────────────────────────────
export function LookingForward({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#ede8e0"
    imageOeuvre={lookingImg} imageBg={keiraImg}
    totalChars={490}
    lines={['\u2018Looking Forward\u2019', 'by Keira Rathbone', '(2010)']}
    p1={[
      { text: 'Keira Rathbone' },
      { text: ' (b. ' }, { text: '1981', bold: true }, { text: ') is a British artist who creates des ' },
      { text: 'portraits \u00E0 la machine \u00E0 \u00E9crire', italic: true },
      { text: ' d\u2019une pr\u00E9cision extraordinaire, repoussant les limites entre ' },
      { text: 'dessin et frappe', bold: true }, { text: '.' },
    ]}
    p2={[
      { text: '\u2018Looking Forward\u2019 est un portrait o\u00F9 le texte du 19e amendement de la Constitution am\u00E9ricaine est enti\u00E8rement tap\u00E9, fusionnant ' },
      { text: 'contenu politique', bold: true },
      { text: ' et forme visuelle en une d\u00E9claration sur les droits et la repr\u00E9sentation.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// The Pattern Series — Vickie Simpson (2012)
// ─────────────────────────────────────────────────────────────────────────────
export function PatternSeries({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f5f2ec"
    imageOeuvre={patternImg} imageBg={vickiImg}
    totalChars={400}
    lines={['\u2018The Pattern Series\u2019', 'by Vickie Simpson', '(2012)']}
    p1={[
      { text: 'Dans cette s\u00E9rie, Vickie Simpson abandonne la repr\u00E9sentation au profit de la ' },
      { text: 'pure abstraction g\u00E9om\u00E9trique', bold: true },
      { text: ', cr\u00E9ant des compositions en losange avec des rubans de machine \u00E0 \u00E9crire color\u00E9s. Le r\u00E9sultat est une ' },
      { text: 'surface textile', italic: true }, { text: ' de caract\u00E8res entrelac\u00E9s.' },
    ]}
    p2={[
      { text: 'La s\u00E9rie s\u2019inspire de l\u2019' },
      { text: 'Op Art et du tissage', italic: true },
      { text: ', utilisant la grille de la machine pour g\u00E9n\u00E9rer des ' },
      { text: 'rythmes optiques', bold: true },
      { text: ' qui vibrent sur la page.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Barcelona Love Letters — Keira Rathbone (2002)
// ─────────────────────────────────────────────────────────────────────────────
export function BarcelonaLove({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f0ede5"
    imageOeuvre={barcelonaImg} imageBg={keiraImg}
    totalChars={460}
    lines={['\u2018Barcelona Love Letters\u2019', 'by Keira Rathbone', '(2002)']}
    p1={[
      { text: 'Keira Rathbone a cr\u00E9\u00E9 cette oeuvre lors d\u2019une r\u00E9sidence \u00E0 ' },
      { text: 'Barcelone', bold: true },
      { text: '. \u00C0 l\u2019aide de sa machine \u00E0 \u00E9crire, elle a dessin\u00E9 de petites ' },
      { text: 'figures humaines', italic: true },
      { text: ' dispers\u00E9es sur la page, chacune compos\u00E9e de frappes individuelles. L\u2019oeuvre capture la ' },
      { text: 'chor\u00E9graphie de la vie urbaine', bold: true }, { text: '.' },
    ]}
    p2={[
      { text: 'Dat\u00E9e du ' },
      { text: '27/4/2002', italic: true },
      { text: ', elle appartient aux \u201Clove letters\u201D de Rathbone \u2014 dessins d\u2019observation d\u2019espaces publics faits \u00E0 la machine \u00E0 \u00E9crire plut\u00F4t qu\u2019au crayon. Le r\u00E9sultat est \u00E0 la fois ' },
      { text: 'document et po\u00E8me', bold: true }, { text: '.' },
    ]}
  />
}

// ─────────────────────────────────────────────────────────────────────────────
// Oeuvres originales
// ─────────────────────────────────────────────────────────────────────────────

import typewriterManualImg from '../images/typewritersmanual.webp'
import isaacPitmanImg      from '../images/isaac-pitman.png'
import untitledFloraImg    from '../images/untitledflora.webp'
import ottoBismarckImg     from '../images/ottovonbismarck.webp'

export function PitmansManual({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#f5f0e8"
    imageOeuvre={typewriterManualImg} imageBg={isaacPitmanImg}
    totalChars={467}
    lines={["Pitman\u2019s Typewriter Manual", 'by Isaac Pitman', '(1893)']}
    p1={[
      { text: 'Isaac Pitman' },
      { text: ' (' }, { text: '1813\u20131897', bold: true }, { text: ') was a ' },
      { text: 'British educator', italic: true },
      { text: ' who invented in 1837 a system of ' },
      { text: 'stenography', bold: true },
      { text: ' \u2014 allowing one to write at great speed. His method was widely adopted in offices throughout the ' },
      { text: '19\u1D57\u02B0 century', italic: true },
      { text: ' to take notes rapidly.' },
    ]}
    p2={[
      { text: 'The first edition of ' },
      { text: "Pitman\u2019s Typewriter Manual", italic: true },
      { text: ', published in ' }, { text: '1893', bold: true },
      { text: ', included several examples of ' },
      { text: 'typed ornaments', bold: true },
      { text: ' that a typewriter operator could use to ' },
      { text: 'embellish', italic: true }, { text: ' his or her work.' },
    ]}
  />
}

export function FloraOeuvre({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#edeae0"
    imageOeuvre={untitledFloraImg} imageBg={untitledFloraImg}
    totalChars={566}
    lines={['\u2018Untitled\u2019', 'by Flora F.F. Stacey', '(1898)']}
    p1={[
      { text: 'Flora F.F. Stacey' },
      { text: ' was a ' }, { text: 'British typewriter operator', italic: true },
      { text: ' and amateur artist working in ' }, { text: 'London', bold: true },
      { text: ' at the turn of the century. She left behind a remarkable body of ' },
      { text: 'typewritten images', bold: true },
      { text: ' produced entirely with the keys of a standard ' },
      { text: 'Remington typewriter', italic: true }, { text: '.' },
    ]}
    p2={[
      { text: 'Her untitled work of ' }, { text: '1898', bold: true },
      { text: ' is considered one of the earliest known examples of ' },
      { text: 'typewriter art', italic: true },
      { text: '. It represents a female portrait built up line by line using overstriking \u2014 a technique demanding extraordinary ' },
      { text: 'patience', italic: true }, { text: ' and precision.' },
    ]}
  />
}

export function Bismarck({ progress = 0, canStart = false, autoMode = false }) {
  return <OeuvreLayout
    progress={progress} canStart={canStart} autoMode={autoMode}
    bgColor="#ede8dc"
    imageOeuvre={ottoBismarckImg} imageBg={ottoBismarckImg}
    totalChars={538}
    lines={['\u2018Otto von Bismarck\u2019', 'unknown artist', '(1898)']}
    p1={[
      { text: 'Otto von Bismarck' },
      { text: ' (' }, { text: '1815\u20131898', bold: true }, { text: ') was the ' },
      { text: 'first Chancellor of the German Empire', italic: true },
      { text: ', a dominant figure of 19th-century European politics. This anonymous portrait, composed entirely of ' },
      { text: 'typewritten characters', bold: true },
      { text: ', was created in the year of his death.' },
    ]}
    p2={[
      { text: 'The work exemplifies the ' }, { text: 'pictorial ambition', bold: true },
      { text: ' of early typewriter artists, who sought to reproduce recognizable faces through the patient accumulation of ' },
      { text: 'typographic marks', italic: true },
      { text: '. The density of characters reveals a mastery of the medium rarely seen at this period.' },
    ]}
  />
}