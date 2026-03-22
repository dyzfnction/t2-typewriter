import { useState, useEffect, useRef } from 'react'

// Titre sans <br> forcé — sur une seule ligne, wrap naturel du CSS
const TITLE_SEGMENTS = [
  { text: 'A\u00A0Visual History of\u00A0Typewriter\u00A0Art from\u00A0' },
  { text: '1893', strong: true },
  { text: '\u00A0to\u00A0' },
  { text: 'Today', strong: true },
]

const BG_ASCII = '                                                                                            &&&&&& &                                                               \n                                                                                     &&&&&&&&&&&&&&&&&&&&&&&                                                       \n                                                                                 &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&                                                    \n                                                                             $$$&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&$&&                                                  \n                                                                         &&&&&&&&&&&&&&&&$$$&&&&&&&&&&&&&&&&&&&&&&                                                 \n                                                                      &&&&&&&&&&&&&&&$XxxxxxxxxxXX$$&&&&&&&&&&&&&&&                                                \n                                                                     &&&&&&&&&&&&&$XXxxxxxxxxxxxxxxxxX&&&&&&&$$&&&&$                                               \n                                                                 &&&&&&&&&&&&&&&&&Xxxxxxxx++++++xxxxxxxX&&&&&&&&&&&&&                                              \n                                                               &&&&&&&&&&&$&&&&&&XXxxxxx+++++++++++xxxxxX&&&&&&&&&&&&                                              \n                                                               &&&&&&&&&&&&&&&&$XXxxxxxxx++++++++++++xxxX$&&&&&&&&&&&&                                             \n                                                               &&&&&&&&&&&&&&&XXXXXxx$$$x+++++++++++xxxxx$&&&&&&&&&&&&&&                                           \n                                                              &&&&&$&&&&&&&&&XXxxxxxxxxX$$$Xxx++++++xxxxx$&&&&&&&&&&&&$&&                                          \n                                                            &&&&&&&&&&&&&&&&Xxx+xX$$$XxXXXXXx+xxxXXXxxxxx$&&&&&&&&&&&&&&                                           \n                                                           &&&&&&&&&&&&&&&&Xxx+++xxXX$$XXXXx++xX$$$$$$$$XX&&&&&$$&&&&&&$$                                          \n                                                          $&&&&&&&&&&&&&&&$Xxx++++++xXXx+xxx++x$Xx++xxxxX&&&&&&&&&&&&&&$$                                          \n                                                          &&&&&&&&&&&&&&&&$Xxxxx++++++++xxxx+xxxXX$$&$XXX$&&&&&$&&&&&$&$                                           \n                                                          $$&&&&&&$&&&&&&&$Xxxxxx+++++++xxxx+xxx+xxXX$$$X$&&&&&&&&&&&&&&$                                          \n                                                         &&&&&&&&&&&&&&&&&XXxxxxxx+++++xxxx++xxx+++++xxxx$&&&&$&&&&&&&&&&                                          \n                                                         &&&&&&&&&&&&&&&&$XXxxxxxx+xx+x$$&XXXXX++++++xxxx$&&&&&$&&&&&&&$                                           \n                                                          &&&&&&&&&&&&&&&$Xxxxxxxx++++xxxX$$$$X+++++xxxxX&&&&&&$&&&&&&&&                                           \n                                                          &&&$&&&&&&&&&&&$Xxxxxx+xxxx++++xxxxxxx+++xxxxX$&&&&&&&&&&&&&&&                                           \n                                                          &&&&&&&&&&&&&&&$Xxxxxx++xx$$$$$$$XxxxxxxxxxXX&&&&&&&&&&&&&&&&&                                           \n                                                           &&&&&&&&&&&&&&$Xxxxxx+++xx$$$$$$$$xxxxxxxXX$&&&&&&&&&&&&&&$X                                            \n                                                            &&&&&&&&&&&&&&$Xxxxxx++xxX$$$$$$XxxxxxxXX$&&&&&&&&&&&&&&$$                                             \n                                                             &&&&&&&&&&&&&&$Xxxxx+++++xxXXXxxxxxxxXX$&&&&&&&&&&&&&&&&&                                             \n                                                              &&&&&&&&&&&&&XX$Xxxx++++++++xxxxxXXXX$&&&&&&&&&&&&&$&&&                                              \n                                                               &&&&&&&&&&&&XXX$$XXXXXxxxxxxxxxXXX$&&&&&&&&&&&&&&&$$$&                                              \n                                                                &&&&&&&&&&&XXXX$$$$$$$$$XXXXXXX$$&&&&&&&&&&&&&&&&$&&&                                              \n                                                                 &&&&&&&&&&xxXXXXX$$&&$$$$$$$$$$$&&&&&&&&&&&&&&&&$$                                                \n                                                                  &&&&&&&&$xxxXXXXX$$&&&&&$$$XXXX&&&&&&&&&$&&&&$&                                                  \n                                                                   &&&&&&&XxxxxXXXXXX$$$$XXXXXXXX$&&&&&&&&&&$&&&                                                   \n                                                                     &&$XXxxxxxxxxXXXXXXXXXxxxxxxX&&&&&&                                                           \n                                                                $XxxxxxxXxxxxxxxxxxxXXXXXxxxxxxxxxxxX&&&                                                           \n                                                        XXXXXXxxxxxxxxxxxxxxxxxxxxxxXXxxxxxxxxxxxxxxxxxxxxXXXXXXXXX                                                \n                                                 $XXXXXXXXXXXxxxx+xxxxxxxxxxxxxxxxxxXXXXxxxxxxxxxxxxxx+++++XXXXXXXX$XXX                                            \n                                              XXXXXXXXXXXXXXX++++xxxxxxxxxxxxxxxxxxxxxxxxx++xxx++x++++++++xxXXXXXXXXXXXXXXX                                        \n                                           XXXXXXXXXXXXXXXXXX+++++++++++xxxxxxxx++++++++++++++++xxxxxx+++++++$$XXXXXXXXXXXXXX                                      \n                                         XXXXXXXXXXXXXXXXXXXX++++++++++++x++++++++++++++++++++++++++++++++++x$$XXXXX$XXXXXXXXXX                                    \n                                        XXXXXXXXXXXXXXXXXXXXXX+++++++++++x+++++++++++++++++++++x++++++++++++XX$XXXXX$XXXXXXXXXXX                                   \n                                       XXXXXXX$XXXXXXXXXXXXXXXx++++++++++x++++++++++++++++++++++++++++++++++XX$XXXXXXXXXXXX$$$$XX                                  \n                                      XXXXXXXXXXXXXXXXXXXXXXXXXx+++++++++xx+x++++++++++++++++++++++++++++++xXX$XXXXXXXXXX$$$$$$$XX                                 \n                                     XXXXX$$$XXXXXXXXXXXXXXXXXXXx++++++++xxxxxxx+++++++++++++++++++++++++++XXXXXXXXXXXXX$$$$$$$$$X                                 \n                                    XXXXX$$$XXXXXXXXXXXXXXXXXXXXXX+++++++++xxx++++++++++++++++++++++++++++XX$XXXXXXXXXXXX$$$$$$$$$                                 \n                                    XXXX$$$XXXXXXXXXXXXXXXXXXXXXXXXX++++++;;++++++++++++++++++++++++++++xXX$$XXXXXXXXXXXX$$$$$$$$$                                 \n                                   XXX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXx+++++;;;;;;;;+++++++++++++++++++XXX$XXXXXXXXXXXXXX$$$$$$$$X                                 \n                                   XXX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXx++++;;;;;+;;;++++++++++++++XXX$$XXXXXXXXXXXXXXX$$$$$$$$X                                 \n                                  $XX$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx+++++++;;+++++++++++XXXX$$XXXXXXXXXXXXXXXX$$$$$$$$$                                  \n                                  XX$$$$$$$$XXX$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX+++++++++++++xXXXX$$$XXXXXXXXXXXXXXXXX$$$$$$$$$$                                  \n                                  X$$$$$$XXXX$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxXXXXXXX$$$XXXXXXXXXXXXXXXXXXXX$X$$$$$$$$$                                  \n                                 XXXX$XXXXXX$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$$XXXXXXXXXXXXXXXXXXXXXXXXX$$$$$$$$$$X                                  \n                                 XXXXXXX$$$$$$$$$$$$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$XXXXXXXXXXXXXXXXXXXXXXXXXXX$$$$$$$$$$XX                                  \n                                XXXXX$$$$XXX$$$&&&$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX$$&&&$$$$$$XX                                  \n                                $xXXXXXX$$$$$$&&&&XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&&&$$$$$$$$                                   \n'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function jitter(base) { return Math.max(16, base + (Math.random() - 0.5) * 14) }

