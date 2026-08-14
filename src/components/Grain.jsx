import { useMemo } from 'react'

/**
 * Grão de filme e vinheta.
 *
 * O ruído é gerado uma vez num canvas e usado como data-URI — evita um pedido
 * de rede por uma textura que são 180×180 píxeis de aleatoriedade.
 */
export default function Grain() {
  const src = useMemo(() => {
    if (typeof document === 'undefined') return ''
    const size = 180
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  }, [])

  return (
    <>
      <div className="grain" style={{ '--grain-src': `url(${src})` }} aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  )
}
