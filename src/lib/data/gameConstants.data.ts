/**
 * WWM Game Constants Data — From NGA Guide
 *
 * Données de jeu fixes : défense monstres, conversions de stats,
 * offset caché d'attribut, valeurs d'affixes, nourriture.
 * Sources : NGA Thread (yoka), Notion Guide Technique Complet.
 *
 * @module data/gameConstants
 * @version 1.0.0
 */

// ============================================================================
// 9 Zones Multiplicatives — Résumé du système
// ============================================================================

/**
 * Les 9 zones multiplicatives du système de dégâts WWM.
 * Se multiplient ENTRE elles. Chaque zone a ses propres règles internes.
 *
 * @see Notion: "1. Formules de Dégâts" — Résumé des 9 Zones
 */
export const DAMAGE_ZONES_META = {
  /** Zone 1: Augmentation (增伤区 A) — ADDITIVE entre buffs → puis multipliée */
  augmentation: { id: 1, nameCN: '增伤区 A', behavior: 'additive_internal' },
  /** Zone 2: Indépendante (独立区) — Chaque source est un multiplicateur SÉPARÉ */
  independent: { id: 2, nameCN: '独立区', behavior: 'multiplicative_per_source' },
  /** Zone 3: Approfondissement (伤害加深区) — Par type attribut, indépendant */
  deepening: { id: 3, nameCN: '伤害加深区', behavior: 'per_attribute_independent' },
  /** Zone 4: Pénétration (穿透区) — (Pén-Rés)/200 ou /100 si positif */
  penetration: { id: 4, nameCN: '穿透区', behavior: 'asymmetric_formula' },
  /** Zone 5: Critique (会心区) — Multiplicateurs dégâts crit */
  critical: { id: 5, nameCN: '会心区', behavior: 'critical_multiplier' },
  /** Zone 6: Précis (会意区) — Multiplicateurs dégâts précis (affinité) */
  affinity: { id: 6, nameCN: '会意区', behavior: 'affinity_multiplier' },
  /** Zone 7: Réduction (减伤区) — MULTIPLICATIVE entre sources */
  reduction: { id: 7, nameCN: '减伤区', behavior: 'multiplicative_reduction' },
  /** Zone 8: Définition (定音区) — Indépendant par compétence */
  tuning: { id: 8, nameCN: '定音区', behavior: 'per_skill_independent' },
  /** Zone 9: Critique/Précis (proportions) — Intégrée dans calcul des proportions */
  proportions: { id: 9, nameCN: '-', behavior: 'integrated_in_proportions' },
} as const;

// ============================================================================
// Défense Monstre par Niveau
// ============================================================================

/**
 * Défense des monstres par niveau de contenu.
 * Utilisé pour le calcul de dégâts bruts : (ATK - Défense) × Mult.
 *
 * @see Notion: "8. Équipements & Affixes" — Défense Monstre
 */
export const MONSTER_DEFENSE_BY_LEVEL: Readonly<Record<number, number>> = {
  70: 0,     // Non documenté
  80: 29,
  85: 270,
  90: 307,
  95: 350,
  100: 405,
} as const;

// ============================================================================
// Cinq Dimensions — Conversions de stats
// ============================================================================

/**
 * Conversions des 5 dimensions (stats principales) vers les stats dérivées.
 * Les décimales sont arrondies vers le HAUT (plafond).
 *
 * @see Notion: "1. Formules de Dégâts" — XII. Cinq Dimensions
 */
export const FIVE_DIMENSIONS = {
  /** 体 (Constitution) : 1 pt = 60 PV */
  constitution: {
    nameCN: '体',
    perPoint: { hp: 60 },
  },
  /** 御 (Défense) : 1 pt = 17 PV + 0.5 Défense */
  defense: {
    nameCN: '御',
    perPoint: { hp: 17, defense: 0.5 },
  },
  /** 敏 (Agilité) : 1 pt = 0.9 Att.Min + 0.076% Critique */
  agility: {
    nameCN: '敏',
    perPoint: { attackMin: 0.9, critRate: 0.00076 },
  },
  /** 势 (Puissance) : 1 pt = 0.9 Att.Max + 0.038% Précis */
  power: {
    nameCN: '势',
    perPoint: { attackMax: 0.9, affinityRate: 0.00038 },
  },
  /** 劲 (Force) : 1 pt = 0.225 Att.Min + 1.36 Att.Max */
  strength: {
    nameCN: '劲',
    perPoint: { attackMin: 0.225, attackMax: 1.36 },
  },
} as const;

