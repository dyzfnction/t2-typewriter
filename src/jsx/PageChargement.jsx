import { useState, useEffect } from 'react'

export default function PageChargement({ onFinish }) {
  const [count, setCount] = useState(0)
  const [exit, setExit] = useState(false)

  useEffect(() => {
    const intervalTime = 40
    const duration = 4000
    const increment = 100 / (duration / intervalTime)

    const interval = setInterval(() => {
      setCount(c => {
        const next = c + increment
        if (next >= 100) {
          clearInterval(interval)
          setExit(true)
          setTimeout(onFinish, 800)
          return 100
        }
        return next
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [onFinish])

  return (
    <div className={`loader ${exit ? 'is-exit' : ''}`}>
      <img src="/t2-typewriter/images/logo-the-marginalian.png" className="logo-bounce" alt="" />
      <div className="shadow" />
      <div className="counter">{Math.floor(count)}%</div>
    </div>
  )
}