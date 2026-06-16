#!/usr/bin/env node
/**
 * EPP Calculator — Simple merge/build script
 * ─────────────────────────────────────────────────────────────────────────
 * This is NOT a "real" bundler (no minification, no tree-shaking). It exists
 * purely so the modular source files in /js can also be shipped as a single
 * self-contained .html file (handy for offline use, email attachments, or
 * anywhere ES module hosting with correct MIME types isn't available).
 *
 * For normal use (including GitHub Pages) you do NOT need this script —
 * just serve the /EPP folder as-is and open index.html, since GitHub Pages
 * serves .js files with the correct module MIME type out of the box.
 *
 * Usage:
 *   node build/merge.js
 *
 * Output:
 *   dist/EPP-Calculator-merged.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JS = path.join(ROOT, 'js');

// Dependency order matters: each file is concatenated after the files it
// depends on, then import/export statements are stripped so everything
// shares one top-level scope (just like the original single-file build).
const FILES_IN_ORDER = [
  'vendor/vendor-react.js',
  'translations.js',
  'constants.js',
  'helpers.js',
  'components/common.js',
  'components/EmojiPicker.js',
  'components/SteepTimer.js',
  'components/RecipeChart.js',
  'components/QRModal.js',
  'components/SavedRecipesPanel.js',
  'components/pdfExport.js',
  'App.js',
];

function stripModuleSyntax(src) {
  return src
    // remove `import {...} from '...';` (single or multi-line)
    .replace(/^import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?\s*$/gm, '')
    // remove `export { A, B, C };` re-export lines (used by vendor-react.js)
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '')
    // turn `export function/const/let/var X` into plain declarations
    .replace(/^export\s+(function|const|let|var)\s/gm, '$1 ');
}

function build() {
  let merged = '';
  for (const file of FILES_IN_ORDER) {
    const full = path.join(JS, file);
    const src = fs.readFileSync(full, 'utf-8');
    merged += `\n// ───── ${file} ─────\n` + stripModuleSyntax(src) + '\n';
  }

  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

  // Replace the <script type="module" src="./js/App.js"></script> tag with
  // an inline module script containing the merged code.
  // NOTE: use a function as the replacement (not a string) — otherwise
  // JS's String.replace() would treat "$&", "$1", etc. inside the merged
  // source (e.g. React's internal `e.replace(bi,"$&/")`) as special
  // replacement patterns and corrupt the output.
  html = html.replace(
    /<script type="module" src="\.\/js\/App\.js"><\/script>/,
    () => `<script type="module">\n${merged}\n    </script>`
  );

  const outDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, 'EPP-Calculator-merged.html');
  fs.writeFileSync(outFile, html, 'utf-8');
  console.log(`✅ Built ${path.relative(ROOT, outFile)} (${(html.length / 1024).toFixed(1)} KB)`);
}

build();
