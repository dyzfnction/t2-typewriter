import { useState, useEffect, useRef } from 'react'
// FIX : chaque segment du titre est rendu comme un seul nœud (pas un span par char)
// → le navigateur peut faire le retour à la ligne au bon endroit naturellement
import { useLang } from './LangContext'

const BG_ASCII = '                                                                                            &&&&&& &                                                               \n                                                                                     &&&&&&&&&&&&&&&&&&&&&&&                                                       \n                                                                                 &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                                    \n                                                                             $$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&$&&                                                  \n                                                                         &&&&&&&&&&&&&&&&$$$&&&&&&&&&&&&&&&&&&&&&&                                                 \n                                                                      &&&&&&&&&&&&&&&$XxxxxxxxxxXX$$&&&&&&&&&&&&&&&                                                \n                                                                     &&&&&&&&&&&&&$XXxxxxxxxxxxxxxxxxX&&&&&&&$$&&&&$                                               \n                                                                 &&&&&&&&&&&&&&&&&Xxxxxxxx++++++xxxxxxxX&&&&&&&&&&&&&                                              \n                                                               &&&&&&&&&&&$&&&&&&XXxxxxx+++++++++++xxxxxX&&&&&&&&&&&&                                              \n                                                               &&&&&&&&&&&&&&&&$XXxxxxxxx++++++++++++xxxX$&&&&&&&&&&&&                                             \n                                                               &&&&&&&&&&&&&&&XXXXXxx$$$x+++++++++++xxxxx$&&&&&&&&&&&&&&                                           \n                                                              &&&&&$&&&&&&&&&XXxxxxxxxxX$$$Xxx++++++xxxxx$&&&&&&&&&&&&$&&                                          \n                                                            &&&&&&&&&&&&&&&&Xxx+xX$$$XxXXXXXx+xxxXXXxxxxx$&&&&&&&&&&&&&&                                           \n                                                           &&&&&&&&&&&&&&&&Xxx+++xxXX$$XXXXx++xX$$$$$$$$XX&&&&&$$&&&&&&$$                                          \n                                                          $&&&&&&&&&&&&&&&$Xxx++++++xXXx+xxx++x$Xx++xxxxX&&&&&&&&&&&&&&$$                                          \n                                                          &&&&&&&&&&&&&&&&$Xxxxx++++++++xxxx+xxxXX$$&$XXX$&&&&&$&&&&&$&$                                           \n                                                          $$&&&&&&$&&&&&&&$Xxxxxx+++++++xxxx+xxx+xxXX$$$X$&&&&&&&&&&&&&&$                                          \n                                                         &&&&&&&&&&&&&&&&&XXxxxxxx+++++xxxx++xxx+++++xxxx$&&&&$&&&&&&&&&&                                          \n                                                         &&&&&&&&&&&&&&&&$XXxxxxxx+xx+x$$&XXXXX++++++xxxx$&&&&&$&&&&&&&$                                           \n                                                          &&&&&&&&&&&&&&&$Xxxxxxxx++++xxxX$$$$X+++++xxxxX&&&&&&$&&&&&&&&                                           \n                                                          &&&$&&&&&&&&&&&$Xxxxxx+xxxx++++xxxxxxx+++xxxxX$&&&&&&&&&&&&&&&                                           \n                                                          &&&&&&&&&&&&&&&$Xxxxxx++xx$$$$$$$XxxxxxxxxxXX&&&&&&&&&&&&&&&&&                                           \n                                                           &&&&&&&&&&&&&&$Xxxxxx+++xx$$$$$$$$xxxxxxxXX$&&&&&&&&&&&&&&$X                                            \n                                                            &&&&&&&&&&&&&&$Xxxxxx++xxX$$$$$$XxxxxxxXX$&&&&&&&&&&&&&&$$                                             \n                                                             &&&&&&&&&&&&&&$Xxxxx+++++xxXXXxxxxxxxXX$&&&&&&&&&&&&&&&&&                                             \n                                                              &&&&&&&&&&&&&XX$Xxxx++++++++xxxxxXXXX$&&&&&&&&&&&&&$&&&                                              \n                                                               &&&&&&&&&&&&XXX$$XXXXXxxxxxxxxxXXX$&&&&&&&&&&&&&&&$$$&                                              \n                                                                &&&&&&&&&&&XXXX$$$$$$$$$XXXXXXX$$&&&&&&&&&&&&&&&&$&&&                                              \n                                                                 &&&&&&&&&&xxXXXXX$$&&$$$$$$$$$$$&&&&&&&&&&&&&&&&$$                                                \n                                                                  &&&&&&&&$xxxXXXXX$$&&&&&$$$XXXX&&&&&&&&&$&&&&$&                                                  \n                                                                   &&&&&&&XxxxxXXXXXX$$$$XXXXXXXX$&&&&&&&&&&$&&&                                                   \n                                                                     &&$XXxxxxxxxxXXXXXXXXXxxxxxxX&&&&&&                                                           \n                                                                $XxxxxxxXxxxxxxxxxxxXXXXXxxxxxxxxxxxX&&&                                                           \n                                                        XXXXXXxxxxxxxxxxxxxxxxxxxxxxXXxxxxxxxxxxxxxxxxxxxxXXXXXXXXX                                                \n                                                 $XXXXXXXXXXXxxxx+xxxxxxxxxxxxxxxxxxXXXXxxxxxxxxxxxxxx+++++XXXXXXXX$XXX                                            \n                                              XXXXXXXXXXXXXXX++++xxxxxxxxxxxxxxxxxxxxxxxxx++xxx++x++++++++xxXXXXXXXXXXXXXXX                                        \n                                           XXXXXXXXXXXXXXXXXX+++++++++++xxxxxxxx++++++++++++++++xxxxxx+++++++$$XXXXXXXXXXXXXX                                      \n                                         XXXXXXXXXXXXXXXXXXXX++++++++++++x++++++++++++++++++++++++++++++++++x$$XXXXX$XXXXXXXXXX                                    \n                                        XXXXXXXXXXXXXXXXXXXXXX+++++++++++x+++++++++++++++++++++x++++++++++++XX$XXXXX$XXXXXXXXXXX                                   \n                                       XXXXXXX$XXXXXXXXXXXXXXXx++++++++++x++++++++++++++++++++++++++++++++++XX$XXXXXXXXXXXX$$$$XX                                  \n                                      XXXXXXXXXXXXXXXXXXXXXXXXXx+++++++++xx+x++++++++++++++++++++++++++++++xXX$XXXXXXXXXX$$$$$$$XX                                 \n                                     XXXXX$$$XXXXXXXXXXXXXXXXXXXx++++++++xxxxxxx+++++++++++++++++++++++++++XXXXXXXXXXXXX$$$$$$$$$X                                 \n                                    XXXXX$$$XXXXXXXXXXXXXXXXXXXXXX+++++++++xxx++++++++++++++++++++++++++++XX$XXXXXXXXXXXX$$$$$$$$$                                 \n                                    XXXX$$$XXXXXXXXXXXXXXXXXXXXXXXXX++++++;;++++++++++++++++++++++++++++xXX$$XXXXXXXXXXXX$$$$$$$$$                                 \n                                   XXX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXx+++++;;;;;;;;+++++++++++++++++++XXX$XXXXXXXXXXXXXX$$$$$$$$X                                 \n                                   XXX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXx++++;;;;;+;;;++++++++++++++XXX$$XXXXXXXXXXXXXXX$$$$$$$$X                                 \n                                  $XX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx+++++++;;+++++++++++XXXX$$XXXXXXXXXXXXXXXX$$$$$$$$$                                  \n                                  XX$$$$$$$$XXX$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX+++++++++++++xXXXX$$$XXXXXXXXXXXXXXXXX$$$$$$$$$$                                  \n                                  X$$$$$$XXXX$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxXXXXXXX$$$XXXXXXXXXXXXXXXXXXXX$X$$$$$$$$$                                  \n                                 XXXX$XXXXXX$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$$XXXXXXXXXXXXXXXXXXXXXXXXX$$$$$$$$$$X                                  \n                                 XXXXXXX$$$$$$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$XXXXXXXXXXXXXXXXXXXXXXXXXXX$$$$$$$$$$XX                                  \n                                XXXXX$$$$XXX$$$&&&$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$$&&&$$$$$$XX                                  \n                                $xXXXXXX$$$$$$&&&&XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&&&$$$$$$$$                                   \n'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function jitter(base) { return Math.max(16, base + (Math.random() - 0.5) * 14) }

