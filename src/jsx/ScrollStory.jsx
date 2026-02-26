import { useEffect, useRef, useState } from 'react' // hooks React

// ── Données de la frise ──────────────────────────────────────────────────────

const TIMELINE = [ // données chronologiques des œuvres
  {
    year: '1893',
    era: 'Les Origines',             // nom de l'ère
    eraNote: 'La machine à écrire commerciale a à peine 20 ans.', // note contextuelle
    mood: 'origin',                  // classe CSS d'ambiance
    works: [
      {
        id: 'p1893',
        title: "Pitman's Typewriter Manual",
        artist: 'Anonyme',
        desc: "Le tout premier exemple enregistré d'art-typing. Des ornements typés apparaissent dans la première édition du manuel de Pitman — preuve que dès l'invention, la machine appelle l'art.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart28.jpg',
      },
    ],
  },
  {
    year: '1898',
    era: 'Les Pionnières',
    eraNote: 'Les premières artistes sont des sténographes, pas des peintres.',
    mood: 'pioneer',
    works: [
      {
        id: 'p1898a',
        title: 'Butterfly',
        artist: 'Flora F.F. Stacey',
        desc: "Une sténographe anglaise crée le premier dessin mécanique de papillon — catapultant l'art-typing sur la scène internationale. Stacey expérimentait depuis des années avant ce coup d'éclat.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart22.jpg',
      },
      {
        id: 'p1898b',
        title: 'Otto von Bismarck',
        artist: 'Artiste inconnu·e',
        desc: 'Portrait politique tapé à la machine, publié plus tard dans "The History of the Typewriter" (1909). La machine devient miroir du pouvoir.',
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart30b.jpg',
      },
    ],
  },
  {
    year: 'c. 1900',
    era: 'Portraits de Pouvoir',
    eraNote: 'La machine à écrire s\'émancipe du bureau.',
    mood: 'origin',
    works: [
      {
        id: 'p1900',
        title: 'Queen Victoria',
        artist: 'Artiste inconnu·e',
        desc: "Portrait de la reine Victoria réalisé entièrement à la machine à écrire. Publié dans 'The History of the Typewriter' de George Mares en 1909 — témoignage d'un art anonyme qui traverse les siècles.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart30a.jpg',
      },
    ],
  },
  {
    year: '1969',
    era: 'Poésie Concrète',
    eraNote: 'La poésie parle aux yeux, pas aux oreilles.',
    mood: 'concrete',
    works: [
      {
        id: 'p1969',
        title: 'Whisper Piece',
        artist: 'Bob Cobbing',
        desc: "Cobbing, d'abord peintre, devient figure de proue de la poésie sonore et visuelle. Il crée un pont entre la page silencieuse et les paysages sonores. En 1968 il fonde le Westminster Group of Experimental Poets.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart33.jpg',
      },
    ],
  },
  {
    year: '1970',
    era: 'L\'Âge d\'Or',
    eraNote: 'Le mouvement de poésie concrète embrasse la machine.',
    mood: 'golden',
    works: [
      {
        id: 'p1970a',
        title: 'Beethoven Today',
        artist: 'Bob Cobbing',
        desc: "Cobbing continue d'explorer la frontière entre texte, image et son. Ses pièces deviennent de plus en plus expérimentales — toute marque, tout son devient ingrédient viable.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart35.jpg',
      },
      {
        id: 'p1975b',
        title: 'Carnival (1970–1975)',
        artist: 'Steve McCaffery',
        desc: "L'un des chefs-d'œuvre absolus de l'art-typing. McCaffery le décrit comme 'un projet cartographique ; un rejet de la linéarité.' Deux panneaux évoluent sur huit ans, du simple au complexe — frottage au carbone, électrostatique, holographe.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart62.jpg',
      },
    ],
  },
  {
    year: '1973',
    era: 'Géométrie & Politique',
    eraNote: 'La machine devient outil de résistance.',
    mood: 'golden',
    works: [
      {
        id: 'p1973a',
        title: 'Textum 2',
        artist: 'Miroljub Todorovic',
        desc: "Étudiant en droit politiquement actif, Todorovic participe aux soulèvements étudiants de mai 1968. Il fonde le mouvement Signalism un an plus tard. Son œuvre mêle collages, poésie visuelle, mail art et art conceptuel.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart37.jpg',
      },
      {
        id: 'p1973b',
        title: 'the words we use are lovely',
        artist: 'J.P. Ward',
        desc: "Ward croit fermement que le poème-machine doit exploiter la nature de la machine elle-même. Son œuvre révèle une fascination pour la géométrie et l'abstraction, cherchant 'des patterns plus élaborés, dont sémantiques.'",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart45.jpg',
      },
    ],
  },
  {
    year: '1975',
    era: 'La Suite des Saisons',
    eraNote: 'Alan Riddell organise les premières grandes expositions d\'art-typing.',
    mood: 'golden',
    works: [
      {
        id: 'p1975a',
        title: "O — The Season Suite",
        artist: 'Alan Riddell',
        desc: "Né en Australie, élevé en Écosse, Riddell est introduit à la poésie concrète par Ian Hamilton Finlay en 1963. Il organise deux expositions majeures à Édimbourg et Londres. Son opus The Seasons Suite reste inachevé à sa mort.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart46.jpg',
      },
    ],
  },
  {
    year: '1987',
    era: 'Ère Punk',
    eraNote: 'La machine à écrire, outil de la contre-culture.',
    mood: 'punk',
    works: [
      {
        id: 'p1987',
        title: 'Unusual Love Poem',
        artist: 'Andrew Belsey',
        desc: "Le mouvement punk voit dans la machine à écrire une intersection créative du pratique et du politique. Un médium qui permet la production bon marché de textes photocopiables pour une large diffusion — pamphlets, fanzines, tracts.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart72.jpg',
      },
    ],
  },
  {
    year: '2007',
    era: 'Portraits Contemporains',
    eraNote: 'La machine à écrire devient objet nostalgique chargé de sens.',
    mood: 'modern',
    works: [
      {
        id: 'p2007',
        title: 'Typewritten Portraits',
        artist: 'Nadine Faye James',
        desc: "Illustratrice britannique, James travaille à l'encre, à la photocopie, au letterpress, à la Letraset et à la machine à écrire. Ses portraits économiques la connectent aux tout premiers artistes-typistes d'il y a cent ans.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart97.jpg',
      },
    ],
  },
  {
    year: '2010',
    era: 'Portraits de Femmes',
    eraNote: 'La machine à écrire et la question du genre.',
    mood: 'modern',
    works: [
      {
        id: 'p2010',
        title: 'Looking Forward',
        artist: 'Leslie Nichols',
        desc: "Formée comme peintre traditionnelle, Nichols combine textes et images pour créer des paysages et portraits en techniques mixtes. Ses portraits sont guidés par le désir de comprendre l'identité des femmes et ses droits — grandes pièces à l'encre à l'huile tamponnée à la main.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart134.jpg',
      },
    ],
  },
  {
    year: '2012',
    era: 'Le Tactile Contre le Digital',
    eraNote: 'La nostalgie de la machine dans un monde numérique.',
    mood: 'modern',
    works: [
      {
        id: 'p2012a',
        title: 'The Pattern Series',
        artist: 'Vickie Simpson',
        desc: "Simpson explore l'esthétique du fait-main. Son inspiration ne se trouve pas sur un écran mais dans l'exploration physique de formes tactiles. Sa série demande au spectateur de contempler la physicalité du geste manuel dans notre monde de plus en plus numérisé.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart109.jpg',
      },
      {
        id: 'p2012b',
        title: 'Barcelona Love Letters',
        artist: 'Keira Rathbone',
        desc: "Lettres d'amour à Barcelone — Rathbone capture l'essence d'une ville avec les seuls caractères d'une machine à écrire. Une œuvre qui incarne la promesse d'origine : tout dire avec les contraintes du mécanisme.",
        img: 'https://i0.wp.com/www.themarginalian.org/wp-content/uploads/2014/05/typewriterart141.jpg',
      },
    ],
  },
]

