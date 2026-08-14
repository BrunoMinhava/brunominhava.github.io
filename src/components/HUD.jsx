import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { focusStore } from '../lib/stage'
import { PROFILE } from '../data/projects'

/**
 * Cromo fixo da página: assinatura, momento atual e barra de progresso.
 *
 * A percentagem e a barra são escritas diretamente no DOM a partir do
 * `onUpdate` do ScrollTrigger. Passá-las por estado React significaria um
 * re-render por frame de scroll, que é exatamente o orçamento que o WebGL
 * precisa para si.
 */
export default function HUD() {
  const bar = useRef(null)
  const pct = useRef(null)
  const focus = useSyncExternalStore(focusStore.subscribe, focusStore.get, focusStore.get)

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress
        if (bar.current) bar.current.style.transform = `scaleX(${p})`
        if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, '0')
      },
    })
    return () => st.kill()
  }, [])

  // Troca do rótulo do momento com um pequeno salto vertical.
  const labelRef = useRef(null)
  useLayoutEffect(() => {
    if (!labelRef.current) return
    gsap.fromTo(
      labelRef.current,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
    )
  }, [focus.index])

  const tone = focus.invert ? 'text-void' : 'text-bone'
  const dim = focus.invert ? 'text-void/45' : 'text-bone/45'
  const rule = focus.invert ? 'bg-void/15' : 'bg-bone/15'

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 transition-colors duration-700 ${tone}`}
    >
      <div className="hud-veil hud-veil--top" aria-hidden="true" />
      <div className="hud-veil hud-veil--bottom" aria-hidden="true" />

      {/* Assinatura */}
      <a
        href="#top"
        className={`t-micro pointer-events-auto absolute left-6 top-6 lg:left-10 lg:top-8 ${tone}`}
        data-cursor-label="Topo"
      >
        Bruno Minhava
      </a>

      {/* Atalhos */}
      <nav className="pointer-events-auto absolute right-6 top-6 flex gap-6 lg:right-10 lg:top-8">
        <a
          className={`t-micro link ${dim}`}
          href={PROFILE.github}
          target="_blank"
          rel="noreferrer noopener"
          data-cursor-label="GitHub"
          data-magnetic
        >
          GitHub
        </a>
        <a className={`t-micro link ${dim}`} href="#contacto" data-cursor-label="Falar" data-magnetic>
          Contacto
        </a>
      </nav>

      {/* Momento atual */}
      <div className="absolute bottom-6 left-6 overflow-hidden lg:bottom-8 lg:left-10">
        <div ref={labelRef} className="t-micro flex items-center gap-3">
          <span style={{ color: focus.invert ? '#08080a' : focus.accent }}>{focus.index}</span>
          <span className={`h-px w-6 ${rule}`} />
          <span className={dim}>{focus.title}</span>
        </div>
      </div>

      {/* Progresso */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4 lg:bottom-8 lg:right-10">
        <div className={`h-px w-24 overflow-hidden lg:w-40 ${rule}`}>
          <div
            ref={bar}
            className="h-full w-full origin-left scale-x-0"
            style={{ background: focus.invert ? '#08080a' : focus.accent }}
          />
        </div>
        <span ref={pct} className={`t-micro tabular-nums ${dim}`}>
          000
        </span>
      </div>
    </div>
  )
}
