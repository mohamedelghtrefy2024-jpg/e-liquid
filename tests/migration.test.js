// ─── Tests: Migration Backward Compatibility (Session-10) ────────────────────
// يختبر migrateRecipeData مع وصفات قديمة لا تحتوي على الحقول الجديدة.
// الدالة مُستنسخة مباشرة من dist/EPP-Calculator-merged.html بدلاً من import
// (لأن الملف المدمج HTML لا يمكن استيراده كـ ES module في بيئة الاختبار).

import { describe, it, expect } from 'vitest';

// ── Inline stub: نسخة طبق الأصل من migrationService في المشروع ─────────────

const CURRENT_RECIPE_VERSION = 1;

const RECIPE_MIGRATIONS = [
  {
    fromVersion: 0,
    migrate(data) {
      return {
        ...data,
        flavors: Array.isArray(data.flavors) ? data.flavors : [],
        steepDays: data.steepDays || 0,
        customFlavDens: data.customFlavDens || {},
        // null = "استخدم الكثافة الافتراضية من NIC_SALT_DENSITIES"
        customNicDens: data.customNicDens !== undefined ? data.customNicDens : null,
        deviceType: data.deviceType || 'mtl',
      };
    },
  },
];

function migrateRecipeData(data) {
  if (!data || typeof data !== 'object') return data;
  try {
    let current = data;
    let version = typeof data.version === 'number' ? data.version : 0;
    while (version < CURRENT_RECIPE_VERSION) {
      const step = RECIPE_MIGRATIONS.find((m) => m.fromVersion === version);
      if (!step) break;
      current = step.migrate(current);
      version += 1;
    }
    return { ...current, version: CURRENT_RECIPE_VERSION };
  } catch (err) {
    return data;
  }
}

function withVersion(data) {
  return { ...data, version: CURRENT_RECIPE_VERSION };
}

function migrateAllRecipes(recipesObj) {
  if (!recipesObj || typeof recipesObj !== 'object') return {};
  const migrated = {};
  for (const [name, recipe] of Object.entries(recipesObj)) {
    migrated[name] = migrateRecipeData(recipe);
  }
  return migrated;
}

