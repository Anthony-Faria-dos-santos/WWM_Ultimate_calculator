import { describe, it, expect, beforeEach } from 'vitest';
import { BaseStatsCalculator, type ActiveBuff } from '@/lib/calculators/BaseStatsCalculator';
import { WeaponType, MartialArtStyle } from '@/lib/types/Character.types';
import type { PlayerCharacter } from '@/lib/types';
import { createCharacter } from '../fixtures';

/** Crée un PlayerCharacter minimal pour les tests (équipement vide). */
const makePlayerChar = (statsOverrides?: Parameters<typeof createCharacter>[0]): PlayerCharacter => ({
  id: 'test-char',
  name: 'Test',
  baseStats: createCharacter(statsOverrides),
  equipment: { weapon: null, armor: null, accessories: [], setBonus: null },
  innerWays: [],
  mysticArts: [],
  weaponType: WeaponType.Sword,
  martialArtStyle: MartialArtStyle.CelestialSword,
});

describe('BaseStatsCalculator', () => {
  let calculator: BaseStatsCalculator;

  beforeEach(() => {
    calculator = new BaseStatsCalculator();
  });

  describe('calculateFinalStats', () => {
    it('should return base stats without buffs', () => {
      // Arrange — pas de buffs, pas d'équipement (TODO Phase 3)
      const char = makePlayerChar();

      // Act
      const stats = calculator.calculateFinalStats(char);

      // Assert — les stats de base sont retournées sans modification
      expect(stats.attack).toBe(char.baseStats.attack);
      expect(stats.level).toBe(char.baseStats.level);
      expect(stats.precision).toBe(char.baseStats.precision);
    });

    it('should apply flat buffs correctly', () => {
      // Arrange
      const char = makePlayerChar({ attack: 2500 });
      const buffs: readonly ActiveBuff[] = [
        { id: 'buff-atk', name: 'Rage du dragon', stat: 'attack', value: 200, isMultiplicative: false },
      ];

      // Act
      const stats = calculator.calculateFinalStats(char, buffs);

      // Assert — 2500 + 200 = 2700
      expect(stats.attack).toBeCloseTo(2700);
    });

    it('should apply percentage buffs correctly', () => {
      // Arrange
      const char = makePlayerChar({ attack: 2500 });
      const buffs: readonly ActiveBuff[] = [
        { id: 'buff-pct', name: 'Vent rapide', stat: 'attack', value: 0.20, isMultiplicative: true },
      ];

      // Act
      const stats = calculator.calculateFinalStats(char, buffs);

      // Assert — 2500 × (1 + 0.20) = 3000
      expect(stats.attack).toBeCloseTo(3000);
    });

    it('should stack multiple buffs sequentially', () => {
      // Arrange
      const char = makePlayerChar({ attack: 2500 });
      const buffs: readonly ActiveBuff[] = [
        { id: 'buff-flat', name: 'Buff plat', stat: 'attack', value: 500, isMultiplicative: false },
        { id: 'buff-pct', name: 'Buff %', stat: 'attack', value: 0.10, isMultiplicative: true },
      ];

      // Act
      const stats = calculator.calculateFinalStats(char, buffs);

      // Assert — d'abord plat: 2500+500=3000, puis ×1.10=3300
      expect(stats.attack).toBeCloseTo(3300);
    });

    it('should handle empty buff array', () => {
      // Arrange
      const char = makePlayerChar();

      // Act
      const stats = calculator.calculateFinalStats(char, []);

      // Assert — résultat identique aux stats de base
      expect(stats.attack).toBe(char.baseStats.attack);
      expect(stats.critDamage).toBe(char.baseStats.critDamage);
    });

    it('should cap affinityRate at 60% maximum', () => {
      // Arrange — affinityRate: 0.80 dépasse le cap STAT_LIMITS.MAX_AFFINITY_RATE (0.60)
      const char = makePlayerChar({ affinityRate: 0.80 });

      // Act
      const stats = calculator.calculateFinalStats(char, []);

      // Assert — capé à 0.60
      expect(stats.affinityRate).toBeCloseTo(0.60);
    });
  });
});
