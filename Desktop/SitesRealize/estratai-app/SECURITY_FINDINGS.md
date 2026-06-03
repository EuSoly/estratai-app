# EstratAI Security & Correctness Findings
> Gerado em: 2026-06-03 | Code Review: max-effort 9-angle analysis

## 🔴 CRÍTICAS (Fix Imediatamente)

### 1. Supabase Publishable Key Hardcoded
- **Arquivo:** `src/supabaseClient.js:5`
- **Severidade:** 🔴 CRÍTICA
- **Problema:** Chave pública do Supabase hardcoded em source code
- **Cenário de Falha:** Se repositório vaza, atacante pode impersonar usuários via API Supabase
- **Fix:** Mover para variáveis de ambiente (.env)
- **Status:** ✅ CORRIGIDO

### 2. FileExplorerModal Sem Filtro de Project
- **Arquivo:** `src/components/StrategyRoom/ContextGravity/modals/FileExplorerModal.jsx:23`
- **Severidade:** 🔴 CRÍTICA (Data Leakage)
- **Problema:** Query de vault_items filtra por user_id apenas, não por project_id
- **Cenário de Falha:** Usuário vê todos os arquivos de todos os projetos, não apenas os do projeto atual
- **Fix:** Adicionar filtro `AND project_files.project_id = ?` ou verificação em cliente
- **Status:** ✅ CORRIGIDO

### 3. Webhook n8n Sem Error Handling
- **Arquivo:** `src/components/StrategyRoom/OverviewTab.jsx:94`
- **Severidade:** 🔴 CRÍTICA (Silent Failure)
- **Problema:** Fetch para webhook não trata erros de rede/CORS
- **Cenário de Falha:** Análise falha silenciosamente sem feedback ao usuário
- **Fix:** Adicionar try-catch e feedback visível
- **Status:** ✅ CORRIGIDO

---

## 🟠 ALTAS (Fix Esta Sprint)

### 4. Off-by-One em Cálculo de Ângulo
- **Arquivo:** `src/components/StrategyRoom/ContextGravity/index.jsx:49`
- **Severidade:** 🟠 ALTA
- **Problema:** Usa `data.length` (pré-filtro) em vez de `filtered.length` para posicionar nós
- **Cenário de Falha:** Quando há project_files com vault_items null, ângulo está incorreto
- **Fix:** Usar `filtered.length` após filtrar dados órfãos
- **Prioridade:** Sprint 1

### 5. toggleSelectAll com Comparação de Tamanho
- **Arquivo:** `src/components/dashboard/DashboardInjection.jsx:70`
- **Severidade:** 🟠 ALTA
- **Problema:** `selectedIds.length === currentLevelIds.length` não valida igualdade de itens
- **Cenário de Falha:** Diferentes arquivos podem estar selecionados mas length ser igual
- **Fix:** Comparar com Set ou array sorting
- **Prioridade:** Sprint 1

### 6. Navegação Durante Render
- **Arquivo:** `src/components/dashboard/Dashboard.jsx:43`
- **Severidade:** 🟠 ALTA
- **Problema:** `<Navigate>` retornado dentro de renderContent() durante render
- **Cenário de Falha:** React warning, state consistency issues
- **Fix:** Mover para useEffect com navigate()
- **Prioridade:** Sprint 1

### 7. .single() Sem Try-Catch
- **Arquivo:** `src/components/dashboard/DashboardOverview.jsx:67`
- **Severidade:** 🟠 ALTA
- **Problema:** supabase.from().select().single() lança exceção se 0 ou >1 rows
- **Cenário de Falha:** Dados corrompidos (múltiplas map_settings por user) quebra componente
- **Fix:** Adicionar try-catch ou validação de contagem
- **Prioridade:** Sprint 1

### 8. Acesso a project.id Sem Null Check
- **Arquivo:** `src/components/StrategyRoom/EditorTab.jsx:180`
- **Severidade:** 🟠 ALTA
- **Problema:** project pode ser undefined, mas project.id é acessado
- **Cenário de Falha:** F5 refresh = project undefined → TypeError
- **Fix:** Validar project antes de acessar propriedades
- **Prioridade:** Sprint 1

