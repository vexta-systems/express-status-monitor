/**
 * release-notes.js
 *
 * Monta o corpo da GitHub Release de uma tag: a seção `## <tag>` do
 * CHANGELOG.md mais as instruções de instalação. Falha se a versão do
 * package.json na tag não bater com a tag ou se o CHANGELOG não tiver a seção.
 *
 * Uso:  node scripts/release-notes.js v1.4.0 > notes.md
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = 'vexta-systems/express-status-monitor';

const fail = message => {
  console.error(`❌  ${message}`);
  process.exit(1);
};

// package.json como está no commit da tag, não no checkout atual.
const versionAtTag = tag => {
  const raw = execFileSync('git', ['show', `${tag}:package.json`], { cwd: ROOT }).toString();

  return JSON.parse(raw).version;
};

const changelogSection = tag => {
  const lines = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === `## ${tag}`);

  if (start === -1) {
    return null;
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(line => line.startsWith('## '));

  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
};

const main = () => {
  const tag = process.argv[2];

  if (!(/^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/).test(tag || '')) {
    fail(`tag inválida: "${tag || ''}" (esperado vX.Y.Z)`);
  }

  const version = versionAtTag(tag);

  if (`v${version}` !== tag) {
    fail(`package.json na tag ${tag} está com a versão ${version}`);
  }

  const section = changelogSection(tag);

  if (!section) {
    fail(`CHANGELOG.md não tem a seção "## ${tag}"`);
  }

  process.stdout.write(`${section}

### Installation

\`\`\`bash
npm install github:${REPO}#${tag}
pnpm add github:${REPO}#${tag}
\`\`\`

\`\`\`js
const statusMonitor = require('@vexta-systems/express-status-monitor');
\`\`\`
`);
};

main();
