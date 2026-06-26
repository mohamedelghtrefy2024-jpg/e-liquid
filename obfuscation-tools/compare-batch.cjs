#!/usr/bin/env node
/**
 * compare-batch.cjs
 * Runs qd() on both original and obfuscated scripts with each test case,
 * then performs a deep JSON comparison of results.
 *
 * Usage:
 *   node compare-batch.cjs <original.js> <obfuscated.js> <test-cases.json>
 *
 * Exits 0 if ALL CASES MATCH, exits 1 if any mismatch found.
 */
'use strict';

const fs  = require('fs');
const vm  = require('vm');
const path = require('path');

const [,, origFile, obfFile, casesFile] = process.argv;
if (!origFile || !obfFile || !casesFile) {
  console.error('Usage: node compare-batch.cjs <original.js> <obfuscated.js> <test-cases.json>');
  process.exit(1);
}

const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));

// Build a browser-like context for vm execution
function makeCtx() {
  const mockWindow = {
    navigator : { userAgent: 'node/test' },
    location  : { href: 'http://localhost/' },
    addEventListener    : () => {},
    removeEventListener : () => {},
    dispatchEvent       : () => {},
    CustomEvent         : function(name, detail) { this.name = name; this.detail = detail; },
    setTimeout          : setTimeout,
    clearTimeout        : clearTimeout,
    setInterval         : setInterval,
    clearInterval       : clearInterval,
    console             : { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
    Math, JSON, Object, Array, Date, Error, Promise, Map, Set, WeakMap, WeakSet, Symbol,
    parseInt, parseFloat, isNaN, isFinite,
    decodeURIComponent, encodeURIComponent,
    atob : (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa : (s) => Buffer.from(s, 'binary').toString('base64'),
    performance: { now: () => Date.now() },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame : clearTimeout,
  };
  const ctx = vm.createContext({
    ...mockWindow,
    window  : mockWindow,
    global  : mockWindow,
    self    : mockWindow,
    document: {
      createElement   : () => ({ style: {} }),
      getElementById  : () => null,
      querySelector   : () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    localStorage  : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
  return ctx;
}

function loadScript(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ctx  = makeCtx();
  try {
    vm.runInContext(code, ctx, { timeout: 60000 });
  } catch (e) {
    // Init errors are OK for React bundles run outside browser
  }
  if (typeof ctx.qd !== 'function') {
    throw new Error(`qd() not found in ${file}`);
  }
  return ctx.qd;
}

// Deep-equal comparison that handles numeric rounding tolerance
function deepEqual(a, b, path = '', tol = 1e-9) {
  if (typeof a !== typeof b) return [`TYPE_MISMATCH at ${path}: ${typeof a} vs ${typeof b}`];
  const errors = [];

  if (typeof a === 'number') {
    if (Math.abs(a - b) > tol && !(isNaN(a) && isNaN(b))) {
      errors.push(`VALUE_DIFF at ${path}: ${a} vs ${b}`);
    }
    return errors;
  }

  if (a === null && b === null) return [];
  if (a === null || b === null) return [`NULL_DIFF at ${path}: ${a} vs ${b}`];

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return [`ARRAY_MISMATCH at ${path}`];
    if (a.length !== b.length) errors.push(`ARRAY_LENGTH at ${path}: ${a.length} vs ${b.length}`);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      errors.push(...deepEqual(a[i], b[i], `${path}[${i}]`, tol));
    }
    return errors;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    // Check key sets
    const onlyA = keysA.filter(k => !b.hasOwnProperty(k));
    const onlyB = keysB.filter(k => !a.hasOwnProperty(k));
    if (onlyA.length) errors.push(`ONLY_IN_ORIG at ${path}: ${onlyA.join(',')}`);
    if (onlyB.length) errors.push(`ONLY_IN_OBF at ${path}: ${onlyB.join(',')}`);
    for (const k of keysA) {
      if (b.hasOwnProperty(k)) {
        errors.push(...deepEqual(a[k], b[k], `${path}.${k}`, tol));
      }
    }
    return errors;
  }

  // primitives
  if (a !== b) errors.push(`DIFF at ${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  return errors;
}

console.log(`Loading original: ${origFile}`);
let qdOrig;
try {
  qdOrig = loadScript(origFile);
  console.log('Original loaded OK ✓');
} catch (e) {
  console.error(`FATAL: Cannot load original: ${e.message}`);
  process.exit(1);
}

console.log(`Loading obfuscated: ${obfFile}`);
let qdObf;
try {
  qdObf = loadScript(obfFile);
  console.log('Obfuscated loaded OK ✓');
} catch (e) {
  console.error(`FATAL: Cannot load obfuscated: ${e.message}`);
  process.exit(1);
}

console.log(`\nRunning ${cases.length} test cases...\n`);

let allMatch  = true;
const results = [];

for (const tc of cases) {
  process.stdout.write(`  ${tc.id} — ${tc.description}... `);
  try {
    const resultOrig = qdOrig(tc.e, tc.t);
    const resultObf  = qdObf(tc.e, tc.t);
    const errors     = deepEqual(resultOrig, resultObf);

    if (errors.length === 0) {
      console.log('✅ MATCH');
      results.push({ id: tc.id, match: true });
    } else {
      console.log('❌ MISMATCH');
      console.log('   Differences:');
      errors.slice(0, 10).forEach(e => console.log(`     • ${e}`));
      if (errors.length > 10) console.log(`     ... and ${errors.length - 10} more`);
      results.push({ id: tc.id, match: false, errors });
      allMatch = false;
    }
  } catch (e) {
    console.log(`💥 ERROR: ${e.message}`);
    results.push({ id: tc.id, match: false, error: e.message });
    allMatch = false;
  }
}

console.log('\n' + '='.repeat(60));
if (allMatch) {
  console.log(`\nALL CASES MATCH ✅  (${cases.length}/${cases.length})`);
  process.exit(0);
} else {
  const failed = results.filter(r => !r.match).length;
  console.log(`\n❌ ${failed} CASE(S) FAILED out of ${cases.length}`);
  process.exit(1);
}
