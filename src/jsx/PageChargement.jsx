import { useState, useEffect, useRef } from 'react' // hooks React

// Caractères clavier qui flottent en arrière-plan
const KEYS = [ // pool de caractères clavier
  'A','S','D','F','G','H','J','K','L',
  'Q','W','E','R','T','Y','U','I','O','P',
  'Z','X','C','V','B','N','M',
  '1','2','3','4','5','6','7','8','9','0',
  '@','#','$','%','&','*','(',')','!','?',
  ':',';','"',"'",'/','-','_','=','+',
  '↵','⇧','⌫','⇥','⌃','⌥',
]

function generateChars(count) { // génère les données des caractères flottants
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    char: KEYS[Math.floor(Math.random() * KEYS.length)], // caractère aléatoire
    x: Math.random() * 100,                               // position X en %
    y: Math.random() * 100,                               // position Y en %
    size: 0.55 + Math.random() * 1.1,                     // taille en rem
    opacity: 0.04 + Math.random() * 0.18,                 // très discret
    duration: 6 + Math.random() * 14,                     // durée float
    delay: Math.random() * 8,                             // délai
    color: Math.random() < 0.7 ? 'amber' : 'green',      // 70% ambre / 30% vert
  }))
}

export default function PageChargement({ onFinish }) { // composant loader principal
  const [count, setCount] = useState(0)                // compteur progression
  const [exit, setExit] = useState(false)              // état fade out
  const chars = useRef(generateChars(55))              // caractères stables entre renders

  useEffect(() => {
    const intervalTime = 40                            // tick toutes les 40ms
    const duration = 4000                              // 4 secondes au total
    const increment = 100 / (duration / intervalTime)  // incrément par tick

    const interval = setInterval(() => {
      setCount(c => {
        const next = c + increment
        if (next >= 100) {
          clearInterval(interval)
          setExit(true)                                // déclenche fade out
          setTimeout(onFinish, 900)                    // notifie App après fade
          return 100
        }
        return next
      })
    }, intervalTime)

    return () => clearInterval(interval) // nettoyage
  }, [onFinish])

  return (
    <div className={`loader-dark ${exit ? 'is-exit' : ''}`}> {/* loader plein écran sombre */}

      {/* SVG ligne pointillée haut — évoque le rouleau de la machine */}
      <svg className="loader-svg-top" viewBox="0 0 400 20" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <line x1="0" y1="10" x2="400" y2="10" stroke="#b8860b" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.4"/>
        <rect x="380" y="5" width="12" height="10" rx="1" fill="none" stroke="#b8860b" strokeWidth="0.5" opacity="0.5"/>
      </svg>

      {/* Nappe de caractères flottants en fond */}
      <div className="loader-chars-bg" aria-hidden="true">
        {chars.current.map(c => (
          <span
            key={c.id}
            className={`loader-char loader-char--${c.color}`} // couleur néon dynamique
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              fontSize: `${c.size}rem`,
              opacity: c.opacity,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            {c.char}
          </span>
        ))}
      </div>

      {/* Logo + ombre + compteur au centre */}
      <div className="loader-center">
        <img
          src="/t2-typewriter/images/logo-the-marginalian.png"
          className="logo-bounce-dark" // rebond adapté au fond sombre
          alt=""
        />
        <div className="shadow-dark" /> {/* ombre du logo */}
        <div className="counter-dark">
          {Math.floor(count)}<span className="counter-pct">%</span>
        </div>
      </div>

      {/* SVG touches clavier fantômes en bas */}
      <svg className="loader-svg-bottom" viewBox="0 0 300 30" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect
            key={i}
            x={10 + i * 36}
            y="8"
            width="28"
            height="18"
            rx="3"
            fill="none"
            stroke={i === 3 ? '#b8860b' : '#2a2a2a'} // touche centrale en ambre
            strokeWidth="0.8"
            opacity={i === 3 ? 0.6 : 0.25}
          />
        ))}
      </svg>

    </div>
  )
}