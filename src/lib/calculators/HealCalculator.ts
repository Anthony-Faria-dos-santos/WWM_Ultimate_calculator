/**
 * Heal Calculator
 * 
 * Calculateur de soins pour les compétences de soin (healing skills).
 * 
 * Les soins diffèrent des dégâts :
 * - Pas de cible (pas de défense/résistance)
 * - Pas de test de précision (100% touche)
 * - Pas d'affinité
 * - Peut critiquer (même formule critique que les dégâts)
 * - Utilise un bonus de soin (healBonus) au lieu des bonus de dégâts
 * 
 * Pipeline de calcul :
 * 1. baseHeal = attack × skill.physicalRatio
 * 2. Calcul du taux critique (sans résistance critique)
 * 3. Test de critique (mode déterministe) ou calcul de EV (mode probabiliste)
 * 4. finalHeal = baseHeal × critMultiplier × (1 + healBonus)
 * 
 * @remarks
 * Les soins utilisent uniquement le ratio physique de la compétence.
 * Le ratio élémentaire est ignoré pour les soins.
 * 
 * @see WWM-Formules-Reference-v1_3.md Section 9 (Calculs de Soin)
 * 
 * @module calculators/HealCalculator
 * @version 1.0.0
 */

import type { CharacterBaseStats, Skill } from '@/lib/types';
import { DAMAGE_MULTIPLIERS } from '@/lib/constants';
import { CriticalCalculator } from './CriticalCalculator';

/**
 * Résultat du calcul de soin.
 * 
 * Contient toutes les informations du calcul de soin,
 * y compris les valeurs intermédiaires pour le debug et l'UI.
 */
export interface HealCalculation {
  /** Soin de base = attack × skill.physicalRatio */
  readonly baseHeal: number;
  
  /** Multiplicateur critique appliqué (1.0 ou 1.5 + critDamage) */
  readonly critMultiplier: number;
  
  /** Bonus de soin appliqué (ex: 0.20 = +20%) */
  readonly healBonus: number;
  
  /** Soin final = baseHeal × critMultiplier × (1 + healBonus) */
  readonly finalHeal: number;
  
  /** true si le soin a critiqué (false en mode Expected Value) */
  readonly isCritical: boolean;
  
  /** Taux de critique utilisé (pour info) */
  readonly critRate: number;
}

/**
 * Calculateur de soins avec support des critiques.
 * 
 * Implémente le calcul de soin en mode déterministe (avec roll aléatoire)
 * et en mode Expected Value (probabiliste).
 * 
 * Les soins peuvent critiquer avec la même mécanique que les dégâts,
 * mais n'ont pas de test de précision ni d'affinité.
 * 
 * @remarks
 * Toutes les méthodes sont pures (sauf Math.random() en mode déterministe).
 * Les soins ne peuvent jamais être négatifs (minimum = 0).
 * 
 * @example
 * ```typescript
 * const calculator = new HealCalculator();
 * 
 * // Mode déterministe (simulation d'un soin)
 * const result = calculator.calculateHeal(
 *   { attack: 3200, critRate: 3500, critDamage: 0.5, ... },
 *   { physicalRatio: 1.0, ... },
 *   0.20 // +20% bonus de soin
 * );
 * console.log(`Soin : ${result.finalHeal}`);
 * console.log(`Critique : ${result.isCritical ? 'Oui' : 'Non'}`);
 * 
 * // Mode Expected Value (soin moyen)
 * const ev = calculator.calculateExpectedHeal(healer, skill, 0.20);
 * console.log(`Soin moyen : ${ev.finalHeal}`);
 * ```
 */
export class HealCalculator {
  /**
   * Calculateur de critique pour déterminer le taux de crit
   */
  private readonly criticalCalc: CriticalCalculator;

  /**
   * Initialise le calculateur avec ses dépendances.
   */
  constructor() {
    this.criticalCalc = new CriticalCalculator();
  }

