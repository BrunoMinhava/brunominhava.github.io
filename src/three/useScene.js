import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { sceneState } from '../lib/stage'

/**
 * Liga um grupo 3D à sua secção de scroll.
 *
 * Faz três coisas por frame: aplica a opacidade da dissolução a todos os
 * materiais do grupo, afasta-o ligeiramente enquanto entra/sai (para a
 * transição ter profundidade e não ser só um fade), e desliga-o por completo
 * quando fica invisível — assim uma cena fora do ecrã não custa nada a
 * desenhar, mesmo estando montada.
 *
 * Devolve o registo da cena para quem quiser ler o progresso bruto.
 */
export function useSceneFade(
  id,
  groupRef,
  { scaleFrom = 0.9, driftZ = -2.2, driftY = 0 } = {},
) {
  const materials = useRef(null)

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const { opacity } = sceneState(id)

    if (opacity < 0.004) {
      if (g.visible) g.visible = false
      return
    }
    g.visible = true

    // Recolha única dos materiais; a partir daqui é só escrever opacidade.
    if (!materials.current) {
      const found = []
      g.traverse((child) => {
        if (!child.material) return
        const list = Array.isArray(child.material) ? child.material : [child.material]
        for (const m of list) {
          m.transparent = true
          m.userData.baseOpacity ??= m.opacity
          found.push(m)
        }
      })
      materials.current = found
    }

    for (const m of materials.current) m.opacity = m.userData.baseOpacity * opacity

    const k = 1 - opacity
    g.scale.setScalar(scaleFrom + (1 - scaleFrom) * opacity)
    g.position.z = driftZ * k
    g.position.y = driftY * k
  })

  return sceneState(id)
}
