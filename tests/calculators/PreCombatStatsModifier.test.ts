import { describe, it, expect, beforeEach } from 'vitest';
import { PreCombatStatsModifier } from '@/lib/calculators/PreCombatStatsModifier';
import type { ExtendedStats } from '@/lib/calculators/TalentBonusResolver';
import type { ResolvedTalentBonus } from '@/lib/types/MartialArts.types';
import type { ResolvedSetBonus } from '@/lib/types/EquipmentSet.types';
import { TEST_FIXTURES } from '../fixtures';

// ── Helpers ──────────────────────────────────────────────────────

function createExtendedStats(
  overrides?: Partial<ExtendedStats>
): ExtendedStats {
  return {
    ...TEST_FIXTURES.characters.standardDPS,
    momentum: 500,
    agility: 400,
    body: 300,
    power: 600,
    maxHP: 50000,
    maxAttributeAttack: 2000,
    minAttributeAttack: 1800,
    ...overrides,
  };
}

function createTalentBonus(
  overrides?: Partial<ResolvedTalentBonus>
): ResolvedTalentBonus {
  return {
    talentId: 'talent_test',
    talentName: 'Talent Test',
    damageZone: 'BaseStats',
    value: 100,
    isActive: true,
    source: 'Talent: Test',
    isEstimated: false,
    ...overrides,
  };
}

