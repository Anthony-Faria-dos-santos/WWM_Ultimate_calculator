/**
 * Calculateur de multiplicateurs de bonus par zone.
 *
 * Implémente le système à 9 zones multiplicatives de WWM.
 * Ce calculateur gère les 5 zones de type "bonus" :
 *   - Zones 4 (pénétration), 5 (critique), 6 (affinité), 9 (proportions)
 *     sont gérées par les calculateurs spécialisés existants.
 *
 * Règle fondamentale : 同类相加，异类相乘
 *   (Même zone = additionner, zones différentes = multiplier)
 *
 * @see DAMAGE_ZONES_META dans gameConstants.data.ts
 */

// ============================================================================
// Enums & Types
// ============================================================================

/**
 * Les 5 zones de bonus gérées par ce calculateur.
 * Chaque zone a un comportement d'agrégation interne spécifique.
 * Les zones se multiplient ENTRE elles.
 */
export enum DamageZone {
  /** Zone 1 — Augmentation (增伤区 A) : ADDITIF interne → (1 + somme) */
  Augmentation = 'augmentation',
  /** Zone 2 — Indépendante (独立区) : MULTIPLICATIF par source */
  Independent = 'independent',
  /** Zone 3 — Approfondissement (伤害加深区) : Par attribut, indépendant */
  Deepening = 'deepening',
  /** Zone 7 — Réduction (减伤区) : MULTIPLICATIF entre sources */
  Reduction = 'reduction',
  /** Zone 8 — Définition (定音区) : Par compétence, indépendant */
  Tuning = 'tuning',
}

/**
 * @deprecated Alias de compatibilité. Utiliser DamageZone.
 * Mapping vers les zones correctes du jeu.
 */
export const BonusCategory = {
  DamageIncrease: DamageZone.Augmentation,
  SkillDamage: DamageZone.Augmentation,
  ElementalDamage: DamageZone.Deepening,
  WeaponDamage: DamageZone.Augmentation,
  SetBonus: DamageZone.Augmentation,
  SpecialCondition: DamageZone.Independent,
} as const;

/** @deprecated Utiliser DamageZone */
export type BonusCategory = DamageZone;

/**
 * Sous-groupe optionnel pour les zones qui agrègent par sous-catégorie.
 * - Zone Deepening : sous-groupe = type d'attribut ('bellstrike', 'bamboocut', etc.)
 * - Zone Tuning : sous-groupe = id de compétence
 */
export type BonusSubGroup = string;

/**
 * Un bonus individuel de dégâts, assigné à une zone.
 */
export interface DamageBonus {
  /** Zone de dégâts (détermine le groupement et le comportement d'agrégation) */
  readonly category: DamageZone;
  /** Valeur du bonus en décimal (0.2 = +20%) */
  readonly value: number;
  /** Source du bonus pour le breakdown UI */
  readonly source: string;
  /** Sous-groupe optionnel (attribut pour Deepening, skill pour Tuning) */
  readonly subGroup?: BonusSubGroup;
}

/**
 * Détail d'une zone pour le breakdown UI.
 */
export interface ZoneBreakdown {
  /** Zone concernée */
  readonly zone: DamageZone;
  /** Liste des bonus individuels dans cette zone */
  readonly sources: readonly DamageBonus[];
  /** Multiplicateur final de la zone (après agrégation interne) */
  readonly multiplier: number;
}

/** @deprecated Utiliser ZoneBreakdown */
export type BonusCategoryBreakdown = ZoneBreakdown;

