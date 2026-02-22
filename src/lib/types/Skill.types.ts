/**
 * Types de compétences — ratios, catégories, cooldowns.
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
 */
 PhysicalOnly = 'physical_only',

 /**
 * Compétence élémentaire pure
 * - physicalRatio = 0
 * - elementalRatio > 0
 * - Seul le pool élémentaire est calculé
 *
 */
 ElementalOnly = 'elemental_only',

 /**
 * Compétence hybride
 * - physicalRatio > 0
 * - elementalRatio > 0
 * - Les deux pools sont calculés et additionnés
 *
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
 */
 Active = 'active',

 /**
 * Compétence passive
 * Bonus permanent sans activation manuelle
 * Pas de cooldown
 *
 */
 Passive = 'passive',

 /**
 * Compétence ultime
 * Très puissante avec long cooldown (20-60s)
 * Moment clé des rotations
 *
 */
 Ultimate = 'ultimate',

 /**
 * Compétence de soutien/buff
 * Améliore les stats ou donne des effets
 * Cooldown moyen (10-30s)
 *
 */
 Support = 'support',

 /**
 * Compétence de mobilité
 * Déplacement, dash, évasion
 * Cooldown court (5-15s)
 *
 */
 Mobility = 'mobility',

 /**
 * Compétence de contrôle
 * Stun, slow, knockback
 * Cooldown moyen (8-20s)
 *
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
 */
export interface SkillTalent {
 /**
 * Identifiant unique du talent
 *
 */
 readonly id: string;

 /**
 * Nom du talent
 *
 */
 readonly name: string;

 /**
 * Description de l'effet du talent
 *
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
 * @default 0
 */
 readonly physicalRatioBonus?: number;

 /**
 * Bonus au ratio élémentaire (en décimal)
 * S'ajoute au elementalRatio de base de la skill
 *
 * @default 0
 */
 readonly elementalRatioBonus?: number;

 /**
 * Réduction du cooldown (en secondes)
 * Soustrait au cooldown de base de la skill
 *
 * @default 0
 */
 readonly cooldownReduction?: number;

 /**
 * Réduction du temps de cast (en secondes)
 * Accélère l'exécution de la compétence
 *
 * @default 0
 */
 readonly castTimeReduction?: number;

 /**
 * Bonus de chance critique (en décimal)
 * S'ajoute au taux de critique du personnage pour cette skill
 *
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
 */
export interface Skill {
 /**
 * Identifiant unique de la compétence
 * Utilisé pour référencer la skill dans la base de données
 *
 */
 readonly id: string;

 /**
 * Nom de la compétence
 *
 */
 readonly name: string;

 /**
 * Description de la compétence
 * Explique l'effet et l'utilisation
 *
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
 */
 readonly elementalRatio: number;

 /**
 * Cooldown de la compétence (en secondes)
 *
 * Temps d'attente avant de pouvoir réutiliser la skill.
 * 0 = pas de cooldown (peut être spam, limité par GCD seulement)
 *
 */
 readonly cooldown: number;

 /**
 * Temps de cast (en secondes)
 *
 * Durée d'exécution de la compétence avant qu'elle ne soit effective.
 * S'ajoute au GCD (Global Cooldown de 1s) pour le temps total.
 *
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
 */
 readonly weaponType: WeaponType | null;

 /**
 * Liste des talents appliqués à cette compétence
 * Les talents modifient les ratios, cooldown et effets
 *
 */
 readonly talents: readonly SkillTalent[];

 /**
 * Portée de la compétence (en mètres)
 * Distance maximale pour toucher une cible
 *
 */
 readonly range: number;

 /**
 * Rayon de la zone d'effet (en mètres)
 * 0 = cible unique
 * >0 = zone d'effet (AoE) qui touche plusieurs ennemis
 *
 */
 readonly areaOfEffect: number;

 /**
 * Coût en ressource (mana, qi, etc.)
 * null = pas de coût
 *
 * @default null
 */
 readonly resourceCost?: number;

 /**
 * Nombre de charges de la compétence
 * Permet d'utiliser la skill plusieurs fois avant le cooldown
 *
 * @default 1
 */
 readonly charges?: number;
}
