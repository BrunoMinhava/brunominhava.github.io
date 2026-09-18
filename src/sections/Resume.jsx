import { useRef } from 'react'
import { useMoment } from '../hooks/useMoment'
import { EXPERIENCE, SKILLS } from '../data/career'

export default function Resume() {
  const root = useRef(null)
  useMoment({ rootRef: root, scene: null, pin: false, cursor: 'view', index: '06', title: 'Currículo', accent: '#579aff' })

  return (
    <section ref={root} id="curriculo" className="professional-section resume-section" aria-labelledby="resume-title">
      <div className="shell">
        <div className="section-intro">
          <div><p className="eyebrow">06 / Currículo</p><h2 id="resume-title" className="t-heading">O percurso por<br />trás do trabalho.</h2></div>
          <p className="section-description">Sou Técnico de Gestão e Programação de Sistemas Informáticos, em Vila Real. Junto desenvolvimento de software, automação e suporte TI para resolver problemas do mundo real.</p>
        </div>
        <div className="resume-layout">
          <div>
            <h3 className="resume-label">Experiência profissional</h3>
            <div className="timeline">{EXPERIENCE.map(job => <article className="career-entry" key={job.company}>
              <p className="career-period">{job.period}</p><h4>{job.company}</h4><p className="career-role">{job.role}</p><p className="career-description">{job.description}</p>
              <ul>{job.points.map(point => <li key={point}>{point}</li>)}</ul>
            </article>)}</div>
            <h3 className="resume-label education-label">Formação</h3>
            <article className="education-card">
              <div className="education-top"><p className="career-period">2020 — 2023</p><span className="grade">18<span>/20</span></span></div>
              <h4>Gestão e Programação de Sistemas Informáticos</h4>
              <p className="career-role">Escola Profissional da NERVIR · Vila Real</p>
              <p className="career-description">Curso profissional com formação em programação, bases de dados, arquitetura de computadores, redes, sistemas operativos e eletrónica.</p>
              <div className="pap"><p className="eyebrow">Projeto de Aptidão Profissional</p><h5>Fechadura inteligente biométrica</h5><p>Desenvolvida com Arduino e leitor de impressão digital. Implementada nos cacifos da escola e distinguida com a melhor classificação entre as PAPs desse ano.</p></div>
            </article>
          </div>
          <aside className="skills-column" aria-label="Competências e idiomas">
            <h3 className="resume-label">Competências técnicas</h3>
            {SKILLS.map(group => <div className="skill-group" key={group.title}><h4>{group.title}</h4><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}
            <div className="languages"><h3 className="resume-label">Idiomas</h3><p><span>Português</span><span>Nativo</span></p><p><span>Inglês</span><span>B1/B2</span></p><small>Leitura de documentação técnica e comunicação escrita. Comunicação oral em desenvolvimento.</small></div>
          </aside>
        </div>
        <div className="service-footer"><p>Software, hardware e atenção ao problema que é preciso resolver.</p><a className="action-link" href="#contacto">Entrar em contacto <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
  )
}
