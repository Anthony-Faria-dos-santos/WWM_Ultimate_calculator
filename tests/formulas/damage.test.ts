/**
 * Tests unitaires pour les formules de dégâts
 * 
 * Ces tests valident les formules contre le spreadsheet Excel de référence
 */

import { describe, it, expect } from 'vitest';
import {
  calcDefenseReduction,
  calcElementalReduction,
  calcCritRate,
  calcPrecisionRate,
  calcShieldPenetration,
  calcRemainingShield,
  calcBonusMultiplier,
  calcExpectedValue,
  calcSimpleEVMultiplier,
} from '../src/lib/formulas/damage';
import type { Buff, BonusCategory } from '../src/lib/types';

// ============================================
// DEFENSE REDUCTION TESTS
// ============================================

describe('calcDefenseReduction', () => {
  it('should return 50% at defense constant (2860)', () => {
    expect(calcDefenseReduction(2860, 0)).toBeCloseTo(0.5, 4);
  });

  it('should return 0% at 0 defense', () => {
    expect(calcDefenseReduction(0, 0)).toBe(0);
  });

  it('should handle armor penetration correctly', () => {
    // 1500 def - 800 pen = 700 remaining
    // 700 / (700 + 2860) = 0.1966...
    expect(calcDefenseReduction(1500, 800)).toBeCloseTo(0.1966, 3);
  });

  it('should not go negative with high penetration', () => {
    expect(calcDefenseReduction(500, 1000)).toBe(0);
  });

  it('should match spreadsheet values', () => {
    // From WWM_Damage_Calc_Deterministe.docx table
    const testCases = [
      { defense: 1000, expected: 0.259 },
      { defense: 1500, expected: 0.344 },
      { defense: 2000, expected: 0.412 },
      { defense: 2860, expected: 0.5 },
      { defense: 3000, expected: 0.512 },
      { defense: 4000, expected: 0.583 },
    ];

    for (const { defense, expected } of testCases) {
      expect(calcDefenseReduction(defense, 0)).toBeCloseTo(expected, 2);
    }
  });
});

// ============================================
// ELEMENTAL REDUCTION TESTS
// ============================================

describe('calcElementalReduction', () => {
  it('should return 50% at resistance constant (530)', () => {
    expect(calcElementalReduction(530)).toBeCloseTo(0.5, 4);
  });

  it('should return 0% at 0 resistance', () => {
    expect(calcElementalReduction(0)).toBe(0);
  });

  it('should handle negative resistance (weakness)', () => {
    // -353 resistance should give bonus damage
    // -353 / (353 + 530) = -0.4
    // This means 40% MORE damage (reduction is negative)
    expect(calcElementalReduction(-353)).toBeCloseTo(-0.4, 2);
  });

  it('should match spreadsheet values', () => {
    const testCases = [
      { resist: 0, expected: 0 },
      { resist: 100, expected: 0.159 },
      { resist: 265, expected: 0.333 },
      { resist: 530, expected: 0.5 },
      { resist: 800, expected: 0.602 },
    ];

    for (const { resist, expected } of testCases) {
      expect(calcElementalReduction(resist)).toBeCloseTo(expected, 2);
    }
  });
});

// ============================================
// CRITICAL RATE TESTS
// ============================================

describe('calcCritRate', () => {
  it('should calculate rate with formula (1.15 * crit) / (crit + 938)', () => {
    // At 500 crit: (1.15 * 500) / (500 + 938) = 0.4
    expect(calcCritRate(500, 0)).toBeCloseTo(0.4, 2);
  });

  it('should respect target crit resistance', () => {
    // 800 crit - 300 resist = 500 effective
    expect(calcCritRate(800, 300)).toBeCloseTo(calcCritRate(500, 0), 4);
  });

  it('should cap at approximately 80%', () => {
    expect(calcCritRate(10000, 0)).toBeLessThanOrEqual(0.8);
  });

  it('should return 0 if resistance exceeds crit', () => {
    expect(calcCritRate(500, 600)).toBe(0);
  });
});

// ============================================
// PRECISION RATE TESTS
// ============================================

describe('calcPrecisionRate', () => {
  it('should have base rate of 95%', () => {
    expect(calcPrecisionRate(0, 0)).toBe(0.95);
  });

  it('should calculate bonus with formula', () => {
    // At 1000 precision: 95% + (1.42 * 1000) / (1000 + 3640)
    // = 0.95 + 0.306 = 1.256 -> capped at 1.0
    expect(calcPrecisionRate(1000, 0)).toBe(1.0);
  });

  it('should handle target evasion', () => {
    expect(calcPrecisionRate(500, 500)).toBe(0.95);
  });

  it('should cap at 100%', () => {
    expect(calcPrecisionRate(10000, 0)).toBe(1.0);
  });
});

// ============================================
// SHIELD PENETRATION TESTS
// ============================================

describe('calcShieldPenetration', () => {
  it('should double effect when pen <= shield/3', () => {
    // Shield 300, Pen 100: effect = 100 * 2 = 200
    expect(calcShieldPenetration(300, 100)).toBe(200);
  });

  it('should use diminishing returns above threshold', () => {
    // Shield 300, threshold = 100
    // Pen 200: (100 * 2) + (100 * 0.5) = 200 + 50 = 250
    expect(calcShieldPenetration(300, 200)).toBe(250);
  });

  it('should not exceed shield value', () => {
    expect(calcShieldPenetration(100, 1000)).toBe(100);
  });

  it('should return 0 for 0 penetration', () => {
    expect(calcShieldPenetration(500, 0)).toBe(0);
  });

  it('should return 0 for 0 shield', () => {
    expect(calcShieldPenetration(0, 500)).toBe(0);
  });
});

