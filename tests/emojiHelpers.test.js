// ─── Tests: emojiHelpers.js — استنتاج الإيموجي التلقائي وتوحيد الـfallback ──
// (FIX-01 + FIX-05 — جلسة تحسين تغطية الإيموجي والاتساق البصري)
import { describe, it, expect } from 'vitest';
import {
  getBrandFlavorEmoji,
  flavorEmojiOrDefault,
  inferFlavorEmoji,
  normalizeFlavorText,
  DEFAULT_FLAVOR_EMOJI,
  BRAND_CATEGORY_EMOJI,
} from '../js/emojiHelpers.js';

describe('inferFlavorEmoji — English keywords (FIX-01)', () => {
  it('matches Vanilla', () => {
    expect(inferFlavorEmoji('Vanilla Custard')).toBe('🍦');
  });
  it('matches Mint / Menthol', () => {
    expect(inferFlavorEmoji('Mint Ice')).toBe('❄️');
    expect(inferFlavorEmoji('Menthol Blast')).toBe('❄️');
  });
  it('matches Chocolate / Cocoa', () => {
    expect(inferFlavorEmoji('Belgian Chocolate')).toBe('🍫');
    expect(inferFlavorEmoji('Dark Cocoa')).toBe('🍫');
  });
  it('matches Mango', () => {
    expect(inferFlavorEmoji('Mango Tango')).toBe('🥭');
  });
  it('matches Coffee', () => {
    expect(inferFlavorEmoji('Colombian Coffee')).toBe('☕');
  });
  it('matches Cookie / Biscuit', () => {
    expect(inferFlavorEmoji('Double Cookie')).toBe('🍪');
    expect(inferFlavorEmoji('Butter Biscuit')).toBe('🍪');
  });
  it('matches Fresh Cream', () => {
    expect(inferFlavorEmoji('Fresh Cream')).toBe('🍦');
  });
});

describe('inferFlavorEmoji — Arabic keywords with spelling variants (FIX-01)', () => {
  it('matches فانيليا / فانيلا (Vanilla)', () => {
    expect(inferFlavorEmoji('فانيليا فرنسية')).toBe('🍦');
    expect(inferFlavorEmoji('فانيلا')).toBe('🍦');
  });
  it('matches نعناع (Mint)', () => {
    expect(inferFlavorEmoji('نعناع منعش')).toBe('❄️');
  });
  it('matches شوكولاتة / شوكولاته spelling variants (Chocolate)', () => {
    expect(inferFlavorEmoji('شوكولاتة بالبندق')).toBe('🍫');
    expect(inferFlavorEmoji('شوكولاته غامقة')).toBe('🍫');
  });
  it('matches مانجة / مانجو variants (Mango)', () => {
    expect(inferFlavorEmoji('مانجة هندية')).toBe('🥭');
    expect(inferFlavorEmoji('مانجو')).toBe('🥭');
  });
  it('matches قهوة (Coffee)', () => {
    expect(inferFlavorEmoji('قهوة عربية')).toBe('☕');
  });
  it('matches كوكيز/بسكويت (Cookie/Biscuit)', () => {
    expect(inferFlavorEmoji('كوكيز شوكولاتة')).toBe('🍪'); // أول تطابق بالترتيب
    expect(inferFlavorEmoji('بسكويت سادة')).toBe('🍪');
  });
});

describe('inferFlavorEmoji — no match / empty input', () => {
  it('returns null for a generic placeholder name', () => {
    expect(inferFlavorEmoji('New Flavor')).toBeNull();
    expect(inferFlavorEmoji('نكهة جديدة')).toBeNull();
  });
  it('returns null for empty/nullish input', () => {
    expect(inferFlavorEmoji('')).toBeNull();
    expect(inferFlavorEmoji(null)).toBeNull();
    expect(inferFlavorEmoji(undefined)).toBeNull();
  });
});

describe('normalizeFlavorText', () => {
  it('lowercases English and strips Arabic diacritics/letter variants', () => {
    expect(normalizeFlavorText('Mango')).toBe('mango');
    expect(normalizeFlavorText('مَانجة')).toBe(normalizeFlavorText('مانجه'));
    expect(normalizeFlavorText('إضافة')).toBe(normalizeFlavorText('اضافه'));
  });
});

describe('flavorEmojiOrDefault (FIX-05 — fallback موحّد)', () => {
  it('keeps an existing emoji untouched', () => {
    expect(flavorEmojiOrDefault('🥭')).toBe('🥭');
  });
  it('falls back to DEFAULT_FLAVOR_EMOJI for falsy values', () => {
    expect(flavorEmojiOrDefault('')).toBe(DEFAULT_FLAVOR_EMOJI);
    expect(flavorEmojiOrDefault(null)).toBe(DEFAULT_FLAVOR_EMOJI);
    expect(flavorEmojiOrDefault(undefined)).toBe(DEFAULT_FLAVOR_EMOJI);
  });
  it('DEFAULT_FLAVOR_EMOJI unifies the old scattered 🍓/🍶 fallbacks', () => {
    expect(DEFAULT_FLAVOR_EMOJI).toBe('🍓');
  });
});

describe('getBrandFlavorEmoji(cat, name) — backward compatibility (no name arg)', () => {
  it('returns the mapped category emoji when called with category only', () => {
    expect(getBrandFlavorEmoji('Fruit')).toBe(BRAND_CATEGORY_EMOJI.Fruit);
    expect(getBrandFlavorEmoji('Cream')).toBe(BRAND_CATEGORY_EMOJI.Cream);
    expect(getBrandFlavorEmoji('Mint')).toBe(BRAND_CATEGORY_EMOJI.Mint);
  });
  it('falls back to Special (✨) for an unknown category with no name', () => {
    expect(getBrandFlavorEmoji('UnknownCategoryXYZ')).toBe('✨');
  });
  it('Special category with no name at all → ✨ (catFilter dropdown case, FIX-03)', () => {
    expect(getBrandFlavorEmoji('Special')).toBe('✨');
  });
});

describe('getBrandFlavorEmoji(cat, name) — FIX-01 second layer for Special category', () => {
  it('infers an emoji from the name when category is Special and a match exists', () => {
    expect(getBrandFlavorEmoji('Special', 'Mango Madness')).toBe('🥭');
    expect(getBrandFlavorEmoji('Special', 'Chocolate Dream')).toBe('🍫');
  });
  it('falls back to ✨ when category is Special and no keyword matches the name', () => {
    expect(getBrandFlavorEmoji('Special', 'XYZ Unique Blend')).toBe('✨');
  });
  it('known non-Special categories ignore the name and keep their category emoji', () => {
    // تأكيد عدم استدعاء inferFlavorEmoji أصلاً للأصناف المعروفة غير Special
    expect(getBrandFlavorEmoji('Tobacco', 'Vanilla Custard')).toBe('🍂');
  });
});
