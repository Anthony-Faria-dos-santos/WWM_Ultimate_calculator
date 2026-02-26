/**
 * Service d'orchestration de combat.
 * Pipeline complet : stats → taux → dégâts → EV → graduation.
 */

import type {
  CharacterBaseStats,
  Target,
  Skill,
  DamageCalculation,
  RotationResult,
  ExpectedValueResult,
  GraduationResult,
} from '@/lib/types';
import type { HealCalculation } from '@/lib/calculators';
import type { DamageBonus } from '@/lib/calculators';
import type { ResolvedTalentBonus, MartialArtWeapon } from '@/lib/types/MartialArts.types';
import type {
  EquipmentPiece,
  EquipmentSetDefinition,
  ResolvedSetBonus,
} from '@/lib/types/EquipmentSet.types';
import type { CombatContext } from '@/lib/types/CombatContext.types';
import type { ExtendedStats } from '@/lib/calculators/TalentBonusResolver';
import type { AppliedModifier } from '@/lib/calculators/PreCombatStatsModifier';
import type { RoutedBonuses } from '@/lib/calculators/BonusZoneRouter';
import {
  DamageOutcomeCalculator,
  RotationDPSCalculator,
  ExpectedValueCalculator,
  GraduationCalculator,
  HealCalculator,
  TalentBonusResolver,
  SetBonusResolver,
  PreCombatStatsModifier,
} from '@/lib/calculators';
import { BonusZoneRouter } from '@/lib/calculators/BonusZoneRouter';

// ─── Types pipeline complet ────────────────────────────────────────

/** Entrée complète pour le pipeline build → dégâts */
export interface FullBuildInput {
  readonly baseStats: ExtendedStats;
  readonly weapon: MartialArtWeapon;
  readonly equippedPieces: readonly EquipmentPiece[];
  readonly setDefinitions: ReadonlyMap<string, EquipmentSetDefinition>;
  readonly skill: Skill;
  readonly target: Target;
  readonly context: CombatContext;
  readonly additionalBonuses?: readonly DamageBonus[];
}

/** Résultat enrichi avec breakdown complet du pipeline */
export interface FullPipelineResult {
  readonly damage: DamageCalculation;
  readonly modifiedStats: ExtendedStats;
  readonly resolvedTalents: readonly ResolvedTalentBonus[];
  readonly resolvedSets: readonly ResolvedSetBonus[];
  readonly routedBonuses: RoutedBonuses;
  readonly appliedModifiers: readonly AppliedModifier[];
}

/**
 * Service façade orchestrant tous les calculateurs de combat.
 *
 * Fournit une API unifiée pour :
 * - Calcul de dégâts (déterministe et expected value)
 * - Simulation de rotation DPS
 * - Calcul de soins
 * - Graduation (comparaison DPS)
 *
 * Pattern: Chaque méthode publique délègue simplement au calculateur approprié.
 */
export class CombatService {
  private readonly damageCalc: DamageOutcomeCalculator;
  private readonly rotationCalc: RotationDPSCalculator;
  private readonly evCalc: ExpectedValueCalculator;
  private readonly graduationCalc: GraduationCalculator;
  private readonly healCalc: HealCalculator;
  private readonly talentResolver: TalentBonusResolver;
  private readonly setResolver: SetBonusResolver;
  private readonly preModifier: PreCombatStatsModifier;
  private readonly bonusRouter: BonusZoneRouter;

  constructor() {
    this.damageCalc = new DamageOutcomeCalculator();
    this.rotationCalc = new RotationDPSCalculator();
    this.evCalc = new ExpectedValueCalculator();
    this.graduationCalc = new GraduationCalculator();
    this.healCalc = new HealCalculator();
    this.talentResolver = new TalentBonusResolver();
    this.setResolver = new SetBonusResolver();
    this.preModifier = new PreCombatStatsModifier();
    this.bonusRouter = new BonusZoneRouter();
  }

 // Dégâts

