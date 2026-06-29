#!/usr/bin/env node
/**
 * rebuild-html.cjs
 * Rebuilds an HTML file, replacing inline script contents with obfuscated versions.
 * External (CDN) scripts are left untouched.
 *
 * Usage:
 *   node rebuild-html.cjs <source.html> <manifest.json> \
 *        "<idx>:<obf-file>[,<idx>:<obf-file>...]" <output.html>
 *
 * Example:
 *   node rebuild-html.cjs EPP-Calculator-merged.html manifest.json \
 *        "2:/tmp/extracted/script-2.obf.js,3:/tmp/extracted/script-3.obf.js" \
 *        EPP-Calculator-protected.html
 */
'use strict';

const fs   = require('fs');

const [,, sourceFile, manifestFile, replacementsArg, outputFile] = process.argv;
if (!sourceFile || !manifestFile || !replacementsArg || !outputFile) {
  console.error(
    'Usage: node rebuild-html.cjs <source.html> <manifest.json> ' +
    '"<idx>:<obf-file>[,...]" <output.html>'
  );
  process.exit(1);
}

// Parse replacements argument: "2:path/a.js,3:path/b.js"
const replacements = {};
for (const part of replacementsArg.split(',')) {
  const [idxStr, ...rest] = part.trim().split(':');
  if (!idxStr || !rest.length) {
    console.error(`Invalid replacement spec: "${part}"`);
    process.exit(1);
  }
  replacements[parseInt(idxStr, 10)] = rest.join(':'); // re-join in case path has ':'
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
let html = fs.readFileSync(sourceFile, 'utf8');

// We need to replace script content in reverse order so positions don't shift
// Sort entries that need replacement by startPos descending
const toReplace = manifest
  .filter(e => !e.isExternal && replacements[e.index] !== undefined)
  .sort((a, b) => b.startPos - a.startPos);

for (const entry of toReplace) {
  const obfFile     = replacements[entry.index];
  const obfContent  = fs.readFileSync(obfFile, 'utf8');

  // Reconstruct the full <script attrs>content</script> block
  const attrPart    = entry.attrs ? ` ${entry.attrs}` : '';
  const replacement = `<script${attrPart}>${obfContent}</script>`;

  // Slice-replace using the recorded positions
  html = html.slice(0, entry.startPos) + replacement + html.slice(entry.endPos);

  console.log(`[${entry.index}] Replaced with obfuscated content (${(Buffer.byteLength(obfContent,'utf8')/1024).toFixed(0)} KB)`);
}

fs.writeFileSync(outputFile, html, 'utf8');
const outSize = fs.statSync(outputFile).size;
console.log(`\nOutput: ${outputFile} (${(outSize/1024).toFixed(0)} KB)`);
