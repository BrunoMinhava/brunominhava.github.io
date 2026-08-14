import { useLayoutEffect } from 'react'
import { gsap } from '../lib/gsap'
import { features } from '../lib/env'

const RADIUS = 90
const PULL = 0.32
/** Idade máxima das medições. A 8 leituras por segundo ninguém nota o atraso. */
const REMEASURE_MS = 120

/**
 * Magnetismo nos elementos interativos.
 *
 * Quando o ponteiro passa perto, o elemento inclina-se ligeiramente na sua
 * direção e volta ao sítio quando ele se afasta.
 *
 * O detalhe que importa é *quando* se medem as posições. A versão óbvia —
 * `getBoundingClientRect` de cada alvo a cada `pointermove` — obriga o browser
 * a recalcular o layout dezenas de vezes por segundo, e como o ScrollSmoother
 * está sempre a transformar o conteúdo, nenhuma dessas medições pode ser
 * reaproveitada. Era das maiores fontes de engasgo da página. Aqui as posições
 * são lidas em lote, no máximo oito vezes por segundo, e os eventos do rato só
 * fazem aritmética.
 */
export function useMagnetic(enabled = true) {
  useLayoutEffect(() => {
    // Sem ponteiro fino não há hover: no telemóvel isto seria peso morto.
    if (!enabled || !features.customCursor) return

    let targets = []
    let rects = []
    let lastMeasure = 0
    const movers = new WeakMap()

    const measure = () => {
      targets = [...document.querySelectorAll('[data-magnetic]')]
      // Uma única passagem de leitura, sem escritas pelo meio — assim o
      // browser resolve o layout uma vez em vez de uma por elemento.
      rects = targets.map((el) => el.getBoundingClientRect())
      for (const el of targets) {
        if (movers.has(el)) continue
        movers.set(el, {
          x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' }),
        })
      }
    }
    measure()

    const onMove = (e) => {
      const now = performance.now()
      if (now - lastMeasure > REMEASURE_MS) {
        lastMeasure = now
        measure()
      }

      for (let i = 0; i < targets.length; i++) {
        const r = rects[i]
        if (!r || !r.width) continue
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        // Raio proporcional ao tamanho: um link curto não deve puxar de longe.
        const reach = RADIUS + r.width * 0.35
        const m = movers.get(targets[i])
        if (!m) continue
        const near = dx * dx + dy * dy < reach * reach
        m.x(near ? dx * PULL : 0)
        m.y(near ? dy * PULL : 0)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      for (const el of targets) gsap.set(el, { x: 0, y: 0 })
    }
  }, [enabled])
}
