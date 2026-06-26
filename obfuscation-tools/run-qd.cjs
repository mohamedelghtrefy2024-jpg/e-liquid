#!/usr/bin/env node
/**
 * run-qd.cjs
 * Loads an extracted script file (which contains qd() function)
 * and executes it with the given input, printing JSON result to stdout.
 *
 * Usage (internal, called by compare-batch.cjs):
 *   node run-qd.cjs <script-file.js> '<input-json>'
 *
 * The script file must define qd() in its scope.
 * We use Function() to execute it in a browser-like context.
 */
'use strict';

const fs  = require('fs');
const vm  = require('vm');

const [,, scriptFile, inputJson] = process.argv;
if (!scriptFile || !inputJson) {
  process.stderr.write('Usage: node run-qd.cjs <script.js> \'<input-json>\'\n');
  process.exit(1);
}

const code   = fs.readFileSync(scriptFile, 'utf8');
const input  = JSON.parse(inputJson);

// Minimal browser-like globals needed for the EPP calculator
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
  console             : console,
  Math                : Math,
  JSON                : JSON,
  Object              : Object,
  Array               : Array,
  Date                : Date,
  Error               : Error,
  Promise             : Promise,
  Map                 : Map,
  Set                 : Set,
  WeakMap             : WeakMap,
  WeakSet             : WeakSet,
  Symbol              : Symbol,
  parseInt            : parseInt,
  parseFloat          : parseFloat,
  isNaN               : isNaN,
  isFinite            : isFinite,
  decodeURIComponent  : decodeURIComponent,
  encodeURIComponent  : encodeURIComponent,
  atob                : (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa                : (s) => Buffer.from(s, 'binary').toString('base64'),
};

const ctx = vm.createContext({
  ...mockWindow,
  window  : mockWindow,
  global  : mockWindow,
  self    : mockWindow,
  document: {
    createElement: () => ({ style: {} }),
    getElementById: () => null,
    querySelector : () => null,
    querySelectorAll: () => [],
    addEventListener : () => {},
  },
  localStorage  : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  performance   : { now: () => Date.now() },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame : clearTimeout,
});

try {
  vm.runInContext(code, ctx, { timeout: 30000 });
} catch (e) {
  // Many React/module scripts will throw on init outside browser — that's OK.
  // We only need the calculation functions to be available.
  if (!ctx.qd && !ctx._qdImpl) {
    process.stderr.write(`Script load error (no qd found): ${e.message}\n`);
  }
}

// Try to find qd
const qdFn = ctx.qd;
if (typeof qdFn !== 'function') {
  process.stderr.write(`ERROR: qd() function not found in ${scriptFile}\n`);
  process.exit(2);
}

try {
  const result = qdFn(input.e, input.t);
  process.stdout.write(JSON.stringify(result) + '\n');
} catch (e) {
  process.stderr.write(`ERROR running qd(): ${e.message}\n`);
  process.exit(3);
}
