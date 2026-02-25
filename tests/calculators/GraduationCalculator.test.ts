import { describe, it, expect, beforeEach } from 'vitest';
import { GraduationCalculator } from '@/lib/calculators/GraduationCalculator';

describe('GraduationCalculator', () => {
  let calculator: GraduationCalculator;

  beforeEach(() => {
    calculator = new GraduationCalculator();
  });

  describe('calculateGraduation', () => {
    it('should calculate graduation rate as ratio to reference', () => {
      // Arrange — build competitive : 1850 DPS vs référence 2100
      // graduationRate = (1850 / 2100) × 100 ≈ 88.1%

      // Act
      const result = calculator.calculateGraduation(1850, 2100);

      // Assert
      expect(result.graduationRate).toBeCloseTo(88.095, 2);
      expect(result.yourDPS).toBe(1850);
      expect(result.referenceDPS).toBe(2100);
      expect(result.dpsGap).toBeCloseTo(250);           // referenceDPS - yourDPS
      expect(result.improvementNeeded).toBeCloseTo(250 / 1850, 4); // dpsGap / yourDPS
      expect(result.rating).toBe('competitive');        // 80-90%
    });

    it('should return 100% when matching reference DPS', () => {
      // Arrange
      const yourDPS = 2100;
      const referenceDPS = 2100;

      // Act
      const result = calculator.calculateGraduation(yourDPS, referenceDPS);

      // Assert
      expect(result.graduationRate).toBeCloseTo(100);
      expect(result.dpsGap).toBe(0);
      expect(result.improvementNeeded).toBe(0); // aucune amélioration nécessaire
      expect(result.rating).toBe('optimized');  // 90-100%
    });

    it('should return > 100% when exceeding reference', () => {
      // Arrange — build exceptionnel : 2300 DPS vs référence 2100
      // graduationRate = (2300 / 2100) × 100 ≈ 109.5%

      // Act
      const result = calculator.calculateGraduation(2300, 2100);

      // Assert
      expect(result.graduationRate).toBeCloseTo(109.524, 2);
      expect(result.dpsGap).toBeCloseTo(-200);       // excédent de DPS (dpsGap négatif)
      expect(result.improvementNeeded).toBe(0);      // aucune amélioration nécessaire
      expect(result.rating).toBe('exceptional');     // > 100%
    });

    it('should return < 100% when below reference', () => {
      // Arrange — build débutant : 1200 DPS vs référence 2100
      // graduationRate = (1200 / 2100) × 100 ≈ 57.1% → 'beginner'

      // Act
      const result = calculator.calculateGraduation(1200, 2100);

      // Assert
      expect(result.graduationRate).toBeCloseTo(57.143, 2);
      expect(result.rating).toBe('beginner'); // < 70%
      expect(result.dpsGap).toBeCloseTo(900);
    });

    it('should handle zero reference DPS by throwing an error', () => {
      // Arrange — referenceDPS = 0 → impossible de calculer un ratio

      // Act & Assert
      expect(() => calculator.calculateGraduation(1500, 0)).toThrow(
        'Reference DPS must be > 0'
      );
    });

    it('should clamp negative yourDPS to zero', () => {
      // Arrange — yourDPS négatif → clampé à 0
      // graduationRate = 0, rating = 'beginner'

      // Act
      const result = calculator.calculateGraduation(-500, 2100);

      // Assert
      expect(result.yourDPS).toBe(0);
      expect(result.graduationRate).toBe(0);
      expect(result.rating).toBe('beginner');
      expect(result.improvementNeeded).toBe(0); // yourDPS = 0 → improvementNeeded = 0
    });
  });
});
