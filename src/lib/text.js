/**
 * Divisão de texto para animações letra a letra.
 *
 * Feito à mão em vez de usar o SplitText do GSAP porque assim o markup é
 * previsível, sobrevive a re-renders do React e mantém o texto original
 * legível para leitores de ecrã (o elemento animado leva `aria-hidden` e o
 * texto real vai num `.sr-only`).
 */

/** Divide em palavras, preservando os espaços como itens próprios. */
export function toWords(text) {
  return String(text)
    .split(/(\s+)/)
    .filter((t) => t.length > 0)
}

/** Divide uma palavra em grafemas — não parte emojis nem letras acentuadas. */
export function toChars(word) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter('pt', { granularity: 'grapheme' })
    return [...seg.segment(word)].map((s) => s.segment)
  }
  return [...word]
}

/** Indica se um pedaço devolvido por `toWords` é espaço em branco. */
export const isSpace = (t) => /^\s+$/.test(t)
