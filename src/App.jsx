import { Fragment, Suspense, lazy, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, ScrollSmoother } from './lib/gsap'
import { features, isSafari, isMobile, use3D } from './lib/env'
import { stage } from './lib/stage'
import { useMagnetic } from './hooks/useMagnetic'
import { ACTS, ACT_ORDER, projectsOfAct } from './data/projects'

import Cursor from './components/Cursor'
import Preloader from './components/Preloader'
import Grain from './components/Grain'
import HUD from './components/HUD'
import Moment from './components/Moment'
import ActMarker from './components/ActMarker'
import Intro from './sections/Intro'
import About from './sections/About'
import Contact from './sections/Contact'

// O three.js só entra na página se houver WebGL e vontade de movimento.
const Stage3D = lazy(() => import('./components/Stage3D'))

export default function App() {
  const wrapper = useRef(null)
  const content = useRef(null)
  /**
   * As secções só são montadas depois de o ScrollSmoother existir.
   *
   * Em React os efeitos dos filhos correm antes dos do pai, por isso sem esta
   * espera cada secção registaria o seu `pin` num mundo ainda sem smoother — e
   * o ScrollTrigger escolheria o tipo de fixação errado. Um render extra dentro
   * do mesmo layout effect não chega a ser pintado.
   */
  const [ready, setReady] = useState(!features.smoothScroll)
  /**
   * O three.js só é pedido depois de a página estar desenhada.
   *
   * São os ~240 kB comprimidos mais pesados do site, e nada do que fazem é
   * preciso no primeiro frame: as letras do nome caem em GSAP puro. Esperar
   * pelo tempo morto do browser faz a intro arrancar de imediato e o objeto
   * 3D nascer logo a seguir, já em dissolução.
   */
  const [stageReady, setStageReady] = useState(false)

  useMagnetic()

  useLayoutEffect(() => {
    const root = document.documentElement
    let smoother = null

    const ctx = gsap.context(() => {
      if (features.smoothScroll) {
        smoother = ScrollSmoother.create({
          wrapper: wrapper.current,
          content: content.current,
          // Curto de propósito. Acima de ~1s a página continua a andar bem
          // depois de a roda parar, e isso lê-se como atraso — o mesmo sintoma
          // de uma taxa de frames baixa, mesmo com o site a 60fps folgados.
          smooth: isSafari ? 0.6 : 0.85,
          effects: true,
          normalizeScroll: features.normalizeScroll,
          smoothTouch: 0,
          ignoreMobileResize: true,
        })
        root.dataset.smooth = 'on'
        setReady(true)
      } else {
        root.dataset.smooth = 'off'
      }
    })

    // Velocidade do scroll — as cenas 3D usam-na para esticar e distorcer.
    const readVelocity = () => {
      stage.velocity = smoother ? smoother.getVelocity() / 1000 : 0
    }
    gsap.ticker.add(readVelocity)

    const onPointer = (e) => {
      stage.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      stage.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    // As secções são medidas em vh e as fontes mudam alturas ao carregar:
    // sem este refresh, todos os pontos de início ficam alguns píxeis fora.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    // Descer para uma âncora tem de passar pelo smoother, senão o salto nativo
    // e a posição suavizada ficam a discutir um com o outro.
    const onAnchor = (e) => {
      const link = e.target.closest?.('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')
      const target = id === '#top' ? 0 : document.querySelector(id)
      if (target === null) return
      e.preventDefault()
      if (smoother) smoother.scrollTo(target, true, 'top top')
      else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' })
      else target.scrollIntoView({ behavior: 'smooth' })
    }
    document.addEventListener('click', onAnchor)

    // O Safari só ganhou requestIdleCallback recentemente; o timeout cobre-o.
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setStageReady(true), { timeout: 900 })
      : window.setTimeout(() => setStageReady(true), 350)

    return () => {
      gsap.ticker.remove(readVelocity)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('load', onLoad)
      document.removeEventListener('click', onAnchor)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      smoother?.kill()
      ctx.revert()
    }
  }, [])

  // Corre depois de as secções montarem e registarem os seus gatilhos.
  useLayoutEffect(() => {
    if (!ready) return
    ScrollTrigger.refresh()
  }, [ready])

  return (
    <>
      <Preloader />
      <Cursor />
      <HUD />
      <Grain />

      {use3D && stageReady && (
        <Suspense fallback={null}>
          <Stage3D />
        </Suspense>
      )}

      <div id="smooth-wrapper" ref={wrapper} className="relative z-10">
        <div id="smooth-content" ref={content}>
          {ready && (
            <main id="top">
              <Intro />
              <About />

              {ACT_ORDER.map((actId) => (
                <Fragment key={actId}>
                  <ActMarker act={ACTS[actId]} />
                  {projectsOfAct(actId).map((project) => (
                    <Moment key={project.id} project={project} />
                  ))}
                </Fragment>
              ))}

              <Contact />
            </main>
          )}
        </div>
      </div>

      {/* Aviso silencioso: sem WebGL o site continua a funcionar, só sem 3D. */}
      {!use3D && !isMobile && (
        <p className="sr-only">
          Versão simplificada: os objetos tridimensionais estão desativados neste
          dispositivo ou por preferência de movimento reduzido.
        </p>
      )}
    </>
  )
}
