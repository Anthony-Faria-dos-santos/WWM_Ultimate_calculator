import { describe, it, expect, beforeEach } from 'vitest';
import { RotationDPSCalculator } from '@/lib/calculators/RotationDPSCalculator';
import { TimelineEventType } from '@/lib/types';
import { createCharacter, TEST_FIXTURES } from '../fixtures';

// Utilise simulateExpectedRotation (déterministe, pas de Math.random)
// GCD = 1.0 — skillTime = castTime + GCD

describe('RotationDPSCalculator', () => {
  let calculator: RotationDPSCalculator;
  const character = createCharacter();
  const weakEnemy = TEST_FIXTURES.targets.weakEnemy;
  const { basicAttack, strongSkill } = TEST_FIXTURES.skills;

  beforeEach(() => {
    calculator = new RotationDPSCalculator();
  });

  describe('simulateExpectedRotation', () => {
    it('should simulate single-skill rotation', () => {
      // Arrange — basicAttack: castTime=1.0, cooldown=0, skillTime=2.0
      // En 10s: t=0,2,4,6,8 → 5 casts
      const skills = [basicAttack];

      // Act
      const result = calculator.simulateExpectedRotation(character, skills, weakEnemy, 10);

      // Assert
      expect(result.totalDamage).toBeGreaterThan(0);
      expect(result.totalHits).toBe(5); // 5 casts en 10s (t=0,2,4,6,8)
      expect(result.dps).toBeCloseTo(result.totalDamage / result.duration);
    });

    it('should respect cooldowns in multi-skill rotation', () => {
      // Arrange — strongSkill (cooldown=8) se répète moins souvent que basicAttack (CD=0)
      const skills = [strongSkill, basicAttack];

      // Act — 20s : strongSkill utilisé ~2-3x, basicAttack remplit les gaps
      const result = calculator.simulateExpectedRotation(character, skills, weakEnemy, 20);

      // Assert — les deux skills sont dans les usages
      const strongUsage = result.skillUsages.find((u) => u.skillId === strongSkill.id);
      const basicUsage = result.skillUsages.find((u) => u.skillId === basicAttack.id);

      expect(strongUsage).toBeDefined();
      expect(basicUsage).toBeDefined();
      // basicAttack doit être utilisé plus souvent que strongSkill (CD=8 vs CD=0)
      expect(basicUsage!.usageCount).toBeGreaterThan(strongUsage!.usageCount);
    });

    it('should generate correct chronological timeline', () => {
      // Arrange
      const skills = [basicAttack];

      // Act
      const result = calculator.simulateExpectedRotation(character, skills, weakEnemy, 6);

      // Assert — les événements doivent être chronologiquement ordonnés
      const times = result.timeline.map((e) => e.time);
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }

      // Vérifier la présence d'événements SkillCast et DamageDealt
      const castEvents = result.timeline.filter((e) => e.type === TimelineEventType.SkillCast);
      const damageEvents = result.timeline.filter((e) => e.type === TimelineEventType.DamageDealt);
      expect(castEvents.length).toBeGreaterThan(0);
      expect(damageEvents.length).toBeGreaterThan(0);
    });

    it('should handle zero duration', () => {
      // Arrange
      const skills = [basicAttack];

      // Act
      const result = calculator.simulateExpectedRotation(character, skills, weakEnemy, 0);

      // Assert — résultat vide attendu via createEmptyResult
      expect(result.totalDamage).toBe(0);
      expect(result.dps).toBe(0);
      expect(result.totalHits).toBe(0);
      expect(result.timeline).toHaveLength(0);
    });

    it('should fill gaps with basic attack when skill is on cooldown', () => {
      // Arrange — strongSkill (CD=8) prioritaire mais laisse des gaps
      // basicAttack (CD=0) remplit automatiquement les créneaux libres
      const skills = [strongSkill, basicAttack];

      // Act — assez long pour voir les deux compétences
      const result = calculator.simulateExpectedRotation(character, skills, weakEnemy, 15);

      // Assert — basicAttack doit apparaître dans la timeline entre les casts de strongSkill
      const basicCasts = result.timeline.filter(
        (e) => e.skillId === basicAttack.id && e.type === TimelineEventType.SkillCast
      );
      expect(basicCasts.length).toBeGreaterThan(0);

      // Le DPS total doit être supérieur à un run sans filler
      const noFillerResult = calculator.simulateExpectedRotation(character, [strongSkill], weakEnemy, 15);
      expect(result.totalDamage).toBeGreaterThan(noFillerResult.totalDamage);
    });
  });
});
