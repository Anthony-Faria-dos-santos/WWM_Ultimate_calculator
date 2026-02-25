/**
 * Calculateur de pool élémentaire.
 * Pool élémentaire = base + (spirit × scalingFactor) + bonus flat + bonus %.
 */

import type { CharacterBaseStats, Target, Skill, ElementalPool } from '@/lib/types';
import { calculateElementalReduction } from '@/lib/constants';

/**
 * Calculateur de pool élémentaire avec réduction de résistance.
 *
 * Gère le calcul complet : ratio skill, pénétration, réduction hyperbolique,
 * résistances négatives (faiblesses élémentaires).
 */
export class ElementalPoolCalculator {
 /**
 * Calcule le pool de dégâts élémentaires après réduction de résistance.
 *
 * Étapes :
 * 1. Base = elementalAttack × elementalRatio
 * 2. Réduction = calculateElementalReduction(netResistance)
 * 3. Résultat = base × (1 - réduction)
 *
 * @param character - Stats finales du personnage
 * @param target - Cible avec résistance élémentaire
 * @param skill - Compétence avec ratio et type élémentaire
 * @returns Pool élémentaire complet avec détails de calcul
 */
 public calculateElementalPool(
 character: Readonly<CharacterBaseStats>,
 target: Readonly<Target>,
 skill: Readonly<Skill>
 ): ElementalPool {
 // Étape 1 : Attaque élémentaire de base × ratio de skill
 const baseElemental = character.elementalAttack * skill.elementalRatio;

 // Étape 2 : Réduction de résistance avec pénétration élémentaire
 const elementalPenetration = character.elementalPenetration || 0;
 const netResistance = target.resistance - elementalPenetration;
 const resistanceReduction = calculateElementalReduction(netResistance);

 // Étape 3 : Réduction de résistance
 // Si résistance négative (faiblesse), la réduction devient un boost
 const afterResistance = baseElemental * (1 - resistanceReduction);

 // Retourne le pool complet
 return {
 baseElemental,
 afterResistance,
 resistanceReduction,
 };
 }

 /**
 * Calcule uniquement les dégâts finaux sans étapes intermédiaires.
 *
 * Optimized version when you only need the final result.
 *
 * @param character - Stats finales du personnage
 * @param target - Cible avec résistance élémentaire
 * @param skill - Skill with elemental damage ratio
 * @returns Final elemental damage pool (after resistance reduction)
 *
 */
 public calculateFinalDamage(
 character: Readonly<CharacterBaseStats>,
 target: Readonly<Target>,
 skill: Readonly<Skill>
 ): number {
 const pool = this.calculateElementalPool(character, target, skill);
 return pool.afterResistance;
 }

 /**
 * Vérifie si une compétence inflige des dégâts élémentaires.
 *
 * @param skill - Compétence à vérifier
 * @returns true si la compétence a un ratio élémentaire > 0
 */
 public hasElementalDamage(skill: Readonly<Skill>): boolean {
 return skill.elementalRatio > 0;
 }

 /**
 * Calcule le pourcentage de réduction de résistance effectif.
 *
 * Useful for UI to show the resistance reduction as a readable percentage.
 *
 * @param target - Cible avec résistance élémentaire
 * @param elementalPenetration - Character's elemental penetration
 * @returns Resistance reduction percentage (0-1, can be negative)
 *
 */
 public getResistanceReductionPercent(
 target: Readonly<Target>,
 elementalPenetration: number
 ): number {
 const netResistance = target.resistance - elementalPenetration;
 return calculateElementalReduction(netResistance);
 }
}
