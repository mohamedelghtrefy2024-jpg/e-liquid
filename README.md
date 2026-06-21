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
│   ├── constants.js                ← stub بقيم ثابتة (كثافات PG/VG/النيكوتين) لبيئة الاختبار
│   └── emojiHelpers.js             ← stub يطابق منطق استنتاج/توحيد إيموجي النكهة (FIX-01/FIX-05) الموجود داخل الملف المدموج
├── tests/                       ← اختبارات Vitest (82 اختبار، 3 ملفات)
│   ├── helpers.test.js             ← يختبر js/helpers.js
│   ├── migration.test.js           ← مستقل، لا يعتمد على js/
│   └── emojiHelpers.test.js        ← يختبر js/emojiHelpers.js (استنتاج الإيموجي + توحيد الـfallback)
├── package.json / package-lock.json
└── vitest.config.js
```

> ملاحظة: كانت توجد سابقاً بنية مودولارية كاملة (`js/App.js`, `js/translations.js`,
> `js/services/`, `js/components/`, `js/hooks/`, `js/vendor/`, و `build/merge.js`
> الذي يدمجها) — تم حذفها في جلسة تنظيف لأنها كانت غير مكتملة (تستورد من ملفات
> غير موجودة) وغير مستخدمة فعلياً في تشغيل التطبيق. التطبيق الحقيقي مكتوب بالكامل
> داخل `EPP-Calculator-merged.html` كملف واحد. بقي فقط `js/helpers.js` و
> `js/constants.js` و`js/emojiHelpers.js` لأن ملفات `tests/` تعتمد عليها فعلياً.

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
npm test        # يشغّل 82 اختبار عبر vitest run
```

اختبارات `tests/helpers.test.js` تغطي منطق الحساب الأساسي (`qd()`، التقريب،
التنسيق) عبر استيراد مباشر من `js/helpers.js` (نسخة منفصلة من نفس المنطق
الموجود في الملف المدموج، للاختبار خارج بيئة المتصفح). اختبارات
`tests/migration.test.js` تغطي منطق ترقية بيانات الوصفات القديمة بشكل مستقل.
اختبارات `tests/emojiHelpers.test.js` تغطي منطق استنتاج إيموجي النكهة التلقائي
(`inferFlavorEmoji`) وتوحيد الـfallback (`flavorEmojiOrDefault`) عبر استيراد
مباشر من `js/emojiHelpers.js` (نسخة منفصلة من نفس المنطق inline داخل الملف
المدموج — انظر جلسة تحسين تغطية الإيموجي أدناه).

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

### الجلسة 11 (Session 11) — تحسين تغطية الإيموجي والاتساق البصري (SSCP — dev/feature)

#### الهدف
طبقة استنتاج إيموجي تلقائية فوق نظام EmojiPicker اليدوي الموجود مسبقاً (بدون
استبداله)، + توحيد الـfallback المتفرق، + تحسينات اتساق بصري صغيرة (أيقونات
أجهزة، فلتر كتالوج، شريط معاينة الوصفات المحفوظة).

#### FIX-01 — `inferFlavorEmoji(name)` (استنتاج تلقائي EN/AR)
- دالة جديدة + `FLAVOR_EMOJI_KEYWORDS` (٥٠+ كلمة مفتاحية إنجليزي/عربي، أصناف:
  كريمات/حلويات، نعناع وبرودة، فواكه، مكسرات، مشروبات، تبغ وأخشاب، أزهار
  وأعشاب) + `normalizeFlavorText()` لتوحيد أشكال الألف/التاء المربوطة/الياء
  والتشكيل العربي قبل المطابقة.
- `addFlavor()`: يستخدم `flavorEmojiOrDefault(inferFlavorEmoji(defaultName))`
  بدل `emoji:"🍓"` الثابت، مع `_emojiManual:false` على النكهة الجديدة.
- `updateFlavorV()`: عند تغيير `name` يدوياً، يُعاد استنتاج الإيموجي تلقائياً
  **فقط لو `!_emojiManual`** — فلاج جديد على كل نكهة يمنع الكتابة فوق اختيار
  المستخدم اليدوي من EmojiPicker أو من كتالوج الشركة.
- `setFlavorEmojiManual(id, emoji)` (جديدة): يستخدمها `EmojiPicker.onSelect`
  بدل `updateFlavor` المباشر — تضبط `emoji` و`_emojiManual:true` بعملية واحدة.
