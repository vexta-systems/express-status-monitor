## Why

A página de status do express-status-monitor não se comporta corretamente em dispositivos móveis porque falta a meta tag viewport — sem ela, navegadores mobile renderizam a página em largura de desktop (~980px) e ignoram os breakpoints CSS já existentes. Embora `default.css` já contenha regras responsivas parciais, a experiência mobile permanece incompleta: header com layout frágil (`float`), áreas de toque pequenas nos controles de período e URLs longas nos health checks podem estourar a largura da tela.

## What Changes

- Adicionar meta tag viewport no `<head>` de `index.html`
- Reestruturar o header para layout flexível (título + controles de período) em vez de `float`
- Melhorar áreas de toque dos botões de período (span controls) para uso em telas touch
- Tratar overflow de URLs longas nos health checks
- Padronizar atributos `width`/`height` dos elementos `<canvas>` no HTML
- Complementar regras CSS responsivas existentes (breakpoint mobile já presente; ajustes pontuais no header, touch targets e overflow)

## Capabilities

### New Capabilities

- `responsive-dashboard`: Layout responsivo da página de monitoramento de status, incluindo viewport, header flexível, gráficos adaptáveis, health checks legíveis e controles de período utilizáveis em mobile

### Modified Capabilities

_(nenhuma — não há specs existentes no projeto)_

## Impact

- `src/public/index.html` — meta viewport, reestruturação do header, padronização de canvas
- `src/public/stylesheets/default.css` — header flex, touch targets, overflow de URLs, ajustes no breakpoint mobile existente
- `src/public/javascripts/app.js` — sem alterações previstas (Chart.js já configurado com `responsive: true`)
- `src/middleware-wrapper.js` — sem alterações (continua injetando CSS e JS inline via Handlebars)
- Sem breaking changes em API, configuração ou dependências
