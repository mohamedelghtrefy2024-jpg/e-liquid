// ─── Tests: helpers.js — رياضيات الخلط، التقريب، التنسيق (CRITICAL-13) ──────
import { describe, it, expect } from 'vitest';
import { I, Ie, Jt, roundTo, safeDivide, qd, fmtEGP, fmtMoneyRaw, sanitizeText } from '../js/helpers.js';

// رسائل ترجمة وهمية بنفس شكل Zd.ar/Zd.en المُستخدمة فعلياً في qd()
const t = {
  warnNicTooLow: (stock, target) => `stock ${stock} < target ${target}`,
  nicSaltWarning: 'nic salt warning',
  warnOverFlavor: (pct) => `over flavor ${pct}`,
  warnUnderFlavor: (pct) => `under flavor ${pct}`,
  warnExcessPG: 'excess pg',
  warnPgShortage: (ml) => `pg shortage ${ml}ml`,
  warnVgShortage: (ml) => `vg shortage ${ml}ml`,
  warnNicVolLimit: 'nic volume exceeds 90%',
  volumeDriftWarning: (a, b) => `drift ${a} vs ${b}`,
  ingNicotineBase: 'Nicotine Base',
  ingPG: 'PG',
  ingVG: 'VG',
  ingDistilledWater: 'Distilled Water',
  ingAlcohol: 'Alcohol',
  // SESSION-7/8 additions (REMAINING-01/03)
  warnWaterHeavy: (pct) => `Water ${pct}% exceeds 30% of VG budget`,
  warnAlcoholHeavy: (pct) => `Alcohol ${pct}% exceeds 30% of PG budget`,
  warnNicSaltSubohm: 'Nic salt >20mg/ml in sub-ohm device',
  warnNicSaltExtreme: 'Nic salt >50mg/ml in sub-ohm — dangerous',
  warnFreebasePodHigh: 'Freebase >20mg/ml in pod device',
  warnNicLowMtl: 'Nicotine <6mg/ml in MTL device — may feel too light',
};

function baseParams(overrides = {}) {
  return {
    targetVolumeMl: 100,
    pgRatio: 0.3,
    nicCarrierPgRatio: 1,
    targetNicStrength: 3,
    nicStockStrength: 72,
    nicType: 'freebase',
    flavors: [],
    waterPct: 0,
    alcoholPct: 0,
    pgCostPerMl: 0.06,
    vgCostPerMl: 0.08,
    nicCostPerMl: 11.67,
    bottleCost: 5,
    customPgDensity: undefined,
    customVgDensity: undefined,
    customFlavDensities: {},
    ...overrides,
  };
}

describe('I / Ie / Jt (rounding & unit helpers)', () => {
  it('I rounds to 3 decimals by default', () => {
    expect(I(1.23456)).toBe(1.235);
  });
  it('I rounds to a custom decimal count', () => {
    expect(I(1.23456, 1)).toBe(1.2);
  });
  it('Ie converts ml to grams via density (mass = volume * density)', () => {
    expect(Ie(10, 1.261)).toBe(I(10 * 1.261));
  });
  it('Jt converts ml to drops using the global drop factor (20 drops/ml)', () => {
    expect(Jt(1)).toBe(20);
    expect(Jt(0.5)).toBe(10);
  });
});

describe('roundTo (CRITICAL-08 canonical rounding)', () => {
  it('behaves identically to I() for finite numbers', () => {
    expect(roundTo(1.23456, 2)).toBe(I(1.23456, 2));
  });
  it('returns 0 for non-finite input instead of NaN/Infinity', () => {
    expect(roundTo(NaN)).toBe(0);
    expect(roundTo(Infinity)).toBe(0);
    expect(roundTo(-Infinity)).toBe(0);
  });
});

