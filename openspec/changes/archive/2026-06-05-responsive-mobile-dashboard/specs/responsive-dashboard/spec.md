## ADDED Requirements

### Requirement: Viewport mobile configurado

A página de status MUST incluir a meta tag viewport no `<head>` para que navegadores mobile renderizem na largura real do dispositivo.

#### Scenario: Renderização em dispositivo mobile

- **WHEN** a página é aberta em um navegador mobile com largura de 375px
- **THEN** o conteúdo é renderizado na largura do viewport (não em escala de desktop ~980px)

### Requirement: Layout sem scroll horizontal

A página MUST se adaptar a viewports de 320px a 1920px sem exigir scroll horizontal.

#### Scenario: Viewport estreito

- **WHEN** o viewport tem largura de 320px
- **THEN** nenhum elemento da página provoca overflow horizontal

#### Scenario: Viewport largo

- **WHEN** o viewport tem largura de 1920px
- **THEN** o conteúdo ocupa a largura disponível com padding lateral adequado

### Requirement: Containers de métricas empilham em mobile

Cada container de métrica (CPU, Memory, Heap, Load, Event Loop, Response Time, RPS, Status Codes) MUST empilhar a coluna de estatísticas acima do gráfico em viewports de até 600px.

#### Scenario: Layout mobile de métrica

- **WHEN** o viewport tem largura de 600px ou menos
- **THEN** a stats-column aparece acima do chart-container em layout de coluna

#### Scenario: Layout desktop de métrica

- **WHEN** o viewport tem largura maior que 600px
- **THEN** a stats-column e o chart-container aparecem lado a lado em layout de linha

### Requirement: Gráficos redimensionam com o container

Os gráficos Chart.js MUST redimensionar para ocupar 100% da largura do container pai.

#### Scenario: Redimensionamento de gráfico

- **WHEN** o viewport é redimensionado
- **THEN** os canvas dos gráficos ajustam sua largura ao container sem distorção vertical fixa (altura ~100px)

### Requirement: Header flexível

O header da página MUST exibir o título e os controles de período em layout flexível, sem uso de `float`.

#### Scenario: Header em mobile

- **WHEN** o viewport tem largura de 600px ou menos
- **THEN** o título e os controles de período se reorganizam com quebra de linha quando necessário, sem sobreposição

#### Scenario: Header em desktop

- **WHEN** o viewport tem largura maior que 600px
- **THEN** o título e os controles de período aparecem na mesma linha com espaçamento adequado

### Requirement: Controles de período utilizáveis em touch

Os botões de seleção de período (span controls) MUST ter área de toque mínima de 36px de altura em viewports de até 600px.

#### Scenario: Toque em controle de período

- **WHEN** o usuário toca em um botão de período em viewport mobile
- **THEN** o alvo de toque tem pelo menos 36px de altura

### Requirement: Health checks com URLs longas

Linhas de health check MUST exibir URLs longas sem quebrar o layout da página.

#### Scenario: URL longa em health check

- **WHEN** um health check possui um path com mais de 50 caracteres em viewport mobile
- **THEN** o texto quebra dentro do container sem provocar scroll horizontal

#### Scenario: Status de health check empilhado em mobile

- **WHEN** o viewport tem largura de 600px ou menos
- **THEN** o badge de status do health check aparece abaixo do título, ocupando a largura total
