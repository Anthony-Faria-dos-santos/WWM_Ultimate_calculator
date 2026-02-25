import { describe, it, expect, beforeEach } from 'vitest';
import {
  TalentBonusResolver,
  type ExtendedStats,
} from '@/lib/calculators/TalentBonusResolver';
import type {
  MartialArtTalent,
  MartialArtWeapon,
  TalentScalingFormula,
} from '@/lib/types/MartialArts.types';
import { MartialArtPath, AttributeType } from '@/lib/types/MartialArts.types';
import type { CombatContext } from '@/lib/types/CombatContext.types';
import { DEFAULT_COMBAT_CONTEXT } from '@/lib/types/CombatContext.types';
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

function createTalent(
  overrides?: Partial<MartialArtTalent>
): MartialArtTalent {
  return {
    id: 'test_talent_1',
    name: 'Test Talent',
    nameFR: 'Talent de test',
    description: 'A test talent',
    descriptionFR: 'Un talent de test',
    level: 10,
    maxLevel: 10,
    breakthroughTier: 0,
    damageZone: 'GeneralDamageIncrease',
    scaling: null,
    flatBonus: null,
    condition: null,
    isPassive: true,
    soloModeRequirement: null,
    dataCompleteness: 'complete',
    ...overrides,
  };
}

function createContext(
  overrides?: Partial<CombatContext>
): CombatContext {
  return { ...DEFAULT_COMBAT_CONTEXT, ...overrides };
}

