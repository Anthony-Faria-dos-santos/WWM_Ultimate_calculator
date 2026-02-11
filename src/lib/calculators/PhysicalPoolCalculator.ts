/**
 * Physical Pool Calculator
 * 
 * Calculates the physical damage pool through all reduction stages:
 * 1. Base Attack = Character Attack × Skill Physical Ratio
 * 2. After Shield = Base Attack × (1 - Shield%)
 * 3. After Defense = After Shield × (1 - Defense Reduction%)
 * 
 * The defense reduction uses a hyperbolic formula accounting for armor penetration:
 * Defense Reduction = Net Defense / (Net Defense + 2860)
 * where Net Defense = max(0, Target Defense - Armor Penetration)
 * 
 * All methods are pure functions without side effects.
 * Results include all intermediate steps for debugging and display purposes.
 * 
 * @see WWM-Formules-Reference-v1.3.md Section 4 (Physical Pool)
 * 
 * @module calculators/PhysicalPoolCalculator
 * @version 1.0.0
 */

import type { CharacterBaseStats, Target, Skill, PhysicalPool } from '@/lib/types';
import { calculateDefenseReduction } from '@/lib/constants';

/**
 * Physical damage pool calculator with multi-stage reduction system.
 * 
 * Implements the complete physical pool calculation including:
 * - Skill ratio application
 * - Shield reduction (linear)
 * - Armor penetration
 * - Defense reduction (hyperbolic formula)
 * 
 * @remarks
 * All methods are pure functions (no side effects).
 * Results include all intermediate calculation stages for transparency.
 * 
 * @example
 * ```typescript
 * const calculator = new PhysicalPoolCalculator();
 * const pool = calculator.calculatePhysicalPool(
 *   { attack: 2500, armorPenetration: 800, ... },
 *   { defense: 1200, shield: 0.15, ... },
 *   { physicalRatio: 1.5, ... }
 * );
 * // pool.afterDefense = final physical damage pool
 * ```
 */
export class PhysicalPoolCalculator {
  /**
   * Calculates the final physical damage pool after all reductions.
   * 
   * Calculation stages:
   * 1. Base Attack = attack × physicalRatio
   * 2. Shield Reduction = baseAttack × (1 - shield%)
   * 3. Defense Reduction = afterShield × (1 - defenseReduction%)
   * 
   * @param character - Character's final combat statistics
   * @param target - Target with defensive stats (defense, shield)
   * @param skill - Skill with physical damage ratio
   * @returns Complete physical pool with all calculation stages
   * 
   * @example
   * ```typescript
   * const calculator = new PhysicalPoolCalculator();
   * 
   * // Example 1: High defense target with shield
   * const pool1 = calculator.calculatePhysicalPool(
   *   { attack: 2500, armorPenetration: 800, ... },
   *   { defense: 1200, shield: 0.20, ... },
   *   { physicalRatio: 1.5, ... }
   * );
   * // Result:
   * // - baseAttack: 3750 (2500 × 1.5)
   * // - afterShield: 3000 (3750 × 0.8)
   * // - afterDefense: ~2812 (after defense reduction)
   * 
   * // Example 2: No shield, high armor penetration
   * const pool2 = calculator.calculatePhysicalPool(
   *   { attack: 2500, armorPenetration: 1500, ... },
   *   { defense: 1200, shield: 0, ... },
   *   { physicalRatio: 2.0, ... }
   * );
   * // Result:
   * // - baseAttack: 5000 (2500 × 2.0)
   * // - afterShield: 5000 (no shield)
   * // - afterDefense: ~5000 (low defense reduction due to high penetration)
   * ```
   */
  public calculatePhysicalPool(
    character: Readonly<CharacterBaseStats>,
    target: Readonly<Target>,
    skill: Readonly<Skill>
  ): PhysicalPool {
    // Stage 1: Base physical attack with skill ratio
    const baseAttack = character.attack * skill.physicalRatio;

    // Stage 2: Shield reduction (linear)
    // Shield is capped at 100% (1.0) in the type system
    const shieldReduction = target.shield || 0;
    const afterShield = baseAttack * (1 - shieldReduction);

    // Stage 3: Defense reduction with armor penetration
    const armorPenetration = character.armorPenetration || 0;
    const defenseReduction = calculateDefenseReduction(
      target.defense,
      armorPenetration
    );
    const afterDefense = afterShield * (1 - defenseReduction);

    // Return complete pool with all stages
    return {
      baseAttack,
      afterShield,
      afterDefense,
      shieldReduction,
      defenseReduction,
    };
  }

  /**
   * Calculates only the final damage without intermediate stages.
   * 
   * Optimized version when you only need the final result.
   * 
   * @param character - Character's final combat statistics
   * @param target - Target with defensive stats
   * @param skill - Skill with physical damage ratio
   * @returns Final physical damage pool (after all reductions)
   * 
   * @example
   * ```typescript
   * const calculator = new PhysicalPoolCalculator();
   * const finalDamage = calculator.calculateFinalDamage(character, target, skill);
   * // Returns only the final number, no intermediate stages
   * ```
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
   * Checks if a skill deals physical damage.
   * 
   * Helper method to determine if physical pool calculation is needed.
   * 
   * @param skill - Skill to check
   * @returns true if skill has physical damage component (ratio > 0)
   * 
   * @example
   * ```typescript
   * const calculator = new PhysicalPoolCalculator();
   * if (calculator.hasPhysicalDamage(skill)) {
   *   const pool = calculator.calculatePhysicalPool(character, target, skill);
   * }
   * ```
   */
  public hasPhysicalDamage(skill: Readonly<Skill>): boolean {
    return skill.physicalRatio > 0;
  }
}
