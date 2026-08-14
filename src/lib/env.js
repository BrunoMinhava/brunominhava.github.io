/**
 * Deteção de ambiente e escalões de qualidade.
 *
 * Tudo é avaliado uma vez no arranque. O objetivo é ter um único sítio onde se
 * decide "quanto" é que o site se pode dar ao luxo de animar.
 */

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

/** Safari (desktop e iOS) mas não Chrome/Edge/Brave, que também dizem "Safari" no UA. */
export const isSafari =
  /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua) ||
  // iPadOS 13+ mente e diz-se Macintosh; distingue-se pelo toque.
  (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)

export const isFirefox = /firefox/i.test(ua)

export const isTouch =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)

/** Mobile = ecrã estreito OU ponteiro grosseiro. O foco do site é desktop. */
export const isMobile =
  typeof window !== 'undefined' && (window.innerWidth < 900 || (isTouch && window.innerWidth < 1100))

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Escalão de qualidade: 'low' | 'mid' | 'high'.
 * Baseado em núcleos de CPU, memória declarada e tipo de dispositivo.
 */
function detectTier() {
  if (typeof navigator === 'undefined') return 'mid'
  if (prefersReducedMotion) return 'low'
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  if (isMobile) return cores >= 6 && mem >= 4 ? 'mid' : 'low'
  if (cores >= 8 && mem >= 8) return 'high'
  if (cores >= 4) return 'mid'
  return 'low'
}

export const tier = detectTier()

/** Multiplicador aplicado a contagens de partículas e densidade de geometria. */
export const density = { low: 0.28, mid: 0.6, high: 1 }[tier]

/** Devicepixelratio limitado — acima de ~1.75 o custo não compensa visualmente. */
export const dpr = (() => {
  if (typeof window === 'undefined') return 1
  const raw = window.devicePixelRatio || 1
  // Com uma passagem de bloom por frame, o custo cresce com o quadrado do
  // DPR. Num ecrã Retina, 1.75 são mais do triplo dos píxeis de 1 — e a
  // diferença visível entre 1.4 e 1.75 num objeto em movimento é nenhuma.
  const cap = tier === 'high' ? 1.4 : tier === 'mid' ? 1.2 : 1
  return Math.min(raw, cap)
})()

/**
 * Interruptores de funcionalidade.
 *
 * O Safari tem historicamente problemas com `backdrop-filter` sobre canvas WebGL
 * e com scroll suave sintético em trackpads — por isso desliga-se o smoothing
 * mais agressivo e o blur pesado nesse motor.
 */
export const features = {
  smoothScroll: !isMobile && !prefersReducedMotion,
  // O normalizeScroll do ScrollSmoother entra em conflito com o scroll elástico do Safari.
  normalizeScroll: !isSafari && !isMobile && !prefersReducedMotion,
  customCursor: !isTouch && !isMobile,
  heavyBlur: !isSafari && tier !== 'low',
  webgl: !prefersReducedMotion && tier !== 'low' ? true : !prefersReducedMotion,
  // Antialiasing MSAA custa caro; em ecrãs densos o DPR já resolve.
  antialias: tier === 'high' && dpr < 1.5,
  parallaxStrength: isMobile ? 0.35 : 1,
  letterAnimations: !prefersReducedMotion,
  // Bloom e aberração custam uma passagem de ecrã inteiro por frame: só onde
  // sobra orçamento. Se a taxa ceder em execução, são desligados na hora.
  postFx: tier !== 'low' && !prefersReducedMotion,
}

/** Suporte a WebGL — se falhar, o site degrada para uma versão só em DOM. */
export const hasWebGL = (() => {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

export const use3D = hasWebGL && features.webgl && !prefersReducedMotion

if (typeof document !== 'undefined') {
  const root = document.documentElement
  root.dataset.tier = tier
  if (isSafari) root.dataset.safari = 'true'
  if (isMobile) root.dataset.mobile = 'true'
  if (prefersReducedMotion) root.dataset.reduced = 'true'
}
