/**
 * Calculateur de précision (命中).
 * Formule hyperbolique : precision / (precision + K) avec K=530.
 * Cap à 95%, plancher à 5% (taux d'abrasion minimum).
 */

import type { CharacterBaseStats } from '@/lib/types';
import { calculatePrecisionRate, STAT_LIMITS } from '@/lib/constants';

/**
 * Résultat détaillé du calcul de précision.
 *
 * Contient à la fois le taux calculé et les informations
 * contextuelles pour le debug et l'affichage UI.
 */
export interface PrecisionResult {
 /**
 * Taux de précision calculé (0-0.95).
 *
 * Valeur finale après application de la formule et du cap.
 * Représente la probabilité qu'une attaque touche.
 *
 */
 readonly hitRate: number;

 /**
 * Statistique de précision brute utilisée.
 *
 * Valeur avant tout calcul, directement depuis les stats du personnage.
 */
 readonly precisionStat: number;

 /**
 * Esquive (parry) de la cible.
 *
 * Réduit la chance de toucher. Plus la parade est élevée,
 * plus il est difficile de toucher la cible.
 */
 readonly targetParry: number;

 /**
 * Chance de rater (1 - hitRate).
 *
 * Probabilité que l'attaque échoue complètement.
 *
 */
 readonly missChance: number;

 /**
 * Indique si le cap de 95% est atteint.
 *
 * true si la précision est suffisamment élevée pour atteindre
 * le cap maximum de 95% de chance de toucher.
 */
 readonly isCapped: boolean;
}

/**
 * Options pour le calcul de précision.
 */
export interface PrecisionCalculationOptions {
 /**
 * Esquive (parry) de la cible.
 *
 * Valeur qui réduit la chance de toucher.
 * Plus élevée en PVP qu'en PVE.
 *
 * @default 0
 *
 */
 readonly targetParry?: number;
}

/**
 * Calculateur de précision (chance de toucher).
 *
 * Calcule la probabilité qu'une attaque réussisse à toucher sa cible
 * en fonction de la précision de l'attaquant et de l'esquive de la cible.
 *
 * La formule utilisée est (v1.3+) :
 * Hit Rate = 95% × (1.43 × Precision / (Precision + Parry + 150))
 *
 * HISTORICAL VERSIONS:
 * - v1.0 to v1.2: 1.42 multiplier
 * - v1.3+: 1.43 multiplier (current)
 *
 */
export class PrecisionCalculator {
 /**
 * Calcule le taux de précision (chance de toucher).
 *
 * Méthode principale qui calcule la probabilité qu'une attaque touche
 * sa cible en utilisant la formule validée du jeu.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (esquive de la cible)
 * @returns Résultat détaillé du calcul de précision
 *
 */
 public calculatePrecision(
 attacker: Readonly<CharacterBaseStats>,
 options: PrecisionCalculationOptions = {}
 ): PrecisionResult {
 const targetParry = options.targetParry ?? 0;
 const precisionStat = attacker.precision || 0;

 // Calculer le taux de précision via la formule officielle
 const hitRate = calculatePrecisionRate(precisionStat, targetParry);

 // Chance de rater
 const missChance = 1 - hitRate;

 // Vérifier si le cap est atteint
 const isCapped = hitRate >= STAT_LIMITS.MAX_PRECISION_RATE;

 return {
 hitRate,
 precisionStat,
 targetParry,
 missChance,
 isCapped,
 };
 }

 /**
 * Détermine si une attaque touche sa cible (test aléatoire).
 *
 * Méthode utilitaire qui effectue un test aléatoire pour déterminer
 * si une attaque réussit à toucher en fonction du taux de précision.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (esquive de la cible)
 * @param randomRoll - Valeur aléatoire entre 0 et 1 (Math.random())
 * @returns true si l'attaque touche, false si elle rate
 *
 */
 public canHit(
 attacker: Readonly<CharacterBaseStats>,
 options: PrecisionCalculationOptions = {},
 randomRoll: number
 ): boolean {
 const result = this.calculatePrecision(attacker, options);
 return randomRoll <= result.hitRate;
 }

 /**
 * Calcule la chance de rater une attaque.
 *
 * Méthode helper qui retourne directement la probabilité de miss
 * sans calculer tous les détails.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (esquive de la cible)
 * @returns Chance de rater (0-1, ex: 0.15 = 15% de chance de rater)
 *
 */
 public getMissChance(
 attacker: Readonly<CharacterBaseStats>,
 options: PrecisionCalculationOptions = {}
 ): number {
 const result = this.calculatePrecision(attacker, options);
 return result.missChance;
 }

 /**
 * Calcule la précision nécessaire pour atteindre le cap de 95%.
 *
 * Utile pour l'optimisation des builds : détermine combien de précision
 * est nécessaire pour maximiser la chance de toucher contre une cible donnée.
 *
 * @param targetParry - Esquive de la cible
 * @returns Précision requise pour atteindre 95% de hit rate
 *
 * HISTORICAL VERSIONS:
 * - v1.0 to v1.2: P ≈ (Parry + 150) × 22.43 (using 1.42)
 * - v1.3+: P ≈ (Parry + 150) × 22.09 (using 1.43, current)
 *
 */
 public getPrecisionRequiredForCap(targetParry: number = 0): number {
 // Formule inversée pour résoudre P où hitRate = 0.95 (v1.3+ formula)
 // 0.95 = 0.95 × (1.43 × P / (P + Parry + 150))
 // 1 = 1.43 × P / (P + Parry + 150)
 // P + Parry + 150 = 1.43 × P
 // Parry + 150 = 1.43P - P
 // Parry + 150 = 0.43P
 // P = (Parry + 150) / 0.43
 
 const PRECISION_CONSTANT = 150;
 const PRECISION_MULTIPLIER = 1.43; // v1.3+
 
 const totalParry = targetParry + PRECISION_CONSTANT;
 const requiredPrecision = totalParry / (PRECISION_MULTIPLIER - 1);
 
 return Math.ceil(requiredPrecision);
 }

 /**
 * Vérifie si le personnage a atteint le cap de précision.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (esquive de la cible)
 * @returns true si le cap de 95% est atteint
 *
 */
 public isAtCap(
 attacker: Readonly<CharacterBaseStats>,
 options: PrecisionCalculationOptions = {}
 ): boolean {
 const result = this.calculatePrecision(attacker, options);
 return result.isCapped;
 }
}
