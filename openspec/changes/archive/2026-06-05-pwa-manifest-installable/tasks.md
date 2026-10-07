## 1. Configuração

- [x] 1.1 Adicionar `themeColor` e `backgroundColor` opcionais em `src/helpers/default-config.js` com valores padrão alinhados ao tema escuro
- [x] 1.2 Validar `themeColor` e `backgroundColor` em `src/helpers/validate.js` (string hex `#RRGGBB` ou omitido)

## 2. Assets PWA

- [x] 2.1 Criar template `src/public/manifest.webmanifest` com placeholders Handlebars (name, short_name, start_url, scope, display, icons, theme_color, background_color, description)
- [x] 2.2 Criar ícones PNG em `src/public/icons/icon-192.png` e `src/public/icons/icon-512.png`

## 3. Entrega HTTP no middleware

- [x] 3.1 Compilar template do manifest em `middleware-wrapper.js` junto aos demais assets
- [x] 3.2 Adicionar handler para GET `{path}/manifest.webmanifest` com `Content-Type: application/manifest+json`
- [x] 3.3 Adicionar handlers para GET `{path}/icons/icon-192.png` e `{path}/icons/icon-512.png` com `Content-Type: image/png`
- [x] 3.4 Passar `manifestPath`, `themeColor` e dados PWA ao template HTML via objeto `data`

## 4. Metadados HTML

- [x] 4.1 Adicionar `<link rel="manifest">` em `src/public/index.html` apontando para o manifest
- [x] 4.2 Adicionar `<meta name="theme-color">` em `src/public/index.html`
- [x] 4.3 Adicionar `<link rel="apple-touch-icon">` e `<meta name="mobile-web-app-capable" content="yes">` em `src/public/index.html`

## 5. Verificação

- [x] 5.1 Verificar no Chrome DevTools (Application → Manifest) que o manifest é válido e ícones carregam
- [x] 5.2 Testar com `path` customizado (ex.: `/monitor`) — manifest, ícones e links HTML usam o path correto
- [x] 5.3 Testar "Adicionar à tela inicial" em dispositivo mobile ou emulação mobile
- [x] 5.4 Executar auditoria Lighthouse PWA e confirmar critérios de manifest atendidos