describe('calcRemainingShield', () => {
  it('should return shield minus penetration effect', () => {
    // Shield 300, Pen 100: effect = 200, remaining = 100
    expect(calcRemainingShield(300, 100)).toBe(100);
  });

  it('should not go below 0', () => {
    expect(calcRemainingShield(100, 1000)).toBe(0);
  });
});

// ============================================
// BONUS MULTIPLIER TESTS
// ============================================

describe('calcBonusMultiplier', () => {
  it('should return 1.0 with no buffs', () => {
    expect(calcBonusMultiplier([])).toBe(1);
  });

  it('should add same category buffs', () => {
    const buffs: Buff[] = [
      { buffId: '1', buffNameFR: 'A', category: 'general', value: 0.1, isPercentage: true },
      { buffId: '2', buffNameFR: 'B', category: 'general', value: 0.2, isPercentage: true },
    ];
    // Same category: 1 + (0.1 + 0.2) = 1.3
    expect(calcBonusMultiplier(buffs)).toBeCloseTo(1.3, 4);
  });

  it('should multiply different category buffs', () => {
    const buffs: Buff[] = [
      { buffId: '1', buffNameFR: 'A', category: 'general', value: 0.1, isPercentage: true },
      { buffId: '2', buffNameFR: 'B', category: 'skill', value: 0.2, isPercentage: true },
    ];
    // Different categories: (1 + 0.1) * (1 + 0.2) = 1.1 * 1.2 = 1.32
    expect(calcBonusMultiplier(buffs)).toBeCloseTo(1.32, 4);
  });

  it('should follow rule: same add, different multiply', () => {
    const buffs: Buff[] = [
      { buffId: '1', buffNameFR: 'A', category: 'general', value: 0.1, isPercentage: true },
      { buffId: '2', buffNameFR: 'B', category: 'general', value: 0.1, isPercentage: true },
      { buffId: '3', buffNameFR: 'C', category: 'skill', value: 0.3, isPercentage: true },
    ];
    // (1 + 0.1 + 0.1) * (1 + 0.3) = 1.2 * 1.3 = 1.56
    expect(calcBonusMultiplier(buffs)).toBeCloseTo(1.56, 4);
  });
});

// ============================================
// EXPECTED VALUE TESTS
// ============================================

describe('calcSimpleEVMultiplier', () => {
  it('should calculate basic EV multiplier', () => {
    // 50% crit with +50% damage, 20% affinity with +20% damage
    // 1 + (0.5 * 0.5) + (0.2 * 0.2) = 1 + 0.25 + 0.04 = 1.29
    expect(calcSimpleEVMultiplier(0.5, 0.5, 0.2, 0.2)).toBeCloseTo(1.29, 4);
  });

  it('should return 1.0 with 0 rates', () => {
    expect(calcSimpleEVMultiplier(0, 0.5, 0, 0.2)).toBe(1);
  });
});

describe('calcExpectedValue', () => {
  it('should weight outcomes by probability', () => {
    const ev = calcExpectedValue(
      1000,  // base
      1200,  // max
      800,   // min
      1.0,   // 100% precision (no abrasion)
      0.5,   // 50% crit
      0.2,   // 20% affinity
      1.0,   // no bonus
      0      // no abrasion conversion
    );
    
    // With 100% precision:
    // - Crit branch: 0.5 * 1000 * 1.5 * (1 + 0.2 * 0.2) = 750 * 1.04 = 780
    // - Affinity only: 0.5 * 0.2 * 1200 * 1.2 = 144
    // - Normal: 0.5 * 0.8 * 1000 = 400
    // Total ≈ 780 + 144 + 400 = 1324
    expect(ev).toBeGreaterThan(1000);
    expect(ev).toBeLessThan(1500);
  });
});

// ============================================
// INTEGRATION TEST
// ============================================

describe('Full damage calculation flow', () => {
  it('should match example from documentation', () => {
    // From WWM_Damage_Calc_Deterministe.docx example:
    // Attack: 500-1000, Skill mult: 2.0, Dom: 200
    // Boss: 1500 def, 200 shield
    // Pen: 800, Crit: 50%, Bonus: +30%
    
    const avgAttack = (500 + 1000) / 2; // 750
    const poolBase = avgAttack + 200; // 950
    
    // Shield is broken (pen > shield)
    const afterShield = poolBase; // 950
    
    // Defense: 1500 - 800 = 700 remaining
    const defReduction = 700 / (700 + 2860); // ~0.197
    const afterDefense = afterShield * (1 - defReduction); // ~762.9
    
    // Skill multiplier
    const afterSkill = 2.0 * afterDefense; // ~1525.8
    
    // Critical (50% damage bonus)
    const afterCrit = afterSkill * 1.5; // ~2288.7
    
    // Bonus (+30%)
    const finalDamage = afterCrit * 1.3; // ~2975.3
    
    expect(defReduction).toBeCloseTo(0.197, 2);
    expect(finalDamage).toBeCloseTo(2975, 0);
  });
});
