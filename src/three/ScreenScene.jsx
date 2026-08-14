import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { useDrift } from './helpers'
import ScreenPanel from './ScreenPanel'
import { sceneState } from '../lib/stage'
import { density } from '../lib/env'

const ACCENT = '#3fd0ff'

/**
 * Wonderstatus — o site verdadeiro, a flutuar.
 *
 * A captura é do wonderstatus.pt em produção, não de uma maqueta: quem chega
 * aqui quer ver a coisa a funcionar, e um desenho aproximado seria sempre
 * menos convincente do que a página real.
 *
 * À volta ficam fragmentos de interface a profundidades diferentes, que se
 * movem a ritmos distintos do painel — o parallax também acontece dentro do
 * 3D, não só no DOM.
 */
export default function ScreenScene() {
  const group = useRef(null)
  const shards = useRef([])

  useSceneFade('screen', group, { scaleFrom: 0.85, driftZ: -3.5 })
  useDrift(group, { rot: 0.2, pos: 0.45, offsetX: 2.1 })

  const fragments = useMemo(() => {
    const n = density > 0.5 ? 5 : 3
    return Array.from({ length: n }, (_, i) => ({
      pos: [i % 2 === 0 ? -3.5 - i * 0.35 : 3.4 + i * 0.3, 1.6 - i * 0.85, -2.2 - i * 0.9],
      size: [1.5 - i * 0.13, 0.34],
      speed: 0.25 + i * 0.14,
      phase: i * 1.4,
    }))
  }, [])

  useFrame((state) => {
    if (!group.current?.visible) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('screen')

    shards.current.forEach((m, i) => {
      if (!m) return
      const f = fragments[i]
      m.position.y = f.pos[1] + Math.sin(t * f.speed + f.phase) * 0.28
      // Cada fragmento atravessa a cena a uma velocidade própria.
      m.position.x = f.pos[0] + p * (i % 2 === 0 ? 1.8 : -1.8)
      m.rotation.y = -0.42 + p * 0.9 + f.phase * 0.05
    })
  })

  return (
    <group ref={group}>
      <ScreenPanel src="/shots/wonderstatus.webp" sceneId="screen" accent={ACCENT} />

      {fragments.map((f, i) => (
        <mesh key={i} ref={(el) => (shards.current[i] = el)} position={f.pos}>
          <planeGeometry args={f.size} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
