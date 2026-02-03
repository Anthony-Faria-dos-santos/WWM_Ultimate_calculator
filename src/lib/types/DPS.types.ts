/**
 * DPS Types for Where Winds Meet Calculator
 * 
 * Defines all DPS-related interfaces including rotation results,
 * expected value calculations, damage distributions, and graduation rates.
 * 
 * These types represent the complete DPS calculation pipeline:
 * 1. Rotation simulation with timeline tracking
 * 2. Expected Value (probabilistic average damage)
 * 3. Damage distribution across all possible outcomes
 * 4. Graduation Rate (comparison to reference builds)
 * 
 * @module DPS.types
 * @version 1.0.0
 */

import type { CombatOutcome } from './Combat.types';

// Note: Skill et DamageCalculation seront utilisés dans les calculateurs (Phase 1.3+)
// Imports gardés en commentaire pour référence future
// import type { Skill } from './Skill.types';
// import type { DamageCalculation } from './Combat.types';

/**
 * Type d'événement dans la timeline de combat
 * 
 * Permet de traquer différents types d'événements lors
 * d'une simulation de rotation.
 * 
 * @enum {string}
 */
export enum TimelineEventType {
  /**
   * Utilisation d'une compétence
   * L'événement principal dans une rotation
   * 
   * @example Skill cast: "Frappe rapide"
   */
  SkillCast = 'skill_cast',

  /**
   * Dégâts infligés
   * Résultat d'une compétence ou d'un DoT
   * 
   * @example Damage dealt: 3250 (Critical)
   */
  DamageDealt = 'damage_dealt',

  /**
   * Application d'un buff/debuff
   * 
   * @example Buff applied: "Boost d'attaque +30%"
   */
  BuffApplied = 'buff_applied',

  /**
   * Expiration d'un buff/debuff
   * 
   * @example Buff expired: "Boost d'attaque"
   */
  BuffExpired = 'buff_expired',

  /**
   * Tick de Damage over Time (DoT)
   * Dégâts périodiques (poison, brûlure, saignement)
   * 
   * @example DoT tick: 450 (Poison)
   */
  DotTick = 'dot_tick',

  /**
   * Tick de Heal over Time (HoT)
   * Soins périodiques
   * 
   * @example HoT tick: 850 (Régénération)
   */
  HotTick = 'hot_tick',

  /**
   * Cooldown disponible
   * Skill redevient utilisable
   * 
   * @example Cooldown ready: "Art mystique"
   */
  CooldownReady = 'cooldown_ready',
}

/**
 * Événement dans la timeline de combat
 * 
 * Représente un événement unique lors d'une simulation de rotation.
 * Permet de traquer précisément ce qui se passe à chaque instant.
 * 
 * @interface TimelineEvent
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const event: TimelineEvent = {
 *   time: 5.8,
 *   type: TimelineEventType.SkillCast,
 *   skillId: 'skill-swift-strike',
 *   skillName: 'Frappe rapide',
 *   damage: 3250,
 *   outcome: CombatOutcome.Critical,
 *   description: 'Cast Frappe rapide (Critical: 3250)',
 * };
 * ```
 */
export interface TimelineEvent {
  /**
   * Timestamp de l'événement (en secondes depuis le début)
   * 
   * @example 5.8 → Événement à 5.8 secondes
   */
  readonly time: number;

  /**
   * Type d'événement
   * Détermine la nature de l'événement dans la timeline
   */
  readonly type: TimelineEventType;

  /**
   * ID de la skill concernée (si applicable)
   * null pour les événements non liés à une skill
   * 
   * @example 'skill-swift-strike'
   * @default null
   */
  readonly skillId?: string;

  /**
   * Nom de la skill concernée (pour affichage)
   * 
   * @example 'Frappe rapide'
   */
  readonly skillName?: string;

  /**
   * Dégâts infligés (si applicable)
   * null pour les événements qui n'infligent pas de dégâts
   * 
   * @example 3250
   * @default null
   */
  readonly damage?: number;

  /**
   * Résultat de l'attaque (si applicable)
   * 
   * @example CombatOutcome.Critical
   * @default null
   */
  readonly outcome?: CombatOutcome;

