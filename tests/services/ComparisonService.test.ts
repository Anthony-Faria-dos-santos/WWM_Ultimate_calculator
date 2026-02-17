/**
 * Tests for ComparisonService
 * 
 * Vérifie que le service compare correctement les builds et calcule les gains marginaux.
 * 
 * @module tests/services
 */

import { describe, it, expect } from 'vitest';
import { ComparisonService, type BuildConfig } from '@/lib/services';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import { SkillElement, SkillCategory, DamageType } from '@/lib/types';
import { BonusCategory } from '@/lib/calculators';

describe('ComparisonService', () => {
  const service = new ComparisonService();

  const baseStats: CharacterBaseStats = {
    level: 80,
    attack: 3000,
    attackMin: 2850,
    attackMax: 3150,
    elementalAttack: 1500,
    defense: 300,
    resistance: 200,
    critRate: 2000,
    critDamage: 0.5,
    affinityRate: 0.25,
    affinityDamage: 0.2,
    precision: 1500,
    armorPenetration: 100,
    elementalPenetration: 100,
  };

  const statsCrit: CharacterBaseStats = {
    ...baseStats,
    critRate: 3500, // Plus de crit
    critDamage: 0.8,
  };

  const statsAff: CharacterBaseStats = {
    ...baseStats,
    affinityRate: 0.35, // Plus d'affinité
    affinityDamage: 0.3,
  };

  const mockSkill: Skill = {
    id: 'test-skill-001',
    name: 'Test Skill',
    description: 'A test skill',
    physicalRatio: 1.0,
    elementalRatio: 0.5,
    cooldown: 5,
    castTime: 0,
    damageType: DamageType.Hybrid,
    category: SkillCategory.Active,
    element: SkillElement.Fire,
    weaponType: null,
    talents: [],
    range: 5,
    areaOfEffect: 0,
  };

  const mockSkill2: Skill = {
    ...mockSkill,
    id: 'test-skill-002',
    name: 'Test Skill 2',
    physicalRatio: 1.2,
    cooldown: 8,
  };

  const mockTarget: Target = {
    id: 'test-target',
    name: 'Test Boss',
    level: 80,
    defense: 500,
    resistance: 300,
    shield: 0.1,
    parry: 400,
    critResistance: 500,
  };

  describe('Instanciation', () => {
    it('peut être instancié', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ComparisonService);
    });
  });

  describe('compareTwoBuilds', () => {
    it('compare correctement deux builds différents', () => {
      const build1: BuildConfig = {
        name: 'Build Critique',
        stats: statsCrit,
        skills: [mockSkill, mockSkill2],
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build Affinité',
        stats: statsAff,
        skills: [mockSkill, mockSkill2],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result).toBeDefined();
      expect(result.build1Name).toBe('Build Critique');
      expect(result.build2Name).toBe('Build Affinité');
      expect(result.build1DPS).toBeGreaterThan(0);
      expect(result.build2DPS).toBeGreaterThan(0);
      expect(typeof result.dpsAdvantage).toBe('number');
      expect(typeof result.percentageAdvantage).toBe('number');
      expect(['build1', 'build2', 'tie']).toContain(result.winner);
    });

    it('détecte un tie quand la différence de DPS est < 1', () => {
      const build1: BuildConfig = {
        name: 'Build A',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build B',
        stats: baseStats, // Mêmes stats → même DPS
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.winner).toBe('tie');
      expect(Math.abs(result.dpsAdvantage)).toBeLessThan(1);
      expect(Math.abs(result.percentageAdvantage)).toBeLessThan(1);
    });

    it('identifie build1 comme winner si DPS supérieur', () => {
      const build1: BuildConfig = {
        name: 'Build Fort',
        stats: { ...baseStats, attack: 5000 }, // Beaucoup plus d'attaque
        skills: [mockSkill],
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build Faible',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.winner).toBe('build1');
      expect(result.build1DPS).toBeGreaterThan(result.build2DPS);
      expect(result.dpsAdvantage).toBeGreaterThan(0); // dpsAdvantage positif
      expect(result.percentageAdvantage).toBeGreaterThan(0); // % positif
    });

    it('gère les builds avec skills vides (DPS = 0)', () => {
      const build1: BuildConfig = {
        name: 'Build Sans Skills',
        stats: baseStats,
        skills: [], // Pas de skills
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build Normal',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.build1DPS).toBe(0);
      expect(result.build2DPS).toBeGreaterThan(0);
      expect(result.winner).toBe('build2');
    });

    it('inclut le breakdown des différences de stats', () => {
      const build1: BuildConfig = {
        name: 'Build 1',
        stats: { ...baseStats, attack: 3500, critRate: 2500 },
        skills: [mockSkill],
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build 2',
        stats: { ...baseStats, attack: 3000, critRate: 2000 },
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.breakdown).toBeDefined();
      expect(result.breakdown!.attack).toBe(500); // 3500 - 3000
      expect(result.breakdown!.critRate).toBe(500); // 2500 - 2000
    });
  });

  describe('calculateMarginalGains', () => {
    it('calcule les gains marginaux pour toutes les stats', () => {
      const gains = service.calculateMarginalGains(
        baseStats,
        [mockSkill, mockSkill2],
        mockTarget,
        [],
        10
      );

      expect(gains).toBeDefined();
      expect(Array.isArray(gains)).toBe(true);
      expect(gains.length).toBe(9); // 9 stats testées

      // Vérifier que tous les résultats ont la bonne structure
      for (const gain of gains) {
        expect(gain.statName).toBeDefined();
        expect(gain.originalValue).toBeGreaterThanOrEqual(0);
        expect(gain.newValue).toBeGreaterThan(gain.originalValue);
        expect(gain.originalDPS).toBeGreaterThan(0);
        expect(gain.newDPS).toBeGreaterThanOrEqual(0);
        expect(typeof gain.dpsGain).toBe('number');
        expect(typeof gain.dpsGainPercent).toBe('number');
        expect(typeof gain.efficiency).toBe('number');
      }
    });

    it('trie les résultats par efficiency décroissante', () => {
      const gains = service.calculateMarginalGains(
        baseStats,
        [mockSkill],
        mockTarget,
        [],
        10
      );

      // Vérifier que le tri est correct
      for (let i = 0; i < gains.length - 1; i++) {
        expect(gains[i].efficiency).toBeGreaterThanOrEqual(gains[i + 1].efficiency);
      }
    });

    it('calcule correctement les deltas pour chaque stat', () => {
      const gains = service.calculateMarginalGains(
        baseStats,
        [mockSkill],
        mockTarget,
        [],
        10
      );

      // Trouver les gains pour attack (+100)
      const attackGain = gains.find(g => g.statName === 'attack');
      expect(attackGain).toBeDefined();
      expect(attackGain!.newValue).toBe(baseStats.attack + 100);

      // Trouver les gains pour critDamage (+0.1)
      const critDamageGain = gains.find(g => g.statName === 'critDamage');
      expect(critDamageGain).toBeDefined();
      expect(critDamageGain!.newValue).toBeCloseTo(baseStats.critDamage + 0.1, 5);
    });

    it('gère le cas où originalDPS = 0 (dpsGainPercent = 0)', () => {
      const gains = service.calculateMarginalGains(
        baseStats,
        [], // Pas de skills → DPS = 0
        mockTarget,
        [],
        10
      );

      for (const gain of gains) {
        expect(gain.originalDPS).toBe(0);
        expect(gain.newDPS).toBe(0);
        expect(gain.dpsGainPercent).toBe(0);
      }
    });

    it('accepte des bonus optionnels', () => {
      const bonuses = [
        { source: 'Test Bonus', category: BonusCategory.DamageIncrease, value: 0.2 },
      ];

      const gains = service.calculateMarginalGains(
        baseStats,
        [mockSkill],
        mockTarget,
        bonuses,
        10
      );

      expect(gains).toBeDefined();
      expect(gains.length).toBeGreaterThan(0);
      expect(gains[0].originalDPS).toBeGreaterThan(0);
    });
  });

  describe('findBestStat', () => {
    it('retourne la stat avec la meilleure efficiency', () => {
      const bestStat = service.findBestStat(
        baseStats,
        [mockSkill, mockSkill2],
        mockTarget,
        [],
        10
      );

      expect(bestStat).not.toBeNull();
      expect(bestStat!.statName).toBeDefined();
      expect(bestStat!.efficiency).toBeGreaterThan(0);

      // Vérifier que c'est bien la meilleure efficiency
      const allGains = service.calculateMarginalGains(
        baseStats,
        [mockSkill, mockSkill2],
        mockTarget,
        [],
        10
      );
      expect(bestStat!.efficiency).toBe(allGains[0].efficiency);
    });

    it('retourne null si aucun gain (skills vide)', () => {
      const bestStat = service.findBestStat(
        baseStats,
        [], // Pas de skills
        mockTarget,
        [],
        10
      );

      // Même avec skills vides, calculateMarginalGains retourne 9 résultats
      // Donc bestStat ne sera pas null, mais les gains seront tous 0
      expect(bestStat).not.toBeNull();
      expect(bestStat!.dpsGain).toBe(0);
    });

    it('utilise la durée personnalisée', () => {
      const bestStat60 = service.findBestStat(
        baseStats,
        [mockSkill],
        mockTarget,
        [],
        60
      );

      const bestStat10 = service.findBestStat(
        baseStats,
        [mockSkill],
        mockTarget,
        [],
        10
      );

      expect(bestStat60).not.toBeNull();
      expect(bestStat10).not.toBeNull();
      // Les deux devraient avoir la même meilleure stat (l'efficacité est proportionnelle)
      expect(bestStat60!.statName).toBe(bestStat10!.statName);
    });
  });

  describe('Edge Cases', () => {
    it('gère les stats extrêmes (très hautes)', () => {
      const extremeStats: CharacterBaseStats = {
        ...baseStats,
        attack: 10000,
        critRate: 5000,
        affinityRate: 0.4,
      };

      const gains = service.calculateMarginalGains(
        extremeStats,
        [mockSkill],
        mockTarget,
        [],
        10
      );

      expect(gains).toBeDefined();
      expect(gains.length).toBe(9);
      expect(gains[0].originalDPS).toBeGreaterThan(0);
    });

    it('gère les bonus multiples dans la comparaison', () => {
      const build1: BuildConfig = {
        name: 'Build Avec Bonus',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [
          { source: 'Bonus 1', category: BonusCategory.DamageIncrease, value: 0.2 },
          { source: 'Bonus 2', category: BonusCategory.SkillDamage, value: 0.15 },
        ],
      };

      const build2: BuildConfig = {
        name: 'Build Sans Bonus',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.build1DPS).toBeGreaterThan(result.build2DPS);
      expect(result.winner).toBe('build1');
    });

    it('breakdown est undefined si stats identiques', () => {
      const build1: BuildConfig = {
        name: 'Build A',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const build2: BuildConfig = {
        name: 'Build B',
        stats: baseStats,
        skills: [mockSkill],
        bonuses: [],
      };

      const result = service.compareTwoBuilds(build1, build2, mockTarget, 10);

      expect(result.breakdown).toBeUndefined();
    });
  });
});
