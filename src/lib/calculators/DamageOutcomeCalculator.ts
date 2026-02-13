/**
 * Damage Outcome Calculator
 * 
 * Orchestrateur final qui combine tous les calculateurs existants pour produire
 * un résultat de dégâts complet. Supporte deux modes de calcul :
 * - **Déterministe** : Simule des rolls aléatoires pour déterminer l'outcome
 * - **Expected Value** : Calcule les dégâts moyens pondérés par les probabilités
 * 
 * Pipeline de calcul :
 * 1. Calcul des pools (physique + élémentaire)
 * 2. Calcul des combat rates (précision, critique, affinité)
 * 3. Détermination de l'outcome via arbre de décision
 * 4. Application du multiplicateur correspondant
 * 5. Calcul des dégâts finaux
 * 
 * @remarks
 * Ce calculateur est le point d'entrée principal pour tout calcul de dégâts.
 * Il réutilise tous les calculateurs spécialisés existants.
 * 
 * @see WWM-Formules-Reference-v1_3.md Section 8 (Calcul des Dégâts Finaux)
 * 
 * @module calculators/DamageOutcomeCalculator
 * @version 1.0.0
 */

import type {
  CharacterBaseStats,
  Target,
  Skill,
  CombatRates,
  DamageCalculation,
} from '@/lib/types';

import { CombatOutcome } from '@/lib/types';

import {
  PhysicalPoolCalculator,
  ElementalPoolCalculator,
  CombatRatesCalculator,
  BonusMultiplierCalculator,
  type DamageBonus,
} from '@/lib/calculators';

import { DAMAGE_MULTIPLIERS, STAT_LIMITS } from '@/lib/constants';

/**
 * Calculateur de dégâts complet.
 * 
 * Orchestre tous les calculateurs spécialisés pour produire un résultat
 * de dégâts final avec toutes les informations intermédiaires.
 * 
 * Supporte deux modes de calcul :
 * - **Déterministe** : Simule des rolls aléatoires (pour simulation in-game)
 * - **Expected Value** : Calcule les dégâts moyens (pour optimisation de build)
 * 
 * @remarks
 * Toutes les méthodes publiques sont pures (sauf Math.random() en mode déterministe).
 * Les résultats incluent toutes les informations intermédiaires pour le debug.
 * 
 * @example
 * ```typescript
 * const calculator = new DamageOutcomeCalculator();
 * 
 * // Mode déterministe (simulation d'un coup)
 * const result = calculator.calculateDamage(attacker, skill, target);
 * console.log(`Dégâts : ${result.finalDamage}`);
 * console.log(`Outcome : ${result.outcome}`); // "critical", "normal", etc.
 * 
 * // Mode Expected Value (dégâts moyens)
 * const ev = calculator.calculateExpectedDamage(attacker, skill, target);
 * console.log(`Dégâts moyens : ${ev.finalDamage}`);
 * ```
 */
export class DamageOutcomeCalculator {
  /**
   * Calculateur de pool physique
   */
  private readonly physicalPoolCalc: PhysicalPoolCalculator;

  /**
   * Calculateur de pool élémentaire
   */
  private readonly elementalPoolCalc: ElementalPoolCalculator;

  /**
   * Calculateur de taux de combat (précision, critique, affinité)
   */
  private readonly combatRatesCalc: CombatRatesCalculator;

  /**
   * Calculateur de multiplicateur de bonus (同类相加，异类相乘)
   */
  private readonly bonusCalc: BonusMultiplierCalculator;

  /**
   * Initialise le calculateur avec toutes ses dépendances.
   * 
   * Les calculateurs spécialisés sont instanciés une seule fois
   * et réutilisés pour tous les calculs.
   */
  constructor() {
    this.physicalPoolCalc = new PhysicalPoolCalculator();
    this.elementalPoolCalc = new ElementalPoolCalculator();
    this.combatRatesCalc = new CombatRatesCalculator();
    this.bonusCalc = new BonusMultiplierCalculator();
  }