/**
 * Bonus d'attaque par niveau (niv 85+).
 * +4 Att.Min + 7 Att.Max par niveau supplémentaire au-dessus de 85.
 *
 * @see Notion: "1. Formules de Dégâts" — Cinq Dimensions note
 */
export const LEVEL_SCALING_85_PLUS = {
  attackMinPerLevel: 4,
  attackMaxPerLevel: 7,
  startLevel: 85,
  roundingMode: 'ceil' as const,
} as const;

// ============================================================================
// Level Offset — Bonus Élémentaire Caché
// ============================================================================

/**
 * Bonus caché d'attaque élémentaire de la voie principale.
 * N'apparaît PAS dans l'interface du jeu.
 *
 * Affecte : Att. élémentaire voie de l'arme principale + weapon skills.
 * N'affecte PAS : Dégâts physiques, attributs hors-voie, DOTs, Arts Mystiques.
 *
 * @see wwm-level-offset-system.md
 * @see Notion: "1. Formules de Dégâts" — Attribut Caché Arts Martiaux
 */
export const HIDDEN_LEVEL_OFFSET: Readonly<Record<number, number>> = {
  70: 80,    // OW9, vérifié NGA (片雲)
  80: 100,   // OW12, estimé
  85: 100,   // OW12 cap Global, Notion: +100
  90: 114.5, // Notion: ~114.5
  95: 129,   // Notion: ~129
  100: 150,  // OW15 CN, Notion: +150
} as const;

// ============================================================================
// Valeurs Max des Affixes par Niveau
// ============================================================================

/**
 * Valeurs maximales des affixes d'équipement par niveau de contenu.
 *
 * @see Notion: "8. Équipements & Affixes" — Valeurs Max
 */
export const AFFIX_MAX_VALUES: Readonly<Record<number, {
  readonly statPoint: number;      // Force/Agilité/Puissance
  readonly attackMinMax: number;   // Att.Min ou Att.Max Physique
  readonly precision: number;      // Précision %
  readonly critRate: number;       // Critique %
  readonly affinityRate: number;   // Précis %
  readonly elemAttack: number;     // Att.Élém Min/Max
  readonly allWeaponDmg: number;   // Aug. Toutes Armes %
  readonly martialArtDmg: number;  // Aug. Art Martial %
  readonly physPen: number;        // Pén.Physique flat
  readonly elemPen: number;        // Pén.Même Élém flat
  readonly tuning: number;         // Définition %
  readonly mysticArtDmg: number;   // Aug.Art Occulte % (×2 slots)
  readonly bossDmg: number;        // Aug.Chef % (×2 slots)
}>> = {
  80: {
    statPoint: 25.1, attackMinMax: 39.6,
    precision: 0.04, critRate: 0.046, affinityRate: 0.022,
    elemAttack: 22.4,
    allWeaponDmg: 0.017, martialArtDmg: 0.032,
    physPen: 5.6, elemPen: 6.6,
    tuning: 0, mysticArtDmg: 0, bossDmg: 0,
  },
  85: {
    statPoint: 29.8, attackMinMax: 47,
    precision: 0.048, critRate: 0.054, affinityRate: 0.028,
    elemAttack: 26.6,
    allWeaponDmg: 0.02, martialArtDmg: 0.038,
    physPen: 6.6, elemPen: 7.6,
    tuning: 0.036, mysticArtDmg: 0.06, bossDmg: 0.02,
  },
  90: {
    statPoint: 34.8, attackMinMax: 54.8,
    precision: 0.056, critRate: 0.064, affinityRate: 0.032,
    elemAttack: 31,
    allWeaponDmg: 0.022, martialArtDmg: 0.044,
    physPen: 7.8, elemPen: 9.2,
    tuning: 0.043, mysticArtDmg: 0.07, bossDmg: 0.024,
  },
  95: {
    statPoint: 40.4, attackMinMax: 63.8,
    precision: 0.066, critRate: 0.074, affinityRate: 0.036,
    elemAttack: 36.2,
    allWeaponDmg: 0.026, martialArtDmg: 0.052,
    physPen: 9, elemPen: 10.8,
    tuning: 0.05, mysticArtDmg: 0.08, bossDmg: 0.026,
  },
  100: {
    statPoint: 49.4, attackMinMax: 77.8,
    precision: 0.08, critRate: 0.09, affinityRate: 0.044,
    elemAttack: 44.2,
    allWeaponDmg: 0.032, martialArtDmg: 0.062,
    physPen: 11, elemPen: 13,
    tuning: 0.06, mysticArtDmg: 0.098, bossDmg: 0.032,
  },
} as const;

