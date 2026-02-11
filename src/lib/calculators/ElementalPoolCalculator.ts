/**
 * Elemental Pool Calculator
 * 
 * Calculates the elemental damage pool through resistance reduction:
 * 1. Base Elemental = Character Elemental Attack × Skill Elemental Ratio
 * 2. After Resistance = Base Elemental × (1 - Resistance Reduction%)
 * 
 * The resistance reduction uses a hyperbolic formula accounting for elemental penetration:
 * Resistance Reduction = Net Resistance / (Net Resistance + 530)
 * where Net Resistance = max(0, Target Resistance - Elemental Penetration)
 * 
 * Important notes:
 * - Elemental damage ignores physical defense and shield
 * - Negative resistance creates a damage multiplier (elemental weakness)
 * - Example: -353 resistance ≈ ×3 damage multiplier
 * 
 * All methods are pure functions without side effects.
 * Results include all intermediate steps for debugging and display purposes.
 * 
 * @see WWM-Formules-Reference-v1.3.md Section 5 (Elemental Pool)
 * 
 * @module calculators/ElementalPoolCalculator
 * @version 1.0.0
 */

import type { CharacterBaseStats, Target, Skill, ElementalPool } from '@/lib/types';
import { calculateElementalReduction } from '@/lib/constants';

/**
 * Elemental damage pool calculator with resistance reduction.
 * 
 * Implements the complete elemental pool calculation including:
 * - Skill elemental ratio application
 * - Elemental penetration
 * - Resistance reduction (hyperbolic formula)
 * - Support for negative resistance (elemental weakness)
 * 
 * @remarks
 * All methods are pure functions (no side effects).
 * Unlike physical damage, elemental damage bypasses shield and defense.
 * Results include intermediate calculation stages for transparency.
 * 
 * @example
 * ```typescript
 * const calculator = new ElementalPoolCalculator();
 * const pool = calculator.calculateElementalPool(
 *   { elementalAttack: 3000, elementalPenetration: 200, ... },
 *   { resistance: 500, ... },
 *   { elementalRatio: 2.0, element: SkillElement.Fire, ... }
 * );
 * // pool.afterResistance = final elemental damage pool
 * ```
 */
export class ElementalPoolCalculator {
  /**
   * Calculates the final elemental damage pool after resistance reduction.
   * 
   * Calculation stages:
   * 1. Base Elemental = elementalAttack × elementalRatio
   * 2. Resistance Reduction = calculateElementalReduction(netResistance)
   * 3. After Resistance = baseElemental × (1 - resistanceReduction)
   * 
   * @param character - Character's final combat statistics
   * @param target - Target with elemental resistance
   * @param skill - Skill with elemental damage ratio and element type
   * @returns Complete elemental pool with all calculation stages
   * 
   * @example
   * ```typescript
   * const calculator = new ElementalPoolCalculator();
   * 
   * // Example 1: Standard elemental damage with resistance
   * const pool1 = calculator.calculateElementalPool(
   *   { elementalAttack: 3000, elementalPenetration: 200, ... },
   *   { resistance: 500, ... },
   *   { elementalRatio: 2.0, element: SkillElement.Fire, ... }
   * );
   * // Result:
   * // - baseElemental: 6000 (3000 × 2.0)
   * // - resistanceReduction: ~0.361 (300/(300+530) after penetration)
   * // - afterResistance: ~3834 (6000 × (1 - 0.361))
   * 
   * // Example 2: Elemental weakness (negative resistance)
   * const pool2 = calculator.calculateElementalPool(
   *   { elementalAttack: 2000, elementalPenetration: 0, ... },
   *   { resistance: -353, ... }, // Weakness to this element
   *   { elementalRatio: 1.5, element: SkillElement.Ice, ... }
   * );
   * // Result:
   * // - baseElemental: 3000 (2000 × 1.5)
   * // - resistanceReduction: ~-2.0 (negative = damage boost)
   * // - afterResistance: ~9000 (3000 × 3.0, triple damage!)
   * 
   * // Example 3: Pure physical skill (no elemental damage)
   * const pool3 = calculator.calculateElementalPool(
   *   { elementalAttack: 3000, ... },
   *   { resistance: 100, ... },
   *   { elementalRatio: 0, element: SkillElement.None, ... }
   * );
   * // Result:
   * // - baseElemental: 0 (no elemental component)
   * // - afterResistance: 0
   * ```
   */
  public calculateElementalPool(
    character: Readonly<CharacterBaseStats>,
    target: Readonly<Target>,
    skill: Readonly<Skill>
  ): ElementalPool {
    // Stage 1: Base elemental attack with skill ratio
    const baseElemental = character.elementalAttack * skill.elementalRatio;

    // Stage 2: Resistance reduction with elemental penetration
    const elementalPenetration = character.elementalPenetration || 0;
    const netResistance = target.resistance - elementalPenetration;
    const resistanceReduction = calculateElementalReduction(netResistance);

    // Stage 3: Apply resistance reduction
    // Note: If resistance is negative (weakness), reduction is negative → damage boost
    const afterResistance = baseElemental * (1 - resistanceReduction);

    // Return complete pool with all stages
    return {
      baseElemental,
      afterResistance,
      resistanceReduction,
    };
  }

  /**
   * Calculates only the final damage without intermediate stages.
   * 
   * Optimized version when you only need the final result.
   * 
   * @param character - Character's final combat statistics
   * @param target - Target with elemental resistance
   * @param skill - Skill with elemental damage ratio
   * @returns Final elemental damage pool (after resistance reduction)
   * 
   * @example
   * ```typescript
   * const calculator = new ElementalPoolCalculator();
   * const finalDamage = calculator.calculateFinalDamage(character, target, skill);
   * // Returns only the final number, no intermediate stages
   * ```
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
   * Checks if a skill deals elemental damage.
   * 
   * Helper method to determine if elemental pool calculation is needed.
   * 
   * @param skill - Skill to check
   * @returns true if skill has elemental damage component (ratio > 0)
   * 
   * @example
   * ```typescript
   * const calculator = new ElementalPoolCalculator();
   * if (calculator.hasElementalDamage(skill)) {
   *   const pool = calculator.calculateElementalPool(character, target, skill);
   * }
   * ```
   */
  public hasElementalDamage(skill: Readonly<Skill>): boolean {
    return skill.elementalRatio > 0;
  }

  /**
   * Calculates the effective resistance reduction percentage for display.
   * 
   * Useful for UI to show the resistance reduction as a readable percentage.
   * 
   * @param target - Target with elemental resistance
   * @param elementalPenetration - Character's elemental penetration
   * @returns Resistance reduction percentage (0-1, can be negative)
   * 
   * @example
   * ```typescript
   * const calculator = new ElementalPoolCalculator();
   * const reduction = calculator.getResistanceReductionPercent(
   *   { resistance: 500, ... },
   *   200
   * );
   * // reduction ≈ 0.361 (36.1% damage reduced by resistance)
   * ```
   */
  public getResistanceReductionPercent(
    target: Readonly<Target>,
    elementalPenetration: number
  ): number {
    const netResistance = target.resistance - elementalPenetration;
    return calculateElementalReduction(netResistance);
  }
}
