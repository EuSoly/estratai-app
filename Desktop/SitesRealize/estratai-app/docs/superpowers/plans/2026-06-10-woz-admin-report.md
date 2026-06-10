# WoZ Admin Report Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma rota admin temporária `/admin/:projectId` que permite ao Elizeu preencher o `report_data` de projetos de clientes reutilizando o EditorTab existente.

**Architecture:** Um novo componente `AdminReportEditor.jsx` faz a guarda de acesso por `user_id`, busca o projeto pelo ID da URL, e renderiza o `EditorTab` diretamente. Uma RLS policy no Supabase libera leitura/escrita de qualquer projeto para o user_id do admin. Nenhum arquivo existente além de `App.jsx` é modificado.

**Tech Stack:** React 19, react-router-dom v6, Supabase JS client, Vite env vars (`import.meta.env`)

---

## Estrutura de Arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `src/components/AdminReportEditor.jsx` | Criar (descartável) | Guarda de acesso + fetch do projeto + render do EditorTab |
| `src/App.jsx` | Modificar (+2 linhas) | Import + Route `/admin/:projectId` |
| `.env` | Modificar (+1 linha) | `VITE_ADMIN_USER_ID` com UUID real |
| `.env.example` | Modificar (+2 linhas) | Placeholder documentado |
| Supabase SQL | Executar manualmente | Policy `woz_admin_access` em `projects` |

---

## Task 1: Descobrir o UUID de Elizeu e adicionar variável de ambiente

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Encontrar o UUID no Supabase**

  Acesse o Supabase Dashboard → Authentication → Users.
  Copie o UUID da linha do email `elizeu.w.ruthes@gmail.com`.
  Formato esperado: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

- [ ] **Step 2: Verificar que .env existe**

  ```powershell
  Test-Path "C:\Users\Elize\Desktop\SitesRealize\estratai-app\.env"
  ```
  Esperado: `True`. Se `False`, copiar do exemplo: `cp .env.example .env` e preencher as vars do Supabase.

- [ ] **Step 3: Adicionar VITE_ADMIN_USER_ID ao .env**

  Adicionar ao final do `.env` (substituindo `SEU-UUID-AQUI` pelo UUID copiado):

  ```
  # ============================================================================
  # WOZ ADMIN — TEMPORÁRIO (remover quando n8n estiver ativo)
  # ============================================================================
  VITE_ADMIN_USER_ID=SEU-UUID-AQUI
  ```

- [ ] **Step 4: Adicionar placeholder ao .env.example**

  Adicionar ao final do `.env.example`:

  ```
  # ============================================================================
  # WOZ ADMIN — TEMPORÁRIO (remover quando n8n estiver ativo)
  # ============================================================================
  VITE_ADMIN_USER_ID=
  ```

- [ ] **Step 5: Commit**

  ```bash
  rtk git add .env.example
  rtk git commit -m "chore: add VITE_ADMIN_USER_ID placeholder for WoZ admin"
  ```
  Nota: `.env` não é commitado (está no `.gitignore`).

---

## Task 2: Criar RLS policy no Supabase

**Files:**
- Supabase SQL Editor (manual)

- [ ] **Step 1: Acessar o SQL Editor**

  Supabase Dashboard → SQL Editor → New query.

- [ ] **Step 2: Executar o SQL**

  Substituir `SEU-UUID-AQUI` pelo mesmo UUID da Task 1:

  ```sql
  CREATE POLICY "woz_admin_access"
  ON projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = 'SEU-UUID-AQUI'::uuid)
  WITH CHECK (auth.uid() = 'SEU-UUID-AQUI'::uuid);
  ```

- [ ] **Step 3: Verificar que a policy foi criada**

  Executar no mesmo SQL Editor:

  ```sql
  SELECT policyname, cmd, qual
  FROM pg_policies
  WHERE tablename = 'projects' AND policyname = 'woz_admin_access';
  ```

  Esperado: 1 linha com `policyname = woz_admin_access`.

---

## Task 3: Criar AdminReportEditor.jsx

**Files:**
- Create: `src/components/AdminReportEditor.jsx`

- [ ] **Step 1: Criar o arquivo**

  Criar `src/components/AdminReportEditor.jsx` com o seguinte conteúdo:

  ```jsx
  import React, { useState, useEffect } from 'react';
  import { useParams, useNavigate } from 'react-router-dom';
  import { supabase } from '../supabaseClient';
  import EditorTab from './StrategyRoom/EditorTab';

  const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;

  export default function AdminReportEditor() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'

    useEffect(() => {
      async function load() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== ADMIN_ID) {
          navigate('/');
          return;
        }

        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', projectId)
          .single();

        if (error || !data) {
          setStatus('error');
        } else {
          setProject(data);
          setStatus('ok');
        }
      }

      load();
    }, [projectId, navigate]);

    if (status === 'loading') return <p style={{ padding: 24 }}>Carregando...</p>;
    if (status === 'error')   return <p style={{ padding: 24 }}>Projeto não encontrado.</p>;

    return (
      <div style={{ padding: 24 }}>
        <EditorTab project={project} />
      </div>
    );
  }
  ```

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

  ```powershell
  Test-Path "C:\Users\Elize\Desktop\SitesRealize\estratai-app\src\components\AdminReportEditor.jsx"
  ```
  Esperado: `True`