export default function FrameAccueil({ canStart }) {
  const [nodes, setNodes] = useState([])
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!canStart) return
    cancelRef.current = true
    setNodes([])

    const timeout = setTimeout(() => {
      cancelRef.current = false

      async function writeTitle() {
        let id = 0
        for (const seg of TITLE_SEGMENTS) {
          if (cancelRef.current) return
          if (seg.strong) {
            const nodeId = id++
            setNodes(n => [...n, { id: nodeId, type: 'strong', content: '' }])
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => n.map(nd =>
                nd.id === nodeId ? { ...nd, content: nd.content + char } : nd
              ))
              await sleep(jitter(46))
            }
          } else {
            for (const char of seg.text) {
              if (cancelRef.current) return
              setNodes(n => [...n, { id: id++, type: 'text', content: char }])
              await sleep(jitter(54))
            }
          }
        }
      }
      writeTitle()
    }, 100)

    return () => { cancelRef.current = true; clearTimeout(timeout) }
  }, [canStart])

  return (
    <section id="s-accueil">
      <header className="accueil-header">
        <h1 id="title-flag">
          {nodes.map(node => {
            if (node.type === 'strong') return <strong key={node.id}>{node.content}</strong>
            return <span key={node.id}>{node.content}</span>
          })}
        </h1>
      </header>
      <pre id="accueil-bg-ascii">{BG_ASCII}</pre>
    </section>
  )
}