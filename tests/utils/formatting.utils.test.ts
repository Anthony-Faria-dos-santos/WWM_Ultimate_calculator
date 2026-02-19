/**
 * Tests unitaires pour les utilitaires de formatage
 * 
 * Valide le comportement des fonctions de formatage pour
 * l'affichage des résultats de calcul WWM.
 */

import { describe, it, expect } from 'vitest';
import {
  formatDamage,
  formatPercentage,
  formatDPS,
  formatDuration,
  formatStatName,
} from '@/lib/utils/formatting.utils';

// ============================================================================
// FORMAT DAMAGE
// ============================================================================

describe('formatDamage', () => {
  it('should format basic damage with no separator', () => {
    expect(formatDamage(123)).toBe('123');
    expect(formatDamage(999)).toBe('999');
  });

  it('should add thousand separator (space)', () => {
    expect(formatDamage(1234)).toBe('1 234');
    expect(formatDamage(12345)).toBe('12 345');
    expect(formatDamage(123456)).toBe('123 456');
    expect(formatDamage(1234567)).toBe('1 234 567');
  });

  it('should round to integer', () => {
    expect(formatDamage(12345.6)).toBe('12 346');
    expect(formatDamage(12345.4)).toBe('12 345');
    expect(formatDamage(999.5)).toBe('1 000');
  });

  it('should handle zero', () => {
    expect(formatDamage(0)).toBe('0');
  });

  it('should clamp negative values to 0', () => {
    expect(formatDamage(-100)).toBe('0');
    expect(formatDamage(-1234.5)).toBe('0');
  });

  it('should handle very large numbers', () => {
    expect(formatDamage(1000000)).toBe('1 000 000');
    expect(formatDamage(12345678)).toBe('12 345 678');
  });

  it('should handle small decimals that round to 0', () => {
    expect(formatDamage(0.4)).toBe('0');
    expect(formatDamage(0.5)).toBe('1');
  });
});

// ============================================================================
// FORMAT PERCENTAGE
// ============================================================================

describe('formatPercentage', () => {
  it('should format basic percentage with 1 decimal by default', () => {
    expect(formatPercentage(0.5)).toBe('50.0%');
    expect(formatPercentage(0.3542)).toBe('35.4%');
    expect(formatPercentage(0.999)).toBe('99.9%');
  });

  it('should format with custom decimals', () => {
    expect(formatPercentage(0.3542, 2)).toBe('35.42%');
    expect(formatPercentage(0.3542, 0)).toBe('35%');
    expect(formatPercentage(0.3542, 3)).toBe('35.420%');
  });

  it('should handle zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(0, 2)).toBe('0.00%');
  });

  it('should handle one (100%)', () => {
    expect(formatPercentage(1)).toBe('100.0%');
    expect(formatPercentage(1, 2)).toBe('100.00%');
  });

  it('should clamp values > 1 to 100%', () => {
    expect(formatPercentage(1.5)).toBe('100.0%');
    expect(formatPercentage(2)).toBe('100.0%');
    expect(formatPercentage(1.5, 2)).toBe('100.00%');
  });

  it('should clamp negative values to 0%', () => {
    expect(formatPercentage(-0.2)).toBe('0.0%');
    expect(formatPercentage(-1)).toBe('0.0%');
  });

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.001)).toBe('0.1%');
    expect(formatPercentage(0.001, 2)).toBe('0.10%');
    expect(formatPercentage(0.0001, 3)).toBe('0.010%');
  });

  it('should round properly', () => {
    // Note: JavaScript toFixed() utilise l'arrondi bancaire (round-half-even)
    // 35.45 peut s'arrondir à 35.4 (pair le plus proche)
    expect(formatPercentage(0.3546, 1)).toBe('35.5%'); // 35.46 arrondi à 35.5
    expect(formatPercentage(0.3544, 1)).toBe('35.4%'); // 35.44 arrondi à 35.4
  });
});

// ============================================================================
// FORMAT DPS
// ============================================================================

describe('formatDPS', () => {
  it('should format basic DPS with 1 decimal', () => {
    expect(formatDPS(1234.56)).toBe('1 234.6 DPS');
    expect(formatDPS(45678.123)).toBe('45 678.1 DPS');
  });

  it('should add thousand separator (space)', () => {
    expect(formatDPS(1234)).toBe('1 234.0 DPS');
    expect(formatDPS(12345)).toBe('12 345.0 DPS');
    expect(formatDPS(123456.7)).toBe('123 456.7 DPS');
  });

  it('should handle zero', () => {
    expect(formatDPS(0)).toBe('0.0 DPS');
  });

  it('should round to 1 decimal', () => {
    expect(formatDPS(999.99)).toBe('1 000.0 DPS');
    expect(formatDPS(1234.56)).toBe('1 234.6 DPS');
    expect(formatDPS(1234.54)).toBe('1 234.5 DPS');
  });

  it('should clamp negative values to 0', () => {
    expect(formatDPS(-100)).toBe('0.0 DPS');
  });

  it('should handle small values', () => {
    expect(formatDPS(1.5)).toBe('1.5 DPS');
    expect(formatDPS(99.9)).toBe('99.9 DPS');
  });

  it('should handle very large numbers', () => {
    expect(formatDPS(1000000.5)).toBe('1 000 000.5 DPS');
  });

  it('should always show 1 decimal even for integers', () => {
    expect(formatDPS(100)).toBe('100.0 DPS');
    expect(formatDPS(1000)).toBe('1 000.0 DPS');
  });
});

