import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
// FIX #5 : import du contexte de langue pour les paragraphes bilingues
import { useLang } from './LangContext'

// PARAS n'est plus une constante statique — on utilise t.machineParagraphs depuis LangContext

const TRANS = 0.08
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

let sharedAudioCtx = null
function ensureAudio() {
  if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return sharedAudioCtx
}
function playTypeClick() {
  const ctx = ensureAudio(), now = ctx.currentTime
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.045, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) {
    const t = i / ctx.sampleRate
    d[i] = (Math.random()*2-1)*Math.exp(-t*280)*0.9 + (Math.random()*2-1)*Math.exp(-t*80)*0.35 + Math.sin(t*2800*Math.PI*2)*Math.exp(-t*600)*0.12
  }
  const src = ctx.createBufferSource(); src.buffer = buf
  const gain = ctx.createGain(); gain.gain.setValueAtTime(0.38 + Math.random()*0.08, now)
  src.playbackRate.value = 0.94 + Math.random()*0.14
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1800; filt.Q.value = 0.7
  src.connect(filt); filt.connect(gain); gain.connect(ctx.destination); src.start(now)
}
function playReturn() {
  const ctx = ensureAudio(), now = ctx.currentTime
  for (let i = 0; i < 3; i++) {
    const buf = ctx.createBuffer(1, ctx.sampleRate*0.18, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let j = 0; j < d.length; j++) { const t = j/ctx.sampleRate; d[j] = (Math.random()*2-1)*Math.exp(-t*22)*0.5 + Math.sin(t*320*Math.PI*2)*Math.exp(-t*18)*0.2 }
    const src = ctx.createBufferSource(); src.buffer = buf
    const gain = ctx.createGain(); gain.gain.setValueAtTime(0.22, now+i*0.04)
    src.connect(gain); gain.connect(ctx.destination); src.start(now+i*0.04)
  }
}
function playBell() {
  const ctx = ensureAudio(), now = ctx.currentTime
  const osc = ctx.createOscillator(); osc.type = 'sine'
  osc.frequency.setValueAtTime(1480, now); osc.frequency.exponentialRampToValueAtTime(1200, now+0.55)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.28, now+0.006); gain.gain.exponentialRampToValueAtTime(0.001, now+0.80)
  const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.setValueAtTime(2960, now)
  const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.06, now); g2.gain.exponentialRampToValueAtTime(0.001, now+0.35)
  osc.connect(gain); osc2.connect(g2); gain.connect(ctx.destination); g2.connect(ctx.destination)
  osc.start(now); osc.stop(now+0.85); osc2.start(now); osc2.stop(now+0.40)
}
function playBackspace() {
  const ctx = ensureAudio(), now = ctx.currentTime
  const buf = ctx.createBuffer(1, ctx.sampleRate*0.03, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) { const t = i/ctx.sampleRate; d[i] = (Math.random()*2-1)*Math.exp(-t*400)*0.25 }
  const src = ctx.createBufferSource(); src.buffer = buf
  const g = ctx.createGain(); g.gain.value = 0.6
  src.connect(g); g.connect(ctx.destination); src.start(now)
}
function playSpacebar() {
  const ctx = ensureAudio(), now = ctx.currentTime
  const buf = ctx.createBuffer(1, ctx.sampleRate*0.06, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) { const t = i/ctx.sampleRate; d[i] = (Math.random()*2-1)*Math.exp(-t*180)*0.3 + Math.sin(t*600*Math.PI*2)*Math.exp(-t*200)*0.08 }
  const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = 0.9+Math.random()*0.1
  const g = ctx.createGain(); g.gain.value = 0.5
  src.connect(g); g.connect(ctx.destination); src.start(now)
}

