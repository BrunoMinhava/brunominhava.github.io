import { useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { requestScene, sceneState, dissolve, setFocus } from '../lib/stage'
import { setCursor } from '../lib/cursor'
import { features, isSafari, prefersReducedMotion } from '../lib/env'

/**
 * Transforma uma secção num "momento" da viagem.
 *
 * Cria quatro gatilhos de scroll com âmbitos deliberadamente diferentes:
 *
 *  1. **carregar** — o mais largo (uma vez e meia o ecrã antes e depois).
 *     Monta e desmonta a cena 3D, para que o three.js só trabalhe perto do sítio.
 *  2. **dissolver** — do momento em que a secção assoma até desaparecer.
 *     Como secções consecutivas partilham este intervalo, há sempre um troço
 *     em que duas cenas coexistem: é daí que vem a transição sem corte.
 *  3. **fixar** — prende o conteúdo durante a travessia e move as camadas
 *     internas a velocidades diferentes (incluindo negativas).
 *  4. **focar** — a meio do ecrã, troca o cursor, o ato e a cor de destaque.
 */
export function useMoment({
  rootRef,
  pinRef,
  contentRef,
  scene,
  cursor = 'read',
  act = null,
  index = '00',
  title = '',
  accent = '#ede9e0',
  fadeIn = 0.26,
  fadeOut = 0.26,
  pin = true,
  // Secções de fundo claro pedem que o cromo da página inverta as cores.
  invert = false,
  /**
   * De onde arranca o parallax, em múltiplos do alcance.
   *
   * 1 = a camada começa deslocada para baixo e acaba deslocada para cima, que
   * é o correto para secções que se atravessam. A abertura usa 0: já está no
   * ecrã quando a página carrega, e pré-deslocá-la esconderia metade do herói
   * antes de o visitante mexer no rato.
   */
  parallaxFrom = 1,
}) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      /* 1 — carregamento preguiçoso da cena ------------------------- */
      if (scene) {
        const loader = ScrollTrigger.create({
          trigger: root,
          start: 'top bottom+=150%',
          end: 'bottom top-=150%',
          onToggle: (self) => requestScene(scene, self.isActive),
        })
        // Se a secção já está à vista no arranque, o onToggle não chega a
        // disparar — a cena tem de ser pedida à mão.
        requestScene(scene, loader.isActive)
      }

      /* 2 — dissolução da cena 3D ---------------------------------- */
      if (scene) {
        const s = sceneState(scene)
        const apply = (p) => {
          s.p = p
          s.opacity = dissolve(p, fadeIn, fadeOut)
        }
        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => apply(self.progress),
          onLeave: () => (s.opacity = 0),
          onLeaveBack: () => (s.opacity = 0),
        })
        if (st.isActive) apply(st.progress)
      }

      /* 3 — fixação e parallax interno ----------------------------- */
      const pinEl = pinRef?.current
      if (pin && pinEl) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            pin: pinEl,
            // A altura já está reservada pelo `root`; não acrescentar mais.
            pinSpacing: false,
            anticipatePin: isSafari ? 0 : 1,
            invalidateOnRefresh: true,
          },
        })

        // Cada camada declara a sua própria velocidade. Valores acima de 1
        // ultrapassam o scroll; valores negativos sobem enquanto se desce.
        const layers = pinEl.querySelectorAll('[data-par]')
        layers.forEach((el) => {
          const speed = parseFloat(el.dataset.par) * features.parallaxStrength
          const reach = () => window.innerHeight * 0.55 * speed
          tl.fromTo(
            el,
            { y: () => reach() * parallaxFrom },
            { y: () => -reach(), ease: 'none', duration: 1 },
            0,
          )
        })

        // Camadas que também derivam na horizontal.
        pinEl.querySelectorAll('[data-par-x]').forEach((el) => {
          const speed = parseFloat(el.dataset.parX) * features.parallaxStrength
          const reach = () => window.innerWidth * 0.3 * speed
          tl.fromTo(
            el,
            { x: () => reach() * parallaxFrom },
            { x: () => -reach(), ease: 'none', duration: 1 },
            0,
          )
        })

      }

      /* 3b — o conteúdo dissolve na mesma curva que a cena 3D -------
       *
       * Deliberadamente fora da timeline de fixação: assim o texto já está a
       * ganhar presença enquanto a secção sobe para o ecrã, e atinge opacidade
       * total no instante exato em que fica fixa. Ligá-lo ao pin faria o texto
       * aparecer só depois de já estar parado, que é o efeito contrário.
       */
      const content = contentRef?.current
      if (content && !prefersReducedMotion) {
        const blur = features.heavyBlur
        const paint = (p) => {
          const o = dissolve(p, fadeIn, fadeOut)
          content.style.opacity = o
          if (blur) content.style.filter = o > 0.995 ? 'none' : `blur(${(1 - o) * 12}px)`
        }
        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => paint(self.progress),
        })
        if (st.isActive) paint(st.progress)
      } else if (content) {
        content.style.opacity = 1
      }

      /* 4 — foco: cursor, ato e cor -------------------------------- */
      ScrollTrigger.create({
        trigger: root,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (!self.isActive) return
          setCursor(cursor, accent)
          setFocus({ act, index, title, accent, invert })
          document.documentElement.style.setProperty('--accent', accent)
          // A vinheta escura por cima de um fundo claro leria como sujidade
          // nos cantos; o CSS alivia-a a partir deste sinalizador.
          document.documentElement.dataset.invert = invert ? 'true' : 'false'
        },
      })
    }, root)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, cursor, act, index, title, accent, pin, invert])
}