 /**
 * Calcule les dégâts d'une compétence (mode déterministe, un seul coup).
 * Délègue à DamageOutcomeCalculator.calculateDamage().
 *
 * Utilise le système de résultats déterministes basé sur les taux de touche,
 * critique et affinité. Un seul résultat concret est retourné (Miss, Normal, 
 * Critical, Affinity, CriticalAffinity).
 *
 * @param attacker - Stats finales du personnage attaquant
 * @param skill - Compétence utilisée
 * @param target - Cible ennemie avec défenses
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @returns DamageCalculation complet avec outcome, breakdown et rates
 *
 */
 public calculateSkillDamage(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[] = []
 ): DamageCalculation {
 return this.damageCalc.calculateDamage(attacker, skill, target, bonuses);
 }

 /**
 * Calcule les dégâts moyens (Expected Value) d'une compétence.
 * Délègue à DamageOutcomeCalculator.calculateExpectedDamage().
 *
 * Contrairement au mode déterministe, ce mode calcule la moyenne pondérée
 * de tous les outcomes possibles (Miss, Normal, Crit, Affinity, CritAff)
 * en fonction de leurs probabilités. Pas de randomisation, résultat stable.
 *
 * @param attacker - Stats finales du personnage attaquant
 * @param skill - Compétence utilisée
 * @param target - Cible ennemie avec défenses
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @returns DamageCalculation en mode expected (outcome = 'Expected')
 *
 */
 public calculateExpectedSkillDamage(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[] = []
 ): DamageCalculation {
 return this.damageCalc.calculateExpectedDamage(attacker, skill, target, bonuses);
 }

 // Expected Value détaillé

 /**
 * Calcule l'Expected Value complet avec distribution et variance.
 * Délègue à ExpectedValueCalculator.calculateExpectedValue().
 *
 * Fournit une analyse probabiliste complète incluant :
 * - Valeur moyenne attendue
 * - Distribution de probabilité des outcomes
 * - Variance et écart-type
 * - Plages de dégâts (min, max, médiane, percentiles)
 *
 * Utile pour l'analyse détaillée et la comparaison de builds.
 *
 * @param attacker - Stats finales du personnage attaquant
 * @param skill - Compétence utilisée
 * @param target - Cible ennemie avec défenses
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @returns ExpectedValueResult complet (distribution, variance, etc.)
 *
 */
 public calculateExpectedValue(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[] = []
 ): ExpectedValueResult {
 return this.evCalc.calculateExpectedValue(attacker, skill, target, bonuses);
 }

 // Rotation DPS

 /**
 * Simule une rotation DPS complète (mode déterministe).
 * Délègue à RotationDPSCalculator.simulateRotation().
 *
 * Simule l'exécution répétée d'une liste de skills pendant une durée donnée,
 * en respectant les cooldowns. Chaque coup utilise le calcul déterministe
 * (un seul outcome). Produit une timeline complète et des statistiques par skill.
 *
 * La rotation suit un ordre round-robin : [skill1, skill2, skill3, skill1, ...]
 * en sautant les skills en cooldown.
 *
 * @param attacker - Stats du personnage attaquant
 * @param skills - Liste des skills de la rotation (ordre d'exécution)
 * @param target - Cible ennemie avec défenses
 * @param duration - Durée de simulation en secondes (défaut: 60)
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @returns RotationResult complet avec timeline et stats par skill
 *
 */
 public simulateRotation(
 attacker: Readonly<CharacterBaseStats>,
 skills: readonly Skill[],
 target: Readonly<Target>,
 duration: number = 60,
 bonuses: readonly DamageBonus[] = []
 ): RotationResult {
 return this.rotationCalc.simulateRotation(attacker, skills, target, duration, bonuses);
 }

