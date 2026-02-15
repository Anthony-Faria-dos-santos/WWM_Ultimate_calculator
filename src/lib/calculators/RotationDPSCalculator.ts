/**
 * Rotation DPS Calculator
 * 
 * Simule une rotation DPS complète en exécutant des skills dans l'ordre
 * de priorité avec gestion des cooldowns et du Global Cooldown (GCD).
 * 
 * Le calculateur supporte deux modes :
 * - **Déterministe** : Simule des rolls aléatoires (DamageOutcomeCalculator.calculateDamage)
 * - **Expected Value** : Calcule les dégâts moyens (DamageOutcomeCalculator.calculateExpectedDamage)
 * 
 * Pipeline de simulation :
 * 1. Initialiser les cooldowns de chaque skill à 0 (disponibles)
 * 2. Boucle principale (currentTime = 0 → duration) :
 *    a. Trouver la prochaine skill disponible par priorité
 *    b. Si aucune skill dispo → attendre GCD (idle), avancer le temps
 *    c. Exécuter la skill via DamageOutcomeCalculator
 *    d. Créer les TimelineEvent (SkillCast, DamageDealt)
 *    e. Mettre à jour les SkillUsage stats
 *    f. Mettre le cooldown de la skill = currentTime + skill.cooldown
 *    g. Avancer le temps de skill.castTime + GCD (minimum GCD)
 * 3. Calculer les résultats finaux (totalDamage, dps, averageDamagePerHit, rates)
 * 
 * @remarks
 * - Les skills passives sont ignorées dans la rotation (pas de cast)
 * - Si toutes les skills sont en cooldown, avancer au prochain cooldown disponible
 * - Le GCD s'applique même sur les skills instantanées (castTime = 0)
 * 
 * @see WWM-Formules-Reference-v1_3.md Section 9 (Calcul DPS)
 * 
 * @module calculators/RotationDPSCalculator
 * @version 1.0.0
 */

import type {
  CharacterBaseStats,
  Target,
  Skill,
  SkillCategory,
  RotationResult,
  SkillUsage,
  TimelineEvent,
} from '@/lib/types';
import { TimelineEventType, CombatOutcome } from '@/lib/types';
import { DamageOutcomeCalculator } from './DamageOutcomeCalculator';
import type { DamageBonus } from './BonusMultiplierCalculator';

/** Global Cooldown en secondes */
const GCD = 1.0;

/**
 * Type de mode de calcul pour la rotation.
 * - deterministic : Simule des rolls aléatoires (variance réelle)
 * - expected : Calcule les dégâts moyens (pas d'aléatoire)
 */
type CalculationMode = 'deterministic' | 'expected';

/**
 * Structure de tracking des stats d'une skill pendant la simulation.
 * Permet de compiler les SkillUsage à la fin.
 */
interface SkillTracking {
  readonly skillId: string;
  readonly skillName: string;
  usageCount: number;
  totalDamage: number;
  minDamage: number;
  maxDamage: number;
  criticalHits: number;
  normalHits: number;
  affinityHits: number;
  misses: number;
}

/**
 * Calculateur de rotation DPS avec gestion des cooldowns et GCD.
 * 
 * Simule une rotation complète sur une durée donnée et retourne
 * un résultat détaillé avec timeline, breakdown par skill et métriques DPS.
 * 
 * Supporte deux modes de calcul :
 * - **Déterministe** : Variance réelle avec rolls aléatoires
 * - **Expected Value** : Dégâts moyens théoriques stables
 * 
 * @remarks
 * Les méthodes publiques sont pures (sauf Math.random() en mode déterministe).
 * Pas de state entre les appels.
 * 
 * @example
 * ```typescript
 * const calculator = new RotationDPSCalculator();
 * 
 * const skills = [ultimateSkill, activeSkill1, activeSkill2];
 * 
 * // Mode déterministe (variance réelle)
 * const result = calculator.simulateRotation(
 *   characterStats,
 *   skills,
 *   bossTarget,
 *   60 // 60 secondes
 * );
 * console.log(`DPS: ${result.dps}`);
 * console.log(`Total: ${result.totalDamage} in ${result.duration}s`);
 * 
 * // Mode Expected Value (dégâts moyens)
 * const evResult = calculator.simulateExpectedRotation(
 *   characterStats,
 *   skills,
 *   bossTarget,
 *   60
 * );
 * console.log(`DPS théorique: ${evResult.dps}`);
 * ```
 */
