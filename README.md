# EPP Calculator

حاسبة خلطات السوائل الإلكترونية — تطبيق واحد قائم بذاته (single-file app)، بدون
خطوة بناء (build step)، يعمل مباشرة من ملف HTML واحد.

## البنية الحالية

```
EPP-end/
├── EPP-Calculator-merged.html  ← الملف الفعلي الذي يشغّل التطبيق بالكامل (افتحه مباشرة في المتصفح)
├── dist/EPP-Calculator-merged.html  ← نسخة مطابقة، للتوزيع
├── manifest.json                ← PWA manifest
├── sw.js                        ← Service Worker (offline caching)
├── icons/                       ← أيقونات PWA (icon-192.png, icon-512.png)
├── start.bat                    ← تشغيل سيرفر محلي (Windows) وفتح التطبيق تلقائياً
├── js/                          ← ملفات مساعدة لبيئة الاختبار فقط (Vitest)، غير مستخدمة من التطبيق نفسه
│   ├── helpers.js                 ← نفس منطق qd()/التقريب/التنسيق الموجود داخل الملف المدموج، بصيغة قابلة للاستيراد للاختبار
│   └── constants.js                ← stub بقيم ثابتة (كثافات PG/VG/النيكوتين) لبيئة الاختبار
├── tests/                       ← اختبارات Vitest (55 اختبار، ملفان)
│   ├── helpers.test.js             ← يختبر js/helpers.js
│   └── migration.test.js           ← مستقل، لا يعتمد على js/
├── package.json / package-lock.json
└── vitest.config.js
```

> ملاحظة: كانت توجد سابقاً بنية مودولارية كاملة (`js/App.js`, `js/translations.js`,
> `js/services/`, `js/components/`, `js/hooks/`, `js/vendor/`, و `build/merge.js`
> الذي يدمجها) — تم حذفها في جلسة تنظيف لأنها كانت غير مكتملة (تستورد من ملفات
> غير موجودة) وغير مستخدمة فعلياً في تشغيل التطبيق. التطبيق الحقيقي مكتوب بالكامل
> داخل `EPP-Calculator-merged.html` كملف واحد. بقي فقط `js/helpers.js` و
> `js/constants.js` لأن `tests/helpers.test.js` يعتمد عليهما فعلياً.

## النشر

افتح `EPP-Calculator-merged.html` مباشرة في المتصفح — لا يحتاج سيرفر. للتشغيل المحلي
مع دعم PWA كامل (Service Worker) استخدم `start.bat` (Windows) أو أي سيرفر ثابت
(`python -m http.server` مثلاً) من نفس المجلد.

للنشر على GitHub Pages: ادفع المجلد كاملاً، فعّل GitHub Pages، وافتح
`EPP-Calculator-merged.html` من الرابط الناتج مباشرة.

## التعديل على التطبيق

كل منطق التطبيق (الحساب، الواجهة، الترجمات، الثوابت) موجود داخل
`EPP-Calculator-merged.html` كملف واحد. لا توجد ملفات مصدر منفصلة تُدمَج — أي
تعديل يكون مباشرة على هذا الملف (وعلى `dist/EPP-Calculator-merged.html` بالمثل
إذا أردت الحفاظ على تطابق النسختين).

## الاختبار

```bash
npm install     # يثبّت jsdom + vitest (مرة واحدة فقط)
npm test        # يشغّل 55 اختبار عبر vitest run
```

اختبارات `tests/helpers.test.js` تغطي منطق الحساب الأساسي (`qd()`، التقريب،
التنسيق) عبر استيراد مباشر من `js/helpers.js` (نسخة منفصلة من نفس المنطق
الموجود في الملف المدموج، للاختبار خارج بيئة المتصفح). اختبارات
`tests/migration.test.js` تغطي منطق ترقية بيانات الوصفات القديمة بشكل مستقل.

---



## سجل التغييرات — جلسات التطوير

### الجلسة 8 (Session 8)

