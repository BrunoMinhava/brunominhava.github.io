/**
 * Ponte entre o scroll (GSAP, no DOM) e a cena 3D (R3F, no canvas).
 *
 * É deliberadamente um objeto mutável e não estado React: o ScrollTrigger
 * escreve nele a 60fps e o `useFrame` lê-o no mesmo ritmo. Passar isto por
 * `useState` provocaria um re-render por frame.
 *
 * A única coisa que *precisa* de reatividade é saber que cenas devem estar
 * montadas — e essa muda poucas vezes, por isso tem um emissor próprio.
 */

export const stage = {
  /** Progresso global da página, 0 → 1. */
  scroll: 0,
  /** Velocidade de scroll normalizada, usada para esticar/distorcer objetos. */
  velocity: 0,
  /** Rato em coordenadas normalizadas -1 → 1. */
  pointer: { x: 0, y: 0 },
  /** Versão amortecida do rato — é esta que o 3D usa, para não tremer. */
  smooth: { x: 0, y: 0 },
  /** Por cena: { p: progresso 0-1, opacity: 0-1 } */
  scenes: Object.create(null),
  /** Id da cena com maior opacidade neste momento. */
  active: null,
  /** Cor de destaque do ato atual, para o 3D e o cursor acompanharem. */
  accent: '#ffffff',
  /** Verdadeiro entre o carregamento e o fim da animação de entrada. */
  intro: true,
}

/** Devolve o registo de uma cena, criando-o se ainda não existir. */
export function sceneState(id) {
  return (stage.scenes[id] ||= { p: 0, opacity: 0 })
}

/**
 * Curva de dissolução.
 *
 * Cada cena entra durante o primeiro quinto do seu percurso e sai no último.
 * Como as secções se sobrepõem no scroll, há sempre um intervalo em que duas
 * cenas estão parcialmente visíveis ao mesmo tempo — é isso que produz a
 * transição sem cortes.
 */
export function dissolve(p, fadeIn = 0.2, fadeOut = 0.2) {
  if (p < 0 || p > 1) return 0
  // fadeIn/fadeOut a zero significam "já cá está" — é o caso da primeira e da
  // última secção, cujo progresso arranca em 0 e acaba em 1 sem que haja um
  // vizinho para quem dissolver. Sem esta ressalva a página abria em branco.
  const rise = fadeIn <= 0 ? 1 : Math.min(1, p / fadeIn)
  const fall = fadeOut <= 0 ? 1 : Math.min(1, (1 - p) / fadeOut)
  const v = Math.min(rise, fall)
  // Suavização smoothstep, para não haver cantos na entrada e saída.
  return v * v * (3 - 2 * v)
}

/* ------------------------------------------------------------------ *
 * Montagem preguiçosa das cenas
 * ------------------------------------------------------------------ */

let mounted = new Set()
const listeners = new Set()
let snapshot = []

function emit() {
  snapshot = [...mounted]
  listeners.forEach((l) => l())
}

/** Marca uma cena como "perto do viewport" — deve ser carregada e montada. */
export function requestScene(id, on) {
  if (on === mounted.has(id)) return
  mounted = new Set(mounted)
  if (on) mounted.add(id)
  else mounted.delete(id)
  emit()
}

export const mountedStore = {
  subscribe(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  },
  get: () => snapshot,
}

/* ------------------------------------------------------------------ *
 * Momento atual (para o HUD e a cor de destaque)
 * ------------------------------------------------------------------ */

let focus = { act: null, index: '00', title: 'Intro', accent: '#ede9e0', invert: false }
const focusListeners = new Set()

export function setFocus(next) {
  if (next.index === focus.index && next.title === focus.title) return
  focus = { ...focus, ...next }
  stage.accent = focus.accent
  focusListeners.forEach((l) => l())
}

export const focusStore = {
  subscribe(cb) {
    focusListeners.add(cb)
    return () => focusListeners.delete(cb)
  },
  get: () => focus,
}
