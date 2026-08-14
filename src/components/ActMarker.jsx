import { useRef } from 'react'
import { useMoment } from '../hooks/useMoment'
import { Chars, useReveal } from './Reveal'
import { isMobile } from '../lib/env'

/**
 * Cartão de ato entre capítulos.
 *
 * Não tem cena 3D própria de propósito: como o intervalo de dissolução dos
 * projetos vizinhos é maior do que este cartão, o 3D do projeto anterior ainda
 * está a desvanecer enquanto o do seguinte já começou a nascer. O cartão passa
 * por cima dessa passagem — é a respiração entre atos.
 */
export default function ActMarker({ act }) {
  const root = useRef(null)
  const pin = useRef(null)
  const content = useRef(null)
  const label = useRef(null)

  useMoment({
    rootRef: root,
    pinRef: pin,
    contentRef: content,
    scene: null,
    cursor: 'read',
    act: act.id,
    index: act.numeral,
    title: act.label,
    accent: act.accent,
    fadeIn: 0.3,
    fadeOut: 0.3,
    pin: !isMobile,
  })

  useReveal(label, {
    selector: '.char',
    y: '130%',
    scrub: !isMobile,
    trigger: root,
    start: 'top bottom',
    end: 'top 25%',
  })

  return (
    <section
      ref={root}
      aria-label={`Ato ${act.numeral}: ${act.label}`}
      className={isMobile ? 'relative min-h-[70vh] py-24' : 'relative'}
      style={{ height: isMobile ? undefined : '120vh', '--accent': act.accent }}
    >
      <div
        ref={pin}
        className={
          isMobile
            ? 'relative w-full'
            : 'relative flex h-screen w-full items-center overflow-hidden'
        }
      >
        {/* Numeral romano enorme, a subir contra o scroll. */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            data-par="-1.75"
            className="t-display text-[46vw] leading-none opacity-[0.055]"
            style={{ color: act.accent }}
          >
            {act.numeral}
          </div>
        </div>

        <div ref={content} className="shell relative z-10 text-center opacity-0">
          <p data-par="0" className="t-micro mb-8 text-ash">
            Ato {act.numeral}
          </p>
          <Chars
            ref={label}
            as="h2"
            text={act.label}
            data-par="0.12"
            className="t-display"
          />
          <p
            data-par="0.3"
            className="t-lead mx-auto mt-8 max-w-xl"
            style={{ color: act.accent }}
          >
            {act.subtitle}
          </p>
        </div>
      </div>
    </section>
  )
}
