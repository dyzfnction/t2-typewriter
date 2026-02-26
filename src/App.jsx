import { useState, useEffect } from 'react'           // hooks React
import PageChargement from './jsx/PageChargement'       // loader sombre
import AppMain from './jsx/AppMain'                     // page titre
import ScrollStory from './jsx/ScrollStory'             // frise chronologique

function App() {
  const [loadingDone, setLoadingDone] = useState(false) // état chargement terminé

  useEffect(() => {
    if (loadingDone && window.AOS) {  // initialise AOS après le loader
      window.AOS.init({
        once: true,                   // anime une seule fois par élément
        duration: 600,                // 600ms par défaut
        easing: 'ease-out-cubic',     // courbe fluide
        offset: 80,                   // déclenche 80px avant le bord
      })
    }
  }, [loadingDone])

  return (
    <>
      <AppMain />         {/* page titre — typewriter + touches */}
      <ScrollStory />     {/* frise chronologique scrollytelling */}

      {!loadingDone && ( /* loader par-dessus jusqu'à la fin */
        <PageChargement onFinish={() => setLoadingDone(true)} />
      )}
    </>
  )
}

export default App