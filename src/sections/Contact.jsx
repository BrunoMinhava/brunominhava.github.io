import { useRef } from 'react'
import { useMoment } from '../hooks/useMoment'
import { Chars, useReveal } from '../components/Reveal'
import { PROFILE } from '../data/projects'
import { isMobile } from '../lib/env'

/**
 * Aterragem.
 *
 * Única secção sem WebGL e a única em fundo claro. Depois de setecentos por
 * cento de altura em escuro e movimento, o contraste é o efeito: o 3D pára,
 * o cursor inverte-se e só fica o essencial — um email e um perfil.
 */
export default function Contact() {
  const root = useRef(null)
  const pin = useRef(null)
  const content = useRef(null)
  const heading = useRef(null)

  useMoment({
    rootRef: root,
    pinRef: pin,
    contentRef: content,
    scene: null,
    cursor: 'invert',
    act: null,
    index: '07',
    title: 'Contacto',
    accent: '#08080a',
    fadeIn: 0.22,
    fadeOut: 0.05,
    pin: !isMobile,
    invert: true,
  })

  useReveal(heading, {
    selector: '.char',
    y: '120%',
    scrub: !isMobile,
    trigger: root,
    start: 'top 90%',
    end: 'top 20%',
  })

  return (
    <section
      ref={root}
      id="contacto"
      aria-label="Contacto"
      className={isMobile ? 'relative min-h-screen' : 'relative'}
      style={{ height: isMobile ? undefined : '170vh', '--accent': '#08080a' }}
    >
      <div
        ref={pin}
        className={
          isMobile
            ? 'relative flex min-h-screen w-full items-center bg-chalk py-24 text-void'
            : 'relative flex h-screen w-full items-center overflow-hidden bg-chalk text-void'
        }
      >
        <div ref={content} className="shell relative z-10 opacity-0">
          <p data-par="0" className="t-micro mb-10 text-void/40">
            07 / Vamos trabalhar juntos
          </p>

          <Chars
            ref={heading}
            as="h2"
            text="Vamos falar."
            data-par="0.08"
            className="t-display"
          />

          <p className="contact-intro">Tem uma ideia, um processo para simplificar ou precisa de apoio técnico? Conte-me o que procura.</p>

          <div
            data-par="0.26"
            className="mt-20 grid grid-cols-12 items-end gap-x-6 gap-y-10 border-t hairline-dark pt-10"
          >
            <div className="col-span-12 lg:col-span-7">
              <p className="t-micro mb-4 text-void/40">Email</p>
              <a
                className="link display block text-[clamp(1.25rem,3.6vw,3rem)] tracking-tight"
                href={`mailto:${PROFILE.email}`}
                data-cursor-label="Email"
                data-magnetic
              >
                {PROFILE.email}
              </a>
            </div>

            <div className="col-span-12 flex gap-10 lg:col-span-5 lg:justify-end">
              <div>
                <p className="t-micro mb-4 text-void/40">Código</p>
                <a
                  className="link display text-[clamp(1.1rem,2vw,1.75rem)]"
                  href={PROFILE.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor-label="Abrir"
                  data-magnetic
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>

          <p data-par="0.26" className="t-micro mt-20 text-void/35">
            {PROFILE.name} — {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </section>
  )
}
