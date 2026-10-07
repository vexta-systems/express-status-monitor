## Context

A página de status é servida exclusivamente pelo middleware em `middleware-wrapper.js`, que intercepta requisições no `path` configurado (padrão `/status`) e renderiza `index.html` via Handlebars com CSS/JS inline. Não há servidor de arquivos estáticos embutido — assets em `src/public/` são lidos em tempo de build/boot e injetados no HTML, não expostos como URLs públicas.

Para PWA, o navegador precisa buscar o manifest e os ícones por URL. O manifest deve refletir o `path` e o `title` configuráveis pelo consumidor da biblioteca.

## Goals / Non-Goals

**Goals:**

- Manifest válido conforme [W3C Web App Manifest](https://www.w3.org/TR/appmanifest/) e critérios de instalabilidade dos navegadores
- `start_url` e `scope` alinhados ao `path` da configuração
- Ícones nos tamanhos mínimos 192×192 e 512×512 com `purpose: "any"` (e opcionalmente `"maskable"`)
- Manifest e ícones servidos com MIME types corretos (`application/manifest+json`, `image/png`)
- Metadados HTML complementares: `theme-color`, `apple-touch-icon`, `mobile-web-app-capable`
- Compatível com `pageRoute` separado do middleware (mesmo render de dados)

**Non-Goals:**

- Service worker e cache offline (requisito adicional do Chrome para prompt de instalação, mas fora do escopo desta mudança focada em manifest)
- Push notifications ou background sync
- Personalização avançada de ícones por consumidor (ícones padrão do pacote; override futuro via config)
- Geração automática de ícones a partir de upload do usuário
- Suporte a `prefer_related_applications` ou stores nativas

## Decisions

### 1. Arquivo `manifest.webmanifest` como template Handlebars

Criar `src/public/manifest.webmanifest` com placeholders `{{title}}`, `{{shortName}}`, `{{startUrl}}`, `{{scope}}`, `{{themeColor}}`, `{{backgroundColor}}`, `{{description}}`.

**Alternativa considerada:** JSON estático — rejeitada porque `path` e `title` são configuráveis.

### 2. Rotas derivadas do `path` configurado

Servir o manifest em `${path}/manifest.webmanifest` e ícones em `${path}/icons/icon-192.png` e `${path}/icons/icon-512.png`.

Exemplo com `path: '/status'`:
- `/status` → página HTML
- `/status/manifest.webmanifest` → manifest
- `/status/icons/icon-192.png` → ícone

**Alternativa considerada:** Manifest na raiz (`/manifest.webmanifest`) — rejeitada porque consumidores podem montar o monitor em paths arbitrários e o `scope` ficaria inconsistente.

### 3. `scope` igual ao `path` com barra final

Definir `scope` como o `path` garantindo barra final (ex.: `/status/`). `start_url` aponta para o `path` sem sufixo adicional.

**Alternativa considerada:** `scope: "/"` — rejeitada porque incluiria toda a aplicação host, não só o dashboard.

### 4. Ícones PNG embutidos no pacote

Incluir dois PNGs simples em `src/public/icons/` com visual neutro alinhado ao dashboard (fundo escuro, símbolo de monitor/status). Sem dependência de ferramentas de build para gerar ícones.

**Alternativa considerada:** SVG único — rejeitada porque o manifest exige PNG nos tamanhos especificados para instalabilidade universal.

### 5. Configuração opcional de cores

Estender config com campos opcionais:

```javascript
themeColor: '#1a1a2e',
backgroundColor: '#1a1a2e',
```

Valores padrão derivados do tema `default.css` (fundo escuro existente). Validação em `validate.js` aceita strings hex `#RRGGBB`.

**Alternativa considerada:** Sem config, cores fixas no manifest — rejeitada por pouco esforço adicional e melhor integração com temas futuros.

### 6. Handler no middleware antes do `next()`

No bloco `else` do middleware (quando `req.path !== validatedConfig.path`), interceptar paths de manifest e ícones antes de chamar `next()`. O `pageRoute` exportado não precisa de lógica extra — manifest é recurso público do mesmo prefixo.

**Alternativa considerada:** `express.static` separado — rejeitada para manter a biblioteca autocontida sem exigir setup extra do consumidor.

### 7. `display: "standalone"`

Modo standalone remove barra de endereço ao abrir o atalho instalado, padrão para dashboards de monitoramento.

**Alternativa considerada:** `browser` — rejeitada porque não oferece experiência de app instalado.

## Risks / Trade-offs

- **[Risco] Chrome exige service worker para exibir prompt "Instalar app"** → Mitigação: manifest habilita "Adicionar à tela inicial" no iOS/Safari e cumpre pré-requisito do Chrome; service worker pode ser mudança futura
- **[Risco] Path com barra final inconsistente (`/status` vs `/status/`)** → Mitigação: normalizar comparação de paths no middleware (tratar ambos como equivalentes para a página; manifest usa path canônico da config)
- **[Risco] Consumidor monta middleware em path que colide com rotas do host** → Mitigação: documentar subpaths reservados (`/manifest.webmanifest`, `/icons/*`) no README
- **[Trade-off] Ícones genéricos vs branding do consumidor** → Ícones padrão do pacote; customização via config fica para iteração futura
- **[Trade-off] Manifest dinâmico vs cache** → Sem cache agressivo; manifest é pequeno e muda raramente; `Cache-Control: public, max-age=3600` opcional

## Migration Plan

1. Adicionar assets (manifest template, ícones) em `src/public/`
2. Estender config/validate com `themeColor` e `backgroundColor` opcionais
3. Atualizar `middleware-wrapper.js` com handlers de manifest e ícones
4. Atualizar `index.html` com tags PWA no `<head>`
5. Testar manualmente: DevTools → Application → Manifest; Lighthouse PWA audit; "Adicionar à tela inicial" em mobile
6. Sem migração de dados; rollback removendo rotas e tags HTML

## Open Questions

- Nenhuma pendente — escopo limitado ao manifest e entrega HTTP dos assets relacionados
