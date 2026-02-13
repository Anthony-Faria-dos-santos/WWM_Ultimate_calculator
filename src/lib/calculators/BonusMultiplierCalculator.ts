/**
 * Bonus Multiplier Calculator
 * 
 * Implémente la règle chinoise des bonus de dégâts :
 * **同类相加，异类相乘** (Même catégorie = additionner, catégories différentes = multiplier)
 * 
 * Algorithme :
 * 1. Grouper les bonus par catégorie
 * 2. Pour chaque catégorie : additionner les valeurs → categorySum
 * 3. Le multiplicateur de chaque catégorie = (1 + categorySum)
 * 4. Multiplier tous les multiplicateurs de catégorie entre eux
 * 
 * Exemple :
 * - Dégâts +20% et +10% (même catégorie → additionner = +30%)
 * - Compétence +15% (catégorie différente → multiplier)
 * - Total = (1 + 0.30) × (1 + 0.15) = 1.30 × 1.15 = 1.495
 * 
 * @remarks
 * Toutes les méthodes sont pures (sans effets de bord).
 * Les bonus négatifs (debuffs) sont supportés.
 * 
 * @see WWM-Formules-Reference-v1_3.md Section 7 (Bonus Multipliers)
 * 
 * @module calculators/BonusMultiplierCalculator
 * @version 1.0.0
 */

/**
 * Catégorie de bonus de dégâts.
 *
 * Les bonus de même catégorie s'additionnent.
 * Les bonus de catégories différentes se multiplient.
 *
 * Règle : 同类相加，异类相乘
 */
export enum BonusCategory {
  /** Augmentation de dégâts générale (增伤) */
  DamageIncrease = 'damage_increase',
  /** Bonus de dégâts de compétence (技能增伤) */
  SkillDamage = 'skill_damage',
  /** Bonus de dégâts élémentaires (元素增伤) */
  ElementalDamage = 'elemental_damage',
  /** Bonus de dégâts d'arme (武器增伤) */
  WeaponDamage = 'weapon_damage',
  /** Bonus de set d'équipement (套装增伤) */
  SetBonus = 'set_bonus',
  /** Condition spéciale (特殊条件) — ex: cible < 50% HP */
  SpecialCondition = 'special_condition',
}

/**
 * Un bonus individuel de dégâts.
 */
export interface DamageBonus {
  /** Catégorie du bonus (détermine le groupement) */
  readonly category: BonusCategory;
  /** Valeur du bonus en décimal (0.2 = +20%) */
  readonly value: number;
  /** Source du bonus pour le breakdown UI */
  readonly source: string;
}

/**
 * Détail d'une catégorie de bonus pour le breakdown UI.
 */
export interface BonusCategoryBreakdown {
  /** Liste des bonus individuels de cette catégorie */
  readonly sources: readonly DamageBonus[];
  /** Somme des valeurs de la catégorie (ex: 0.30 pour +30%) */
  readonly sum: number;
  /** Multiplicateur de la catégorie (ex: 1.30 pour +30%) */
  readonly multiplier: number;
}

/**
 * Calculateur de multiplicateur de bonus de dégâts.
 * 
 * Implémente la règle chinoise : **同类相加，异类相乘**
 * (Même catégorie = additionner, catégories différentes = multiplier)
 * 
 * @remarks
 * Toutes les méthodes sont pures (sans mutation, sans side effects).
 * Les bonus négatifs (debuffs) sont supportés via des valeurs négatives.
 * 
 * @example
 * ```typescript
 * const calculator = new BonusMultiplierCalculator();
 * 
 * const bonuses: DamageBonus[] = [
 *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
 *   { category: BonusCategory.DamageIncrease, value: 0.10, source: 'Talent' },
 *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
 * ];
 * 
 * const multiplier = calculator.calculateBonusMultiplier(bonuses);
 * // → 1.495 ((1 + 0.30) × (1 + 0.15))
 * 
 * const breakdown = calculator.getBreakdown(bonuses);
 * // → Map {
 * //   DamageIncrease: { sources: [...], sum: 0.30, multiplier: 1.30 },
 * //   SkillDamage: { sources: [...], sum: 0.15, multiplier: 1.15 }
 * // }
 * ```
 */
