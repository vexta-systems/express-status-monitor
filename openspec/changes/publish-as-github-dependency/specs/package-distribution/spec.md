## ADDED Requirements

### Requirement: Identidade própria do pacote

O pacote MUST se chamar `@vexta-systems/express-status-monitor` e o seu ponto de entrada MUST exportar a mesma fábrica de middleware do `express-status-monitor` original, aceitando a mesma configuração.

#### Scenario: Consumidor importa pelo nome com escopo

- **WHEN** um projeto que tem o pacote instalado executa `require('@vexta-systems/express-status-monitor')({ path: '/status' })`
- **THEN** o resultado é uma função de middleware Express que também expõe `middleware` e `pageRoute`

#### Scenario: Metadados apontam para o fork

- **WHEN** alguém lê os campos `repository`, `homepage` e `bugs` do `package.json` publicado
- **THEN** todos apontam para `github.com/vexta-systems/express-status-monitor` e não existe campo `funding`

### Requirement: Instalação a partir de tag do GitHub sem credenciais

O pacote MUST poder ser instalado com npm e com pnpm a partir de uma tag de versão do repositório público, sem token, sem registry e sem executar scripts de build do próprio pacote.

#### Scenario: Instalação com npm

- **WHEN** um projeto vazio executa `npm install github:vexta-systems/express-status-monitor#v1.4.0`
- **THEN** a instalação conclui sem pedir autenticação, o `package.json` do projeto registra a chave `@vexta-systems/express-status-monitor` e o `require` pelo nome com escopo funciona

#### Scenario: Instalação com pnpm

- **WHEN** um projeto vazio executa `pnpm add github:vexta-systems/express-status-monitor#v1.4.0`
- **THEN** a instalação conclui sem pedir autenticação e o `require` pelo nome com escopo funciona

#### Scenario: Pacote não exige scripts de instalação

- **WHEN** o `package.json` do pacote é inspecionado
- **THEN** não existe nenhum dos scripts `prepare`, `preinstall`, `install` ou `postinstall`

### Requirement: Pacote contém apenas arquivos de runtime

O pacote empacotado MUST conter somente o necessário para executar o middleware: `index.js`, o diretório `src/` (incluindo `src/public/`), `package.json`, `README.md` e `LICENSE`.

#### Scenario: Conteúdo do tarball

- **WHEN** o pacote é empacotado com `npm pack`
- **THEN** o tarball não contém `test/`, `scripts/`, `openspec/`, `examples/`, `.cursor/`, `.claude/`, `.github/` nem arquivos de lock ou de workspace

#### Scenario: Dashboard servido a partir do pacote instalado

- **WHEN** um app Express usa o middleware instalado a partir do tarball e recebe `GET /status`
- **THEN** a resposta tem status 200 e contém o HTML do dashboard, e `GET /status/manifest.webmanifest` retorna o manifest

### Requirement: Funcionamento sem a dependência nativa opcional

O middleware MUST funcionar quando `event-loop-stats` não estiver instalado ou não tiver sido compilado, omitindo apenas as métricas de event loop.

#### Scenario: Build nativo bloqueado ou indisponível

- **WHEN** o pacote é instalado sem que `event-loop-stats` seja compilado (pnpm sem liberação de build, ou npm sem toolchain nativa)
- **THEN** o `require` do pacote não lança erro, o dashboard é servido e as demais métricas (CPU, memória, load, respostas) continuam sendo emitidas

### Requirement: Versões de Node suportadas declaradas e verificadas

O campo `engines.node` MUST declarar uma versão mínima em que o pacote é efetivamente testado pela CI.

#### Scenario: Engines coerente com a matriz da CI

- **WHEN** a CI executa
- **THEN** a menor versão da matriz de Node é a versão mínima declarada em `engines.node`

### Requirement: Integridade verificada em CI

Todo push e pull request MUST executar lint, testes automatizados e uma verificação de que o pacote empacotado é instalável e servível; a CI MUST NOT publicar o pacote em nenhum registry.

#### Scenario: Lint sem erros

- **WHEN** `eslint .` é executado na raiz do repositório
- **THEN** o resultado é zero erros

#### Scenario: Falha bloqueia a CI

- **WHEN** um push introduz um erro de lint, um teste quebrado ou um pacote que não sobe o dashboard após instalado
- **THEN** o workflow termina com falha

#### Scenario: CI não publica

- **WHEN** o workflow roda em `master` ou em uma tag
- **THEN** nenhum passo executa `npm publish`, `pnpm publish` nem usa token de registry

### Requirement: Compatibilidade do namespace de debug

O namespace de log do `debug` MUST continuar sendo `express-status-monitor`.

#### Scenario: Logs habilitados pelo namespace antigo

- **WHEN** o app consumidor roda com `DEBUG=express-status-monitor`
- **THEN** as mensagens de debug do monitor são exibidas

### Requirement: GitHub Release criada a partir da tag

O push de uma tag `vX.Y.Z` MUST gerar uma GitHub Release com o corpo tirado da seção `## vX.Y.Z` do `CHANGELOG.md` e com as instruções de instalação, somente depois de lint, testes e smoke do pacote passarem no commit da tag.

#### Scenario: Tag de versão válida

- **WHEN** a tag `v1.4.0` é enviada e o `package.json` desse commit tem `version: 1.4.0` e o `CHANGELOG.md` tem a seção `## v1.4.0`
- **THEN** uma Release `v1.4.0` é publicada com essa seção e os comandos `npm install` / `pnpm add github:vexta-systems/express-status-monitor#v1.4.0`

#### Scenario: Versão do pacote diferente da tag

- **WHEN** a tag enviada não corresponde ao `version` do `package.json` no commit da tag
- **THEN** o workflow falha e nenhuma Release é criada

#### Scenario: CHANGELOG sem a seção da versão

- **WHEN** o `CHANGELOG.md` não tem a seção `## <tag>`
- **THEN** o workflow falha e nenhuma Release é criada

#### Scenario: Pacote quebrado na tag

- **WHEN** lint, testes ou smoke do pacote falham no commit da tag
- **THEN** nenhuma Release é criada
