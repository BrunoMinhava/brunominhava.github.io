import { useLayoutEffect, useRef } from 'react'
import { useMoment } from '../hooks/useMoment'
import { Chars, useReveal } from '../components/Reveal'
import { gsap } from '../lib/gsap'
import { ACTS } from '../data/projects'
import { isMobile, features } from '../lib/env'

/**
 * A linha que define o trabalho.
 *
 * As quatro palavras não são decoração: cada cor corresponde a um dos atos que
 * vêm a seguir, por isso a secção funciona como índice visual da viagem. Cada
 * linha viaja a uma velocidade diferente — e duas delas ao contrário — para
 * que se desalinhem e voltem a alinhar durante a travessia.
 */
const LINES = [
  { text: 'web designer', color: ACTS.web.accent, par: 0, parX: 0.1 },
  { text: 'developer', color: '#ede9e0', par: 0.07, parX: -0.15 },
  { text: 'automação', color: ACTS.automation.accent, par: 0.14, parX: 0.18 },
  { text: 'IA', color: ACTS.ai.accent, par: 0.22, parX: -0.1 },
]

export default function About() {
  const root = useRef(null)
  const pin = useRef(null)
  const content = useRef(null)
  const body = useRef(null)

  useMoment({
    rootRef: root,
    pinRef: pin,
    contentRef: content,
    scene: 'thread',
    cursor: 'read',
    act: null,
    index: '01',
    title: 'Sobre',
    accent: '#ede9e0',
    pin: !isMobile,
    fadeIn: 0.4,
    fadeOut: 0.4,
  })

  useReveal(body, {
    selector: '.word',
    y: '110%',
    stagger: 0.018,
    trigger: root,
    start: 'top 45%',
    end: 'top 5%',
    scrub: !isMobile,
  })

  /**
   * Revelação das quatro linhas, desfasada.
   *
   * Feita aqui e não dentro de cada linha porque os efeitos de layout dos
   * componentes filhos correm antes de o `ref` desta secção estar ligado — um
   * filho que quisesse disparar em relação à secção só encontraria `null`.
   * A secção é dona do seu gatilho, por isso é ela que orquestra.
   */
  useLayoutEffect(() => {
    const el = root.current
    if (!el || !features.letterAnimations) return

    const ctx = gsap.context(() => {
      el.querySelectorAll('[data-line]').forEach((line, i) => {
        const chars = line.querySelectorAll('.char')
        if (!chars.length) return
        gsap.fromTo(
          chars,
          { yPercent: 120, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            ease: 'power3.out',
            stagger: isMobile ? 0.02 : { amount: 0.45 },
            duration: 0.9,
            scrollTrigger: {
              trigger: el,
              // Cada linha entra um pouco depois da anterior.
              start: `top ${95 - i * 6}%`,
              end: `top ${35 - i * 6}%`,
              scrub: isMobile ? false : 1,
              once: isMobile,
            },
          },
        )
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={root}
      id="sobre"
      aria-label="Sobre mim"
      className={isMobile ? 'relative min-h-screen py-24' : 'relative'}
      style={{ height: isMobile ? undefined : '210vh', '--accent': '#ede9e0' }}
    >
      <div
        ref={pin}
        className={
          isMobile
            ? 'relative w-full'
            : 'relative flex h-screen w-full items-center overflow-hidden'
        }
      >
        <div ref={content} className="shell relative z-10 opacity-0">
          <p data-par="0" className="t-micro mb-10 text-ash">
            01 / Sobre
          </p>

          <h2 className="t-display leading-[0.96]">
            <span className="sr-only">
              {LINES.map((l) => l.text).join(' + ')}
            </span>
            {LINES.map((line, i) => (
              <span key={line.text} className="block" aria-hidden="true">
                <span
                  data-par={line.par}
                  data-par-x={line.parX}
                  className="inline-flex items-baseline gap-[0.25em]"
                  style={{ color: line.color }}
                >
                  {i > 0 && (
                    <span className="text-[0.28em] font-mono opacity-40">+</span>
                  )}
                  <Chars data-line={i} text={line.text} className="inline-block" />
                </span>
              </span>
            ))}
          </h2>

          <p
            ref={body}
            data-par="0.3"
            className="mt-24 max-w-2xl t-body text-bone/60"
          >
            <WordsInline text="Trabalho nas quatro ao mesmo tempo, e é isso que faz a diferença: desenho a interface, escrevo o backend, automatizo o que ninguém devia estar a fazer à mão e ensino a máquina a ver o resto. O que vem a seguir são cinco projetos reais, por ordem de acontecimento." />
          </p>
        </div>
      </div>
    </section>
  )
}

/** Palavras cruas — o `sr-only` já é fornecido pelo parágrafo que as embrulha. */
function WordsInline({ text }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((w, i) =>
          /^\s+$/.test(w) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="mask">
              <span className="word">{w}</span>
            </span>
          ),
        )}
      </span>
    </>
  )
}
