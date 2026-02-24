/**
 * WWM Equipment Sets Data
 *
 * Données des sets d'équipement et leurs bonus par palier.
 * Sources : NGA Thread (yoka), Notion Guide Technique Complet.
 *
 * ⚠️ NAMING CONVENTION :
 * - id/name : Noms EN (descriptif, pas officiel car noms EN non standardisés)
 * - nameCN : Noms CN officiels (NGA)
 * - nameFR : Noms FR issus du guide — marqués [?] si non vérifiés in-game
 *
 * Les valeurs numériques proviennent du guide NGA niveau 100.
 *
 * @module data/equipmentSets
 * @version 1.0.0
 */

import type { EquipmentSetDefinition } from '../types/EquipmentSet.types';

// ============================================================================
// 1. Faucon Pèlerin (飞隼) — Peregrine Falcon
// ============================================================================

export const SET_PEREGRINE_FALCON: EquipmentSetDefinition = {
  id: 'peregrine_falcon',
  name: 'Peregrine Falcon',
  nameFR: '[?] Faucon Pèlerin',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [],
      damageZone: 'AffinityRateBonus',
      damageValue: 0.045, // +4.5% Précis (niv 100)
      condition: null,
      description: '+4.5% Affinity Rate',
    },
    {
      piecesRequired: 4,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'attack', value: 0.10, isPercentage: true },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+10% Physical Attack. WARNING: Food NOT affected by this bonus',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 2. Pierre Brisée (断石) — Shattered Stone
// ============================================================================

export const SET_SHATTERED_STONE: EquipmentSetDefinition = {
  id: 'shattered_stone',
  name: 'Shattered Stone',
  nameFR: '[?] Pierre Brisée',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'physicalPenetration', value: 25, isPercentage: false },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+25 Physical Penetration',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'CritDamageBonus',
      damageValue: 0.25, // +25% Crit DMG
      condition: null,
      description: '+25% Critical Damage',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 3. Pluie du Temps (时雨) — Timely Rain
// ============================================================================

export const SET_TIMELY_RAIN: EquipmentSetDefinition = {
  id: 'timely_rain',
  name: 'Timely Rain',
  nameFR: '[?] Pluie du Temps',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [],
      damageZone: 'PrecisionRate',
      damageValue: 0.08, // +8% Précision (niv 100)
      condition: null,
      description: '+8% Precision Rate',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'CritDamageBonus',
      damageValue: 0.25, // +25% Dég.Crit (plein bouclier)
      condition: { type: 'resource_threshold', description: 'Full shield stacks', multiplier: 1.0 },
      description: '+25% Crit DMG (full shield) / +10% without shield',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 4. Coupe de Jade (玉斗) — Jade Cup
// ============================================================================

export const SET_JADE_CUP: EquipmentSetDefinition = {
  id: 'jade_cup',
  name: 'Jade Cup',
  nameFR: '[?] Coupe de Jade',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'attackMax', value: 78, isPercentage: false },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+78 Max Physical Attack',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'AffinityDamageBonus',
      damageValue: 0.10, // +10% Dég.Précis + 7.5% Précis Direct
      condition: null,
      description: '+7.5% Affinity Rate Direct + 10% Affinity Damage',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 5. Fleur Lavée (浣花) — Washed Blossom
// ============================================================================

export const SET_WASHED_BLOSSOM: EquipmentSetDefinition = {
  id: 'washed_blossom',
  name: 'Washed Blossom',
  nameFR: '[?] Fleur Lavée',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [],
      damageZone: 'BaseStats',
      damageValue: 0.09, // +9% Critique (niv 100)
      condition: null,
      description: '+9% Critical Rate',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'CritDamageBonus',
      damageValue: 0.15, // +15% Dég.Crit + 5% Critique
      condition: null,
      description: '+5% Crit Rate + 15% Crit Damage',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 6. Étoile Enchaînée (连星) — Chained Star
// ============================================================================

export const SET_CHAINED_STAR: EquipmentSetDefinition = {
  id: 'chained_star',
  name: 'Chained Star',
  nameFR: '[?] Étoile Enchaînée',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'attackMin', value: 78, isPercentage: false },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+78 Min Physical Attack',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.17, // ~17% Aug.Art Martial (à 5.5m)
      condition: { type: 'combat_state', description: 'Within 5.5m of target', multiplier: 1.0 },
      description: '~17% Martial Art DMG increase (within 5.5m)',
    },
  ],
  dataCompleteness: 'complete',
};

// ============================================================================
// 7. Montagne Yue (岳山) — Yue Mountain
// ============================================================================

export const SET_YUE_MOUNTAIN: EquipmentSetDefinition = {
  id: 'yue_mountain',
  name: 'Yue Mountain',
  nameFR: '[?] Montagne Yue',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'attackMin', value: 78, isPercentage: false },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+78 Min Physical Attack',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.0425, // ~4.25% espérance (plein PV=10%, paliers dégressifs)
      condition: null,
      description: '~4.25% avg DMG increase (10% at full HP, degressive)',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 8. Falaise Brisée (断岳) — Broken Cliff
