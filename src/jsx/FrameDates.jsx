import { useEffect, useRef } from 'react'

// ASCII importés directement comme constantes
// (alternative : mettre les .txt dans src/dates/ et utiliser import ... from '...txt?raw')

const A1890 = `      oe       u+=~~~+u.                       .n~~%x.    
    .@88     z8F      \`8N.    .xn!~%x.       x88X   888.  
==*88888    d88L       98E   x888   888.    X888X   8888L 
   88888    98888bu.. .@*   X8888   8888:  X8888X   88888 
   88888    "88888888NNu.   88888   X8888  88888X   88888X
   88888     "*8888888888i  88888   88888> 88888X   88888X
   88888     .zf""*8888888L \`8888  :88888X 88888X   88888f
   88888    d8F      ^%888E   \`"**~ 88888> 48888X   88888 
   88888    88>        \`88~  .xx.   88888   ?888X   8888" 
   88888    '%N.       d*"  '8888>  8888~    "88X   88*\`  
'**%%%%%%**    ^"====="\`     888"  :88%        ^"==="\`    
                              ^"===""                     `

const A1900 = `      oe                       .n~~%x.         .n~~%x.    
    .@88      .xn!~%x.       x88X   888.     x88X   888.  
==*88888     x888   888.    X888X   8888L   X888X   8888L 
   88888    X8888   8888:  X8888X   88888  X8888X   88888 
   88888    88888   X8888  88888X   88888X 88888X   88888X
   88888    88888   88888> 88888X   88888X 88888X   88888X
   88888    \`8888  :88888X 88888X   88888f 88888X   88888f
   88888      \`"**~ 88888> 48888X   88888  48888X   88888 
   88888     .xx.   88888   ?888X   8888"   ?888X   8888" 
   88888    '8888>  8888~    "88X   88*\`     "88X   88*\`  
'**%%%%%%**  888"  :88%        ^"==="\`         ^"==="\`    
              ^"===""                                     `

const A1950 = `      oe                     cuuu....uK        .n~~%x.    
    .@88      .xn!~%x.       888888888       x88X   888.  
==*88888     x888   888.     8*888**"       X888X   8888L 
   88888    X8888   8888:    >  .....      X8888X   88888 
   88888    88888   X8888    Lz"  ^888Nu   88888X   88888X
   88888    88888   88888>   F     '8888k  88888X   88888X
   88888    \`8888  :88888X   ..     88888> 88888X   88888f
   88888      \`"**~ 88888>  @888L   88888  48888X   88888 
   88888     .xx.   88888  '8888F   8888F   ?888X   8888" 
   88888    '8888>  8888~   %8F"   d888"     "88X   88*\`  
'**%%%%%%**  888"  :88%      ^"===*%"\`         ^"==="\`    
              ^"===""                                     `

const A1970 = `      oe                   dL ud8Nu  :8c     .n~~%x.    
    .@88      .xn!~%x.     8Fd888888L %8   x88X   888.  
==*88888     x888   888.   4N88888888cuR  X888X   8888L 
   88888    X8888   8888:  4F   ^""%""d  X8888X   88888 
   88888    88888   X8888  d       .z8   88888X   88888X
   88888    88888   88888> ^     z888    88888X   88888X
   88888    \`8888  :88888X     d8888'    88888X   88888f
   88888      \`"**~ 88888>    888888     48888X   88888 
   88888     .xx.   88888    :888888      ?888X   8888" 
   88888    '8888>  8888~     888888       "88X   88*\`  
'**%%%%%%**  888"  :88%       '%**%          ^"==="\`    
              ^"===""                                   `

