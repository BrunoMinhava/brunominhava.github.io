import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { useDrift } from './helpers'
import ScreenPanel from './ScreenPanel'
import { sceneState } from '../lib/stage'
import { density } from '../lib/env'

const ACCENT = new THREE.Color('#ffb45c')
const ACCENT_HEX = '#ffb45c'
const IDLE = new THREE.Color('#2a2a34')

/**
 * Tercavia — o armazém a ser lido.
 *
 * Uma matriz de caixas e um plano de leitura que a atravessa. As caixas
 * acendem quando o feixe passa e vão arrefecendo depois, deixando um rasto —
 * é a leitura de códigos de barras vista de cima.
 *
 * As caixas todas são uma `InstancedMesh`: 140 volumes, um draw call. A cor de
 * cada uma vive num atributo por instância, por isso acender uma caixa é
 * escrever três floats, não trocar de material.
 */
export default function WarehouseScene() {
  const group = useRef(null)
  const rack = useRef(null)
  const boxes = useRef(null)
  const beam = useRef(null)

  useSceneFade('warehouse', group, { scaleFrom: 0.78, driftZ: -3.5 })
  useDrift(group, { rot: 0.2, pos: 0.4, offsetX: 2.1 })

  const { cols, rows, layers, count, cells } = useMemo(() => {
    const cols = density > 0.5 ? 9 : 6
    const rows = 4
    const layers = density > 0.5 ? 4 : 2
    const cells = []
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        for (let z = 0; z < layers; z++) {
          cells.push([
            (x - (cols - 1) / 2) * 1.0,
            (y - (rows - 1) / 2) * 0.85,
            (z - (layers - 1) / 2) * 1.15,
          ])
        }
      }
    }
    return { cols, rows, layers, count: cells.length, cells }
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])
  // Calor de cada caixa: 1 = acabou de ser lida, 0 = fria.
  const heat = useMemo(() => new Float32Array(count), [count])

  useLayoutEffect(() => {
    if (!boxes.current) return
    cells.forEach((c, i) => {
      dummy.position.set(c[0], c[1], c[2])
      // Alturas ligeiramente diferentes: paletes reais nunca são iguais.
      dummy.scale.set(0.78, 0.55 + ((i * 37) % 11) / 30, 0.78)
      dummy.updateMatrix()
      boxes.current.setMatrixAt(i, dummy.matrix)
      boxes.current.setColorAt(i, IDLE)
    })
    boxes.current.instanceMatrix.needsUpdate = true
    if (boxes.current.instanceColor) boxes.current.instanceColor.needsUpdate = true
  }, [cells, dummy])

  const halfWidth = (cols - 1) / 2 + 1

  useFrame((state, dt) => {
    if (!group.current?.visible || !boxes.current) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('warehouse')

    // O feixe faz duas passagens ao longo da secção, com um vaivém contínuo.
    const sweep = Math.sin(t * 0.55 + p * Math.PI * 2) * halfWidth

    if (beam.current) {
      beam.current.position.x = sweep
      beam.current.material.opacity = 0.22 + Math.sin(t * 6) * 0.06
    }

    if (rack.current) {
      rack.current.rotation.y = -0.55 + p * 0.85
      rack.current.rotation.x = 0.12 + Math.sin(t * 0.25) * 0.04
    }

    let dirty = false
    for (let i = 0; i < count; i++) {
      const inBeam = Math.abs(cells[i][0] - sweep) < 0.5
      let changed = false

      if (inBeam) {
        heat[i] = 1
        changed = true
      } else if (heat[i] > 0.001) {
        heat[i] = Math.max(0, heat[i] - dt * 0.75)
        changed = true
      }

      // Só se reescreve a cor das caixas que mudaram — as frias não custam nada.
      if (changed) {
        tint.copy(IDLE).lerp(ACCENT, heat[i])
        boxes.current.setColorAt(i, tint)
        dirty = true
      }
    }
    if (dirty && boxes.current.instanceColor) boxes.current.instanceColor.needsUpdate = true
  })

  return (
    <group ref={group}>
      <ScreenPanel src="/shots/tercavia.webp" sceneId="warehouse" accent={ACCENT_HEX} />

      {/* Estante atrás do painel, à escala que a deixa assomar nos bordos. */}
      <group ref={rack} scale={0.78} position={[0, 0, -4.4]}>
        <instancedMesh ref={boxes} args={[undefined, undefined, count]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            metalness={0.35}
            roughness={0.55}
            transparent
            toneMapped={false}
          />
        </instancedMesh>

        {/* Estrutura da estante: linhas horizontais por prateleira. */}
        <Shelves cols={cols} rows={rows} layers={layers} />

        {/* Plano de leitura. */}
        <mesh ref={beam} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[layers * 1.6, rows * 1.4]} />
          <meshBasicMaterial
            color="#ffd9a0"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  )
}

/** Contornos das prateleiras — desenhados como um único conjunto de segmentos. */
function Shelves({ cols, rows, layers }) {
  const geo = useMemo(() => {
    const pts = []
    const halfX = ((cols - 1) / 2) * 1.0 + 0.6
    const halfZ = ((layers - 1) / 2) * 1.15 + 0.5
    for (let y = 0; y < rows; y++) {
      const y0 = (y - (rows - 1) / 2) * 0.85 - 0.42
      for (const z of [-halfZ, halfZ]) {
        pts.push(-halfX, y0, z, halfX, y0, z)
      }
      pts.push(-halfX, y0, -halfZ, -halfX, y0, halfZ)
      pts.push(halfX, y0, -halfZ, halfX, y0, halfZ)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
    return g
  }, [cols, rows, layers])

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#ffb45c" transparent opacity={0.2} />
    </lineSegments>
  )
}