  /**
   * ID du buff/debuff (si applicable)
   * 
   * @example 'buff-attack-boost'
   * @default null
   */
  readonly buffId?: string;

  /**
   * Nom du buff/debuff (pour affichage)
   * 
   * @example 'Boost d\'attaque +30%'
   */
  readonly buffName?: string;

  /**
   * Description de l'événement (pour logs détaillés)
   * 
   * @example 'Cast Frappe rapide (Critical: 3250)'
   */
  readonly description: string;
}

/**
 * Statistiques d'usage d'une skill dans une rotation
 * 
 * Contient les métriques d'utilisation d'une compétence spécifique
 * lors d'une simulation de rotation DPS.
 * 
 * @interface SkillUsage
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const usage: SkillUsage = {
 *   skillId: 'skill-swift-strike',
 *   skillName: 'Frappe rapide',
 *   usageCount: 12,
 *   totalDamage: 36000,
 *   averageDamage: 3000,
 *   minDamage: 2500,
 *   maxDamage: 4500,
 *   criticalHits: 5,
 *   normalHits: 6,
 *   misses: 1,
 *   damageShare: 0.45, // 45% des dégâts totaux
 * };
 * ```
 */
export interface SkillUsage {
  /**
   * ID de la skill
   * 
   * @example 'skill-swift-strike'
   */
  readonly skillId: string;

  /**
   * Nom de la skill
   * 
   * @example 'Frappe rapide'
   */
  readonly skillName: string;

  /**
   * Nombre de fois que la skill a été utilisée
   * 
   * @example 12 → Utilisée 12 fois pendant la rotation
   */
  readonly usageCount: number;

  /**
   * Dégâts totaux infligés par cette skill
   * 
   * @example 36000 → Total de 36000 dégâts
   */
  readonly totalDamage: number;

  /**
   * Dégâts moyens par utilisation
   * 
   * Formule : Average Damage = Total Damage / Usage Count
   * 
   * @example 3000 → Moyenne de 3000 dégâts par cast
   */
  readonly averageDamage: number;

  /**
   * Dégâts minimum observés (un seul hit)
   * 
   * @example 2500 → Le plus petit hit était de 2500
   */
  readonly minDamage: number;

  /**
   * Dégâts maximum observés (un seul hit)
   * 
   * @example 4500 → Le plus gros hit était de 4500
   */
  readonly maxDamage: number;

  /**
   * Nombre de coups critiques
   * 
   * @example 5 → 5 critiques sur 12 utilisations
   */
  readonly criticalHits: number;

  /**
   * Nombre de coups normaux (pas de critique ni affinité)
   * 
   * @example 6
   */
  readonly normalHits: number;

  /**
   * Nombre d'attaques manquées
   * 
   * @example 1
   */
  readonly misses: number;

  /**
   * Part des dégâts totaux (0-1)
   * 
   * Formule : Damage Share = Skill Total Damage / Rotation Total Damage
   * 
   * @example 0.45 → Cette skill représente 45% des dégâts totaux
   */
  readonly damageShare: number;
}

/**
 * Résultat d'une rotation DPS complète
 * 
 * Contient tous les détails d'une simulation de rotation sur une durée donnée.
 * Inclut les dégâts totaux, le DPS, le breakdown par skill et la timeline complète.
 * 
 * @interface RotationResult
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const result: RotationResult = {
 *   totalDamage: 120000,
 *   dps: 2000,              // 120000 / 60s
 *   duration: 60,
 *   averageDamagePerHit: 2857,
 *   totalHits: 42,
 *   totalMisses: 3,
 *   criticalRate: 0.429,    // 18/42 hits
 *   skillUsages: [usage1, usage2, usage3],
 *   timeline: [event1, event2, ...],
 * };
 * ```
 */
export interface RotationResult {
  /**
   * Dégâts totaux infligés pendant toute la rotation
   * 
   * @example 120000 → 120k dégâts totaux
   */
  readonly totalDamage: number;

  /**
   * DPS (Damage Per Second)
   * 
   * Formule : DPS = Total Damage / Duration
   * 
   * @example 2000 → 2000 DPS
   */
  readonly dps: number;

  /**
   * Durée de la simulation (en secondes)
   * 
   * @example 60 → Simulation de 60 secondes
   */
  readonly duration: number;

