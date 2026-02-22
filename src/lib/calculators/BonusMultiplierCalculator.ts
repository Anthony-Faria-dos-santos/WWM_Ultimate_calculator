/**
 * Calculateur de multiplicateurs de bonus.
 * Agrège les bonus par catégorie (même catégorie = additif, catégories différentes = multiplicatif).
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
