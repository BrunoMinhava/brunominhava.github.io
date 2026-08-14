import { useRef } from 'react'
import { ACTS } from '../data/projects'
import { useMoment } from '../hooks/useMoment'
import { Chars, useReveal } from './Reveal'
import { isMobile } from '../lib/env'

/**
 * Um projeto = um momento da viagem.
 *
 * No desktop a secção tem 300vh de corrida e o conteúdo fica fixo no meio; as
 * camadas lá dentro deslizam a velocidades muito diferentes — o número de
 * fundo sobe enquanto se desce, o corpo de texto arrasta-se, a etiqueta do ato
 * fica quase imóvel. No mobile nada disto acontece: é uma secção normal.
 */
export default function Moment({ project }) {
  const root = useRef(null)
  const pin = useRef(null)
  const content = useRef(null)
  const title = useRef(null)
  const act = ACTS[project.act]

  useMoment({
    rootRef: root,
    pinRef: pin,
    contentRef: content,
    scene: project.scene,
    cursor: project.cursor,
    act: project.act,
    index: project.index,
    title: project.title,
    accent: act.accent,
    pin: !isMobile,
    // Foco mais apertado: a opacidade total coincide com o meio da travessia,
    // que é exatamente onde as camadas de parallax estão alinhadas.
    fadeIn: 0.4,
    fadeOut: 0.4,
  })

  // As letras do título sobem enquanto a secção entra no ecrã.
  useReveal(title, {
    selector: '.char',
    y: '118%',
    scrub: !isMobile,
    trigger: root,
    start: 'top bottom',
    end: isMobile ? 'top 45%' : 'top top',
  })

  return (
    <section
      ref={root}
      id={project.id}
      aria-label={project.title}
      className={isMobile ? 'relative min-h-screen py-28' : 'relative'}
      style={{ height: isMobile ? undefined : '230vh', '--accent': act.accent }}
    >
      <div
        ref={pin}
        className={
          isMobile
            ? 'relative w-full'
            : 'relative flex h-screen w-full items-center overflow-hidden'
        }
      >
        {/* Número gigante em contorno — desloca-se ao contrário do scroll. */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden"
          aria-hidden="true"
        >
          <div
            data-par="-1.35"
            data-par-x="0.5"
            className="ghost-index text-[40vw] md:text-[34vw]"
          >
            {project.index}
          </div>
        </div>

        {/* Etiqueta do ato, na vertical, quase parada. */}
        <div
          className="pointer-events-none absolute left-0 top-0 hidden h-full items-center lg:flex"
          aria-hidden="true"
        >
          <div data-par="0.05" className="t-micro text-ash [writing-mode:vertical-rl]">
            Ato {act.numeral} — {act.label}
          </div>
        </div>

        <div className="scrim" aria-hidden="true" />

        {/* O texto ocupa uma coluna fixa à esquerda em vez de uma grelha de doze
            colunas: a colocação automática do grid trocava a ordem das linhas
            sempre que uma largura mudava, e a metade direita é do objeto 3D. */}
        {/* Uma coluna estreita, tudo empilhado.
            Com a captura real a ocupar a metade direita, duas colunas de texto
            deixaram de caber sem lhe irem por cima. Uma medida de ~65 caracteres
            também se lê melhor do que duas colunas apertadas. */}
        <div ref={content} className="shell relative z-10 opacity-0">
          <div data-par="0.12" className="w-full max-w-[34rem]">
            <div
              className="flex items-baseline justify-between border-b hairline pb-4"
            >
              <span className="t-micro text-ash">
                <span style={{ color: act.accent }}>{project.index}</span>
                <span className="mx-3 opacity-40">/</span>
                {project.kind}
              </span>
              <span className="t-micro text-ash">{project.year}</span>
            </div>

            <Chars
              ref={title}
              as="h2"
              text={project.title}
              className="t-heading mt-7 block"
            />

            <p
              className="t-lead mt-5"
              style={{ color: act.accent }}
            >
              {project.tagline}
            </p>

            <div className="mt-10 space-y-4">
              <p className="t-body text-bone/75">{project.summary}</p>
              <p className="t-note text-bone/45">{project.detail}</p>
            </div>

            <ul className="mt-9 space-y-2.5">
              {project.highlights.map(([value, label]) => (
                <li key={label} className="flex items-baseline gap-4">
                  <span
                    className="t-stat min-w-[3.2ch]"
                    style={{ color: act.accent }}
                  >
                    {value}
                  </span>
                  <span className="t-note text-[0.82rem] text-bone/55">{label}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Tecnologias">
              {project.stack.map((t) => (
                <li
                  key={t}
                  className="t-nano rounded-full border hairline px-2.5 py-1 text-bone/60"
                >
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                className="link t-micro text-bone/80"
                data-magnetic
                href={project.repo}
                target="_blank"
                rel="noreferrer noopener"
                data-cursor-label="GitHub"
              >
                Ver código ↗
              </a>
              {project.live && (
                <a
                  className="link t-micro"
                  data-magnetic
                  style={{ color: act.accent }}
                  href={project.live}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor-label="Abrir"
                >
                  Visitar site ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