// ============================================================================
// Armes & Ornements — Stats de base par niveau
// ============================================================================

/**
 * Stats de base des pièces d'équipement (armes, ornements, résonances).
 *
 * @see Notion: "8. Équipements & Affixes" — Armes & Ornements
 */
export const EQUIPMENT_BASE_STATS: Readonly<Record<number, {
  readonly arsenal: { min: number; max: number };
  readonly weapon: { min: number; max: number };
  readonly ring: { min: number };
  readonly pendant: { max: number };
  readonly resonanceWeapon: { min: number; max: number };
  readonly resonanceRing: { max: number };
  readonly resonancePendant: { max: number };
}>> = {
  95: {
    arsenal: { min: 0, max: 0 }, // Non documenté
    weapon: { min: 53, max: 124 },
    ring: { min: 71 },
    pendant: { max: 106 },
    resonanceWeapon: { min: 97, max: 65 },
    resonanceRing: { max: 129 },
    resonancePendant: { max: 129 },
  },
  100: {
    arsenal: { min: 131, max: 263 },
    weapon: { min: 65, max: 151 },
    ring: { min: 86 },
    pendant: { max: 129 },
    resonanceWeapon: { min: 108, max: 72 },
    resonanceRing: { max: 144 },
    resonancePendant: { max: 144 },
  },
} as const;

// ============================================================================
// Nourriture
// ============================================================================

/**
 * Bonus de nourriture par niveau.
 * ATTENTION : La nourriture ne profite PAS du set Faucon Pèlerin (+10% Att.Phys).
 *
 * @see Notion: "8. Équipements & Affixes" — Nourriture
 */
export const FOOD_BONUSES: Readonly<Record<number, {
  readonly withFalcon: { attackMin: number; attackMax: number };
  readonly withoutFalcon: { attackMin: number; attackMax: number };
}>> = {
  100: {
    withFalcon: { attackMin: 120, attackMax: 240 },
    withoutFalcon: { attackMin: 109.09, attackMax: 218.18 },
  },
} as const;

// ============================================================================
// Proportions de Coups — Formules de référence
// ============================================================================

/**
 * Formules de calcul des proportions de coups.
 * Utilisé par le DamageOutcomeCalculator.
 *
 * CAS 1 (Crit + Précis ≤ 100%) :
 *   PropCrit = Précision × Critique × (1+DégâtsCrit) → utilise ATK moyenne
 *   PropPrécis = Précis × (1+DégâtsPrécis) → utilise ATK Max
 *   PropÉraflure = (1-Précision) × (1-Précis) → utilise ATK Min
 *   PropBlanc = Précision × (1-Critique-Précis) → utilise ATK moyenne
 *
 * CAS 2 (Crit + Précis > 100%) :
 *   Critique effectif = Précision × (1 - Précis)
 *
 * @see Notion: "1. Formules de Dégâts" — Proportions de Coups
 */
export const HIT_PROPORTION_RULES = {
  /** CAS 1 : Crit + Précis ≤ 100% — Standard */
  case1: {
    critEffective: 'precision × critRate',
    affinityEffective: 'affinityRate',
    scratchRate: '(1 - precision) × (1 - affinityRate)',
    whiteRate: 'precision × (1 - critRate - affinityRate)',
  },
  /** CAS 2 : Crit + Précis > 100% — Overflow */
  case2: {
    critEffective: 'precision × (1 - affinityRate)',
  },
  /** Affinité utilise TOUJOURS ATK Max */
  affinityUsesMaxAttack: true,
  /** Éraflure utilise TOUJOURS ATK Min */
  scratchUsesMinAttack: true,
} as const;
