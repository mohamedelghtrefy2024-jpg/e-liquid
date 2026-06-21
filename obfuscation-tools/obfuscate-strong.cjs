#!/usr/bin/env node
/**
 * obfuscate-strong.cjs
 * Obfuscates a single JS file using the agreed settings.
 *
 * Settings record (DO NOT CHANGE without explicit user confirmation):
 *   compact                  : true
 *   controlFlowFlattening    : true,  threshold 0.75
 *   deadCodeInjection        : true,  threshold 0.4
 *   stringArray              : true,  encoding base64, threshold 1
 *   identifierNamesGenerator : hexadecimal
 *   renameGlobals            : false   ← CRITICAL: keeps window/document/React intact
 *   selfDefending            : true
 *   numbersToExpressions     : true
 *   simplify                 : true
 *   splitStrings             : true,  chunkLength 8
 *   transformObjectKeys      : true
 *   unicodeEscapeSequence    : false  ← disabled: avoids bloat from Arabic text
 *   disableConsoleOutput     : false  ← keep console.log/error for diagnostics
 *   debugProtection          : false  ← disabled: don't block legitimate DevTools
 *   target                   : browser
 *
 * Usage:
 *   node obfuscate-strong.cjs <input.js> <output.js>
 */
'use strict';

const JavaScriptObfuscator = require('../node_modules/javascript-obfuscator');
const fs   = require('fs');
const path = require('path');

const [,, inputFile, outputFile] = process.argv;
if (!inputFile || !outputFile) {
  console.error('Usage: node obfuscate-strong.cjs <input.js> <output.js>');
  process.exit(1);
}

const source = fs.readFileSync(inputFile, 'utf8');
const inputSize = Buffer.byteLength(source, 'utf8');
console.log(`Input : ${inputFile} (${(inputSize/1024).toFixed(1)} KB)`);
console.log('Obfuscating (this may take a minute for large files)...');

const start = Date.now();

const result = JavaScriptObfuscator.obfuscate(source, {
  // ── Core ──────────────────────────────────────────────────────────────────
  compact                   : true,
  target                    : 'browser',

  // ── Control Flow ──────────────────────────────────────────────────────────
  controlFlowFlattening          : true,
  controlFlowFlatteningThreshold : 0.75,

  // ── Dead Code ─────────────────────────────────────────────────────────────
  deadCodeInjection          : true,
  deadCodeInjectionThreshold : 0.4,

  // ── String Array ──────────────────────────────────────────────────────────
  stringArray                   : true,
  stringArrayEncoding           : ['base64'],
  stringArrayThreshold          : 1,
  stringArrayCallsTransform     : true,
  stringArrayRotate             : true,
  stringArrayShuffle            : true,
  stringArrayWrappersCount      : 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType       : 'function',

  // ── Identifiers ───────────────────────────────────────────────────────────
  identifierNamesGenerator : 'hexadecimal',
  renameGlobals            : false,   // ← CRITICAL: must stay false
  renameProperties         : false,

  // ── Self-Defending ────────────────────────────────────────────────────────
  selfDefending : true,

  // ── Numbers ───────────────────────────────────────────────────────────────
  numbersToExpressions : true,
  simplify             : true,

  // ── Strings ───────────────────────────────────────────────────────────────
  splitStrings            : true,
  splitStringsChunkLength : 8,
  transformObjectKeys     : true,

  // ── Encoding ──────────────────────────────────────────────────────────────
  unicodeEscapeSequence : false,  // ← disabled: Arabic text would balloon in size

  // ── Diagnostics ───────────────────────────────────────────────────────────
  disableConsoleOutput : false,   // ← keep console.log/error
  debugProtection      : false,   // ← don't block DevTools
  debugProtectionInterval: 0,

  // ── Source Map ────────────────────────────────────────────────────────────
  sourceMap : false,
});

const obfCode = result.getObfuscatedCode();
fs.writeFileSync(outputFile, obfCode, 'utf8');

const elapsed    = ((Date.now() - start) / 1000).toFixed(1);
const outputSize = Buffer.byteLength(obfCode, 'utf8');
const ratio      = (outputSize / inputSize).toFixed(2);

console.log(`Output: ${outputFile} (${(outputSize/1024).toFixed(1)} KB, ${ratio}x original)`);
console.log(`Done in ${elapsed}s`);
