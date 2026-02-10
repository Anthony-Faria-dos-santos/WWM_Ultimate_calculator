/**
 * Combat Rates Calculator
 * 
 * Calculates the three core combat rates in a unified way:
 * 1. Precision Rate - Hit chance (base 95% + scaling, capped at 95%)
 * 2. Critical Rate - Critical hit chance (1.15x multiplier, capped at 80%)
 * 3. Affinity Rate - Elemental affinity chance (direct stat, capped at 60%)
 * 
 * These rates are fundamental to combat outcome determination and damage calculations.
 * All rates are returned as decimals (0.0-1.0) for probability calculations.
 * 
 * Important notes:
 * - Precision has a 95% cap (never 100% hit chance)
 * - Critical uses a hyperbolic formula with 1.15x multiplier
 * - Affinity is a direct character stat (no complex formula)
 * - When crit + affinity > 100%, normalization is applied (handled elsewhere)
 * 
 * @see WWM-Formules-Reference-v1.3.md Section 6 (Combat Rates)
 * 
 * @module calculators/CombatRatesCalculator
 * @version 1.0.0
 */

import type { CharacterBaseStats, Target, CombatRates } from '@/lib/types';
import {
  calculatePrecisionRate,
  calculateCriticalRate,
  STAT_LIMITS,
} from '@/lib/constants';

/**
 * Calculateur de taux de combat (Précision, Critique, Affinité).
 * 
 * Centralise le calcul des trois taux de combat principaux utilisés
 * pour déterminer les issues de combat (touche, critique, affinité).
 * 
 * @remarks
 * - **Précision** : Chance de toucher la cible (95% base + scaling)
 * - **Critique** : Chance de coup critique (formule hyperbolique ×1.15)
 * - **Affinité** : Chance d'effet d'affinité élémentaire (stat directe)
 * 
 * Tous les taux sont retournés en décimal (0.0-1.0) pour faciliter
 * les calculs probabilistes et les simulations Monte Carlo.
 * 
 * @example
 * ```typescript
 * const calculator = new CombatRatesCalculator();
 * const rates = calculator.calculateCombatRates(character, target);
 * 
 * // Utilisation dans calcul de dégâts
 * const willHit = Math.random() < rates.precisionRate;
 * const willCrit = Math.random() < rates.critRate;
 * const willTriggerAffinity = Math.random() < rates.affinityRate;
 * ```
 */
export class CombatRatesCalculator {
  /**
   * Calcule tous les taux de combat en un seul appel.
   * 
   * Méthode principale qui calcule les trois taux simultanément
   * pour optimiser les performances et garantir la cohérence.
   * 
   * @param character - Statistiques finales du personnage
   * @param target - Cible avec esquive et résistances
   * @returns Taux de combat complets prêts pour calculs de dégâts
   * 
   * @example
   * ```typescript
   * const calculator = new CombatRatesCalculator();
   * 
   * // Exemple 1 : Build équilibré PVE
   * const rates1 = calculator.calculateCombatRates(
   *   {
   *     precision: 5000,
   *     critRate: 2500,
   *     affinityRate: 0.35,
   *     // ... autres stats
   *   },
   *   {
   *     parry: 300,
   *     critResistance: 0,
   *     // ... autres stats
   *   }
   * );
   * // Résultat :
   * // - precisionRate: ~0.93 (93% de chance de toucher)
   * // - critRate: ~0.74 (74% de chance de critique)
   * // - affinityRate: 0.35 (35% de chance d'affinité)
   * // - normalizedCritRate: ~0.74 (pas de normalisation, total < 100%)
   * // - normalizedAffinityRate: 0.35 (pas de normalisation)
   * 
   * // Exemple 2 : Build haute précision
   * const rates2 = calculator.calculateCombatRates(
   *   {
   *     precision: 8000,
   *     critRate: 3500,
   *     affinityRate: 0.25,
   *     // ... autres stats
   *   },
   *   {
   *     parry: 500,
   *     critResistance: 0,
   *     // ... autres stats
   *   }
   * );
   * // Résultat :
   * // - precisionRate: ~0.95 (95%, cap atteint)
   * // - critRate: ~0.80 (80%, cap atteint)
   * // - affinityRate: 0.25 (25%)
   * // - normalizedCritRate: ~0.76 (normalisation : 80% + 25% > 100%)
   * // - normalizedAffinityRate: ~0.24 (normalisation proportionnelle)
   * 
   * // Exemple 3 : PVP avec résistances
   * const rates3 = calculator.calculateCombatRates(
   *   {
   *     precision: 5000,
   *     critRate: 3000,
   *     affinityRate: 0.40,
   *     // ... autres stats
   *   },
   *   {
   *     parry: 2000,
   *     critResistance: 800,
   *     // ... autres stats
   *   }
   * );
   * // Résultat :
   * // - precisionRate: ~0.75 (75%, réduit par haute esquive)
   * // - critRate: ~0.68 (68%, réduit par résistance critique)
   * // - affinityRate: 0.40 (40%, non affecté par résistances)
   * // - normalizedCritRate: ~0.63 (normalisation : 68% + 40% > 100%)
   * // - normalizedAffinityRate: ~0.37 (normalisation proportionnelle)
   * ```
   */
  public calculateCombatRates(
    character: Readonly<CharacterBaseStats>,
    target: Readonly<Target>
  ): CombatRates {
    // 1. Calculer taux de précision (hit chance)
    // Formule v1.3+ : 95% × (1.43 × Precision / (Precision + Parry + 150))
    const precisionRate = calculatePrecisionRate(
      character.precision || 0,
      target.parry || 0
    );

    // 2. Calculer taux critique
    // Formule : 1.15 × (Net Crit / (Net Crit + 938))
    // où Net Crit = max(0, Character Crit - Target Crit Resistance)
    const critRate = calculateCriticalRate(
      character.critRate || 0,
      target.critResistance || 0
    );

    // 3. Récupérer taux d'affinité (stat directe)
    // Pas de formule complexe, juste application du cap 60%
    const affinityRate = Math.min(
      character.affinityRate || 0,
      STAT_LIMITS.MAX_AFFINITY_RATE
    );

    // 4. Normaliser si crit + affinity > 100%
    const total = critRate + affinityRate;
    let normalizedCritRate: number;
    let normalizedAffinityRate: number;

    if (total <= 1.0) {
      // Pas besoin de normaliser
      normalizedCritRate = critRate;
      normalizedAffinityRate = affinityRate;
    } else {
      // Normaliser proportionnellement pour ramener le total à 100%
      normalizedCritRate = (critRate / total) * 1.0;
      normalizedAffinityRate = (affinityRate / total) * 1.0;
    }

    // Retourner tous les taux (bruts et normalisés)
    return {
      precisionRate,
      critRate,
      affinityRate,
      normalizedCritRate,
      normalizedAffinityRate,
    };
  }

