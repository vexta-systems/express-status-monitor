## ADDED Requirements

### Requirement: Manifest web válido e acessível

O sistema MUST servir um Web App Manifest em `${path}/manifest.webmanifest` com `Content-Type: application/manifest+json`, contendo os campos obrigatórios `name`, `short_name`, `start_url`, `display` e `icons` (192×192 e 512×512).

#### Scenario: Navegador solicita o manifest

- **WHEN** um cliente HTTP faz GET em `{path}/manifest.webmanifest`
- **THEN** a resposta retorna status 200 com JSON válido incluindo `name`, `short_name`, `start_url`, `display`, `icons`, `theme_color` e `background_color`

#### Scenario: Manifest reflete configuração do consumidor

- **WHEN** o middleware é configurado com `title: "My App Status"` e `path: "/monitor"`
- **THEN** o manifest retornado contém `name` derivado de "My App Status", `start_url` apontando para `/monitor` e `scope` cobrindo `/monitor/`

### Requirement: Ícones PWA nos tamanhos exigidos

O sistema MUST servir ícones PNG em 192×192 e 512×512 pixels nos paths `${path}/icons/icon-192.png` e `${path}/icons/icon-512.png` com `Content-Type: image/png`.

#### Scenario: Ícone 192px disponível

- **WHEN** um cliente HTTP faz GET em `{path}/icons/icon-192.png`
- **THEN** a resposta retorna status 200 com imagem PNG de 192×192 pixels

#### Scenario: Ícone 512px disponível

- **WHEN** um cliente HTTP faz GET em `{path}/icons/icon-512.png`
- **THEN** a resposta retorna status 200 com imagem PNG de 512×512 pixels

### Requirement: Página HTML vinculada ao manifest

A página de status MUST incluir no `<head>` um `<link rel="manifest">` apontando para o manifest, `<meta name="theme-color">` e `<link rel="apple-touch-icon">` para suporte iOS.

#### Scenario: Link do manifest no HTML

- **WHEN** a página de status é renderizada
- **THEN** o HTML contém `<link rel="manifest" href="{path}/manifest.webmanifest">`

#### Scenario: Theme color no HTML

- **WHEN** a página de status é renderizada com `themeColor` configurado
- **THEN** o HTML contém `<meta name="theme-color" content="{themeColor}">`

### Requirement: Modo de exibição standalone

O manifest MUST declarar `display: "standalone"` para que o atalho instalado abra sem barra de navegação do browser.

#### Scenario: Display standalone no manifest

- **WHEN** o manifest é inspecionado
- **THEN** o campo `display` tem valor `"standalone"`

### Requirement: Metadados de descrição no manifest

O manifest MUST incluir `description` identificando a página como monitor de status em tempo real.

#### Scenario: Descrição presente

- **WHEN** o manifest é inspecionado
- **THEN** o campo `description` contém texto descritivo não vazio sobre monitoramento de status
