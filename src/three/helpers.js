import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { stage } from '../lib/stage'
import { isMobile } from '../lib/env'

/**
 * Ruído barato baseado em senos.
 *
 * Não é simplex — é periódico e nota-se se olhar de perto. Mas custa três
 * senos por amostra em vez de uma tabela de permutações, e para deformar uma
 * casca de icosaedro a olho nu ninguém distingue.
 */
export function noise3(x, y, z, t = 0) {
  return (
    Math.sin(x * 1.7 + t) * 0.5 +
    Math.sin(y * 2.3 - t * 0.7) * 0.3 +
    Math.sin(z * 1.9 + t * 1.3) * 0.2
  )
}

let circle = null
/** Textura de ponto redondo com bordo suave, partilhada por todas as cenas. */
export function circleTexture() {
  if (circle) return circle
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  circle = new THREE.CanvasTexture(c)
  circle.colorSpace = THREE.SRGBColorSpace
  return circle
}

/**
 * Faz um grupo inclinar-se na direção do rato, com amortecimento.
 *
 * Lê `stage.smooth`, que já vem suavizado do Rig — assim todas as cenas
 * reagem exatamente ao mesmo ponteiro e não há duas suavizações diferentes.
 */
export function useDrift(ref, { rot = 0.28, pos = 0.35, ease = 2.2, offsetX = 0 } = {}) {
  useFrame((_, dt) => {
    const g = ref.current
    if (!g || !g.visible) return
    const k = Math.min(1, dt * ease)
    g.rotation.y += (stage.smooth.x * rot - g.rotation.y) * k
    g.rotation.x += (stage.smooth.y * rot * 0.6 - g.rotation.x) * k
    // `offsetX` afasta a cena do centro para o texto respirar ao lado dela.
    // Em ecrãs estreitos não há "ao lado": o objeto fica centrado.
    const shift = isMobile ? 0 : offsetX
    g.position.x += (shift + stage.smooth.x * pos - g.position.x) * k
  })
}
