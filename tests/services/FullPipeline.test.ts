/**
 * Tests d'intégration du pipeline complet build → dégâts.
 * Valide calculateWithFullBuild() et calculateExpectedWithFullBuild() de bout en bout.
 */

import { describe, it, expect } from 'vitest';
import { TEST_FIXTURES } from '../fixtures';
import type { ExtendedStats } from '@/lib/calculators/TalentBonusResolver';
import type { MartialArtWeapon, MartialArtTalent } from '@/lib/types/MartialArts.types';
import { MartialArtPath, AttributeType } from '@/lib/types/MartialArts.types';
import type { EquipmentPiece, EquipmentSetDefinition, SetTierBonus } from '@/lib/types/EquipmentSet.types';
import { EquipmentSlot } from '@/lib/types/EquipmentSet.types';
import { DEFAULT_COMBAT_CONTEXT } from '@/lib/types/CombatContext.types';
import { CombatService, type FullBuildInput } from '@/lib/services';
import { DamageZone } from '@/lib/calculators';

// ─── Helpers locaux ─────────────────────────────────────────────────

function createExtendedStats(overrides?: Partial<ExtendedStats>): ExtendedStats {
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

function createTalent(overrides?: Partial<MartialArtTalent>): MartialArtTalent {
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

function createWeapon(talents: readonly MartialArtTalent[]): MartialArtWeapon {
  return {
    id: 'test_weapon',
    name: 'Test Sword',
    nameFR: 'Épée de test',
    path: MartialArtPath.BellstrikeSplendor,
    attributeType: AttributeType.Bellstrike,
    weaponType: 'Sword',
    maxLevel: 85,
    talents,
    specialResource: null,
    dataCompleteness: 'complete',
  };
}

function createPiece(setId: string, slot: EquipmentSlot): EquipmentPiece {
  return {
    id: `piece_${setId}_${slot}`,
    name: `Pièce ${slot}`,
    slot,
    setId,
    rarity: 'legendary',
    statModifiers: [],
  };
}

function createSetDef(id: string, tierBonuses: SetTierBonus[]): EquipmentSetDefinition {
  return {
    id,
    name: `Set ${id}`,
    nameFR: `Set ${id} FR`,
    totalPieces: 6,
    tierBonuses,
    dataCompleteness: 'complete',
  };
}

function createTierBonus(piecesRequired: 2 | 4 | 6, overrides?: Partial<SetTierBonus>): SetTierBonus {
  return {
    piecesRequired,
    bonusType: 'stat',
    statModifiers: [],
    damageZone: null,
    damageValue: 0,
    condition: null,
    description: `Bonus ${piecesRequired}p`,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Pipeline complet (calculateWithFullBuild)', () => {
  const service = new CombatService();

  describe('pipeline de base sans talents ni sets', () => {
    it('calcule les dégâts avec une arme sans talents', () => {
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };
      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.damage.finalDamage).toBeGreaterThan(0);
      expect(result.resolvedTalents).toHaveLength(0);
      expect(result.resolvedSets).toHaveLength(0);
      expect(result.routedBonuses.damageBonuses).toHaveLength(0);
      expect(result.routedBonuses.statModifications).toHaveLength(0);
    });
  });

  describe('pipeline avec talents', () => {
    it('intègre un talent GeneralDamageIncrease (+20%)', () => {
      const talent = createTalent({
        damageZone: 'GeneralDamageIncrease',
        flatBonus: { min: 0.2, max: 0.2, stat: 'damageIncrease' },
      });
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const withTalent = service.calculateExpectedWithFullBuild(input);
      const withoutTalent = service.calculateExpectedWithFullBuild({
        ...input,
        weapon: createWeapon([]),
      });

      expect(withTalent.damage.finalDamage).toBeGreaterThan(withoutTalent.damage.finalDamage);
      expect(withTalent.resolvedTalents).toHaveLength(1);
      expect(withTalent.routedBonuses.damageBonuses.length).toBeGreaterThanOrEqual(1);
    });

    it('intègre un talent BaseStats (flat attack bonus)', () => {
      const talent = createTalent({
        damageZone: 'BaseStats',
        flatBonus: { min: 200, max: 200, stat: 'attack' },
      });
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.modifiedStats.attack).toBeGreaterThan(input.baseStats.attack);
      expect(result.appliedModifiers.some(m => m.stat === 'attack')).toBe(true);
    });

    it('intègre un talent CritDamageBonus', () => {
      const talent = createTalent({
        damageZone: 'CritDamageBonus',
        flatBonus: { min: 0.15, max: 0.15, stat: 'critDamage' },
      });
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.modifiedStats.critDamage).toBeGreaterThan(input.baseStats.critDamage);
    });

    it('ignore les talents conditionnels inactifs', () => {
      const talent = createTalent({
        condition: { type: 'targetQiBelow', threshold: 0.4 },
        flatBonus: { min: 0.3, max: 0.3, stat: 'damageIncrease' },
      });
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.resolvedTalents[0].isActive).toBe(false);
    });

    it('active les talents conditionnels quand la condition est remplie', () => {
      const talent = createTalent({
        condition: { type: 'targetQiBelow', threshold: 0.4 },
        flatBonus: { min: 0.3, max: 0.3, stat: 'damageIncrease' },
      });
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: { ...DEFAULT_COMBAT_CONTEXT, targetQiPercent: 0.2 },
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.resolvedTalents[0].isActive).toBe(true);
      expect(result.routedBonuses.damageBonuses.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('pipeline avec sets', () => {
    it('intègre un bonus de set 2 pièces (stat modifier)', () => {
      const setId = 'test_set';
      const tierBonus = createTierBonus(2, {
        bonusType: 'stat',
        statModifiers: [{ stat: 'attack', value: 150, isPercentage: false }],
      });
      const setDef = createSetDef(setId, [tierBonus]);
      const pieces = [
        createPiece(setId, EquipmentSlot.Head),
        createPiece(setId, EquipmentSlot.Chest),
      ];

      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: pieces,
        setDefinitions: new Map([[setId, setDef]]),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.modifiedStats.attack).toBe(input.baseStats.attack + 150);
      expect(result.resolvedSets).toHaveLength(1);
    });

    it('intègre un bonus de set 4 pièces (damage zone)', () => {
      const setId = 'test_set_dmg';
      const tier2 = createTierBonus(2, {
        bonusType: 'stat',
        statModifiers: [{ stat: 'attack', value: 100, isPercentage: false }],
      });
      const tier4 = createTierBonus(4, {
        bonusType: 'damage',
        damageZone: 'GeneralDamageIncrease',
        damageValue: 0.15,
      });
      const setDef = createSetDef(setId, [tier2, tier4]);
      const pieces = [
        createPiece(setId, EquipmentSlot.Head),
        createPiece(setId, EquipmentSlot.Chest),
        createPiece(setId, EquipmentSlot.Legs),
        createPiece(setId, EquipmentSlot.Feet),
      ];

      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: pieces,
        setDefinitions: new Map([[setId, setDef]]),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const withSet = service.calculateExpectedWithFullBuild(input);
      const withoutSet = service.calculateExpectedWithFullBuild({
        ...input,
        equippedPieces: [],
        setDefinitions: new Map(),
      });

      expect(withSet.damage.finalDamage).toBeGreaterThan(withoutSet.damage.finalDamage);
      expect(withSet.routedBonuses.damageBonuses.length).toBeGreaterThanOrEqual(1);
    });

    it('ne double pas les statModifiers des sets', () => {
      const setId = 'no_double';
      const tierBonus = createTierBonus(2, {
        bonusType: 'stat',
        statModifiers: [{ stat: 'attack', value: 200, isPercentage: false }],
      });
      const setDef = createSetDef(setId, [tierBonus]);
      const pieces = [
        createPiece(setId, EquipmentSlot.Head),
        createPiece(setId, EquipmentSlot.Chest),
      ];

      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: pieces,
        setDefinitions: new Map([[setId, setDef]]),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      // +200 une seule fois, pas +400
      expect(result.modifiedStats.attack).toBe(input.baseStats.attack + 200);
    });
  });

  describe('pipeline combiné talents + sets', () => {
    it('combine correctement talents et sets', () => {
      const talent = createTalent({
        damageZone: 'GeneralDamageIncrease',
        flatBonus: { min: 0.2, max: 0.2, stat: 'damageIncrease' },
      });
      const setId = 'combo_set';
      const tierBonus = createTierBonus(2, {
        bonusType: 'stat',
        statModifiers: [{ stat: 'attack', value: 100, isPercentage: false }],
      });

      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([talent]),
        equippedPieces: [
          createPiece(setId, EquipmentSlot.Head),
          createPiece(setId, EquipmentSlot.Chest),
        ],
        setDefinitions: new Map([[setId, createSetDef(setId, [tierBonus])]]),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.modifiedStats.attack).toBe(input.baseStats.attack + 100);
      expect(result.routedBonuses.damageBonuses.length).toBeGreaterThanOrEqual(1);
      expect(result.damage.finalDamage).toBeGreaterThan(0);
    });
  });

  describe('additionalBonuses', () => {
    it('merge les bonus additionnels avec ceux du pipeline', () => {
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
        additionalBonuses: [
          { category: DamageZone.Augmentation, value: 0.25, source: 'Bonus manuel' },
        ],
      };

      const withBonus = service.calculateExpectedWithFullBuild(input);
      const withoutBonus = service.calculateExpectedWithFullBuild({
        ...input,
        additionalBonuses: undefined,
      });

      expect(withBonus.damage.finalDamage).toBeGreaterThan(withoutBonus.damage.finalDamage);
    });
  });

  describe('mode déterministe vs expected', () => {
    it('calculateWithFullBuild retourne un résultat >= 0', () => {
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateWithFullBuild(input);

      expect(result.damage.finalDamage).toBeGreaterThanOrEqual(0);
    });

    it('calculateExpectedWithFullBuild retourne toujours > 0', () => {
      const input: FullBuildInput = {
        baseStats: createExtendedStats(),
        weapon: createWeapon([]),
        equippedPieces: [],
        setDefinitions: new Map(),
        skill: TEST_FIXTURES.skills.basicAttack,
        target: TEST_FIXTURES.targets.standardEnemy,
        context: DEFAULT_COMBAT_CONTEXT,
      };

      const result = service.calculateExpectedWithFullBuild(input);

      expect(result.damage.finalDamage).toBeGreaterThan(0);
    });
  });
});
