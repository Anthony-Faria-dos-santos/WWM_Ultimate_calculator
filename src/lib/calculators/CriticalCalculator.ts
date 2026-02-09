/**
 * Critical Calculator
 * 
 * Specialized calculator for critical hit rate calculations.
 * Determines if an attack will be a critical hit based on
 * attacker's critical stat and target's critical resistance.
 * 
 * Formula: Crit Rate = 1.15 × (Net Crit / (Net Crit + 938))
 * where Net Crit = max(0, Character Crit - Target Crit Resistance)
 * 
 * Key characteristics:
 * - Cap: 80% maximum critical hit rate
 * - Uses hyperbolic scaling with 1.15 multiplier in rate formula
 * - Critical resistance (PVP) reduces critical rate
 * - Critical hits deal 150% damage (1.5x multiplier)
 * 
 * The 80% cap ensures that even with maximum crit stat, not all hits
 * will be critical, maintaining tactical variability.
 * 
 * @see WWM-Formules-Reference-v1.3.md Section 6.3 (Critical)
 * 
 * @module calculators/CriticalCalculator
 * @version 1.0.0
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
   * @example 0.65 → 65% de chance de critique
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
   * @example 1.5 → 150% de dégâts (sans bonus additionnel)
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
   * @example
   * // PVE boss standard (pas de résistance)
   * { targetCritResistance: 0 }
   * 
   * @example
   * // PVP contre build tanky
   * { targetCritResistance: 800 }
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
 * Caractéristiques importantes :
 * - Cap maximum : 80% de taux critique
 * - Scaling hyperbolique (rendements décroissants)
 * - Résistance critique réduit le taux (PVP principalement)
 * - Les critiques infligent 150% de dégâts (1.5x)
 * 
 * @remarks
 * Toutes les méthodes sont pures (pas de side effects).
 * Les résultats incluent des informations détaillées pour l'UI.
 * 
 * @example
 * ```typescript
 * const calculator = new CriticalCalculator();
 * 
 * // Calcul standard PVE
 * const result = calculator.calculateCritical(
 *   { critRate: 3500, ... },
 *   { targetCritResistance: 0 }
 * );
 * console.log(`Taux critique : ${(result.criticalRate * 100).toFixed(1)}%`);
 * 
 * // Test de critique
 * const isCrit = calculator.isCritical(character, {}, Math.random());
 * if (isCrit) {
 *   damage *= 1.5; // Appliquer le multiplicateur critique
 * }
 * ```
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
   * @example
   * ```typescript
   * const calculator = new CriticalCalculator();
   * 
   * // Exemple 1 : Build haute critique PVE
   * const result1 = calculator.calculateCritical(
   *   { critRate: 4000, ... },
   *   { targetCritResistance: 0 }
   * );
   * // result1.criticalRate ≈ 0.80 (cap atteint)
   * // result1.isCapped = true
   * 
   * // Exemple 2 : Build standard PVE
   * const result2 = calculator.calculateCritical(
   *   { critRate: 2500, ... },
   *   { targetCritResistance: 0 }
   * );
   * // result2.criticalRate ≈ 0.74 (74% de chance de crit)
   * // result2.critMultiplier = 1.5 (150% de dégâts)
   * 
   * // Exemple 3 : PVP avec résistance critique
   * const result3 = calculator.calculateCritical(
   *   { critRate: 3500, ... },
   *   { targetCritResistance: 800 }
   * );
   * // Net Crit = 3500 - 800 = 2700
   * // result3.criticalRate ≈ 0.75 (75% de chance de crit)
   * ```
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
   * @example
   * ```typescript
   * const calculator = new CriticalCalculator();
   * const character = { critRate: 3500, ... };
   * 
   * // Test de critique avec valeur aléatoire
   * const isCrit = calculator.isCritical(character, {}, Math.random());
   * if (isCrit) {
   *   console.log('Coup critique !');
   *   damage *= 1.5;
   * } else {
   *   console.log('Coup normal.');
   * }
   * 
   * // Simulation Monte Carlo (1000 attaques)
   * let critCount = 0;
   * for (let i = 0; i < 1000; i++) {
   *   if (calculator.isCritical(character, {}, Math.random())) {
   *     critCount++;
   *   }
   * }
   * console.log(`Taux de crit observé : ${critCount / 10}%`);
   * ```
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
   * @remarks
   * Il s'agit du multiplicateur de BASE. Les bonus additionnels
   * de crit damage (critDamage stat) s'ajoutent à ce multiplicateur :
   * Final Multiplier = 1.5 + critDamageBonus
   * 
   * @example
   * ```typescript
   * const calculator = new CriticalCalculator();
   * const baseMultiplier = calculator.getCritMultiplier(); // 1.5
   * 
   * // Avec bonus de crit damage
   * const critDamageBonus = 0.5; // +50% crit damage
   * const finalMultiplier = baseMultiplier + critDamageBonus; // 2.0
   * const critDamage = baseDamage * finalMultiplier; // 200% de dégâts
   * ```
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
   * @remarks
   * Formule inversée :
   * 0.80 = 1.15 × (NetCrit / (NetCrit + 938))
   * Résolution : NetCrit ≈ 2144
   * Avec résistance : CritRequis = 2144 + targetCritResistance
   * 
   * @example
   * ```typescript
   * const calculator = new CriticalCalculator();
   * 
   * // Critique requise pour cap en PVE (pas de résistance)
   * const requiredPVE = calculator.getCriticalRequiredForCap(0);
   * console.log(`Critique requise PVE : ${requiredPVE}`);
   * // Résultat : ~2144 critique
   * 
   * // Critique requise pour cap en PVP (avec résistance)
   * const requiredPVP = calculator.getCriticalRequiredForCap(800);
   * console.log(`Critique requise PVP : ${requiredPVP}`);
   * // Résultat : ~2944 critique (2144 + 800)
   * ```
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
   * @example
   * ```typescript
   * const calculator = new CriticalCalculator();
   * if (calculator.isAtCap(character, { targetCritResistance: 0 })) {
   *   console.log('Critique au maximum ! Investir dans d\'autres stats.');
   * } else {
   *   console.log('Peut encore améliorer le taux de critique.');
   * }
   * ```
   */
  public isAtCap(
    attacker: Readonly<CharacterBaseStats>,
    options: CriticalCalculationOptions = {}
  ): boolean {
    const result = this.calculateCritical(attacker, options);
    return result.isCapped;
  }
}