function createWeapon(
  talents: readonly MartialArtTalent[],
  overrides?: Partial<MartialArtWeapon>
): MartialArtWeapon {
  return {
    id: 'test_weapon',
    name: 'Test Weapon',
    nameFR: 'Arme de test',
    path: MartialArtPath.BellstrikeSplendor,
    attributeType: AttributeType.Bellstrike,
    weaponType: 'Sword',
    maxLevel: 85,
    talents,
    specialResource: null,
    dataCompleteness: 'complete',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('TalentBonusResolver', () => {
  let resolver: TalentBonusResolver;
  let stats: ExtendedStats;

  beforeEach(() => {
    resolver = new TalentBonusResolver();
    stats = createExtendedStats();
  });

  // ────────────── evaluateCondition ──────────────

  describe('evaluateCondition', () => {
    it('retourne true si condition est null (toujours actif)', () => {
      expect(resolver.evaluateCondition(null, DEFAULT_COMBAT_CONTEXT)).toBe(
        true
      );
    });

    it('retourne true pour condition type "always"', () => {
      expect(
        resolver.evaluateCondition(
          { type: 'always' },
          DEFAULT_COMBAT_CONTEXT
        )
      ).toBe(true);
    });

    it('évalue targetQiBelow correctement', () => {
      const condition = { type: 'targetQiBelow' as const, threshold: 0.4 };
      const ctxLow = createContext({ targetQiPercent: 0.2 });
      const ctxHigh = createContext({ targetQiPercent: 0.8 });

      expect(resolver.evaluateCondition(condition, ctxLow)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxHigh)).toBe(false);
    });

    it('évalue targetExhausted correctement', () => {
      const condition = { type: 'targetExhausted' as const };
      const ctxExh = createContext({ isTargetExhausted: true });
      const ctxNot = createContext({ isTargetExhausted: false });

      expect(resolver.evaluateCondition(condition, ctxExh)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxNot)).toBe(false);
    });

    it('évalue hpBelow correctement', () => {
      const condition = { type: 'hpBelow' as const, threshold: 0.3 };
      const ctxLow = createContext({ playerHpPercent: 0.1 });
      const ctxHigh = createContext({ playerHpPercent: 0.8 });

      expect(resolver.evaluateCondition(condition, ctxLow)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxHigh)).toBe(false);
    });

    it('évalue chargedSkill correctement', () => {
      const condition = { type: 'chargedSkill' as const };
      const ctxYes = createContext({ isChargedSkill: true });
      const ctxNo = createContext({ isChargedSkill: false });

      expect(resolver.evaluateCondition(condition, ctxYes)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxNo)).toBe(false);
    });

    it('évalue duringSkill avec skillName spécifique', () => {
      const condition = {
        type: 'duringSkill' as const,
        skillName: 'slash_1',
      };
      const ctxMatch = createContext({ currentSkillId: 'slash_1' });
      const ctxOther = createContext({ currentSkillId: 'thrust_2' });
      const ctxNone = createContext({ currentSkillId: null });

      expect(resolver.evaluateCondition(condition, ctxMatch)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxOther)).toBe(false);
      expect(resolver.evaluateCondition(condition, ctxNone)).toBe(false);
    });

    it('évalue duringSkill sans skillName (tout skill actif)', () => {
      const condition = { type: 'duringSkill' as const };
      const ctxAny = createContext({ currentSkillId: 'any_skill' });
      const ctxNone = createContext({ currentSkillId: null });

      expect(resolver.evaluateCondition(condition, ctxAny)).toBe(true);
      expect(resolver.evaluateCondition(condition, ctxNone)).toBe(false);
    });
  });

  // ────────────── calculateScalingBonus ──────────────

  describe('calculateScalingBonus', () => {
    it('calcule un bonus linéaire basé sur maxPhysicalAttack', () => {
      // bonus = 0.10 + (2500 / 100) × 0.01 = 0.10 + 0.25 = 0.35
      const scaling: TalentScalingFormula = {
        scalingStat: 'maxPhysicalAttack',
        baseValue: 0.10,
        perStatPoint: 0.01,
        statCap: 5000,
        maxBonus: 0.80,
        scalingUnit: 100,
      };

      const result = resolver.calculateScalingBonus(scaling, stats);
      expect(result).toBeCloseTo(0.35);
    });

    it('respecte le cap de stat (statCap)', () => {
      // stat = 2500, cap = 2000 → cappedStat = 2000
      // bonus = 0.10 + (2000 / 100) × 0.01 = 0.10 + 0.20 = 0.30
      const scaling: TalentScalingFormula = {
        scalingStat: 'maxPhysicalAttack',
        baseValue: 0.10,
        perStatPoint: 0.01,
        statCap: 2000,
        maxBonus: 0.80,
        scalingUnit: 100,
      };

      const result = resolver.calculateScalingBonus(scaling, stats);
      expect(result).toBeCloseTo(0.30);
    });

    it('respecte le maxBonus', () => {
      // Calcul théorique dépasserait maxBonus
      // bonus = 0.50 + (2500 / 100) × 0.10 = 0.50 + 2.50 = 3.00 → capé à 0.80
      const scaling: TalentScalingFormula = {
        scalingStat: 'maxPhysicalAttack',
        baseValue: 0.50,
        perStatPoint: 0.10,
        statCap: 10000,
        maxBonus: 0.80,
        scalingUnit: 100,
      };

      const result = resolver.calculateScalingBonus(scaling, stats);
      expect(result).toBe(0.80);
    });

    it('scale correctement avec agility', () => {
      // agility = 400, bonus = 0 + (400 / 200) × 0.05 = 0.10
      const scaling: TalentScalingFormula = {
        scalingStat: 'agility',
        baseValue: 0,
        perStatPoint: 0.05,
        statCap: 1000,
        maxBonus: 0.50,
        scalingUnit: 200,
      };

      const result = resolver.calculateScalingBonus(scaling, stats);
      expect(result).toBeCloseTo(0.10);
    });

    it('scale correctement avec momentum', () => {
      // momentum = 500, bonus = 0.02 + (500 / 100) × 0.006 = 0.02 + 0.03 = 0.05
      const scaling: TalentScalingFormula = {
        scalingStat: 'momentum',
        baseValue: 0.02,
        perStatPoint: 0.006,
        statCap: 2000,
        maxBonus: 0.20,
        scalingUnit: 100,
      };

      const result = resolver.calculateScalingBonus(scaling, stats);
      expect(result).toBeCloseTo(0.05);
    });
  });

  // ────────────── resolveSingleTalent ──────────────

  describe('resolveSingleTalent', () => {
    it('résout un talent toujours actif avec flat bonus', () => {
      const talent = createTalent({
        flatBonus: { min: 100, max: 200, stat: 'attack' },
      });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      // Moyenne (100+200)/2 = 150
      expect(result.isActive).toBe(true);
      expect(result.value).toBe(150);
      expect(result.damageZone).toBe('GeneralDamageIncrease');
      expect(result.isEstimated).toBe(false);
    });

    it('résout un talent avec scaling', () => {
      const scaling: TalentScalingFormula = {
        scalingStat: 'maxPhysicalAttack',
        baseValue: 0.10,
        perStatPoint: 0.01,
        statCap: 5000,
        maxBonus: 0.80,
        scalingUnit: 100,
      };
      const talent = createTalent({ scaling });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(result.isActive).toBe(true);
      expect(result.value).toBeCloseTo(0.35);
    });

    it('retourne value = 0 si condition non remplie', () => {
      const talent = createTalent({
        condition: { type: 'targetExhausted' },
        flatBonus: { min: 100, max: 200, stat: 'attack' },
      });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT // isTargetExhausted = false
      );

      expect(result.isActive).toBe(false);
      expect(result.value).toBe(0);
    });

    it('marque isEstimated pour les données incomplètes', () => {
      const talent = createTalent({
        dataCompleteness: 'partial',
        flatBonus: { min: 50, max: 100, stat: 'critDamage' },
      });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(result.isEstimated).toBe(true);
      expect(result.value).toBe(75);
    });

    it('retourne value = 0 pour un talent sans scaling ni flatBonus (données minimales)', () => {
      const talent = createTalent({
        dataCompleteness: 'minimal',
        scaling: null,
        flatBonus: null,
      });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(result.isEstimated).toBe(true);
      expect(result.value).toBe(0);
    });

    it('utilise nameFR dans source et talentName', () => {
      const talent = createTalent({
        name: 'Heavy Slash',
        nameFR: 'Taille Lourde',
      });

      const result = resolver.resolveSingleTalent(
        talent,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(result.talentName).toBe('Taille Lourde');
      expect(result.source).toContain('Taille Lourde');
    });
  });

  // ────────────── resolveWeaponTalents ──────────────

  describe('resolveWeaponTalents', () => {
    it('résout tous les talents d\'une arme', () => {
      const talents = [
        createTalent({ id: 't1', flatBonus: { min: 100, max: 100, stat: 'attack' } }),
        createTalent({ id: 't2', flatBonus: { min: 200, max: 200, stat: 'attack' } }),
        createTalent({
          id: 't3',
          condition: { type: 'targetExhausted' },
          flatBonus: { min: 300, max: 300, stat: 'attack' },
        }),
      ];
      const weapon = createWeapon(talents);

      const results = resolver.resolveWeaponTalents(
        weapon,
        stats,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(100);
      expect(results[1].value).toBe(200);
      // t3 : condition non remplie → value = 0
      expect(results[2].isActive).toBe(false);
      expect(results[2].value).toBe(0);
    });

    it('active les talents conditionnels quand le contexte correspond', () => {
      const talents = [
        createTalent({
          id: 't1',
          condition: { type: 'targetQiBelow', threshold: 0.4 },
          flatBonus: { min: 200, max: 200, stat: 'attack' },
        }),
      ];
      const weapon = createWeapon(talents);

      const ctxActive = createContext({ targetQiPercent: 0.2 });
      const results = resolver.resolveWeaponTalents(weapon, stats, ctxActive);

      expect(results[0].isActive).toBe(true);
      expect(results[0].value).toBe(200);
    });
  });
});