export default function FrameAccueil({ canStart }) {
  const { t, lang } = useLang()
  // segments = [{ id, type:'strong'|'text', content:string }]
  // Chaque segment correspond à un bloc du titre (pas un char individuel).
  // Le texte dans chaque segment grandit char par char → wrap naturel possible.
  const [segments, setSegments] = useState([])
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!canStart) return
    cancelRef.current = true
    setSegments([])

    const timeout = setTimeout(() => {
      cancelRef.current = false

      async function writeTitle() {
        for (let i = 0; i < t.accueilTitle.length; i++) {
          const seg = t.accueilTitle[i]
          if (cancelRef.current) return

          // Crée le segment vide d'abord
          const type = seg.strong ? 'strong' : 'text'
          setSegments(prev => [...prev, { id: i, type, content: '' }])

          // Remplit le segment caractère par caractère
          for (const char of seg.text) {
            if (cancelRef.current) return
            setSegments(prev =>
              prev.map(s => s.id === i ? { ...s, content: s.content + char } : s)
            )
            await sleep(jitter(seg.strong ? 46 : 54))
          }
        }
      }
      writeTitle()
    }, 100)

    return () => { cancelRef.current = true; clearTimeout(timeout) }
  }, [canStart])

  return (
    <section id="s-accueil" data-lang={lang}>
      <header className="accueil-header">
        <h1 id="title-flag">
          {segments.map(seg =>
            seg.type === 'strong'
              ? <strong key={seg.id}>{seg.content}</strong>
              : <span key={seg.id}>{seg.content}</span>
          )}
        </h1>
      </header>
      <pre id="accueil-bg-ascii">{BG_ASCII}</pre>
    </section>
  )
}