import { useRef } from 'react'
import { useMoment } from '../hooks/useMoment'
import { SERVICES } from '../data/career'
import { PROFILE } from '../data/projects'

const ICONS = {
  web: <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" /></>,
  app: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 18h4" /></>,
  automation: <><path d="m13 2-9 12h7l-1 8 10-13h-7z" /></>,
  computer: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  social: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" /></>,
}

export default function Services() {
  const root = useRef(null)
  useMoment({ rootRef: root, scene: null, pin: false, cursor: 'view', index: 'S', title: 'Serviços', accent: '#579aff' })

  return (
    <section ref={root} id="servicos" className="professional-section services-section" aria-labelledby="services-title">
      <div className="shell">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Prestação de serviços · Particulares e empresas</p>
            <h2 id="services-title" className="t-heading">Soluções reais.<br /><span className="blue-text">Para pessoas reais.</span></h2>
          </div>
          <p className="section-description">Do primeiro site ao apoio técnico do dia a dia. Ajudo a transformar necessidades concretas em soluções digitais que fazem sentido para si.</p>
        </div>

        <div className="service-list">
          {SERVICES.map((service, i) => (
            <a key={service.icon} className="service-row" href={`mailto:${PROFILE.email}?subject=${encodeURIComponent(`Pedido de proposta — ${service.title}`)}`} data-cursor-label="Falar">
              <span className="service-number" aria-hidden="true">0{i + 1}</span>
              <span className="service-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{ICONS[service.icon]}</svg></span>
              <div className="service-name"><h3>{service.title}</h3><div className="service-tags">{service.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
              <p>{service.description}</p>
              <span className="service-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <div className="service-footer"><p>Cada projeto começa por uma conversa sobre o que precisa.</p><a className="action-link" href="#contacto">Vamos falar do seu projeto <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
  )
}