- [ ] **Step 3: Commit**

  ```bash
  rtk git add src/components/AdminReportEditor.jsx
  rtk git commit -m "feat(woz): add admin report editor route [temporary]"
  ```

---

## Task 4: Registrar a rota em App.jsx

**Files:**
- Modify: `src/App.jsx:18` (bloco de imports)
- Modify: `src/App.jsx:149-152` (bloco de Routes, após a rota `/relatorio/:id`)

- [ ] **Step 1: Adicionar o import em App.jsx**

  Após a linha `import ExportPage from './components/StrategyRoom/ExportPage';` (linha 18), adicionar:

  ```jsx
  import AdminReportEditor from './components/AdminReportEditor';
  ```

- [ ] **Step 2: Adicionar a rota em App.jsx**

  Após o bloco da rota `/relatorio/:id` (linhas 149-152), antes do catch-all `path="*"`, adicionar:

  ```jsx
  {/* ROTA ADMIN WOZ — TEMPORÁRIA */}
  <Route
    path="/admin/:projectId"
    element={session ? <AdminReportEditor /> : <Navigate to="/" replace />}
  />
  ```

  O bloco de Routes deve ficar assim na região alterada:

  ```jsx
  {/* Página de exportação PDF — abre em nova aba a partir do EditorTab */}
  <Route
    path="/relatorio/:id"
    element={session ? <ExportPage /> : <Navigate to="/" replace />}
  />

  {/* ROTA ADMIN WOZ — TEMPORÁRIA */}
  <Route
    path="/admin/:projectId"
    element={session ? <AdminReportEditor /> : <Navigate to="/" replace />}
  />

  {/* Qualquer outra URL volta para a raiz */}
  <Route path="*" element={<Navigate to="/" replace />} />
  ```

- [ ] **Step 3: Verificar lint**

  ```bash
  npm run lint
  ```
  Esperado: sem erros. Se houver erro de import não usado, verificar se o import foi adicionado corretamente.

- [ ] **Step 4: Commit**

  ```bash
  rtk git add src/App.jsx
  rtk git commit -m "feat(woz): register /admin/:projectId route [temporary]"
  ```

---

## Task 5: Verificação manual

- [ ] **Step 1: Subir o servidor de desenvolvimento**

  ```bash
  npm run dev
  ```
  Acesse `http://localhost:5173`

- [ ] **Step 2: Teste de acesso admin**

  1. Faça login com a conta de Elizeu (`elizeu.w.ruthes@gmail.com`)
  2. No Supabase Dashboard, pegue o `id` de qualquer projeto em Authentication → Database → projects
  3. Acesse `http://localhost:5173/admin/<project-id>`
  4. Esperado: EditorTab carrega com o projeto, todos os campos editáveis visíveis

- [ ] **Step 3: Teste de bloqueio para não-admin**

  1. Faça logout
  2. Faça login com uma conta de cliente (outro email)
  3. Acesse `http://localhost:5173/admin/<qualquer-project-id>`
  4. Esperado: redirecionamento imediato para `/`

- [ ] **Step 4: Teste de edição e salvamento**

  1. Logado como Elizeu, acesse `/admin/<project-id>`
  2. Clique em "Editar" no EditorTab
  3. Altere o score para um valor diferente
  4. Clique em "Salvar"
  5. No Supabase Dashboard → Table Editor → projects, verifique que `report_data.score` foi atualizado
  6. Acesse `/relatorio/<project-id>` em nova aba — confirme que o score novo aparece no ExportPage

- [ ] **Step 5: Teste de ID inválido**

  1. Acesse `http://localhost:5173/admin/uuid-que-nao-existe`
  2. Esperado: texto "Projeto não encontrado."

---

## Remoção futura (checklist)

Quando o n8n assumir o trabalho da IA:

```bash
# 1. Deletar o componente
rm src/components/AdminReportEditor.jsx

# 2. Em src/App.jsx: remover o import e o bloco da Route /admin/:projectId

# 3. Em .env e .env.example: remover VITE_ADMIN_USER_ID

# 4. No Supabase SQL Editor:
DROP POLICY woz_admin_access ON projects;

# 5. Commit
rtk git add src/App.jsx .env.example
rtk git commit -m "chore: remove WoZ admin route and RLS policy"
```