// ============================================================================
// FORMAT DURATION
// ============================================================================

describe('formatDuration', () => {
  it('should format seconds only (< 60s)', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('should format minutes and seconds (60s - 3600s)', () => {
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(150)).toBe('2m 30s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('should format hours, minutes and seconds (>= 3600s)', () => {
    expect(formatDuration(3600)).toBe('1h 0m 0s');
    expect(formatDuration(3661)).toBe('1h 1m 1s');
    expect(formatDuration(7265)).toBe('2h 1m 5s');
    expect(formatDuration(7200)).toBe('2h 0m 0s');
  });

  it('should round to integer seconds', () => {
    expect(formatDuration(45.6)).toBe('46s');
    expect(formatDuration(90.4)).toBe('1m 30s');
    expect(formatDuration(3661.7)).toBe('1h 1m 2s');
  });

  it('should handle negative values (clamped to 0)', () => {
    expect(formatDuration(-10)).toBe('0s');
    expect(formatDuration(-100)).toBe('0s');
  });

  it('should handle edge cases around boundaries', () => {
    // Juste avant 1 minute
    expect(formatDuration(59.9)).toBe('1m 0s'); // Arrondi à 60s
    
    // Juste avant 1 heure
    expect(formatDuration(3599.4)).toBe('59m 59s');
    expect(formatDuration(3599.5)).toBe('1h 0m 0s'); // Arrondi à 3600s
  });

  it('should handle very long durations', () => {
    expect(formatDuration(10000)).toBe('2h 46m 40s');
    expect(formatDuration(86400)).toBe('24h 0m 0s'); // 1 jour
  });
});

// ============================================================================
// FORMAT STAT NAME
// ============================================================================

describe('formatStatName', () => {
  it('should format combat stats', () => {
    expect(formatStatName('attack')).toBe('Attaque');
    expect(formatStatName('attackMin')).toBe('Attaque Min');
    expect(formatStatName('attackMax')).toBe('Attaque Max');
    expect(formatStatName('elementalAttack')).toBe('Attaque Élémentaire');
    expect(formatStatName('defense')).toBe('Défense');
    expect(formatStatName('resistance')).toBe('Résistance');
  });

  it('should format crit stats', () => {
    expect(formatStatName('critRate')).toBe('Taux Critique');
    expect(formatStatName('critDamage')).toBe('Dégâts Critiques');
  });

  it('should format affinity stats', () => {
    expect(formatStatName('affinityRate')).toBe('Taux Affinité');
    expect(formatStatName('affinityDamage')).toBe('Dégâts Affinité');
  });

  it('should format precision stats', () => {
    expect(formatStatName('precision')).toBe('Précision');
    expect(formatStatName('parry')).toBe('Parade');
  });

  it('should format penetration stats', () => {
    expect(formatStatName('armorPenetration')).toBe('Pénétration Armure');
    expect(formatStatName('elementalPenetration')).toBe('Pénétration Élémentaire');
  });

  it('should format other stats', () => {
    expect(formatStatName('level')).toBe('Niveau');
    expect(formatStatName('shield')).toBe('Bouclier');
  });

  it('should return key as-is for unknown stats (fallback)', () => {
    expect(formatStatName('unknownStat')).toBe('unknownStat');
    expect(formatStatName('customField')).toBe('customField');
    expect(formatStatName('someRandomKey')).toBe('someRandomKey');
  });

  it('should be case-sensitive', () => {
    expect(formatStatName('Attack')).toBe('Attack'); // Fallback (A majuscule)
    expect(formatStatName('ATTACK')).toBe('ATTACK'); // Fallback (tout en majuscules)
  });

  it('should handle empty string', () => {
    expect(formatStatName('')).toBe('');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Formatting integration', () => {
  it('should format a complete damage breakdown', () => {
    const baseDamage = 12345.6;
    const critRate = 0.449;
    const dps = 45678.123;
    const duration = 150;

    expect(formatDamage(baseDamage)).toBe('12 346');
    expect(formatPercentage(critRate)).toBe('44.9%');
    expect(formatDPS(dps)).toBe('45 678.1 DPS');
    expect(formatDuration(duration)).toBe('2m 30s');
  });

  it('should format stats with their labels', () => {
    const stats = {
      attack: 1200,
      critRate: 0.45,
      affinityRate: 0.30,
      precision: 500,
    };

    // Format les clés
    expect(formatStatName('attack')).toBe('Attaque');
    expect(formatStatName('critRate')).toBe('Taux Critique');
    expect(formatStatName('affinityRate')).toBe('Taux Affinité');
    expect(formatStatName('precision')).toBe('Précision');

    // Format les valeurs
    expect(formatDamage(stats.attack)).toBe('1 200');
    expect(formatPercentage(stats.critRate)).toBe('45.0%');
    expect(formatPercentage(stats.affinityRate)).toBe('30.0%');
    expect(formatDamage(stats.precision)).toBe('500');
  });
});
