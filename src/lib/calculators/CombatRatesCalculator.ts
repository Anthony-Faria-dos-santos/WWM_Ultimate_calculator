/**
 * Calculateur de taux de combat.
 * Combine précision, critique et affinité pour produire les CombatRates finaux.
 */

import type { CharacterBaseStats, Target, CombatRates } from '@/lib/types';
import {
 calculatePrecisionRate,
 calculateCriticalRate,
 STAT_LIMITS,
} from '@/lib/constants';
import { normalizeCombinedRates } from './normalizeCombinedRates';

/**
 * Calculateur de taux de combat (Précision, Critique, Affinité).
 *
 * Centralise le calcul des trois taux de combat principaux utilisés
 * pour déterminer les issues de combat (touche, critique, affinité).
 *
 * Tous les taux sont retournés en décimal (0.0-1.0) pour faciliter
 * les calculs probabilistes et les simulations Monte Carlo.
 *
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
 const { normalizedCritRate, normalizedAffinityRate } = normalizeCombinedRates(
 critRate,
 affinityRate
 );

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
 */
 public needsNormalization(rates: Readonly<CombatRates>): boolean {
 return (rates.critRate + rates.affinityRate) > 1.0;
 }
}
