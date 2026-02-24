/**
 * Types d'arts martiaux — talents, armes, voies, formules de scaling.
 */

// ─── Enums ───────────────────────────────────────────────────────────

/**
 * Voie d'art martial (Path)
 * Chaque voie contient 2 armes (1 principale + 1 complémentaire)
 */
export enum MartialArtPath {
 BellstrikeSplendor = 'BellstrikeSplendor',
 BellstrikeUmbra = 'BellstrikeUmbra',
 SilkbindDeluge = 'SilkbindDeluge',
 SilkbindJade = 'SilkbindJade',
 BamboocutWind = 'BamboocutWind',
 StonesplitMight = 'StonesplitMight',
}

/**
 * Type d'attribut élémentaire lié à la voie
 * Détermine quelles pénétrations/attaques d'attribut s'appliquent
 */
export enum AttributeType {
 Bellstrike = 'Bellstrike',
 Silkbind = 'Silkbind',
 Bamboocut = 'Bamboocut',
 Stonesplit = 'Stonesplit',
}

/**
 * Stat utilisée pour le scaling d'un talent
 * Chaque talent scale avec une stat spécifique du personnage
 */
export type TalentScalingStat =
 | 'maxPhysicalAttack'
 | 'minPhysicalAttack'
 | 'agility'
 | 'momentum' // Élan
 | 'body' // Corps
 | 'power' // Puissance
 | 'maxHP'
 | 'maxAttributeAttack' // Bellstrike/Bamboocut/Stonesplit/Silkbind Max
 | 'minAttributeAttack'; // Bellstrike/Bamboocut/Stonesplit/Silkbind Min

/**
 * Zone de dégâts dans la formule à 10 zones
 *
 * Détermine OÙ dans le pipeline de calcul le talent injecte son bonus.
 * Critique pour le bon ordre de résolution.
 */
export type TalentDamageZone =
 | 'GeneralDamageIncrease' // Additif intra-zone, multiplicatif inter-zones
 | 'BaseStats' // Modifie stats de base AVANT calcul
 | 'AttributePenetration' // Réduit défense/résistance nette de la cible
 | 'AttributeDamageBonus' // Bonus dégâts d'attribut (multiplicatif per-element)
 | 'CritDamageBonus' // Additif avec Crit DMG base (1.5 + bonus)
 | 'AffinityDamageBonus' // Bonus dégâts affinité (multiplicatif indépendant)
 | 'AffinityRateBonus' // Additif sur Affinity Rate
 | 'SkillDamageBonus' // Bonus spécifique à un type de skill
 | 'SpecialMultiplier' // Conditionnels complexes (Bone Corrosion, Bleed burst)
 | 'PrecisionRate' // Additif sur Precision Rate
 | 'CriticalHealBonus' // N/A pour DPS (heal uniquement)
 | 'Utility' // Esquive, Endurance, survie (pas de zone de dégâts)
 | 'HealingResource'; // Dewdrops, etc.

// ─── Interfaces ──────────────────────────────────────────────────────

/**
 * Condition d'activation d'un talent
 *
 * Certains talents ne s'activent que sous conditions spécifiques.
 * Le CombatContext doit être évalué à chaque step de simulation.
 */
export interface TalentCondition {
 readonly type:
 | 'targetQiBelow' // Qi cible < threshold (ex: <40%)
 | 'targetExhausted' // Cible en état "Exhausted"
 | 'duringSkill' // Pendant l'exécution d'un skill spécifique
 | 'chargedSkill' // Uniquement pour les compétences chargées
 | 'hpBelow' // HP personnage < threshold
 | 'always'; // Toujours actif
 readonly threshold?: number;
 readonly skillName?: string;
}

/**
 * Formule de scaling d'un talent
 *
 * Décrit comment une stat du personnage affecte la valeur du bonus.
 * Pattern universel : bonus = baseValue + (stat / scalingUnit) × perStatPoint
 * Capé à maxBonus quand stat >= statCap.
 */
