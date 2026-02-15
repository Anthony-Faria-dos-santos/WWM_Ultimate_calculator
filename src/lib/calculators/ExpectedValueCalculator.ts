/**
 * Expected Value Calculator
 * 
 * Produit une analyse probabiliste complète des dégâts avec :
 * - Distribution de probabilités (DamageDistribution)
 * - Dégâts détaillés par outcome (damageByOutcome)
 * - Variance et écart-type
 * 
 * Ce calculateur enrichit le résultat de DamageOutcomeCalculator.calculateExpectedDamage()
 * avec des statistiques détaillées pour l'analyse et l'optimisation de builds.
 * 
 * Pipeline :
 * 1. Calculer les combat rates normalisés (précision, critique, affinité)
 * 2. Calculer la distribution de probabilités (P(Miss), P(Normal), P(Crit), etc.)
 * 3. Calculer les pools de dégâts et le baseDamage
 * 4. Calculer les bonus multipliers
 * 5. Calculer les dégâts effectifs pour chaque outcome
 * 6. Calculer l'Expected Value : E[Damage] = Σ (P_i × Damage_i)
 * 7. Calculer la variance : Var[X] = E[X²] - (E[X])²
 * 8. Calculer l'écart-type : σ = √Variance
 * 
 * @remarks
 * - Les probabilités utilisent les taux NORMALISÉS pour garantir une distribution cohérente
 * - La variance mesure la dispersion des dégâts autour de la moyenne
 * - Un écart-type élevé indique des dégâts très variables (build spike damage)
 * - Un écart-type faible indique des dégâts stables (build consistent)
 * 
 * @see WWM-Formules-Reference-v1_3.md Section 8 (Expected Value)
 * 
 * @module calculators/ExpectedValueCalculator
 * @version 1.0.0
 */

import type {
  CharacterBaseStats,
  Target,
  Skill,
  ExpectedValueResult,
  DamageDistribution,
} from '@/lib/types';
import { CombatOutcome } from '@/lib/types';
import { DamageOutcomeCalculator } from './DamageOutcomeCalculator';
import { CombatRatesCalculator } from './CombatRatesCalculator';
import { PhysicalPoolCalculator } from './PhysicalPoolCalculator';
import { ElementalPoolCalculator } from './ElementalPoolCalculator';
import type { DamageBonus } from './BonusMultiplierCalculator';
import { BonusMultiplierCalculator } from './BonusMultiplierCalculator';
import { DAMAGE_MULTIPLIERS, STAT_LIMITS } from '@/lib/constants';

/**
 * Calculateur d'Expected Value complet avec statistiques probabilistes.
 * 
 * Produit une analyse détaillée des dégâts attendus en calculant :
 * - Les probabilités de chaque outcome (Miss, Normal, Crit, Affinity, CritAff)
 * - Les dégâts effectifs pour chaque outcome
 * - L'Expected Value (espérance mathématique)
 * - La variance et l'écart-type (mesures de dispersion)
 * 
 * Utile pour :
 * - Comparer des builds (DPS moyen)
 * - Optimiser les stats (maximiser E[Damage])
 * - Analyser la variance (build spike vs consistent)
 * - Simuler des rotations théoriques stables
 * 
 * @remarks
 * Toutes les méthodes publiques sont pures.
 * Les résultats incluent toutes les informations pour le debug.
 * 
 * @example
 * ```typescript
 * const calculator = new ExpectedValueCalculator();
 * 
 * const ev = calculator.calculateExpectedValue(
 *   characterStats,
 *   skill,
 *   target
 * );
 * 
 * console.log(`Expected Damage: ${ev.expectedDamage}`);
 * console.log(`Standard Deviation: ${ev.standardDeviation}`);
 * console.log(`P(Crit): ${(ev.distribution.critProbability * 100).toFixed(1)}%`);
 * console.log(`Crit Damage: ${ev.damageByOutcome[CombatOutcome.Critical]}`);
 * 
 * // Analyse de la variance
 * const cv = ev.standardDeviation / ev.expectedDamage; // Coefficient de variation
 * if (cv > 0.5) {
 *   console.log('Build spike damage (haute variance)');
 * } else {
 *   console.log('Build consistent (faible variance)');
 * }
 * ```
 */
export class ExpectedValueCalculator {
  /**
   * Calculateur de dégâts complet (déterministe et expected)
   */
  private readonly damageCalc: DamageOutcomeCalculator;

