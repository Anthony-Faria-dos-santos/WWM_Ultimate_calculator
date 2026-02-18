/**
 * Validation Utilities for WWM Calculator
 * 
 * Fournit des fonctions pure de validation pour vérifier la cohérence
 * des données de combat avant calcul. Pas de bibliothèque externe,
 * validation manuelle légère et performante.
 * 
 * Toutes les fonctions sont pure (pas de side-effect, readonly).
 * 
 * @module validation.utils
 * @version 1.0.0
 */

import type { CharacterBaseStats, PlayerCharacter } from '@/lib/types';
import type { Skill } from '@/lib/types';
import type { Target } from '@/lib/types';

/**
 * Résultat d'une validation
 * 
 * Contient le statut de validation (valid) et la liste des erreurs
 * rencontrées. Si valid = true, errors est un tableau vide.
 * 
 * @interface ValidationResult
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   valid: false,
 *   errors: ['attack must be >= 0', 'level must be between 1 and 100'],
 * };
 * ```
 */
export interface ValidationResult {
  /**
   * Indique si la validation a réussi
   * 
   * true = toutes les contraintes respectées
   * false = au moins une erreur détectée
   */
  readonly valid: boolean;

  /**
   * Liste des erreurs de validation
   * 
   * Tableau vide si valid = true.
   * Chaque erreur est une string descriptive en anglais.
   * 
   * @example ['attack must be >= 0', 'critRate must be between 0 and 1']
   */
  readonly errors: readonly string[];
}

/**
 * Valide les statistiques de base d'un personnage
 * 
 * Vérifie que toutes les stats sont dans les plages valides :
 * - level : entre 1 et 100
 * - attack : >= 0
 * - attackMin : >= 0 et <= attackMax
 * - attackMax : >= 0 et >= attackMin
 * - elementalAttack : >= 0
 * - defense : >= 0
 * - resistance : >= 0
 * - critRate : >= 0 (pas de cap, la formule gère le cap à 80%)
 * - critDamage : >= 0 (bonus de dégâts crit, peut être 0 si juste le base 1.5)
 * - affinityRate : entre 0 et 1 (cap 40% géré par l'appelant)
 * - affinityDamage : >= 0 (bonus de dégâts affinité)
 * - precision : >= 0
 * - armorPenetration : >= 0
 * - elementalPenetration : >= 0
 * 
 * @param stats - Stats de base du personnage à valider
 * @returns Résultat de validation avec erreurs éventuelles
 * 
 * @example
 * ```typescript
 * const stats: CharacterBaseStats = {
 *   level: 80,
 *   attack: 1200,
 *   critRate: 600,
 *   // ... autres stats
 * };
 * const result = isValidCharacterStats(stats);
 * if (!result.valid) {
 *   console.error('Stats invalides:', result.errors);
 * }
 * ```
 */