  /**
   * Calcule les dégâts complets en mode déterministe.
   * 
   * Pipeline complet :
   * 1. Calcul des pools (physique + élémentaire)
   * 2. Calcul du baseDamage (somme des pools après réductions)
   * 3. Calcul des combat rates (précision, critique, affinité)
   * 4. Détermination de l'outcome via rolls aléatoires
   * 5. Application du multiplicateur de l'outcome
   * 6. Calcul des bonus multiplicateurs (同类相加，异类相乘)
   * 7. Calcul des dégâts finaux
   * 
   * @param attacker - Statistiques finales du personnage attaquant
   * @param skill - Compétence utilisée (ratios physique/élémentaire)
   * @param target - Cible avec ses défenses et résistances
   * @param bonuses - Liste de bonus de dégâts à appliquer (défaut: [])
   *                  Suit la règle 同类相加，异类相乘 (même catégorie = additionner)
   * @returns Résultat complet du calcul de dégâts
   * 
   * @remarks
   * Mode déterministe : Utilise Math.random() pour simuler les rolls.
   * Chaque appel peut produire un résultat différent.
   * 
   * @example
   * ```typescript
   * const calculator = new DamageOutcomeCalculator();
   * 
   * const attacker = {
   *   attack: 3200,
   *   elementalAttack: 1600,
   *   critRate: 3500,
   *   critDamage: 0.5,
   *   affinityRate: 0.40,
   *   affinityDamage: 0,
   *   precision: 7000,
   *   armorPenetration: 900,
   *   elementalPenetration: 500,
   *   // ... autres stats
   * };
   * 
   * const skill = {
   *   physicalRatio: 1.2,
   *   elementalRatio: 0.8,
   *   // ... autres propriétés
   * };
   * 
   * const target = {
   *   defense: 1900,
   *   resistance: 350,
   *   shield: 0.20,
   *   parry: 400,
   *   critResistance: 0,
   *   // ... autres propriétés
   * };
   * 
   * const bonuses = [
   *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
   *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
   * ];
   * 
   * const result = calculator.calculateDamage(attacker, skill, target, bonuses);
   * 
   * console.log(`Outcome : ${result.outcome}`);
   * console.log(`Dégâts bruts : ${result.baseDamage}`);
   * console.log(`Dégâts finaux : ${result.finalDamage}`);
   * console.log(`Multiplicateur crit : ${result.critMultiplier}`);
   * console.log(`Multiplicateur affinité : ${result.affinityMultiplier}`);
   * console.log(`Multiplicateur bonus : ${result.bonusMultipliers}`);
   * ```
   */
  public calculateDamage(
    attacker: Readonly<CharacterBaseStats>,
    skill: Readonly<Skill>,
    target: Readonly<Target>,
    bonuses: readonly DamageBonus[] = []
  ): DamageCalculation {
    // 1. Calcul des pools
    const physicalPool = this.physicalPoolCalc.calculatePhysicalPool(
      attacker,
      target,
      skill
    );

    const elementalPool = this.elementalPoolCalc.calculateElementalPool(
      attacker,
      target,
      skill
    );

    // 2. Calcul du baseDamage (somme des pools après réductions)
    const baseDamage = physicalPool.afterDefense + elementalPool.afterResistance;

    // 3. Calcul des combat rates (avec normalisation si nécessaire)
    const combatRates = this.combatRatesCalc.calculateCombatRates(attacker, target);

    // 4. Détermination de l'outcome via arbre de décision (rolls aléatoires)
    const outcome = this.determineOutcome(combatRates);

    // 5. Calcul du multiplicateur de l'outcome
    const outcomeMultiplier = this.getOutcomeMultiplier(outcome, attacker);

    // 6. Calcul du multiplicateur de bonus (同类相加，异类相乘)
    const bonusMultipliers = this.bonusCalc.calculateBonusMultiplier(bonuses);

    // 7. Calcul des dégâts finaux
    const finalDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * outcomeMultiplier * bonusMultipliers
    );

