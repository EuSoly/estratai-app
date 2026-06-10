# PDF Print Styles — Design Spec

**Data:** 2026-06-10  
**Status:** Aprovado  
**Escopo:** Melhorar o PDF exportado pelo ExportPage — fundo branco, texto legível, layout A4 limpo

---

## Contexto

O ExportPage usa `window.print()` para gerar PDFs. Atualmente o `@media print` mantém o fundo escuro (`#0A0A0A`) e toda a paleta brutalista dark, resultando em um PDF com fundo preto. O cliente quer um PDF limpo com fundo branco, mantendo o visual brutalista apenas na tela.

---

## Requisitos

- Preview na tela: **inalterado** (continua dark)
- PDF impresso: fundo branco, texto escuro, bordas cinza claro
- Cores de significado (score, SWOT, severidade de risco) preservadas no PDF
- Marca visual da EstratAI preservada (roxo `#842CD5` em labels e cabeçalho)
- Layout A4 com margens adequadas e borda fina ao redor da página
- **Arquivo afetado:** apenas `src/components/StrategyRoom/ExportPage.jsx` — somente o bloco `<style>`

---

## Especificação de Cores para Impressão

### Backgrounds (todos → branco)
| Classe / Elemento | Valor print |
|-------------------|-------------|
| `bg-[#0A0A0A]`, `bg-[#101010]`, `bg-[#050505]`, `bg-[#1a1a1a]` | `#FFFFFF` |
| `body` | `#FFFFFF` |
| Score bar track (`bg-[#1a1a1a]`) | `#e5e7eb` |
| Tints de severidade de risco (`rgba(...)`) | `#FFFFFF` (aceitável — badge preserva severidade) |

### Texto (escala legível em papel)
| Classe | Valor print |
|--------|-------------|
| `text-[#F2EFE9]` (texto principal) | `#111111` |
| `text-[#A3A3A3]` (texto secundário) | `#444444` |
| `text-[#737373]` (muted) | `#555555` |
| `text-[#525252]` (muito muted) | `#777777` |

### Bordas
| Classe | Valor print |
|--------|-------------|
| `border-[#262626]`, outras bordas escuras | `#d1d5db` |

### Número decorativo do Plano de Ação
| Elemento | Valor print |
|----------|-------------|
| `text-[#262626]` (número serif grande) | `#e5e7eb` (ghost decorativo no branco) |

---

## Cores Preservadas

Estas cores sobrevivem **sem nenhuma regra CSS** porque estão em `style={}` inline (especificidade natural vence seletores):

| Elemento | Por quê sobrevive |
|----------|-------------------|
| Score (verde/amarelo/vermelho) | `style={{ color }}` inline |
| SWOT borderLeft accent | `style={{ borderLeftColor: accent }}` inline |
| SWOT ícone e label | `style={{ color: accent }}` inline |
| Risk badge cor + borda | `style={{ color: cfg.color, border }}` inline |

Estas precisam de regra CSS específica para sobreviver (seriam resetadas pelo blanket `!important`):

| Elemento | Seletor CSS necessário |
|----------|------------------------|
| Barra roxa `▌` do SectionLabel | `[data-section-bar]` ou regra por `w-1 h-4 bg-\[var\(--color-plan\)\]` |
| Label "Relatório Estratégico" roxo | Regra para `text-[var(--color-plan)]` no cabeçalho |

**Implementação prática:** em vez de seletores complexos para as vars CSS, usar a abordagem de NÃO resetar `color` com `!important` — só resetar `background-color`. Assim inline styles de texto sobrevivem naturalmente, e as classes Tailwind de texto são sobrescritas por seletores de maior especificidade.

---

## Layout da Página

```css
@page {
  size: A4;
  margin: 15mm;
}
```

- Borda fina preta (`1px solid #222`) ao redor do `.print-main` — reproduz o mockup
- `.print-main { padding: 24px !important; }` — espaço interno mínimo

---

## Estratégia CSS

1. **Backgrounds:** `background-color: white !important` amplo (sobrescreve Tailwind + inline)
2. **Texto:** seletores de especificidade maior (`.print-main .text-[...]`) SEM `!important` — assim inline color styles ganham automaticamente
3. **Bordas:** mesmo approach do texto
4. **CSS vars (`--color-plan`):** os elementos que usam `var(--color-plan)` em `bg-*` serão brancos (ok — barra decorativa some); os que usam em `text-*` preservam o roxo (sem !important)

---

## Arquivo Modificado

| Arquivo | Mudança |
|---------|---------|
| `src/components/StrategyRoom/ExportPage.jsx` | Substituir bloco `<style>` existente por versão expandida com print CSS completo |
