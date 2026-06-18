// run-qd.cjs
// يشغّل سكريبت JS كامل (الأصلي أو المعتّم) داخل vm context مزوّد ببيئة DOM
// بسيطة من jsdom، فقط لإرضاء أي مراجع document/window/navigator أثناء التحميل،
// ثم يستدعي دالة qd() مباشرة (المعرّفة كـglobal function declaration في الكود)
// بنفس مدخلات الاختبار، ويطبع الناتج كـJSON.
//
// هذا تجاوز متعمد لمحاولة رندر React بالكامل (غير مدعوم في jsdom) والتركيز
// فقط على التحقق من سلامة منطق الحساب الرياضي نفسه قبل/بعد التعتيم.

const path = require('path');
const vm = require('vm');
const fs = require('fs');
const { JSDOM } = require(path.join(__dirname, 'node_modules', 'jsdom'));

const scriptFile = process.argv[2];
const inputsFile = process.argv[3]; // JSON بمدخلات qd + كائن t (نصوص الترجمة)

const code = fs.readFileSync(scriptFile, 'utf8');
const { qdInput, tObject } = JSON.parse(fs.readFileSync(inputsFile, 'utf8'));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
const { window } = dom;

// بعض الكود قد يستخدم matchMedia / ResizeObserver / requestAnimationFrame
// التي لا توفرها jsdom افتراضيًا. نضيف polyfills بسيطة لتجنّب توقف التنفيذ.
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {} };
};
window.ResizeObserver = window.ResizeObserver || class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 0); };
window.cancelAnimationFrame = window.cancelAnimationFrame || function (id) { clearTimeout(id); };

const context = vm.createContext(window);

let caughtError = null;
try {
  // ننفذ السكريبت كامل (React bundle + كل التطبيق) في الـcontext
  // أي استدعاء فعلي لـReactDOM.createRoot لن يحدث لأننا لا نملك نقطة الدخول
  // (تلك موجودة في الجزء النهائي من نفس السكريبت الذي يستدعي createRoot/render
  // على #root، وقد يفشل بهدوء في jsdom دون أن يوقف التنفيذ — هذا متوقع ومقبول
  // لأن هدفنا فقط الوصول إلى دالة qd المعرّفة في الـglobal scope).
  vm.runInContext(code, context, { timeout: 20000 });
} catch (e) {
  caughtError = e;
}

if (typeof context.qd !== 'function') {
  console.error('FATAL: qd is not defined in context after running script.');
  if (caughtError) {
    console.error('Script execution error:', caughtError.stack || caughtError.message);
  }
  process.exit(1);
}

if (caughtError) {
  // قد يحدث خطأ في جزء render الخاص بـReact (متوقع تحت jsdom) لكن qd لا يزال متاحًا
  console.error('[non-fatal] Script raised error after defining qd (likely React render under jsdom):', (caughtError.message || '').slice(0, 200));
}

try {
  const result = context.qd(qdInput, tObject);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error('ERROR calling qd:', e.stack || e.message);
  process.exit(1);
}