// ── Helper: وصفة قديمة نموذجية (بدون أي حقول جديدة) ────────────────────────
function oldRecipe(overrides = {}) {
  return {
    targetVolumeMl: 100,
    pgRatio: 0.3,
    nicCarrierPgRatio: 1,
    targetNicStrength: 3,
    nicStockStrength: 72,
    nicType: 'freebase',
    flavors: [{ id: 1, name: 'Strawberry', mfr: 'TPA', pct: 5, pgRatio: 1, costPerMl: 2 }],
    waterPct: 0,
    alcoholPct: 0,
    pgCostPerMl: 0.06,
    vgCostPerMl: 0.08,
    nicCostPerMl: 11.67,
    bottleCost: 5,
    // ⬇ حقول الإصدار الجديد غائبة عمداً (اختبار backward compat)
    // لا customNicDens، لا deviceType، لا version
    ...overrides,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('migrateRecipeData — backward compatibility', () => {

  // ── 1. customNicDens ────────────────────────────────────────────────────────

  it('وصفة قديمة بدون customNicDens → تصبح null بعد migration', () => {
    const recipe = oldRecipe(); // بدون customNicDens
    expect('customNicDens' in recipe).toBe(false);

    const result = migrateRecipeData(recipe);

    expect(result.customNicDens).toBeNull();
  });

  it('وصفة قديمة بـ customNicDens صريح → يُحفظ كما هو', () => {
    const recipe = oldRecipe({ customNicDens: 1.05 });
    const result = migrateRecipeData(recipe);

    expect(result.customNicDens).toBe(1.05);
  });

  it('وصفة قديمة بـ customNicDens=null صريح → يبقى null', () => {
    const recipe = oldRecipe({ customNicDens: null });
    const result = migrateRecipeData(recipe);

    expect(result.customNicDens).toBeNull();
  });

  // ── 2. deviceType ───────────────────────────────────────────────────────────

  it('وصفة قديمة بدون deviceType → تصبح "mtl" بعد migration', () => {
    const recipe = oldRecipe(); // بدون deviceType
    expect('deviceType' in recipe).toBe(false);

    const result = migrateRecipeData(recipe);

    expect(result.deviceType).toBe('mtl');
  });

  it('وصفة قديمة بـ deviceType="subohm" → يُحفظ كما هو', () => {
    const recipe = oldRecipe({ deviceType: 'subohm' });
    const result = migrateRecipeData(recipe);

    expect(result.deviceType).toBe('subohm');
  });

  it('وصفة قديمة بـ deviceType="pod" → يُحفظ كما هو', () => {
    const recipe = oldRecipe({ deviceType: 'pod' });
    const result = migrateRecipeData(recipe);

    expect(result.deviceType).toBe('pod');
  });

  // ── 3. version field ────────────────────────────────────────────────────────

  it('وصفة قديمة بدون version → تحصل على version: 1 بعد migration', () => {
    const recipe = oldRecipe(); // بدون version
    expect('version' in recipe).toBe(false);

    const result = migrateRecipeData(recipe);

    expect(result.version).toBe(1);
  });

  it('وصفة بـ version: 0 صريح → تُرقَّى إلى version: 1', () => {
    const recipe = oldRecipe({ version: 0 });
    const result = migrateRecipeData(recipe);

    expect(result.version).toBe(1);
  });

  it('وصفة حديثة بـ version: 1 → تمر بدون تعديل إضافي', () => {
    const recipe = oldRecipe({ version: 1, customNicDens: 1.02, deviceType: 'pod' });
    const result = migrateRecipeData(recipe);

    expect(result.version).toBe(1);
    expect(result.customNicDens).toBe(1.02);
    expect(result.deviceType).toBe('pod');
  });

  // ── 4. بقية الحقول لا تتأثر ────────────────────────────────────────────────

  it('migration لا تُغيّر الحقول الأصلية الأخرى', () => {
    const recipe = oldRecipe();
    const result = migrateRecipeData(recipe);

    expect(result.targetVolumeMl).toBe(100);
    expect(result.pgRatio).toBe(0.3);
    expect(result.nicType).toBe('freebase');
    expect(result.targetNicStrength).toBe(3);
    expect(Array.isArray(result.flavors)).toBe(true);
    expect(result.flavors.length).toBe(1);
  });

  it('وصفة بدون flavors → تُصبح مصفوفة فارغة بعد migration', () => {
    const recipe = { targetVolumeMl: 50, pgRatio: 0.5 }; // لا flavors نهائياً
    const result = migrateRecipeData(recipe);

    expect(Array.isArray(result.flavors)).toBe(true);
    expect(result.flavors.length).toBe(0);
  });

  it('وصفة بـ flavors غير مصفوفة (تلف) → تُصبح مصفوفة فارغة', () => {
    const recipe = oldRecipe({ flavors: 'corrupted' });
    const result = migrateRecipeData(recipe);

    expect(Array.isArray(result.flavors)).toBe(true);
    expect(result.flavors.length).toBe(0);
  });

  // ── 5. حالات حافة (edge cases) ─────────────────────────────────────────────

  it('null input → يُعاد كما هو بدون crash', () => {
    expect(migrateRecipeData(null)).toBeNull();
  });

  it('string input → يُعاد كما هو بدون crash', () => {
    expect(migrateRecipeData('bad-data')).toBe('bad-data');
  });

  it('undefined input → يُعاد كما هو بدون crash', () => {
    expect(migrateRecipeData(undefined)).toBeUndefined();
  });

  it('كائن فارغ → يحصل على القيم الافتراضية + version: 1', () => {
    const result = migrateRecipeData({});

    expect(result.version).toBe(1);
    expect(result.customNicDens).toBeNull();
    expect(result.deviceType).toBe('mtl');
    expect(Array.isArray(result.flavors)).toBe(true);
  });
});

// ─── withVersion ──────────────────────────────────────────────────────────────

describe('withVersion', () => {
  it('يضيف version: 1 لأي كائن بيانات', () => {
    const data = { targetVolumeMl: 100, pgRatio: 0.3 };
    const result = withVersion(data);

    expect(result.version).toBe(CURRENT_RECIPE_VERSION);
    expect(result.targetVolumeMl).toBe(100); // الحقول الأصلية محفوظة
  });

  it('يُحدّث version لو كانت موجودة مسبقاً', () => {
    const result = withVersion({ version: 0, foo: 'bar' });

    expect(result.version).toBe(1);
    expect(result.foo).toBe('bar');
  });
});

// ─── migrateAllRecipes ────────────────────────────────────────────────────────

describe('migrateAllRecipes', () => {
  it('يرقّي كائن وصفات متعددة دفعة واحدة', () => {
    const recipes = {
      'وصفة التوت': oldRecipe({ flavors: [] }),
      'وصفة الفانيليا': oldRecipe({ flavors: [], deviceType: 'pod' }),
    };

    const result = migrateAllRecipes(recipes);

    expect(result['وصفة التوت'].version).toBe(1);
    expect(result['وصفة التوت'].deviceType).toBe('mtl'); // قيمة افتراضية
    expect(result['وصفة الفانيليا'].deviceType).toBe('pod'); // قيمة صريحة محفوظة
  });

  it('يُعيد {} لمدخل فارغ أو غير صالح', () => {
    expect(migrateAllRecipes(null)).toEqual({});
    expect(migrateAllRecipes(undefined)).toEqual({});
    expect(migrateAllRecipes('bad')).toEqual({});
  });

  it('يُعيد {} لكائن فارغ', () => {
    expect(migrateAllRecipes({})).toEqual({});
  });
});
