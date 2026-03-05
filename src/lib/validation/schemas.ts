/**
 * Schémas Zod — validation des inputs API.
 *
 * Chaque schéma mirore les types TS du codebase
 * (Character.types, Combat.types, Skill.types, EquipmentSet.types, etc.).
 */

import * as z from 'zod';

// ─── Stats personnage (CharacterBaseStats) ─────────────────────────

export const characterBaseStatsSchema = z.object({
  level: z.number().int().min(1).max(100),
  attack: z.number().min(0),
  attackMin: z.number().min(0),
  attackMax: z.number().min(0),
  elementalAttack: z.number().min(0),
  defense: z.number().min(0),
  resistance: z.number(),
  critRate: z.number().min(0),
  critDamage: z.number().min(0),
  affinityRate: z.number().min(0).max(1),
  affinityDamage: z.number().min(0),
  precision: z.number().min(0),
  armorPenetration: z.number().min(0),
  elementalPenetration: z.number().min(0),
});

export type CharacterBaseStatsInput = z.infer<typeof characterBaseStatsSchema>;

// ─── Cible (Target) ────────────────────────────────────────────────

export const targetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  level: z.number().int().min(1).max(200),
  defense: z.number().min(0),
  resistance: z.number(),
  shield: z.number().min(0).max(1),
  parry: z.number().min(0),
  critResistance: z.number().min(0).optional(),
});

export type TargetInput = z.infer<typeof targetSchema>;

// ─── Talent de compétence (SkillTalent) ────────────────────────────

export const skillTalentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  level: z.number().int().min(1).max(10),
  physicalRatioBonus: z.number().optional(),
  elementalRatioBonus: z.number().optional(),
  cooldownReduction: z.number().min(0).optional(),
  castTimeReduction: z.number().min(0).optional(),
  critRateBonus: z.number().min(0).optional(),
});

export type SkillTalentInput = z.infer<typeof skillTalentSchema>;

// ─── Compétence (Skill) ────────────────────────────────────────────

const damageTypeEnum = z.enum(['physical_only', 'elemental_only', 'hybrid']);

const skillCategoryEnum = z.enum([
  'active', 'passive', 'ultimate', 'support', 'mobility', 'crowd_control',
]);

const skillElementEnum = z.enum([
  'none', 'fire', 'ice', 'lightning', 'wind', 'earth', 'poison',
]);

const weaponTypeEnum = z.enum([
  'sword', 'spear', 'bow', 'twin_blade', 'fan', 'rope_dart',
]);

export const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  physicalRatio: z.number().min(0),
  elementalRatio: z.number().min(0),
  cooldown: z.number().min(0),
  castTime: z.number().min(0),
  damageType: damageTypeEnum,
  category: skillCategoryEnum,
  element: skillElementEnum,
  weaponType: weaponTypeEnum.nullable(),
  talents: z.array(skillTalentSchema),
  range: z.number().min(0),
  areaOfEffect: z.number().min(0),
  resourceCost: z.number().min(0).optional(),
  charges: z.number().int().min(1).optional(),
});

export type SkillInput = z.infer<typeof skillSchema>;

// ─── Bonus de dégâts (DamageBonus) ─────────────────────────────────

const damageZoneEnum = z.enum([
  'augmentation', 'independent', 'deepening', 'reduction', 'tuning',
]);

export const damageBonusSchema = z.object({
  category: damageZoneEnum,
  value: z.number(),
  source: z.string().min(1),
  subGroup: z.string().optional(),
});

export type DamageBonusInput = z.infer<typeof damageBonusSchema>;

// ─── Équipement ────────────────────────────────────────────────────

export const equipmentSlotEnum = z.enum([
  'weapon', 'head', 'chest', 'legs', 'feet',
  'ring_1', 'ring_2', 'bracelet_1', 'bracelet_2', 'amulet',
]);

const rarityEnum = z.enum(['common', 'rare', 'epic', 'legendary']);

export const setStatModifierSchema = z.object({
  stat: z.string().min(1),
  value: z.number(),
  isPercentage: z.boolean(),
});

export const equipmentPieceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slot: equipmentSlotEnum,
  setId: z.string().min(1),
  rarity: rarityEnum,
  statModifiers: z.array(setStatModifierSchema),
});

