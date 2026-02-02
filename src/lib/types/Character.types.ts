/**
 * Character Types for Where Winds Meet Calculator
 * 
 * Defines all character-related interfaces including base stats,
 * player character, and equipment structures.
 * 
 * @module Character.types
 * @version 1.0.0
 */

/**
 * Stats de base du personnage (niveau 80)
 * 
 * Contient toutes les statistiques de combat fondamentales d'un personnage.
 * Ces stats sont calculées à partir de l'équipement, des voies intérieures,
 * des arts mystiques et des bonus de set.
 * 
 * @interface CharacterBaseStats
 * @readonly Toutes les propriétés sont en lecture seule pour garantir l'immutabilité
 */
export interface CharacterBaseStats {
  /**
   * Niveau du personnage (max 80 pour le contenu actuel)
   */
  readonly level: number;

  /**
   * Attaque physique de base
   * Utilisée pour calculer les dégâts physiques (Pool Physique)
   * 
   * @example 1000
   */
  readonly attack: number;

  /**
   * Attaque physique minimale (pour les calculs avec variance)
   * Certaines compétences utilisent un roll aléatoire entre min et max
   * 
   * @example 950
   */
  readonly attackMin: number;

  /**
   * Attaque physique maximale (pour les calculs avec variance)
   * 
   * @example 1050
   */
  readonly attackMax: number;

  /**
   * Attaque élémentaire
   * Utilisée pour calculer les dégâts élémentaires (Pool Élémentaire)
   * 
   * @example 800
   */
  readonly elementalAttack: number;

  /**
   * Défense du personnage
   * Réduit les dégâts physiques reçus via formule hyperbolique:
   * Réduction = Defense / (Defense + 2860)
   * 
   * @example 500
   */
  readonly defense: number;

  /**
   * Résistance élémentaire
   * Réduit les dégâts élémentaires reçus via formule hyperbolique:
   * Réduction = Resistance / (Resistance + 530)
   * 
   * @example 200
   */
  readonly resistance: number;

  /**
   * Valeur brute de critique (pas un pourcentage)
   * Convertie en taux via formule: 1.15 × (Crit / (Crit + 938))
   * Cap maximum: 80%
   * 
   * @example 600 → ~45% de taux de critique
   */
  readonly critRate: number;

  /**
   * Bonus de dégâts critiques (en décimal)
   * S'ajoute au multiplicateur de base de 1.5
   * 
   * @example 0.5 → Critique fait ×2.0 dégâts (1.5 + 0.5)
   * @example 0.3 → Critique fait ×1.8 dégâts (1.5 + 0.3)
   */
  readonly critDamage: number;

  /**
   * Valeur du taux d'affinité (en décimal, 0-1)
   * Cap maximum: 40% (0.4)
   * L'affinité est un effet secondaire qui augmente les dégâts de 20%
   * 
   * @example 0.25 → 25% de chance de déclencher affinité
   */
  readonly affinityRate: number;

  /**
   * Bonus de dégâts d'affinité (en décimal)
   * S'ajoute au multiplicateur de base de 1.2
   * 
   * @example 0.2 → Affinité fait ×1.4 dégâts (1.2 + 0.2)
   * @example 0.1 → Affinité fait ×1.3 dégâts (1.2 + 0.1)
   */
  readonly affinityDamage: number;

  /**
   * Précision (Toucher)
   * Valeur brute utilisée pour calculer la chance de toucher
   * Formule: 95% × (1.42 × Precision / (Precision + Parry + 150))
   * Cap maximum: 95%
   * 
   * @example 500
   */
  readonly precision: number;

  /**
   * Pénétration d'armure
   * Réduit la défense de la cible avant calcul des dégâts
   * Net Defense = max(0, Target Defense - Armor Penetration)
   * 
   * @example 200
   */
  readonly armorPenetration: number;

  /**
   * Pénétration élémentaire
   * Réduit la résistance élémentaire de la cible avant calcul
   * Net Resistance = max(0, Target Resistance - Elemental Penetration)
   * 
   * @example 150
   */
  readonly elementalPenetration: number;
}