export interface TalentScalingFormula {
 readonly scalingStat: TalentScalingStat;
 /** Bonus de base avant scaling (ex: +10%) */
 readonly baseValue: number;
 /** Bonus par unité de stat (ex: +2% par 100 ATK) */
 readonly perStatPoint: number;
 /** Cap de la stat au-delà duquel le bonus ne monte plus */
 readonly statCap: number;
 /** Bonus maximum atteint au cap */
 readonly maxBonus: number;
 /** Unité de scaling (ex: 100 = per 100 ATK) */
 readonly scalingUnit: number;
}

/**
 * Talent d'art martial individuel
 *
 * Représente un talent dans l'arbre d'une arme.
 * Chaque arme a 5-7 talents débloqués progressivement via Breakthrough.
 */
export interface MartialArtTalent {
 readonly id: string;
 readonly name: string;
 readonly nameFR: string;
 readonly description: string;
 readonly descriptionFR: string;
 /** Niveau actuel du talent (1-10) */
 readonly level: number;
 /** Niveau maximum (typiquement 10) */
 readonly maxLevel: number;
 /** Tier de Breakthrough requis (0 = base, 1-3+ = tiers) */
 readonly breakthroughTier: number;
 /** Zone de dégâts affectée dans la formule */
 readonly damageZone: TalentDamageZone;
 /** Formule de scaling (null si bonus flat ou utilitaire) */
 readonly scaling: TalentScalingFormula | null;
 /** Bonus flat (ex: +59-118 ATK Bamboocut) */
 readonly flatBonus: {
 readonly min: number;
 readonly max: number;
 readonly stat: string;
 } | null;
 /** Condition d'activation (null = toujours actif) */
 readonly condition: TalentCondition | null;
 /** Talent passif (Talent 7 souvent) */
 readonly isPassive: boolean;
 /** Niveau Solo Mode requis (null = pas de requis) */
 readonly soloModeRequirement: number | null;
 /** Complétude des données (permet fallback gracieux) */
 readonly dataCompleteness: 'complete' | 'partial' | 'minimal';
}

/**
 * Arme d'art martial avec ses talents
 *
 * Représente une arme complète avec tous ses talents.
 * 12 armes au total, 2 par voie (Path).
 */
export interface MartialArtWeapon {
 readonly id: string;
 readonly name: string;
 readonly nameFR: string;
 readonly path: MartialArtPath;
 readonly attributeType: AttributeType;
 readonly weaponType: string; // 'Sword' | 'Spear' | 'TwinBlades' | 'RopeDart' | 'Fan' | 'Umbrella' | 'MoBlade'
 /** Niveau max de l'arme (85 OW12 Global, 100 OW15 CN) */
 readonly maxLevel: number;
 readonly talents: readonly MartialArtTalent[];
 /** Ressource spéciale (Fighting Spirit, Blossom, Dewdrops) */
 readonly specialResource: string | null;
 /** Complétude globale des données de cette arme */
 readonly dataCompleteness: 'complete' | 'partial' | 'minimal';
}

/**
 * Bonus résolu d'un talent (après évaluation des conditions et scaling)
 *
 * Produit par le TalentBonusResolver. Consommé par le pipeline de calcul.
 * Chaque ResolvedTalentBonus sait exactement OÙ il s'injecte.
 */
export interface ResolvedTalentBonus {
 readonly talentId: string;
 readonly talentName: string;
 readonly damageZone: TalentDamageZone;
 /** Valeur calculée du bonus (en décimal, ex: 0.20 = +20%) */
 readonly value: number;
 /** Le bonus est-il actif (conditions remplies) ? */
 readonly isActive: boolean;
 /** Source pour le breakdown UI */
 readonly source: string;
 /** Données incomplètes ? (warning pour l'UI) */
 readonly isEstimated: boolean;
}
