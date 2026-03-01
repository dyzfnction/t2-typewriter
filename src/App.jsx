import { useState } from 'react'
import PageChargement from './jsx/PageChargement'
import AppMain from './jsx/AppMain'

function App() {
  const [loadingDone, setLoadingDone] = useState(false)

  return (
    <>
      <AppMain loadingDone={loadingDone} />
      {!loadingDone && (
        <PageChargement onFinish={() => setLoadingDone(true)} />
      )}
    </>
  )
}

export default App