/**
 * Type d'arme utilisée par le personnage
 * Détermine les compétences martiales disponibles
 * 
 * @enum {string}
 */
export enum WeaponType {
  /** Épée (剑) */
  Sword = 'sword',
  /** Lance (枪) */
  Spear = 'spear',
  /** Arc (弓) */
  Bow = 'bow',
  /** Lame jumelle (双刀) */
  TwinBlade = 'twin_blade',
  /** Éventail (扇) */
  Fan = 'fan',
  /** Corde-dard (绳镖) */
  RopeDart = 'rope_dart',
}

/**
 * Style d'art martial du personnage
 * Affecte les compétences disponibles et les synergies
 * 
 * @enum {string}
 */
export enum MartialArtStyle {
  /** Épéiste Céleste (天剑) */
  CelestialSword = 'celestial_sword',
  /** Lancier Dragon (龙枪) */
  DragonSpear = 'dragon_spear',
  /** Archer Vent (风弓) */
  WindBow = 'wind_bow',
  /** Lame Jumelle Rapide (疾刃) */
  SwiftBlade = 'swift_blade',
  /** Éventail Mystique (玄扇) */
  MysticFan = 'mystic_fan',
  /** Corde-dard Mortel (索命) */
  MortalRope = 'mortal_rope',
}

/**
 * Voie intérieure (心法)
 * Système de cultivation qui donne des bonus passifs
 * 
 * @interface InnerWay
 * @todo Sera complété dans un fichier dédié (Phase 2)
 */
export interface InnerWay {
  /** Identifiant unique de la voie intérieure */
  readonly id: string;
  /** Nom de la voie intérieure */
  readonly name: string;
  /** Niveau de maîtrise (1-10) */
  readonly level: number;
}

/**
 * Art mystique (绝技)
 * Compétence spéciale puissante avec cooldown long
 * 
 * @interface MysticArt
 * @todo Sera complété dans Skill.types.ts (Phase 1.1.2)
 */
export interface MysticArt {
  /** Identifiant unique de l'art mystique */
  readonly id: string;
  /** Nom de l'art mystique */
  readonly name: string;
  /** Niveau de maîtrise */
  readonly level: number;
}

/**
 * Arme équipée
 * 
 * @interface Weapon
 * @todo Sera complété dans un fichier dédié (Phase 3)
 */
export interface Weapon {
  /** Identifiant unique de l'arme */
  readonly id: string;
  /** Nom de l'arme */
  readonly name: string;
  /** Type d'arme */
  readonly type: WeaponType;
  /** Qualité/Rareté (ex: Common, Rare, Epic, Legendary) */
  readonly rarity: string;
}

/**
 * Armure équipée
 * 
 * @interface Armor
 * @todo Sera complété dans un fichier dédié (Phase 3)
 */
export interface Armor {
  /** Identifiant unique de l'armure */
  readonly id: string;
  /** Nom de l'armure */
  readonly name: string;
  /** Slot d'armure (Casque, Torse, Jambes, etc.) */
  readonly slot: string;
  /** Qualité/Rareté */
  readonly rarity: string;
}

/**
 * Accessoire équipé (bijoux, talismans)
 * 
 * @interface Accessory
 * @todo Sera complété dans un fichier dédié (Phase 3)
 */
export interface Accessory {
  /** Identifiant unique de l'accessoire */
  readonly id: string;
  /** Nom de l'accessoire */
  readonly name: string;
  /** Type d'accessoire (Ring, Amulet, Bracelet) */
  readonly type: string;
  /** Qualité/Rareté */
  readonly rarity: string;
}

/**
 * Bonus de set d'équipement
 * Activé quand plusieurs pièces du même set sont équipées
 * 
 * @interface SetBonus
 * @todo Sera complété dans un fichier dédié (Phase 2)
 */
export interface SetBonus {
  /** Identifiant unique du set */
  readonly setId: string;
  /** Nom du set */
  readonly setName: string;
  /** Nombre de pièces équipées */
  readonly piecesEquipped: number;
  /** Nombre de pièces requis pour activer le bonus */
  readonly piecesRequired: number;
}