  /**
   * Dégâts moyens par hit réussi (excluding misses)
   * 
   * Formule : Average Damage = Total Damage / Total Hits
   * 
   * @example 2857 → Moyenne de 2857 dégâts par hit
   */
  readonly averageDamagePerHit: number;

  /**
   * Nombre total de hits réussis
   * 
   * @example 42
   */
  readonly totalHits: number;

  /**
   * Nombre total d'attaques manquées
   * 
   * @example 3
   */
  readonly totalMisses: number;

  /**
   * Taux de critique observé (0-1)
   * 
   * Formule : Critical Rate = Critical Hits / Total Hits
   * 
   * @example 0.429 → 42.9% de critiques
   */
  readonly criticalRate: number;

  /**
   * Taux d'affinité observé (0-1)
   * 
   * Formule : Affinity Rate = Affinity Hits / Total Hits
   * 
   * @example 0.238 → 23.8% d'affinité
   */
  readonly affinityRate: number;

  /**
   * Taux de précision observé (0-1)
   * 
   * Formule : Hit Rate = Total Hits / (Total Hits + Total Misses)
   * 
   * @example 0.933 → 93.3% de précision
   */
  readonly hitRate: number;

  /**
   * Breakdown des dégâts par skill
   * 
   * Liste de toutes les skills utilisées avec leurs statistiques
   */
  readonly skillUsages: readonly SkillUsage[];

  /**
   * Timeline complète de tous les événements
   * 
   * Liste chronologique de tous les skill casts, dégâts, buffs, etc.
   */
  readonly timeline: readonly TimelineEvent[];
}

/**
 * Distribution de probabilités des différents outcomes
 * 
 * Contient les probabilités de chaque résultat possible d'une attaque.
 * La somme de toutes les probabilités doit toujours égaler 1.0 (100%).
 * 
 * @interface DamageDistribution
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const distribution: DamageDistribution = {
 *   missProbability: 0.15,        // 15% Miss
 *   normalProbability: 0.357,     // 35.7% Normal
 *   critProbability: 0.255,       // 25.5% Critical
 *   affinityProbability: 0.153,   // 15.3% Affinity
 *   critAffinityProbability: 0.085, // 8.5% Crit+Aff
 *   abrasionProbability: 0.0,     // 0% Abrasion
 * };
 * // Total: 100% ✓
 * ```
 */
export interface DamageDistribution {
  /**
   * Probabilité de Miss (attaque manquée) (0-1)
   * 
   * Formule : P(Miss) = 1 - Precision Rate
   * 
   * @example 0.15 → 15% de chance de Miss
   */
  readonly missProbability: number;

  /**
   * Probabilité de hit normal (sans crit ni affinité) (0-1)
   * 
   * Formule : P(Normal) = Precision Rate × (1 - Crit Rate) × (1 - Affinity Rate)
   * 
   * @example 0.357 → 35.7% de chance de Normal hit
   */
  readonly normalProbability: number;

  /**
   * Probabilité de critique seul (pas d'affinité) (0-1)
   * 
   * Formule : P(Crit) = Precision Rate × Crit Rate × (1 - Affinity Rate)
   * 
   * @example 0.255 → 25.5% de chance de Critical
   */
  readonly critProbability: number;

  /**
   * Probabilité d'affinité seule (pas de critique) (0-1)
   * 
   * Formule : P(Affinity) = Precision Rate × (1 - Crit Rate) × Affinity Rate
   * 
   * @example 0.153 → 15.3% de chance d'Affinity
   */
  readonly affinityProbability: number;

  /**
   * Probabilité de critique + affinité (les deux) (0-1)
   * 
   * Formule : P(Crit+Aff) = Precision Rate × Crit Rate × Affinity Rate
   * 
   * @example 0.085 → 8.5% de chance de Crit+Affinity
   */
  readonly critAffinityProbability: number;

  /**
   * Probabilité d'abrasion (gratignure) (0-1)
   * 
   * Cas rare et situationnel.
   * Se produit quand précision échoue mais affinité trigger.
   * 
   * @example 0.0 → 0% (cas rare)
   */
  readonly abrasionProbability: number;
}

