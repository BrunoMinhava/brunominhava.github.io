/**
 * Conteúdo do portfólio.
 *
 * Os projetos vêm dos repositórios reais em github.com/BrunoMinhava, por ordem
 * cronológica de criação, agrupados em três atos temáticos. Cada projeto é um
 * "momento" da viagem: uma secção de scroll com a sua própria cena 3D.
 */

export const PROFILE = {
  name: 'Bruno Minhava',
  first: 'Bruno',
  last: 'Minhava',
  role: 'web designer + developer + automação + IA',
  email: 'brunominhava23@outlook.pt',
  github: 'https://github.com/BrunoMinhava',
  location: 'Vila Real, Portugal',
}

/** Paleta por ato — cada ato tem a sua temperatura de cor. */
export const ACTS = {
  web: {
    id: 'web',
    numeral: 'I',
    label: 'Web',
    subtitle: 'Interfaces que se vendem sozinhas',
    accent: '#3fd0ff',
    accentDim: '#0d3b4d',
  },
  automation: {
    id: 'automation',
    numeral: 'II',
    label: 'Automação',
    subtitle: 'O trabalho que ninguém devia fazer à mão',
    accent: '#ffb45c',
    accentDim: '#4d3212',
  },
  ai: {
    id: 'ai',
    numeral: 'III',
    label: 'Inteligência Artificial',
    subtitle: 'Máquinas que veem e compreendem',
    accent: '#b98cff',
    accentDim: '#301f4d',
  },
}

export const PROJECTS = [
  {
    id: 'wonderstatus',
    index: '02',
    act: 'web',
    scene: 'screen',
    cursor: 'view',
    name: 'Wonderstatus',
    title: 'Wonderstatus.pt',
    tagline: 'Laboratório, Água e Oceanografia',
    year: '2026',
    kind: 'Site institucional · cliente real',
    summary:
      'Reconstrução completa do site da Wonderstatus em React moderno. Catálogo de equipamento científico para laboratório, análise de água e oceanografia — seis áreas, dezenas de marcas, tudo navegável sem uma única página lenta.',
    detail:
      'Mantive o slideshow de ecrã inteiro que dava identidade ao site original e reconstruí tudo à volta: conteúdo em módulos de dados, transições entre páginas, parallax nos cabeçalhos e revelações no scroll.',
    highlights: [
      ['06', 'áreas de produto, cada uma com a sua página'],
      ['SPA', 'transições sem recarregar a página'],
      ['100%', 'conteúdo migrado do site original'],
    ],
    stack: ['React', 'Vite', 'React Router', 'Tailwind CSS', 'Framer Motion'],
    shot: '/shots/wonderstatus.webp',
    repo: 'https://github.com/BrunoMinhava/wonderstatus-react',
    live: 'https://wonderstatus.pt',
  },
  {
    id: 'zentrion',
    index: '03',
    act: 'automation',
    scene: 'flow',
    cursor: 'node',
    name: 'Zentrion',
    title: 'Zentrion CRM',
    tagline: 'Do email ao orçamento ganho',
    year: '2026',
    kind: 'Ferramenta de negócio · self-hosted',
    summary:
      'CRM para um distribuidor B2B de material de laboratório. Segue cada orçamento desde o email que sai até ser ganho ou perdido, e liga automaticamente as encomendas a fornecedores extraídas de PDFs anexados.',
    detail:
      'A parte interessante não é o CRUD — é a lógica suja e real: sincronização IMAP, mineração de texto em PDF, resolução de conflitos quando alguém edita à mão por cima do que o parser leu, e notificações push para lembretes.',
    highlights: [
      ['IMAP', 'orçamentos capturados direto do email'],
      ['PDF', 'encomendas de fornecedor lidas automaticamente'],
      ['0', 'serviços externos necessários — corre em SQLite'],
    ],
    stack: ['Python', 'FastAPI', 'SQLAlchemy 2.0', 'SQLite', 'JS vanilla', 'Web Push'],
    shot: '/shots/zentrion.webp',
    repo: 'https://github.com/BrunoMinhava/zentrion-crm',
    live: null,
  },
  {
    id: 'tercavia',
    index: '04',
    act: 'automation',
    scene: 'warehouse',
    cursor: 'scan',
    name: 'Tercavia',
    title: 'Tercavia Stock',
    tagline: 'Um scanner, vários armazéns',
    year: '2026',
    kind: 'Gestão de stock · demo pública',
    summary:
      'Gestão de stock e armazém para um distribuidor. Segue produtos por vários armazéns, regista cada entrada e saída por leitor de código de barras, imprime etiquetas térmicas e mostra ao administrador o que o stock vale.',
    detail:
      'Acesso por papéis: o administrador vê investimento e margem potencial, o funcionário vê só o que precisa para trabalhar. A importação de Excel foi feita para aguentar folhas de cálculo do mundo real, não folhas ideais.',
    highlights: [
      ['RBAC', 'admin vê finanças, staff vê operação'],
      ['Scanner', 'entradas e saídas sem tocar no teclado'],
      ['PDF', 'etiquetas normais e térmicas'],
    ],
    stack: ['Python', 'Flask', 'SQLite', 'openpyxl', 'ReportLab', 'JS vanilla'],
    shot: '/shots/tercavia.webp',
    repo: 'https://github.com/BrunoMinhava/tercavia-stock',
    live: null,
  },
  {
    id: 'neurovision',
    index: '05',
    act: 'ai',
    scene: 'brain',
    cursor: 'pulse',
    name: 'NeuroVision',
    title: 'NeuroVision',
    tagline: 'Um cérebro navegado por gestos e voz',
    year: '2026',
    kind: 'I&D · plataforma de imagem médica',
    summary:
      'Plataforma de interação com neuroanatomia 3D: 83 estruturas anatómicas independentes e 32 territórios arteriais, navegados por gestos das mãos e comandos de voz em português — sem rato, sem teclado.',
    detail:
      'As estruturas vêm de atlas neuroanatómicos publicados em espaço MNI, cada uma selecionável, ocultável e mensurável. Os volumes são calculados a partir dos voxels do atlas, não do render. Protótipo de investigação — não é um dispositivo médico certificado.',
    highlights: [
      ['83', 'estruturas anatómicas selecionáveis'],
      ['32', 'territórios arteriais mapeados'],
      ['PT', 'comandos de voz em português'],
    ],
    stack: ['Python', 'PySide6', 'VTK', 'MediaPipe', 'OpenCV', 'Reconhecimento de voz'],
    shot: '/shots/neurovision.webp',
    repo: 'https://github.com/BrunoMinhava/neurovision-ai',
    live: null,
  },
]

/** Ordem dos atos tal como aparecem no scroll. */
export const ACT_ORDER = ['web', 'automation', 'ai']

/** Projetos de um ato, pela ordem em que aparecem. */
export const projectsOfAct = (actId) => PROJECTS.filter((p) => p.act === actId)
