import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { boot } from '../lib/boot'
import { prefersReducedMotion } from '../lib/env'

const COLUMNS = 7

/**
 * Cortina de entrada.
 *
 * Um contador que sobe até 100 enquanto as fontes carregam, e depois sete
 * colunas que se levantam em cascata para revelar o site. O contador não é
 * decorativo: a contagem só chega ao fim quando `document.fonts.ready`
 * resolve, com um piso de tempo para não piscar em ligações rápidas.
 *
 * Enquanto a cortina está no ecrã o scroll fica trancado — abrir a página a
 * meio da primeira secção estragaria a única entrada que o site tem.
 */
export default function Preloader() {
  const root = useRef(null)
  const counter = useRef(null)
  const rule = useRef(null)
  const label = useRef(null)
  const columns = useRef([])
  const [done, setDone] = useState(false)

  useLayoutEffect(() => {
    if (prefersReducedMotion) {
      boot.release()
      setDone(true)
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    const state = { value: 0 }
    let fontsReady = false
    document.fonts?.ready.then(() => (fontsReady = true))

    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      tl.to(state, {
        value: 100,
        duration: 1.9,
        ease: 'power2.inOut',
        onUpdate() {
          const v = Math.round(state.value)
          if (counter.current) {
            counter.current.textContent = String(v).padStart(3, '0')
          }
          if (rule.current) rule.current.style.transform = `scaleX(${v / 100})`
        },
        // Se as fontes ainda não chegaram aos 100, segura o último passo.
        onComplete() {
          if (fontsReady) return
          tl.pause()
          const wait = setInterval(() => {
            if (!fontsReady) return
            clearInterval(wait)
            tl.resume()
          }, 60)
        },
      })

        // O contador e a legenda saem antes das colunas.
        .to([counter.current, label.current], {
          yPercent: -120,
          opacity: 0,
          duration: 0.65,
          ease: 'power3.inOut',
          stagger: 0.06,
        })
        .to(rule.current?.parentElement, { opacity: 0, duration: 0.4 }, '<')

        // Cortina a levantar, coluna a coluna.
        .to(
          columns.current,
          {
            yPercent: -101,
            duration: 1.05,
            ease: 'expo.inOut',
            stagger: 0.055,
            onStart: () => {
              document.body.style.overflow = previousOverflow
              boot.release()
            },
          },
          '-=0.25',
        )
        .set(root.current, { display: 'none', onComplete: () => setDone(true) })
    }, root)

    return () => {
      document.body.style.overflow = previousOverflow
      ctx.revert()
      boot.release()
    }
  }, [])

  if (done) return null

  return (
    <div ref={root} className="fixed inset-0 z-[200]" aria-hidden="true">
      {/* Colunas que formam a cortina. */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: COLUMNS }, (_, i) => (
          <div
            key={i}
            ref={(el) => (columns.current[i] = el)}
            className="h-full flex-1 bg-void"
            // Uma fração de píxel de sobreposição evita fios de luz entre colunas.
            style={{ marginRight: i < COLUMNS - 1 ? '-1px' : 0 }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 lg:p-10">
        <div ref={label} className="t-micro flex justify-between text-ash">
          <span>Bruno Minhava</span>
          <span>Portfólio 2026</span>
        </div>

        <div className="flex items-end justify-between">
          <div className="overflow-hidden">
            <span
              ref={counter}
              className="t-count block text-bone"
            >
              000
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-bone/10">
          <div ref={rule} className="h-full w-full origin-left scale-x-0 bg-bone" />
        </div>
      </div>
    </div>
  )
}
