/**
 * Skill Types for Where Winds Meet Calculator
 * 
 * Defines all skill-related interfaces including skill structure,
 * damage types, skill categories, and talent modifiers.
 * 
 * @module Skill.types
 * @version 1.0.0
 */

import type { WeaponType } from './Character.types';

/**
 * Type de dégâts d'une compétence
 * 
 * Détermine si la compétence inflige des dégâts physiques,
 * élémentaires ou hybrides (les deux). Cette classification
 * affecte les calculs de pool de dégâts.
 * 
 * @enum {string}
 */
export enum DamageType {
  /**
   * Compétence physique pure
   * - physicalRatio > 0
   * - elementalRatio = 0
   * - Seul le pool physique est calculé
   * 
   * @example Coup d'épée basique, attaque de lance
   */
  PhysicalOnly = 'physical_only',

  /**
   * Compétence élémentaire pure
   * - physicalRatio = 0
   * - elementalRatio > 0
   * - Seul le pool élémentaire est calculé
   * 
   * @example Sort de feu, attaque de glace
   */
  ElementalOnly = 'elemental_only',

  /**
   * Compétence hybride
   * - physicalRatio > 0
   * - elementalRatio > 0
   * - Les deux pools sont calculés et additionnés
   * 
   * @example Épée enflammée, lance de foudre
   */
  Hybrid = 'hybrid',
}

/**
 * Catégorie de compétence
 * 
 * Détermine le type de compétence et son comportement dans
 * les rotations et calculs DPS.
 * 
 * @enum {string}
 */
export enum SkillCategory {
  /**
   * Compétence active de base
   * Utilisée régulièrement dans les rotations
   * Cooldown court à moyen (0-10s)
   * 
   * @example Attaque rapide, Combo de base
   */
  Active = 'active',

  /**
   * Compétence passive
   * Bonus permanent sans activation manuelle
   * Pas de cooldown
   * 
   * @example Bonus d'attaque permanent, Résistance accrue
   */
  Passive = 'passive',

  /**
   * Compétence ultime
   * Très puissante avec long cooldown (20-60s)
   * Moment clé des rotations
   * 
   * @example Art mystique (绝技), Compétence signature
   */
  Ultimate = 'ultimate',

  /**
   * Compétence de soutien/buff
   * Améliore les stats ou donne des effets
   * Cooldown moyen (10-30s)
   * 
   * @example Buff d'attaque, Shield temporaire
   */
  Support = 'support',

  /**
   * Compétence de mobilité
   * Déplacement, dash, évasion
   * Cooldown court (5-15s)
   * 
   * @example Dash, Saut en arrière, Téléportation
   */
  Mobility = 'mobility',

  /**
   * Compétence de contrôle
   * Stun, slow, knockback
   * Cooldown moyen (8-20s)
   * 
   * @example Stun, Ralentissement, Projection
   */
  CrowdControl = 'crowd_control',
}

/**
 * Élément d'une compétence
 * 
 * Détermine l'élément des dégâts élémentaires.
 * Certains boss ont des faiblesses élémentaires spécifiques.
 * 
 * @enum {string}
 */
export enum SkillElement {
  /** Pas d'élément (physique pur) */
  None = 'none',
  /** Feu (火) */
  Fire = 'fire',
  /** Glace (冰) */
  Ice = 'ice',
  /** Foudre (雷) */
  Lightning = 'lightning',
  /** Vent (风) */
  Wind = 'wind',
  /** Terre (土) */
  Earth = 'earth',
  /** Poison (毒) */
  Poison = 'poison',
}

/**
 * Talent appliqué à une compétence
 * 
 * Les talents modifient les paramètres d'une compétence
 * (ratios, cooldown, effets additionnels). Un personnage
 * peut débloquer plusieurs talents pour améliorer ses skills.
 * 
 * @interface SkillTalent
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const talent: SkillTalent = {
 *   id: 'talent-001',
 *   name: 'Maîtrise de l\'épée',
 *   description: 'Augmente les dégâts physiques de 15%',
 *   physicalRatioBonus: 0.15,
 *   cooldownReduction: 0,
 * };
 * ```
 */
export interface SkillTalent {
  /**
   * Identifiant unique du talent
   * 
   * @example 'talent-swift-strike-001'
   */
  readonly id: string;

  /**
   * Nom du talent
   * 
   * @example 'Maîtrise de l\'épée'
   */
  readonly name: string;

  /**
   * Description de l'effet du talent
   * 
   * @example 'Augmente les dégâts physiques de 15% et réduit le cooldown de 1s'
   */
  readonly description: string;

  /**
   * Niveau du talent (1-10)
   * Plus le niveau est élevé, plus l'effet est puissant
   * 
   * @default 1
   */
  readonly level: number;

  /**
   * Bonus au ratio physique (en décimal)
   * S'ajoute au physicalRatio de base de la skill
   * 
   * @example 0.15 → +15% de ratio physique
   * @default 0
   */
  readonly physicalRatioBonus?: number;

  /**
   * Bonus au ratio élémentaire (en décimal)
   * S'ajoute au elementalRatio de base de la skill
   * 
   * @example 0.20 → +20% de ratio élémentaire
   * @default 0
   */
  readonly elementalRatioBonus?: number;

  /**
   * Réduction du cooldown (en secondes)
   * Soustrait au cooldown de base de la skill
   * 
   * @example 1.0 → -1s de cooldown
   * @default 0
   */
  readonly cooldownReduction?: number;

  /**
   * Réduction du temps de cast (en secondes)
   * Accélère l'exécution de la compétence
   * 
   * @example 0.5 → -0.5s de cast time
   * @default 0
   */
  readonly castTimeReduction?: number;

