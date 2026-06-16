// Verifies dist/EPP-Calculator-merged.html (produced by build/merge.js).
//
// NOTE: jsdom does not execute inline <script type="module"> content, so we
// can't just load the HTML in jsdom and wait. Instead we extract the inline
// module script, write it to a temp .mjs file, set up the same jsdom-backed
// globals as build/smoke-test.js, and `import()` it via Node's real ESM
// loader — this exercises the exact code that will run in a browser.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const os = require('os');
const path = require('path');

(async () => {
  const distFile = path.join(__dirname, '..', 'dist', 'EPP-Calculator-merged.html');
  const html = fs.readFileSync(distFile, 'utf-8');

  const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Could not find inline module script in merged file');
  const script = m[1];

  const dom = new JSDOM(`<!doctype html><html><head><title></title></head><body><div id="root"></div></body></html>`, {
    runScripts: 'outside-only',
    url: 'http://localhost/EPP/dist/EPP-Calculator-merged.html',
  });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage;
  global.navigator = window.navigator;
  global.MutationObserver = window.MutationObserver || class { observe(){} disconnect(){} };
  global.window.Chart = function(){ return { destroy(){} }; };
  global.window.jspdf = { jsPDF: function(){ return {
    setFillColor(){},setTextColor(){},setFontSize(){},setFont(){},text(){},setLineWidth(){},setDrawColor(){},line(){},rect(){},roundedRect(){},addPage(){},save(){}
  }; } };
  global.window.QRCode = function(){};

  const tmpFile = path.join(os.tmpdir(), `epp-merged-${Date.now()}.mjs`);
  fs.writeFileSync(tmpFile, script, 'utf-8');

  try {
    await import('file://' + tmpFile);
    await new Promise(r => setTimeout(r, 100));
    const root = document.getElementById('root');
    console.log('root children:', root.children.length);
    console.log('SUCCESS: merged single-file build mounted without throwing');
  } finally {
    fs.unlinkSync(tmpFile);
  }
})().catch(e => {
  console.error('FAILURE:', e);
  process.exit(1);
});