/**
 * Résultat du calcul Expected Value
 * 
 * L'Expected Value (espérance mathématique) calcule les dégâts moyens
 * attendus sur un grand nombre d'attaques en pondérant tous les outcomes
 * possibles par leur probabilité.
 * 
 * Formule générale :
 * E[Damage] = Σ (P(outcome_i) × Damage(outcome_i))
 * 
 * Exemple de calcul :
 * - P(Miss) = 20% → Damage = 0
 * - P(Normal) = 36% → Damage = 1950
 * - P(Crit) = 24% → Damage = 2925
 * - P(Affinity) = 12% → Damage = 2340
 * - P(Crit+Aff) = 8% → Damage = 3510
 * 
 * E[Damage] = 0.20×0 + 0.36×1950 + 0.24×2925 + 0.12×2340 + 0.08×3510
 *           = 0 + 702 + 702 + 280.8 + 280.8
 *           = 1965.6
 * 
 * @interface ExpectedValueResult
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const ev: ExpectedValueResult = {
 *   expectedDamage: 1965.6,
 *   distribution: {
 *     missProbability: 0.20,
 *     normalProbability: 0.36,
 *     critProbability: 0.24,
 *     affinityProbability: 0.12,
 *     critAffinityProbability: 0.08,
 *     abrasionProbability: 0.0,
 *   },
 *   damageByOutcome: {
 *     [CombatOutcome.Miss]: 0,
 *     [CombatOutcome.Normal]: 1950,
 *     [CombatOutcome.Critical]: 2925,
 *     [CombatOutcome.Affinity]: 2340,
 *     [CombatOutcome.CriticalAffinity]: 3510,
 *   },
 *   variance: 1250000,
 *   standardDeviation: 1118.03,
 * };
 * ```
 */
export interface ExpectedValueResult {
  /**
   * Expected Damage (espérance mathématique des dégâts)
   * 
   * Formule : E[Damage] = Σ (P(outcome) × Damage(outcome))
   * 
   * Représente les dégâts moyens sur un grand nombre d'attaques.
   * 
   * @example 1965.6 → Moyenne attendue de 1966 dégâts
   */
  readonly expectedDamage: number;

  /**
   * Distribution des probabilités par outcome
   * 
   * Contient P(Miss), P(Normal), P(Crit), P(Affinity), etc.
   * La somme doit toujours égaler 1.0 (100%)
   */
  readonly distribution: DamageDistribution;

  /**
   * Dégâts effectifs pour chaque outcome
   * 
   * Map qui associe chaque outcome à ses dégâts calculés.
   * 
   * @example {
   *   miss: 0,
   *   normal: 1950,
   *   critical: 2925,
   *   affinity: 2340,
   *   critical_affinity: 3510,
   * }
   */
  readonly damageByOutcome: Readonly<Record<CombatOutcome, number>>;

  /**
   * Variance des dégâts (mesure de dispersion)
   * 
   * Formule : Var[X] = E[X²] - (E[X])²
   * 
   * Indique la variabilité des dégâts autour de la moyenne.
   * Plus la variance est élevée, plus les dégâts sont variables.
   * 
   * @example 1250000
   */
  readonly variance: number;

  /**
   * Écart-type des dégâts (racine carrée de la variance)
   * 
   * Formule : σ = √(Variance)
   * 
   * Représente la dispersion typique autour de la moyenne.
   * 
   * @example 1118.03 → ~68% des hits entre (1966-1118) et (1966+1118)
   */
  readonly standardDeviation: number;
}

/**
 * Résultat du calcul Graduation Rate
 * 
 * Le Graduation Rate compare votre DPS actuel à un build de référence optimal.
 * C'est un indicateur de progression et d'optimisation de votre build.
 * 
 * Formule : Graduation Rate = (Your DPS / Reference DPS) × 100%
 * 
 * Interprétation :
 * - < 70% : Build débutant, beaucoup d'améliorations possibles
 * - 70-80% : Build en progression, optimiser stats secondaires
 * - 80-90% : Build compétitif, focus sur gains marginaux
 * - 90-100% : Build optimisé, prêt pour endgame
 * - > 100% : Build exceptionnel ou nouvelle méta
 * 
 * @interface GraduationResult
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const graduation: GraduationResult = {
 *   yourDPS: 1850,
 *   referenceDPS: 2100,
 *   graduationRate: 88.1,
 *   rating: 'competitive',
 *   recommendation: 'Focus sur gains marginaux (crit rate ou pénétration)',
 * };
 * ```
 */