- `getBrandFlavorEmoji(cat, name)`: باراميتر `name` جديد اختياري (توافق رجعي
  كامل مع الاستدعاءات القديمة بمعامل واحد). لصنف `"Special"` تحديداً، تُجرَّب
  `inferFlavorEmoji(name)` كطبقة ثانية قبل الرجوع لـ✨ المباشرة.
- `applyState()`: وصفات قديمة بدون `_emojiManual` تُعامَل كـ`true` افتراضياً
  (توافق رجعي — لا نريد لاستنتاج تلقائي مفاجئ أن يُغيّر إيموجي وصفة محفوظة
  سابقاً بمجرد تحميلها).

#### FIX-02 — أيقونة لكل نوع جهاز
- إضافة `icon` لكل عنصر في `n.devices` (EN+AR): MTL→🚬، Pod→🔋، RDL→⚖️،
  DTL→💨، Disposable→🗑️. مُعروضة فعلياً في زر اختيار الجهاز (تبويب Basics)
  وفي قائمة "Device Guide".

#### FIX-03 — إيموجي في فلتر الصنف بالكتالوج
- خيارات `<select>` الخاصة بـ`catFilter` داخل `BrandCatalogModal` الآن بادئتها
  إيموجي الصنف عبر `getBrandFlavorEmoji(c)` (+ "🗂️" لخيار "الكل").

#### FIX-04 — شريط إيموجيز في الوصفات المحفوظة
- `SavedRecipesPanel`: كل وصفة محفوظة تعرض الآن شريط إيموجيز أول 5 نكهات
  (`recipes[name].flavors.slice(0,5)`) بجانب اسمها.

#### FIX-05 — توحيد fallback الإيموجي
- ثابت/دالة موحّدة جديدة: `DEFAULT_FLAVOR_EMOJI = "🍓"` و
  `flavorEmojiOrDefault(emoji)`. استبدلت **خمسة** مواضع متفرقة كانت تستخدم
  `||"🍓"` (في `applyState`، معاينة `EmojiPicker`، زر اختيار إيموجي بقائمة
  النكهات، `current` prop) و`||"🍶"` المختلفة تماماً في مُصدِّر PNG.

#### اختبارات جديدة
- `js/emojiHelpers.js` (جديد): نسخة مطابقة حرفياً لمنطق FIX-01/FIX-05 (بدون
  React) للاختبار الآلي خارج المتصفح — بنفس نمط `js/constants.js`.
- `tests/emojiHelpers.test.js` (جديد): 25 اختبار — استنتاج EN/AR (بما فيها
  أشكال إملائية عربية مختلفة: فانيليا/فانيلا، شوكولاتة/شوكولاته، مانجة/مانجو)،
  حالات بدون تطابق، توحيد fallback، توافق رجعي لـ`getBrandFlavorEmoji` بمعامل
  واحد فقط، الطبقة الثانية لصنف Special.
- تم التأكد يدوياً (سكريبت مقارنة) أن سلوك `js/emojiHelpers.js` مطابق ١٠٠٪
  لمنطق `inferFlavorEmoji`/`getBrandFlavorEmoji` الفعلي المُستخرج حرفياً من
  `EPP-Calculator-merged.html`.
- فحص بناء جملة كامل (`node --check`) على محتوى `<script type="module">`
  بالملف المدموج بعد كل التعديلات — ناجح.

#### نتيجة الاختبارات
```
Test Files  3 passed (3)
     Tests  82 passed (82)   (36 helpers + 21 migration + 25 emojiHelpers)
```

---

### تكملة الجلسة 11 — BUG-06 (اكتُشف أثناء مراجعة "هل فيه حاجة ناقصة؟")