 /**
 * Simule une rotation DPS en mode Expected Value (pas de random).
 * Délègue à RotationDPSCalculator.simulateExpectedRotation().
 *
 * Identique à simulateRotation(), mais chaque coup utilise le calcul
 * expected value (moyenne pondérée) au lieu du déterminisme.
 * Résultat stable et reproductible, idéal pour comparer des builds.
 *
 * @param attacker - Stats du personnage attaquant
 * @param skills - Liste des skills de la rotation (ordre d'exécution)
 * @param target - Cible ennemie avec défenses
 * @param duration - Durée de simulation en secondes (défaut: 60)
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @returns RotationResult (dégâts moyens stables, pas de variance entre runs)
 *
 */
 public simulateExpectedRotation(
 attacker: Readonly<CharacterBaseStats>,
 skills: readonly Skill[],
 target: Readonly<Target>,
 duration: number = 60,
 bonuses: readonly DamageBonus[] = []
 ): RotationResult {
 return this.rotationCalc.simulateExpectedRotation(attacker, skills, target, duration, bonuses);
 }

 // Soins

 /**
 * Calcule les soins d'une compétence (mode déterministe).
 * Délègue à HealCalculator.calculateHeal().
 *
 * Utilise les ratios de soin de la skill (healRatio) et applique le bonus
 * de soin du personnage. Supporte les critiques (pas de précision/affinité).
 *
 * Formule : baseHeal = attack * healRatio * (1 + healBonus)
 * Si crit : finalHeal = baseHeal * critMultiplier
 *
 * @param attacker - Stats du personnage soigneur (utilise attack et criticalMultiplier)
 * @param skill - Compétence de soin (doit avoir healRatio > 0)
 * @param healBonus - Bonus de soin (0-1, défaut: 0). Ex: 0.2 = +20% heal
 * @returns HealCalculation complet avec base, final, et isCrit
 *
 */
 public calculateHeal(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 healBonus: number = 0
 ): HealCalculation {
 return this.healCalc.calculateHeal(attacker, skill, healBonus);
 }

 /**
 * Calcule les soins moyens attendus (Expected Value).
 * Délègue à HealCalculator.calculateExpectedHeal().
 *
 * Calcule la moyenne pondérée entre soin normal et soin critique :
 * expectedHeal = baseHeal * (1 - critRate) + (baseHeal * critMult) * critRate
 *
 * Résultat stable et reproductible, idéal pour comparer des builds de heal.
 *
 * @param attacker - Stats du personnage soigneur
 * @param skill - Compétence de soin
 * @param healBonus - Bonus de soin (0-1, défaut: 0)
 * @returns HealCalculation en mode expected (isCrit = false, finalHeal = moyenne)
 *
 */
 public calculateExpectedHeal(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 healBonus: number = 0
 ): HealCalculation {
 return this.healCalc.calculateExpectedHeal(attacker, skill, healBonus);
 }

 // Graduation

 /**
 * Calcule le Graduation Rate (comparaison DPS vs référence).
 * Délègue à GraduationCalculator.calculateGraduation().
 *
 * Compare votre DPS mesuré à un DPS de référence optimal pour évaluer
 * la performance de votre build. Retourne un rating (E à SSS) et une
 * recommandation d'amélioration.
 *
 * Échelle :
 * - SSS: ≥95% (excellent)
 * - SS: 85-94% (très bon)
 * - S: 75-84% (bon)
 * - A: 65-74% (correct)
 * - B: 55-64% (moyen)
 * - C: 45-54% (faible)
 * - D: 35-44% (très faible)
 * - E: <35% (mauvais)
 *
 * @param yourDPS - Votre DPS calculé (depuis simulateRotation ou autre)
 * @param referenceDPS - DPS de référence optimal (build théorique ou meilleur build connu)
 * @returns GraduationResult avec rating, percentage, et recommendation
 *
 */
  public calculateGraduation(
    yourDPS: number,
    referenceDPS: number
  ): GraduationResult {
    return this.graduationCalc.calculateGraduation(yourDPS, referenceDPS);
  }

  // Pipeline complet (build → dégâts)

  /**
   * Pipeline complet : base stats + talents + sets → dégâts finaux.
   * Orchestre tous les resolvers et calculateurs dans le bon ordre :
   * 1. Résout talents et sets
   * 2. Route les bonus par zone
   * 3. Modifie les stats (PreCombatStatsModifier)
   * 4. Calcule les dégâts avec stats modifiées + bonus de zone
   *
   * @param input - Entrée complète du build (stats, arme, sets, skill, cible, contexte)
   * @returns Résultat enrichi avec breakdown complet du pipeline
   */
  public calculateWithFullBuild(input: Readonly<FullBuildInput>): FullPipelineResult {
    return this.executeFullPipeline(input, 'deterministic');
  }