export class RotationDPSCalculator {
  /**
   * Calculateur de dégâts (déterministe et expected value)
   */
  private readonly damageCalc: DamageOutcomeCalculator;

  /**
   * Initialise le calculateur avec ses dépendances.
   * 
   * Le DamageOutcomeCalculator est instancié une seule fois
   * et réutilisé pour tous les calculs.
   */
  constructor() {
    this.damageCalc = new DamageOutcomeCalculator();
  }

  /**
   * Simule une rotation DPS complète sur une durée donnée.
   * 
   * Algorithme :
   * 1. Initialiser les cooldowns de chaque skill à 0 (disponibles)
   * 2. Boucle principale (currentTime = 0 → duration) :
   *    a. Trouver la prochaine skill disponible par priorité :
   *       - Ultimate > Active > Support > CrowdControl > Mobility
   *       - Parmi même priorité : celle avec le plus gros physicalRatio
   *    b. Si aucune skill dispo → attendre GCD (idle), avancer le temps de GCD
   *    c. Exécuter la skill via DamageOutcomeCalculator.calculateDamage()
   *    d. Créer un TimelineEvent de type SkillCast
   *    e. Créer un TimelineEvent de type DamageDealt (si pas Miss, damage > 0)
   *    f. Mettre à jour les SkillUsage stats
   *    g. Mettre le cooldown de la skill = currentTime + skill.cooldown
   *    h. Avancer le temps de skill.castTime + GCD (minimum GCD si castTime=0)
   * 3. Calculer les résultats :
   *    - totalDamage = somme de tous les dégâts
   *    - dps = totalDamage / duration (utiliser la duration réelle, pas théorique)
   *    - averageDamagePerHit = totalDamage / totalHits
   *    - criticalRate = totalCritHits / totalHits
   *    - affinityRate = totalAffHits / totalHits
   *    - hitRate = totalHits / (totalHits + totalMisses)
   *    - skillUsages avec damageShare calculé
   * 
   * @param attacker  - Stats du personnage (CharacterBaseStats readonly)
   * @param skills    - Liste des skills de la rotation (triées par priorité implicite via category)
   * @param target    - Cible ennemie
   * @param duration  - Durée de la simulation en secondes (défaut: 60)
   * @param bonuses   - Bonus de dégâts appliqués (défaut: [])
   * @returns RotationResult complet avec timeline
   * 
   * @example
   * ```typescript
   * const calculator = new RotationDPSCalculator();
   * const result = calculator.simulateRotation(
   *   characterStats,
   *   [ultimateSkill, activeSkill1, activeSkill2],
   *   bossTarget,
   *   60, // 60 secondes
   * );
   * console.log(`DPS: ${result.dps}`);
   * console.log(`Total: ${result.totalDamage} in ${result.duration}s`);
   * ```
   */
  public simulateRotation(
    attacker: Readonly<CharacterBaseStats>,
    skills: readonly Skill[],
    target: Readonly<Target>,
    duration: number = 60,
    bonuses: readonly DamageBonus[] = []
  ): RotationResult {
    return this.simulateInternal(
      attacker,
      skills,
      target,
      duration,
      bonuses,
      'deterministic'
    );
  }

