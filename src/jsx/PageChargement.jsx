import { useState, useEffect } from 'react'
import logo from '../images/logo.png'

const DURATION = 3000
const TICK     = 40

export default function PageChargement({ onFinish }) {
  const [count,   setCount]   = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const increment = 100 / (DURATION / TICK)
    const interval  = setInterval(() => {
      setCount(prev => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(interval)
          setExiting(true)
          setTimeout(onFinish, 800)
          return 100
        }
        return next
      })
    }, TICK)
    return () => clearInterval(interval)
  }, [onFinish])

  return (
    <div id="loader" className={exiting ? 'exit' : ''}>
      <img src={logo} alt="logo" id="loader-logo" />
      <div id="loader-shadow" />
      <div id="loader-count">{Math.floor(count)}%</div>
    </div>
  )
}