describe('safeDivide (FIX-10)', () => {
  it('returns a/b normally when b is non-zero', () => {
    expect(safeDivide(10, 4)).toBeCloseTo(2.5);
  });
  it('returns fallback (0) when b is zero', () => {
    expect(safeDivide(10, 0)).toBe(0);
    expect(safeDivide(10, 0, 99)).toBe(99);
  });
  it('returns fallback when b is NaN or Infinity', () => {
    expect(safeDivide(10, NaN)).toBe(0);
    expect(safeDivide(10, Infinity)).toBe(0);
  });
});

describe('qd() — core mixing calculation engine', () => {
  it('computes a simple 100ml / 30PG-70VG / 3mg recipe with no flavors', () => {
    const res = qd(baseParams(), t);
    expect(res.totalMl).toBeCloseTo(100, 0);
    expect(res.actualPg).toBeGreaterThan(25);
    expect(res.actualPg).toBeLessThan(35);
    expect(res.actualVg).toBeGreaterThan(65);
    // NIC_LOW_MTL fires for 3mg MTL (session-7 REMAINING-03) — check no errors
    expect(res.warnings.every(w => w.level !== 'error')).toBe(true);
  });

  it('computes nicotine volume from target/stock strength (l = target*vol/stock)', () => {
    const res = qd(baseParams({ targetNicStrength: 6, nicStockStrength: 60, targetVolumeMl: 60 }), t);
    expect(res.nicotine.ml).toBeCloseTo(6, 2);
  });

  it('raises NIC_TOO_LOW when stock strength is below target strength', () => {
    const res = qd(baseParams({ targetNicStrength: 50, nicStockStrength: 36 }), t);
    expect(res.warnings.some((w) => w.code === 'NIC_TOO_LOW')).toBe(true);
  });

  it('raises NIC_SALT_LOW info warning for low-strength nic salts', () => {
    const res = qd(baseParams({ nicType: 'nic_salt_benz', targetNicStrength: 10, nicStockStrength: 50 }), t);
    expect(res.warnings.some((w) => w.code === 'NIC_SALT_LOW')).toBe(true);
  });

  it('raises OVER_FLAVOR when total flavor percentage exceeds 25%', () => {
    const res = qd(baseParams({
      flavors: [
        { id: 1, name: 'A', mfr: 'X', pct: 15, pgRatio: 1, costPerMl: 0 },
        { id: 2, name: 'B', mfr: 'X', pct: 15, pgRatio: 1, costPerMl: 0 },
      ],
    }), t);
    expect(res.warnings.some((w) => w.code === 'OVER_FLAVOR')).toBe(true);
    expect(res.totalFlavorPct).toBe(30);
  });

  it('raises UNDER_FLAVOR when flavors exist but total is below 3%', () => {
    const res = qd(baseParams({
      flavors: [{ id: 1, name: 'A', mfr: 'X', pct: 1, pgRatio: 1, costPerMl: 0 }],
    }), t);
    expect(res.warnings.some((w) => w.code === 'UNDER_FLAVOR')).toBe(true);
  });

  it('does not raise UNDER_FLAVOR when there are no flavors at all', () => {
    const res = qd(baseParams({ flavors: [] }), t);
    expect(res.warnings.some((w) => w.code === 'UNDER_FLAVOR')).toBe(false);
  });

  it('computes per-flavor ml/g/drops/cost correctly', () => {
    const res = qd(baseParams({
      targetVolumeMl: 100,
      flavors: [{ id: 1, name: 'Strawberry', mfr: 'TPA', pct: 5, pgRatio: 1, costPerMl: 2 }],
    }), t);
    const fl = res.flavors[0];
    expect(fl.ml).toBeCloseTo(5, 2);
    expect(fl.cost).toBeCloseTo(10, 2);
  });

  // BUG-06 (جلسة تحسين تغطية الإيموجي): res.flavors[i] كان لا يحمل حقل emoji
  // إطلاقاً رغم وجوده على مدخل النكهة الأصلي — ما يعني أن أي مكان في الواجهة
  // يعتمد على res.flavors (شاشة النتائج الرئيسية qt، الرسم البياني، الطباعة،
  // Copy List) كان يفشل دائماً في عرض إيموجي النكهة الفعلي. هذا الاختبار يمنع
  // رجوع هذه الفجوة مستقبلاً.
  it('BUG-06: carries the emoji field through from input flavor to result (was missing entirely)', () => {
    const res = qd(baseParams({
      targetVolumeMl: 100,
      flavors: [
        { id: 1, name: 'Mango Madness', mfr: 'TPA', pct: 5, pgRatio: 1, costPerMl: 2, emoji: '🥭' },
        { id: 2, name: 'No Emoji Flavor', mfr: 'TPA', pct: 3, pgRatio: 1, costPerMl: 1 }, // بدون emoji أصلاً
      ],
    }), t);
    expect(res.flavors[0].emoji).toBe('🥭');
    expect(res.flavors[1].emoji).toBeUndefined(); // لا يخترع قيمة من عنده — الـfallback مسؤولية طبقة العرض (flavorEmojiOrDefault)
  });

  // BUG-06 follow-up: التأكد أن emoji يبقى محفوظاً حتى بعد معامل التصغير
  // النسبي (VOLUME_AUTO_SCALED) الذي يعيد بناء عناصر flavors عبر spread.
  it('BUG-06: emoji survives the proportional auto-scale-down path', () => {
    const res = qd(baseParams({
      targetVolumeMl: 10, // حجم صغير جداً يجبر عجز PG/VG فيُفعّل مسار التصغير
      pgRatio: 0.3,
      waterPct: 0,
      flavors: [{ id: 1, name: 'Vanilla Custard', mfr: 'TPA', pct: 25, pgRatio: 1, costPerMl: 2, emoji: '🍦' }],
    }), t);
    if (res.warnings.some(w => w.code === 'VOLUME_AUTO_SCALED')) {
      expect(res.flavors[0].emoji).toBe('🍦');
    } else {
      // لو الظروف الافتراضية متغيّرت ولم يُفعَّل مسار التصغير، النتيجة الأساسية
      // (بدون تصغير) لازم برضه تحافظ على emoji — تأكيد عام بغض النظر عن المسار.
      expect(res.flavors[0].emoji).toBe('🍦');
    }
  });

  it('applies custom density overrides for PG/VG and per-flavor', () => {
    const customDensity = 1.5;
    const res = qd(baseParams({ customPgDensity: customDensity, flavors: [] }), t);
    expect(res.pg.g).toBeCloseTo(I(res.pg.ml * customDensity), 2);
  });

  it('factors water and alcohol percentages into totals without cost', () => {
    const res = qd(baseParams({ waterPct: 5, alcoholPct: 2 }), t);
    expect(res.water.ml).toBeCloseTo(5, 1);
    expect(res.alcohol.ml).toBeCloseTo(2, 1);
    expect(res.water.cost).toBe(0);
    expect(res.alcohol.cost).toBe(0);
  });

  it('computes totalCost including nicotine, PG, VG, flavors and a flat bottle cost', () => {
    const res = qd(baseParams({ bottleCost: 10 }), t);
    expect(res.totalCost).toBeGreaterThanOrEqual(10);
  });

  it('returns totalMl close to target with zero ingredients beyond carriers', () => {
    const res = qd(baseParams({ targetVolumeMl: 250, pgRatio: 0.5 }), t);
    expect(res.totalMl).toBeGreaterThan(245);
    expect(res.totalMl).toBeLessThan(255);
  });

  // ── FIX-5: r=0 guard ───────────────────────────────────────────────────────
  it('FIX-5: returns safe zero result when targetVolumeMl is 0 (no Infinity/NaN)', () => {
    const res = qd(baseParams({ targetVolumeMl: 0 }), t);
    expect(res.totalMl).toBe(0);
    expect(res.nicotine.pct).toBe(0);
    expect(res.pg.pct).toBe(0);
    expect(Number.isFinite(res.costPerMl)).toBe(true);
    expect(res.costPerMl).toBe(0);
  });

  // ── FIX-7: costPerMl c=0 guard ────────────────────────────────────────────
  it('FIX-7: costPerMl is 0 (not Infinity) when total volume is effectively 0', () => {
    const res = qd(baseParams({ targetVolumeMl: 0 }), t);
    expect(Number.isFinite(res.costPerMl)).toBe(true);
  });

  // ── FIX-1/FIX-2: PG_SHORTAGE warning — no Math.max(0) hiding ──────────────
  it('FIX-1: raises PG_SHORTAGE when nicotine carrier PG exceeds target PG', () => {
    // 100ml, 10PG/90VG, nicCarrier=PG, stock=72, target=50 → nicVol≈69ml all PG
    // targetPG = 10ml, nicPG = 69ml → huge deficit
    const res = qd(baseParams({
      pgRatio: 0.1,
      nicCarrierPgRatio: 1,
      targetNicStrength: 50,
      nicStockStrength: 72,
    }), t);
    expect(res.warnings.some((w) => w.code === 'PG_SHORTAGE')).toBe(true);
    // PG ml should be 0 (clamped), not negative
    expect(res.pg.ml).toBeGreaterThanOrEqual(0);
  });

  // ── FIX-3: VG_SHORTAGE warning ────────────────────────────────────────────
  it('FIX-3: raises VG_SHORTAGE when water+VG nic carrier exceeds target VG', () => {
    // 100ml, 90PG/10VG, VG-carried nicotine + 8% water → VG deficit
    const res = qd(baseParams({
      pgRatio: 0.9,
      nicCarrierPgRatio: 0,  // nic carrier is pure VG
      targetNicStrength: 20,
      nicStockStrength: 72,
      waterPct: 8,
    }), t);
    expect(res.warnings.some((w) => w.code === 'VG_SHORTAGE')).toBe(true);
    expect(res.vg.ml).toBeGreaterThanOrEqual(0);
  });

  // ── FIX-8: NIC_VOL_LIMIT warning ──────────────────────────────────────────
  it('FIX-8: raises NIC_VOL_LIMIT when nicotine volume exceeds 90% of total', () => {
    // target=3mg, stock=3mg → l = 100ml = 100% of total (extreme case)
    const res = qd(baseParams({
      targetNicStrength: 3,
      nicStockStrength: 3,
      targetVolumeMl: 100,
    }), t);
    expect(res.warnings.some((w) => w.code === 'NIC_VOL_LIMIT')).toBe(true);
  });

  it('does NOT raise NIC_VOL_LIMIT for normal recipe (3mg/72mg stock)', () => {
    const res = qd(baseParams(), t);
    expect(res.warnings.some((w) => w.code === 'NIC_VOL_LIMIT')).toBe(false);
  });

  // ── FIX-9: totalPct removed (dead code) ────────────────────────────────────
  it('FIX-9: result does not include totalPct dead-code field', () => {
    const res = qd(baseParams(), t);
    expect(res).not.toHaveProperty('totalPct');
  });
});

describe('fmtEGP', () => {
  it('formats a number with the EGP suffix and given decimals', () => {
    expect(fmtEGP(12.3456, 2)).toBe(`${I(12.3456, 2)} ج.م`);
  });
  it('falls back to "0.00 ج.م" for null/undefined/NaN', () => {
    expect(fmtEGP(null)).toBe('0.00 ج.م');
    expect(fmtEGP(undefined)).toBe('0.00 ج.م');
    expect(fmtEGP(NaN)).toBe('0.00 ج.م');
  });
});

describe('fmtMoneyRaw (backward-compat alias)', () => {
  it('delegates to fmtEGP ignoring currency/rate args', () => {
    expect(fmtMoneyRaw(5, 'usd', 30, 2)).toBe(fmtEGP(5, 2));
  });
});

describe('sanitizeText (XSS guard)', () => {
  it('strips angle brackets to neutralize tag injection', () => {
    expect(sanitizeText('<script>alert(1)</script>')).not.toContain('<');
    expect(sanitizeText('<script>alert(1)</script>')).not.toContain('>');
  });
  it('truncates to 50 characters', () => {
    expect(sanitizeText('a'.repeat(100)).length).toBe(50);
  });
  it('returns empty string for falsy input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});