  /**
   * Calculateur de taux de combat (précision, critique, affinité)
   */
  private readonly ratesCalc: CombatRatesCalculator;

  /**
   * Calculateur de pool physique
   */
  private readonly physicalCalc: PhysicalPoolCalculator;

  /**
   * Calculateur de pool élémentaire
   */
  private readonly elementalCalc: ElementalPoolCalculator;

  /**
   * Calculateur de multiplicateurs de bonus (同类相加，异类相乘)
   */
  private readonly bonusCalc: BonusMultiplierCalculator;

  /**
   * Initialise le calculateur avec toutes ses dépendances.
   * 
   * Les calculateurs spécialisés sont instanciés une seule fois
   * et réutilisés pour tous les calculs.
   */
  constructor() {
    this.damageCalc = new DamageOutcomeCalculator();
    this.ratesCalc = new CombatRatesCalculator();
    this.physicalCalc = new PhysicalPoolCalculator();
    this.elementalCalc = new ElementalPoolCalculator();
    this.bonusCalc = new BonusMultiplierCalculator();
  }

  /**
   * Calcule l'Expected Value complet avec distribution et statistiques.
   * 
   * Pipeline complet :
   * 1. Calculer les combat rates (précision, crit, affinité normalisés)
   * 2. Calculer la DamageDistribution :
   *    - P(Miss) = 1 - hitChance
   *    - P(Normal) = hitChance × (1 - normCrit) × (1 - normAff)
   *    - P(Crit) = hitChance × normCrit × (1 - normAff)
   *    - P(Aff) = hitChance × (1 - normCrit) × normAff
   *    - P(CritAff) = hitChance × normCrit × normAff
   *    - P(Abrasion) = 0 (non implémenté pour l'instant)
   *    - Vérifier: Σ P_i ≈ 1.0 (tolérance 0.001)
   * 3. Calculer pools → baseDamage
   * 4. Calculer bonusMultiplier
   * 5. Calculer damageByOutcome :
   *    - Miss: 0
   *    - Normal: baseDamage × 1.0 × bonusMult
   *    - Crit: baseDamage × critDamageMultiplier × bonusMult
   *    - Aff: baseDamage × affinityDamageMultiplier × bonusMult
   *    - CritAff: baseDamage × (1 + (critMult-1) + (affMult-1)) × bonusMult
   *    - Abrasion: baseDamage × ABRASION_MULT × bonusMult
   *    Appliquer Math.max(STAT_LIMITS.MIN_DAMAGE, ...) sur chaque
   * 6. E[Damage] = Σ (P_i × Damage_i)
   * 7. Variance = Σ (P_i × Damage_i²) - (E[Damage])²
   * 8. StandardDeviation = √Variance
   * 
   * @param attacker  - Stats du personnage
   * @param skill     - Compétence à évaluer
   * @param target    - Cible ennemie
   * @param bonuses   - Bonus de dégâts (défaut: [])
   * @returns ExpectedValueResult complet
   * 
   * @example
   * ```typescript
   * const calculator = new ExpectedValueCalculator();
   * const ev = calculator.calculateExpectedValue(stats, skill, target);
   * 
   * console.log(`Expected: ${ev.expectedDamage}`);
   * console.log(`Variance: ${ev.variance}`);
   * console.log(`P(Crit): ${ev.distribution.critProbability}`);
   * 
   * // Analyser la distribution
   * if (ev.distribution.missProbability > 0.2) {
   *   console.log('Attention: plus de 20% de miss, augmenter la précision');
   * }
   * 
   * // Analyser la consistance
   * const cv = ev.standardDeviation / ev.expectedDamage;
   * console.log(`Coefficient de variation: ${(cv * 100).toFixed(1)}%`);
   * ```
   */
  public calculateExpectedValue(
    attacker: Readonly<CharacterBaseStats>,
    skill: Readonly<Skill>,
    target: Readonly<Target>,
    bonuses: readonly DamageBonus[] = []
  ): ExpectedValueResult {
    // 1. Calculer les combat rates (avec normalisation)
    const combatRates = this.ratesCalc.calculateCombatRates(attacker, target);

    // 2. Calculer la distribution de probabilités
    const distribution = this.calculateDistribution(
      combatRates.precisionRate,
      combatRates.normalizedCritRate,
      combatRates.normalizedAffinityRate
    );

    // 3. Calculer les pools et baseDamage
    const physicalPool = this.physicalCalc.calculatePhysicalPool(attacker, target, skill);
    const elementalPool = this.elementalCalc.calculateElementalPool(attacker, target, skill);
    const baseDamage = physicalPool.afterDefense + elementalPool.afterResistance;

    // 4. Calculer le multiplicateur de bonus (同类相加，异类相乘)
    const bonusMultiplier = this.bonusCalc.calculateBonusMultiplier(bonuses);

    // 5. Calculer les multiplicateurs de crit et affinité
    const critDamageMultiplier = DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;
    const affinityDamageMultiplier = DAMAGE_MULTIPLIERS.AFFINITY + attacker.affinityDamage;

    // 6. Calculer les dégâts pour chaque outcome
    const damageByOutcome = this.calculateDamageByOutcome(
      baseDamage,
      bonusMultiplier,
      critDamageMultiplier,
      affinityDamageMultiplier
    );

    // 7. Calculer l'Expected Value : E[Damage] = Σ (P_i × Damage_i)
    const expectedDamage =
      distribution.missProbability * damageByOutcome[CombatOutcome.Miss] +
      distribution.normalProbability * damageByOutcome[CombatOutcome.Normal] +
      distribution.critProbability * damageByOutcome[CombatOutcome.Critical] +
      distribution.affinityProbability * damageByOutcome[CombatOutcome.Affinity] +
      distribution.critAffinityProbability * damageByOutcome[CombatOutcome.CriticalAffinity] +
      distribution.abrasionProbability * damageByOutcome[CombatOutcome.Abrasion];

    // 8. Calculer la variance : Var[X] = E[X²] - (E[X])²
    const expectedSquaredDamage =
      distribution.missProbability * Math.pow(damageByOutcome[CombatOutcome.Miss], 2) +
      distribution.normalProbability * Math.pow(damageByOutcome[CombatOutcome.Normal], 2) +
      distribution.critProbability * Math.pow(damageByOutcome[CombatOutcome.Critical], 2) +
      distribution.affinityProbability * Math.pow(damageByOutcome[CombatOutcome.Affinity], 2) +
      distribution.critAffinityProbability *
        Math.pow(damageByOutcome[CombatOutcome.CriticalAffinity], 2) +
      distribution.abrasionProbability * Math.pow(damageByOutcome[CombatOutcome.Abrasion], 2);

    const variance = expectedSquaredDamage - Math.pow(expectedDamage, 2);

    // 9. Calculer l'écart-type : σ = √Variance
    const standardDeviation = Math.sqrt(Math.max(0, variance)); // Éviter sqrt(negative) par sécurité

    return {
      expectedDamage,
      distribution,
      damageByOutcome,
      variance,
      standardDeviation,
    };
  }

