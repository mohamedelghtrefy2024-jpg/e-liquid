# EPP v2.3 — Release Changes Report

**تاريخ الإصدار:** 2026-06-29  
**الإصدار السابق:** v2.2.1 (Full Audit — All Fixes Applied)  
**الإصدار الحالي:** v2.3 (CSS Variables + PERF + A11Y + SEC)  
**المطوّر:** Claude Sonnet 4.6

---

## التغييرات المنفذة

### CSS-01 — Font CSS Variables ✅
**السطر:** 22–26 (`:root` block)  
**التغيير:** إضافة متغيرَي خط في `:root`:
```css
--epp-font-ar: 'Segoe UI','Arial','Tahoma',sans-serif;
--epp-font-en: system-ui,-apple-system,sans-serif;
```
**الأماكن المحدّثة:**
- `useLocale()` → `fontFamily` يستخدم `var(--epp-font-ar/en, fallback)` (سطر 1267)
- `ErrorBoundary` → `fontFamily` (سطر 3001)
- Print CSS → `font-family` (سطر 2838)

**الفائدة:** أي تغيير مستقبلي للخط يتم في مكان واحد فقط (`:root`)، بدلاً من 3+ أماكن.

---

### CSS-02 — Breakpoint CSS Variable ✅
**السطر:** 26 (`:root`) + 37 (`@media`)  
**التغيير:** إضافة `--epp-bp-mobile: 640px` كتوثيق مرجعي، مع comment على `@media`:
```css
@media(max-width:640px)/* v2.3 CSS-02: يطابق --epp-bp-mobile في :root */{
```
**ملاحظة:** CSS custom properties لا تعمل داخل `@media` queries مباشرة (قيد CSS)، لكن المتغير يُوثّق القيمة الرسمية للـ mobile breakpoint.

---

### PERF-05 — React.memo for RecipesTab ✅
**السطر:** 3359 + 4158  
**التغيير:**
```js
// قبل
function RecipesTab({...}) { ... }

// بعد
const RecipesTab = J.memo(function RecipesTab({...}) { ... });
```
**الفائدة:** `RecipesTab` هو أكبر مكوّن في التطبيق (800+ سطر). تغليفه بـ `React.memo` يمنع إعادة render عند تغيير state في الـ parent لا يؤثر على props الخاصة به (مثل `targetMl`, `fmtEGP`, `lang`).

---

### A11Y-01 — aria-atomic للـ ToastContainer ✅
**السطر:** 1986  
**التغيير:** إضافة `"aria-atomic":"true"` إلى container الـ Toasts  
**الحالة قبل:** `role:"status", "aria-live":"polite"`  
**الحالة بعد:** `role:"status", "aria-live":"polite", "aria-atomic":"true"`  
**الفائدة:** `aria-atomic="true"` يضمن قراءة قارئات الشاشة للـ Toast كاملاً كوحدة واحدة، لا جزءاً منه فقط.

---

### SEC-01 — Content Security Policy ✅
**السطر:** 7 (`<head>`)  
**التغيير:** إضافة meta tag:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline';
           style-src 'self' 'unsafe-inline';
           img-src 'self' data: blob:;
           connect-src 'none';
           object-src 'none';
           base-uri 'self';" />
```
**ملاحظة:** `unsafe-inline` مطلوب لأن جميع الـ scripts (React, Chart.js, QR Code) مدمجة كـ inline scripts في الملف الواحد. هذا قيد معروف للـ offline single-file architecture.  
**الفائدة:** يمنع تحميل scripts/styles/objects خارجية، ويحصر الـ connect على الملف نفسه فقط.

---

## المشاكل المؤجلة للـ v2.4+

| الكود | الوصف | السبب |
|-------|-------|-------|
| **PERF-06** | Web Worker للحسابات الكبيرة | يتطلب بنية تحتية معقدة |
| **TEST-01** | Unit tests | خارج نطاق الملف الواحد |
| **PERF-05b** | `React.memo` لـ `BrandCatalogModal` | مُغلّف بالفعل منذ v2.1 ✅ |

---

## مقارنة Before/After

| المعيار | v2.2.1 | v2.3 |
|---------|--------|------|
| Font hardcoded locations | 3 أماكن | 0 (كلها `var()`) ✅ |
| Breakpoint documented | لا | نعم (`:root`) ✅ |
| RecipesTab React.memo | لا | نعم ✅ |
| ToastContainer aria-atomic | لا | نعم ✅ |
| Content Security Policy | لا | نعم ✅ |
| الأسطر | 4,986 | 4,999 |

---

## Release Readiness

**النسبة: 100%** — جاهز للإصدار الكامل

جميع توصيات v2.3 من تقرير Audit v2.2.1 مُطبَّقة.
