// emojiHelpers.js — stub for test environment (mirrors merged HTML values)
// ─────────────────────────────────────────────────────────────────────────
// النسخة الأصلية الفعلية المستخدمة في التطبيق موجودة inline داخل
// EPP-Calculator-merged.html (انظر التعليق "FIX-01 (session: emoji coverage)"
// و"FIX-05 (session: emoji coverage)" بالقرب من BRAND_CATEGORY_EMOJI).
// هذا الملف نسخة مطابقة حرفياً لمنطق تلك الدوال فقط (بدون أي اعتماد على
// React/JSX) لتمكين اختبارات vitest آلية حقيقية على منطق الاستنتاج نفسه.
// أي تعديل مستقبلي على هذا المنطق inline بالملف المدموج يجب أن يُنسخ هنا
// أيضاً للحفاظ على تطابق الاختبارات مع السلوك الفعلي.

export const BRAND_CATEGORY_EMOJI = {
  Fruit:    "🍓",
  Cream:    "🍦",
  Dessert:  "🍰",
  Bakery:   "🥐",
  Beverage: "🥤",
  Tobacco:  "🍂",
  Mint:     "❄️",
  Special:  "✨",
};

export const DEFAULT_FLAVOR_EMOJI = "🍓";

export function flavorEmojiOrDefault(emoji) {
  return emoji || DEFAULT_FLAVOR_EMOJI;
}

export const FLAVOR_EMOJI_KEYWORDS = [
  // كريمات وحلويات
  [["vanilla","فانيليا","فانيلا"], "🍦"],
  [["custard","كاسترد"], "🍮"],
  [["caramel","toffee","كراميل","توفي"], "🍯"],
  [["honey","عسل"], "🍯"],
  [["fresh cream","cream","كريمة","قشطة"], "🍦"],
  [["cheesecake","تشيز كيك","تشيزكيك"], "🍰"],
  [["cake","كيكة","كعكة"], "🍰"],
  [["donut","doughnut","دونات"], "🍩"],
  [["cookie","biscuit","بسكويت","كوكيز","كوكي"], "🍪"],
  [["chocolate","cocoa","شوكولاتة","شوكولاته","شيكولاتة","كاكاو"], "🍫"],
  [["bubblegum","bubble gum","علكة","لبان"], "🍬"],
  [["candy","sweet","حلوى","سكاكر","بونبون"], "🍬"],
  // نعناع وبرودة
  [["mint","menthol","ice","cool","نعناع","مينثول","تبريد","ثلج"], "❄️"],
  // فواكه
  [["mango","مانجة","مانجو"], "🥭"],
  [["strawberry","فراولة"], "🍓"],
  [["cherry","كرز"], "🍒"],
  [["peach","apricot","خوخ","مشمش"], "🍑"],
  [["pineapple","أناناس"], "🍍"],
  [["kiwi","كيوي"], "🥝"],
  [["lemon","lime","ليمون"], "🍋"],
  [["orange","tangerine","برتقال","يوسفي"], "🍊"],
  [["grape","عنب"], "🍇"],
  [["pomegranate","رمان"], "🍇"],
  [["melon","cantaloupe","شمام","كانتالوب"], "🍈"],
  [["watermelon","بطيخ"], "🍉"],
  [["banana","موز"], "🍌"],
  [["pear","كمثرى"], "🍐"],
  [["apple","تفاح"], "🍎"],
  [["blueberry","berry","بلوبيري","توت أزرق","توت"], "🫐"],
  [["coconut","جوز هند","جوز الهند","كوكونت"], "🥥"],
  [["guava","جوافة"], "🍈"],
  [["lychee","ليتشي"], "🍈"],
  [["passion fruit","passionfruit","الباشن فروت","فاكهة العاطفة"], "🍈"],
  [["fig","تين"], "🍈"],
  // مكسرات
  [["almond","لوز"], "🌰"],
  [["hazelnut","بندق"], "🌰"],
  [["pistachio","فستق"], "🌰"],
  [["walnut","عين جمل","جوز"], "🌰"],
  [["peanut","فول سوداني"], "🥜"],
  // مشروبات
  [["coffee","espresso","قهوة","إسبريسو","اسبريسو"], "☕"],
  [["tea","شاي"], "🍵"],
  [["energy drink","مشروب طاقة"], "🥤"],
  [["cola","soda","صودا","كولا"], "🥤"],
  [["milk","حليب","لبن"], "🥛"],
  [["whiskey","whisky","bourbon","rum","ويسكي","رم","بوربون"], "🥃"],
  [["wine","نبيذ"], "🍷"],
  [["beer","بيرة"], "🍺"],
  // تبغ وأخشاب
  [["tobacco","cigar","توباكو","تبغ","سيجار"], "🍂"],
  [["wood","oak","cedar","خشب","بلوط","أرز"], "🪵"],
  // أزهار وأعشاب
  [["rose","ورد"], "🌹"],
  [["lavender","خزامى","لافندر"], "🌸"],
  [["anise","licorice","يانسون","عرق سوس"], "🌿"],
];

export function normalizeFlavorText(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")   // تشكيل عربي
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export function inferFlavorEmoji(name) {
  if (!name) return null;
  const norm = normalizeFlavorText(name);
  if (!norm) return null;
  for (const [keywords, emoji] of FLAVOR_EMOJI_KEYWORDS) {
    for (const kw of keywords) {
      if (norm.includes(normalizeFlavorText(kw))) return emoji;
    }
  }
  return null;
}

export function getBrandFlavorEmoji(cat, name) {
  if (cat !== "Special" && BRAND_CATEGORY_EMOJI[cat]) {
    return BRAND_CATEGORY_EMOJI[cat];
  }
  const inferred = name ? inferFlavorEmoji(name) : null;
  return inferred || BRAND_CATEGORY_EMOJI.Special;
}
