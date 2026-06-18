# أدوات التعتيم (Obfuscation Pipeline)

## الملفات الناتجة
- `EPP-Calculator-merged.html` — **النسخة المصدرية (Source)**. هذه التي تُعدَّل وتُطوَّر عليها دائمًا.
- `EPP-Calculator-protected.html` — **النسخة المعتّمة للنشر**. لا تُعدَّل يدويًا أبدًا؛ تُعاد توليدها من المصدر عند كل تغيير.

## كيف تُعيد توليد النسخة المعتّمة بعد أي تعديل على الكود

```bash
# 1) استخرج الـscripts من الملف المصدري المحدث
node extract-scripts.cjs EPP-Calculator-merged.html /tmp/extracted

# 2) عتّم الكود الرئيسي (script index 2) وكود الـPWA (script index 3)
node obfuscate-strong.cjs /tmp/extracted/script-2.js /tmp/extracted/script-2.obf.js
node obfuscate-strong.cjs /tmp/extracted/script-3.js /tmp/extracted/script-3.obf.js

# 3) أعد الدمج في ملف HTML نهائي
node rebuild-html.cjs EPP-Calculator-merged.html /tmp/extracted/manifest.json \
  "2:/tmp/extracted/script-2.obf.js,3:/tmp/extracted/script-3.obf.js" \
  EPP-Calculator-protected.html
```

## كيف تتحقق أن التعتيم لم يكسر شيئًا (قبل النشر، دائمًا)

```bash
# يشغّل دالة الحساب qd() على النسختين (الأصلية مقابل المعتّمة) بعدة حالات اختبار،
# ويتحقق من تطابق النتائج حرفيًا (JSON diff كامل، صفر اختلاف مقبول).
node compare-batch.cjs /tmp/extracted/script-2.js /tmp/extracted/script-2.obf.js test-cases-batch.json
```
يجب أن يطبع في النهاية: `ALL CASES MATCH ✅`
لو طلعت أي حالة `match: false`، **لا تنشر** الملف المعتّم — راجع التغييرات في الكود المصدري أولًا.

يمكنك إضافة حالات اختبار جديدة بسهولة بتعديل `test-cases-batch.json` (نفس بنية مدخلات `qd`).

## ملاحظات مهمة
- مستوى التعتيم الحالي في `obfuscate-strong.cjs`: أقوى مستوى متاح (control-flow flattening +
  dead code injection + string array encoding + self-defending). هذا يكبّر حجم الملف بمعدل
  4-4.5x تقريبًا (من ~330KB إلى ~1.38MB) ويزيد وقت أول تحميل، وهذا متوقع ومقبول.
- `debugProtection` و `unicodeEscapeSequence` معطّلتان عمدًا (انظر التعليقات في
  `obfuscate-strong.cjs`) لتجنّب كسر تجربة المستخدم الشرعي وتضخيم الحجم بسبب النصوص العربية.
- التعتيم يرفع صعوبة قراءة/نسخ الكود بشكل كبير، لكنه لا يمنع الوصول للمنطق بشكل مطلق لأي
  شخص يملك خبرة كافية وأدوات de-obfuscation. الحماية الحقيقية للمنطق الحساس تتطلب نقله
  إلى backend خارج المتصفح — وهذا قرار منفصل يمكن اتخاذه لاحقًا.
