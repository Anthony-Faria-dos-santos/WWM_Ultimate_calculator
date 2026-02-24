/**
 * Calculateur de pool physique.
 * Pool physique = base + (agility × scalingFactor) + bonus flat + bonus %.
 */

import type { CharacterBaseStats, Target, Skill, PhysicalPool } from '@/lib/types';
import { calculateDefenseReduction } from '@/lib/constants';

/**
 * Calculateur de pool de dégâts physiques avec réduction multi-étapes.
 *
 * Implémente le calcul complet du pool physique :
 * - Application du ratio de compétence
 * - Réduction du bouclier (linéaire)
 * - Pénétration d'armure
 * - Réduction de défense (formule hyperbolique)
 *
 */
export class PhysicalPoolCalculator {
 /**
 * Calcule le pool de dégâts physiques final après toutes les réductions.
 *
 * Étapes de calcul :
 * 1. Attaque de base = attack × physicalRatio
 * 2. Réduction bouclier = baseAttack × (1 - shield%)
 * 3. Réduction défense = afterShield × (1 - defenseReduction%)
 *
 * @param character - Stats de combat finales du personnage
 * @param target - Cible avec stats défensives (défense, bouclier)
 * @param skill - Compétence avec ratio de dégâts physiques
 * @returns Pool physique complet avec toutes les étapes
 *
 */
 public calculatePhysicalPool(
 character: Readonly<CharacterBaseStats>,
 target: Readonly<Target>,
 skill: Readonly<Skill>
 ): PhysicalPool {
 // Étape 1 : Attaque physique de base × ratio de skill
 const baseAttack = character.attack * skill.physicalRatio;

 // Étape 2 : Réduction de bouclier (linéaire)
 // Bouclier plafonné à 100%
 const shieldReduction = target.shield || 0;
 const afterShield = baseAttack * (1 - shieldReduction);

 // Étape 3 : Réduction de défense avec pénétration
 const armorPenetration = character.armorPenetration || 0;
 const defenseReduction = calculateDefenseReduction(
 target.defense,
 armorPenetration
 );
 const afterDefense = afterShield * (1 - defenseReduction);

 // Retourne le pool complet
 return {
 baseAttack,
 afterShield,
 afterDefense,
 shieldReduction,
 defenseReduction,
 };
 }

 /**
 * Calcule uniquement les dégâts finaux sans étapes intermédiaires.
 *
 * Optimized version when you only need the final result.
 *
 * @param character - Stats finales du personnage
 * @param target - Target with defensive stats
 * @param skill - Compétence avec ratio de dégâts physique
 * @returns Final physical damage pool (after all reductions)
 *
 */
 public calculateFinalDamage(
 character: Readonly<CharacterBaseStats>,
 target: Readonly<Target>,
 skill: Readonly<Skill>
 ): number {
 const pool = this.calculatePhysicalPool(character, target, skill);
 return pool.afterDefense;
 }

 /**
 * Vérifie si une compétence inflige des dégâts physiques.
 *
 * @param skill - Compétence à vérifier
 * @returns true si la compétence a un ratio physique > 0
 */
 public hasPhysicalDamage(skill: Readonly<Skill>): boolean {
 return skill.physicalRatio > 0;
 }
}
