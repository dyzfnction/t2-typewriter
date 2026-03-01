import { useState, useEffect } from 'react' // hooks React

export default function PageChargement({ onFinish }) { // loader
  const [count, setCount] = useState(0) // compteur
  const [exit, setExit] = useState(false) // état sortie

  useEffect(() => {
    const intervalTime = 40 // vitesse compteur
    const duration = 4000 // durée totale
    const increment = 100 / (duration / intervalTime) // incrément

    const interval = setInterval(() => {
      setCount(c => {
        const next = c + increment
        if (next >= 100) {
          clearInterval(interval)
          setExit(true) // fade out
          setTimeout(onFinish, 800) // fin loader
          return 100
        }
        return next
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [onFinish])

  return (
    <div className={`loader ${exit ? 'is-exit' : ''}`}>
      <img src="./public/images/logo-the-marginalian.png" className="logo-bounce" alt="" />
      <div className="shadow" />
      <div className="counter">{Math.floor(count)}%</div>
    </div>
  )
}