function Machine3D({ containerRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const W = container.clientWidth
    const H = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setClearColor(0x0d0905, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 2.4
    renderer.physicallyCorrectLights = true

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0d0905, 0.022)
    const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 120)
    cam.position.set(0, 3.8, 38)

    const kL = new THREE.SpotLight(0xffd080, 600, 55, Math.PI/3.8, 0.38, 1.3)
    kL.position.set(7, 18, 10); kL.castShadow = true
    kL.shadow.mapSize.set(2048, 2048); kL.shadow.bias = -0.0002
    kL.shadow.camera.near = 4; kL.shadow.camera.far = 52
    scene.add(kL, kL.target)
    const fL = new THREE.DirectionalLight(0xc87030, 1.8); fL.position.set(-9, 6, 4); scene.add(fL)
    const rL = new THREE.SpotLight(0xffaa20, 80, 35, Math.PI/2.8, 0.55, 1.6); rL.position.set(-6, 12, -14); scene.add(rL)
    const glow = new THREE.PointLight(0xff8c20, 3.5, 12, 1.8); glow.position.set(0, -0.5, 2); scene.add(glow)
    const flicker = new THREE.PointLight(0xff7010, 0, 18, 2); flicker.position.set(3, 3, 5); scene.add(flicker)
    scene.add(new THREE.HemisphereLight(0x7a4a18, 0x120a02, 2.2))
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(28, 24), new THREE.ShadowMaterial({ opacity: 0.38 }))
    sc.rotation.x = -Math.PI/2; sc.position.y = -0.01; sc.receiveShadow = true; scene.add(sc)

    const m = (c, ro, me, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: ro, metalness: me, ...x })
    const MAT = {
      body:    m(0x2a1e0e, 0.78, 0.10), bodyD:   m(0x1e1408, 0.85, 0.08),
      bodyHL:  m(0x3d2a12, 0.62, 0.14), chrome:  m(0xd4a832, 0.08, 0.95),
      chromeD: m(0xb88c22, 0.22, 0.90), brass:   m(0xc8921a, 0.18, 0.92),
      brassW:  m(0xa87818, 0.32, 0.85), rubber:  m(0x1a1008, 0.98, 0.00),
      ebonite: m(0x0a0806, 0.70, 0.05), keyRing: m(0xe0b840, 0.12, 0.94),
      ink:     m(0x140e06, 0.96, 0.00), red:     m(0x8c2010, 0.50, 0.06),
      blue:    m(0x182888, 0.50, 0.06), typebar: m(0xc89a28, 0.20, 0.88),
    }

    const TW = new THREE.Group(); scene.add(TW)
    function add(geo, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0, par=TW) {
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x,y,z); mesh.rotation.set(rx,ry,rz)
      mesh.castShadow = true; mesh.receiveShadow = true
      par.add(mesh); return mesh
    }
    const BX = (w,h,d) => new THREE.BoxGeometry(w,h,d)
    const CY = (rt,rb,h,s=32) => new THREE.CylinderGeometry(rt,rb,h,s)
    const SP = (r,s=20) => new THREE.SphereGeometry(r,s,s)
    const TR = (R,r,ts=16,rs=40,a=Math.PI*2) => new THREE.TorusGeometry(R,r,ts,rs,a)

    add(BX(7.10,0.52,5.20), MAT.bodyD, 0,0.26,0.10)
    for (const [fx,fz] of [[-2.8,-2.2],[-2.8,2.15],[2.8,-2.2],[2.8,2.15]])
      add(CY(0.25,0.28,0.15,18), MAT.rubber, fx,0.07,fz)
    for (const sx of [-3.14,3.14]) {
      const s = Math.sign(sx)
      add(BX(0.46,1.55,5.05), MAT.body, sx,0.98,0.10)
      add(BX(0.36,0.28,4.80), MAT.bodyHL, sx,1.72,0.10)
      add(BX(0.058,1.55,0.055), MAT.chrome, sx+s*0.03,0.98,-2.38)
      add(BX(0.058,1.55,0.055), MAT.chrome, sx+s*0.03,0.98,2.52)
    }
    add(BX(7.10,1.55,0.46), MAT.body, 0,0.98,2.36)
    add(BX(5.0,0.72,0.07), MAT.bodyD, 0,0.90,2.43)
    add(BX(2.20,0.36,0.09), MAT.brass, 0,0.90,2.44)
    add(BX(1.96,0.24,0.06), MAT.bodyD, 0,0.90,2.46)
    add(BX(6.80,0.060,0.060), MAT.chrome, 0,1.46,2.38)
    add(BX(6.80,0.060,0.060), MAT.chrome, 0,0.52,2.38)
    add(BX(7.10,1.25,0.46), MAT.bodyD, 0,0.83,-2.28)
    for (let v=0;v<9;v++) add(BX(4.40,0.040,0.030), m(0x180e04,0.93,0), 0,0.30+v*0.11,-2.28)
    add(BX(6.40,0.26,4.40), MAT.body, 0,1.74,0.12)
    add(BX(5.75,0.10,3.70), MAT.bodyD, 0,1.88,0.12)
    for (let x=-2.95;x<=2.95;x+=0.47) {
      add(CY(0.037,0.037,0.044,8), MAT.brass, x,1.46,2.39)
      add(CY(0.037,0.037,0.044,8), MAT.brass, x,0.54,2.39)
    }
    for (const sx of [-3.14,3.14])
      for (let y=0.36;y<=1.38;y+=0.46)
        add(CY(0.037,0.037,0.044,8), MAT.brass, sx,y,0.10)
    for (const [dx,dz] of [[-2.85,-2.1],[-2.85,2.15],[2.85,-2.1],[2.85,2.15]])
      add(CY(0.040,0.040,0.044,8), MAT.brass, dx,1.87,dz)

    add(BX(7.80,0.13,0.13), MAT.chrome, 0,1.87,-0.60)
    add(BX(7.80,0.13,0.13), MAT.chrome, 0,1.87,0.60)
    for (const ex of [-3.90,3.90]) add(CY(0.16,0.16,0.27,18), MAT.chrome, ex,1.87,0, 0,0,Math.PI/2)
    for (let x=-2.8;x<=2.8;x+=1.4) add(BX(0.11,0.30,1.32), MAT.chromeD, x,2.02,0)
    const RACKW=6.40, TSTEP=0.168, TN=38, THALF=TSTEP*(TN-1)/2
    add(BX(RACKW,0.10,0.19), MAT.chromeD, 0,1.79,0)
    for (let i=0;i<TN;i++) add(BX(0.056,0.12,0.056), MAT.chrome, -THALF+i*TSTEP,1.86,0)
    add(BX(0.13,0.25,0.12), MAT.brass, RACKW/2+0.14,1.84,0)
    add(BX(0.25,0.09,0.12), MAT.brass, RACKW/2+0.07,1.78,0)

    const CG = new THREE.Group(); CG.position.set(0,1.88,0); TW.add(CG)
    function cg(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0) { return add(geo,mat,x,y,z,rx,ry,rz,CG) }
    cg(BX(5.80,0.38,1.45), MAT.body)
    cg(BX(5.60,0.060,0.060), MAT.chrome, 0,0.22,0.74)
    cg(BX(5.60,0.060,0.060), MAT.chrome, 0,0.22,-0.74)
    for (const cx of [-2.92,2.92]) cg(BX(0.22,0.44,1.45), MAT.chromeD, cx,0.07,0)

    const platMat = m(0x000000, 0.97, 0.00)
    const platen = new THREE.Mesh(CY(0.55,0.55,6.10,64), platMat)
    platen.rotation.z = Math.PI/2; platen.position.set(0,0.60,-0.06)
    platen.castShadow = true; platen.receiveShadow = true; CG.add(platen)
    for (const cx of [-3.10,3.10]) {
      const ec = new THREE.Mesh(CY(0.565,0.565,0.18,36), MAT.chrome)
      ec.rotation.z = Math.PI/2; ec.position.set(cx,0.60,-0.06); CG.add(ec)
    }
    const bk = new THREE.Mesh(CY(0.38,0.34,0.34,22), MAT.chrome); bk.rotation.z = Math.PI/2; bk.position.set(3.34,0.60,-0.06); CG.add(bk)
    const lk = new THREE.Mesh(CY(0.38,0.34,0.34,22), MAT.chrome); lk.rotation.z = Math.PI/2; lk.position.set(-3.34,0.60,-0.06); CG.add(lk)

    const paperCanvas = document.createElement('canvas')
    paperCanvas.width = 512; paperCanvas.height = 1024
    const ptx = paperCanvas.getContext('2d')
    const paperTex = new THREE.CanvasTexture(paperCanvas)
    const paperMatTex = new THREE.MeshStandardMaterial({
      map: paperTex, roughness: 0.82, metalness: 0.00,
      side: THREE.DoubleSide, transparent: true, opacity: 1.0,
    })
    const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.65, 2.1, 1, 60), paperMatTex)
    paperMesh.position.set(0, 2.20, -0.09)
    paperMesh.rotation.x = -0.05
    paperMesh.castShadow = true; paperMesh.receiveShadow = true; CG.add(paperMesh)
    const COLS = 36, CHARS_PER_PAGE = COLS * 20
    let paperFill = 0, paperFading = false, paperFadeT = 0, totalCharsOnPage = 0

    const bail = new THREE.Mesh(CY(0.052,0.052,4.95,18), MAT.chrome)
    bail.rotation.z = Math.PI/2; bail.position.set(0,0.68,0.70); CG.add(bail)
    for (const bx2 of [-1.75,1.75]) {
      const bc = new THREE.Mesh(CY(0.11,0.11,0.09,14), MAT.chrome)
      bc.rotation.z = Math.PI/2; bc.position.set(bx2,0.68,0.70); CG.add(bc)
    }
    for (const px of [-1.02,1.02]) cg(BX(0.09,0.36,0.09), MAT.chromeD, px,0.84,0.66)
    cg(BX(4.90,0.09,0.28), MAT.chromeD, 0,0.90,0.88)

    const CR = new THREE.Group(); CR.position.set(-3.80,1.88,0); TW.add(CR)
    add(BX(0.11,0.11,1.18), MAT.chrome, 0,0,0.59, 0,0,0, CR)
    add(BX(0.11,0.66,0.11), MAT.chrome, 0,0.33,1.18, 0,0,0, CR)
    add(SP(0.155,15), MAT.rubber, 0,0.70,1.18, 0,0,0, CR)
    for (const mx of [-2.14,1.68]) cg(BX(0.17,0.32,0.34), MAT.red, mx,0.25,-0.25)

    const seg = new THREE.Mesh(TR(2.00,0.078,15,72,Math.PI*1.12), MAT.chromeD)
    seg.position.set(0,1.76,1.14); seg.rotation.x = -Math.PI*0.42; TW.add(seg)
    const segI = new THREE.Mesh(TR(1.74,0.057,11,68,Math.PI*1.10), MAT.body)
    segI.position.set(0,1.76,1.14); segI.rotation.x = -Math.PI*0.42; TW.add(segI)
    add(BX(4.95,0.09,0.28), MAT.chromeD, 0,1.92,0.88)

    const typebars = []
    for (let side=0;side<2;side++) {
      for (let i=0;i<46;i++) {
        const a = (i/45)*Math.PI - Math.PI/2
        const g = new THREE.Group()
        const bar = new THREE.Mesh(BX(0.040,1.22,0.026), MAT.typebar); bar.castShadow = true; g.add(bar)
        const slug = new THREE.Mesh(BX(0.090,0.115,0.068), MAT.ink); slug.position.set(0,0.67,0); g.add(slug)
        const piv = new THREE.Mesh(CY(0.046,0.046,0.065,10), MAT.chromeD); piv.position.set(0,-0.58,0); piv.rotation.z = Math.PI/2; g.add(piv)
        const xs = side===0 ? 1 : -1
        g.position.set(xs*Math.cos(a)*1.85*0.52, 1.76+Math.abs(Math.sin(a))*0.20, 1.14+Math.sin(a)*0.48)
        g.rotation.x = -Math.PI*0.42 + Math.sin(a)*0.14
        g.rotation.z = xs*(-a*0.08)
        TW.add(g)
        typebars.push({ g, baseY: g.position.y, baseRX: g.rotation.x })
      }
    }

    for (const sx of [-2.10,2.10]) {
      add(CY(0.088,0.088,0.26,14), MAT.chromeD, sx,1.84,-0.60)
      add(CY(0.52,0.52,0.062,40), MAT.chromeD, sx,1.75,-0.60)
      add(CY(0.36,0.36,0.30,40), MAT.ink, sx,1.90,-0.60)
      add(CY(0.52,0.52,0.062,40), MAT.chrome, sx,2.06,-0.60)
      add(CY(0.54,0.48,0.13,36), m(0x1c1814,0.52,0.22,{transparent:true,opacity:0.70}), sx,2.12,-0.60)
      add(CY(0.078,0.078,0.072,6), MAT.brass, sx,2.16,-0.60)
    }
    add(BX(4.22,0.056,0.030), m(0x0c0808,0.95,0), 0,1.90,-0.56)
    add(BX(0.068,0.44,0.046), MAT.chromeD, 0,1.76,0.74)
    add(BX(0.25,0.068,0.046), MAT.chromeD, 0,1.98,0.74)
    for (const ex of [-0.60,0.60]) add(TR(0.066,0.022,8,18), MAT.chrome, ex,1.90,0.56, Math.PI/2,0,0)

    add(BX(0.60,0.15,0.58), MAT.bodyD, -3.02,1.72,1.18)
    add(BX(0.48,0.12,0.24), MAT.red, -3.02,1.80,1.06)
    add(BX(0.48,0.12,0.24), MAT.blue, -3.02,1.80,1.28)
    add(BX(0.046,0.022,0.065), m(0xcec6a0,0.82,0), -3.02,1.87,1.17)
    add(BX(0.09,0.32,0.09), MAT.chromeD, -3.02,1.94,1.17)
    add(SP(0.088,12), MAT.rubber, -3.02,2.10,1.17)
    add(SP(0.145,20), MAT.brass, 3.16,1.78,-0.58)
    add(CY(0.057,0.057,0.34,11), MAT.chromeD, 3.16,1.62,-0.58)
    for (const ox of [-1.64,1.64]) add(CY(0.074,0.074,0.058,12), MAT.brassW, ox,1.87,-1.70)

    const KB = new THREE.Group(); KB.position.set(0,0.98,3.17); KB.rotation.x = 0.32; TW.add(KB)
    add(BX(5.20,0.24,1.90), MAT.body, 0,0,0, 0,0,0, KB)
    const ksp=0.340, r1hw=(13-1)*ksp/2, KY=0.12
    const keys = []
    const KEY_CHARS = [
      '1','2','3','4','5','6','7','8','9','0','-','=','+',
      'a','z','e','r','t','y','u','i','o','p','q',
      's','d','f',' ','g','h','j',
    ]
    const matKeyCap  = m(0x000000, 0.60, 0.05)
    const matKeyTop  = m(0x000000, 0.40, 0.10)
    const matKeyStem = m(0x8b5e3c, 0.70, 0.05)
    const hitMat     = new THREE.MeshBasicMaterial({ visible: false })

    let ci = 0
    function addKey(x, y, z) {
      const char = KEY_CHARS[ci++] ?? null
      const stem = add(CY(0.090,0.100,0.28,18), matKeyStem, x,y,z, 0,0,0, KB)
      add(TR(0.128,0.026,10,26), MAT.keyRing, x,y+0.155,z, Math.PI/2,0,0, KB)
      const cap = add(CY(0.112,0.116,0.070,24), matKeyCap, x,y+0.190,z, 0,0,0, KB)
      add(CY(0.072,0.072,0.014,20), matKeyTop, x,y+0.228,z, 0,0,0, KB)
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.18,8,8), hitMat)
      hit.position.set(x, y+0.20, z); KB.add(hit)
      keys.push({ stem, cap, hit, baseY: y, char })
    }
    for (let k=0;k<13;k++) addKey(-r1hw+k*ksp, KY, -0.45)
    const r2x = -r1hw+ksp
    for (let k=0;k<11;k++) addKey(r2x+k*ksp, KY, 0)
    for (let k=0;k<3;k++) addKey(-r1hw+k*ksp, KY, 0.45)
    add(BX(2.20,0.075,0.28), MAT.keyRing, 0,KY+0.175,0.45, 0,0,0, KB)
    add(BX(2.08,0.060,0.18), matKeyCap, 0,KY+0.190,0.45, 0,0,0, KB)
    add(BX(1.96,0.045,0.10), matKeyTop, 0,KY+0.202,0.45, 0,0,0, KB)
    const spaceHit = new THREE.Mesh(new THREE.BoxGeometry(2.20,0.25,0.30), hitMat)
    spaceHit.position.set(0, KY+0.20, 0.45); KB.add(spaceHit)
    keys.push({ stem: null, cap: spaceHit, hit: spaceHit, baseY: KY, char: ' ' })
    for (let k=0;k<3;k++) addKey(-r1hw+3*ksp+2.35+k*ksp, KY, 0.45)

    const raycaster = new THREE.Raycaster()
    const mouse2d = new THREE.Vector2()
    const hitMeshes = keys.map(k => k.hit)
    const hitToKey  = new Map(keys.map(k => [k.hit, k]))

    let lines = [''], curLine = 0, cxTgt = 2.2
    let ribbonColor = 'black', totalChars = 0
    let carriageShake = 0

    function redrawPaperTexture() {
      const grad = ptx.createLinearGradient(0,0,512,0)
      grad.addColorStop(0,'#f4eed6'); grad.addColorStop(0.5,'#faf5e2'); grad.addColorStop(1,'#f4eed6')
      ptx.fillStyle = grad; ptx.fillRect(0,0,512,1024)
      ptx.strokeStyle = 'rgba(155,130,75,.13)'; ptx.lineWidth = 1
      for (let y=60;y<1024;y+=42) { ptx.beginPath(); ptx.moveTo(0,y); ptx.lineTo(512,y); ptx.stroke() }
      ptx.strokeStyle = 'rgba(175,55,55,.20)'; ptx.lineWidth = 2
      ptx.beginPath(); ptx.moveTo(30,0); ptx.lineTo(30,1024); ptx.stroke()
      ptx.font = '18px "Courier New", monospace'
      const lineH=38, marginX=36, maxW=440, startY=48
      lines.slice(Math.max(0,curLine-24), curLine+1).forEach((line,i) => {
        const ypos = startY+i*lineH; if (ypos>1010) return
        ptx.fillStyle = ribbonColor==='red' ? 'rgba(110,18,18,.85)' : 'rgba(12,8,2,.82)'
        for (let c=0;c<line.length;c++) {
          const cx = marginX+c*11.8; if (cx>marginX+maxW) break
          ptx.fillText(line[c], cx+(Math.random()-0.5)*0.5, ypos+(Math.random()-0.5)*0.5)
        }
      })
      paperTex.needsUpdate = true
    }
    redrawPaperTexture()

    let tbTmr=null, tbActive=null
    function animTB(i) {
      if (tbActive!==null) { const p=typebars[tbActive]; p.g.position.y=p.baseY; p.g.rotation.x=p.baseRX }
      if (tbTmr) clearTimeout(tbTmr)
      const tb=typebars[i]; tb.g.position.y=tb.baseY+0.30; tb.g.rotation.x=tb.baseRX+0.36; tbActive=i
      tbTmr=setTimeout(()=>{ tb.g.position.y=tb.baseY; tb.g.rotation.x=tb.baseRX; tbActive=null }, 110)
    }
    let kTmr=null, kActive=null
    function animKey(i) {
      if (kActive!==null) { const p=keys[kActive]; if(p.cap) p.cap.position.y=p.baseY+0.190; if(p.stem) p.stem.position.y=p.baseY }
      if (kTmr) clearTimeout(kTmr)
      const k=keys[i]
      if(k.cap) k.cap.position.y=k.baseY+0.110
      if(k.stem) k.stem.position.y=k.baseY-0.060
      kActive=i
      kTmr=setTimeout(()=>{ if(k.cap) k.cap.position.y=k.baseY+0.190; if(k.stem) k.stem.position.y=k.baseY; kActive=null }, 110)
    }
    function animPlaten() {
      const start=platen.rotation.x, end=start+Math.PI/4; let t=0
      const step=()=>{ t+=0.07; platen.rotation.x=start+(end-start)*Math.min(t,1); if(t<1) requestAnimationFrame(step) }
      step()
    }

    function doType(char) {
      ensureAudio()
      if (char==='\b') {
        if (lines[curLine].length>0) {
          lines[curLine]=lines[curLine].slice(0,-1); cxTgt=Math.min(2.2,cxTgt+0.122)
          totalChars=Math.max(0,totalChars-1); totalCharsOnPage=Math.max(0,totalCharsOnPage-1)
          paperFill=totalCharsOnPage/CHARS_PER_PAGE; playBackspace()
        } else if (curLine>0) {
          lines.pop(); curLine--; cxTgt=2.2-(lines[curLine].length/COLS)*4.4; playBackspace()
        }
      } else if (char==='\n') {
        lines.push(''); curLine++; cxTgt=2.2
        totalCharsOnPage=Math.min(CHARS_PER_PAGE,totalCharsOnPage+COLS)
        paperFill=totalCharsOnPage/CHARS_PER_PAGE
        playReturn(); animPlaten(); carriageShake=0.18
      } else {
        if (lines[curLine].length>=COLS) { lines.push(''); curLine++; cxTgt=2.2; playReturn(); animPlaten(); carriageShake=0.18 }
        lines[curLine]+=char; cxTgt-=0.122; cxTgt=Math.max(-2.2,cxTgt)
        totalChars++; totalCharsOnPage++
        paperFill=Math.min(1,totalCharsOnPage/CHARS_PER_PAGE)
        if (lines[curLine].length===32) playBell()
        else if (char===' ') playSpacebar()
        else playTypeClick()
        animTB(Math.floor(Math.random()*typebars.length))
        animKey(Math.floor(Math.random()*keys.length))
      }
      if (paperFill>=1 && !paperFading) { paperFading=true; paperFadeT=0 }
      redrawPaperTexture()
    }

    function onKeyDown(e) {
      if (e.ctrlKey||e.metaKey||e.altKey) return
      if (e.key==='Backspace') { e.preventDefault(); doType('\b') }
      else if (e.key==='Enter') { e.preventDefault(); doType('\n') }
      else if (e.key.length===1) { e.preventDefault(); doType(e.key) }
    }
    window.addEventListener('keydown', onKeyDown)

    const DIST_TARGET = 38
    let drag=false, touchTap=false
    let ox=0, oy=0, touchStartX=0, touchStartY=0
    let rotY=0.28, rotX=0, tRY=0.28, tRX=0
    let tD=DIST_TARGET
    const RXN=-0.65, RXX=0.19, LF=0.088

    function onMouseDown(e) { drag=true; ox=e.clientX; oy=e.clientY; ensureAudio() }
    function onMouseUp() { drag=false }
    function onMouseMove(e) {
      if (!drag) return
      tRY+=(e.clientX-ox)*0.007; ox=e.clientX
      tRX+=(e.clientY-oy)*0.005; oy=e.clientY
      tRX=Math.max(RXN,Math.min(RXX,tRX))
    }
    function onTouchStart(e) {
      touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY
      touchTap=true; drag=true; ox=touchStartX; oy=touchStartY; ensureAudio()
    }
    function onTouchEnd(e) {
      drag=false
      if (touchTap) {
        const dx=e.changedTouches[0].clientX-touchStartX
        const dy=e.changedTouches[0].clientY-touchStartY
        if (Math.sqrt(dx*dx+dy*dy)<10) {
          const rect=canvas.getBoundingClientRect()
          mouse2d.x=((e.changedTouches[0].clientX-rect.left)/rect.width)*2-1
          mouse2d.y=-((e.changedTouches[0].clientY-rect.top)/rect.height)*2+1
          raycaster.setFromCamera(mouse2d, cam)
          const hits=raycaster.intersectObjects(hitMeshes, false)
          if (hits.length>0) { const k=hitToKey.get(hits[0].object); if (k?.char) doType(k.char) }
        }
      }
      touchTap=false
    }
    function onTouchMove(e) {
      if (!drag) return
      e.preventDefault(); e.stopPropagation()
      const dx=e.touches[0].clientX-touchStartX, dy=e.touches[0].clientY-touchStartY
      if (Math.sqrt(dx*dx+dy*dy)>10) touchTap=false
      tRY+=(e.touches[0].clientX-ox)*0.007; ox=e.touches[0].clientX
      tRX+=(e.touches[0].clientY-oy)*0.005; oy=e.touches[0].clientY
      tRX=Math.max(RXN,Math.min(RXX,tRX))
    }
    function onClick(e) {
      if (drag) return
      const rect=canvas.getBoundingClientRect()
      mouse2d.x=((e.clientX-rect.left)/rect.width)*2-1
      mouse2d.y=-((e.clientY-rect.top)/rect.height)*2+1
      raycaster.setFromCamera(mouse2d, cam)
      const hits=raycaster.intersectObjects(hitMeshes, false)
      if (hits.length>0) { const k=hitToKey.get(hits[0].object); if (k?.char) doType(k.char) }
    }

    function onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      e.stopPropagation()
      tD += e.deltaY * 0.015; tD = Math.max(5, Math.min(80, tD))
    }
    let lastPinchDist = 0
    function onTouchStartPinch(e) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDist = Math.sqrt(dx*dx+dy*dy)
      }
    }
    function onTouchMovePinch(e) {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const d = Math.sqrt(dx*dx+dy*dy)
        tD -= (d - lastPinchDist) * 0.08
        tD = Math.max(5, Math.min(80, tD))
        lastPinchDist = d
      }
    }

    function onResize() {
      const w=container.clientWidth, h=container.clientHeight
      cam.aspect=w/h; cam.updateProjectionMatrix(); renderer.setSize(w,h)
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('click', onClick)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchstart', onTouchStartPinch, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchmove', onTouchMovePinch, { passive: false })
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let animId

    function loop() {
      animId=requestAnimationFrame(loop)
      const t=clock.getElapsedTime()

      rotY+=(tRY-rotY)*LF; rotX+=(tRX-rotX)*LF
      TW.rotation.y=rotY; TW.rotation.x=rotX
      const dist = tD

      const cH=3.8+Math.max(0,rotX)*5.5
      const cZ=dist*Math.cos(Math.max(0,-rotX)*0.5)
      cam.position.set(0,cH,cZ); cam.lookAt(0,1.25,0)

      CG.position.x+=(cxTgt-CG.position.x)*0.04
      if (carriageShake>0) {
        CG.position.y=1.88+Math.sin(t*80)*carriageShake*0.04
        carriageShake*=0.82; if(carriageShake<0.005) carriageShake=0
      } else { CG.position.y=1.88 }

      if (paperFading) {
        paperFadeT += 0.016
        paperMatTex.opacity = Math.max(0, 1 - paperFadeT)
        if (paperFadeT >= 1) {
          paperFading=false; paperFadeT=0; paperFill=0
          totalCharsOnPage=0; paperMatTex.opacity=1
          lines=['']; curLine=0; cxTgt=2.2; redrawPaperTexture()
        }
      } else { paperMatTex.opacity = 1 }

      platen.rotation.x+=0.0004
      flicker.intensity=Math.sin(t*3.7)*0.8+Math.sin(t*7.1)*0.4+Math.cos(t*2.3)*0.3+2.2
      flicker.position.x=3+Math.sin(t*1.1)*0.15; flicker.position.z=5+Math.cos(t*0.9)*0.1
      glow.intensity=3.5+Math.sin(t*1.3)*0.4+Math.sin(t*2.9)*0.2
      kL.intensity=600+Math.sin(t*0.7)*18
      if (!drag) tRY+=Math.sin(t*0.09)*0.0003

      renderer.render(scene,cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchstart', onTouchStartPinch)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchmove', onTouchMovePinch)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}

