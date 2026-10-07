## Why

A página de status do express-status-monitor não pode ser instalada como aplicativo no dispositivo do usuário porque não possui Web App Manifest nem os metadados HTML associados. Em dispositivos móveis e desktop, isso impede o atalho nativo "Instalar app" / "Adicionar à tela inicial", reduzindo a conveniência de monitoramento — especialmente relevante após as melhorias de layout mobile já em andamento.

## What Changes

- Criar `manifest.webmanifest` com campos obrigatórios e recomendados (name, short_name, start_url, scope, display, icons, theme_color, background_color, description)
- Adicionar ícones PNG nos tamanhos 192×192 e 512×512 exigidos para instalabilidade
- Vincular o manifest e metadados PWA no `<head>` de `index.html` (`<link rel="manifest">`, `theme-color`, `apple-touch-icon`)
- Expor rota no middleware para servir o manifest e os ícones estáticos com `Content-Type` correto
- Gerar `name`, `short_name` e `start_url` dinamicamente a partir da configuração existente (`title`, `path`)

## Capabilities

### New Capabilities

- `pwa-manifest`: Manifest web, ícones, metadados HTML e entrega HTTP necessários para tornar a página de status instalável como PWA

### Modified Capabilities

_(nenhuma — não há specs existentes no projeto)_

## Impact

- `src/public/manifest.webmanifest` — template Handlebars do manifest
- `src/public/icons/` — ícones PNG 192×192 e 512×512
- `src/public/index.html` — tags `<link>` e `<meta>` para PWA
- `src/middleware-wrapper.js` — rotas para servir manifest e ícones
- `src/helpers/default-config.js` e `src/helpers/validate.js` — opções opcionais de personalização (theme_color, background_color)
- Sem breaking changes na API pública; novas rotas são aditivas sob o `path` configurado
- HTTPS continua sendo requisito de deploy (fora do escopo do pacote npm)
