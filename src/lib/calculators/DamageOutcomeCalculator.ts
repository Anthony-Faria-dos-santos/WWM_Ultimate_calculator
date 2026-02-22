/**
 * Calculateur de dégâts finaux.
 * Pipeline complet : pool → réduction défense/résistance → bonus → dégâts par outcome.
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
 * Suit la règle 同类相加，异类相乘 (même catégorie = additionner)
 * @returns Résultat complet du calcul de dégâts
 *
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
 * P(miss) × 0 +
 * P(normal) × 1.0 +
 * P(crit) × critMult +
 * P(aff) × affMult +
 * P(critAff) × (1 + bonus_crit + bonus_aff)
 * )
 * ```
 *
 * Probabilités (rolls indépendants) :
 * - P(miss) = 1 - precisionRate
 * - P(normal) = hit × (1 - crit) × (1 - aff)
 * - P(crit) = hit × crit × (1 - aff)
 * - P(aff) = hit × (1 - crit) × aff
 * - P(critAff) = hit × crit × aff
 *
 * @param attacker - Statistiques du personnage
 * @param skill - Compétence utilisée
 * @param target - Cible
 * @param bonuses - Liste de bonus de dégâts à appliquer (défaut: [])
 * Suit la règle 同类相加，异类相乘 (même catégorie = additionner)
 * @returns Résultat avec finalDamage = E[damage] et outcome = Normal
 *
 * Le champ `outcome` est mis à `CombatOutcome.Normal` par convention
 * (pas de roll réel en mode probabiliste).
 *
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
 * 2. Roll critique → isCrit = random < normalizedCritRate
 * 3. Roll affinité → isAff = random < normalizedAffinityRate
 * 4. Combinaison :
 * - isCrit && isAff → CriticalAffinity
 * - isCrit && !isAff → Critical
 * - !isCrit && isAff → Affinity
 * - !isCrit && !isAff → Normal
 *
 * @param combatRates - Taux de combat (précision, critique, affinité)
 * @returns Outcome de l'attaque
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
 * - Miss → 0
 * - Normal → 1.0
 * - Critical → 1.5 + attacker.critDamage
 * - Affinity → 1.35 + attacker.affinityDamage
 * - CriticalAffinity → 1 + (0.5 + critDamage) + (0.35 + affinityDamage)
 * Les bonus sont ADDITIFS (pas multiplicatifs)
 * - Abrasion → 0.5 (non implémenté actuellement)
 *
 * @param outcome - Outcome de l'attaque
 * @param attacker - Statistiques du personnage (pour bonus crit/aff)
 * @returns Multiplicateur de dégâts
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