export interface GraduationResult {
  /**
   * Votre DPS actuel
   * 
   * @example 1850
   */
  readonly yourDPS: number;

  /**
   * DPS de référence (build optimal pour votre classe/niveau)
   * 
   * @example 2100
   */
  readonly referenceDPS: number;

  /**
   * Graduation Rate (pourcentage) (0-∞)
   * 
   * Formule : Graduation Rate = (Your DPS / Reference DPS) × 100
   * 
   * @example 88.1 → 88.1% du DPS optimal
   */
  readonly graduationRate: number;

  /**
   * Évaluation qualitative du build
   * 
   * - 'beginner' : < 70%
   * - 'progressing' : 70-80%
   * - 'competitive' : 80-90%
   * - 'optimized' : 90-100%
   * - 'exceptional' : > 100%
   * 
   * @example 'competitive'
   */
  readonly rating: 'beginner' | 'progressing' | 'competitive' | 'optimized' | 'exceptional';

  /**
   * Recommandation pour améliorer le build
   * 
   * @example 'Focus sur gains marginaux (optimiser crit rate ou pénétration)'
   */
  readonly recommendation: string;

  /**
   * Gap de DPS à combler pour atteindre la référence
   * 
   * Formule : DPS Gap = Reference DPS - Your DPS
   * 
   * @example 250 → Il manque 250 DPS pour atteindre la référence
   */
  readonly dpsGap: number;

  /**
   * Pourcentage d'amélioration nécessaire (0-1)
   * 
   * Formule : Improvement Needed = DPS Gap / Your DPS
   * 
   * @example 0.135 → +13.5% d'amélioration nécessaire
   */
  readonly improvementNeeded: number;
}

/**
 * Comparaison détaillée entre deux builds
 * 
 * Utilisé par le ComparisonService pour comparer deux personnages
 * ou deux configurations d'équipement.
 * 
 * @interface BuildComparison
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const comparison: BuildComparison = {
 *   build1Name: 'Build Critique',
 *   build2Name: 'Build Affinité',
 *   build1DPS: 2150,
 *   build2DPS: 2050,
 *   dpsAdvantage: 100,           // Build 1 a +100 DPS
 *   percentageAdvantage: 4.88,   // +4.88%
 *   winner: 'build1',
 *   breakdown: {
 *     critRateDiff: 0.15,         // Build 1 a +15% crit
 *     affinityRateDiff: -0.10,    // Build 1 a -10% affinité
 *   },
 * };
 * ```
 */
export interface BuildComparison {
  /**
   * Nom du premier build
   * 
   * @example 'Build Critique'
   */
  readonly build1Name: string;

  /**
   * Nom du second build
   * 
   * @example 'Build Affinité'
   */
  readonly build2Name: string;

  /**
   * DPS du premier build
   * 
   * @example 2150
   */
  readonly build1DPS: number;

  /**
   * DPS du second build
   * 
   * @example 2050
   */
  readonly build2DPS: number;

  /**
   * Avantage de DPS (positif = build1 meilleur, négatif = build2 meilleur)
   * 
   * Formule : DPS Advantage = Build1 DPS - Build2 DPS
   * 
   * @example 100 → Build 1 a +100 DPS
   */
  readonly dpsAdvantage: number;

  /**
   * Avantage en pourcentage (0-∞)
   * 
   * Formule : Percentage Advantage = (DPS Advantage / Build2 DPS) × 100
   * 
   * @example 4.88 → Build 1 est +4.88% meilleur
   */
  readonly percentageAdvantage: number;

  /**
   * Build gagnant
   * 
   * @example 'build1'
   */
  readonly winner: 'build1' | 'build2' | 'tie';

  /**
   * Breakdown des différences de stats (optionnel)
   * 
   * Map des différences de stats clés entre les deux builds.
   * 
   * @example {
   *   critRate: 0.15,    // Build 1 a +15% crit
   *   affinity: -0.10,   // Build 1 a -10% affinité
   *   attack: 150,       // Build 1 a +150 attack
   * }
   */
  readonly breakdown?: Readonly<Record<string, number>>;
}
