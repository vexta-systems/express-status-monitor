## 1. Alterações no HTML

- [x] 1.1 Adicionar `<meta name="viewport" content="width=device-width, initial-scale=1">` no `<head>` de `src/public/index.html`
- [x] 1.2 Reestruturar o `.header` com wrapper flex (ex.: `.header-title` + `.span-controls`) em `src/public/index.html`
- [x] 1.3 Padronizar atributos `width="400" height="100"` em todos os elementos `<canvas>` de `src/public/index.html`

## 2. Alterações no CSS

- [x] 2.1 Substituir `float: right` do `.span-controls` por layout flex no `.header` em `src/public/stylesheets/default.css`
- [x] 2.2 Aumentar área de toque dos span controls no breakpoint mobile (padding e font-size para altura mínima de 36px) em `src/public/stylesheets/default.css`
- [x] 2.3 Adicionar `overflow-wrap: break-word` em `.health-check-title-column h5 a` em `src/public/stylesheets/default.css`
- [x] 2.4 Revisar e ajustar regras existentes do breakpoint `@media (max-width: 600px)` para compatibilidade com o novo header flex

## 3. Verificação

- [x] 3.1 Testar layout em viewport 320px — sem scroll horizontal, containers empilhados, gráficos redimensionados
- [x] 3.2 Testar layout em viewport 375px — header legível, controles de período tocáveis
- [x] 3.3 Testar layout em viewport 600px (limite do breakpoint) — transição correta entre layouts mobile e desktop
- [x] 3.4 Testar layout em viewport 1024px e 1920px — layout lado a lado preservado
- [x] 3.5 Testar health check com URL longa (>50 caracteres) em mobile — texto quebra sem overflow