#### الاكتشاف
عند مراجعة تدفّق البيانات الفعلي، تبيّن أن `_qdImpl()` (محرك الحساب الأساسي
خلف `qd()`) كان يبني عناصر `res.flavors[i]` من جديد بدون حقل `emoji`:
```js
return{name:E.name,mfr:E.mfr,ml:I(M),g:Ie(M,dens),drops:Jt(M),pct:E.pct,cost:I(M*E.costPerMl,4)}
```
رغم أن مكوّن `qt` (شاشة النتائج الرئيسية) فيه بالفعل كود من جلسة سابقة
(`// FIX-FLAVOR-ICON: ...`) يحاول قراءة `item.emoji` — لكنه كان دائماً
`undefined` لأن طبقة الحساب لا تُمرره أصلاً. **النتيجة: كل النكهات في شاشة
النتائج الرئيسية (أكثر شاشة استخدامًا في التطبيق) كانت تعرض نفس الأيقونة
الثابتة 🍓 دائماً، بغض النظر عن الإيموجي الفعلي المختار لكل نكهة.**

هذا أيضاً كان السبب وراء أن مُصدِّر PNG اضطر لعمل بحث بالاسم
(`flavors.find(x=>x.name===f.name)`) بدل قراءة `f.emoji` مباشرة — workaround
غير موثوق (ينكسر مع نكهتين بنفس الاسم).

#### الإصلاح (BUG-06)
- `_qdImpl()` في الملف المدموج + `qd()` في `js/helpers.js`: إضافة
  `emoji:E.emoji` لعنصر النكهة المُرجَع. تم التأكد أن `emoji` ينجو من مسار
  `VOLUME_AUTO_SCALED` (يعيد البناء عبر spread `{...fl,...}` فيحافظ عليه تلقائياً).
- مُصدِّر PNG: إزالة workaround البحث بالاسم بالكامل (`srcFl`) — `f.emoji`
  و`f.mfr` متاحان مباشرة الآن من `res.flavors`.
- **3 أماكن إضافية** كانت تعرض اسم النكهة بدون إيموجي (لم تكن ضمن قائمة
  FIX-01..05 الأصلية، اكتُشفت أثناء تتبّع كل استهلاكات `res.flavors`):
  1. جدول المكونات في `exportPDF()` (تصدير PDF/طباعة خارجية) — وسم عناصر
     النكهات بـ`_isFlavor` لتمييزها عن نيكوتين/PG/VG/ماء/كحول.
  2. جدول المكونات الداخلي `allPrintItems` (طباعة المتصفح المباشرة عبر
     `window.print()`) — نفس أسلوب `_isFlavor`.
  3. جدول "تفاصيل النكهات" بالطباعة (سعر/حجم الزجاجة) — إيموجي قبل الاسم مباشرة.
  4. `copyList()` (نسخ القائمة للحافظة) — إيموجي كبادئة لكل سطر نكهة.
  5. `RecipeChart` (legend/tooltip الرسم البياني الدائري Chart.js) — إيموجي
     كبادئة لتسميات النكهات في legend، ينعكس تلقائياً على الـtooltip.

#### اختبارات جديدة لـBUG-06
- `tests/helpers.test.js`: اختباران جديدان —
  1. تأكيد أن `res.flavors[i].emoji` ينتقل من المُدخل للناتج (ولا يُختلق قيمة
     لنكهة بلا إيموجي — الـfallback مسؤولية `flavorEmojiOrDefault` في طبقة
     العرض فقط).
  2. تأكيد بقاء `emoji` بعد مسار التصغير النسبي `VOLUME_AUTO_SCALED`.
- تحقّق يدوي إضافي: استخراج `qd()`/`_qdImpl()` **حرفياً** من
  `EPP-Calculator-merged.html` (sed) وتشغيلها مباشرة في Node للتأكد من أن
  الإصلاح يعمل في نفس كود الملف الفعلي المُسلَّم، وليس فقط في نسخة `js/helpers.js`
  المرآة.

#### نتيجة الاختبارات النهائية
```
Test Files  3 passed (3)
     Tests  82 passed (82)   (36 helpers + 21 migration + 25 emojiHelpers)
```

#### نقطة الاستكمال
لا توجد عناصر معلّقة. تمت مراجعة كل استهلاكات `res.flavors` في الملف (10 مواضع)
وتغطيتها بالكامل: شاشة النتائج (qt)، الرسم البياني، 3 جداول طباعة/PDF، Copy
List، ومُصدِّر PNG. المواضع المتبقية غير المُعدَّلة (مفتاح memoization داخلي،
وaria-label لقارئ الشاشة) استُبعدت عمداً لأنها لا تستفيد من إيموجي بصرياً
(انظر التعليقات المضمّنة في الكود لتفاصيل كل قرار استبعاد).

---



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
