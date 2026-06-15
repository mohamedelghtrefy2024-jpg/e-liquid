# EPP Calculator — Modular Source

هذه نسخة مُقسّمة (modular) من حاسبة EPP، تم استخراجها من ملف HTML واحد إلى وحدات
ES Modules منفصلة لتسهيل القراءة والصيانة، مع الحفاظ على كل الوظائف والترجمات كما هي.

## البنية

```
EPP/
├── index.html                  ← الصفحة الرئيسية (head + CSS + روابط CDN + mount)
├── js/
│   ├── vendor/
│   │   └── vendor-react.js     ← حزمة React 18.3.1 + ReactDOM + jsx-runtime
│   │                              (مُصدّرة كـ J, p, yc)
│   ├── translations.js         ← الترجمات (Zd) — عربي/إنجليزي
│   ├── constants.js            ← الكثافات، القيم الافتراضية، نظام الثيمات (S)، CAT_COLORS
│   ├── helpers.js              ← دوال التقريب، حساب الخلطة (qd)، fmtEGP، sanitizeText، showToast
│   ├── components/
│   │   ├── common.js           ← ToastContainer, le, ao, He, ct, Lt, WarnBanner, qt, ConfirmDialog
│   │   ├── EmojiPicker.js
│   │   ├── SteepTimer.js
│   │   ├── RecipeChart.js       ← يحتاج Chart.js (عام via window.Chart)
│   │   ├── QRModal.js            ← يحتاج QRCode.js (عام via window.QRCode)
│   │   ├── SavedRecipesPanel.js
│   │   └── pdfExport.js          ← exportPDF, يحتاج jsPDF (عام via window.jspdf)
│   └── App.js                  ← المكوّن الرئيسي op() + استدعاء render
└── build/
    ├── merge.js                 ← سكريبت دمج بسيط (اختياري) لإنشاء ملف HTML واحد
    ├── smoke-test.js             ← اختبار سريع للنسخة المُقسّمة
    └── smoke-test-merged.js      ← اختبار سريع للنسخة المدموجة
```

## النشر على GitHub Pages

لا تحتاج أي خطوة بناء (build step). ES Modules تُقدَّم بشكل صحيح من GitHub Pages
بصيغة MIME الصحيحة تلقائيًا. فقط:

1. ادفع مجلد `EPP/` كاملًا إلى مستودع GitHub (أو فرع `gh-pages`، أو أي مجلد ضمن المستودع).
2. فعّل GitHub Pages من إعدادات المستودع (Settings → Pages) واختر المجلد المناسب.
3. افتح `https://<username>.github.io/<repo>/EPP/` — التطبيق سيعمل مباشرة.

> ملاحظة: لو وضعت `EPP/` في جذر المستودع وفعّلت Pages على الجذر، يصبح الرابط
> `https://<username>.github.io/<repo>/` مباشرة (بدون `/EPP/`).

## التعديل على ملف بمفرده

كل ملف مستقل تقريبًا:

- **الترجمات** (`translations.js`) — لإضافة/تعديل نصوص عربي/إنجليزي فقط.
- **الثوابت والثيمات** (`constants.js`) — لإضافة Ratio presets جديدة، أو ألوان ثيم، أو نسب كثافة.
- **منطق الحساب** (`helpers.js`) — لتعديل معادلة الخلط (`qd`) أو التحويلات.
- **أي مكوّن واجهة** داخل `components/` — مستقل ويُصدَّر باسمه (export)، ويُستورد في `App.js`.
- **App.js** — الشاشة الرئيسية والـ state العام؛ يستورد كل ما سبق.

عند تعديل اسم export في أي ملف، تذكّر تحديث جملة `import` المقابلة في الملفات
التي تستخدمه (أبرزها `App.js`).

## السكريبت المُدمِج (اختياري)

`build/merge.js` يجمع كل وحدات `js/` (بالترتيب الصحيح للاعتمادية) في ملف HTML
واحد قائم بذاته — مفيد للاستخدام دون اتصال أو للمشاركة كملف واحد:

```bash
cd EPP
node build/merge.js
# الناتج: dist/EPP-Calculator-merged.html
```

هذا **ليس** أداة تجميع (bundler) حقيقية — لا minification ولا tree-shaking،
فقط يحذف سطور `import`/`export` ويلصق الملفات ببعضها بنفس ترتيب الاعتمادية.
لا تحتاجه على GitHub Pages؛ هو فقط لتوزيع ملف واحد عند الحاجة.

## الاختبار

```bash
cd EPP
npm install jsdom   # مرة واحدة فقط
node build/smoke-test.js          # يختبر النسخة المُقسّمة (js/App.js)
node build/merge.js                # يبني dist/EPP-Calculator-merged.html
node build/smoke-test-merged.js   # يختبر الملف المدموج
```

كلا الاختبارين يقومان بتثبيت (mount) التطبيق داخل jsdom مع mocks لمكتبات CDN
(Chart.js, jsPDF, QRCode) ويتأكدان من عدم وجود استثناءات أثناء التهيئة الأولى.
