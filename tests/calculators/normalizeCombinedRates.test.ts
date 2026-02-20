import { describe, it, expect } from 'vitest';
import { normalizeCombinedRates } from '@/lib/calculators/normalizeCombinedRates';

describe('normalizeCombinedRates', () => {
  it('should normalize rates when sum exceeds 100%', () => {
    // Arrange — 70% + 50% = 120% → normalisation proportionnelle
    // normalizedCrit = 0.70/1.20 = 0.5833, normalizedAff = 0.50/1.20 = 0.4167

    // Act
    const result = normalizeCombinedRates(0.70, 0.50);

    // Assert
    expect(result.wasNormalized).toBe(true);
    expect(result.normalizedCritRate).toBeCloseTo(0.5833, 3);
    expect(result.normalizedAffinityRate).toBeCloseTo(0.4167, 3);
    // La somme normalisée doit être égale à 1.0
    expect(result.normalizedCritRate + result.normalizedAffinityRate).toBeCloseTo(1.0);
  });

  it('should keep rates unchanged when sum is below or equal to 100%', () => {
    // Arrange — 45% + 30% = 75% → pas de normalisation

    // Act
    const result = normalizeCombinedRates(0.45, 0.30);

    // Assert
    expect(result.wasNormalized).toBe(false);
    expect(result.normalizedCritRate).toBeCloseTo(0.45);
    expect(result.normalizedAffinityRate).toBeCloseTo(0.30);
  });

  it('should handle all zero rates', () => {
    // Arrange — deux taux à 0 → pas de division par zéro

    // Act
    const result = normalizeCombinedRates(0, 0);

    // Assert
    expect(result.wasNormalized).toBe(false);
    expect(result.normalizedCritRate).toBe(0);
    expect(result.normalizedAffinityRate).toBe(0);
  });

  it('should maintain proportions when normalizing', () => {
    // Arrange — 80% + 60% = 140% (caps maximum des deux stats)
    // Proportions originales : 80:60 = 4:3
    // Normalisées : 80/140 ≈ 0.5714, 60/140 ≈ 0.4286

    // Act
    const result = normalizeCombinedRates(0.80, 0.60);

    // Assert
    expect(result.wasNormalized).toBe(true);
    expect(result.normalizedCritRate).toBeCloseTo(0.5714, 3);
    expect(result.normalizedAffinityRate).toBeCloseTo(0.4286, 3);
    // Vérifier que les proportions originales sont conservées (ratio 4:3)
    const ratio = result.normalizedCritRate / result.normalizedAffinityRate;
    expect(ratio).toBeCloseTo(0.80 / 0.60, 3);
  });

  it('should handle exact 100% sum without normalizing', () => {
    // Arrange — 60% + 40% = 100% → pile au seuil, pas de normalisation

    // Act
    const result = normalizeCombinedRates(0.60, 0.40);

    // Assert
    expect(result.wasNormalized).toBe(false);
    expect(result.normalizedCritRate).toBeCloseTo(0.60);
    expect(result.normalizedAffinityRate).toBeCloseTo(0.40);
  });
});