const A1980 = `      oe                      u+=~~~+u.        .n~~%x.    
    .@88      .xn!~%x.      z8F      \`8N.    x88X   888.  
==*88888     x888   888.   d88L       98E   X888X   8888L 
   88888    X8888   8888:  98888bu.. .@*   X8888X   88888 
   88888    88888   X8888  "88888888NNu.   88888X   88888X
   88888    88888   88888>  "*8888888888i  88888X   88888X
   88888    \`8888  :88888X  .zf""*8888888L 88888X   88888f
   88888      \`"**~ 88888> d8F      ^%888E 48888X   88888 
   88888     .xx.   88888  88>        \`88~  ?888X   8888" 
   88888    '8888>  8888~  '%N.       d*"    "88X   88*\`  
'**%%%%%%**  888"  :88%       ^"====="\`        ^"==="\`    
              ^"===""                                     `

const A2000 = `  .--~*teu.        .n~~%x.         .n~~%x.         .n~~%x.    
 dF     988Nx    x88X   888.     x88X   888.     x88X   888.  
d888b   \`8888>  X888X   8888L   X888X   8888L   X888X   8888L 
?8888>  98888F X8888X   88888  X8888X   88888  X8888X   88888 
 "**"  x88888~ 88888X   88888X 88888X   88888X 88888X   88888X
      d8888*\`  88888X   88888X 88888X   88888X 88888X   88888X
    z8**"\`   : 88888X   88888f 88888X   88888f 88888X   88888f
  :?.....  ..F 48888X   88888  48888X   88888  48888X   88888 
 <""888888888~  ?888X   8888"   ?888X   8888"   ?888X   8888" 
 8:  "888888*    "88X   88*\`     "88X   88*\`     "88X   88*\`  
 ""    "**"\`       ^"==="\`         ^"==="\`         ^"==="\`    `

const A2012 = `  .--~*teu.        .n~~%x.           oe      .--~*teu.   
 dF     988Nx    x88X   888.       .@88     dF     988Nx 
d888b   \`8888>  X888X   8888L  ==*88888    d888b   \`8888>
?8888>  98888F X8888X   88888     88888    ?8888>  98888F
 "**"  x88888~ 88888X   88888X    88888     "**"  x88888~
      d8888*\`  88888X   88888X    88888          d8888*\` 
    z8**"\`   : 88888X   88888f    88888        z8**"\`   :
  :?.....  ..F 48888X   88888     88888      :?.....  ..F
 <""888888888~  ?888X   8888"     88888     <""888888888~
 8:  "888888*    "88X   88*\`      88888     8:  "888888* 
 ""    "**"\`       ^"==="\`     '**%%%%%%**  ""    "**"\`  `

const DASH = `\n88888888\n88888888\n`

function DatePanel({ animated, zoomOut, children }) {
  const wrapRef = useRef(null)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || !animated) return
    el.style.animation = 'none'
    void el.offsetWidth
    const anim = zoomOut
      ? 'dateZoomOut 0.7s cubic-bezier(0.25,0.46,0.45,0.94) both'
      : 'dateZoomIn 0.65s cubic-bezier(0.34,1.56,0.64,1) both'
    el.style.animation = anim
  }, [animated, zoomOut])
  return (
    <div className="era-date-panel">
      <div ref={wrapRef} className="date-stack">{children}</div>
    </div>
  )
}

export function FrameDate1890({ animated }) {
  return (
    <DatePanel animated={animated}>
      <pre className="date-ascii-line">{A1890}</pre>
      <pre className="date-ascii-dash">{DASH}</pre>
      <pre className="date-ascii-line">{A1900}</pre>
    </DatePanel>
  )
}

export function FrameDate1950({ animated }) {
  return (
    <DatePanel animated={animated}>
      <pre className="date-ascii-line">{A1950}</pre>
      <pre className="date-ascii-dash">{DASH}</pre>
      <pre className="date-ascii-line">{A1970}</pre>
    </DatePanel>
  )
}

export function FrameDate1980({ animated }) {
  return (
    <DatePanel animated={animated}>
      <pre className="date-ascii-line">{A1980}</pre>
    </DatePanel>
  )
}

export function FrameDate2000({ animated }) {
  return (
    <DatePanel animated={animated}>
      <pre className="date-ascii-line">{A2000}</pre>
      <pre className="date-ascii-dash">{DASH}</pre>
      <pre className="date-ascii-line">{A2012}</pre>
    </DatePanel>
  )
}