    // 8. Extraction des multiplicateurs individuels pour le résultat
    const critMultiplier = this.getCritMultiplier(outcome, attacker);
    const affinityMultiplier = this.getAffinityMultiplier(outcome, attacker);

    return {
      physicalPool,
      elementalPool,
      combatRates,
      baseDamage,
      critMultiplier,
      affinityMultiplier,
      bonusMultipliers,
      finalDamage,
      outcome,
    };
  }

  /**
   * Calcule les dégâts en mode Expected Value (probabiliste).
   * 
   * Au lieu de tirer des rolls aléatoires, calcule le dégât moyen pondéré
   * par les probabilités de chaque outcome.
   * 
   * Formule :
   * ```
   * E[damage] = baseDamage × bonusMult × (
   *   P(miss)    × 0 +
   *   P(normal)  × 1.0 +
   *   P(crit)    × critMult +
   *   P(aff)     × affMult +
   *   P(critAff) × (1 + bonus_crit + bonus_aff)
   * )
   * ```
   * 
   * Probabilités (rolls indépendants) :
   * - P(miss)    = 1 - precisionRate
   * - P(normal)  = hit × (1 - crit) × (1 - aff)
   * - P(crit)    = hit × crit × (1 - aff)
   * - P(aff)     = hit × (1 - crit) × aff
   * - P(critAff) = hit × crit × aff
   * 
   * @param attacker - Statistiques du personnage
   * @param skill - Compétence utilisée
   * @param target - Cible
   * @param bonuses - Liste de bonus de dégâts à appliquer (défaut: [])
   *                  Suit la règle 同类相加，异类相乘 (même catégorie = additionner)
   * @returns Résultat avec finalDamage = E[damage] et outcome = Normal
   * 
   * @remarks
   * Le mode Expected Value est idéal pour :
   * - Comparaison de builds
   * - Optimisation de stats
   * - Calcul de DPS théorique
   * 
   * Le champ `outcome` est mis à `CombatOutcome.Normal` par convention
   * (pas de roll réel en mode probabiliste).
   * 
   * @example
   * ```typescript
   * const calculator = new DamageOutcomeCalculator();
   * 
   * const bonuses = [
   *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
   *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
   * ];
   * 
   * const ev = calculator.calculateExpectedDamage(attacker, skill, target, bonuses);
   * 
   * console.log(`Dégâts moyens attendus : ${ev.finalDamage}`);
   * console.log(`Taux de précision : ${(ev.combatRates.precisionRate * 100).toFixed(1)}%`);
   * console.log(`Taux de critique : ${(ev.combatRates.normalizedCritRate * 100).toFixed(1)}%`);
   * 
   * // Utiliser pour comparaison de builds
   * const evBuild1 = calculator.calculateExpectedDamage(build1, skill, target, bonuses);
   * const evBuild2 = calculator.calculateExpectedDamage(build2, skill, target, bonuses);
   * 
   * if (evBuild1.finalDamage > evBuild2.finalDamage) {
   *   console.log('Build 1 est meilleur en DPS moyen');
   * }
   * ```
   */
  public calculateExpectedDamage(
    attacker: Readonly<CharacterBaseStats>,
    skill: Readonly<Skill>,
    target: Readonly<Target>,
    bonuses: readonly DamageBonus[] = []
  ): DamageCalculation {
    // 1. Calcul des pools (identique au mode déterministe)
    const physicalPool = this.physicalPoolCalc.calculatePhysicalPool(
      attacker,
      target,
      skill
    );

    const elementalPool = this.elementalPoolCalc.calculateElementalPool(
      attacker,
      target,
      skill
    );

    // 2. Calcul du baseDamage
    const baseDamage = physicalPool.afterDefense + elementalPool.afterResistance;

    // 3. Calcul des combat rates (avec normalisation)
    const combatRates = this.combatRatesCalc.calculateCombatRates(attacker, target);

    // 4. Extraction des taux normalisés
    const hit = combatRates.precisionRate;
    const crit = combatRates.normalizedCritRate;
    const aff = combatRates.normalizedAffinityRate;

    // 5. Calcul des probabilités de chaque outcome
    const pMiss = 1 - hit;
    const pNormal = hit * (1 - crit) * (1 - aff);
    const pCrit = hit * crit * (1 - aff);
    const pAff = hit * (1 - crit) * aff;
    const pCritAff = hit * crit * aff;

    // 6. Calcul des multiplicateurs de dégâts
    const critDamageMult = DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;
    const affDamageMult = DAMAGE_MULTIPLIERS.AFFINITY + attacker.affinityDamage;
    const critAffMult = 1 + (critDamageMult - 1) + (affDamageMult - 1); // Additif

    // 7. Calcul de l'Expected Value
    const expectedMultiplier =
      pMiss * 0 +
      pNormal * DAMAGE_MULTIPLIERS.NORMAL +
      pCrit * critDamageMult +
      pAff * affDamageMult +
      pCritAff * critAffMult;

    // 8. Calcul du multiplicateur de bonus (同类相加，异类相乘)
    const bonusMultipliers = this.bonusCalc.calculateBonusMultiplier(bonuses);

    // 9. Dégâts finaux
    const finalDamage = Math.max(
      STAT_LIMITS.MIN_DAMAGE,
      baseDamage * expectedMultiplier * bonusMultipliers
    );

    // 10. Retour du résultat (outcome = Normal par convention en mode EV)
    return {
      physicalPool,
      elementalPool,
      combatRates,
      baseDamage,
      critMultiplier: critDamageMult,
      affinityMultiplier: affDamageMult,
      bonusMultipliers,
      finalDamage,
      outcome: CombatOutcome.Normal,
    };
  }

  /**
   * Détermine l'outcome d'une attaque via l'arbre de décision.
   * 
   * Arbre de décision (mode déterministe) :
   * 1. Roll précision → si échec → Miss
   * 2. Roll critique  → isCrit = random < normalizedCritRate
   * 3. Roll affinité  → isAff  = random < normalizedAffinityRate
   * 4. Combinaison :
   *    - isCrit && isAff  → CriticalAffinity
   *    - isCrit && !isAff → Critical
   *    - !isCrit && isAff → Affinity
   *    - !isCrit && !isAff → Normal
   * 
   * @param combatRates - Taux de combat (précision, critique, affinité)
   * @returns Outcome de l'attaque
   * 
   * @remarks
   * Les rolls de critique et affinité sont INDÉPENDANTS.
   * Ils peuvent se déclencher simultanément (CriticalAffinity).
   * 
   * Les taux utilisés sont les taux NORMALISÉS pour garantir
   * que la somme des probabilités est cohérente (≤ 100%).
   * 
   * @private
   */
  private determineOutcome(combatRates: CombatRates): CombatOutcome {
    // 1. Roll précision
    const precisionRoll = Math.random();
    if (precisionRoll >= combatRates.precisionRate) {
      return CombatOutcome.Miss;
    }

    // 2. Roll critique (taux normalisé)
    const critRoll = Math.random();
    const isCrit = critRoll < combatRates.normalizedCritRate;

    // 3. Roll affinité (taux normalisé)
    const affRoll = Math.random();
    const isAff = affRoll < combatRates.normalizedAffinityRate;

    // 4. Détermination de l'outcome
    if (isCrit && isAff) {
      return CombatOutcome.CriticalAffinity;
    } else if (isCrit) {
      return CombatOutcome.Critical;
    } else if (isAff) {
      return CombatOutcome.Affinity;
    } else {
      return CombatOutcome.Normal;
    }
  }

  /**
   * Retourne le multiplicateur de dégâts pour un outcome donné.
   * 
   * Mapping outcome → multiplicateur :
   * - Miss            → 0
   * - Normal          → 1.0
   * - Critical        → 1.5 + attacker.critDamage
   * - Affinity        → 1.35 + attacker.affinityDamage
   * - CriticalAffinity → 1 + (0.5 + critDamage) + (0.35 + affinityDamage)
   *                      Les bonus sont ADDITIFS (pas multiplicatifs)
   * - Abrasion        → 0.5 (non implémenté actuellement)
   * 
   * @param outcome - Outcome de l'attaque
   * @param attacker - Statistiques du personnage (pour bonus crit/aff)
   * @returns Multiplicateur de dégâts
   * 
   * @remarks
   * En mode CriticalAffinity, les bonus critiques et d'affinité s'additionnent :
   * ```
   * Base Critical Damage = +50% (0.5)
   * Base Affinity Damage = +35% (0.35)
   * Combined = 1 + 0.5 + 0.35 = 1.85 (185% de dégâts)
   * ```
   * 
   * Si le personnage a des bonus additionnels (critDamage, affinityDamage),
   * ils s'ajoutent également :
   * ```
   * critDamage = +0.3 (bonus gear/talents)
   * affinityDamage = +0.2 (bonus gear/talents)
   * Combined = 1 + (0.5 + 0.3) + (0.35 + 0.2) = 2.35 (235% de dégâts)
   * ```
   * 
   * @private
   */
  private getOutcomeMultiplier(
    outcome: CombatOutcome,
    attacker: Readonly<CharacterBaseStats>
  ): number {
    switch (outcome) {
      case CombatOutcome.Miss:
        return 0;

      case CombatOutcome.Normal:
        return DAMAGE_MULTIPLIERS.NORMAL;

      case CombatOutcome.Critical: {
        const critDamageMult = DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;
        return critDamageMult;
      }

      case CombatOutcome.Affinity: {
        const affDamageMult = DAMAGE_MULTIPLIERS.AFFINITY + attacker.affinityDamage;
        return affDamageMult;
      }

      case CombatOutcome.CriticalAffinity: {
        // Bonus additifs : 1 + (0.5 + critDamage) + (0.35 + affinityDamage)
        const critBonus = DAMAGE_MULTIPLIERS.CRITICAL - 1 + attacker.critDamage; // 0.5 + bonus
        const affBonus = DAMAGE_MULTIPLIERS.AFFINITY - 1 + attacker.affinityDamage; // 0.35 + bonus
        return 1 + critBonus + affBonus;
      }

      case CombatOutcome.Abrasion:
        return DAMAGE_MULTIPLIERS.ABRASION;

      default:
        // Fallback (ne devrait jamais arriver)
        return DAMAGE_MULTIPLIERS.NORMAL;
    }
  }

  /**
   * Retourne le multiplicateur critique effectif pour un outcome donné.
   * 
   * Utilisé pour remplir le champ `critMultiplier` de DamageCalculation.
   * 
   * @param outcome - Outcome de l'attaque
   * @param attacker - Statistiques du personnage
   * @returns Multiplicateur critique (1.0 si pas de crit, sinon 1.5+bonus)
   * 
   * @private
   */
  private getCritMultiplier(
    outcome: CombatOutcome,
    attacker: Readonly<CharacterBaseStats>
  ): number {
    if (outcome === CombatOutcome.Critical || outcome === CombatOutcome.CriticalAffinity) {
      return DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;
    }
    return 1.0;
  }

  /**
   * Retourne le multiplicateur d'affinité effectif pour un outcome donné.
   * 
   * Utilisé pour remplir le champ `affinityMultiplier` de DamageCalculation.
   * 
   * @param outcome - Outcome de l'attaque
   * @param attacker - Statistiques du personnage
   * @returns Multiplicateur affinité (1.0 si pas d'affinité, sinon 1.35+bonus)
   * 
   * @private
   */
  private getAffinityMultiplier(
    outcome: CombatOutcome,
    attacker: Readonly<CharacterBaseStats>
  ): number {
    if (outcome === CombatOutcome.Affinity || outcome === CombatOutcome.CriticalAffinity) {
      return DAMAGE_MULTIPLIERS.AFFINITY + attacker.affinityDamage;
    }
    return 1.0;
  }
}
