## 1. Preparação

- [x] 1.1 Rodar `pnpm run test-ci` e confirmar os 47 testes passando antes de qualquer mudança
- [x] 1.2 Commitar as mudanças funcionais pendentes (opções `socketAuth`, `authorize`, `instanceLabel`, `assetsPath`, `pagePath`, testes novos e `.claude/`) num commit separado

## 2. Lint

- [x] 2.1 Subir `ecmaVersion` em `.eslintrc.json` até aceitar a sintaxe de `scripts/generate-pwa-icons.js` (alvo: 2020) e confirmar que o erro de parse some
- [x] 2.2 Adicionar bloco `overrides` para `scripts/**` desligando `no-bitwise`, `no-plusplus` e `no-mixed-operators`
- [x] 2.3 Corrigir os erros restantes em `scripts/` (`eslint --fix` + ajustes manuais)
- [x] 2.4 Corrigir `newline-after-var`, `arrow-parens` e `no-mixed-operators` em `src/middleware-wrapper.js`, `src/helpers/gather-os-metrics.js` e `src/public/javascripts/app.js`
- [x] 2.5 Refatorar `src/helpers/validate.js` em funções menores até a complexidade ficar ≤ 20, sem alterar asserções de `test/helpers/validate.spec.js` e `test/middleware-wrapper-options.spec.js`
- [x] 2.6 Confirmar `eslint .` com zero erros e todos os testes passando

## 3. Identidade e conteúdo do pacote

- [x] 3.1 `package.json`: `name` → `@vexta-systems/express-status-monitor`, `version` → `1.4.0`
- [x] 3.2 `package.json`: `repository`, `homepage` e `bugs` apontando para `github.com/vexta-systems/express-status-monitor`; remover `funding`; manter `author` e `contributors`
- [x] 3.3 `package.json`: `engines.node` → `>=18`
- [x] 3.4 `package.json`: adicionar `"files": ["index.js", "src/"]`
- [x] 3.5 Confirmar que não existem scripts `prepare`, `preinstall`, `install` ou `postinstall`
- [x] 3.6 Atualizar o exemplo de `require` no JSDoc de `src/middleware-wrapper.js` para o nome novo (manter o namespace do `debug` em `gather-os-metrics.js`)
- [x] 3.7 Rodar `npm pack --dry-run` e conferir que só aparecem `index.js`, `src/**`, `package.json`, `README.md` e `LICENSE`

## 4. Lockfile e gerenciador

- [x] 4.1 Remover `package-lock.json` da raiz (manter `examples/package-lock.json`)
- [x] 4.2 Declarar `packageManager: "pnpm@<versão>"` no `package.json` e regenerar `pnpm-lock.yaml`

## 5. CI

- [x] 5.1 Remover `circle.yml`
- [x] 5.2 Criar script de smoke em `scripts/` que: empacota com `npm pack`, instala o tarball num diretório temporário com npm e com pnpm (sem liberar build de `event-loop-stats`), sobe um app Express mínimo com o middleware e falha se `GET /status` não retornar 200 com o HTML do dashboard ou se `GET /status/manifest.webmanifest` não retornar o manifest
- [x] 5.3 Rodar o smoke localmente e confirmar que passa; quebrar o campo `files` de propósito (ex.: tirar `src/`) e confirmar que o smoke falha
- [x] 5.4 Criar `.github/workflows/ci.yml` em `push` e `pull_request`: matriz Node 18/22/24 com `pnpm install --frozen-lockfile`, `pnpm run eslint`, `pnpm run test-ci`; job de smoke em uma versão de Node; sem publish nem secrets

## 6. README

- [x] 6.1 Título com o nome novo e nota de fork com link para `RafalWilinski/express-status-monitor`; trocar/remover badges do upstream (npm, CircleCI, CodeTriage) e adicionar badge do workflow
- [x] 6.2 Seção de instalação com npm e pnpm via `github:vexta-systems/express-status-monitor#v1.4.0`
- [x] 6.3 Seção sobre `event-loop-stats`: liberação de build no pnpm (`allowBuilds` / `onlyBuiltDependencies` no projeto consumidor), toolchain nativa no npm, e o que se perde sem ela
- [x] 6.4 Aviso de que o CI do consumidor precisa de `git` (imagens alpine não têm)
- [x] 6.5 Atualizar todos os exemplos de `require('express-status-monitor')` para o nome novo
- [x] 6.6 Documentar `engines` (Node ≥ 18)

## 7. Release e validação

- [x] 7.1 Commitar as mudanças da change e dar push em `master`; confirmar CI verde
- [x] 7.2 Criar a tag `v1.4.0` e dar push
- [x] 7.3 Num projeto vazio, `npm install github:vexta-systems/express-status-monitor#v1.4.0`, fazer `require('@vexta-systems/express-status-monitor')` e abrir o dashboard
- [ ] 7.4 Repetir 7.3 com `pnpm add`, primeiro sem e depois com a liberação de build de `event-loop-stats`, confirmando que o gráfico de event loop só aparece no segundo caso
  - Parcial (2026-10-07, Windows sem VS Build Tools): sem liberação → "Ignored build scripts" e dashboard sem event loop ✓; com `onlyBuiltDependencies` → pnpm passa a compilar (config respeitada), mas a compilação falha por falta de toolchain. Compilação + gráfico de event loop comprovados só via npm na CI Linux. Falta: pnpm com liberação em Linux/WSL ou máquina com toolchain.

## 8. Release automática

- [x] 8.1 Criar `CHANGELOG.md` com a seção `## v1.4.0`
- [x] 8.2 Criar `scripts/release-notes.js` (versão do `package.json` na tag = tag; seção do CHANGELOG obrigatória; instruções de instalação) e testar os casos válido, versão divergente, seção ausente e tag inválida
- [x] 8.3 Criar `.github/workflows/release.yml` (push de `v*` + `workflow_dispatch`): verificação da tag e depois `gh release create`/`edit`
- [x] 8.4 Documentar no README como publicar uma versão
- [x] 8.5 Push em `master` e disparar o workflow para a `v1.4.0` já existente; conferir a Release como Latest