  /**
   * Calcule un soin en mode déterministe (avec roll crit aléatoire).
   *
   * Pipeline :
   * 1. baseHeal = attacker.attack × skill.physicalRatio
   * 2. Calculer critRate via CriticalCalculator (sans résistance crit)
   * 3. Roll critique : isCrit = Math.random() < critRate
   * 4. critMultiplier = isCrit ? (1.5 + attacker.critDamage) : 1.0
   * 5. finalHeal = baseHeal × critMultiplier × (1 + healBonus)
   *
   * Note : On passe targetCritResistance = 0 au CriticalCalculator
   * car les soins ne sont pas affectés par la résistance critique.
   *
   * @param attacker - Stats du soigneur (CharacterBaseStats readonly)
   * @param skill - Compétence de soin (Skill readonly, seul physicalRatio utilisé)
   * @param healBonus - Bonus de soin en décimal (0.20 = +20%), défaut 0
   * @returns HealCalculation avec toutes les informations du calcul
   *
   * @example
   * ```typescript
   * const calculator = new HealCalculator();
   * 
   * // Exemple 1 : Soin simple sans bonus
   * const result1 = calculator.calculateHeal(
   *   { attack: 3200, critRate: 3500, critDamage: 0.5, ... },
   *   { physicalRatio: 1.0, ... },
   *   0
   * );
   * // baseHeal = 3200 × 1.0 = 3200
   * // Si crit : finalHeal = 3200 × 2.0 × 1.0 = 6400
   * // Si pas crit : finalHeal = 3200 × 1.0 × 1.0 = 3200
   * 
   * // Exemple 2 : Soin avec bonus +20%
   * const result2 = calculator.calculateHeal(
   *   { attack: 3200, critRate: 3500, critDamage: 0.5, ... },
   *   { physicalRatio: 1.0, ... },
   *   0.20 // +20% bonus de soin
   * );
   * // baseHeal = 3200 × 1.0 = 3200
   * // Si crit : finalHeal = 3200 × 2.0 × 1.20 = 7680
   * // Si pas crit : finalHeal = 3200 × 1.0 × 1.20 = 3840
   * 
   * // Exemple 3 : Soin avec ratio élevé
   * const result3 = calculator.calculateHeal(
   *   { attack: 2500, critRate: 2800, critDamage: 0.3, ... },
   *   { physicalRatio: 1.5, ... },
   *   0.15 // +15% bonus de soin
   * );
   * // baseHeal = 2500 × 1.5 = 3750
   * // Si crit : finalHeal = 3750 × 1.8 × 1.15 = 7762.5
   * // Si pas crit : finalHeal = 3750 × 1.0 × 1.15 = 4312.5
   * ```
   */
  public calculateHeal(
    attacker: Readonly<CharacterBaseStats>,
    skill: Readonly<Skill>,
    healBonus: number = 0
  ): HealCalculation {
    // 1. Calcul du soin de base (attack × physicalRatio)
    const baseHeal = attacker.attack * skill.physicalRatio;

    // 2. Calcul du taux critique (sans résistance critique)
    const critResult = this.criticalCalc.calculateCritical(attacker, {
      targetCritResistance: 0,
    });

    const critRate = critResult.criticalRate;

    // 3. Test de critique (roll aléatoire)
    const critRoll = Math.random();
    const isCritical = critRoll < critRate;

    // 4. Calcul du multiplicateur critique
    const critMultiplier = isCritical
      ? DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage
      : 1.0;

    // 5. Calcul du soin final
    const finalHeal = Math.max(0, baseHeal * critMultiplier * (1 + healBonus));

    return {
      baseHeal,
      critMultiplier,
      healBonus,
      finalHeal,
      isCritical,
      critRate,
    };
  }

  /**
   * Calcule le soin en mode Expected Value (probabiliste).
   *
   * Au lieu de tirer un roll aléatoire, calcule le soin moyen pondéré
   * par les probabilités de critique et de non-critique.
   *
   * Formule :
   * ```
   * E[heal] = baseHeal × (1 + healBonus) × (
   *   (1 - critRate) × 1.0 +
   *   critRate × critDamageMultiplier
   * )
   * ```
   *
   * Simplifié :
   * ```
   * E[heal] = baseHeal × (1 + healBonus) × (1 + critRate × (critMult - 1))
   * ```
   *
   * @param attacker - Stats du soigneur
   * @param skill - Compétence de soin
   * @param healBonus - Bonus de soin en décimal (0.20 = +20%), défaut 0
   * @returns HealCalculation avec finalHeal = E[heal] et isCritical = false
   *
   * @remarks
   * Le mode Expected Value est idéal pour :
   * - Comparaison de builds de soigneur
   * - Optimisation de stats de soin
   * - Calcul de HPS (Heal Per Second) théorique
   *
   * Le champ `isCritical` est mis à false par convention en mode EV
   * (pas de roll réel).
   *
   * @example
   * ```typescript
   * const calculator = new HealCalculator();
   * 
   * // Même setup que l'exemple déterministe
   * const ev = calculator.calculateExpectedHeal(
   *   { attack: 3200, critRate: 3500, critDamage: 0.5, ... },
   *   { physicalRatio: 1.0, ... },
   *   0.20 // +20% bonus de soin
   * );
   * 
   * console.log(`Soin moyen attendu : ${ev.finalHeal}`);
   * console.log(`Taux de critique : ${(ev.critRate * 100).toFixed(1)}%`);
   * 
   * // Utiliser pour comparaison de builds
   * const evBuild1 = calculator.calculateExpectedHeal(build1, skill, 0.20);
   * const evBuild2 = calculator.calculateExpectedHeal(build2, skill, 0.20);
   * 
   * if (evBuild1.finalHeal > evBuild2.finalHeal) {
   *   console.log('Build 1 soigne mieux en moyenne');
   * }
   * ```
   */
  public calculateExpectedHeal(
    attacker: Readonly<CharacterBaseStats>,
    skill: Readonly<Skill>,
    healBonus: number = 0
  ): HealCalculation {
    // 1. Calcul du soin de base (identique au mode déterministe)
    const baseHeal = attacker.attack * skill.physicalRatio;

    // 2. Calcul du taux critique (sans résistance critique)
    const critResult = this.criticalCalc.calculateCritical(attacker, {
      targetCritResistance: 0,
    });

    const critRate = critResult.criticalRate;

    // 3. Calcul du multiplicateur critique
    const critDamageMult = DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;

    // 4. Calcul de l'Expected Value
    // E[heal] = baseHeal × (1 + healBonus) × (1 + critRate × (critMult - 1))
    const expectedMultiplier = 1 + critRate * (critDamageMult - 1);

    // 5. Soin final
    const finalHeal = Math.max(0, baseHeal * (1 + healBonus) * expectedMultiplier);

    return {
      baseHeal,
      critMultiplier: critDamageMult,
      healBonus,
      finalHeal,
      isCritical: false, // Pas de roll réel en mode Expected Value
      critRate,
    };
  }
}
