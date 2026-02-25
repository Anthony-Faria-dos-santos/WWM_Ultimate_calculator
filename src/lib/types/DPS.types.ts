/**
 * Types DPS — rotation, simulation, résultats.
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
 */
 SkillCast = 'skill_cast',

 /**
 * Dégâts infligés
 * Résultat d'une compétence ou d'un DoT
 *
 */
 DamageDealt = 'damage_dealt',

 /**
 * Application d'un buff/debuff
 *
 */
 BuffApplied = 'buff_applied',

 /**
 * Expiration d'un buff/debuff
 *
 */
 BuffExpired = 'buff_expired',

 /**
 * Tick de Damage over Time (DoT)
 * Dégâts périodiques (poison, brûlure, saignement)
 *
 */
 DotTick = 'dot_tick',

 /**
 * Tick de Heal over Time (HoT)
 * Soins périodiques
 *
 */
 HotTick = 'hot_tick',

 /**
 * Cooldown disponible
 * Skill redevient utilisable
 *
 */
 CooldownReady = 'cooldown_ready',
}

/**
 * Événement dans la timeline de combat
 *
 * Représente un événement unique lors d'une simulation de rotation.
 * Permet de traquer précisément ce qui se passe à chaque instant.
 *
 */
export interface TimelineEvent {
 /**
 * Timestamp de l'événement (en secondes depuis le début)
 *
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
 * @default null
 */
 readonly skillId?: string;

 /**
 * Nom de la skill concernée (pour affichage)
 *
 */
 readonly skillName?: string;

 /**
 * Dégâts infligés (si applicable)
 * null pour les événements qui n'infligent pas de dégâts
 *
 * @default null
 */
 readonly damage?: number;

 /**
 * Résultat de l'attaque (si applicable)
 *
 * @default null
 */
 readonly outcome?: CombatOutcome;

 /**
 * ID du buff/debuff (si applicable)
 *
 * @default null
 */
 readonly buffId?: string;

 /**
 * Nom du buff/debuff (pour affichage)
 *
 */
 readonly buffName?: string;

 /**
 * Description de l'événement (pour logs détaillés)
 *
 */
 readonly description: string;
}

/**
 * Statistiques d'usage d'une skill dans une rotation
 *
 * Contient les métriques d'utilisation d'une compétence spécifique
 * lors d'une simulation de rotation DPS.
 *
 */
export interface SkillUsage {
 /**
 * ID de la skill
 *
 */
 readonly skillId: string;

 /**
 * Nom de la skill
 *
 */
 readonly skillName: string;

 /**
 * Nombre de fois que la skill a été utilisée
 *
 */
 readonly usageCount: number;

 /**
 * Dégâts totaux infligés par cette skill
 *
 */
 readonly totalDamage: number;

 /**
 * Dégâts moyens par utilisation
 *
 * Formule : Average Damage = Total Damage / Usage Count
 *
 */
 readonly averageDamage: number;

 /**
 * Dégâts minimum observés (un seul hit)
 *
 */
 readonly minDamage: number;

 /**
 * Dégâts maximum observés (un seul hit)
 *
 */
 readonly maxDamage: number;

 /**
 * Nombre de coups critiques
 *
 */
 readonly criticalHits: number;

 /**
 * Nombre de coups normaux (pas de critique ni affinité)
 *
 */
 readonly normalHits: number;

 /**
 * Nombre d'attaques manquées
 *
 */
 readonly misses: number;

 /**
 * Part des dégâts totaux (0-1)
 *
 * Formule : Damage Share = Skill Total Damage / Rotation Total Damage
 *
 */
 readonly damageShare: number;
}

/**
 * Résultat d'une rotation DPS complète
 *
 * Contient tous les détails d'une simulation de rotation sur une durée donnée.
 * Inclut les dégâts totaux, le DPS, le breakdown par skill et la timeline complète.
 *
 */
export interface RotationResult {
 /**
 * Dégâts totaux infligés pendant toute la rotation
 *
 */
 readonly totalDamage: number;

 /**
 * DPS (Damage Per Second)
 *
 * Formule : DPS = Total Damage / Duration
 *
 */
 readonly dps: number;

 /**
 * Durée de la simulation (en secondes)
 *
 */
 readonly duration: number;

 /**
 * Dégâts moyens par hit réussi (excluding misses)
 *
 * Formule : Average Damage = Total Damage / Total Hits
 *
 */
 readonly averageDamagePerHit: number;

 /**
 * Nombre total de hits réussis
 *
 */
 readonly totalHits: number;

 /**
 * Nombre total d'attaques manquées
 *
 */
 readonly totalMisses: number;