function createSetBonus(
  overrides?: Partial<ResolvedSetBonus>
): ResolvedSetBonus {
  return {
    setId: 'set_test',
    setName: 'Set Test',
    activeTier: 2,
    damageZone: null,
    value: 0,
    statModifiers: [],
    source: 'Set Test (2p)',
    isEstimated: false,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('PreCombatStatsModifier', () => {
  let modifier: PreCombatStatsModifier;
  let baseStats: ExtendedStats;

  beforeEach(() => {
    modifier = new PreCombatStatsModifier();
    baseStats = createExtendedStats();
  });

  describe('applyModifications', () => {
    it('retourne les stats inchangées sans bonus', () => {
      const result = modifier.applyModifications(baseStats, [], []);

      expect(result.finalStats.attack).toBe(baseStats.attack);
      expect(result.finalStats.defense).toBe(baseStats.defense);
      expect(result.appliedModifiers).toHaveLength(0);
    });

    it('applique un flat bonus de set', () => {
      const setBonus = createSetBonus({
        statModifiers: [{ stat: 'attack', value: 78, isPercentage: false }],
      });

      const result = modifier.applyModifications(baseStats, [], [setBonus]);

      expect(result.finalStats.attack).toBe(baseStats.attack + 78);
      expect(result.appliedModifiers).toHaveLength(1);
      expect(result.appliedModifiers[0].stat).toBe('attack');
      expect(result.appliedModifiers[0].modifier).toBe(78);
      expect(result.appliedModifiers[0].isPercentage).toBe(false);
    });

    it('applique un percentage bonus de set', () => {
      const setBonus = createSetBonus({
        statModifiers: [{ stat: 'attack', value: 0.10, isPercentage: true }],
      });

      const result = modifier.applyModifications(baseStats, [], [setBonus]);

      // 2500 + (2500 × 0.10) = 2500 + 250 = 2750
      expect(result.finalStats.attack).toBeCloseTo(2750);
    });

    it('applique les flat AVANT les percentage (ordre correct)', () => {
      const setBonusFlat = createSetBonus({
        setId: 'flat_set',
        source: 'Set Flat (2p)',
        statModifiers: [{ stat: 'attack', value: 500, isPercentage: false }],
      });
      const setBonusPercent = createSetBonus({
        setId: 'pct_set',
        source: 'Set Pct (2p)',
        statModifiers: [{ stat: 'attack', value: 0.10, isPercentage: true }],
      });

      const result = modifier.applyModifications(
        baseStats,
        [],
        [setBonusFlat, setBonusPercent]
      );

      // Étape 1 : flat → 2500 + 500 = 3000
      // Étape 2 : pct → 3000 + (3000 × 0.10) = 3000 + 300 = 3300
      expect(result.finalStats.attack).toBeCloseTo(3300);
    });

    it('applique les talents BaseStats APRÈS les sets', () => {
      const setBonus = createSetBonus({
        statModifiers: [{ stat: 'attack', value: 500, isPercentage: false }],
      });
      const talentBonus = createTalentBonus({ value: 200 });

      const result = modifier.applyModifications(
        baseStats,
        [talentBonus],
        [setBonus]
      );

      // 2500 + 500 (set flat) + 200 (talent) = 3200
      expect(result.finalStats.attack).toBeCloseTo(3200);
    });

    it('ignore les talents non-BaseStats', () => {
      const talentDamage = createTalentBonus({
        damageZone: 'GeneralDamageIncrease',
        value: 0.30,
      });

      const result = modifier.applyModifications(
        baseStats,
        [talentDamage],
        []
      );

      // Pas de modification aux stats de base
      expect(result.finalStats.attack).toBe(baseStats.attack);
      expect(result.appliedModifiers).toHaveLength(0);
    });

    it('ignore les talents inactifs', () => {
      const inactiveTalent = createTalentBonus({
        isActive: false,
        value: 500,
      });

      const result = modifier.applyModifications(
        baseStats,
        [inactiveTalent],
        []
      );

      expect(result.finalStats.attack).toBe(baseStats.attack);
    });

    it('ignore les talents avec value = 0', () => {
      const zeroTalent = createTalentBonus({ value: 0 });

      const result = modifier.applyModifications(
        baseStats,
        [zeroTalent],
        []
      );

      expect(result.finalStats.attack).toBe(baseStats.attack);
      expect(result.appliedModifiers).toHaveLength(0);
    });
  });

  describe('breakdown (appliedModifiers)', () => {
    it('enregistre valueBefore et valueAfter pour chaque modification', () => {
      const setBonus = createSetBonus({
        statModifiers: [{ stat: 'attack', value: 100, isPercentage: false }],
      });

      const result = modifier.applyModifications(baseStats, [], [setBonus]);

      expect(result.appliedModifiers[0].valueBefore).toBe(2500);
      expect(result.appliedModifiers[0].valueAfter).toBe(2600);
    });

    it('trace la source dans le breakdown', () => {
      const setBonus = createSetBonus({
        source: 'Faucon Pèlerin (2p)',
        statModifiers: [{ stat: 'critRate', value: 50, isPercentage: false }],
      });

      const result = modifier.applyModifications(baseStats, [], [setBonus]);

      expect(result.appliedModifiers[0].source).toBe('Faucon Pèlerin (2p)');
    });

    it('produit un breakdown complet pour un pipeline flat+pct+talent', () => {
      const setBonusFlat = createSetBonus({
        setId: 'flat',
        source: 'Set A (2p)',
        statModifiers: [{ stat: 'attack', value: 200, isPercentage: false }],
      });
      const setBonusPct = createSetBonus({
        setId: 'pct',
        source: 'Set B (4p)',
        statModifiers: [{ stat: 'attack', value: 0.05, isPercentage: true }],
      });
      const talent = createTalentBonus({
        source: 'Talent: Taille Lourde',
        value: 150,
      });

      const result = modifier.applyModifications(
        baseStats,
        [talent],
        [setBonusFlat, setBonusPct]
      );

      expect(result.appliedModifiers).toHaveLength(3);

      // Flat: 2500 → 2700
      expect(result.appliedModifiers[0].valueBefore).toBe(2500);
      expect(result.appliedModifiers[0].valueAfter).toBe(2700);
      expect(result.appliedModifiers[0].isPercentage).toBe(false);

      // Pct: 2700 → 2700 + 135 = 2835
      expect(result.appliedModifiers[1].valueBefore).toBe(2700);
      expect(result.appliedModifiers[1].valueAfter).toBeCloseTo(2835);
      expect(result.appliedModifiers[1].isPercentage).toBe(true);

      // Talent: 2835 → 2985
      expect(result.appliedModifiers[2].valueBefore).toBeCloseTo(2835);
      expect(result.appliedModifiers[2].valueAfter).toBeCloseTo(2985);
    });
  });

  describe('stats multiples', () => {
    it('modifie plusieurs stats indépendamment', () => {
      const setBonus = createSetBonus({
        statModifiers: [
          { stat: 'attack', value: 100, isPercentage: false },
          { stat: 'critRate', value: 50, isPercentage: false },
        ],
      });

      const result = modifier.applyModifications(baseStats, [], [setBonus]);

      expect(result.finalStats.attack).toBe(baseStats.attack + 100);
      expect(result.finalStats.critRate).toBe(baseStats.critRate + 50);
      expect(result.appliedModifiers).toHaveLength(2);
    });
  });
});