  /**
   * Simule en mode Expected Value (pas de random, dégâts moyens).
   * 
   * Identique à simulateRotation mais utilise calculateExpectedDamage
   * au lieu de calculateDamage. Aucun aléatoire.
   * Utile pour obtenir un DPS théorique stable.
   * 
   * @param attacker, skills, target, duration, bonuses - mêmes params
   * @returns RotationResult (dégâts moyens, pas de variance)
   * 
   * @example
   * ```typescript
   * const calculator = new RotationDPSCalculator();
   * const result = calculator.simulateExpectedRotation(
   *   characterStats,
   *   [ultimateSkill, activeSkill1, activeSkill2],
   *   bossTarget,
   *   60
   * );
   * console.log(`DPS théorique: ${result.dps}`);
   * ```
   */
  public simulateExpectedRotation(
    attacker: Readonly<CharacterBaseStats>,
    skills: readonly Skill[],
    target: Readonly<Target>,
    duration: number = 60,
    bonuses: readonly DamageBonus[] = []
  ): RotationResult {
    return this.simulateInternal(
      attacker,
      skills,
      target,
      duration,
      bonuses,
      'expected'
    );
  }

  /**
   * Logique interne de simulation de rotation (partagée entre les deux modes).
   * 
   * Cette méthode implémente l'algorithme complet de simulation.
   * Elle est appelée par simulateRotation et simulateExpectedRotation
   * avec le mode de calcul approprié.
   * 
   * @param attacker - Stats du personnage
   * @param skills - Liste des skills disponibles
   * @param target - Cible ennemie
   * @param duration - Durée de simulation
   * @param bonuses - Bonus de dégâts
   * @param mode - Mode de calcul (deterministic ou expected)
   * @returns RotationResult complet
   * 
   * @private
   */
  private simulateInternal(
    attacker: Readonly<CharacterBaseStats>,
    skills: readonly Skill[],
    target: Readonly<Target>,
    duration: number,
    bonuses: readonly DamageBonus[],
    mode: CalculationMode
  ): RotationResult {
    // Edge cases
    if (skills.length === 0 || duration <= 0) {
      return this.createEmptyResult(duration);
    }

    // Initialisation
    const cooldownReadyAt = new Map<string, number>();
    const skillStats = new Map<string, SkillTracking>();
    const timeline: TimelineEvent[] = [];

    // Initialiser les cooldowns et stats de tracking
    for (const skill of skills) {
      // Ignorer les passives (ne se lancent pas manuellement)
      if (skill.category === 'passive') {
        continue;
      }

      cooldownReadyAt.set(skill.id, 0); // Disponible dès le départ
      skillStats.set(skill.id, {
        skillId: skill.id,
        skillName: skill.name,
        usageCount: 0,
        totalDamage: 0,
        minDamage: Infinity,
        maxDamage: 0,
        criticalHits: 0,
        normalHits: 0,
        affinityHits: 0,
        misses: 0,
      });
    }

    // Statistiques globales
    let currentTime = 0;
    let totalDamage = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalCritHits = 0;
    let totalAffHits = 0;

    // Boucle principale de simulation
    while (currentTime < duration) {
      // Trouver la prochaine skill disponible
      const nextSkill = this.selectNextSkill(skills, cooldownReadyAt, currentTime);

      if (!nextSkill) {
        // Aucune skill disponible → avancer au prochain cooldown
        const nextCooldownTime = Math.min(...Array.from(cooldownReadyAt.values()));

        if (nextCooldownTime > currentTime && nextCooldownTime < duration) {
          // Avancer jusqu'au prochain cooldown disponible
          currentTime = nextCooldownTime;
        } else {
          // Impossible de continuer (toutes skills indisponibles jusqu'à la fin)
          break;
        }
        continue;
      }

      // Calculer le temps effectif de la skill (castTime + GCD, minimum GCD)
      const skillTime = this.getSkillTime(nextSkill);

      // Ne pas dépasser la duration (ne pas commencer un cast qui finirait après)
      if (currentTime + skillTime > duration) {
        break;
      }

      // Calculer les dégâts selon le mode
      const damageResult =
        mode === 'deterministic'
          ? this.damageCalc.calculateDamage(attacker, nextSkill, target, bonuses)
          : this.damageCalc.calculateExpectedDamage(attacker, nextSkill, target, bonuses);

      const damage = damageResult.finalDamage;
      const outcome = damageResult.outcome;

      // Créer un TimelineEvent de type SkillCast
      timeline.push({
        time: currentTime,
        type: TimelineEventType.SkillCast,
        skillId: nextSkill.id,
        skillName: nextSkill.name,
        description: `Cast ${nextSkill.name}`,
      });

      // Créer un TimelineEvent de type DamageDealt (si pas Miss et damage > 0)
      if (outcome !== CombatOutcome.Miss && damage > 0) {
        timeline.push({
          time: currentTime + nextSkill.castTime, // Damage appliqué après le cast
          type: TimelineEventType.DamageDealt,
          skillId: nextSkill.id,
          skillName: nextSkill.name,
          damage,
          outcome,
          description: `${nextSkill.name} → ${outcome} (${Math.round(damage)} dmg)`,
        });
      }

      // Mettre à jour les stats de la skill
      const stats = skillStats.get(nextSkill.id)!;
      stats.usageCount++;
      stats.totalDamage += damage;

      if (outcome !== CombatOutcome.Miss) {
        totalHits++;
        stats.minDamage = Math.min(stats.minDamage, damage);
        stats.maxDamage = Math.max(stats.maxDamage, damage);

        // Compter les outcomes
        if (outcome === CombatOutcome.Critical || outcome === CombatOutcome.CriticalAffinity) {
          stats.criticalHits++;
          totalCritHits++;
        }
        if (outcome === CombatOutcome.Affinity || outcome === CombatOutcome.CriticalAffinity) {
          stats.affinityHits++;
          totalAffHits++;
        }
        if (outcome === CombatOutcome.Normal) {
          stats.normalHits++;
        }
      } else {
        stats.misses++;
        totalMisses++;
      }

      totalDamage += damage;

      // Mettre le cooldown de la skill (currentTime + cooldown)
      cooldownReadyAt.set(nextSkill.id, currentTime + nextSkill.cooldown);

      // Avancer le temps (castTime + GCD)
      currentTime += skillTime;
    }

    // Calculer les résultats finaux
    const actualDuration = Math.min(currentTime, duration);
    const dps = actualDuration > 0 ? totalDamage / actualDuration : 0;
    const averageDamagePerHit = totalHits > 0 ? totalDamage / totalHits : 0;
    const criticalRate = totalHits > 0 ? totalCritHits / totalHits : 0;
    const affinityRate = totalHits > 0 ? totalAffHits / totalHits : 0;
    const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    // Construire les SkillUsages
    const skillUsages = this.buildSkillUsages(skillStats, totalDamage);

    return {
      totalDamage,
      dps,
      duration: actualDuration,
      averageDamagePerHit,
      totalHits,
      totalMisses,
      criticalRate,
      affinityRate,
      hitRate,
      skillUsages,
      timeline,
    };
  }

