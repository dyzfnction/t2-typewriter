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

export default function AppMain() {
  const [nodes, setNodes] = useState([])
  const cancelRef = useRef(false)

  useEffect(() => {
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

    return () => {
      cancelRef.current = true
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="app-main">

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
        {/* futur contenu scrollytelling */}
      </main>

      <footer className="app-footer">
        <section>
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
        </section>
      </footer>

    </div>
  )
}