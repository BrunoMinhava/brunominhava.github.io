import { useLayoutEffect } from 'react'
import { gsap } from '../lib/gsap'
import { toWords, toChars, isSpace } from '../lib/text'
import { features } from '../lib/env'

/**
 * Texto dividido em letras, cada uma dentro de uma máscara.
 *
 * Não anima sozinho — expõe `.char` para o pai orquestrar. O texto verdadeiro
 * fica num `.sr-only` e a versão visual é `aria-hidden`, senão os leitores de
 * ecrã leem letra a letra.
 */
export function Chars({ text, as: Tag = 'span', className = '', style, ...rest }) {
  const words = toWords(text)
  return (
    <Tag className={className} style={style} {...rest}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) =>
          isSpace(w) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="inline-block whitespace-nowrap">
              {toChars(w).map((c, j) => (
                <span key={j} className="mask">
                  <span className="char">{c}</span>
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  )
}

/** Igual ao `Chars`, mas a unidade animada é a palavra. Melhor para blocos longos. */
export function Words({ text, as: Tag = 'span', className = '', style, ...rest }) {
  const words = toWords(text)
  return (
    <Tag className={className} style={style} {...rest}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) =>
          isSpace(w) ? (
            <span key={i}> </span>
          ) : (
            <span key={i} className="mask">
              <span className="word">{w}</span>
            </span>
          ),
        )}
      </span>
    </Tag>
  )
}

/**
 * Revela `.char` / `.word` dentro do contentor quando ele entra no viewport.
 *
 * `scrub` liga a revelação diretamente ao scroll (as letras aparecem à medida
 * que se roda a roda do rato); sem ele, dispara uma vez.
 */
export function useReveal(
  ref,
  {
    selector = '.char',
    y = '110%',
    rotate = 0,
    stagger = 0.014,
    duration = 0.9,
    start = 'top 82%',
    end = 'top 38%',
    scrub = false,
    from = {},
    enabled = true,
    // Por omissão o gatilho é o próprio texto; passar outro elemento permite
    // que as letras se revelem ao ritmo da secção inteira e não do parágrafo.
    trigger = null,
    deps = [],
  } = {},
) {
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return
    const scope = ref.current
    const targets = scope.querySelectorAll(selector)
    if (!targets.length) return

    if (!features.letterAnimations) {
      gsap.set(targets, { yPercent: 0, opacity: 1, rotate: 0 })
      return
    }

    /**
     * O gatilho tem de ser um elemento, nunca um ref por resolver.
     *
     * Um ref que pertença a um componente acima só é preenchido depois de os
     * efeitos dos filhos correrem, por isso `trigger.current` pode ainda ser
     * nulo aqui. Nesse caso vale mais revelar em relação ao próprio texto do
     * que entregar ao GSAP um objeto que ele não sabe medir.
     */
    const resolved = trigger?.current ?? trigger
    const triggerEl = resolved instanceof Element ? resolved : scope

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: parseFloat(y), opacity: 0, rotate, ...from },
        {
          yPercent: 0,
          opacity: 1,
          rotate: 0,
          duration,
          stagger: scrub ? { amount: 0.6 } : stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: triggerEl,
            start,
            end,
            scrub: scrub ? 1 : false,
            once: !scrub,
          },
        },
      )
    }, scope)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