  /**
   * Détermine la priorité d'une catégorie de skill (plus petit = prioritaire).
   * 
   * Ordre de priorité :
   * - Ultimate = 0 (priorité maximale)
   * - Active = 1
   * - Support = 2
   * - CrowdControl = 3
   * - Mobility = 4
   * - Passive = 99 (jamais utilisé dans rotation)
   * 
   * @param category - Catégorie de la skill
   * @returns Valeur de priorité (0-99)
   * 
   * @private
   */
  private getCategoryPriority(category: SkillCategory): number {
    switch (category) {
      case 'ultimate':
        return 0;
      case 'active':
        return 1;
      case 'support':
        return 2;
      case 'crowd_control':
        return 3;
      case 'mobility':
        return 4;
      case 'passive':
        return 99;
      default:
        return 99;
    }
  }

  /**
   * Sélectionne la prochaine skill disponible selon priorité.
   * 
   * Filtre : cooldownReadyAt[skillId] <= currentTime ET category !== Passive
   * Tri : par categoryPriority ASC, puis physicalRatio DESC
   * 
   * @param skills - Liste de toutes les skills
   * @param cooldownReadyAt - Map des temps de disponibilité
   * @param currentTime - Temps actuel de la simulation
   * @returns La skill à utiliser ou null si aucune disponible
   * 
   * @private
   */
  private selectNextSkill(
    skills: readonly Skill[],
    cooldownReadyAt: Map<string, number>,
    currentTime: number
  ): Skill | null {
    // Filtrer les skills disponibles (cooldown ready et non-passives)
    const availableSkills = skills.filter((skill) => {
      if (skill.category === 'passive') {
        return false; // Ignorer les passives
      }

      const readyAt = cooldownReadyAt.get(skill.id);
      return readyAt !== undefined && readyAt <= currentTime;
    });

    if (availableSkills.length === 0) {
      return null; // Aucune skill disponible
    }

    // Trier par priorité : categoryPriority ASC, puis physicalRatio DESC
    const sorted = [...availableSkills].sort((a, b) => {
      const priorityA = this.getCategoryPriority(a.category);
      const priorityB = this.getCategoryPriority(b.category);

      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Plus petit = prioritaire
      }

      // Même priorité → trier par physicalRatio DESC
      return b.physicalRatio - a.physicalRatio;
    });

