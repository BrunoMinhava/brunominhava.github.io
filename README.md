# Bruno Minhava — Portfólio

Portfólio pessoal em scroll contínuo: uma viagem cronológica por cinco projetos
reais do GitHub, agrupados em três atos. Sem páginas separadas — tudo é uma só
descida, com cenas 3D que se dissolvem umas nas outras.

**No ar:** <https://brunominhava.github.io>

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview
npm run lint
```

## A viagem

| Momento | Secção | Cena 3D |
|---|---|---|
| — | Cortina de entrada com contador | — |
| 00 | Intro — nome que cai e se abre em cortina | vidro iridescente com núcleo aceso |
| 01 | Sobre — as quatro palavras | fios que convergem e voltam a abrir |
| **Ato I** | Web | — |
| 02 | Wonderstatus.pt | captura do site em produção, num painel a flutuar |
| **Ato II** | Automação | — |
| 03 | Zentrion CRM | captura real + pipeline de impulsos por trás |
| 04 | Tercavia Stock | captura real + estante varrida por um feixe |
| **Ato III** | Inteligência Artificial | — |
| 05 | NeuroVision | captura real + nuvem de pontos por trás |
| 07 | Contacto | nenhuma — fundo claro, o contraste é o efeito |

Cada projeto mostra uma **captura real do produto a funcionar** num painel a
flutuar, com a sua assinatura abstrata a brilhar por trás. O `bandscore-ai` foi
deixado de fora por opção — ainda está cru — e o `AutoGenius` porque o
repositório está vazio.

## Como está organizado

```
src/
├── data/projects.js      ← ÚNICO sítio a editar para mudar conteúdo
├── lib/
│   ├── env.js            deteção de dispositivo, Safari e escalão de qualidade
│   ├── gsap.js           registo de plugins
│   ├── stage.js          ponte scroll ↔ 3D (objeto mutável, não estado React)
│   ├── cursor.js         modo do cursor por secção
│   ├── boot.js           portão: a intro só anima quando a cortina sobe
│   └── text.js           divisão de texto em letras
├── hooks/useMoment.js    transforma uma secção num "momento": carregamento
│                         preguiçoso da cena, dissolução, fixação, parallax
├── components/           Preloader, Cursor, HUD, Grain, Stage3D, Moment,
│                         ActMarker, Reveal
├── sections/             Intro, About, Contact
└── three/                uma cena por ficheiro + helpers partilhados
```

O ponto central é `lib/stage.js`. O ScrollTrigger escreve nele a cada frame e o
`useFrame` do R3F lê-o no mesmo ritmo — se isto passasse por `useState` seria um
re-render do React por cada frame de scroll.

## Editar o conteúdo

Tudo o que é texto, tecnologias, números e links está em
[`src/data/projects.js`](src/data/projects.js). Acrescentar um projeto é
acrescentar uma entrada ao array `PROJECTS`; o momento, o HUD e o cursor
constroem-se a partir dela.

**Por fazer:** o URL do LinkedIn em `PROFILE.linkedin` é um palpite —
confirmar e corrigir.

Para um projeto novo com cena 3D própria: criar `src/three/NovaCena.jsx` (usar
`useSceneFade('id', ref)`), registá-la no mapa `SCENES` de
[`src/components/Stage3D.jsx`](src/components/Stage3D.jsx) e pôr `scene: 'id'` no
projeto. Sem cena, `scene: null` — o momento funciona na mesma.

### As capturas

Estão em `public/shots/*.webp` e vêm de:

| Projeto | Origem |
|---|---|
| Wonderstatus | captura do **wonderstatus.pt em produção** |
| Zentrion | `docs/screenshots/dashboard.png` do repositório |
| Tercavia | `docs/screenshots/dashboard.png` do repositório |
| NeuroVision | `docs/imagens/01-cerebro-completo.png` do repositório |

Todas redimensionadas para 1600px de largura e convertidas para WebP q82 —
**248 kB no total**, contra 7,5 MB dos PNG originais. Para trocar uma, basta
substituir o ficheiro mantendo o nome; o painel adapta-se sozinho à proporção
da imagem.

## Linguagem visual

Está toda em [`src/index.css`](src/index.css) e não deve ser contornada com
valores avulsos nos componentes.

- **Escala tipográfica fechada** — `t-hero`, `t-display`, `t-heading`, `t-lead`,
  `t-body`, `t-note`, `t-micro`, `t-nano`, `t-stat`. Regra: quanto maior o
  corpo, mais apertado o espacejamento; as micro-etiquetas vão ao contrário.
  Não acrescentar `text-[clamp(...)]` — acrescentar um degrau à escala.
- **Uma família de curvas** — `--ease-smooth`, `--ease-swift`, `--ease-inout`.
  Tudo o que entra desacelera longo; só o que sai e volta usa a simétrica.
- **Um fio, uma opacidade** — `.hairline` / `.hairline-dark`. Um traço mais
  claro num sítio do que noutro sente-se sem se conseguir apontar.
- **Uma cor de destaque por ato**, e mais nenhuma.

O estúdio 3D ([`Stage3D.jsx`](src/components/Stage3D.jsx)) é iluminado por
`Lightformer` circulares dentro de um `Environment` cozinhado uma vez — dá aos
materiais físicos alguma coisa para refletir sem descarregar um HDRI de um CDN.
São círculos e não retângulos de propósito: numa esfera polida um retângulo
reflete-se como um retângulo e lê-se como autocolante, não como luz.

O bloom tem limiar de luminância alto: só o que é desenhado com
`toneMapped={false}` — o núcleo aceso, os impulsos do fluxo — o atravessa. Com
limiar baixo o campo de pó inteiro brilha e o resultado é purpurina.

## Desempenho

- **O three.js não entra no arranque.** Só é pedido no primeiro tempo morto do
  browser, depois de a intro já ter sido pintada. As letras caem em GSAP puro.
- **Uma cena = um chunk**, carregado quando a secção respetiva se aproxima e
  desmontado quando se afasta. Ao abrir a página carregam duas das sete.
- **Um draw call por campo.** Fios, sinapses, impulsos e caixas de armazém são
  cada um uma única geometria ou `InstancedMesh`.
- **Resolução adaptativa.** O escalão inicial vem de núcleos/memória; a partir
  daí o `PerformanceMonitor` mede a taxa real e baixa o DPR se ela ceder. Se
  continuar a ceder, o pós-processamento é a primeira coisa a cair.
- **O DPR está limitado a 1.4**, não ao valor do ecrã. Com uma passagem de bloom
  por frame o custo cresce com o quadrado do DPR, e num objeto em movimento a
  diferença entre 1.4 e 2 não se vê.
- **Sem `transmission` e sem aberração cromática.** A primeira obrigava o three
  a redesenhar a cena inteira para um render target a cada frame; a segunda
  custava uma passagem de ecrã inteiro por um efeito invisível.
- **O magnetismo mede em lote.** Ler `getBoundingClientRect` de cada link a
  cada `pointermove` forçava dezenas de recálculos de layout por segundo, e com
  o ScrollSmoother a transformar o conteúdo nenhum deles era reaproveitável.
  Agora são no máximo oito leituras por segundo e os eventos só fazem contas.
- **A cortina de entrada não é decoração:** tranca o scroll e só levanta com
  `document.fonts.ready`, o que evita a página abrir a meio de uma secção com
  as medidas ainda erradas.

Resultado: o arranque é DOM e GSAP; o three.js e o pós-processamento só chegam
depois da primeira pintura.

## Compatibilidade

| Situação | Comportamento |
|---|---|
| Desktop | experiência completa |
| Mobile / toque | sem scroll suave, sem fixação, sem cursor próprio, 3D centrado e menos denso, secções de altura normal |
| Safari | menos suavização (já tem inércia própria), sem `normalizeScroll`, sem `blur` pesado, `anticipatePin` desligado |
| `prefers-reduced-motion` | sem 3D, sem movimento, layout final imediato |
| Sem WebGL | o site funciona todo, apenas sem objetos 3D |

Tudo isto está decidido num sítio só: [`src/lib/env.js`](src/lib/env.js).

## Publicação

Está em GitHub Pages, publicado por
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): cada `push`
para `main` constrói o site e publica-o. Não há passo manual e não há pasta
`dist` no repositório.

O `base` do Vite fica em `/` porque este é o repositório pessoal
(`brunominhava.github.io`), servido na raiz do domínio. Se algum dia o site
mudar para um repositório com outro nome, é preciso pôr
`base: '/nome-do-repo/'` no `vite.config.js` — senão os ficheiros de `assets/`
deixam de ser encontrados.