  /**
   * Calcule la distribution de probabilités pour tous les outcomes.
   * 
   * Formules (rolls indépendants) :
   * - P(Miss)    = 1 - hitChance
   * - P(Normal)  = hit × (1 - crit) × (1 - aff)
   * - P(Crit)    = hit × crit × (1 - aff)
   * - P(Aff)     = hit × (1 - crit) × aff
   * - P(CritAff) = hit × crit × aff
   * - P(Abrasion) = 0 (non implémenté actuellement)
   * 
   * @param hitChance - Taux de précision (0-1)
   * @param normalizedCritRate - Taux de critique normalisé (0-1)
   * @param normalizedAffinityRate - Taux d'affinité normalisé (0-1)
   * @returns DamageDistribution avec toutes les probabilités
   * 
   * @remarks
   * La somme de toutes les probabilités doit égaler 1.0 (100%).
   * Si la somme diffère de plus de 0.001, un avertissement est loggué (en dev).
   * 
   * Les taux utilisés sont les taux NORMALISÉS pour garantir
   * que crit + aff ≤ 100% (pas de surpassement).
   * 
   * @private
   */
  private calculateDistribution(
    hitChance: number,
    normalizedCritRate: number,
    normalizedAffinityRate: number
  ): DamageDistribution {
    // Probabilités (rolls indépendants)
    const missProbability = 1 - hitChance;
    const normalProbability = hitChance * (1 - normalizedCritRate) * (1 - normalizedAffinityRate);
    const critProbability = hitChance * normalizedCritRate * (1 - normalizedAffinityRate);
    const affinityProbability = hitChance * (1 - normalizedCritRate) * normalizedAffinityRate;
    const critAffinityProbability = hitChance * normalizedCritRate * normalizedAffinityRate;
    const abrasionProbability = 0; // Non implémenté actuellement

    // Vérification : Σ P_i doit être ≈ 1.0
    const totalProbability =
      missProbability +
      normalProbability +
      critProbability +
      affinityProbability +
      critAffinityProbability +
      abrasionProbability;

    // Tolérance de 0.1% pour les erreurs d'arrondi
    const tolerance = 0.001;
    if (Math.abs(totalProbability - 1.0) > tolerance) {
      // En dev, loguer un warning (en production, silencieux)
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[ExpectedValueCalculator] Total probability is ${totalProbability.toFixed(4)} (expected 1.0)`
        );
      }
    }

    return {
      missProbability,
      normalProbability,
      critProbability,
      affinityProbability,
      critAffinityProbability,
      abrasionProbability,
    };
  }

  /**
   * Calcule les dégâts effectifs pour chaque outcome.
   * 
   * Formules :
   * - Miss            → 0
   * - Normal          → baseDamage × 1.0 × bonusMult
   * - Critical        → baseDamage × critMult × bonusMult
   * - Affinity        → baseDamage × affMult × bonusMult
   * - CriticalAffinity → baseDamage × (1 + (critMult-1) + (affMult-1)) × bonusMult
   *                      Les bonus sont ADDITIFS (pas multiplicatifs)
   * - Abrasion        → baseDamage × 0.5 × bonusMult
   * 
   * Tous les dégâts sont plafonnés au minimum de STAT_LIMITS.MIN_DAMAGE.
   * 
   * @param baseDamage - Dégâts de base (somme des pools après réductions)
   * @param bonusMultiplier - Multiplicateur de bonus (同类相加，异类相乘)
   * @param critDamageMultiplier - Multiplicateur critique (1.5 + bonus)
   * @param affinityDamageMultiplier - Multiplicateur affinité (1.35 + bonus)
   * @returns Record<CombatOutcome, number> avec les dégâts par outcome
   * 
   * @remarks
   * Le multiplicateur CriticalAffinity est calculé en additionnant les bonus :
   * ```
   * critBonus = (critMult - 1)      // Ex: 0.5 + bonus crit
   * affBonus  = (affMult - 1)       // Ex: 0.35 + bonus aff
   * combinedMult = 1 + critBonus + affBonus
   * ```
   * 
   * Les multiplicateurs utilisent les constantes de DAMAGE_MULTIPLIERS :
   * - NORMAL: 1.0
   * - CRITICAL: 1.5
   * - AFFINITY: 1.35
   * - ABRASION: 0.5
   * 
   * @private
   */
  private calculateDamageByOutcome(
    baseDamage: number,
    bonusMultiplier: number,
    critDamageMultiplier: number,
    affinityDamageMultiplier: number
  ): Record<CombatOutcome, number> {
    // Miss → 0 damage
    const missDamage = 0;

    // Normal → baseDamage × 1.0 × bonusMult
    const normalDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * DAMAGE_MULTIPLIERS.NORMAL * bonusMultiplier
    );

    // Critical → baseDamage × critMult × bonusMult
    const critDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * critDamageMultiplier * bonusMultiplier
    );

    // Affinity → baseDamage × affMult × bonusMult
    const affinityDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * affinityDamageMultiplier * bonusMultiplier
    );

    // CriticalAffinity → baseDamage × (1 + critBonus + affBonus) × bonusMult
    // Les bonus sont ADDITIFS
    const critBonus = critDamageMultiplier - 1; // Ex: 0.5 + bonus crit
    const affBonus = affinityDamageMultiplier - 1; // Ex: 0.35 + bonus aff
    const critAffMultiplier = 1 + critBonus + affBonus;

    const critAffinityDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * critAffMultiplier * bonusMultiplier
    );

    // Abrasion → baseDamage × 0.5 × bonusMult
    const abrasionDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * DAMAGE_MULTIPLIERS.ABRASION * bonusMultiplier
    );

    // Construire le record
    return {
      [CombatOutcome.Miss]: missDamage,
      [CombatOutcome.Normal]: normalDamage,
      [CombatOutcome.Critical]: critDamage,
      [CombatOutcome.Affinity]: affinityDamage,
      [CombatOutcome.CriticalAffinity]: critAffinityDamage,
      [CombatOutcome.Abrasion]: abrasionDamage,
    };
  }
}