  /**
   * Bonus de chance critique (en décimal)
   * S'ajoute au taux de critique du personnage pour cette skill
   * 
   * @example 0.10 → +10% de crit rate
   * @default 0
   */
  readonly critRateBonus?: number;
}

/**
 * Compétence (Skill) complète
 * 
 * Représente une compétence utilisable par un personnage.
 * Contient les ratios de dégâts, les timings (cooldown, cast time),
 * les talents appliqués et les métadonnées.
 * 
 * Les ratios déterminent comment les stats du personnage
 * se transforment en dégâts :
 * - physicalRatio : Multiplicateur de l'attaque physique
 * - elementalRatio : Multiplicateur de l'attaque élémentaire
 * 
 * @interface Skill
 * @readonly Toutes les propriétés sont en lecture seule
 * 
 * @example
 * ```typescript
 * const skill: Skill = {
 *   id: 'skill-001',
 *   name: 'Frappe rapide',
 *   description: 'Attaque physique rapide',
 *   physicalRatio: 1.2,
 *   elementalRatio: 0,
 *   cooldown: 5,
 *   castTime: 0.8,
 *   damageType: DamageType.PhysicalOnly,
 *   category: SkillCategory.Active,
 *   element: SkillElement.None,
 *   weaponType: WeaponType.Sword,
 *   talents: [talent1, talent2],
 *   range: 5,
 *   areaOfEffect: 0,
 * };
 * ```
 */
export interface Skill {
  /**
   * Identifiant unique de la compétence
   * Utilisé pour référencer la skill dans la base de données
   * 
   * @example 'skill-swift-strike-001'
   */
  readonly id: string;

  /**
   * Nom de la compétence
   * 
   * @example 'Frappe rapide', 'Souffle du dragon'
   */
  readonly name: string;

  /**
   * Description de la compétence
   * Explique l'effet et l'utilisation
   * 
   * @example 'Attaque physique rapide qui inflige 120% de dégâts d\'attaque'
   */
  readonly description: string;

  /**
   * Ratio de dégâts physiques
   * 
   * Multiplie l'attaque physique du personnage pour calculer
   * le pool physique de base.
   * 
   * Formule: Base Physical = Attack × physicalRatio
   * 
   * @example 1.2 → 120% de l'attaque physique
   * @example 0 → Pas de composante physique (élémentaire pur)
   */
  readonly physicalRatio: number;

  /**
   * Ratio de dégâts élémentaires
   * 
   * Multiplie l'attaque élémentaire du personnage pour calculer
   * le pool élémentaire de base.
   * 
   * Formule: Base Elemental = Elemental Attack × elementalRatio
   * 
   * @example 0.8 → 80% de l'attaque élémentaire
   * @example 0 → Pas de composante élémentaire (physique pur)
   */
  readonly elementalRatio: number;

  /**
   * Cooldown de la compétence (en secondes)
   * 
   * Temps d'attente avant de pouvoir réutiliser la skill.
   * 0 = pas de cooldown (peut être spam, limité par GCD seulement)
   * 
   * @example 5 → 5 secondes de cooldown
   * @example 0 → Utilisable en continu (limité par GCD 1s)
   */
  readonly cooldown: number;

  /**
   * Temps de cast (en secondes)
   * 
   * Durée d'exécution de la compétence avant qu'elle ne soit effective.
   * S'ajoute au GCD (Global Cooldown de 1s) pour le temps total.
   * 
   * @example 0.8 → 0.8s de cast
   * @example 0 → Instantané
   */
  readonly castTime: number;

  /**
   * Type de dégâts de la compétence
   * Détermine si physique pur, élémentaire pur ou hybride
   */
  readonly damageType: DamageType;

  /**
   * Catégorie de la compétence
   * Détermine le comportement dans les rotations
   */
  readonly category: SkillCategory;

  /**
   * Élément de la compétence
   * Utilisé pour les faiblesses élémentaires des boss
   */
  readonly element: SkillElement;

  /**
   * Type d'arme requise pour utiliser cette compétence
   * null = compétence universelle (arts mystiques, etc.)
   * 
   * @example WeaponType.Sword → Réservé aux épéistes
   * @example null → Utilisable avec n'importe quelle arme
   */
  readonly weaponType: WeaponType | null;

  /**
   * Liste des talents appliqués à cette compétence
   * Les talents modifient les ratios, cooldown et effets
   * 
   * @example [talent1, talent2]
   */
  readonly talents: readonly SkillTalent[];

  /**
   * Portée de la compétence (en mètres)
   * Distance maximale pour toucher une cible
   * 
   * @example 5 → Portée de 5 mètres (mêlée)
   * @example 20 → Portée de 20 mètres (distance)
   */
  readonly range: number;

  /**
   * Rayon de la zone d'effet (en mètres)
   * 0 = cible unique
   * >0 = zone d'effet (AoE) qui touche plusieurs ennemis
   * 
   * @example 0 → Cible unique
   * @example 3 → AoE de 3m de rayon
   */
  readonly areaOfEffect: number;

  /**
   * Coût en ressource (mana, qi, etc.)
   * null = pas de coût
   * 
   * @example 50 → Coûte 50 points de ressource
   * @default null
   */
  readonly resourceCost?: number;

  /**
   * Nombre de charges de la compétence
   * Permet d'utiliser la skill plusieurs fois avant le cooldown
   * 
   * @example 2 → 2 charges, cooldown commence après utilisation de toutes
   * @default 1
   */
  readonly charges?: number;
}
