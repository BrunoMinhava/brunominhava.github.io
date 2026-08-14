import { Suspense, lazy, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { dpr, features, tier } from '../lib/env'
import { stage, mountedStore } from '../lib/stage'

/**
 * Cada cena é um chunk próprio e só é importada quando a secção respetiva se
 * aproxima do viewport. É isto que mantém o primeiro carregamento leve: o
 * three.js só entra quando o utilizador começa mesmo a descer.
 */
const SCENES = {
  intro: lazy(() => import('../three/IntroScene')),
  thread: lazy(() => import('../three/ThreadScene')),
  screen: lazy(() => import('../three/ScreenScene')),
  flow: lazy(() => import('../three/FlowScene')),
  warehouse: lazy(() => import('../three/WarehouseScene')),
  brain: lazy(() => import('../three/BrainScene')),
}

/**
 * Câmara que reage ao rato.
 *
 * Também é aqui que o ponteiro é amortecido, num sítio só: o valor bruto do
 * evento treme, e todas as cenas leem `stage.smooth`.
 */
function Rig() {
  const { camera } = useThree()

  useFrame((_, dt) => {
    const k = Math.min(1, dt * 3.2)
    stage.smooth.x += (stage.pointer.x - stage.smooth.x) * k
    stage.smooth.y += (stage.pointer.y - stage.smooth.y) * k

    const amp = features.parallaxStrength
    const tx = stage.smooth.x * 0.85 * amp
    const ty = -stage.smooth.y * 0.45 * amp
    const m = Math.min(1, dt * 2.4)
    camera.position.x += (tx - camera.position.x) * m
    camera.position.y += (ty - camera.position.y) * m
    camera.lookAt(0, 0, 0)
  })

  return null
}

/**
 * Iluminação de estúdio, construída em código.
 *
 * Os `Lightformer` são painéis luminosos que o `Environment` cozinha uma vez
 * num mapa de reflexos — é o que dá aos metais e ao vidro alguma coisa para
 * refletir. Sem isto, um material físico num fundo preto fica simplesmente
 * preto. Um preset da drei traria um HDRI de vários megabytes de um CDN
 * externo; aqui são quatro retângulos e zero bytes de rede.
 */
function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} />

      {/*
       * Fontes redondas e largas, não retângulos.
       *
       * Numa esfera polida um `rect` reflete-se como um retângulo nítido — lê
       * como um autocolante colado à superfície, não como luz. Círculos
       * grandes e pouco intensos devolvem gradientes suaves, que é o que uma
       * softbox faz numa mesa de fotografia a sério.
       */}
      <Environment resolution={256} frames={1}>
        {/* Chave, alta e ampla. */}
        <Lightformer
          form="circle"
          intensity={3.2}
          position={[0, 7, -3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={16}
          color="#ffffff"
        />
        {/* Um só recorte frio, para dar aresta ao contorno sem tingir a peça. */}
        <Lightformer
          form="circle"
          intensity={1.5}
          position={[-8, 1, 3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={11}
          color="#a8c4ff"
        />
        {/* Preenchimento quente, muito ténue: só evita que as sombras fiquem
            azuis a mais. */}
        <Lightformer
          form="circle"
          intensity={0.8}
          position={[8, -2, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={10}
          color="#ffd9b0"
        />
      </Environment>
    </>
  )
}

/**
 * Fundo.
 *
 * Um preto chapado é o que faz um site destes parecer um render solto no
 * vazio. Isto é um plano muito atrás com um gradiente radial em textura, e a
 * cor do material — que multiplica a textura — vai buscar o destaque do ato
 * atual, muito dessaturado. O resultado é que o fundo aquece em laranja na
 * Automação e arrefece em violeta na IA sem que se veja a mudança acontecer.
 *
 * Uma textura de 256px e um plano: mais barato do que qualquer shader.
 */
function Backdrop() {
  const mesh = useRef(null)
  const wanted = useMemo(() => new THREE.Color(), [])
  const base = useMemo(() => new THREE.Color('#0c0c13'), [])

  const gradient = useMemo(() => {
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    // O gradiente nunca chega ao branco: já sai limitado a pouco mais de um
    // terço da luminância, para o fundo ser uma insinuação de profundidade e
    // não uma mancha de cor por trás do conteúdo.
    const g = ctx.createRadialGradient(size / 2, size * 0.42, 0, size / 2, size * 0.42, size * 0.68)
    g.addColorStop(0, '#5c5c66')
    g.addColorStop(0.4, '#2a2a31')
    g.addColorStop(1, '#000000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  useFrame((_, dt) => {
    if (!mesh.current) return
    // 92% base, 8% destaque: o suficiente para se sentir, nunca para se notar.
    wanted.set(stage.accent).lerp(base, 0.92)
    mesh.current.material.color.lerp(wanted, Math.min(1, dt * 0.9))
  })

  return (
    <mesh ref={mesh} position={[0, 0, -30]} renderOrder={-1}>
      <planeGeometry args={[160, 100]} />
      <meshBasicMaterial
        map={gradient}
        toneMapped={false}
        // Desenha primeiro e nunca escreve profundidade: é chão, não objeto.
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Pós-processamento.
 *
 * O bloom é o que separa "uns pontos brancos" de "aquilo tem luz própria":
 * os materiais sem tone mapping passam do limiar de luminância e sangram para
 * os píxeis à volta. A aberração cromática é deliberadamente quase invisível —
 *
 * Só bloom. A aberração cromática que aqui esteve custava uma passagem de ecrã
 * inteiro por frame para um efeito que, na intensidade em que era aceitável,
 * ninguém conseguia ver — e na intensidade em que se via, tingia de magenta as
 * linhas finas junto às bordas.
 */
function Grade() {
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      {/* Limiar alto de propósito: só o que foi desenhado sem tone mapping
          — o núcleo aceso, os impulsos — passa e ganha halo. Um limiar baixo
          faria o campo de pó inteiro brilhar, e lê-se como purpurina, não luz. */}
      <Bloom
        intensity={0.75}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.35}
        mipmapBlur
        radius={0.6}
      />
    </EffectComposer>
  )
}

export default function Stage3D() {
  const mounted = useSyncExternalStore(mountedStore.subscribe, mountedStore.get, mountedStore.get)
  /**
   * Resolução adaptativa.
   *
   * O escalão detetado no arranque é um palpite a partir de núcleos e memória;
   * não sabe se a máquina tem outras vinte abas abertas ou se está a poupar
   * bateria. O `PerformanceMonitor` mede a taxa real e baixa a resolução
   * quando ela cede — a alternativa seria um site bonito que engasga.
   */
  const [resolution, setResolution] = useState(dpr)
  const [degraded, setDegraded] = useState(false)

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={resolution}
        frameloop="always"
        performance={{ min: tier === 'high' ? 0.6 : 0.4 }}
        camera={{ fov: 38, near: 0.1, far: 120, position: [0, 0, 7] }}
        gl={{
          antialias: features.antialias,
          // Tela opaca: o fundo é pintado na própria cena. Com um composer,
          // manter alfa é uma fonte constante de artefactos de mistura.
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <color attach="background" args={['#08080a']} />

        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setResolution((d) => Math.max(1, d * 0.75))}
          // Se a máquina continua a ceder, o pós-processamento é a primeira
          // coisa a cair: custa um ecrã inteiro por frame.
          onFallback={() => {
            setResolution(1)
            setDegraded(true)
          }}
        />
        <Rig />
        <Studio />
        <Backdrop />

        {/* Um Suspense por cena, não um à volta de todas.
            Partilhado, bastava uma cena suspender a descarregar a sua textura
            para as vizinhas desmontarem — e a dissolução, que existe
            precisamente para as sobrepor, dava um piscar a preto. */}
        {mounted.map((id) => {
          const Scene = SCENES[id]
          if (!Scene) return null
          return (
            <Suspense key={id} fallback={null}>
              <Scene />
            </Suspense>
          )
        })}

        {features.postFx && !degraded && <Grade />}
      </Canvas>
    </div>
  )
}
