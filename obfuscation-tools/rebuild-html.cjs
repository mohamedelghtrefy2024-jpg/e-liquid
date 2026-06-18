// rebuild-html.cjs
// يعيد بناء ملف HTML كامل بنفس البنية الأصلية، لكن باستبدال محتوى
// script tags معينة (المحددة بالـindex) بمحتوى ملفات معتّمة جديدة.

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];   // الملف الأصلي
const manifestFile = process.argv[3]; // manifest.json من extract-scripts.cjs
const replacementsArg = process.argv[4]; // "2:/tmp/extracted/script-2.obf.js,3:/tmp/extracted/script-3.obf.js"
const outputFile = process.argv[5];

if (!inputFile || !manifestFile || !replacementsArg || !outputFile) {
  console.error('Usage: node rebuild-html.cjs <input.html> <manifest.json> <idx:file,idx:file,...> <output.html>');
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

const replacements = {};
replacementsArg.split(',').forEach((pair) => {
  const [idx, file] = pair.split(':');
  replacements[Number(idx)] = fs.readFileSync(file, 'utf8');
});

// نعيد إيجاد كل script tags بنفس الـregex المستخدم في extract-scripts.cjs
// لضمان نفس الترتيب والمواقع بالضبط
const scriptRegex = /<script((?:\s+[^>]*)?)>([\s\S]*?)<\/script>/g;

let idx = 0;
const newHtml = html.replace(scriptRegex, (fullMatch, attrs, content) => {
  const currentIdx = idx;
  idx++;
  if (replacements.hasOwnProperty(currentIdx)) {
    return `<script${attrs}>${replacements[currentIdx]}</script>`;
  }
  return fullMatch;
});

fs.writeFileSync(outputFile, newHtml, 'utf8');
console.log('Rebuilt HTML ->', outputFile, '(', newHtml.length, 'chars)');
console.log('Replaced indices:', Object.keys(replacements).join(', '));
