// compare-batch.cjs
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { JSDOM } = require(path.join(__dirname, 'node_modules', 'jsdom'));

const scriptFileA = process.argv[2]; // الأصلي
const scriptFileB = process.argv[3]; // المعتم
const casesFile = process.argv[4];

const codeA = fs.readFileSync(scriptFileA, 'utf8');
const codeB = fs.readFileSync(scriptFileB, 'utf8');
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));

const tObject = {
  ingNicotineBase: 'قاعدة النيكوتين', ingPG: 'PG', ingVG: 'VG',
  ingDistilledWater: 'ماء مقطر', ingAlcohol: 'كحول',
};

function makeContext() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
  });
  const { window } = dom;
  window.matchMedia = function () { return { matches: false, addListener() {}, removeListener() {} }; };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.requestAnimationFrame = function (cb) { return setTimeout(cb, 0); };
  window.cancelAnimationFrame = function (id) { clearTimeout(id); };
  return vm.createContext(window);
}

function loadQd(code) {
  const ctx = makeContext();
  try {
    vm.runInContext(code, ctx, { timeout: 20000 });
  } catch (e) {
    // قد تفشل أجزاء React render تحت jsdom، هذا متوقع؛ نستمر إذا qd معرّفة
  }
  if (typeof ctx.qd !== 'function') {
    throw new Error('qd not defined in this context');
  }
  return ctx.qd;
}

const qdA = loadQd(codeA);
const qdB = loadQd(codeB);

let allPass = true;
const report = [];

for (const c of cases) {
  let resA, resB, errA = null, errB = null;
  try { resA = qdA(c.qdInput, tObject); } catch (e) { errA = e.message; }
  try { resB = qdB(c.qdInput, tObject); } catch (e) { errB = e.message; }

  const strA = JSON.stringify(resA);
  const strB = JSON.stringify(resB);
  const match = !errA && !errB && strA === strB;

  if (!match) allPass = false;

  report.push({
    name: c.name,
    match,
    errA, errB,
    totalMlA: resA ? resA.totalMl : null,
    totalMlB: resB ? resB.totalMl : null,
    totalGA: resA ? resA.totalG : null,
    totalGB: resB ? resB.totalG : null,
    diffPreview: match ? null : { strA: strA ? strA.slice(0, 500) : strA, strB: strB ? strB.slice(0, 500) : strB },
  });
}

console.log(JSON.stringify(report, null, 2));
console.log('\n=== SUMMARY ===');
console.log(allPass ? 'ALL CASES MATCH ✅' : 'MISMATCH FOUND ❌');
process.exit(allPass ? 0 : 1);
