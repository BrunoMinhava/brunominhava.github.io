import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture, Float } from '@react-three/drei'
import { circleTexture } from './helpers'
import { sceneState } from '../lib/stage'

const WIDTH = 4.5

/**
 * Painel a flutuar com uma captura real do projeto.
 *
 * O mesmo objeto para os quatro momentos, para que a linguagem seja a mesma em
 * toda a viagem: a peça de software aparece sempre da mesma maneira e o que
 * muda é o que está no ecrã.
 *
 * O material é básico e não físico — um ecrã emite luz, não a recebe — e sem
 * tone mapping, para as cores da captura chegarem como são em vez de passarem
 * pela curva filmica do resto da cena.
 */
export default function ScreenPanel({ src, sceneId, accent = '#ffffff', tilt = 0.42 }) {
  const panel = useRef(null)
  const texture = useTexture(src)
  const sprite = useMemo(() => circleTexture(), [])

  const { size, bezel, edges } = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const img = texture.image
    const aspect = img && img.height ? img.width / img.height : 1.6
    const h = WIDTH / aspect
    const bezel = [WIDTH + 0.14, h + 0.14, 0.09]
    return {
      size: [WIDTH, h],
      bezel,
      edges: new THREE.EdgesGeometry(new THREE.BoxGeometry(...bezel)),
    }
  }, [texture])

  useFrame((state) => {
    if (!panel.current) return
    const { p } = sceneState(sceneId)
    const t = state.clock.elapsedTime
    // Uma volta lenta ao longo da secção: o painel apresenta-se de esguelha,
    // roda para quase de frente a meio, e volta a fugir.
    panel.current.rotation.y = -tilt + p * tilt * 2
    panel.current.rotation.z = Math.sin(t * 0.25) * 0.012
  })

  return (
    <>
      {/* Retroiluminação difusa: descola o painel do fundo sem uma sombra. */}
      <sprite position={[0, 0, -1.6]} scale={[11, 7.5, 1]}>
        <spriteMaterial
          map={sprite}
          color={accent}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <Float speed={1.2} rotationIntensity={0.16} floatIntensity={0.4} floatingRange={[-0.08, 0.08]}>
        <group ref={panel}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={bezel} />
            <meshStandardMaterial color="#0c0c11" metalness={0.9} roughness={0.28} transparent />
          </mesh>

          <mesh>
            <planeGeometry args={size} />
            <meshBasicMaterial map={texture} toneMapped={false} transparent />
          </mesh>

          <lineSegments geometry={edges}>
            <lineBasicMaterial color={accent} transparent opacity={0.4} />
          </lineSegments>
        </group>
      </Float>
    </>
  )
}
