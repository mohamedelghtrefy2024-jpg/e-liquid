#!/usr/bin/env node
/**
 * extract-scripts.cjs
 * Extracts all <script> tags from an HTML file.
 * External (CDN) scripts are recorded but not extracted.
 * Inline scripts are saved to individual .js files.
 * Produces a manifest.json describing all scripts and their types.
 *
 * Usage:
 *   node extract-scripts.cjs <input.html> <output-dir>
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const [,, inputFile, outputDir] = process.argv;
if (!inputFile || !outputDir) {
  console.error('Usage: node extract-scripts.cjs <input.html> <output-dir>');
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
fs.mkdirSync(outputDir, { recursive: true });

// Parse all <script ...> ... </script> occurrences
// We need to handle both self-closing (external) and content-bearing (inline) forms
const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
const manifest = [];
let match;
let idx = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  const attrs    = match[1].trim();
  const content  = match[2];
  const startPos = match.index;
  const endPos   = match.index + match[0].length;

  // Determine if external or inline
  const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const isExternal = !!srcMatch;

  const entry = {
    index    : idx,
    startPos,
    endPos,
    attrs,
    isExternal,
  };

  if (isExternal) {
    entry.src = srcMatch[1];
    console.log(`[${idx}] EXTERNAL: ${srcMatch[1]}`);
  } else {
    const outFile = path.join(outputDir, `script-${idx}.js`);
    fs.writeFileSync(outFile, content, 'utf8');
    entry.file = outFile;
    console.log(`[${idx}] INLINE  : ${content.length} bytes → ${outFile}`);
  }

  manifest.push(entry);
  idx++;
}

const manifestPath = path.join(outputDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(`\nManifest written → ${manifestPath}`);
console.log(`Total scripts found: ${manifest.length}`);
console.log(`  External: ${manifest.filter(e => e.isExternal).length}`);
console.log(`  Inline  : ${manifest.filter(e => !e.isExternal).length}`);
