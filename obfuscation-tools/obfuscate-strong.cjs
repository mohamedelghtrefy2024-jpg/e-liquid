// obfuscate-strong.cjs
// يطبّق أقوى مستوى تعتيم متاح في javascript-obfuscator على ملف JS معطى.
// control-flow flattening + dead code injection + string array encoding + self-defending.

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node obfuscate-strong.cjs <input.js> <output.js>');
  process.exit(1);
}

const code = fs.readFileSync(inputFile, 'utf8');

const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 1,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,        // حرج: لا نغيّر أسماء عامة قد تتعارض مع window/document/React internals
  selfDefending: true,
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false, // false لأن الكود فيه نصوص عربية كثيرة، true هيضخم الحجم جدًا
  disableConsoleOutput: false, // نحافظ على console.log/error لتشخيص أي مشكلة لاحقًا
  debugProtection: false,      // true يمنع فتح DevTools بالكامل، قد يكسر تجربة المستخدم الشرعي
  target: 'browser',
});

fs.writeFileSync(outputFile, result.getObfuscatedCode(), 'utf8');
console.log('Obfuscated:', inputFile, '(', code.length, 'chars) ->', outputFile, '(', result.getObfuscatedCode().length, 'chars)');
