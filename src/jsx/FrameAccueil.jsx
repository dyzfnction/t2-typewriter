import { useState, useEffect, useRef } from 'react'

const TITLE_SEGMENTS = [
  { text: 'A Visual History of Typewriter Art ' },
  { br: true },
  { text: 'from ' },
  { text: '1893', strong: true },
  { text: ' to ' },
  { text: 'Today', strong: true },
]

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
          if (seg.br) {
            setNodes(n => [...n, { id: id++, type: 'br' }])
            await sleep(260)
            continue
          }
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
            if (node.type === 'br')     return <br key={node.id} />
            if (node.type === 'strong') return <strong key={node.id}>{node.content}</strong>
            return <span key={node.id}>{node.content}</span>
          })}
          {canStart && <span className="title-cursor">|</span>}
        </h1>
      </header>
    </section>
  )
}
