import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { gsap } from '../lib/gsap'
import { cursorStore } from '../lib/cursor'
import { features } from '../lib/env'

/**
 * Cursor que muda de forma consoante a secção.
 *
 * A posição é escrita com `quickTo` (interpolação contínua, sem criar tweens
 * novos por evento) e a *forma* é feita em CSS a partir de `data-mode`, para
 * que a morfose seja uma transição declarativa em vez de mais trabalho no JS.
 * O anel segue com mais atraso que o ponto — é o que dá a sensação de peso.
 */
export default function Cursor() {
  const root = useRef(null)
  const ring = useRef(null)
  const dot = useRef(null)
  const label = useRef(null)
  const [hover, setHover] = useState(false)
  const [labelText, setLabelText] = useState('')
  const { mode } = useSyncExternalStore(cursorStore.subscribe, cursorStore.get, cursorStore.get)

  useLayoutEffect(() => {
    if (!features.customCursor) return
    document.body.dataset.cursor = 'on'

    const set = (el, prop, dur) => gsap.quickTo(el, prop, { duration: dur, ease: 'power3' })
    const ringX = set(ring.current, 'x', 0.55)
    const ringY = set(ring.current, 'y', 0.55)
    const dotX = set(dot.current, 'x', 0.12)
    const dotY = set(dot.current, 'y', 0.12)
    const labX = set(label.current, 'x', 0.55)
    const labY = set(label.current, 'y', 0.55)

    let visible = false
    const onMove = (e) => {
      if (!visible) {
        visible = true
        gsap.to(root.current, { autoAlpha: 1, duration: 0.4 })
        // Sem isto o cursor viajaria desde 0,0 na primeira aparição.
        gsap.set([ring.current, dot.current, label.current], { x: e.clientX, y: e.clientY })
      }
      ringX(e.clientX)
      ringY(e.clientY)
      dotX(e.clientX)
      dotY(e.clientY)
      labX(e.clientX)
      labY(e.clientY)
    }

    const onLeave = () => gsap.to(root.current, { autoAlpha: 0, duration: 0.3 })
    const onDown = () => gsap.to(ring.current, { scale: 0.7, duration: 0.25 })
    const onUp = () => gsap.to(ring.current, { scale: 1, duration: 0.4 })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      delete document.body.dataset.cursor
    }
  }, [])

  // Estado de hover, delegado no documento para apanhar elementos criados depois.
  useEffect(() => {
    if (!features.customCursor) return
    const SEL = 'a, button, [data-cursor-hover]'
    const onOver = (e) => {
      const t = e.target.closest?.(SEL)
      if (!t) return
      setHover(true)
      setLabelText(t.dataset.cursorLabel || '')
    }
    const onOut = (e) => {
      if (!e.target.closest?.(SEL)) return
      setHover(false)
      setLabelText('')
    }
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])

  if (!features.customCursor) return null

  return (
    <div
      ref={root}
      className="cursor invisible opacity-0"
      data-mode={mode}
      data-hover={hover ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div ref={ring} className="cursor__ring" />
      <div ref={dot} className="cursor__dot" />
      <div ref={label} className="cursor__label">
        {labelText}
      </div>
    </div>
  )
}
