#!/usr/bin/env node
/**
 * generate-pwa-icons.js
 * Gera todos os ícones necessários para o manifest.json de um PWA
 * a partir de um arquivo SVG.
 *
 * Uso:
 *   node generate-pwa-icons.js [caminho-do-svg] [pasta-de-saida]
 *
 * Exemplos:
 *   node generate-pwa-icons.js icon.svg ./public/icons
 *   node generate-pwa-icons.js                          ← usa "icon.svg" e "./icons" por padrão
 *
 * Dependências:
 *   npm install sharp
 */

const fs = require('fs');
const path = require('path');

// ─── Configuração ────────────────────────────────────────────────────────────

const SVG_INPUT = process.argv[2] || 'icon.svg';
const OUTPUT_DIR = process.argv[3] || './icons';

/** Todos os tamanhos exigidos / recomendados pelo spec PWA */
const ICON_SIZES = [
  // Obrigatórios pelo manifest
  { size: 192, purpose: 'any' },
  { size: 512, purpose: 'any' },
  // Maskable (safe-area centrada a 80 % do canvas)
  { size: 192, purpose: 'maskable' },
  { size: 512, purpose: 'maskable' },
  // Apple Touch Icon (iOS, iPadOS)
  { size: 180, purpose: 'any' },
  // Favicon clássico
  { size: 16, purpose: 'any' },
  { size: 32, purpose: 'any' },
  { size: 48, purpose: 'any' },
  // Splash / tile extras
  { size: 72, purpose: 'any' },
  { size: 96, purpose: 'any' },
  { size: 128, purpose: 'any' },
  { size: 144, purpose: 'any' },
  { size: 152, purpose: 'any' },
  { size: 384, purpose: 'any' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileName (size, purpose) {
  const suffix = purpose === 'maskable' ? '-maskable' : '';

  return `icon-${size}x${size}${suffix}.png`;
}

/**
 * Para ícones maskable o conteúdo deve ocupar apenas 80 % do canvas
 * (safe area definida pela spec). Redimensionamos o SVG para 80 % e
 * o centralizamos sobre um fundo sólido (#12121f, mesma cor do ícone).
 *
 * @param {string} svgContent SVG original do ícone
 * @param {number} size lado do ícone em pixels
 * @returns {string} SVG envolvido com fundo e safe area
 */
function buildSvgForMaskable (svgContent, size) {
  const inner = Math.round(size * 0.8);
  const offset = Math.round((size - inner) / 2);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fundo preenchido para a safe-area maskable -->
  <rect width="${size}" height="${size}" fill="#12121f"/>
  <image href="data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}"
         x="${offset}" y="${offset}" width="${inner}" height="${inner}"/>
</svg>`.trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function loadSharp () {
  try {
    return require('sharp');
  } catch {
    console.error(
      '\n❌  Pacote "sharp" não encontrado.\n' +
      '   Execute:  npm install sharp\n'
    );
    return process.exit(1);
  }
}

async function main () {
  // Verifica dependência
  const sharp = loadSharp();

  // Lê o SVG
  const svgPath = path.resolve(SVG_INPUT);

  if (!fs.existsSync(svgPath)) {
    console.error(`\n❌  Arquivo SVG não encontrado: ${svgPath}\n`);
    process.exit(1);
  }
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  console.log(`\n📄  SVG carregado: ${svgPath}`);

  // Cria pasta de saída
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁  Pasta de saída: ${path.resolve(OUTPUT_DIR)}\n`);

  // Remove duplicatas (ex.: 192-any aparece uma vez)
  const unique = ICON_SIZES.filter(
    (item, idx, arr) =>
      arr.findIndex(
        o => o.size === item.size && o.purpose === item.purpose
      ) === idx
  );

  const manifestIcons = [];
  const generated = [];
  const errors = [];

  for (const { size, purpose } of unique) {
    const name = fileName(size, purpose);
    const outPath = path.join(OUTPUT_DIR, name);

    try {
      // Maskable: envolve em SVG com fundo + safe-area
      const inputBuffer = Buffer.from(
        purpose === 'maskable' ? buildSvgForMaskable(svgContent, size) : svgContent
      );

      await sharp(inputBuffer, { density: 300 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);

      generated.push(name);
      console.log(`  ✅  ${name}`);

      // Entrada para o manifest
      manifestIcons.push({
        src: `icons/${name}`,
        sizes: `${size}x${size}`,
        type: 'image/png',
        purpose,
      });
    } catch (err) {
      errors.push({ name, err: err.message });
      console.error(`  ❌  ${name}  →  ${err.message}`);
    }
  }

  // ── Gera manifest.json de exemplo ─────────────────────────────────────────
  const manifest = {
    name: 'Vexta API Monitor',
    short_name: 'Vexta',
    description: 'Monitoramento de APIs em tempo real',
    start_url: '/',
    display: 'standalone',
    background_color: '#12121f',
    theme_color: '#7176f4',
    orientation: 'any',
    icons: manifestIcons,
  };

  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  // ── Resumo ─────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log(`✅  ${generated.length} ícone(s) gerado(s)`);
  if (errors.length) {
    console.log(`❌  ${errors.length} erro(s)`);
  }
  console.log(`📄  manifest.json salvo em: ${manifestPath}`);
  console.log('─────────────────────────────────────────\n');

  // ── Instrução de uso no HTML ───────────────────────────────────────────────
  console.log('Adicione no <head> do seu HTML:\n');
  console.log('  <link rel="manifest" href="/manifest.json">');
  console.log('  <link rel="apple-touch-icon" href="/icons/icon-180x180.png">');
  console.log('  <meta name="theme-color" content="#7176f4">\n');
}

main().catch(err => {
  console.error('\n❌  Erro inesperado:', err);
  process.exit(1);
});
