/**
 * WWM Damage Calculator - Core Types
 * Based on deterministic and EV formula documentation
 */

// ============================================
// STATS & ATTRIBUTES
// ============================================

export interface CharacterStats {
  // Attaque Externe
  attExtMin: number;
  attExtMax: number;
  
  // Attaque Élémentaire/Principale
  attPrincipalMin: number;
  attPrincipalMax: number;
  
  // Taux et bonus
  tauxPrecision: number;      // 0-1
  tauxCrit: number;           // 0-1
  degCrit: number;            // Base 0.5 = +50%
  tauxAffinite: number;       // 0-1
  degAffinite: number;        // Base 0.35 = +35%
  
  // Pénétration
  penetrationPhysique: number;
  penetrationPrincipal: number;
  
  // Résistances
  resistJugement: number;     // Resist to judgment attacks
  
  // Five Dimensions
  force: number;
  agilite: number;
  corps?: number;
  defense?: number;
  puissance?: number;
}

export interface TargetStats {
  defense: number;
  bouclierQi: number;
  resistElem: number;
  resistCrit: number;
  esquive: number;
}

// ============================================
// SKILLS & COEFFICIENTS
// ============================================

export interface SkillCoefficients {
  physicalMultiplier: number;       // M_skill pour physique
  fixedDamage: number;              // Dégâts fixes
  mainAttributeMultiplier: number;  // M_elem_wpn
  external1Multiplier?: number;
  external2Multiplier?: number;
  external3Multiplier?: number;
}

export interface Skill {
  skillId: string;
  skillNameFR: string;
  skillNameEN?: string;
  weaponFR: string;
  coefficients: SkillCoefficients;
  timing?: {
    castTime: number | null;
    expectedDPS: number | null;
  };
  hits?: SkillHit[];
  notes?: string;
  pathInfo?: {
    path: string;
    element: string | null;
    role: string;
  };
}

export interface SkillHit {
  hitIndex: number;
  multiplier: number;
  fixedDamage?: number;
  isElemental?: boolean;
}

// ============================================
// BUFFS & BONUSES
// ============================================

export interface Buff {
  buffId: string;
  buffNameFR: string;
  category: BonusCategory;
  value: number;
  isPercentage: boolean;
  duration?: number;
  maxStacks?: number;
  conditions?: string[];
}

export type BonusCategory = 
  | 'general'           // Bonus_Général
  | 'skill'             // Bonus_Skill
  | 'weapon'            // Bonus_Arme
  | 'special'           // Bonus_Spécial (特殊增伤)
  | 'set'               // Bonus_Set (定音增伤)
  | 'domination'        // Bonus_Domination_% (首领克制%)
  | 'independent';      // Zone indépendante

// ============================================
// INNER WAYS (VOIES INTÉRIEURES)
// ============================================

export interface InnerWay {
  innerWayId: string;
  innerWayNameFR: string;
  innerWayNameEN?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  path: string;
  types: string[];
  baseEffect: string;
  tierBonuses: Record<string, string>;
}

// ============================================
// DAMAGE CALCULATION
// ============================================

export interface DamageResult {
  // Composants
  poolPhysique: number;
  poolElementaire: number;
  reductionDefense: number;
  reductionElem: number;
  
  // Résultats par type de touche
  normal: number;
  critical: number;
  affinity: number;
  criticalAffinity: number;
  abrasion: number;
  
  // Expected Value
  expectedValue: number;
  
  // Breakdown pour debug
  breakdown: DamageBreakdown;
}

export interface DamageBreakdown {
  basePool: number;
  afterShield: number;
  afterDefense: number;
  afterMultiplier: number;
  bonusMultiplier: number;
  finalDamage: number;
}

// ============================================
// HIT TYPES (Système Critique/Affinité)
// ============================================

export type HitType = 
  | 'normal'            // Blanc, ×1.0, roll [Min,Max]
  | 'critical'          // Or, ×1.5, roll [Min,Max]
  | 'affinity'          // Orange, ×1.2, Max
  | 'criticalAffinity'  // Or+Orange, ×1.8, Max
  | 'abrasion';         // Gris, ×0.5, Min

export const HIT_MULTIPLIERS: Record<HitType, number> = {
  normal: 1.0,
  critical: 1.5,
  affinity: 1.2,
  criticalAffinity: 1.8,
  abrasion: 0.5,
};

// ============================================
// LEVEL TEMPLATES
// ============================================

export interface LevelTemplate {
  niveau?: number;
  att_ext_min: number;
  att_ext_max: number;
  taux_precision: number;
  taux_crit: number;
  deg_crit: number;
  taux_affinite: number;
  deg_affinite: number;
  att_principal_min: number;
  att_principal_max: number;
  penetration_principal: number;
  bonus_deg_principal: number;
  resist_jugement?: number;
  force: number;
  agilite: number;
}

// ============================================
// FORMULA CONSTANTS
// ============================================

export const FORMULA_CONSTANTS = {
  /** Constante pour calcul réduction défense */
  DEFENSE_CONSTANT: 2860,
  
  /** Constante pour calcul réduction élémentaire */
  ELEM_RESIST_CONSTANT: 530,
  
  /** Constante pour calcul taux critique */
  CRIT_RATE_CONSTANT: 938,
  
  /** Constante pour calcul taux précision */
  PRECISION_CONSTANT: 3640,
  
  /** C1 - Constante de base (variable selon version) */
  C1: 390,
  
  /** C2 - Coefficient multiplicateur */
  C2: 0.315,
  
  /** Taux de précision de base */
  BASE_PRECISION_RATE: 0.95,
} as const;

// ============================================
// DPS CALCULATION
// ============================================

export interface RotationSkill {
  skill: Skill;
  count: number;        // Nombre d'utilisations
  timing: number;       // Temps total pour ce skill
}

export interface DPSResult {
  totalDamage: number;
  duration: number;
  dps: number;
  skillBreakdown: Array<{
    skillName: string;
    damage: number;
    percentage: number;
  }>;
  graduationRate?: number;  // % par rapport à référence
}

// ============================================
// DATA STORE STATE
// ============================================

export interface CalculatorState {
  // Character
  stats: CharacterStats;
  selectedTemplate: string | null;
  
  // Target
  target: TargetStats;
  
  // Build
  selectedSkills: Skill[];
  activeBuffs: Buff[];
  innerWay: InnerWay | null;
  
  // Results
  lastResult: DamageResult | null;
  
  // Actions
  setStats: (stats: Partial<CharacterStats>) => void;
  setTarget: (target: Partial<TargetStats>) => void;
  addBuff: (buff: Buff) => void;
  removeBuff: (buffId: string) => void;
  selectSkill: (skill: Skill) => void;
  calculate: () => void;
}
