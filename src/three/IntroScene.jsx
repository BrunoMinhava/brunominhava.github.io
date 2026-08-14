import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSceneFade } from './useScene'
import { noise3, circleTexture, useDrift } from './helpers'
import { density, isMobile } from '../lib/env'
import { sceneState, stage } from '../lib/stage'

/**
 * Objeto de abertura.
 *
 * Três versões do mesmo sólido, uma dentro da outra e a rodar a velocidades
 * diferentes: um núcleo escuro facetado, uma casca em arame que respira, e uma
 * nuvem dos seus vértices por fora. O conjunto lê-se como um só objeto que não
 * se consegue fixar — que é o ponto.
 *
 * Por trás fica um campo de pó, que dá profundidade ao fundo sem exigir nada
 * do GPU além de um draw call.
 */
export default function IntroScene() {
  const group = useRef(null)
  const spin = useRef(null)
  const cage = useRef(null)
  const halo = useRef(null)
  const dust = useRef(null)

  useSceneFade('intro', group, { scaleFrom: 0.65, driftZ: -3 })
  useDrift(group, { rot: 0.34, pos: 0.45, offsetX: 1.95 })

  const detail = density > 0.8 ? 3 : density > 0.4 ? 2 : 1

  // Esfera lisa para o vidro: a refração precisa de normais contínuas, e num
  // sólido facetado cada face partiria a imagem em pedaços chapados.
  const glassGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 6), [])
  const cageGeo = useMemo(() => new THREE.IcosahedronGeometry(1.74, detail), [detail])
  const haloGeo = useMemo(() => new THREE.IcosahedronGeometry(2.35, detail + 1), [detail])

  // Cópia intocada das posições da gaiola — a deformação é sempre calculada a
  // partir daqui, senão o ruído acumula e o objeto derrete.
  const base = useMemo(() => cageGeo.attributes.position.array.slice(0), [cageGeo])

  const dustGeo = useMemo(() => {
    const n = Math.round(1400 * density)
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      // Distribuição em casca esférica: nada de pó no meio, onde está o objeto.
      // Distribuição em caixa, não em esfera.
      //
      // Qualquer casca ou esfera com raio mínimo projeta a silhueta do seu
      // próprio vazio: aparecia um arco nítido a atravessar o ecrã, que se
      // lia como um rasto de cometa. Uma caixa não tem contorno para revelar.
      pos[i * 3] = (Math.random() - 0.5) * 46
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = -6 - Math.random() * 30
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const sprite = useMemo(() => circleTexture(), [])

  useFrame((state, dt) => {
    if (!group.current?.visible) return
    const t = state.clock.elapsedTime
    const { p } = sceneState('intro')
    const vel = THREE.MathUtils.clamp(stage.velocity, -3, 3)

    if (spin.current) {
      // A rotação acelera com o scroll: parada, a peça respira; a descer, gira.
      spin.current.rotation.y += dt * (0.12 + Math.abs(vel) * 0.25)
      spin.current.rotation.x += dt * 0.045
    }


    if (cage.current) {
      const attr = cage.current.geometry.attributes.position
      const arr = attr.array
      // Amplitude cresce com o scroll — o objeto desfaz-se à medida que se sai.
      const amp = 0.055 + p * 0.16 + Math.abs(vel) * 0.03
      for (let i = 0; i < arr.length; i += 3) {
        const x = base[i]
        const y = base[i + 1]
        const z = base[i + 2]
        const d = 1 + noise3(x, y, z, t * 0.6) * amp
        arr[i] = x * d
        arr[i + 1] = y * d
        arr[i + 2] = z * d
      }
      attr.needsUpdate = true
      cage.current.rotation.z -= dt * 0.08
    }

    if (halo.current) {
      halo.current.rotation.y -= dt * 0.06
      halo.current.scale.setScalar(1 + p * 0.5)
    }

    if (dust.current) {
      dust.current.rotation.y += dt * 0.012
      dust.current.position.z = p * 6
    }
  })

  return (
    <group ref={group}>
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial
          size={0.042}
          map={sprite}
          color="#8fa4c4"
          transparent
          opacity={0.3}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Num ecrã estreito não há metade direita para onde o empurrar,
          por isso encolhe em vez de tapar o texto. */}
      <group ref={spin} scale={isMobile ? 0.52 : 0.78}>

        {/* Esfera polida opaca.
            Aqui houve vidro com refração. Custava uma passagem extra de render
            por frame — o three redesenha a cena inteira para um render target
            para poder refratá-la — e o que se via era, honestamente, uma
            esfera escura com um realce. Metal iridescente devolve o mesmo
            realce a partir do mesmo estúdio, por um render só. */}
        <mesh geometry={glassGeo}>
          <meshPhysicalMaterial
            metalness={1}
            roughness={0.3}
            // Contido, e na banda de espessura que devolve azul em vez de
            // verde: a paleta do site é osso, ciano, âmbar e violeta, e um
            // brilho verde seria a única cor sem sítio no sistema.
            iridescence={0.28}
            iridescenceIOR={1.28}
            iridescenceThicknessRange={[180, 420]}
            envMapIntensity={1.7}
            color="#20242e"
            transparent
          />
        </mesh>

        <mesh ref={cage} geometry={cageGeo} frustumCulled={false}>
          <meshBasicMaterial color="#ede9e0" wireframe transparent opacity={0.15} />
        </mesh>

        <points ref={halo} geometry={haloGeo}>
          <pointsMaterial
            size={0.03}
            map={sprite}
            color="#ede9e0"
            transparent
            opacity={0.4}
            depthWrite={false}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  )
}
