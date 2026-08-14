/**
 * Portão de arranque.
 *
 * O ecrã de carregamento tapa a página enquanto as fontes chegam. Só quando
 * ele se levanta é que a abertura pode começar a animar — senão as letras
 * caíam por trás da cortina e o visitante perdia o único momento em que o
 * nome aparece.
 */

let released = false
const waiting = new Set()

export const boot = {
  get released() {
    return released
  },

  release() {
    if (released) return
    released = true
    waiting.forEach((fn) => fn())
    waiting.clear()
  },

  /** Corre já se a cortina tiver subido; caso contrário espera por ela. */
  onRelease(fn) {
    if (released) {
      fn()
      return () => {}
    }
    waiting.add(fn)
    return () => waiting.delete(fn)
  },
}
