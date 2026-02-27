/**
 * Tests du SimulationService (Monte Carlo).
 * Valide les statistiques, distributions et utilitaires (CI, percentiles).
 */

import { describe, it, expect } from 'vitest';
import { SimulationService } from '@/lib/services';
import type { SimulationConfig } from '@/lib/services';
import { DamageZone } from '@/lib/calculators';
import { TEST_FIXTURES } from '../fixtures';

describe('SimulationService', () => {
  const service = new SimulationService();

  const baseConfig: SimulationConfig = {
    attacker: TEST_FIXTURES.characters.standardDPS,
    skill: TEST_FIXTURES.skills.basicAttack,
    target: TEST_FIXTURES.targets.standardEnemy,
    iterations: 500,
  };

  describe('simulate', () => {
    it('retourne le bon nombre d\'échantillons', () => {
      const result = service.simulate(baseConfig);

      expect(result.sortedSamples).toHaveLength(500);
      expect(result.iterations).toBe(500);
    });

    it('calcule des statistiques cohérentes (min <= median <= max)', () => {
      const result = service.simulate(baseConfig);

      expect(result.min).toBeLessThanOrEqual(result.median);
      expect(result.median).toBeLessThanOrEqual(result.max);
    });

    it('calcule une moyenne positive', () => {
      const result = service.simulate(baseConfig);

      expect(result.mean).toBeGreaterThan(0);
    });

    it('produit un écart-type >= 0', () => {
      const result = service.simulate(baseConfig);

      expect(result.stdDev).toBeGreaterThanOrEqual(0);
    });

    it('la somme de la distribution vaut iterations', () => {
      const result = service.simulate(baseConfig);
      const { miss, normal, critical, affinity, criticalAffinity } = result.distribution;

      expect(miss + normal + critical + affinity + criticalAffinity).toBe(500);
    });

    it('la distribution contient des outcomes variés', () => {
      const result = service.simulate({ ...baseConfig, iterations: 1000 });
      const { miss, normal, critical, affinity } = result.distribution;
      const nonZeroCount = [miss, normal, critical, affinity].filter(v => v > 0).length;

      expect(nonZeroCount).toBeGreaterThanOrEqual(2);
    });

    it('les échantillons sont triés', () => {
      const result = service.simulate(baseConfig);

      for (let i = 1; i < result.sortedSamples.length; i++) {
        expect(result.sortedSamples[i]).toBeGreaterThanOrEqual(result.sortedSamples[i - 1]);
      }
    });

    it('lance une erreur si iterations <= 0', () => {
      expect(() => service.simulate({ ...baseConfig, iterations: 0 })).toThrow();
      expect(() => service.simulate({ ...baseConfig, iterations: -5 })).toThrow();
    });

    it('accepte des bonus optionnels', () => {
      const withBonus = service.simulate({
        ...baseConfig,
        bonuses: [{ category: DamageZone.Augmentation, value: 0.5, source: 'Test' }],
      });
      const withoutBonus = service.simulate(baseConfig);

      expect(withBonus.mean).toBeGreaterThan(withoutBonus.mean * 0.9);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('calcule un intervalle à 95% contenant la moyenne', () => {
      const result = service.simulate(baseConfig);
      const [lower, upper] = service.calculateConfidenceInterval(result, 0.95);

      expect(lower).toBeLessThan(result.mean);
      expect(upper).toBeGreaterThan(result.mean);
    });

    it('l\'intervalle à 99% est plus large que celui à 95%', () => {
      const result = service.simulate(baseConfig);
      const ci95 = service.calculateConfidenceInterval(result, 0.95);
      const ci99 = service.calculateConfidenceInterval(result, 0.99);
      const width95 = ci95[1] - ci95[0];
      const width99 = ci99[1] - ci99[0];

      expect(width99).toBeGreaterThan(width95);
    });
  });

  describe('getPercentile', () => {
    it('retourne la valeur min pour le percentile 0', () => {
      const result = service.simulate(baseConfig);

      expect(service.getPercentile(result, 0)).toBe(result.min);
    });

    it('retourne la valeur max pour le percentile 100', () => {
      const result = service.simulate(baseConfig);

      expect(service.getPercentile(result, 100)).toBe(result.max);
    });

    it('le p50 est proche de la médiane', () => {
      const result = service.simulate(baseConfig);
      const p50 = service.getPercentile(result, 50);

      expect(Math.abs(p50 - result.median) / Math.max(result.mean, 1)).toBeLessThan(0.05);
    });

    it('lance une erreur pour un percentile hors bornes', () => {
      const result = service.simulate(baseConfig);

      expect(() => service.getPercentile(result, -1)).toThrow();
      expect(() => service.getPercentile(result, 101)).toThrow();
    });
  });
});
