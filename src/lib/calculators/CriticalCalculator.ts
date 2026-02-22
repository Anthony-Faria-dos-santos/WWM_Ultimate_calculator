/**
 * Calculateur de critique (暴击).
 * Formule hyperbolique : critical / (critical + K) avec K=530.
 * Cap à 80%, multiplicateur critique ×1.5.
 */

import type { CharacterBaseStats } from '@/lib/types';
import { calculateCriticalRate, STAT_LIMITS, DAMAGE_MULTIPLIERS } from '@/lib/constants';

/**
 * Résultat détaillé du calcul de critique.
 *
 * Contient le taux calculé et les informations contextuelles
 * pour le debug et l'affichage UI.
 */
export interface CriticalResult {
 /**
 * Taux de critique calculé (0-0.80).
 *
 * Valeur finale après application de la formule et du cap.
 * Représente la probabilité qu'une attaque inflige des dégâts critiques.
 *
 */
 readonly criticalRate: number;

 /**
 * Statistique critique brute utilisée.
 *
 * Valeur avant tout calcul, directement depuis les stats du personnage.
 */
 readonly criticalStat: number;

 /**
 * Résistance critique de la cible.
 *
 * Réduit le taux de critique. Principalement utilisé en PVP.
 * La plupart des boss PVE ont 0 résistance critique.
 */
 readonly targetCritResistance: number;

 /**
 * Multiplicateur de dégâts critique (1.5x).
 *
 * Les coups critiques infligent 150% des dégâts de base.
 * Ce multiplicateur peut être augmenté par les bonus de crit damage.
 *
 */
 readonly critMultiplier: number;

 /**
 * Indique si le cap de 80% est atteint.
 *
 * true si le taux de critique a atteint le cap maximum de 80%.
 */
 readonly isCapped: boolean;
}

/**
 * Options pour le calcul de critique.
 */
export interface CriticalCalculationOptions {
 /**
 * Résistance critique de la cible.
 *
 * Réduit le taux de critique de l'attaquant.
 * Net Crit = max(0, Character Crit - Target Crit Resistance)
 *
 * Principalement utilisé en PVP. En PVE, la plupart des boss
 * ont 0 résistance critique.
 *
 * @default 0
 *
 */
 readonly targetCritResistance?: number;
}

/**
 * Calculateur de taux critique.
 *
 * Calcule la probabilité qu'une attaque soit critique en fonction
 * de la statistique critique de l'attaquant et de la résistance
 * critique de la cible.
 *
 * La formule utilisée est :
 * Crit Rate = 1.15 × (Net Crit / (Net Crit + 938))
 * où Net Crit = max(0, Character Crit - Target Crit Resistance)
 *
 */
export class CriticalCalculator {
 /**
 * Cap de taux critique maximum (80%).
 */
 private readonly MAX_CRITICAL_RATE = STAT_LIMITS.MAX_CRITICAL_RATE;

 /**
 * Multiplicateur de dégâts critique (1.5x = 150% de dégâts).
 */
 private readonly CRITICAL_DAMAGE_MULTIPLIER = DAMAGE_MULTIPLIERS.CRITICAL;

 /**
 * Calcule le taux critique.
 *
 * Méthode principale qui calcule la probabilité qu'une attaque soit
 * critique en utilisant la formule validée du jeu.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (résistance critique de la cible)
 * @returns Résultat détaillé du calcul de critique
 *
 */
 public calculateCritical(
 attacker: Readonly<CharacterBaseStats>,
 options: CriticalCalculationOptions = {}
 ): CriticalResult {
 const targetCritResistance = options.targetCritResistance ?? 0;
 const criticalStat = attacker.critRate || 0;

 // Calculer le taux critique via la formule officielle
 const criticalRate = calculateCriticalRate(criticalStat, targetCritResistance);

 // Vérifier si le cap est atteint
 const isCapped = criticalRate >= this.MAX_CRITICAL_RATE;

 return {
 criticalRate,
 criticalStat,
 targetCritResistance,
 critMultiplier: this.CRITICAL_DAMAGE_MULTIPLIER,
 isCapped,
 };
 }

 /**
 * Détermine si une attaque est critique (test aléatoire).
 *
 * Méthode utilitaire qui effectue un test aléatoire pour déterminer
 * si une attaque est critique en fonction du taux calculé.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (résistance critique de la cible)
 * @param randomRoll - Valeur aléatoire entre 0 et 1 (Math.random())
 * @returns true si l'attaque est critique, false sinon
 *
 */
 public isCritical(
 attacker: Readonly<CharacterBaseStats>,
 options: CriticalCalculationOptions = {},
 randomRoll: number
 ): boolean {
 const result = this.calculateCritical(attacker, options);
 return randomRoll <= result.criticalRate;
 }

 /**
 * Retourne le multiplicateur de dégâts critique.
 *
 * Les coups critiques infligent 150% des dégâts de base (1.5x).
 * Ce multiplicateur peut être augmenté par les bonus de crit damage
 * provenant de l'équipement et des talents.
 *
 * @returns Multiplicateur de dégâts critique (1.5)
 *
 */
 public getCritMultiplier(): number {
 return this.CRITICAL_DAMAGE_MULTIPLIER;
 }

 /**
 * Calcule la statistique critique nécessaire pour atteindre le cap de 80%.
 *
 * Utile pour l'optimisation des builds : détermine combien de critique
 * est nécessaire pour maximiser le taux contre une cible donnée.
 *
 * @param targetCritResistance - Résistance critique de la cible (défaut: 0)
 * @returns Critique requise pour atteindre 80% de taux
 *
 */
 public getCriticalRequiredForCap(targetCritResistance: number = 0): number {
 // Formule inversée pour résoudre NetCrit où critRate = 0.80
 // 0.80 = 1.15 × (NetCrit / (NetCrit + 938))
 // 0.80 / 1.15 = NetCrit / (NetCrit + 938)
 // 0.6956 = NetCrit / (NetCrit + 938)
 // 0.6956 × (NetCrit + 938) = NetCrit
 // 0.6956 × NetCrit + 652.73 = NetCrit
 // 652.73 = NetCrit - 0.6956 × NetCrit
 // 652.73 = 0.3044 × NetCrit
 // NetCrit = 652.73 / 0.3044 ≈ 2144

 const CRIT_RATE_CONSTANT = 938;
 const CRIT_RATE_MULTIPLIER = 1.15;
 const targetRate = this.MAX_CRITICAL_RATE;

 // Résoudre : targetRate = multiplier × (netCrit / (netCrit + constant))
 // targetRate / multiplier = netCrit / (netCrit + constant)
 // Soit k = targetRate / multiplier
 // k × (netCrit + constant) = netCrit
 // k × netCrit + k × constant = netCrit
 // k × constant = netCrit - k × netCrit
 // k × constant = netCrit × (1 - k)
 // netCrit = (k × constant) / (1 - k)

 const k = targetRate / CRIT_RATE_MULTIPLIER;
 const netCritRequired = (k * CRIT_RATE_CONSTANT) / (1 - k);

 // Ajouter la résistance cible pour obtenir le critique total requis
 const totalCritRequired = netCritRequired + targetCritResistance;

 return Math.ceil(totalCritRequired);
 }

 /**
 * Vérifie si le personnage a atteint le cap de critique de 80%.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param options - Options de calcul (résistance critique de la cible)
 * @returns true si le cap de 80% est atteint
 *
 */
 public isAtCap(
 attacker: Readonly<CharacterBaseStats>,
 options: CriticalCalculationOptions = {}
 ): boolean {
 const result = this.calculateCritical(attacker, options);
 return result.isCapped;
 }
}