// ── Hook typewriter ──────────────────────────────────────────────────────────

function useTypewriter(text, active, speed = 35) { // hook pour écriture lettre par lettre
  const [displayed, setDisplayed] = useState('') // texte affiché progressivement
  const cancelRef = useRef(false)                 // flag d'annulation

  useEffect(() => {
    if (!active) return            // n'écrit que si actif (visible)
    cancelRef.current = false
    setDisplayed('')

    let i = 0
    const tick = () => {
      if (cancelRef.current) return
      if (i <= text.length) {
        setDisplayed(text.slice(0, i)) // affiche les i premiers caractères
        i++
        setTimeout(tick, speed + Math.random() * 20) // délai variable pour effet humain
      }
    }
    const t = setTimeout(tick, 120) // petit délai avant de commencer
    return () => { cancelRef.current = true; clearTimeout(t) }
  }, [text, active, speed])

  return displayed
}

// ── Composant Year Section ───────────────────────────────────────────────────

function YearSection({ data, index }) { // section d'une année complète
  const sectionRef = useRef(null) // référence DOM de la section
  const [visible, setVisible] = useState(false) // section visible dans le viewport
  const [carriageBack, setCarriageBack] = useState(false) // animation chariot retour

  // IntersectionObserver : détecte quand la section entre dans le viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true) // déclenche les animations
          observer.disconnect() // une seule fois suffit
        }
      },
      { threshold: 0.15 } // déclenche quand 15% est visible
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // Animation chariot retour quand on scroll vers la section suivante
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setCarriageBack(true), 2200) // délai après apparition
    return () => clearTimeout(t)
  }, [visible])

  const eraText = useTypewriter(data.era, visible, 40)       // titre d'ère en typewriter
  const noteText = useTypewriter(data.eraNote, visible, 22)  // note contextuelle

  return (
    <section
      ref={sectionRef}
      className={`year-section year-section--${data.mood}`} // classe d'ambiance
      data-aos="fade-up"           // animation AOS à l'entrée
      data-aos-duration="600"
      data-aos-once="true"
    >
      {/* ── En-tête de l'année ── */}
      <div className="year-header">

        {/* SVG : ligne de la machine + curseur clignotant */}
        <svg className="year-svg-line" viewBox="0 0 200 16" aria-hidden="true">
          <line x1="0" y1="8" x2="160" y2="8" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.35"/>
          <rect
            x="164" y="3" width="10" height="10" rx="1"
            fill="none" stroke="currentColor" strokeWidth="0.6"
            className={visible ? 'cursor-blink' : ''} // clignotement si visible
            opacity="0.5"
          />
        </svg>

        <div className="year-number">{data.year}</div> {/* année principale */}
        <div className="year-era">{eraText}</div>       {/* nom de l'ère, typewriter */}
        <div className="year-note">{noteText}</div>     {/* note contextuelle */}
      </div>

      {/* ── Œuvres de l'année : scroll horizontal ── */}
      <div className="works-track"> {/* piste de défilement horizontal */}
        {data.works.map((work, wi) => (
          <WorkCard
            key={work.id}
            work={work}
            index={wi}
            visible={visible}
            delay={wi * 180} // décalage entre chaque carte
          />
        ))}
      </div>

      {/* ── Séparateur : animation chariot retour ── */}
      {index < TIMELINE.length - 1 && ( // pas après la dernière section
        <div className={`carriage-return ${carriageBack ? 'carriage-return--active' : ''}`} aria-hidden="true">
          <div className="carriage-line"> {/* barre du chariot */}
            <span className="carriage-label">↵</span> {/* symbole retour chariot */}
          </div>
          <svg className="carriage-arrow" viewBox="0 0 40 20">
            <path d="M35 4 L35 12 L8 12" stroke="currentColor" fill="none" strokeWidth="1.2" strokeLinecap="round"/>
            <polyline points="12,8 8,12 12,16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      )}

    </section>
  )
}

// ── Composant WorkCard ───────────────────────────────────────────────────────

function WorkCard({ work, index, visible, delay }) { // carte d'une œuvre individuelle
  const [imgLoaded, setImgLoaded] = useState(false) // état chargement image
  const titleText = useTypewriter(work.title, visible, 38)   // titre en typewriter
  const artistText = useTypewriter(work.artist, visible, 30) // artiste en typewriter

  return (
    <article
      className="work-card"
      data-aos="fade-right"       // glisse depuis la droite (évoque scroll horizontal)
      data-aos-duration="500"
      data-aos-delay={delay}
      data-aos-once="true"
    >
      {/* Image de l'œuvre */}
      <div className="work-img-wrap">
        {!imgLoaded && <div className="work-img-placeholder" />} {/* placeholder avant chargement */}
        <img
          src={work.img}
          alt={work.title}
          className={`work-img ${imgLoaded ? 'work-img--loaded' : ''}`} // fondu à l'apparition
          onLoad={() => setImgLoaded(true)} // déclenche l'affichage
          loading="lazy"             // chargement différé
        />
      </div>

      {/* Textes */}
      <div className="work-info">
        <h3 className="work-title">{titleText}</h3>   {/* titre typewriter */}
        <p className="work-artist">— {artistText}</p> {/* artiste typewriter */}
        <p className="work-desc">{work.desc}</p>      {/* description statique */}
      </div>
    </article>
  )
}

// ── Composant principal ScrollStory ─────────────────────────────────────────

export default function ScrollStory() { // composant principal de la frise
  // Initialise AOS au montage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AOS) { // vérifie que AOS est disponible
      window.AOS.init({
        once: true,      // animation une seule fois
        duration: 600,   // durée par défaut
        easing: 'ease-out-cubic', // courbe de vitesse
      })
    }
  }, [])

  return (
    <div className="scroll-story"> {/* conteneur principal de la frise */}

      {/* En-tête de la frise */}
      <header className="story-header" data-aos="fade-down" data-aos-once="true">

        {/* SVG décoratif : rouleau de papier */}
        <svg className="story-header-svg" viewBox="0 0 320 40" aria-hidden="true">
          <rect x="0" y="15" width="320" height="12" rx="4" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.2"/>
          <line x1="20" y1="19" x2="300" y2="19" stroke="currentColor" strokeWidth="0.4" opacity="0.15"/>
          <line x1="20" y1="23" x2="300" y2="23" stroke="currentColor" strokeWidth="0.4" opacity="0.15"/>
        </svg>

        <p className="story-intro">
          De 1893 à aujourd'hui — une frise de l'art tapé à la machine.
        </p>
      </header>

      {/* Frise chronologique */}
      {TIMELINE.map((data, i) => (
        <YearSection key={data.year} data={data} index={i} /> // une section par année
      ))}

      {/* Pied de frise */}
      <footer className="story-footer" data-aos="fade-up" data-aos-once="true">
        <svg className="story-footer-svg" viewBox="0 0 200 20" aria-hidden="true">
          <line x1="0" y1="10" x2="200" y2="10" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3"/>
        </svg>
        <p className="story-source">
          Source : <em>Typewriter Art: A Modern Anthology</em> — Barrie Tullett, Laurence King, 2014
        </p>
        <p className="story-source">
          Article : Maria Popova, The Marginalian, 23 mai 2014
        </p>
      </footer>

    </div>
  )
}