export default function FrameMachine() {
  // FIX #5 : utilise les paragraphes depuis LangContext (bilingue)
  const { t } = useLang()

  const railRef         = useRef(null)
  const machine3dRef    = useRef(null)
  const renderedIdxRef  = useRef(-1)
  const targetCountRef  = useRef(0)
  const displayCountRef = useRef(0)
  const rafMachineRef   = useRef(null)
  // FIX #5 : on garde une ref des paragraphes pour y accéder dans le handler scroll
  const parasRef        = useRef(t.machineParagraphs)
  const [paraText,    setParaText]    = useState('')
  const [paraOpacity, setParaOpacity] = useState(1)

  // FIX #5 : met à jour la ref quand la langue change
  useEffect(() => {
    parasRef.current = t.machineParagraphs
    // Reset le texte affiché quand la langue change
    renderedIdxRef.current = -1
    displayCountRef.current = 0
    targetCountRef.current = 0
    setParaText('')
  }, [t.machineParagraphs])

  function animateMachine(text) {
    rafMachineRef.current = null
    const diff = targetCountRef.current - displayCountRef.current
    if (Math.abs(diff) < 0.5) {
      displayCountRef.current = targetCountRef.current
      setParaText(text.slice(0, Math.round(displayCountRef.current)))
      return
    }
    displayCountRef.current += Math.sign(diff) * clamp(Math.abs(diff) * 0.18, 0.4, 12)
    setParaText(text.slice(0, Math.round(displayCountRef.current)))
    rafMachineRef.current = requestAnimationFrame(() => animateMachine(text))
  }

  useEffect(() => {
    function onScroll() {
      // FIX #5 : lit depuis la ref pour toujours avoir les bons paragraphes (langue courante)
      const PARAS = parasRef.current
      const rail = railRef.current; if (!rail) return
      const railTop    = rail.getBoundingClientRect().top + window.scrollY
      const railHeight = rail.offsetHeight - window.innerHeight
      const p = clamp((window.scrollY - railTop) / railHeight, 0, 1)
      const segSize   = 1 / PARAS.length
      const paraIndex = clamp(Math.floor(p / segSize), 0, PARAS.length - 1)
      const segProg   = (p - paraIndex * segSize) / segSize
      const text      = PARAS[paraIndex]
      if (paraIndex !== renderedIdxRef.current) {
        if (rafMachineRef.current) { cancelAnimationFrame(rafMachineRef.current); rafMachineRef.current = null }
        setParaText(''); setParaOpacity(1)
        renderedIdxRef.current = paraIndex; displayCountRef.current = 0; targetCountRef.current = 0
      }
      if (segProg >= 1-TRANS && paraIndex < PARAS.length-1) {
        setParaOpacity(clamp(1-(segProg-(1-TRANS))/TRANS, 0, 1))
        targetCountRef.current = displayCountRef.current = text.length; setParaText(text); return
      }
      setParaOpacity(1)
      targetCountRef.current = easeInOut(clamp(segProg/(1-TRANS), 0, 1)) * text.length
      if (!rafMachineRef.current) rafMachineRef.current = requestAnimationFrame(() => animateMachine(text))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="s-machine-rail" ref={railRef}>
      <div id="s-machine-sticky">
        <div className="machine-text-zone">
          <div id="machine-para" style={{ opacity: paraOpacity }}>{paraText}</div>
        </div>
        <div className="machine-3d" ref={machine3dRef}>
          <Machine3D containerRef={machine3dRef} />
        </div>
      </div>
    </div>
  )
}
