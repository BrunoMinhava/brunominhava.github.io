import { useLayoutEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useMoment } from '../hooks/useMoment'
import { Chars } from '../components/Reveal'
import { PROFILE } from '../data/projects'
import { isMobile, features } from '../lib/env'
import { stage } from '../lib/stage'
import { boot } from '../lib/boot'

/**
 * Abertura.
 *
 * As letras caem do topo em ordem aleatória e, quando se começa a descer,
 * abrem-se para os lados como uma cortina: o deslocamento de cada letra é
 * proporcional à distância ao centro, por isso a explosão é simétrica e
 * parece coreografada em vez de ruído.
 */
export default function Intro() {
  const root = useRef(null)
  const pin = useRef(null)
  const content = useRef(null)
  const name = useRef(null)
  const hint = useRef(null)

  useMoment({
    rootRef: root,
    pinRef: pin,
    contentRef: content,
    scene: 'intro',
    cursor: 'intro',
    act: null,
    index: '00',
    title: 'Intro',
    accent: '#ede9e0',
    // Sem entrada: a abertura já está no ecrã quando a página carrega.
    fadeIn: 0,
    fadeOut: 0.3,
    pin: !isMobile,
    parallaxFrom: 0,
  })

  useLayoutEffect(() => {
    const chars = name.current?.querySelectorAll('.char')
    if (!chars?.length) return

    let entrance = null

    const ctx = gsap.context(() => {
      if (features.letterAnimations) {
        // Criada em pausa: um `from` fixa o estado inicial no momento em que é
        // construído, por isso as letras já ficam escondidas por trás da
        // cortina e não há um fotograma em que apareçam antes de cair.
        entrance = gsap
          .timeline({ paused: true, onComplete: () => (stage.intro = false) })
          .from(chars, {
            yPercent: -150,
            rotate: () => gsap.utils.random(-35, 35),
            opacity: 0,
            duration: 1.5,
            ease: 'expo.out',
            stagger: { each: 0.035, from: 'random' },
          })
          .from(hint.current, { opacity: 0, y: 20, duration: 1 }, '-=0.6')
      } else {
        stage.intro = false
      }

      if (isMobile) return

      // Saída: cortina a abrir. `dir` vai de -1 (primeira letra) a 1 (última).
      const n = chars.length
      const mid = (n - 1) / 2
      gsap.to(chars, {
        x: (i) => ((i - mid) / mid) * window.innerWidth * 0.6,
        y: (i) => -Math.abs((i - mid) / mid) * window.innerHeight * 0.35,
        rotate: (i) => ((i - mid) / mid) * 55,
        scale: 1.35,
        opacity: 0,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '60% top',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    }, root.current)

    const unsubscribe = boot.onRelease(() => entrance?.play(0))

    return () => {
      unsubscribe()
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={root}
      aria-label="Início"
      className={isMobile ? 'relative min-h-screen py-24' : 'relative'}
      style={{ height: isMobile ? undefined : '190vh', '--accent': '#ede9e0' }}
    >
      <div
        ref={pin}
        className={
          isMobile
            ? 'relative flex min-h-screen w-full items-center'
            : 'relative flex h-screen w-full items-center overflow-hidden'
        }
      >
        <div ref={content} className="shell relative z-10">
          <p data-par="0.12" className="t-micro mb-6 text-ash md:mb-10">
            {PROFILE.location} — Portfólio {new Date().getFullYear()}
          </p>

          {/* Duas linhas por decisão, não por acaso de largura: um nome
              empilhado ancora a composição à esquerda e deixa o objeto ficar
              com a metade direita. Confiar na quebra automática significaria
              que um ajuste de tracking podia colapsar tudo numa linha. */}
          <h1 ref={name} className="t-hero">
            <Chars as="span" text={PROFILE.first} className="block" />
            <Chars as="span" text={PROFILE.last} className="block" />
          </h1>

          {/* Tudo ancorado à esquerda: a metade direita é do objeto, e uma
              pista de scroll por cima de vidro iluminado não se lê. */}
          <div data-par="0.34" className="mt-10 max-w-lg border-t hairline pt-6">
            <p className="t-note text-bone/55">
              Construo sites, ferramentas de negócio e sistemas que veem, ouvem e leem.
              Cinco projetos, três atos — por ordem de acontecimento.
            </p>
            <p ref={hint} className="t-micro mt-8 text-ash">
              Desça para começar
              <span className="ml-3 inline-block animate-pulse">↓</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
