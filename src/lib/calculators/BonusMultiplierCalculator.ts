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
  /** Somme brute des valeurs de bonus dans la zone */
  readonly sum: number;
  /** Liste des bonus individuels dans cette zone */
  readonly sources: readonly DamageBonus[];
  /** Multiplicateur final de la zone (après agrégation interne) */
  readonly multiplier: number;
}

/** @deprecated Utiliser ZoneBreakdown */
export type BonusCategoryBreakdown = ZoneBreakdown;

// ============================================================================
// Classe principale
// ============================================================================

/**
 * Calculateur de multiplicateurs par zone de dégâts.
 *
 * Gère 5 zones de bonus (1, 2, 3, 7, 8).
 * Les zones 4 (pénétration), 5 (critique), 6 (affinité) et 9 (proportions)
 * sont traitées par les calculateurs spécialisés respectifs.
 *
 * Agrégation interne par zone :
 * - Augmentation (1) : additive → (1 + ΣV)
 * - Independent (2) : chaque source → ∏(1 + V_i)
 * - Deepening (3) : par sous-groupe attribut, additive intra, multiplicative inter
 * - Reduction (7) : multiplicative → ∏(1 + V_i), V_i négatif = réduction
 * - Tuning (8) : par sous-groupe skill, additive intra, multiplicative inter
 *
 * Agrégation inter-zones : multiplicative → ∏(zone_j)
 */
export class BonusMultiplierCalculator {
  /**
   * Calcule le multiplicateur total à partir d'une liste de bonus.
   *
   * @param bonuses - Liste de bonus assignés à leurs zones respectives
   * @returns Multiplicateur total (produit de tous les multiplicateurs de zone)
   */
  public calculateBonusMultiplier(bonuses: readonly DamageBonus[]): number {
    if (bonuses.length === 0) return 1.0;

    const grouped = this.groupByZone(bonuses);
    let total = 1.0;

    for (const [zone, zoneBonuses] of grouped) {
      total *= this.computeZoneMultiplier(zone, zoneBonuses);
    }

    return total;
  }

  /**
   * Retourne le détail par zone pour l'affichage UI.
   *
   * @param bonuses - Liste de bonus
   * @returns Map zone → détail (somme, multiplicateur, sources)
   */
  public getBreakdown(
    bonuses: readonly DamageBonus[]
  ): Map<DamageZone, ZoneBreakdown> {
    if (bonuses.length === 0) return new Map();

    const grouped = this.groupByZone(bonuses);
    const result = new Map<DamageZone, ZoneBreakdown>();

    for (const [zone, zoneBonuses] of grouped) {
      const sum = zoneBonuses.reduce((acc, b) => acc + b.value, 0);
      const multiplier = this.computeZoneMultiplier(zone, zoneBonuses);
      result.set(zone, { zone, sum, multiplier, sources: zoneBonuses });
    }

    return result;
  }

  /**
   * Calcule le multiplicateur interne d'une zone selon son comportement.
   *
   * @param zone - Identifiant de zone
   * @param bonuses - Bonus appartenant à cette zone
   * @returns Multiplicateur de la zone
   */
  private computeZoneMultiplier(
    zone: DamageZone,
    bonuses: readonly DamageBonus[]
  ): number {
    switch (zone) {
      case DamageZone.Augmentation:
        return 1 + bonuses.reduce((sum, b) => sum + b.value, 0);

      case DamageZone.Independent:
        return bonuses.reduce((product, b) => product * (1 + b.value), 1);

      case DamageZone.Deepening:
      case DamageZone.Tuning:
        return this.computeSubGroupMultiplier(bonuses);

      case DamageZone.Reduction:
        return bonuses.reduce((product, b) => product * (1 + b.value), 1);

      default:
        return 1.0;
    }
  }

  /**
   * Agrège par sous-groupe : additive intra-groupe, multiplicative inter-groupes.
   * Utilisé par Deepening (sous-groupe = attribut) et Tuning (sous-groupe = skill).
   *
   * @param bonuses - Bonus avec subGroup optionnel
   * @returns Multiplicateur combiné des sous-groupes
   */
  private computeSubGroupMultiplier(bonuses: readonly DamageBonus[]): number {
    const DEFAULT_GROUP = '__default__';
    const subGroups = new Map<string, number>();

    for (const bonus of bonuses) {
      const group = bonus.subGroup ?? DEFAULT_GROUP;
      subGroups.set(group, (subGroups.get(group) ?? 0) + bonus.value);
    }

    let result = 1.0;
    for (const sum of subGroups.values()) {
      result *= 1 + sum;
    }
    return result;
  }

  /**
   * Regroupe les bonus par zone.
   *
   * @param bonuses - Liste de bonus
   * @returns Map zone → liste de bonus
   */
  private groupByZone(
    bonuses: readonly DamageBonus[]
  ): Map<DamageZone, DamageBonus[]> {
    const groups = new Map<DamageZone, DamageBonus[]>();

    for (const bonus of bonuses) {
      const existing = groups.get(bonus.category);
      if (existing) {
        existing.push(bonus);
      } else {
        groups.set(bonus.category, [bonus]);
      }
    }

    return groups;
  }
}

