## Context

A página de status é servida como template Handlebars (`index.html`) com CSS (`default.css`) e JS (`app.js`) injetados inline por `middleware-wrapper.js`. O layout usa flexbox com containers repetidos (stats-column + chart-container) e já possui um breakpoint `@media (max-width: 600px)` em `default.css`. Chart.js está configurado com `responsive: true` e `maintainAspectRatio: false`.

O problema principal é a ausência da meta tag viewport no HTML, que impede o comportamento correto em dispositivos móveis. Problemas secundários incluem header com `float: right` nos controles de período, botões de período com área de toque pequena (~10px de fonte) e URLs longas nos health checks sem tratamento de overflow.

## Goals / Non-Goals

**Goals:**

- Página utilizável em viewports de 320px a 1920px sem scroll horizontal
- Gráficos Chart.js redimensionam corretamente em qualquer largura
- Header legível com título e controles de período acessíveis em mobile
- Health checks com URLs longas não quebram o layout
- Controles de período com área de toque adequada para telas touch (mínimo ~36px de altura)

**Non-Goals:**

- Redesign visual completo (cores, tipografia, branding)
- Suporte a dark mode
- PWA ou funcionalidades offline
- Alteração de dependências (Chart.js, Socket.io)
- Novos breakpoints para tablet além do existente (flex-wrap já cobre tamanhos intermediários)
- Alterações em `app.js` (Chart.js já está configurado corretamente)

## Decisions

### 1. Meta viewport no `index.html`

Adicionar `<meta name="viewport" content="width=device-width, initial-scale=1">` no `<head>`.

**Alternativa considerada:** CSS-only com `max-width` no body — rejeitada porque não corrige o viewport scaling dos navegadores mobile.

### 2. Header com flexbox em vez de float

Reestruturar o HTML do header com um wrapper flex e substituir `float: right` por `display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap`.

**Alternativa considerada:** Manter float e corrigir só no media query — rejeitada porque float é frágil e o media query atual apenas remove o float sem organizar o layout.

### 3. Touch targets nos span controls via CSS

Aumentar `padding` e `font-size` dos `<span>` de período no breakpoint mobile, e opcionalmente em todas as telas. Meta: altura mínima de ~36px (compromisso entre recomendação WCAG de 44px e densidade visual do dashboard).

**Alternativa considerada:** Converter spans em `<button>` — rejeitada para minimizar alterações em `app.js`, que cria os spans dinamicamente.

### 4. Overflow de URLs com CSS

Aplicar `overflow-wrap: break-word` e `word-break: break-all` (ou `break-word`) em `.health-check-title-column h5 a`.

**Alternativa considerada:** Truncar com ellipsis — rejeitada porque oculta informação útil em paths longos.

### 5. Padronizar atributos canvas no HTML

Uniformizar todos os `<canvas>` para `width="400" height="100"` (ou remover atributos e confiar só no CSS). Impacto cosmético — Chart.js com `responsive: true` já gerencia o tamanho real.

**Decisão:** Padronizar para consistência sem alterar comportamento.

### 6. Manter breakpoint único em 600px

O breakpoint existente em `default.css` é suficiente. Flex-wrap nos containers cobre tamanhos intermediários (tablet). Não adicionar breakpoints extras nesta mudança.

## Risks / Trade-offs

- **[Risco] Gráficos Chart.js com labels de tempo cortados em telas estreitas** → Mitigação: `maintainAspectRatio: false` já configurado; altura fixa de 100px no CSS mantém legibilidade
- **[Risco] Botões de período maiores ocupam mais espaço vertical no header mobile** → Mitigação: `flex-wrap` no header permite quebra natural; aceitável para usabilidade touch
- **[Risco] Tema customizado por consumidores da lib** → Mitigação: alterações são no `default.css` padrão; consumidores com tema próprio não são afetados
- **[Trade-off] Touch target de 36px vs 44px WCAG** → Compromisso de densidade visual; dashboard de monitoramento prioriza informação densa

## Migration Plan

1. Alterar `index.html` (viewport, header, canvas)
2. Alterar `default.css` (header flex, touch targets, overflow)
3. Testar manualmente em viewports 320px, 375px, 600px, 1024px e 1920px
4. Sem migração de dados, rollback ou feature flags necessários — mudança puramente front-end

## Open Questions

- Nenhuma pendente — escopo definido e abordagem direta
