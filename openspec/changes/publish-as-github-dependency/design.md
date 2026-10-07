## Context

O repositório `vexta-systems/express-status-monitor` é um fork público de `RafalWilinski/express-status-monitor`. O `master` local está 1 commit à frente de `origin/master`, com 12 arquivos modificados e 3 testes novos não rastreados (opções `socketAuth`, `authorize`, `instanceLabel`, `assetsPath`, `pagePath`); 47 testes passam.

Estado que impede o consumo como dependência:

- `package.json` ainda tem o nome, o repositório, a homepage e o funding do upstream; `engines.node` diz `>=8`, mas o socket.io 4 exige `>=10` e o mocha 9 exige `>=12`
- Sem campo `files`: `npm pack` gera 79 arquivos (158 kB), incluindo `openspec/`, `scripts/pwa-icons/*.png`, `test/` e `.cursor/`
- `circle.yml` publica no npm com `$npm_token` a cada push em `master`
- `eslint .` dá 81 erros: 66 em `scripts/generate-icons.js` (principalmente `no-mixed-operators`, `no-bitwise`, `no-plusplus` em cálculo de pixels), 1 erro de parse em `scripts/generate-pwa-icons.js` (sintaxe posterior ao `ecmaVersion: 8` configurado) e 14 em `src/` (`newline-after-var`, `arrow-parens`, `no-mixed-operators` e `complexity` 27 > 20 em `validate.js`)
- Dois lockfiles (`package-lock.json` e `pnpm-lock.yaml`)

Consumidores podem usar npm ou pnpm. O repositório continua público.

## Goals / Non-Goals

**Goals:**

- Instalar o pacote via `github:vexta-systems/express-status-monitor#v1.4.0` com npm e pnpm, sem credenciais
- Pacote com identidade própria e apenas arquivos de runtime
- CI verde que impeça regressões de lint, testes e instalabilidade
- Documentação suficiente para o consumidor instalar com qualquer um dos dois gerenciadores

**Non-Goals:**

- Publicar em npmjs.com ou GitHub Packages (o nome com escopo deixa isso possível depois, sem mudar o `require`)
- Atualizar dependências de runtime (ex.: `axios 0.26.0`) — fica para outra change, **exceto `pidusage`** (ver decisão abaixo)
- Mudar a API de configuração do middleware ou o comportamento do dashboard
- Criar tags automaticamente (a tag continua sendo um ato manual de quem libera a versão)

## Decisions

### Nome `@vexta-systems/express-status-monitor`

O escopo é igual ao nome da org no GitHub. Alternativas: manter `express-status-monitor` (substituição transparente, mas confunde com o upstream e impede publicar no npmjs) ou `@vexta/...` (inviabiliza GitHub Packages, que exige escopo igual ao dono). O namespace do `debug` permanece `express-status-monitor` para não quebrar `DEBUG=` existentes.

### Entrega por dependência git fixada em tag

Repo público → sem token. Os lockfiles de npm e pnpm registram o hash do commit, então a instalação é reprodutível. Alternativa (GitHub Packages) exige `.npmrc` com token em todo consumidor, mesmo para pacote público. Consequência: não há ranges de semver (`^1.4.0`); atualizar é trocar a tag.

### Versão `1.4.0`

As opções novas são aditivas na API. A mudança de nome é “breaking” só para quem migra do upstream, e isso já é explícito pela troca do `require`; não justifica `2.0.0`.

### Campo `files: ["index.js", "src/"]`

O npm sempre inclui `package.json`, `README*` e `LICENSE*`. Para dependências git, npm e pnpm empacotam o repositório respeitando `files`, então isso também vale para o caminho `github:`. Alternativa `.npmignore` foi descartada: lista de exclusão vaza arquivos novos por padrão.

### Sem scripts de ciclo de vida de instalação

Em dependência git, um `prepare` faz o npm instalar as devDependencies do pacote para rodá-lo, e o pnpm 10+ o bloqueia sem liberação explícita do consumidor. O código é JS puro sem build, então nenhum script é necessário. Os scripts existentes (`test`, `test-ci`, `eslint`, `example`) não são de instalação e ficam.

### `engines.node: ">=18"` e matriz de CI 18 / 22 / 24

O código de `src/` roda em versões antigas, mas declarar `>=10` exigiria testar em 10, o que o mocha 9 não suporta. `>=18` é o menor valor que dá para testar de verdade com o toolchain atual, sem trocar o framework de testes. Alternativa: `>=20` (só LTS ainda suportadas) — rejeitada por excluir sem necessidade consumidores em 18. A matriz inclui a mínima declarada e as LTS atuais.

### pnpm como gerenciador do repositório

Remover `package-lock.json` da raiz e declarar `packageManager: "pnpm@10.34.6"` para a CI usar a mesma versão via corepack/`pnpm/action-setup`. O `examples/package-lock.json` fica: `examples/` é um projeto npm separado. O campo `packageManager` é ignorado quando o pacote é instalado como dependência.

A versão é a 10 e não a 11 (usada localmente) porque o pnpm 11 exige Node >= 22.13 e não roda na matriz com Node 18; o lockfile (formato 9.0) é o mesmo nas duas.

### Lint: corrigir `src/` e ajustar a configuração para `scripts/`