#### CRITICAL-18 — PWA (Progressive Web App)
- **`manifest.json`**: اسم التطبيق ثنائي اللغة، `display: standalone`، اتجاه RTL، ألوان الثيم (#6366f1)
- **`sw.js`**: Service Worker بنمط Cache-First + Stale-While-Revalidate، offline fallback، تحديث تلقائي
- **Install Prompt**: استقبال `beforeinstallprompt`، dispatch حدث `epp:installable`، دالة `window.eppShowInstallPrompt()`
- **`<head>`**: إضافة `<link rel="manifest">` + `<meta theme-color>` + Apple PWA tags

#### CRITICAL-19 — Error Logger Service
- **`js/services/errorLogger.js`**: `logError(context, error, extra)` / `getErrors()` / `clearErrors()` / `errorCount()`
- حد أقصى 50 خطأ — الأقدم يُحذف تلقائياً
- مقاوم للفشل: لا يرمي استثناءات أبداً حتى عند فشل localStorage
- **Integration**: `ErrorBoundary.componentDidCatch` يستدعي `errorLogger.logError` تلقائياً

#### CRITICAL-20 — حفظ تلقائي للتفضيلات
- `theme` → محفوظ ومستعاد من `storageService` (كان يُحفظ جزئياً)
- `lang` → كان مكتملاً، تأكيد
- `display` (volume/weight/drops) → يُحفظ عند التغيير، يُستعاد عند التحميل
- `activeTab` (basics/nicotine/flavors/cost/results) → يُحفظ عند التنقل، يُستعاد بشرط التحقق من القيمة

#### UI — customNicDensity + DeviceType
- **تبويب النيكوتين** → إضافة:
  - Device Type selector (4 أزرار: MTL / Pod / RDL / Sub-Ohm)
  - Custom Nic Density field (0.90–1.20 g/mL، step 0.001) + زر Reset
- **`useRecipeState`**: `customNicDens` (null = افتراضي) + `deviceType` ("mtl" default) + `setCustomNicDensV` validated
- **`migrationService`**: backward compat — وصفات قديمة تحصل على `customNicDens: null` و`deviceType: "mtl"`
- **`calculateRecipe`**: تمرير الحقلين إلى `qd()` عبر `recipeCalculator.js`
- **`draftWatchDeps` + `getState` + `applyState`**: محدَّثة للحقلين

---

### الجلسة 9 (Session 9)

#### Install Prompt Banner UI
- Banner أنيق في أعلى الشاشة (بنفسجي gradient) يظهر عند `epp:installable`
- زر "تثبيت / Install" يستدعي `window.eppShowInstallPrompt()`
- زر ✕ للإغلاق اليدوي
- اختفاء تلقائي عند `epp:installed`

#### اختبارات errorLogger (CRITICAL-19)
10 اختبارات جديدة في `js/helpers.test.js`:
- `logError` يحفظ entry وgetErrors يُعيده
- قبول non-Error values (strings)
- حفظ extra metadata
- `clearErrors` يُفرّغ السجل
- `errorCount` صحيح
- تراكم الأخطاء بالترتيب
- cap عند 50 خطأ (entry الأقدم يُحذف)
- صمود `logError` عند null/undefined input
- `getErrors` يُعيد [] عند localStorage فارغ
- التحقق من الحقول المطلوبة في كل entry

#### بيئة الاختبار
- **`package.json`**: vitest + jsdom dependencies
- **`vitest.config.js`**: بيئة jsdom لدعم localStorage
- **`js/constants.js`**: stub للاختبارات (ze، Jd، NIC_SALT_DENSITIES)
- تصحيح `t` stub في كلا ملفي الاختبار (warnWaterHeavy/warnAlcoholHeavy → functions)

#### نتيجة الاختبارات
```
Tests  98 passed (98) ✓
```

---

### الجلسة 10 (Session 10) — فحص شامل + إصلاحات + تنظيف

#### إصلاحات (مؤكدة بالفحص المباشر على الملفات، لا بالافتراض)
- **تضارب قائمة التبويبات**: استعادة `activeTab` من `localStorage` كانت تُفحص ضد مصفوفة قديمة غير متطابقة مع `TAB_IDS` الحقيقية (`additives`/`costs` كانا يُرفضان). تم التصحيح لاستخدام `TAB_IDS.includes(saved)`.
- **PWA معطّلة**: `manifest.json` كان يشاور على `index.html` غير الموجود في المشروع أصلاً. تم تصحيح `start_url` و`shortcuts[0].url` ليشاورا على `EPP-Calculator-merged.html` (الملف الذي يشغّله `start.bat` فعلياً).
- **أيقونات PWA مفقودة**: تم توليد `icons/icon-192.png` و `icons/icon-512.png` من نفس favicon SVG الموجود في رأس الملف.
- **`sw.js` يكاش ملفات غير موجودة**: قائمة `PRECACHE_ASSETS` كانت تحتوي 19 مسار، 14 منهم غير موجودين، والملف الحقيقي الشغال لم يكن فيها أصلاً. تم تصحيح القائمة لتحتوي فقط على الملفات الموجودة فعلياً والمهمة، وتصحيح offline navigate fallback، ورفع نسخة الكاش إلى `epp-calc-v2`.
- **كود ميت في `applyState()`**: حذف `mapping` مكرر لـ`flavorBottlePrice` كان مستحيل التنفيذ فعلياً.
- **`SteepTimer` يعرض `NaN%`/`Invalid Date`**: تم إضافة فحص `isNaN(mixed.getTime())` للتعامل بأمان مع `mixedOn` تواريخ فاسدة (مثلاً من JSON مستورد تالف).

#### تنظيف كود (بعد قرار صريح من المستخدم)
- **حذف نظام `OVER_TOTAL`/`overflowMl`/`requiredFlavorReductionPct` بالكامل**: كان dead code بعد أن أصبح `qd()` يصحح overflow الحجم تلقائياً (تأكدنا أن `totalExceeds100` كانت ترجع `false` دائماً). تم حذف الحساب من `calculateRecipe`، الـbanner المرتبط به في الواجهة، ومفاتيح الترجمة `overrideTotalWarning`/`warnReduceFlavors` (EN/AR) بعد تأكيد عدم استخدامها في أي مكان آخر.
- **حذف بنية `js/` المودولارية القديمة**: حذف `js/App.js`، `js/translations.js`، `js/recipeCalculator.js` (نسخة الجذر)، `js/services/` بالكامل (`errorLogger.js`, `recipeCalculator.js`)، و `js/helpers.test.js` (نسخة قديمة مكررة كانت تستورد من `errorLogger.js` المحذوف). تم الاحتفاظ فقط بـ`js/helpers.js` و `js/constants.js` لأن `tests/helpers.test.js` (في `tests/`، النسخة المعيارية الأحدث) يعتمد عليهما فعلياً عبر `npm test`. تم تشغيل `npm test` فعلياً بعد الحذف للتأكد: **55 اختبار، كلهم نجحوا**.

#### قرارات مؤجَّلة (بقرار صريح من المستخدم، لا تغيير حالياً)
- لا يوجد حد أعلى على عدد النكهات أو إجمالي نسبها مجتمعة — تم تركه كما هو، حيث أن نظام auto-scale في `qd()` يتعامل مع الحالة صحيحاً دون حاجة لقيد واجهة.

---

## كيفية تشغيل الاختبارات

```bash
npm install
npm test
```

## كيفية استخدام التطبيق

افتح `dist/EPP-Calculator-merged.html` مباشرةً في المتصفح — لا يحتاج server.

## ملاحظة PWA

لتفعيل PWA بالكامل، ضع الملفات على HTTPS server (أو localhost):
```
dist/EPP-Calculator-merged.html  → index.html
manifest.json
sw.js
```