export type EquipmentPieceInput = z.infer<typeof equipmentPieceSchema>;

// ─── Build (create / update) ───────────────────────────────────────

const objectiveEnum = z.enum(['pve', 'pvp']);

const buildEquipmentSchema = z.object({
  slots: z.record(equipmentSlotEnum, equipmentPieceSchema.nullable()).optional(),
  enhanceLevels: z.record(equipmentSlotEnum, z.number().int().min(0).max(15)).optional(),
  harmonisation: z.record(equipmentSlotEnum, z.array(setStatModifierSchema)).optional(),
});

const rotationStepSchema = z.object({
  skillId: z.string().min(1),
  order: z.number().int().min(0),
});

export const createBuildSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  character: z.object({
    level: z.number().int().min(1).max(100),
    weaponId: z.string().min(1),
    innerWayId: z.string().min(1).optional(),
    objective: objectiveEnum,
  }),
  stats: characterBaseStatsSchema,
  target: targetSchema.optional(),
  equipment: buildEquipmentSchema.optional(),
  rotation: z.array(rotationStepSchema).optional(),
  activeBuffs: z.array(z.string().min(1)).optional(),
});

export type CreateBuildInput = z.infer<typeof createBuildSchema>;

export const updateBuildSchema = createBuildSchema.partial();

export type UpdateBuildInput = z.infer<typeof updateBuildSchema>;

// ─── Calcul dégâts (POST /api/calculate/damage) ────────────────────

export const calculateDamageSchema = z.object({
  stats: characterBaseStatsSchema,
  skill: skillSchema,
  target: targetSchema,
  bonuses: z.array(damageBonusSchema).optional(),
});

export type CalculateDamageInput = z.infer<typeof calculateDamageSchema>;

// ─── Calcul rotation (POST /api/calculate/rotation) ────────────────

export const calculateRotationSchema = z.object({
  stats: characterBaseStatsSchema,
  skills: z.array(skillSchema).min(1),
  target: targetSchema,
  duration: z.number().min(1).max(600).default(60).optional(),
  bonuses: z.array(damageBonusSchema).optional(),
  mode: z.enum(['deterministic', 'expected']).default('expected').optional(),
});

export type CalculateRotationInput = z.infer<typeof calculateRotationSchema>;

// ─── Calcul expected value (POST /api/calculate/expected) ──────────

export const calculateExpectedSchema = z.object({
  stats: characterBaseStatsSchema,
  skill: skillSchema,
  target: targetSchema,
  bonuses: z.array(damageBonusSchema).optional(),
});

export type CalculateExpectedInput = z.infer<typeof calculateExpectedSchema>;

// ─── Comparaison builds (POST /api/calculate/compare) ──────────────

const buildForComparisonSchema = z.object({
  name: z.string().min(1),
  stats: characterBaseStatsSchema,
  skills: z.array(skillSchema).min(1),
  bonuses: z.array(damageBonusSchema),
});

export const calculateCompareSchema = z.object({
  build1: buildForComparisonSchema,
  build2: buildForComparisonSchema,
  target: targetSchema,
  duration: z.number().min(1).max(600).optional(),
});

export type CalculateCompareInput = z.infer<typeof calculateCompareSchema>;

// ─── Gains marginaux (POST /api/calculate/marginal) ────────────────

export const calculateMarginalSchema = z.object({
  stats: characterBaseStatsSchema,
  skills: z.array(skillSchema).min(1),
  target: targetSchema,
  bonuses: z.array(damageBonusSchema).optional(),
  duration: z.number().min(1).max(600).optional(),
});

export type CalculateMarginalInput = z.infer<typeof calculateMarginalSchema>;

// ─── Graduation rate (POST /api/calculate/graduation) ──────────────

export const calculateGraduationSchema = z.object({
  yourDPS: z.number().positive(),
  referenceDPS: z.number().positive(),
});

export type CalculateGraduationInput = z.infer<typeof calculateGraduationSchema>;

// ─── Pagination (GET /api/builds) ──────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sort: z.enum(['newest', 'oldest', 'dps']).default('newest').optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