### 9. Refetch Infinito Sem Debounce
- **Arquivo:** `src/components/StrategyRoom/ContextGravity/modals/FileExplorerModal.jsx:15`
- **Severidade:** 🟠 ALTA (Performance/DOS)
- **Problema:** searchQuery no dependency array dispara fetch a cada keystroke
- **Cenário de Falha:** Alto carregamento de banco de dados, possível DOS
- **Fix:** Debounce de 300ms ou useDeferredValue
- **Prioridade:** Sprint 1

### 10. Orphaned Record Undefined
- **Arquivo:** `src/components/dashboard/DashboardInjection.jsx:152`
- **Severidade:** 🟠 ALTA
- **Problema:** item.type sem validar que item existe (find() pode retornar undefined)
- **Cenário de Falha:** Registro órfão → TypeError ao reconstruir filename
- **Fix:** Adicionar null check após find()
- **Prioridade:** Sprint 1

---

## 🟡 MÉDIAS (Backlog)

### 11. alert() Bloqueável por Browser
- **Arquivo:** `src/components/Auth/AuthScreen.jsx:37,92,102,119`
- **Severidade:** 🟡 MÉDIA (UX)
- **Problema:** alert() pode ser bloqueado por browser security policies
- **Cenário de Falha:** Usuário não vê notificação de sucesso/erro
- **Fix:** Implementar toast notification system
- **Prioridade:** Backlog

### 12. useEffect com Dependency Incompleta
- **Arquivo:** `src/components/StrategyRoom/ContextGravity/index.jsx:18`
- **Severidade:** 🟡 MÉDIA
- **Problema:** projectId no dependency, mas não validado ser truthy antes de fetch
- **Cenário de Falha:** Fetch desnecessário se projectId é null/undefined
- **Fix:** Adicionar guard `if (!projectId) return`
- **Prioridade:** Backlog

### 13. Profile Null Handling
- **Arquivo:** `src/App.jsx:88`
- **Severidade:** 🟡 MÉDIA
- **Problema:** Se profile retorna null, data?.plan funciona mas é frágil
- **Cenário de Falha:** Data integrity issue silencioso
- **Fix:** Validar data existe antes de acessar
- **Prioridade:** Backlog

### 14. Silent Redirect Sem Feedback
- **Arquivo:** `src/components/StrategyRoom/index.jsx:43`
- **Severidade:** 🟡 MÉDIA (UX)
- **Problema:** F5 redireciona para /dashboard sem explicação
- **Cenário de Falha:** Usuário perde contexto sem aviso
- **Fix:** Toast "Sessão perdida" ou redirecionar após confirmar
- **Prioridade:** Backlog

---

## Rastreamento de Correções

| ID | Arquivo | Status | Data | Commit |
|:--:|----------|:------:|------|--------|
| 1 | supabaseClient.js | ✅ | 2026-06-03 | `fix: move supabase key to env` |
| 2 | FileExplorerModal.jsx | ✅ | 2026-06-03 | `fix: add project_id filter` |
| 3 | OverviewTab.jsx | ✅ | 2026-06-03 | `fix: add try-catch to webhook` |
| 4 | ContextGravity/index.jsx | ⏳ | - | - |
| 5 | DashboardInjection.jsx | ⏳ | - | - |
| 6 | Dashboard.jsx | ⏳ | - | - |
| 7 | DashboardOverview.jsx | ⏳ | - | - |
| 8 | EditorTab.jsx | ⏳ | - | - |
| 9 | FileExplorerModal.jsx | ⏳ | - | - |
| 10 | DashboardInjection.jsx | ⏳ | - | - |
| 11 | AuthScreen.jsx | 📋 | - | - |
| 12 | ContextGravity/index.jsx | 📋 | - | - |
| 13 | App.jsx | 📋 | - | - |
| 14 | StrategyRoom/index.jsx | 📋 | - | - |

---

## Como Usar Este Arquivo

- **Sprint Planning:** Usar IDs 4-10 para próximos sprints
- **Backlog:** IDs 11-14 para quando tiver capacidade
- **Referência:** Atualizar Status conforme correções forem feitas
- **CI/CD:** Considerar adicionar checks automáticos para evitar regressões
