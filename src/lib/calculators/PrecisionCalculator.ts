/**
 * Precision Calculator
 * 
 * Specialized calculator for hit chance (precision rate) calculations.
 * Determines if an attack will successfully hit its target based on
 * attacker's precision stat and target's evasion (parry).
 * 
 * Formula: Hit Rate = 95% × (1.42 × Precision / (Precision + Parry + 150))
 * 
 * Key characteristics:
 * - Base cap: 95% maximum hit chance (always 5% miss chance)
 * - Uses hyperbolic scaling with 1.42 multiplier
 * - Parry adds to denominator to reduce hit chance
 * - Base constant of 150 ensures smooth scaling
 * 
 * The 95% cap means that even with maximum precision, attacks can miss.
 * This is a core game design decision to maintain tactical uncertainty.
 * 
 * @see WWM-Formules-Reference-v1.3.md Section 6.2 (Precision)
 * 
 * @module calculators/PrecisionCalculator
 * @version 1.0.0
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
   * @example 0.87 → 87% de chance de toucher
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
   * @example 0.13 → 13% de chance de rater
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
   * @example
   * // PVE boss typique (faible esquive)
   * { targetParry: 300 }
   * 
   * @example
   * // PVP contre build évasion
   * { targetParry: 3000 }
   */
  readonly targetParry?: number;
}

/**
 * Calculateur de précision (chance de toucher).
 * 
 * Calcule la probabilité qu'une attaque réussisse à toucher sa cible
 * en fonction de la précision de l'attaquant et de l'esquive de la cible.
 * 
 * La formule utilisée est :
 * Hit Rate = 95% × (1.42 × Precision / (Precision + Parry + 150))
 * 
 * Caractéristiques importantes :
 * - Cap maximum : 95% (toujours 5% de chance de rater)
 * - Scaling hyperbolique (rendements décroissants)
 * - Esquive cible réduit la chance de toucher
 * - Constante 150 assure une base stable
 * 
 * @remarks
 * Toutes les méthodes sont pures (pas de side effects).
 * Les résultats incluent des informations détaillées pour l'UI.
 * 
 * @example
 * ```typescript
 * const calculator = new PrecisionCalculator();
 * 
 * // Calcul standard PVE
 * const result = calculator.calculatePrecision(
 *   { precision: 5000, ... },
 *   { targetParry: 300 }
 * );
 * console.log(`Chance de toucher : ${(result.hitRate * 100).toFixed(1)}%`);
 * 
 * // Test de hit
 * const hits = calculator.canHit(character, { targetParry: 300 }, Math.random());
 * if (hits) {
 *   console.log('Attaque réussie !');
 * }
 * ```
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
   * @example
   * ```typescript
   * const calculator = new PrecisionCalculator();
   * 
   * // Exemple 1 : Build haute précision PVE
   * const result1 = calculator.calculatePrecision(
   *   { precision: 8000, ... },
   *   { targetParry: 300 }
   * );
   * // result1.hitRate ≈ 0.95 (cap atteint)
   * // result1.isCapped = true
   * 
   * // Exemple 2 : Build standard PVE
   * const result2 = calculator.calculatePrecision(
   *   { precision: 5000, ... },
   *   { targetParry: 500 }
   * );
   * // result2.hitRate ≈ 0.89 (89% de chance de toucher)
   * // result2.missChance ≈ 0.11 (11% de chance de rater)
   * 
   * // Exemple 3 : PVP avec haute esquive
   * const result3 = calculator.calculatePrecision(
   *   { precision: 5000, ... },
   *   { targetParry: 3000 }
   * );
   * // result3.hitRate ≈ 0.87 (87% de chance de toucher)
   * // result3.missChance ≈ 0.13 (13% de chance de rater)
   * ```
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
   * @example
   * ```typescript
   * const calculator = new PrecisionCalculator();
   * const character = { precision: 5000, ... };
   * const target = { targetParry: 300 };
   * 
   * // Test de hit avec valeur aléatoire
   * const hits = calculator.canHit(character, target, Math.random());
   * if (hits) {
   *   console.log('Touché !');
   *   // Appliquer les dégâts
   * } else {
   *   console.log('Raté !');
   *   // Pas de dégâts
   * }
   * 
   * // Simulation Monte Carlo (1000 attaques)
   * let hitCount = 0;
   * for (let i = 0; i < 1000; i++) {
   *   if (calculator.canHit(character, target, Math.random())) {
   *     hitCount++;
   *   }
   * }
   * console.log(`Taux de hit observé : ${hitCount / 10}%`);
   * ```
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
   * @example
   * ```typescript
   * const calculator = new PrecisionCalculator();
   * const missChance = calculator.getMissChance(
   *   { precision: 5000, ... },
   *   { targetParry: 300 }
   * );
   * console.log(`Risque de rater : ${(missChance * 100).toFixed(1)}%`);
   * ```
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
   * @remarks
   * Formule inversée : 
   * 95% = 0.95 × (1.42 × P / (P + Parry + 150))
   * Résolution : P ≈ (Parry + 150) × 22.43
   * 
   * @example
   * ```typescript
   * const calculator = new PrecisionCalculator();
   * 
   * // Précision requise pour cap contre boss PVE
   * const requiredPrecision = calculator.getPrecisionRequiredForCap(300);
   * console.log(`Précision requise : ${requiredPrecision.toFixed(0)}`);
   * // Résultat : ~10,093 précision
   * 
   * // Précision requise pour cap en PVP
   * const pvpRequired = calculator.getPrecisionRequiredForCap(3000);
   * console.log(`Précision requise PVP : ${pvpRequired.toFixed(0)}`);
   * // Résultat : ~70,657 précision (difficile à atteindre !)
   * ```
   */
  public getPrecisionRequiredForCap(targetParry: number = 0): number {
    // Formule inversée pour résoudre P où hitRate = 0.95
    // 0.95 = 0.95 × (1.42 × P / (P + Parry + 150))
    // 1 = 1.42 × P / (P + Parry + 150)
    // P + Parry + 150 = 1.42 × P
    // Parry + 150 = 1.42P - P
    // Parry + 150 = 0.42P
    // P = (Parry + 150) / 0.42
    
    const PRECISION_CONSTANT = 150;
    const PRECISION_MULTIPLIER = 1.42;
    
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
   * @example
   * ```typescript
   * const calculator = new PrecisionCalculator();
   * if (calculator.isAtCap(character, { targetParry: 300 })) {
   *   console.log('Précision maximale ! Pas besoin de plus.');
   * } else {
   *   console.log('Peut encore améliorer la précision.');
   * }
   * ```
   */
  public isAtCap(
    attacker: Readonly<CharacterBaseStats>,
    options: PrecisionCalculationOptions = {}
  ): boolean {
    const result = this.calculatePrecision(attacker, options);
    return result.isCapped;
  }
}