  /**
   * Pipeline complet en mode Expected Value (moyenne pondérée des outcomes).
   * Identique à calculateWithFullBuild, mais utilise calculateExpectedDamage.
   *
   * @param input - Entrée complète du build
   * @returns Résultat enrichi (dégâts en mode expected)
   */
  public calculateExpectedWithFullBuild(input: Readonly<FullBuildInput>): FullPipelineResult {
    return this.executeFullPipeline(input, 'expected');
  }

  /**
   * Exécution interne du pipeline complet.
   * Factorise la logique commune entre mode déterministe et expected.
   */
  private executeFullPipeline(
    input: Readonly<FullBuildInput>,
    mode: 'deterministic' | 'expected'
  ): FullPipelineResult {
    // 1. Résolution des talents et sets
    const resolvedTalents = this.talentResolver.resolveWeaponTalents(
      input.weapon,
      input.baseStats,
      input.context
    );
    const resolvedSets = this.setResolver.resolveEquippedSets(
      input.equippedPieces,
      input.setDefinitions,
      input.context
    );

    // 2. Routage des bonus par zone
    const routedBonuses = this.bonusRouter.routeBonuses(resolvedTalents, resolvedSets);

    // 3. Modification pré-combat via PreCombatStatsModifier (BaseStats talents + sets stats)
    const { finalStats, appliedModifiers } = this.preModifier.applyModifications(
      input.baseStats,
      resolvedTalents,
      resolvedSets
    );

    // 4. Appliquer les statModifications du router (CritDamage, Precision, etc.)
    const mutableStats = { ...finalStats } as Record<string, number>;
    const extraModifiers: AppliedModifier[] = [];

    for (const mod of routedBonuses.statModifications) {
      // Éviter les doublons avec BaseStats déjà gérés par PreCombatStatsModifier
      if (this.isBaseStatFromTalent(mod, resolvedTalents)) {
        continue;
      }
      const before = mutableStats[mod.stat] ?? 0;
      const delta = mod.isPercentage ? before * mod.value : mod.value;
      mutableStats[mod.stat] = before + delta;
      extraModifiers.push({
        source: mod.source,
        stat: mod.stat,
        valueBefore: before,
        valueAfter: mutableStats[mod.stat],
        modifier: mod.value,
        isPercentage: mod.isPercentage,
      });
    }

    const modifiedStats = mutableStats as unknown as ExtendedStats;

    // 5. Fusionner les bonus de dégâts (routés + additionnels)
    const allDamageBonuses: readonly DamageBonus[] = input.additionalBonuses
      ? [...routedBonuses.damageBonuses, ...input.additionalBonuses]
      : routedBonuses.damageBonuses;

    // 6. Calcul des dégâts avec stats modifiées
    const damage = mode === 'expected'
      ? this.damageCalc.calculateExpectedDamage(modifiedStats, input.skill, input.target, allDamageBonuses)
      : this.damageCalc.calculateDamage(modifiedStats, input.skill, input.target, allDamageBonuses);

    return {
      damage,
      modifiedStats,
      resolvedTalents,
      resolvedSets,
      routedBonuses,
      appliedModifiers: [...appliedModifiers, ...extraModifiers],
    };
  }

  /**
   * Vérifie si une StatModification provient d'un talent BaseStats
   * déjà traité par PreCombatStatsModifier (évite les doublons).
   */
  private isBaseStatFromTalent(
    mod: Readonly<{ stat: string; source: string }>,
    talents: readonly ResolvedTalentBonus[]
  ): boolean {
    return talents.some(
      (t) =>
        t.damageZone === 'BaseStats' &&
        t.isActive &&
        t.targetStat === mod.stat &&
        t.source === mod.source
    );
  }
}
