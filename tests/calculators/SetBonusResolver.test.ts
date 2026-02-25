import { describe, it, expect, beforeEach } from 'vitest';
import { SetBonusResolver } from '@/lib/calculators/SetBonusResolver';
import type {
  EquipmentPiece,
  EquipmentSetDefinition,
  SetTierBonus,
} from '@/lib/types/EquipmentSet.types';
import { EquipmentSlot } from '@/lib/types/EquipmentSet.types';
import { DEFAULT_COMBAT_CONTEXT } from '@/lib/types/CombatContext.types';

// ── Helpers ──────────────────────────────────────────────────────

function createPiece(
  setId: string,
  slot: EquipmentSlot,
  id?: string
): EquipmentPiece {
  return {
    id: id ?? `piece_${setId}_${slot}`,
    name: `Pièce ${slot}`,
    slot,
    setId,
    rarity: 'legendary',
    statModifiers: [],
  };
}

function createSetDefinition(
  id: string,
  tierBonuses: SetTierBonus[],
  overrides?: Partial<EquipmentSetDefinition>
): EquipmentSetDefinition {
  return {
    id,
    name: `Set ${id}`,
    nameFR: `Set ${id} FR`,
    totalPieces: 6,
    tierBonuses,
    dataCompleteness: 'complete',
    ...overrides,
  };
}

function createTierBonus(
  piecesRequired: 2 | 4 | 6,
  overrides?: Partial<SetTierBonus>
): SetTierBonus {
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

// ── Tests ────────────────────────────────────────────────────────

describe('SetBonusResolver', () => {
  let resolver: SetBonusResolver;
  let setDefinitions: Map<string, EquipmentSetDefinition>;

  beforeEach(() => {
    resolver = new SetBonusResolver();
    setDefinitions = new Map();
  });

  describe('comptage des pièces', () => {
    it('ne retourne aucun bonus sans pièces équipées', () => {
      const results = resolver.resolveEquippedSets(
        [],
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );
      expect(results).toHaveLength(0);
    });

    it('ne retourne rien si le set n\'est pas dans les définitions', () => {
      const pieces = [
        createPiece('unknown_set', EquipmentSlot.Head),
        createPiece('unknown_set', EquipmentSlot.Chest),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );
      expect(results).toHaveLength(0);
    });

    it('ne retourne rien avec 1 pièce (sous le palier 2p)', () => {
      const setDef = createSetDefinition('falcon', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'affinityRate', value: 0.045, isPercentage: false }],
        }),
      ]);
      setDefinitions.set('falcon', setDef);

      const pieces = [createPiece('falcon', EquipmentSlot.Head)];
      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('activation des paliers', () => {
    it('active le palier 2p avec 2 pièces', () => {
      const setDef = createSetDefinition('falcon', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'affinityRate', value: 0.045, isPercentage: false }],
        }),
      ]);
      setDefinitions.set('falcon', setDef);

      const pieces = [
        createPiece('falcon', EquipmentSlot.Head),
        createPiece('falcon', EquipmentSlot.Chest),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(1);
      expect(results[0].setId).toBe('falcon');
      expect(results[0].activeTier).toBe(2);
      expect(results[0].statModifiers).toHaveLength(1);
      expect(results[0].statModifiers[0].stat).toBe('affinityRate');
    });

    it('active les paliers 2p ET 4p avec 4 pièces', () => {
      const setDef = createSetDefinition('falcon', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'affinityRate', value: 0.045, isPercentage: false }],
        }),
        createTierBonus(4, {
          bonusType: 'damage',
          damageZone: 'GeneralDamageIncrease',
          damageValue: 0.10,
        }),
      ]);
      setDefinitions.set('falcon', setDef);

      const pieces = [
        createPiece('falcon', EquipmentSlot.Head),
        createPiece('falcon', EquipmentSlot.Chest),
        createPiece('falcon', EquipmentSlot.Legs),
        createPiece('falcon', EquipmentSlot.Feet),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(2);
      expect(results[0].activeTier).toBe(2);
      expect(results[1].activeTier).toBe(4);
      expect(results[1].damageZone).toBe('GeneralDamageIncrease');
      expect(results[1].value).toBe(0.10);
    });

    it('active le palier 2p avec 3 pièces (excédent)', () => {
      const setDef = createSetDefinition('stone', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'armorPenetration', value: 25, isPercentage: false }],
        }),
      ]);
      setDefinitions.set('stone', setDef);

      const pieces = [
        createPiece('stone', EquipmentSlot.Head),
        createPiece('stone', EquipmentSlot.Chest),
        createPiece('stone', EquipmentSlot.Legs),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(1);
      expect(results[0].activeTier).toBe(2);
    });
  });

  describe('sets multiples simultanés', () => {
    it('résout 2 sets 2p en parallèle', () => {
      const setA = createSetDefinition('setA', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'attack', value: 78, isPercentage: false }],
        }),
      ]);
      const setB = createSetDefinition('setB', [
        createTierBonus(2, {
          bonusType: 'damage',
          damageZone: 'CritDamageBonus',
          damageValue: 0.25,
        }),
      ]);
      setDefinitions.set('setA', setA);
      setDefinitions.set('setB', setB);

      const pieces = [
        createPiece('setA', EquipmentSlot.Head),
        createPiece('setA', EquipmentSlot.Chest),
        createPiece('setB', EquipmentSlot.Legs),
        createPiece('setB', EquipmentSlot.Feet),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results).toHaveLength(2);
      const setABonus = results.find((r) => r.setId === 'setA');
      const setBBonus = results.find((r) => r.setId === 'setB');
      expect(setABonus).toBeDefined();
      expect(setBBonus).toBeDefined();
      expect(setBBonus!.value).toBe(0.25);
    });
  });

  describe('métadonnées et source', () => {
    it('génère un source lisible avec nameFR et palier', () => {
      const setDef = createSetDefinition('jade_cup', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'attack', value: 78, isPercentage: false }],
        }),
      ]);
      setDef; // nameFR = 'Set jade_cup FR'
      setDefinitions.set('jade_cup', setDef);

      const pieces = [
        createPiece('jade_cup', EquipmentSlot.Ring1),
        createPiece('jade_cup', EquipmentSlot.Ring2),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results[0].source).toContain('2p');
    });

    it('marque isEstimated pour les sets avec données partielles', () => {
      const setDef = createSetDefinition('partial_set', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'attack', value: 50, isPercentage: false }],
        }),
      ], { dataCompleteness: 'partial' });
      setDefinitions.set('partial_set', setDef);

      const pieces = [
        createPiece('partial_set', EquipmentSlot.Head),
        createPiece('partial_set', EquipmentSlot.Chest),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results[0].isEstimated).toBe(true);
    });

    it('marque isEstimated = false pour les sets complets', () => {
      const setDef = createSetDefinition('complete_set', [
        createTierBonus(2, {
          statModifiers: [{ stat: 'attack', value: 78, isPercentage: false }],
        }),
      ], { dataCompleteness: 'complete' });
      setDefinitions.set('complete_set', setDef);

      const pieces = [
        createPiece('complete_set', EquipmentSlot.Head),
        createPiece('complete_set', EquipmentSlot.Chest),
      ];

      const results = resolver.resolveEquippedSets(
        pieces,
        setDefinitions,
        DEFAULT_COMBAT_CONTEXT
      );

      expect(results[0].isEstimated).toBe(false);
    });
  });
});
