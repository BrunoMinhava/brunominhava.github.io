import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { isSafari, prefersReducedMotion } from './env'

gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

// Sem lag smoothing: numa página com WebGL, um frame pesado não deve fazer o
// scroll "saltar" para recuperar o tempo perdido.
gsap.ticker.lagSmoothing(0)

gsap.defaults({ ease: 'power3.out', duration: 1 })

// O Safari reporta alturas de viewport instáveis quando a barra de endereço
// aparece/desaparece; ignorar o resize apenas em altura evita recálculos em cascata.
ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
})

if (prefersReducedMotion) {
  // Anima na mesma, mas instantaneamente: o layout final fica correto sem movimento.
  gsap.globalTimeline.timeScale(1000)
}

export { gsap, ScrollTrigger, ScrollSmoother, isSafari }