  /**
   * Calcule uniquement le taux de précision.
   * 
   * Méthode helper pour obtenir la chance de toucher sans calculer
   * les autres taux. Utile pour l'UI ou les calculs partiels.
   * 
   * @param character - Statistiques finales du personnage
   * @param target - Cible avec esquive (parry)
   * @returns Taux de précision (0-0.95)
   * 
   * @example
   * ```typescript
   * const calculator = new CombatRatesCalculator();
   * const hitChance = calculator.calculatePrecision(character, target);
   * console.log(`Chance de toucher : ${(hitChance * 100).toFixed(1)}%`);
   * ```
   */
  public calculatePrecision(
    character: Readonly<CharacterBaseStats>,
    target: Readonly<Target>
  ): number {
    return calculatePrecisionRate(
      character.precision || 0,
      target.parry || 0
    );
  }

  /**
   * Calcule uniquement le taux critique.
   * 
   * Méthode helper pour obtenir la chance de critique sans calculer
   * les autres taux. Utile pour l'UI ou les comparaisons d'équipement.
   * 
   * @param character - Statistiques finales du personnage
   * @param target - Cible avec résistance critique (PVP)
   * @returns Taux critique (0-0.8)
   * 
   * @example
   * ```typescript
   * const calculator = new CombatRatesCalculator();
   * const critChance = calculator.calculateCritical(character, target);
   * console.log(`Chance de critique : ${(critChance * 100).toFixed(1)}%`);
   * ```
   */
  public calculateCritical(
    character: Readonly<CharacterBaseStats>,
    target: Readonly<Target>
  ): number {
    return calculateCriticalRate(
      character.critRate || 0,
      target.critResistance || 0
    );
  }

  /**
   * Calcule uniquement le taux d'affinité.
   * 
   * Méthode helper pour obtenir la chance d'affinité sans calculer
   * les autres taux. L'affinité est une stat directe avec cap à 60%.
   * 
   * @param character - Statistiques finales du personnage
   * @returns Taux d'affinité (0-0.6)
   * 
   * @example
   * ```typescript
   * const calculator = new CombatRatesCalculator();
   * const affinityChance = calculator.calculateAffinity(character);
   * console.log(`Chance d'affinité : ${(affinityChance * 100).toFixed(1)}%`);
   * ```
   */
  public calculateAffinity(
    character: Readonly<CharacterBaseStats>
  ): number {
    return Math.min(
      character.affinityRate || 0,
      STAT_LIMITS.MAX_AFFINITY_RATE
    );
  }

  /**
   * Vérifie si la normalisation crit+affinity est nécessaire.
   * 
   * Quand critRate + affinityRate > 100%, une normalisation proportionnelle
   * doit être appliquée pour ramener le total à 100%. Cette méthode détecte
   * ce cas.
   * 
   * @param rates - Taux de combat calculés
   * @returns true si normalisation nécessaire (total > 100%)
   * 
   * @example
   * ```typescript
   * const calculator = new CombatRatesCalculator();
   * const rates = calculator.calculateCombatRates(character, target);
   * 
   * if (calculator.needsNormalization(rates)) {
   *   console.log('Normalisation requise : crit + affinity > 100%');
   *   // Appeler un autre calculateur pour normaliser
   * }
   * ```
   */
  public needsNormalization(rates: Readonly<CombatRates>): boolean {
    return (rates.critRate + rates.affinityRate) > 1.0;
  }
}
