// extract-scripts.cjs
// يستخرج كل <script> بدون src من ملف HTML إلى ملفات .js منفصلة في مجلد /tmp
// مع حفظ مكان كل واحد بالضبط (index, start, end) لإعادة الدمج بدقة لاحقًا.

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outDir = process.argv[3];

if (!inputFile || !outDir) {
  console.error('Usage: node extract-scripts.cjs <input.html> <outDir>');
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const scriptRegex = /<script((?:\s+[^>]*)?)>([\s\S]*?)<\/script>/g;

let m;
const matches = [];
while ((m = scriptRegex.exec(html)) !== null) {
  const attrs = m[1] || '';
  const content = m[2] || '';
  const hasSrc = /\bsrc\s*=/.test(attrs);
  matches.push({
    index: matches.length,
    attrs,
    content,
    hasSrc,
    fullMatchStart: m.index,
    fullMatchEnd: m.index + m[0].length,
  });
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const manifest = [];
matches.forEach((mm) => {
  if (mm.hasSrc) {
    manifest.push({ index: mm.index, type: 'external', attrs: mm.attrs });
    return;
  }
  const fname = path.join(outDir, `script-${mm.index}.js`);
  fs.writeFileSync(fname, mm.content, 'utf8');
  manifest.push({
    index: mm.index,
    type: 'inline',
    attrs: mm.attrs,
    file: fname,
    length: mm.content.length,
  });
});

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Extracted', matches.length, 'script tags to', outDir);
manifest.forEach((mm) => {
  console.log(' -', mm.index, mm.type, mm.file ? `(${mm.length} chars) -> ${mm.file}` : `attrs=${mm.attrs}`);
});