export class BonusMultiplierCalculator {
  /**
   * Calcule le multiplicateur de bonus total.
   *
   * Algorithme (同类相加，异类相乘) :
   * 1. Grouper les bonus par catégorie
   * 2. Pour chaque catégorie : additionner les valeurs → categorySum
   * 3. Le multiplicateur de chaque catégorie = (1 + categorySum)
   * 4. Multiplier tous les multiplicateurs de catégorie entre eux
   *
   * @param bonuses - Liste de bonus à appliquer (readonly)
   * @returns Multiplicateur total (≥ 1.0 si tous bonus positifs)
   *
   * @example
   * ```typescript
   * const calculator = new BonusMultiplierCalculator();
   * 
   * // Exemple 1 : Bonus de même catégorie
   * // Damage +20% et +10% (même catégorie → additionner)
   * // Skill +15% (catégorie différente → multiplier)
   * // Total = (1 + 0.20 + 0.10) × (1 + 0.15) = 1.30 × 1.15 = 1.495
   * const mult1 = calculator.calculateBonusMultiplier([
   *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
   *   { category: BonusCategory.DamageIncrease, value: 0.10, source: 'Talent' },
   *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
   * ]);
   * // → 1.495
   *
   * // Exemple 2 : Aucun bonus
   * const mult2 = calculator.calculateBonusMultiplier([]);
   * // → 1.0
   * 
   * // Exemple 3 : Avec debuff (valeur négative)
   * const mult3 = calculator.calculateBonusMultiplier([
   *   { category: BonusCategory.DamageIncrease, value: 0.30, source: 'Buff' },
   *   { category: BonusCategory.DamageIncrease, value: -0.10, source: 'Debuff' },
   * ]);
   * // → 1.20 ((1 + 0.30 - 0.10))
   * 
   * // Exemple 4 : Toutes les catégories
   * const mult4 = calculator.calculateBonusMultiplier([
   *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'A' },
   *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'B' },
   *   { category: BonusCategory.ElementalDamage, value: 0.10, source: 'C' },
   *   { category: BonusCategory.WeaponDamage, value: 0.12, source: 'D' },
   *   { category: BonusCategory.SetBonus, value: 0.08, source: 'E' },
   *   { category: BonusCategory.SpecialCondition, value: 0.25, source: 'F' },
   * ]);
   * // → (1.20 × 1.15 × 1.10 × 1.12 × 1.08 × 1.25) ≈ 2.32
   * ```
   */
  public calculateBonusMultiplier(bonuses: readonly DamageBonus[]): number {
    // Cas trivial : aucun bonus
    if (bonuses.length === 0) {
      return 1.0;
    }

    // 1. Grouper les bonus par catégorie et calculer les sommes
    const categoryMap = new Map<BonusCategory, number>();

    for (const bonus of bonuses) {
      const currentSum = categoryMap.get(bonus.category) || 0;
      categoryMap.set(bonus.category, currentSum + bonus.value);
    }

    // 2. Multiplier les multiplicateurs de chaque catégorie
    let totalMultiplier = 1.0;

    for (const categorySum of categoryMap.values()) {
      const categoryMultiplier = 1 + categorySum;
      totalMultiplier *= categoryMultiplier;
    }

    return totalMultiplier;
  }

  /**
   * Retourne le détail par catégorie (pour breakdown UI).
   *
   * @param bonuses - Liste de bonus
   * @returns Map<BonusCategory, BonusCategoryBreakdown>
   *
   * Utile pour afficher dans l'UI :
   * - "Dégâts généraux : +30% (Arme +20%, Talent +10%)"
   * - "Compétence : +15% (Set bonus)"
   * - "Total : ×1.495"
   *
   * @example
   * ```typescript
   * const calculator = new BonusMultiplierCalculator();
   * 
   * const bonuses: DamageBonus[] = [
   *   { category: BonusCategory.DamageIncrease, value: 0.20, source: 'Arme' },
   *   { category: BonusCategory.DamageIncrease, value: 0.10, source: 'Talent' },
   *   { category: BonusCategory.SkillDamage, value: 0.15, source: 'Set bonus' },
   * ];
   * 
   * const breakdown = calculator.getBreakdown(bonuses);
   * 
   * // DamageIncrease
   * const damageIncrease = breakdown.get(BonusCategory.DamageIncrease);
   * console.log(damageIncrease?.sources.length); // 2
   * console.log(damageIncrease?.sum); // 0.30
   * console.log(damageIncrease?.multiplier); // 1.30
   * 
   * // SkillDamage
   * const skillDamage = breakdown.get(BonusCategory.SkillDamage);
   * console.log(skillDamage?.sources.length); // 1
   * console.log(skillDamage?.sum); // 0.15
   * console.log(skillDamage?.multiplier); // 1.15
   * ```
   */
  public getBreakdown(
    bonuses: readonly DamageBonus[]
  ): Map<BonusCategory, BonusCategoryBreakdown> {
    const breakdown = new Map<BonusCategory, BonusCategoryBreakdown>();

    // Cas trivial : aucun bonus
    if (bonuses.length === 0) {
      return breakdown;
    }

    // Grouper les bonus par catégorie
    const categoryGroupsMap = new Map<BonusCategory, DamageBonus[]>();

    for (const bonus of bonuses) {
      const group = categoryGroupsMap.get(bonus.category) || [];
      group.push(bonus);
      categoryGroupsMap.set(bonus.category, group);
    }

    // Calculer les détails pour chaque catégorie
    for (const [category, sources] of categoryGroupsMap.entries()) {
      const sum = sources.reduce((acc, bonus) => acc + bonus.value, 0);
      const multiplier = 1 + sum;

      breakdown.set(category, {
        sources: Object.freeze([...sources]),
        sum,
        multiplier,
      });
    }

    return breakdown;
  }
}