 /**
 * Taux de critique observé (0-1)
 *
 * Formule : Critical Rate = Critical Hits / Total Hits
 *
 */
 readonly criticalRate: number;

 /**
 * Taux d'affinité observé (0-1)
 *
 * Formule : Affinity Rate = Affinity Hits / Total Hits
 *
 */
 readonly affinityRate: number;

 /**
 * Taux de précision observé (0-1)
 *
 * Formule : Hit Rate = Total Hits / (Total Hits + Total Misses)
 *
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
 */
export interface DamageDistribution {
 /**
 * Probabilité de Miss (attaque manquée) (0-1)
 *
 * Formule : P(Miss) = 1 - Precision Rate
 *
 */
 readonly missProbability: number;

 /**
 * Probabilité de hit normal (sans crit ni affinité) (0-1)
 *
 * Formule : P(Normal) = Precision Rate × (1 - Crit Rate) × (1 - Affinity Rate)
 *
 */
 readonly normalProbability: number;

 /**
 * Probabilité de critique seul (pas d'affinité) (0-1)
 *
 * Formule : P(Crit) = Precision Rate × Crit Rate × (1 - Affinity Rate)
 *
 */
 readonly critProbability: number;

 /**
 * Probabilité d'affinité seule (pas de critique) (0-1)
 *
 * Formule : P(Affinity) = Precision Rate × (1 - Crit Rate) × Affinity Rate
 *
 */
 readonly affinityProbability: number;

 /**
 * Probabilité de critique + affinité (les deux) (0-1)
 *
 * Formule : P(Crit+Aff) = Precision Rate × Crit Rate × Affinity Rate
 *
 */
 readonly critAffinityProbability: number;

 /**
 * Probabilité d'abrasion (gratignure) (0-1)
 *
 * Cas rare et situationnel.
 * Se produit quand précision échoue mais affinité trigger.
 *
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
 * = 0 + 702 + 702 + 280.8 + 280.8
 * = 1965.6
 *
 */
export interface ExpectedValueResult {
 /**
 * Expected Damage (espérance mathématique des dégâts)
 *
 * Formule : E[Damage] = Σ (P(outcome) × Damage(outcome))
 *
 * Représente les dégâts moyens sur un grand nombre d'attaques.
 *
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
 */
 readonly variance: number;

 /**
 * Écart-type des dégâts (racine carrée de la variance)
 *
 * Formule : σ = √(Variance)
 *
 * Représente la dispersion typique autour de la moyenne.
 *
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
 */
export interface GraduationResult {
 /**
 * Votre DPS actuel
 *
 */
 readonly yourDPS: number;

 /**
 * DPS de référence (build optimal pour votre classe/niveau)
 *
 */
 readonly referenceDPS: number;

 /**
 * Graduation Rate (pourcentage) (0-∞)
 *
 * Formule : Graduation Rate = (Your DPS / Reference DPS) × 100
 *
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
 */
 readonly rating: 'beginner' | 'progressing' | 'competitive' | 'optimized' | 'exceptional';

 /**
 * Recommandation pour améliorer le build
 *
 */
 readonly recommendation: string;

 /**
 * Gap de DPS à combler pour atteindre la référence
 *
 * Formule : DPS Gap = Reference DPS - Your DPS
 *
 */
 readonly dpsGap: number;

 /**
 * Pourcentage d'amélioration nécessaire (0-1)
 *
 * Formule : Improvement Needed = DPS Gap / Your DPS
 *
 */
 readonly improvementNeeded: number;
}

/**
 * Comparaison détaillée entre deux builds
 *
 * Utilisé par le ComparisonService pour comparer deux personnages
 * ou deux configurations d'équipement.
 *
 */
export interface BuildComparison {
 /**
 * Nom du premier build
 *
 */
 readonly build1Name: string;

 /**
 * Nom du second build
 *
 */
 readonly build2Name: string;

 /**
 * DPS du premier build
 *
 */
 readonly build1DPS: number;

 /**
 * DPS du second build
 *
 */
 readonly build2DPS: number;

 /**
 * Avantage de DPS (positif = build1 meilleur, négatif = build2 meilleur)
 *
 * Formule : DPS Advantage = Build1 DPS - Build2 DPS
 *
 */
 readonly dpsAdvantage: number;

 /**
 * Avantage en pourcentage (0-∞)
 *
 * Formule : Percentage Advantage = (DPS Advantage / Build2 DPS) × 100
 *
 */
 readonly percentageAdvantage: number;

 /**
 * Build gagnant
 *
 */
 readonly winner: 'build1' | 'build2' | 'tie';

 /**
 * Breakdown des différences de stats (optionnel)
 *
 * Map des différences de stats clés entre les deux builds.
 *
 */
 readonly breakdown?: Readonly<Record<string, number>>;
}