// ============================================================================

export const SET_BROKEN_CLIFF: EquipmentSetDefinition = {
  id: 'broken_cliff',
  name: 'Broken Cliff',
  nameFR: '[?] Falaise Brisée',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'stat',
      statModifiers: [
        { stat: 'attackMin', value: 78, isPercentage: false },
      ],
      damageZone: null,
      damageValue: 0,
      condition: null,
      description: '+78 Min Physical Attack',
    },
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.05, // +5% générale (ou 10% spécial)
      condition: null,
      description: '+5% general DMG (10% special, but Timely Rain better by 0.4%)',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 9. Retour du Voyageur (征人归) — Traveler's Return
// ============================================================================

export const SET_TRAVELERS_RETURN: EquipmentSetDefinition = {
  id: 'travelers_return',
  name: "Traveler's Return",
  nameFR: '[?] Retour du Voyageur',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.08, // +8% Zone Aug. A
      condition: null,
      description: '+8% General Damage Increase',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 10. Clarté Obscure (明晦) — Light & Shadow
// ============================================================================

export const SET_LIGHT_SHADOW: EquipmentSetDefinition = {
  id: 'light_shadow',
  name: 'Light & Shadow',
  nameFR: '[?] Clarté Obscure',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.078, // +7.8% Dégâts directs
      condition: null,
      description: '+7.8% Direct Damage (Zone Aug. A)',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 11. Saule Fumé (烟柳) — Smoky Willow
// ============================================================================

export const SET_SMOKY_WILLOW: EquipmentSetDefinition = {
  id: 'smoky_willow',
  name: 'Smoky Willow',
  nameFR: '[?] Saule Fumé',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 2,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.12, // +12% Aug. léger/lourd
      condition: { type: 'skill_usage', description: 'Light/Heavy attack only', multiplier: 1.0 },
      description: '+12% Light/Heavy Attack DMG (Zone Aug. A)',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 12. Transversal (纵横) — Crosswise
// ============================================================================

export const SET_CROSSWISE: EquipmentSetDefinition = {
  id: 'crosswise',
  name: 'Crosswise',
  nameFR: '[?] Transversal',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'GeneralDamageIncrease',
      damageValue: 0.15, // +15% explosion sang
      condition: { type: 'skill_usage', description: 'Blood explosion only', multiplier: 1.0 },
      description: '+15% Blood Explosion DMG (Zone Aug. A)',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// 13. Abricot (杏花) — Apricot Blossom
// ============================================================================

export const SET_APRICOT_BLOSSOM: EquipmentSetDefinition = {
  id: 'apricot_blossom',
  name: 'Apricot Blossom',
  nameFR: '[?] Fleur d\'Abricotier',
  totalPieces: 6,
  tierBonuses: [
    {
      piecesRequired: 4,
      bonusType: 'damage',
      statModifiers: [],
      damageZone: 'CriticalHealBonus',
      damageValue: 0.24, // +24% Aug. Soins Générale
      condition: null,
      description: '+24% General Healing Increase',
    },
  ],
  dataCompleteness: 'partial',
};

// ============================================================================
// BARREL EXPORT — All sets
// ============================================================================

/** All equipment sets indexed by ID */
export const ALL_EQUIPMENT_SETS: ReadonlyMap<string, EquipmentSetDefinition> = new Map([
  ['peregrine_falcon', SET_PEREGRINE_FALCON],
  ['shattered_stone', SET_SHATTERED_STONE],
  ['timely_rain', SET_TIMELY_RAIN],
  ['jade_cup', SET_JADE_CUP],
  ['washed_blossom', SET_WASHED_BLOSSOM],
  ['chained_star', SET_CHAINED_STAR],
  ['yue_mountain', SET_YUE_MOUNTAIN],
  ['broken_cliff', SET_BROKEN_CLIFF],
  ['travelers_return', SET_TRAVELERS_RETURN],
  ['light_shadow', SET_LIGHT_SHADOW],
  ['smoky_willow', SET_SMOKY_WILLOW],
  ['crosswise', SET_CROSSWISE],
  ['apricot_blossom', SET_APRICOT_BLOSSOM],
]);

/** Sets commonly used in level 100 builds (from NGA DPS ranking) */
export const META_SETS_BY_BUILD: ReadonlyMap<string, readonly string[]> = new Map([
  ['dust_star', ['chained_star']],
  ['nameless', ['peregrine_falcon', 'jade_cup']],
  ['jade_cup_build', ['peregrine_falcon']],
  ['stone_steel_cl', ['timely_rain', 'shattered_stone']],
  ['stone_steel_ll', ['timely_rain', 'shattered_stone']],
  ['stone_heroic', ['timely_rain']],
  ['nine_sword_spear', ['peregrine_falcon']],
  ['twin_blades', ['peregrine_falcon']],
  ['pure_heal', ['washed_blossom']],
  ['fire_fist', ['timely_rain', 'peregrine_falcon']],
]);
