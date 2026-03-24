import { createContext, useContext, useState } from 'react'

const TEXTS = {
  fr: {
    // Accueil
    accueilTitle: [
      { text: 'Une\u00A0Histoire Visuelle de\u00A0l\u2019Art de\u00A0la\u00A0Machine\u00A0à\u00A0Écrire de\u00A0' },
      { text: '1893', strong: true },
      { text: '\u00A0à\u00A0' },
      { text: "Aujourd'hui", strong: true },
    ],
    // Machine
    machineParagraphs: [
      "La première machine à\u00A0écrire pratique fut inventée par\u00A0Charles\u00A0Thurber et brevetée en\u00A01843, mais elle ne\u00A0fut jamais produite en\u00A0série.",
      "La machine à\u00A0écrire est passée de\u00A0révolutionnaire à\u00A0son apogée à\u00A0symbole sentimental d'obsolescence à\u00A0notre époque.",
      "Elle fonctionne simplement\u00A0: on\u00A0insère une\u00A0feuille sur\u00A0le cylindre derrière un\u00A0ruban encreur. En\u00A0appuyant sur\u00A0une\u00A0touche, une\u00A0barre frappe le\u00A0ruban pour\u00A0imprimer le\u00A0caractère sur\u00A0le papier.",
      "Le chariot avance ligne par\u00A0ligne et, à\u00A0la\u00A0fin, il\u00A0est ramené au\u00A0départ tandis que le\u00A0cylindre positionne le\u00A0papier pour\u00A0continuer l'écriture.",
    ],
    // Livre CTA
    livreCTA: ['scroll pour ouvrir ↓', 'scroll pour continuer ↓', 'scroll pour fermer ↓'],
    // Livre citation
    livreQuote: '«\u00A0L\u2019art n\u2019est pas une\u00A0chose, c\u2019est une\u00A0manière\u00A0»',
    livreQuoteCite: 'Elbert\u00A0Hubbard, 1908',
    // Livre pages
    livreAnthologie: "Typewriter Art\u00A0: A Modern Anthology est une chronique fascinante du «\u00A0développement de la machine à écrire comme médium pour créer des œuvres bien au-delà de tout ce qu'imaginaient ses concepteurs\u00A0». Le livre illustre l'histoire du genre à travers de nombreuses œuvres couvrant près de 130\u00A0ans, ainsi que des entretiens avec les artistes les plus marquants du domaine.",
    livreBarrie: "Barrie Tullett est maître de conférences en design graphique à la Lincoln School of Art and Design, et cofondateur, avec Philippa\u00A0Wood, de The Caseroom Press, éditeur indépendant basé à Lincoln et Édimbourg. En tant que designer graphique indépendant, ses clients ont inclus Canongate Books, Princeton University Press et Penguin Books.",
  },
  en: {
    // Accueil
    accueilTitle: [
      { text: 'A\u00A0Visual History of\u00A0Typewriter\u00A0Art from\u00A0' },
      { text: '1893', strong: true },
      { text: '\u00A0to\u00A0' },
      { text: 'Today', strong: true },
    ],
    // Machine
    machineParagraphs: [
      "The first practical typewriter was invented by\u00A0Charles\u00A0Thurber and patented in\u00A01843, but it was never mass-produced.",
      "The typewriter went from revolutionary at its peak to a sentimental symbol of obsolescence in our time.",
      "It works simply: you insert a sheet on the platen behind an ink ribbon. By pressing a key, a type bar strikes the ribbon to print the character on the paper.",
      "The carriage advances line by line and, at the end, is returned to the start while the platen positions the paper to continue writing.",
    ],
    // Livre CTA
    livreCTA: ['scroll to open ↓', 'scroll to continue ↓', 'scroll to close ↓'],
    // Livre citation
    livreQuote: '«\u00A0Art is not a thing, it is a way\u00A0»',
    livreQuoteCite: 'Elbert\u00A0Hubbard, 1908',
    // Livre pages
    livreAnthologie: 'Typewriter Art: A Modern Anthology is a fascinating chronicle of \u201Cthe development of the typewriter as a medium for creating work far beyond anything envisioned by the machine\u2019s makers.\u201D The book illustrates the history of the genre through ample artwork spanning nearly 130\u00A0years, as well as interviews with the most prominent artists in the field today.',
    livreBarrie: "Barrie Tullett is Senior Lecturer in Graphic Design at the Lincoln School of Art and Design, and cofounder, with Philippa\u00A0Wood, of The Caseroom Press, an independent publisher based in Lincoln and Edinburgh. As a freelance graphic designer, his clients have included Canongate Books, Princeton University Press, and Penguin Books.",
  },
}

const LangContext = createContext({ lang: 'fr', t: TEXTS.fr, toggleLang: () => {} })

export function LangProvider({ children, lang: langProp, toggleLang: toggleLangProp }) {
  const [langInternal, setLang] = useState('fr')
  const lang       = langProp       ?? langInternal
  const toggleLang = toggleLangProp ?? (() => setLang(l => l === 'fr' ? 'en' : 'fr'))
  return (
    <LangContext.Provider value={{ lang, t: TEXTS[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() { return useContext(LangContext) }