/**
 * smoke-package.js
 *
 * Verifica se o pacote, do jeito que é entregue, é consumível:
 * empacota com `npm pack`, instala o tarball num projeto vazio com npm e com
 * pnpm (sem nenhum build nativo), sobe um app Express com o middleware e
 * confere o dashboard, o manifest e a emissão de métricas (incluindo event loop).
 *
 * Uso:  node scripts/smoke-package.js [npm|pnpm ...]
 *       PNPM="npx -y pnpm@10" node scripts/smoke-package.js pnpm
 */

const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGE_NAME = require('../package.json').name;
const MANAGERS = {
  npm: tarball => `npm install --no-audit --no-fund "${tarball}" express@4 socket.io-client@4`,
  pnpm: tarball => `${process.env.PNPM || 'pnpm'} add "${tarball}" express@4 socket.io-client@4`
};

// App consumidor: roda em processo separado, dentro do projeto temporário.
const CONSUMER_APP = `
const express = require('express');
const ioClient = require('socket.io-client');
const statusMonitor = require('${PACKAGE_NAME}');

const fail = message => {
  console.error('FALHA: ' + message);
  process.exit(1);
};

const app = express();

app.use(statusMonitor({ path: '/status' }));

const server = app.listen(0, async () => {
  const base = 'http://127.0.0.1:' + server.address().port;

  const page = await fetch(base + '/status');
  const html = await page.text();

  if (page.status !== 200 || !html.includes('id="cpuChart"')) {
    fail('GET /status não retornou o dashboard (status ' + page.status + ')');
  }

  const manifestRes = await fetch(base + '/status/manifest.webmanifest');
  const manifest = await manifestRes.json().catch(() => null);

  if (manifestRes.status !== 200 || !manifest || manifest.start_url !== '/status') {
    fail('GET /status/manifest.webmanifest não retornou o manifest esperado');
  }

  const socket = ioClient(base, { transports: ['websocket'] });
  // 30s: no Windows o pidusage abre um PowerShell por coleta (1-3s cada), e o
  // event loop só aparece a partir da terceira coleta do span.
  const timer = setTimeout(() => fail('nenhuma métrica esm_stats com event loop recebida em 30s'), 30000);

  socket.on('esm_stats', data => {
    // As primeiras amostras de cada span ainda não têm os (vazio) nem o event loop
    // (que precisa de uma coleta anterior como base).
    if (!data || !data.os || !data.os.loop) {
      return;
    }
    if (typeof data.os.cpu !== 'number' || typeof data.os.memory !== 'number') {
      fail('esm_stats sem métricas de CPU/memória');
    }
    if (typeof data.os.loop.sum !== 'number') {
      fail('esm_stats sem métrica de event loop');
    }
    clearTimeout(timer);
    console.log('OK: dashboard, manifest e métricas (CPU, memória e event loop)');
    process.exit(0);
  });
});
`;

const run = (command, cwd) => execSync(command, { cwd, stdio: 'inherit' });

const pack = destination => {
  const output = execSync(`npm pack --pack-destination "${destination}"`, { cwd: ROOT })
    .toString()
    .trim()
    .split('\n');

  return path.join(destination, output[output.length - 1].trim());
};

const smoke = (manager, tarball) => {
  // Fora do repositório, para não herdar o pnpm-workspace.yaml daqui.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `esm-smoke-${manager}-`));

  console.log(`\n▶ ${manager}: ${dir}`);
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'esm-smoke-consumer', private: true }, null, 2)
  );
  fs.writeFileSync(path.join(dir, 'app.js'), CONSUMER_APP);
  run(MANAGERS[manager](tarball), dir);

  const declared = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));

  if (!declared.dependencies || !declared.dependencies[PACKAGE_NAME]) {
    throw new Error(`${manager} não registrou a dependência ${PACKAGE_NAME}`);
  }
  execFileSync(process.execPath, ['app.js'], { cwd: dir, stdio: 'inherit' });
};

const main = () => {
  const requested = process.argv.slice(2);
  const managers = requested.length ? requested : Object.keys(MANAGERS);
  const unknown = managers.filter(manager => !MANAGERS[manager]);

  if (unknown.length) {
    console.error(`Gerenciador desconhecido: ${unknown.join(', ')}`);
    process.exit(2);
  }

  const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'esm-pack-'));
  const tarball = pack(packDir);

  console.log(`📦  ${tarball}`);
  try {
    managers.forEach(manager => smoke(manager, tarball));
  } catch (error) {
    console.error(`\n❌  Smoke falhou: ${error.message}`);
    process.exit(1);
  }
  console.log('\n✅  Pacote instalável e funcional com', managers.join(' e '));
};

main();
