# WoZ Admin Report Editor — Design Spec

**Data:** 2026-06-10  
**Status:** Aprovado  
**Escopo:** Wizard of Oz beta — acesso admin temporário para preencher report_data de projetos de clientes

---

## Contexto

Durante o beta "Wizard of Oz", o usuário (Elizeu) faz manualmente o trabalho que futuramente será feito pela IA. O cliente dispara a auditoria na plataforma normalmente; Elizeu preenche os resultados pelo painel admin; o cliente vê o relatório renderizado no EditorTab e ExportPage sem saber da diferença.

Esta feature é **temporária** — foi projetada para ser removida com 3 passos quando o n8n assumir o trabalho.

---

## Requisitos

- Elizeu acessa `/admin/:projectId` colando o ID do projeto na URL
- Somente o user_id de Elizeu pode acessar a rota — qualquer outro usuário é redirecionado para `/`
- A página carrega o EditorTab com o projeto buscado, reutilizando toda a UI de edição existente
- Nenhuma mudança no fluxo do cliente (EditorTab, ExportPage, StrategyRoom intocados)
- Fácil de remover: 1 arquivo + 1 rota + 1 SQL

---

## Arquitetura

### 1. Supabase — RLS Policy

```sql
CREATE POLICY "woz_admin_access" ON projects
FOR ALL
TO authenticated
USING (auth.uid() = 'ELIZEU_USER_ID')
WITH CHECK (auth.uid() = 'ELIZEU_USER_ID');
```

- Nome deliberado `woz_admin_access` para fácil identificação e remoção futura
- Substitui `ELIZEU_USER_ID` pelo UUID real do perfil de Elizeu no Supabase
- Não altera nenhuma policy existente de outros usuários

### 2. Variável de ambiente

Adicionar em `.env` e `.env.example`:

```
VITE_ADMIN_USER_ID=uuid-do-elizeu
```

Usado no componente para verificar identidade antes de qualquer fetch.

### 3. Componente `AdminReportEditor.jsx`

**Localização:** `src/components/AdminReportEditor.jsx`

**Responsabilidades:**
1. Ler `:projectId` de `useParams()`
2. Verificar `user.id === import.meta.env.VITE_ADMIN_USER_ID` → redireciona para `/` se falhar
3. Buscar projeto via `supabase.from('projects').select('id, name').eq('id', projectId).single()`
4. Renderizar `<EditorTab project={project} />` diretamente (sem layout, sem nav, sem estilos extras)
5. Estados: `loading` (spinner simples) e `error` (texto simples)

**Interface mínima:**
- Loading state: texto simples "Carregando..."
- Error/not found: texto simples "Projeto não encontrado."
- Success: apenas `<EditorTab project={project} />`

**O que NÃO tem:**
- Sidebar, navbar, header
- Estilos customizados além do mínimo para funcionar
- Lógica de negócio própria (toda ela fica no EditorTab)

### 4. Rota em `App.jsx`

```jsx
import AdminReportEditor from './components/AdminReportEditor';

// dentro do bloco de rotas autenticadas:
<Route path="/admin/:projectId" element={<AdminReportEditor />} />
```

A rota fica fora do `<Dashboard>` wrapper — não precisa de sidebar nem header do dashboard.

---

## Fluxo de uso (WoZ)

1. Cliente cria projeto, faz upload de arquivos, clica "Iniciar Auditoria IA"
2. Elizeu é notificado (via n8n, email, ou monitora o Supabase)
3. Elizeu pega o `project.id` (via Supabase dashboard ou URL do cliente)
4. Elizeu acessa `/admin/<project-id>` logado na própria conta
5. EditorTab carrega — Elizeu edita score, sumário, SWOT, riscos, plano, insights e salva
6. Cliente acessa EditorTab ou ExportPage e vê o relatório completo

---

## Remoção futura (quando n8n assumir)

```bash
# 1. Deletar o arquivo
rm src/components/AdminReportEditor.jsx

# 2. Remover a rota de App.jsx
# <Route path="/admin/:projectId" element={<AdminReportEditor />} />

# 3. Supabase SQL Editor
DROP POLICY woz_admin_access ON projects;

# 4. Remover do .env e .env.example
# VITE_ADMIN_USER_ID=...
```

---

## Arquivos modificados

| Arquivo | Tipo de mudança |
|---------|----------------|
| `src/components/AdminReportEditor.jsx` | Novo (descartável) |
| `src/App.jsx` | +1 Route, +1 import |
| `.env` | +1 variável `VITE_ADMIN_USER_ID` |
| `.env.example` | +1 variável (sem valor real) |
| Supabase | +1 RLS policy `woz_admin_access` |

---

## O que NÃO muda

- `EditorTab.jsx` — nenhuma alteração
- `ExportPage.jsx` — nenhuma alteração  
- `StrategyRoom/index.jsx` — nenhuma alteração
- `OverviewTab.jsx` — nenhuma alteração
- Schema do banco (`report_data` já existe em `projects`)
- RLS policies existentes de outros usuários
