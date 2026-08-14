/**
 * Estado do cursor personalizado.
 *
 * As secções empurram um modo ao entrar no viewport; o componente `Cursor`
 * subscreve. Fora do React porque quem escreve são callbacks do ScrollTrigger.
 */

let state = { mode: 'intro', accent: '#ffffff' }
const listeners = new Set()

export const cursorStore = {
  subscribe(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  get: () => state,
}

export function setCursor(mode, accent) {
  if (state.mode === mode && (!accent || state.accent === accent)) return
  state = { mode, accent: accent ?? state.accent }
  listeners.forEach((l) => l())
}