/**
 * Équipement complet du personnage
 * 
 * Contient l'arme, l'armure, les accessoires et les bonus de set actifs.
 * Un personnage peut avoir plusieurs accessoires (anneaux, bracelets, amulette).
 * 
 * @interface Equipment
 * @readonly Toutes les propriétés sont en lecture seule
 */
export interface Equipment {
  /**
   * Arme principale équipée
   * null si aucune arme (combat à mains nues)
   */
  readonly weapon: Weapon | null;

  /**
   * Pièce d'armure équipée
   * null si aucune armure
   * 
   * @todo Devra être étendu en Array<Armor> pour plusieurs slots (Phase 3)
   */
  readonly armor: Armor | null;

  /**
   * Liste des accessoires équipés
   * Maximum: 2 anneaux + 2 bracelets + 1 amulette = 5 accessoires
   * 
   * @example [ring1, ring2, bracelet1, bracelet2, amulet]
   */
  readonly accessories: readonly Accessory[];

  /**
   * Bonus de set actif
   * null si pas de set complet ou set non activé
   * 
   * @example { setId: 'dragon_set', piecesEquipped: 4, piecesRequired: 4 }
   */
  readonly setBonus: SetBonus | null;
}

/**
 * Personnage joueur complet
 * 
 * Représente un personnage avec toutes ses stats, équipement,
 * voies intérieures et arts mystiques. Cette interface est le
 * point d'entrée principal pour tous les calculs de dégâts et DPS.
 * 
 * @interface PlayerCharacter
 * @readonly Toutes les propriétés sont en lecture seule pour immutabilité
 * 
 * @example
 * ```typescript
 * const character: PlayerCharacter = {
 *   id: 'char-001',
 *   name: 'Chen Wei',
 *   baseStats: {
 *     level: 80,
 *     attack: 1200,
 *     elementalAttack: 900,
 *     critRate: 600,
 *     critDamage: 0.5,
 *     // ... autres stats
 *   },
 *   equipment: {
 *     weapon: dragonSpear,
 *     armor: dragonArmor,
 *     accessories: [ring1, ring2],
 *     setBonus: dragonSetBonus,
 *   },
 *   innerWays: [innerWay1, innerWay2],
 *   mysticArts: [mysticArt1],
 *   weaponType: WeaponType.Spear,
 *   martialArtStyle: MartialArtStyle.DragonSpear,
 * };
 * ```
 */
export interface PlayerCharacter {
  /**
   * Identifiant unique du personnage
   * Utilisé pour la base de données et les références
   * 
   * @example 'char-001'
   */
  readonly id: string;

  /**
   * Nom du personnage
   * 
   * @example 'Chen Wei'
   */
  readonly name: string;

  /**
   * Stats de base calculées
   * Inclut toutes les statistiques de combat après application
   * de l'équipement et des bonus
   */
  readonly baseStats: Readonly<CharacterBaseStats>;

  /**
   * Équipement actuellement équipé
   * Contribue aux stats de base via ses bonus
   */
  readonly equipment: Readonly<Equipment>;

  /**
   * Voies intérieures maîtrisées (心法)
   * Système de cultivation donnant des bonus passifs
   * Maximum recommandé: 3-5 voies actives
   * 
   * @example [innerWay1, innerWay2, innerWay3]
   */
  readonly innerWays: readonly InnerWay[];

  /**
   * Arts mystiques appris (绝技)
   * Compétences spéciales puissantes
   * Maximum recommandé: 3-4 arts actifs
   * 
   * @example [mysticArt1, mysticArt2]
   */
  readonly mysticArts: readonly MysticArt[];

  /**
   * Type d'arme utilisée
   * Détermine les compétences martiales disponibles
   */
  readonly weaponType: WeaponType;

  /**
   * Style d'art martial pratiqué
   * Affecte les synergies et bonus de compétences
   */
  readonly martialArtStyle: MartialArtStyle;
}