export function isValidCharacterStats(
  stats: Readonly<CharacterBaseStats>
): ValidationResult {
  const errors: string[] = [];

  // Validation du niveau
  if (stats.level < 1 || stats.level > 100) {
    errors.push('level must be between 1 and 100');
  }

  // Validation de l'attaque
  if (stats.attack < 0) {
    errors.push('attack must be >= 0');
  }

  // Validation de l'attaque min/max
  if (stats.attackMin < 0) {
    errors.push('attackMin must be >= 0');
  }
  if (stats.attackMax < 0) {
    errors.push('attackMax must be >= 0');
  }
  if (stats.attackMin > stats.attackMax) {
    errors.push('attackMin must be <= attackMax');
  }

  // Validation de l'attaque élémentaire
  if (stats.elementalAttack < 0) {
    errors.push('elementalAttack must be >= 0');
  }

  // Validation défense et résistance
  if (stats.defense < 0) {
    errors.push('defense must be >= 0');
  }
  if (stats.resistance < 0) {
    errors.push('resistance must be >= 0');
  }

  // Validation critique
  if (stats.critRate < 0) {
    errors.push('critRate must be >= 0');
  }
  if (stats.critDamage < 0) {
    errors.push('critDamage must be >= 0');
  }

  // Validation affinité
  if (stats.affinityRate < 0 || stats.affinityRate > 1) {
    errors.push('affinityRate must be between 0 and 1');
  }
  if (stats.affinityDamage < 0) {
    errors.push('affinityDamage must be >= 0');
  }

  // Validation précision
  if (stats.precision < 0) {
    errors.push('precision must be >= 0');
  }

  // Validation pénétrations
  if (stats.armorPenetration < 0) {
    errors.push('armorPenetration must be >= 0');
  }
  if (stats.elementalPenetration < 0) {
    errors.push('elementalPenetration must be >= 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide une compétence (skill)
 * 
 * Vérifie que la skill a des paramètres cohérents :
 * - name : non vide
 * - physicalRatio ou elementalRatio : au moins un > 0 (sauf passive)
 * - castTime : > 0 (sauf instantanés)
 * - cooldown : >= 0 (0 = spam possible, limité par GCD)
 * 
 * @param skill - Compétence à valider
 * @returns Résultat de validation avec erreurs éventuelles
 * 
 * @example
 * ```typescript
 * const skill: Skill = {
 *   id: 'skill-001',
 *   name: 'Frappe rapide',
 *   physicalRatio: 1.2,
 *   elementalRatio: 0,
 *   cooldown: 5,
 *   castTime: 0.8,
 *   // ... autres props
 * };
 * const result = isValidSkill(skill);
 * if (!result.valid) {
 *   console.error('Skill invalide:', result.errors);
 * }
 * ```
 */
export function isValidSkill(skill: Readonly<Skill>): ValidationResult {
  const errors: string[] = [];

  // Validation du nom
  if (!skill.name || skill.name.trim() === '') {
    errors.push('name must not be empty');
  }

  // Validation des ratios (au moins un > 0)
  if (skill.physicalRatio <= 0 && skill.elementalRatio <= 0) {
    errors.push('at least one of physicalRatio or elementalRatio must be > 0');
  }

  // Validation physicalRatio
  if (skill.physicalRatio < 0) {
    errors.push('physicalRatio must be >= 0');
  }

  // Validation elementalRatio
  if (skill.elementalRatio < 0) {
    errors.push('elementalRatio must be >= 0');
  }

  // Validation castTime
  if (skill.castTime < 0) {
    errors.push('castTime must be >= 0');
  }

  // Validation cooldown
  if (skill.cooldown < 0) {
    errors.push('cooldown must be >= 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide une cible (target)
 * 
 * Vérifie que les stats défensives de la cible sont cohérentes :
 * - defense : >= 0
 * - resistance : >= 0 (peut être négatif pour faiblesses, mais on valide >= 0 ici)
 * - shield : entre 0 et 1 (pourcentage, cap 100%)
 * - parry : >= 0
 * - critResistance (optionnel) : >= 0
 * 
 * @param target - Cible à valider
 * @returns Résultat de validation avec erreurs éventuelles
 * 
 * @example
 * ```typescript
 * const target: Target = {
 *   id: 'boss-001',
 *   name: 'Dragon',
 *   level: 80,
 *   defense: 800,
 *   resistance: 100,
 *   shield: 0.15,
 *   parry: 300,
 * };
 * const result = isValidTarget(target);
 * if (!result.valid) {
 *   console.error('Target invalide:', result.errors);
 * }
 * ```
 */
export function isValidTarget(target: Readonly<Target>): ValidationResult {
  const errors: string[] = [];

  // Validation défense
  if (target.defense < 0) {
    errors.push('defense must be >= 0');
  }

  // Validation résistance (on accepte 0+, mais pas négatif pour éviter les erreurs)
  if (target.resistance < 0) {
    errors.push('resistance must be >= 0');
  }

  // Validation bouclier (0-100%)
  if (target.shield < 0 || target.shield > 1) {
    errors.push('shield must be between 0 and 1');
  }

  // Validation parade
  if (target.parry < 0) {
    errors.push('parry must be >= 0');
  }

  // Validation critResistance (optionnel)
  if (target.critResistance !== undefined && target.critResistance < 0) {
    errors.push('critResistance must be >= 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clampe une valeur entre min et max
 * 
 * Utilitaire pure pour forcer une valeur dans une plage.
 * Si value < min, retourne min.
 * Si value > max, retourne max.
 * Sinon retourne value.
 * 
 * @param value - Valeur à clamper
 * @param min - Valeur minimum (incluse)
 * @param max - Valeur maximum (incluse)
 * @returns Valeur clampée entre min et max
 * 
 * @example
 * ```typescript
 * clampValue(5, 0, 10);   // 5
 * clampValue(-5, 0, 10);  // 0
 * clampValue(15, 0, 10);  // 10
 * clampValue(7, 7, 7);    // 7
 * ```
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Clampe un taux entre 0 et 1
 * 
 * Raccourci pour clampValue(value, 0, 1).
 * Utile pour valider les pourcentages (taux de crit, affinité, etc.)
 * 
 * @param value - Taux à clamper
 * @returns Taux clampé entre 0 et 1
 * 
 * @example
 * ```typescript
 * clampRate(0.5);   // 0.5
 * clampRate(-0.2);  // 0
 * clampRate(1.5);   // 1
 * clampRate(0.999); // 0.999
 * ```
 */
export function clampRate(value: number): number {
  return clampValue(value, 0, 1);
}
