/**
 * Normalize Combined Rates Utility
 * 
 * Pure utility function to normalize critical and affinity rates when their
 * combined total exceeds 100%. This ensures coherent probability distribution
 * in combat calculations.
 * 
 * @module calculators/normalizeCombinedRates
 * @version 1.0.0
 */

/**
 * Résultat de la normalisation des taux combinés.
 */
export interface NormalizedRates {
  /** Taux de critique normalisé (0-1) */
  readonly normalizedCritRate: number;
  /** Taux d'affinité normalisé (0-1) */
  readonly normalizedAffinityRate: number;
  /** true si une normalisation a été appliquée (total > 1.0) */
  readonly wasNormalized: boolean;
}

/**
 * Normalise les taux de critique et d'affinité quand leur somme dépasse 100%.
 *
 * En combat, critique et affinité sont des rolls indépendants.
 * Quand la somme des taux dépasse 100%, on normalise proportionnellement
 * pour garantir une distribution de probabilités cohérente.
 *
 * Logique :
 * - Si critRate + affinityRate <= 1.0 → pas de normalisation
 * - Sinon : chaque taux est réduit proportionnellement
 *   - normalizedCritRate = critRate / total
 *   - normalizedAffinityRate = affinityRate / total
 *
 * @param critRate     - Taux de critique brut (0-1, typiquement 0-0.8)
 * @param affinityRate - Taux d'affinité brut (0-1, typiquement 0-0.6)
 * @returns NormalizedRates
 *
 * @example
 * // Pas de normalisation (total = 75%)
 * normalizeCombinedRates(0.45, 0.30)
 * // → { normalizedCritRate: 0.45, normalizedAffinityRate: 0.30, wasNormalized: false }
 *
 * @example
 * // Normalisation nécessaire (70% + 50% = 120%)
 * normalizeCombinedRates(0.70, 0.50)
 * // → { normalizedCritRate: 0.5833, normalizedAffinityRate: 0.4167, wasNormalized: true }
 *
 * @example
 * // Cas extrême : crit capé + affinité capée (80% + 60% = 140%)
 * normalizeCombinedRates(0.80, 0.60)
 * // → { normalizedCritRate: 0.5714, normalizedAffinityRate: 0.4286, wasNormalized: true }
 *
 * @pure Fonction pure, pas de side effects.
 */
export function normalizeCombinedRates(
  critRate: number,
  affinityRate: number
): NormalizedRates {
  // Clamp à 0 pour gérer les valeurs négatives
  const safeCritRate = Math.max(0, critRate);
  const safeAffinityRate = Math.max(0, affinityRate);

  // Calculer le total
  const total = safeCritRate + safeAffinityRate;

  // Cas edge : les deux à 0 (pas de division par zéro)
  if (total === 0) {
    return {
      normalizedCritRate: 0,
      normalizedAffinityRate: 0,
      wasNormalized: false,
    };
  }

  // Cas normal : total <= 1.0, pas de normalisation nécessaire
  if (total <= 1.0) {
    return {
      normalizedCritRate: safeCritRate,
      normalizedAffinityRate: safeAffinityRate,
      wasNormalized: false,
    };
  }

  // Cas dépassement : normaliser proportionnellement
  // Ramener le total à 100% en gardant les proportions
  return {
    normalizedCritRate: safeCritRate / total,
    normalizedAffinityRate: safeAffinityRate / total,
    wasNormalized: true,
  };
}
