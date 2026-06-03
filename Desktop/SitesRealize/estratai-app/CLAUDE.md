# EstratAI — Contexto do Projeto para Claude Code
> Última atualização: 2026-06-02 (sessão 6)

## Visão Geral
SaaS de inteligência estratégica. O usuário cria "projetos de consultoria", injeta documentos como contexto (vault), visualiza arquivos em uma arena gravitacional interativa e aciona agentes de IA para análise estratégica.



## Stack
- **Frontend:** React 19 + Vite 8, Framer Motion 12, Tailwind CSS 4, Lucide React
- **Roteamento:** react-router-dom v6 (BrowserRouter em main.jsx)
- **Backend/DB:** Supabase (auth + Postgres + RLS)

## ⚠️ Regra crítica — lucide-react
A versão instalada (`^1.8.0`) **não tem ícones de marca/redes sociais** (Linkedin, Instagram, Twitter).
Antes de usar um ícone novo: `node -e "const l = require('./node_modules/lucide-react'); console.log(!!l.NomeIcone)"`
Ícones seguros confirmados: Mail, Globe, ExternalLink, Plus, X, Lock, ArrowLeft/Right, Check, Zap, etc.
Usar ícone inexistente causa **tela branca** (React tenta renderizar `undefined` como componente).

## Estrutura de Pastas
```
src/
  App.jsx                          # Auth state (onAuthStateChange) + Routes
  main.jsx                         # BrowserRouter wrapping
  supabaseClient.js                # Cliente Supabase singleton
  utils/animations.js              # Variantes Framer Motion reutilizáveis
  components/
    Auth/AuthScreen.jsx            # Modal login/signup (sem bypass, cria profile no login)
    LandingPage/                   # Navbar, Hero, Ecosystem, Manifesto, HowItWorks,
                                   # Pricing, AuditTerminal, Footer
    dashboard/
      Dashboard.jsx                # Shell: sidebar + routing por URL (useNavigate/useLocation)
      DashboardOverview.jsx        # Visão Geral + mapa DNA
      DashboardInjection.jsx       # Cofre de Dados: upload/CRUD (size em bytes)
      DashboardAgents.jsx          # Matriz de Agentes com gating por plano
      DashboardStrategyRoom.jsx    # Re-exporta StrategyRoom/index.jsx
      CompanyDNAMap.jsx            # Mapa drag-and-drop dos projetos
      modals/                      # ModalCoreDNA, ModalManageFiles,
                                   # ModalDelete, ModalCreateProject
    StrategyRoom/
      index.jsx                    # Shell da Sala: abas com gating de plano
      OverviewTab.jsx              # Agentes + estratégia + webhook n8n
      EditorTab.jsx                # Relatório IA com mock data estruturado
      ContextFilesTab.jsx          # Lista de arquivos vinculados
      ContextGravityTab.jsx        # Wrapper da aba gravitacional
      ContextGravity/
        index.jsx                  # Orquestrador (fetch, drag persist, modal wiring)
        GravityArena.jsx           # Canvas livre com anel de influência + campo gravitacional
        GravityHeader.jsx          # Toolbar: "Vincular Arquivos" + refresh
        modals/NodeConfigModal.jsx # Customização do nó (ícone, cor, intent)
        modals/FileExplorerModal.jsx
```

## Rotas
| URL | O que renderiza | Proteção |
|-----|----------------|----------|
| `/` | LandingPage | pública (sempre acessível) |
| `/dashboard` | Dashboard → DashboardOverview | sessão obrigatória |
| `/dashboard/dados` | Dashboard → DashboardInjection | sessão obrigatória |
| `/dashboard/agentes` | Dashboard → DashboardAgents | sessão obrigatória |
| `/dashboard/estrategia/:id` | Dashboard → StrategyRoom | sessão + `location.state.project` |

Sem `location.state.project` (ex: F5 na sala) → redireciona para `/dashboard`.

## Auth — persistência de sessão
- `App.jsx` usa `supabase.auth.getSession()` na carga + `onAuthStateChange` para manter sessão
- Usuário logado acessando `/` → Navbar mostra "Ir ao Painel" (não redireciona automaticamente)
- Login: busca `profiles.plan`; se não existir, cria `{ id, plan: 'Starter' }` automaticamente
- Logout: `supabase.auth.signOut()` + `navigate('/')`

## Hierarquia de Planos
```js
const PLAN_LEVELS = { 'Starter': 1, 'Business': 2, 'Enterprise': 3 }
// Definida em múltiplos arquivos — extrair para src/constants/plans.js (pendente)
```

## Gating da Sala de Estratégia
| Aba | Starter | Business+ |
|-----|---------|-----------|
| Sala de Controle (OverviewTab) | ✅ agentes bloqueados por plan_required | ✅ |
| Cofre de Contexto (ContextGravity) | 🔒 PlanLockScreen | ✅ |
| Editor Neural (EditorTab) | 🔒 PlanLockScreen | ✅ |

## Tabelas Supabase
| Tabela | Campos relevantes |
|--------|------------------|
| `profiles` | `id` (FK→auth.users), `plan` |
| `projects` | `id`, `name`, `agent_id`, `user_id`, `created_at`, `report_data` (JSON), `company_strategy`, `status` |
| `vault_items` | `id`, `name`, `type`, `size` (bytes, integer), `parent_id`, `user_id` |
| `project_files` | `project_id`, `file_id`, `user_id`, `weight`, `x`, `y`, `intent`, `custom_icon`, `custom_color`, `tag_weight` |
| `map_settings` | `user_id` (unique), `positions` (JSON), `core_name`, `strategy_text`, `linked_files`, `updated_at` |
| `agents` | `id`, `name`, `description`, `icon_name`, `plan_required`, `is_active` |