- `src/`: corrigir todos os erros. `validate.js` é refatorado em funções menores (validação por grupo de opções) para baixar a complexidade; os testes existentes de `validate.spec.js` cobrem o comportamento e devem continuar passando sem alteração de asserções.
- `.eslintrc.json`: subir `ecmaVersion` para `2020` (ou a menor que aceite a sintaxe de `generate-pwa-icons.js`), compatível com `engines >= 18`.
- `scripts/`: são ferramentas de desenvolvimento para gerar ícones; o cálculo de pixels usa operadores bit a bit de forma legítima. Adicionar um bloco `overrides` para `scripts/**` desligando `no-bitwise`, `no-plusplus` e `no-mixed-operators`, e corrigir à mão o restante (`newline-after-var` etc. via `--fix`). Alternativa de ignorar `scripts/` inteiro no `.eslintignore` foi rejeitada: esconderia erros reais como o de parse.

### CI no GitHub Actions com verificação de instalabilidade

Workflow `.github/workflows/ci.yml`, em `push` e `pull_request`:

1. `pnpm install --frozen-lockfile`
2. `pnpm run eslint`
3. `pnpm run test-ci`
4. **Smoke de pacote:** `npm pack`, instalar o tarball num diretório temporário com npm **e** com pnpm (sem liberar o build de `event-loop-stats`), subir um app Express mínimo com o middleware e verificar que `GET /status` retorna 200 com o HTML e que `GET /status/manifest.webmanifest` retorna o manifest.

O passo 4 é o teste que importa para esta change: se falhar, significa que o pacote entregue não é consumível. Ele cobre também o requisito de funcionar sem a dependência nativa. O script do smoke fica em `scripts/` (fora do pacote) e roda em uma só versão de Node da matriz.

Sem nenhum passo de publish nem secret de registry.

### GitHub Release automática no push da tag

A seção Releases do GitHub só mostra objetos *Release*, não tags. O workflow `.github/workflows/release.yml` roda no push de `v*` e também por `workflow_dispatch` (para tags enviadas antes dele existir, como a `v1.4.0`). Primeiro verifica o commit da tag (lint, testes, smoke); depois `scripts/release-notes.js` confere que o `version` do `package.json` **no commit da tag** bate com a tag e extrai a seção `## <tag>` do `CHANGELOG.md`, acrescentando as instruções de instalação. Tags com sufixo (`v1.5.0-rc.1`) viram pré-release. O passo é idempotente: se a Release já existe, ela é editada.

Alternativas: `--generate-notes` (sem PRs no fork, gera só o link de comparação) e a mensagem da tag anotada (pouco visível e fácil de esquecer). O CHANGELOG obriga a documentar a versão, e a falha do workflow quando falta a seção é intencional.

### Exceção: `pidusage` 2.0.18 → 4.0.1

O smoke de pacote revelou que, em Windows sem `wmic` (removido nas versões recentes do Windows 11), o `pidusage` 2.x falha com `spawn wmic ENOENT`; o erro só vai para o `debug` e o monitor não emite nenhuma métrica. O `pidusage` 4 funciona nesse ambiente, mantém a API de callback usada em `gather-os-metrics.js` e exige Node >= 18, igual ao `engines` desta change. Atualizado aqui para que a `v1.4.0` já saia funcional em Windows. Efeito colateral: no Node 24 ele emite uma vez o aviso `DEP0190` (uso de `shell: true`).

### Commit das mudanças pendentes antes da change

As mudanças locais (opções novas e testes) são commitadas separadamente, antes das mudanças de distribuição, para que o histórico distinga “funcionalidade” de “empacotamento”. O `.claude/` também é versionado, por coerência com o `.cursor/` já versionado.

## Risks / Trade-offs

- [Consumidor com pnpm não libera o build de `event-loop-stats`] → as métricas de event loop somem em silêncio. Mitigação: seção no README com o trecho de configuração para pnpm (`allowBuilds` nas versões recentes, `onlyBuiltDependencies` nas anteriores).
- [Consumidor com npm sem toolchain nativa] → mesmo efeito. Mitigação: README explica que a falha é tolerada e o que se perde.
- [CI do consumidor em imagem sem `git` (ex.: `node:*-alpine`)] → instalação `github:` falha. Mitigação: aviso no README.
- [Tag movida depois de publicada] → consumidores com lockfile continuam no commit antigo; sem lockfile, recebem código diferente. Mitigação: tags tratadas como imutáveis; correções saem em nova tag.
- [Refatoração de `validate.js` alterar comportamento] → os testes de `validate.spec.js` e `middleware-wrapper-options.spec.js` precisam passar sem mudança nas asserções.
- [Sem semver range] → atualizar exige editar a tag em cada consumidor. Aceito; publicar no npmjs no futuro resolve sem mudar o `require`.

## Migration Plan

1. Commitar as mudanças funcionais pendentes.
2. Aplicar esta change em commits próprios; CI verde no push para `master`.
3. Criar e enviar a tag `v1.4.0`.
4. Validar manualmente a instalação `github:...#v1.4.0` num projeto vazio com npm e com pnpm.
5. Nos consumidores: trocar a dependência e o `require`.

Rollback: consumidores voltam a declarar `express-status-monitor` (upstream) ou uma tag anterior; nada no repositório precisa ser desfeito.

## Open Questions

- Sintaxe de liberação de build documentada como principal: `onlyBuiltDependencies` (pnpm 10), com `allowBuilds` como alternativa para versões novas. Revisar quando os consumidores migrarem para pnpm 11.
- A compilação de `event-loop-stats` não pôde ser verificada no Windows de desenvolvimento (sem Visual Studio Build Tools); a verificação do gráfico de event loop (tarefa 7.4) precisa ser feita em Linux/WSL ou em máquina com toolchain.