    return sorted[0]; // Retourner la skill la plus prioritaire
  }

  /**
   * Calcule le temps effectif d'une skill (castTime + GCD, minimum GCD).
   * 
   * Formule :
   * - Si castTime = 0 → temps = GCD (1s)
   * - Si castTime > 0 → temps = castTime + GCD
   * 
   * @param skill - La skill dont on veut calculer le temps
   * @returns Temps total d'exécution (en secondes)
   * 
   * @private
   */
  private getSkillTime(skill: Readonly<Skill>): number {
    const castTime = skill.castTime || 0;
    return castTime + GCD; // castTime + GCD, minimum GCD
  }

  /**
   * Construit le SkillUsage[] à partir des stats accumulées.
   * 
   * Calcule le damageShare pour chaque skill :
   * damageShare = skillTotalDamage / rotationTotalDamage
   * 
   * @param skillStats - Map des stats trackées pendant la simulation
   * @param totalDamage - Dégâts totaux de toute la rotation
   * @returns Liste des SkillUsage triée par damageShare DESC
   * 
   * @private
   */
  private buildSkillUsages(
    skillStats: Map<string, SkillTracking>,
    totalDamage: number
  ): SkillUsage[] {
    const usages: SkillUsage[] = [];

    for (const stats of skillStats.values()) {
      // Ignorer les skills non utilisées
      if (stats.usageCount === 0) {
        continue;
      }

      const averageDamage = stats.totalDamage / stats.usageCount;
      const damageShare = totalDamage > 0 ? stats.totalDamage / totalDamage : 0;

      usages.push({
        skillId: stats.skillId,
        skillName: stats.skillName,
        usageCount: stats.usageCount,
        totalDamage: stats.totalDamage,
        averageDamage,
        minDamage: stats.minDamage === Infinity ? 0 : stats.minDamage,
        maxDamage: stats.maxDamage,
        criticalHits: stats.criticalHits,
        normalHits: stats.normalHits,
        misses: stats.misses,
        damageShare,
      });
    }

    // Trier par damageShare DESC (skill la plus contributrice en premier)
    return usages.sort((a, b) => b.damageShare - a.damageShare);
  }

  /**
   * Crée un RotationResult vide (edge case : skills vides ou duration <= 0).
   * 
   * @param duration - Durée de la simulation
   * @returns RotationResult avec tout à 0
   * 
   * @private
   */
  private createEmptyResult(duration: number): RotationResult {
    return {
      totalDamage: 0,
      dps: 0,
      duration: Math.max(0, duration),
      averageDamagePerHit: 0,
      totalHits: 0,
      totalMisses: 0,
      criticalRate: 0,
      affinityRate: 0,
      hitRate: 0,
      skillUsages: [],
      timeline: [],
    };
  }
}