## ContextGravity — arquitetura atual
- **Movimento livre** — sem snap-to-orbit, sem órbitas fixas
- **Anel de influência**: SVG `viewBox="0 0 48 48" overflow="visible"`, `r=26`, preenche proporcionalmente à distância do centro (`MAX_DIST=360`)
- **Campo gravitacional**: gradiente radial + 3 anéis concêntricos crescentes (72px→138px→210px)
- **Aura por intent**: `box-shadow` — verde/bom, vermelho/ruim, cor custom, neutro
- **Ícones**: `ICON_LIBRARY[customIcon] || ICON_LIBRARY[type] || FileText`
- **Context menu**: `position: fixed` com `e.clientX/clientY`
- **NodeConfigModal**: `customIcon`/`customColor` (camelCase), `onSubmit` → `onSave(file)` com `e.preventDefault()`

## EditorTab — estrutura do report_data
O n8n deve salvar em `projects.report_data`:
```json
{
  "generatedAt": "ISO 8601",
  "agentName": "string",
  "score": 0-100,
  "executiveSummary": "string",
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "risks": [
    { "id": 1, "severity": "critical|high|medium|low", "title": "string", "description": "string" }
  ],
  "actionPlan": [
    { "priority": 1, "action": "string", "deadline": "string", "owner": "string" }
  ],
  "insights": ["string"]
}
```
Se `report_data` estiver vazio, EditorTab carrega `MOCK_REPORT` automático para visualização.

---

## Design System — Identidade Visual Brutalista

### Paleta (dark mode)
```
Fundo principal:  #0A0A0A   Fundo card:       #101010
Fundo sidebar:    #050505   Borda padrão:     #262626
Destaque/CTA:     #842CD5   Texto principal:  #F2EFE9
Hover escuro:     #710CCD   Texto secundário: #A3A3A3
```

### Paleta (light mode — lavanda sutil)
```
Fundo principal:  #FCF8FF   Fundo card:       #FFFFFF
Fundo sidebar:    #F3ECFF   Borda padrão:     #E4DAF5
Inputs/autofill:  #FFFFFF   Hover elevado:    #F7F2FF
```

### Cores de plano
```
Starter:    #842CD5 (roxo)        hover: #710CCD
Business:   #4B37D8 (índigo)
Enterprise: #DD20AE (pink)
```

### Tipografia
- Títulos: `font-serif font-black uppercase` — terminam com ponto final
- Labels/botões: `font-mono text-[10px] uppercase tracking-widest`
- Scores/números: `font-serif text-8xl font-black leading-none`

### Padrões de UI (ver ui-estratai.md para detalhes)
- **SectionLabel**: barra roxa `w-1 h-4 bg-[#842CD5]` + label mono
- **PlanLockScreen**: lock icon + mensagem + CTA upgrade
- **ScoreBar**: número serif grande + Framer Motion barra animada
- **SWOT Grid**: 2×2, borderLeft colorido por quadrante
- **Risk Badges**: SEVERITY_CONFIG com cor/bg/ícone por criticidade
- **Auras**: box-shadow por intent (good/bad/custom/neutral)

---

## ContextGravity — estado atual
- Movimento livre (sem órbitas/snap)
- Anel de influência: SVG `viewBox="0 0 48 48" overflow="visible"`, r=26
- Linhas de conexão ao núcleo: SVG overlay animado (`flowToNucleus` keyframe), opacidade/espessura proporcional à influência
- Campo gravitacional: gradiente radial + 3 anéis concêntricos (72→138→210px)
- Aura por intent: box-shadow colorido (green/red/custom/neutral)
- Tooltip: nome + "XX% influência"
- NodeConfigModal: usa `useState` local (não depende de `onChange` externo)

## Footer (Landing Page)
- 4 colunas: Brand, Produto, Legal, Contato
- Links legais com `href="#"` — precisam de rotas reais (`/termos`, `/privacidade`)
- Ícones: Globe, ExternalLink, Mail (Linkedin/Instagram não existem nesta versão do lucide-react)

## Próximas tarefas sugeridas
- Criar páginas de Termos de Uso e Política de Privacidade
- Conectar webhook n8n com a estrutura de `report_data` definida no EditorTab
- Corrigir bugs pendentes de dados órfãos (project_files sem CASCADE)
- Extrair `PLAN_LEVELS` para `src/constants/plans.js`

## Bugs Pendentes (ainda não corrigidos)
1. Deleção de projeto não limpa `project_files` (sem CASCADE confirmado)
2. Deleção de vault item não limpa `project_files.file_id`
3. `PLAN_LEVELS` duplicado em 3+ arquivos → extrair para constants
4. `toggleSelectAll` em DashboardInjection compara lengths em vez de conjuntos
5. Ângulo inicial de nós usa `data.length` pré-filtro em vez de `filtered.length`
6. Links legais do Footer apontam para `#`

## Comandos
```bash
npm run dev    # servidor Vite
npm run build  # build de produção (sem erros atualmente)
npm run lint   # ESLint
```

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->