## Why

O fork `vexta-systems/express-status-monitor` já tem funcionalidades próprias (`socketAuth`, `authorize`, `instanceLabel`, `assetsPath`, `pagePath`, PWA e layout mobile), mas hoje elas só existem localmente e o pacote ainda se apresenta como o upstream: mesmo nome, mesmo repositório, CI publicando no npm com o token do autor original. Para outros projetos da Vexta usarem o monitor como dependência — via npm ou pnpm —, o pacote precisa ter identidade própria, entregar apenas os arquivos de runtime, ser instalável a partir de uma tag do GitHub sem credenciais e ter uma CI que garanta que o que é publicado está íntegro.

## What Changes

- **BREAKING** (para quem vem do upstream): o pacote passa a se chamar `@vexta-systems/express-status-monitor`; o `require` muda para `require('@vexta-systems/express-status-monitor')`
- Versão `1.4.0`, distribuída como dependência git fixada em tag (`github:vexta-systems/express-status-monitor#v1.4.0`), sem registry
- `package.json`: `repository`/`homepage`/`bugs` apontando para `vexta-systems`; remoção de `funding`; `author` e `contributors` mantidos (licença MIT); `engines.node` corrigido para a versão realmente suportada; campo `files` restringindo o pacote a `index.js` e `src/`; `packageManager` fixando o pnpm
- README: nota de fork com link ao upstream, badges próprios, instalação via `github:` para npm e pnpm, seção sobre a dependência nativa opcional `event-loop-stats`, aviso de que o CI do consumidor precisa de `git`, exemplos de `require` com o nome novo
- JSDoc de `src/middleware-wrapper.js` com o nome novo; namespace do `debug` (`express-status-monitor`) mantido por compatibilidade
- Remoção do `circle.yml` (publicava o pacote upstream no npm) e criação de workflow GitHub Actions com lint, testes e verificação de instalabilidade do pacote empacotado, em push e PR
- Correção de todos os erros de `eslint .` (81 hoje), em `src/` e `scripts/`
- Um único lockfile: remoção do `package-lock.json` da raiz (o projeto usa pnpm)
- Garantia de que o pacote não tem scripts de ciclo de vida de instalação (`prepare`, `preinstall`, `install`, `postinstall`)
- `pidusage` 2.0.18 → 4.0.1: a 2.x não emite métricas em Windows sem `wmic` (descoberto pelo smoke de pacote)
- Commit das mudanças locais pendentes, tag `v1.4.0` e push

## Capabilities

### New Capabilities

- `package-distribution`: identidade do pacote, conteúdo empacotado, instalabilidade via tag do GitHub com npm e pnpm, comportamento sem a dependência nativa opcional, versões de Node suportadas e integridade garantida por CI (lint + testes + instalação do pacote)

### Modified Capabilities

_(nenhuma — `pwa-manifest` e `responsive-dashboard` não mudam de comportamento)_

## Impact

- `package.json`, `pnpm-lock.yaml`, `package-lock.json` (removido)
- `README.md`
- `src/middleware-wrapper.js` (JSDoc e ajustes de lint), `src/helpers/validate.js` (redução de complexidade), `src/helpers/gather-os-metrics.js`, `src/public/javascripts/app.js` (ajustes de lint)
- `scripts/generate-icons.js`, `scripts/generate-pwa-icons.js`, `.eslintrc.json`
- `circle.yml` (removido), `.github/workflows/ci.yml` (novo)
- Projetos consumidores: passam a declarar a dependência via `github:` e, com pnpm, a liberar o build de `event-loop-stats` no próprio projeto
- Sem mudança na API de configuração do middleware
