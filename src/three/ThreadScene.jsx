import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { useDrift } from './helpers'
import { density } from '../lib/env'
import { sceneState, stage } from '../lib/stage'
import { ACTS } from '../data/projects'

const BANDS = [ACTS.web.accent, '#ede9e0', ACTS.automation.accent, ACTS.ai.accent]

const SAMPLES = 44

/**
 * O fio da secção "sobre".
 *
 * Fios a ondular, agrupados em quatro bandas de cor — as mesmas quatro cores
 * das quatro palavras que definem o trabalho. A meio da secção convergem
 * quase todos para a mesma altura e depois voltam a abrir: quatro disciplinas
 * a tornarem-se uma linha, que é literalmente o que a secção diz.
 *
 * Tudo isto é um único `lineSegments` — um draw call para o campo inteiro.
 */
export default function ThreadScene() {
  const group = useRef(null)
  const lines = useRef(null)

  useSceneFade('thread', group, { scaleFrom: 0.85, driftZ: -2 })
  useDrift(group, { rot: 0.16, pos: 0.4 })

  const count = Math.max(10, Math.round(30 * density))

  const { geometry, seeds } = useMemo(() => {
    const segs = SAMPLES - 1
    const verts = count * segs * 2
    const position = new Float32Array(verts * 3)
    const colorAttr = new Float32Array(verts * 3)
    const seeds = []

    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const band = Math.floor((i / count) * BANDS.length)
      c.set(BANDS[band])
      seeds.push({
        y: ((i / (count - 1)) - 0.5) * 6.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.5,
        amp: 0.18 + Math.random() * 0.45,
        depth: (Math.random() - 0.5) * 3,
      })
      // A cor é por vértice, mas constante ao longo de cada fio.
      for (let s = 0; s < segs * 2; s++) {
        const o = (i * segs * 2 + s) * 3
        colorAttr[o] = c.r
        colorAttr[o + 1] = c.g
        colorAttr[o + 2] = c.b
      }
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(position, 3))
    g.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3))
    return { geometry: g, seeds }
  }, [count])

  useFrame((state) => {
    if (!group.current?.visible || !lines.current) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('thread')

    // 0 nas pontas, 1 a meio: é a força com que os fios se juntam.
    const converge = 1 - Math.abs(p - 0.5) * 2
    const spread = 1 - converge * 0.82

    const attr = lines.current.geometry.attributes.position
    const arr = attr.array
    const segs = SAMPLES - 1
    const width = 13
    const pull = stage.smooth.y * 0.6

    let o = 0
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]
      let px = 0
      let py = 0
      let pz = 0
      for (let k = 0; k < SAMPLES; k++) {
        const u = k / segs
        const x = (u - 0.5) * width
        const wave = Math.sin(x * 0.55 + t * s.speed + s.phase)
        const y = s.y * spread + wave * s.amp + pull * (1 - Math.abs(u - 0.5) * 2) * 0.5
        const z = Math.cos(x * 0.3 + s.phase) * s.depth * spread

        if (k > 0) {
          arr[o++] = px
          arr[o++] = py
          arr[o++] = pz
          arr[o++] = x
          arr[o++] = y
          arr[o++] = z
        }
        px = x
        py = y
        pz = z
      }
    }
    attr.needsUpdate = true
  })

  return (
    <group ref={group}>
      {/* Os vértices mudam a cada frame; recalcular a esfera de recorte todos
          os frames custaria mais do que desenhar sempre. */}
      <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
