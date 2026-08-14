import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { circleTexture, noise3, useDrift } from './helpers'
import ScreenPanel from './ScreenPanel'
import { sceneState, stage } from '../lib/stage'
import { density } from '../lib/env'

const ACCENT = new THREE.Color('#b98cff')
const HOT = new THREE.Color('#e8dcff')
const ACCENT_HEX = '#b98cff'

/**
 * NeuroVision — o campo de pontos.
 *
 * Uma nuvem em forma de cérebro: elipsóide amassado por ruído para sugerir
 * circunvoluções, fendido ao meio para separar os hemisférios e com um lóbulo
 * mais denso em baixo a fazer de cerebelo. Nenhum modelo carregado — a forma é
 * gerada, o que significa zero bytes de rede e resolução ajustável ao aparelho.
 *
 * Por cima corre uma onda de disparo: as ligações acendem por bandas, como
 * atividade a propagar-se, escritas no atributo de cor em vez de em materiais.
 */
export default function BrainScene() {
  const group = useRef(null)
  const spin = useRef(null)
  const cloud = useRef(null)
  const synapses = useRef(null)

  useSceneFade('brain', group, { scaleFrom: 0.75, driftZ: -3 })
  useDrift(group, { rot: 0.32, pos: 0.45, offsetX: 2.1 })

  const sprite = useMemo(() => circleTexture(), [])

  const { pointsGeo, synapseGeo, pairs } = useMemo(() => {
    const n = Math.round(7000 * density)
    const positions = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    const c = new THREE.Color()

    for (let i = 0; i < n; i++) {
      // Amostragem em casca esférica, depois esticada e amassada.
      const u = Math.random()
      const v = Math.random()
      const theta = u * Math.PI * 2
      const phi = Math.acos(2 * v - 1)
      const r = 1 - Math.random() * 0.22

      let x = r * Math.sin(phi) * Math.cos(theta) * 1.85
      let y = r * Math.sin(phi) * Math.sin(theta) * 1.35
      let z = r * Math.cos(phi) * 1.5

      // Circunvoluções.
      const fold = 1 + noise3(x * 2.4, y * 2.4, z * 2.4) * 0.12
      x *= fold
      y *= fold
      z *= fold

      // Fenda inter-hemisférica: empurra tudo para longe do plano x = 0.
      x += Math.sign(x || 1) * 0.14

      // Cerebelo: um terço dos pontos de baixo-trás desce e adensa-se.
      if (y < -0.5 && z < 0 && Math.random() < 0.35) {
        y = y * 0.7 - 0.75
        z = z * 0.55 - 0.5
        x *= 0.62
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      c.copy(ACCENT).lerp(HOT, Math.random() * 0.35)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const pointsGeo = new THREE.BufferGeometry()
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    /* Sinapses: pares de pontos próximos, escolhidos uma vez. */
    const linkCount = Math.round(320 * density)
    const pairs = []
    const linkPos = new Float32Array(linkCount * 6)
    const tmp = new THREE.Vector3()
    const other = new THREE.Vector3()

    for (let k = 0; k < linkCount; k++) {
      const a = Math.floor(Math.random() * n)
      tmp.fromArray(positions, a * 3)
      // Procura um vizinho aceitável em poucas tentativas; não precisa de ser
      // o mais próximo, só perto o suficiente para a ligação parecer local.
      let b = a
      for (let attempt = 0; attempt < 12; attempt++) {
        const cand = Math.floor(Math.random() * n)
        other.fromArray(positions, cand * 3)
        if (tmp.distanceToSquared(other) < 0.16) {
          b = cand
          break
        }
      }
      linkPos.set([tmp.x, tmp.y, tmp.z], k * 6)
      other.fromArray(positions, b * 3)
      linkPos.set([other.x, other.y, other.z], k * 6 + 3)
      pairs.push(tmp.y)
    }

    const synapseGeo = new THREE.BufferGeometry()
    synapseGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3))
    synapseGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(linkCount * 6), 3))

    return { pointsGeo, synapseGeo, pairs }
  }, [])

  useFrame((state) => {
    if (!group.current?.visible) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('brain')

    if (spin.current) {
      spin.current.rotation.y = -0.6 + p * 1.5 + t * 0.05
      spin.current.rotation.x = Math.sin(t * 0.22) * 0.08
      spin.current.scale.setScalar(1.5 + p * 0.3)
    }

    if (cloud.current) {
      // O tamanho do ponto respira com a velocidade do scroll.
      const s = 0.03 + Math.min(0.022, Math.abs(stage.velocity) * 0.008)
      cloud.current.material.size = s
    }

    /* Onda de disparo: uma banda em altura que percorre o cérebro. */
    if (synapses.current) {
      const attr = synapses.current.geometry.attributes.color
      const arr = attr.array
      const waveY = Math.sin(t * 0.8) * 2.2
      for (let k = 0; k < pairs.length; k++) {
        const d = Math.abs(pairs[k] - waveY)
        const fire = Math.max(0, 1 - d / 0.7)
        const i = fire * 0.9 + 0.08
        const o = k * 6
        // Ambas as pontas do segmento acendem juntas.
        arr[o] = arr[o + 3] = ACCENT.r * i + HOT.r * fire * 0.5
        arr[o + 1] = arr[o + 4] = ACCENT.g * i + HOT.g * fire * 0.5
        arr[o + 2] = arr[o + 5] = ACCENT.b * i + HOT.b * fire * 0.5
      }
      attr.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <ScreenPanel src="/shots/neurovision.webp" sceneId="brain" accent={ACCENT_HEX} />

      {/* A nuvem de pontos fica atrás do painel — o cérebro real está no ecrã,
          este é o eco dele. */}
      <group ref={spin} position={[0, 0, -3.8]}>
        <points ref={cloud} geometry={pointsGeo}>
          <pointsMaterial
            size={0.03}
            map={sprite}
            vertexColors
            transparent
            opacity={0.5}
            depthWrite={false}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>

        <lineSegments ref={synapses} geometry={synapseGeo}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.28}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>
    </group>
  )
}
