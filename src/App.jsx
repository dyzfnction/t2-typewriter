import { useState } from 'react'
import PageChargement from './jsx/PageChargement'
import AppMain from './jsx/AppMain'
// import PageLivre from './jsx/PageLivre'
import StickyRoller from './jsx/StickyRoller'

function App() {
  const [loadingDone, setLoadingDone] = useState(false)

  return (
    <>
      <AppMain canStart={loadingDone} />
      {/* <PageLivre /> */}
      <StickyRoller />
      {!loadingDone && (
        <PageChargement onFinish={() => setLoadingDone(true)} />
      )}
    </>
  )
}

export default App