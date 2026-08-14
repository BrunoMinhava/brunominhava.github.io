import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { circleTexture, useDrift } from './helpers'
import ScreenPanel from './ScreenPanel'
import { sceneState } from '../lib/stage'
import { density } from '../lib/env'

const ACCENT = '#ffb45c'

/**
 * O caminho de um orçamento: email → parser → registo → alerta → notificação.
 *
 * Encadeado a descer, não a atravessar. Uma corrente horizontal ocupava a
 * largura toda e deixava nós pousados em cima do texto; em ziguezague vertical
 * cabe na metade direita — e um pipeline lê-se melhor de cima para baixo.
 */
const NODES = [
  [-1.15, 2.35, -0.7],
  [0.75, 1.05, 0.8],
  [-0.45, -0.25, -0.45],
  [1.35, -1.5, 0.75],
  [-0.25, -2.6, -0.8],
]

/** Ligações principais em cadeia, mais dois atalhos que dão densidade de grafo. */
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 2],
  [2, 4],
]

const PULSES_PER_EDGE = 3

/**
 * Zentrion — o fluxo.
 *
 * Nós ligados por arestas, com impulsos a viajar de um para o outro. Os
 * impulsos são um único sistema de partículas: em vez de animar objetos, cada
 * ponto guarda a aresta em que anda e uma fase, e a posição é interpolada
 * entre as duas pontas. Adicionar cem impulsos não custa mais um draw call.
 */
export default function FlowScene() {
  const group = useRef(null)
  const spin = useRef(null)
  const pulses = useRef(null)
  const nodeRefs = useRef([])

  useSceneFade('flow', group, { scaleFrom: 0.8, driftZ: -3 })
  useDrift(group, { rot: 0.3, pos: 0.45, offsetX: 2.1 })

  const sprite = useMemo(() => circleTexture(), [])
  const nodeGeo = useMemo(() => new THREE.OctahedronGeometry(0.26, 0), [])
  const coreGeo = useMemo(() => new THREE.OctahedronGeometry(0.09, 0), [])

  /* Arestas: um só buffer com todos os segmentos. */
  const edgeGeo = useMemo(() => {
    const pos = new Float32Array(EDGES.length * 6)
    EDGES.forEach(([a, b], i) => {
      pos.set(NODES[a], i * 6)
      pos.set(NODES[b], i * 6 + 3)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  /* Impulsos. */
  const { pulseGeo, riders } = useMemo(() => {
    const per = Math.max(1, Math.round(PULSES_PER_EDGE * (density > 0.5 ? 1 : 0.6)))
    const riders = []
    EDGES.forEach((_, e) => {
      for (let k = 0; k < per; k++) {
        riders.push({ edge: e, offset: k / per + Math.random() * 0.06, speed: 0.16 + Math.random() * 0.12 })
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(riders.length * 3), 3))
    return { pulseGeo: g, riders }
  }, [])

  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    if (!group.current?.visible) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('flow')

    if (spin.current) {
      spin.current.rotation.y = -0.5 + p * 1.0
      spin.current.rotation.x = Math.sin(t * 0.3) * 0.05
    }

    // Cada nó pulsa no seu tempo — a cadeia parece estar viva, não desenhada.
    nodeRefs.current.forEach((m, i) => {
      if (!m) return
      const s = 1 + Math.sin(t * 1.6 + i * 1.1) * 0.12
      m.scale.setScalar(s)
      m.rotation.y = t * 0.4 + i
      m.rotation.z = t * 0.22
    })

    if (pulses.current) {
      const arr = pulses.current.geometry.attributes.position.array
      for (let i = 0; i < riders.length; i++) {
        const r = riders[i]
        const [ai, bi] = EDGES[r.edge]
        a.fromArray(NODES[ai])
        b.fromArray(NODES[bi])
        // O fluxo acelera à medida que se percorre a secção.
        const u = (t * r.speed * (0.6 + p * 1.4) + r.offset) % 1
        arr[i * 3] = a.x + (b.x - a.x) * u
        arr[i * 3 + 1] = a.y + (b.y - a.y) * u
        arr[i * 3 + 2] = a.z + (b.z - a.z) * u
      }
      pulses.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <ScreenPanel src="/shots/zentrion.webp" sceneId="flow" accent={ACCENT} />

      {/* A assinatura abstrata recua para trás do painel: continua a ler-se
          à volta dos bordos, sem competir com a captura. */}
      <group ref={spin} scale={1.35} position={[0, 0, -3.4]}>
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial color={ACCENT} transparent opacity={0.22} />
        </lineSegments>

        {NODES.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh ref={(el) => (nodeRefs.current[i] = el)} geometry={nodeGeo}>
              <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.45} />
            </mesh>
            <mesh geometry={coreGeo}>
              {/* Básico e sem tone mapping: é o que passa o limiar do bloom
                  e vira um ponto de luz. Com material físico apanhava o mapa
                  de ambiente e lia-se como um losango chapado. */}
              <meshBasicMaterial color="#ffe0b0" toneMapped={false} transparent />
            </mesh>
          </group>
        ))}

        <points ref={pulses} geometry={pulseGeo} frustumCulled={false}>
          <pointsMaterial
            size={0.13}
            map={sprite}
            color="#ffe0b0"
            transparent
            opacity={0.95}
            depthWrite={false}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  )
}
