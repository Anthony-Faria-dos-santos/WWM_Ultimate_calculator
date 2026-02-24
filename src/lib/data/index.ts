/**
 * WWM Game Data — Barrel Export
 *
 * Données de jeu pour le calculateur WWM :
 * - 12 armes d'arts martiaux avec talents
 * - 13 sets d'équipement avec bonus par palier
 *
 * @module data
 * @version 1.0.0
 */

// ─── Weapons ────────────────────────────────────────────────────────────────

export {
  // Individual weapon exports
  NAMELESS_SWORD,
  NAMELESS_SPEAR,
  STRATEGIC_SWORD,
  HEAVENQUAKER_SPEAR,
  PANACEA_FAN,
  SOULSHADE_UMBRELLA,
  INKWELL_FAN,
  VERNAL_UMBRELLA,
  INFERNAL_TWINBLADES,
  MORTAL_ROPE_DART,
  STORMBREAKER_BLADE,
  THUNDERCRY_BLADE,
  // Collection exports
  ALL_WEAPONS,
  WEAPONS_BY_PATH,
  DATA_COMPLETENESS_SUMMARY,
} from './weapons.data';

// ─── Equipment Sets ─────────────────────────────────────────────────────────

export {
  // Individual set exports
  SET_PEREGRINE_FALCON,
  SET_SHATTERED_STONE,
  SET_TIMELY_RAIN,
  SET_JADE_CUP,
  SET_WASHED_BLOSSOM,
  SET_CHAINED_STAR,
  SET_YUE_MOUNTAIN,
  SET_BROKEN_CLIFF,
  SET_TRAVELERS_RETURN,
  SET_LIGHT_SHADOW,
  SET_SMOKY_WILLOW,
  SET_CROSSWISE,
  SET_APRICOT_BLOSSOM,
  // Collection exports
  ALL_EQUIPMENT_SETS,
  META_SETS_BY_BUILD,
} from './equipmentSets.data';

// ─── Game Constants ─────────────────────────────────────────────────────────

export {
  DAMAGE_ZONES_META,
  MONSTER_DEFENSE_BY_LEVEL,
  FIVE_DIMENSIONS,
  LEVEL_SCALING_85_PLUS,
  HIDDEN_LEVEL_OFFSET,
  AFFIX_MAX_VALUES,
  EQUIPMENT_BASE_STATS,
  FOOD_BONUSES,
  HIT_PROPORTION_RULES,
} from './gameConstants.data';
