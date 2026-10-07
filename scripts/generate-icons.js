const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.join(__dirname, '../src/public/icons');
const BG = { r: 18, g: 18, b: 31 };
const PURPLE = { r: 113, g: 118, b: 244 };
const CYAN = { r: 18, g: 200, b: 247 };
const GREEN = { r: 29, g: 204, b: 138 };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcVal = crc32(Buffer.concat([t, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal);
  return Buffer.concat([len, t, data, crcBuf]);
}

function drawIcon(size) {
  const rowSize = 1 + size * 4;
  const out = Buffer.alloc(size * rowSize);
  const radius = Math.floor(size * 0.2);
  const cx = size / 2;
  const cy = size * 0.42;

  for (let y = 0; y < size; y++) {
    const rowStart = y * rowSize;
    out[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      let r = BG.r;
      let g = BG.g;
      let b = BG.b;

      const dx = Math.max(Math.abs(x - size / 2) - (size / 2 - radius), 0);
      const dy = Math.max(Math.abs(y - size / 2) - (size / 2 - radius), 0);
      const outside = dx * dx + dy * dy > radius * radius;
      if (outside) {
        out[px] = 0;
        out[px + 1] = 0;
        out[px + 2] = 0;
        out[px + 3] = 0;
        continue;
      }

      const dist = Math.hypot(x - cx, y - cy);
      if (dist < size * 0.34) {
        r = PURPLE.r;
        g = PURPLE.g;
        b = PURPLE.b;
      }
      if (dist > size * 0.18 && dist < size * 0.3 && x > cx) {
        r = CYAN.r;
        g = CYAN.g;
        b = CYAN.b;
      }

      const barW = Math.max(2, Math.floor(size / 24));
      const baseY = Math.floor(size * 0.72);
      for (let i = 0; i < 5; i++) {
        const barX = Math.floor(size * 0.28) + i * (barW * 2 + 2);
        const barH = Math.floor(size * (0.08 + (i % 3) * 0.04));
        if (x >= barX && x < barX + barW && y >= baseY - barH && y < baseY) {
          r = i % 2 ? CYAN.r : PURPLE.r;
          g = i % 2 ? CYAN.g : PURPLE.g;
          b = i % 2 ? CYAN.b : PURPLE.b;
        }
      }

      if (Math.hypot(x - size * 0.78, y - size * 0.22) < size * 0.05) {
        r = GREEN.r;
        g = GREEN.g;
        b = GREEN.b;
      }

      out[px] = r;
      out[px + 1] = g;
      out[px + 2] = b;
      out[px + 3] = 255;
    }
  }

  return out;
}

function createPng(size) {
  const raw = drawIcon(size);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const entries = [];
  let offset = 6 + count * 16;
  pngBuffers.forEach(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  });

  return Buffer.concat([header, ...entries, ...pngBuffers.map(item => item.png)]);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });

const sizes = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

sizes.forEach(([name, size]) => {
  fs.writeFileSync(path.join(ICONS_DIR, name), createPng(size));
});

const favicon32 = createPng(32);
const favicon16 = createPng(16);
fs.writeFileSync(
  path.join(ICONS_DIR, '../favicon.ico'),
  createIco([
    { size: 16, png: favicon16 },
    { size: 32, png: favicon32 },
  ]),
);

console.log('Icons generated');
