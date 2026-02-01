/**
 * WWM Damage Calculator - Core Formulas
 * 
 * Implements the deterministic and expected value formulas
 * from WWM_Damage_Calc_Deterministe.docx and WWM_Damage_Calc_ExpectedValue.docx
 * 
 * IMPORTANT: Ces formules ont été vérifiées par la communauté CN
 * (白宝正不正, 清纯男大阿娟, 星语困)
 */

import {
  CharacterStats,
  TargetStats,
  Skill,
  Buff,
  DamageResult,
  HitType,
  HIT_MULTIPLIERS,
  FORMULA_CONSTANTS,
  BonusCategory,
} from '../types';

const {
  DEFENSE_CONSTANT,
  ELEM_RESIST_CONSTANT,
  CRIT_RATE_CONSTANT,
  PRECISION_CONSTANT,
  BASE_PRECISION_RATE,
} = FORMULA_CONSTANTS;

// ============================================
// POOL CALCULATIONS
// ============================================

/**
 * Calcule le pool d'attaque de base
 * Pool_Base = Attaque_Technique + Attaque_Panel + Domination_Numéraire
 */
export function calcBasePool(
  attackMin: number,
  attackMax: number,
  domination: number = 0
): number {
  const attackPanel = (attackMin + attackMax) / 2;
  return attackPanel + domination;
}

/**
 * Calcule l'effet de pénétration de bouclier
 * 
 * Si Pénétration ≤ Bouclier / 3:
 *   Effet = Pénétration × 2
 * Si Pénétration > Bouclier / 3:
 *   Effet = (Bouclier / 3) × 2 + (Pénétration - Bouclier / 3) × 0.5
 */
export function calcShieldPenetration(
  shieldValue: number,
  penetration: number
): number {
  if (penetration <= 0) return 0;
  if (shieldValue <= 0) return 0;
  
  const threshold = shieldValue / 3;
  
  if (penetration <= threshold) {
    return penetration * 2;
  } else {
    const baseEffect = threshold * 2;
    const excessEffect = (penetration - threshold) * 0.5;
    return Math.min(baseEffect + excessEffect, shieldValue);
  }
}

/**
 * Calcule le bouclier Qi restant après pénétration
 */
export function calcRemainingShield(
  shieldValue: number,
  penetration: number
): number {
  const effect = calcShieldPenetration(shieldValue, penetration);
  return Math.max(0, shieldValue - effect);
}

/**
 * Calcule le taux de réduction par la défense
 * Réd_Déf = Défense_Restante / (Défense_Restante + 2860)
 */
export function calcDefenseReduction(
  defense: number,
  armorPenetration: number = 0
): number {
  const defenseRemaining = Math.max(0, defense - armorPenetration);
  return defenseRemaining / (defenseRemaining + DEFENSE_CONSTANT);
}

/**
 * Calcule le taux de réduction élémentaire
 * Réd_Élém = Résistance_Élém / (Résistance_Élém + 530)
 * 
 * Note: La résistance peut être négative (-353 = ×3 dégâts)
 */
export function calcElementalReduction(elemResist: number): number {
  // Résistance négative = bonus de dégâts
  if (elemResist < 0) {
    return elemResist / (Math.abs(elemResist) + ELEM_RESIST_CONSTANT);
  }
  return elemResist / (elemResist + ELEM_RESIST_CONSTANT);
}

/**
 * Calcule le pool physique final après toutes les réductions
 */
export function calcPhysicalPool(
  stats: CharacterStats,
  target: TargetStats,
  domination: number = 0
): { pool: number; reduction: number } {
  // 1. Pool de base
  const basePool = calcBasePool(stats.attExtMin, stats.attExtMax, domination);
  
  // 2. Réduction par bouclier Qi
  const remainingShield = calcRemainingShield(
    target.bouclierQi,
    stats.penetrationPhysique
  );
  const afterShield = basePool - remainingShield;
  
  // 3. Réduction par défense
  const defReduction = calcDefenseReduction(
    target.defense,
    stats.penetrationPhysique
  );
  
  return {
    pool: afterShield * (1 - defReduction),
    reduction: defReduction,
  };
}

/**
 * Calcule le pool élémentaire final
 * Pool_Élém = Atk_Élém × (1 - Réd_Élém)
 * 
 * Note: L'attaque élémentaire ignore la défense physique
 */
export function calcElementalPool(
  stats: CharacterStats,
  target: TargetStats
): { pool: number; reduction: number } {
  const basePool = (stats.attPrincipalMin + stats.attPrincipalMax) / 2;
  const elemReduction = calcElementalReduction(target.resistElem);
  
  return {
    pool: basePool * (1 - elemReduction),
    reduction: elemReduction,
  };
}

// ============================================
// CRITICAL / AFFINITY SYSTEM
// ============================================

/**
 * Calcule le taux de critique effectif
 * Taux_Crit = (1.15 × Crit_Restant) / (Crit_Restant + 938)
 */
export function calcCritRate(critValue: number, targetResist: number = 0): number {
  const critRemaining = Math.max(0, critValue - targetResist);
  const rate = (1.15 * critRemaining) / (critRemaining + CRIT_RATE_CONSTANT);
  return Math.min(rate, 0.8); // Cap ~80%
}

/**
 * Calcule le taux de précision
 * Taux_Toucher = 95% + (1.42 × Toucher_Restant) / (Toucher_Restant + 3640)
 */
export function calcPrecisionRate(
  precisionValue: number,
  targetEvasion: number = 0
): number {
  const precisionRemaining = Math.max(0, precisionValue - targetEvasion);
  const bonus = (1.42 * precisionRemaining) / (precisionRemaining + PRECISION_CONSTANT);
  return Math.min(BASE_PRECISION_RATE + bonus, 1.0);
}

/**
 * Détermine le type de touche basé sur les probabilités
 * Utilisé pour la simulation Monte Carlo
 */
export function rollHitType(
  precisionRate: number,
  critRate: number,
  affinityRate: number,
  abrasionConversionRate: number = 0
): HitType {
  const roll = Math.random();
  
  // Touche précise ?
  if (roll < precisionRate) {
    // Peut être critique et/ou affinité
    const critRoll = Math.random();
    const affRoll = Math.random();
    
    const isCrit = critRoll < critRate;
    const isAff = affRoll < affinityRate;
    
    if (isCrit && isAff) return 'criticalAffinity';
    if (isCrit) return 'critical';
    if (isAff) return 'affinity';
    return 'normal';
  } else {
    // Touche non-précise: peut être affinité ou abrasion
    const affRoll = Math.random();
    
    if (affRoll < affinityRate) return 'affinity';
    
    // Conversion d'abrasion ?
    const convRoll = Math.random();
    if (convRoll < abrasionConversionRate) return 'normal';
    
    return 'abrasion';
  }
}

// ============================================
// BONUS MULTIPLIERS
// ============================================

/**
 * Calcule le multiplicateur de bonus total
 * Règle: "Types identiques s'additionnent, types différents se multiplient"
 * 
 * Dégâts_Final = Dégâts_Après_Crit × Π(1 + Σ Bonus_Catégorie_i)
 */
export function calcBonusMultiplier(buffs: Buff[]): number {
  // Grouper par catégorie
  const categories: Record<BonusCategory, number> = {
    general: 0,
    skill: 0,
    weapon: 0,
    special: 0,
    set: 0,
    domination: 0,
    independent: 0,
  };
  
  for (const buff of buffs) {
    const value = buff.isPercentage ? buff.value : buff.value / 100;
    categories[buff.category] += value;
  }
  
  // Multiplier les catégories entre elles
  let multiplier = 1;
  for (const category of Object.keys(categories) as BonusCategory[]) {
    if (categories[category] !== 0) {
      multiplier *= (1 + categories[category]);
    }
  }
  
  return multiplier;
}

// ============================================
// MAIN DAMAGE CALCULATION
// ============================================

/**
 * Calcule les dégâts déterministes pour un skill
 * 
 * Formule Maîtresse:
 * Dégâts = M_skill × (Pool_Physique + Pool_Élémentaire) × M_Crit × Bonus
 */
export function calcDeterministicDamage(
  stats: CharacterStats,
  target: TargetStats,
  skill: Skill,
  buffs: Buff[] = [],
  hitType: HitType = 'normal',
  domination: number = 0
): DamageResult {
  // 1. Calculer les pools
  const physResult = calcPhysicalPool(stats, target, domination);
  const elemResult = calcElementalPool(stats, target);
  
  // 2. Appliquer le multiplicateur du skill
  const skillMult = skill.coefficients.physicalMultiplier;
  const fixedDamage = skill.coefficients.fixedDamage || 0;
  const elemMult = skill.coefficients.mainAttributeMultiplier || 0;
  
  const rawPhysDamage = skillMult * physResult.pool + fixedDamage;
  const rawElemDamage = elemMult * elemResult.pool;
  const rawTotal = rawPhysDamage + rawElemDamage;
  
  // 3. Appliquer le multiplicateur de type de touche
  const hitMult = HIT_MULTIPLIERS[hitType];
  
  // Pour affinité: utiliser attaque max au lieu de moyenne
  let adjustedDamage = rawTotal;
  if (hitType === 'affinity' || hitType === 'criticalAffinity') {
    // Recalculer avec attaque max
    const maxPhysPool = stats.attExtMax - calcRemainingShield(target.bouclierQi, stats.penetrationPhysique);
    const maxPhysDamage = skillMult * maxPhysPool * (1 - physResult.reduction) + fixedDamage;
    const maxElemDamage = elemMult * stats.attPrincipalMax * (1 - elemResult.reduction);
    adjustedDamage = maxPhysDamage + maxElemDamage;
  } else if (hitType === 'abrasion') {
    // Utiliser attaque min
    const minPhysPool = stats.attExtMin - calcRemainingShield(target.bouclierQi, stats.penetrationPhysique);
    const minPhysDamage = skillMult * minPhysPool * (1 - physResult.reduction) + fixedDamage;
    const minElemDamage = elemMult * stats.attPrincipalMin * (1 - elemResult.reduction);
    adjustedDamage = minPhysDamage + minElemDamage;
  }
  
  const afterHitType = adjustedDamage * hitMult;
  
  // 4. Appliquer les bonus
  const bonusMult = calcBonusMultiplier(buffs);
  const finalDamage = afterHitType * bonusMult;
  
  // 5. Calculer tous les types pour référence
  const calcForType = (type: HitType) => {
    const mult = HIT_MULTIPLIERS[type];
    return rawTotal * mult * bonusMult;
  };
  
  // 6. Calculer l'Expected Value
  const critRate = calcCritRate(stats.tauxCrit * CRIT_RATE_CONSTANT, target.resistCrit);
  const affRate = stats.tauxAffinite;
  const precRate = stats.tauxPrecision;
  
  const ev = calcExpectedValue(
    rawTotal,
    stats.attExtMax,
    stats.attExtMin,
    precRate,
    critRate,
    affRate,
    bonusMult
  );
  
  return {
    poolPhysique: physResult.pool,
    poolElementaire: elemResult.pool,
    reductionDefense: physResult.reduction,
    reductionElem: elemResult.reduction,
    
    normal: calcForType('normal'),
    critical: calcForType('critical'),
    affinity: calcForType('affinity'),
    criticalAffinity: calcForType('criticalAffinity'),
    abrasion: calcForType('abrasion'),
    
    expectedValue: ev,
    
    breakdown: {
      basePool: physResult.pool + elemResult.pool,
      afterShield: physResult.pool,
      afterDefense: rawTotal,
      afterMultiplier: afterHitType,
      bonusMultiplier: bonusMult,
      finalDamage,
    },
  };
}

// ============================================
// EXPECTED VALUE CALCULATION
// ============================================

/**
 * Calcule l'Expected Value des dégâts
 * 
 * Formule complète:
 * EV = p_prec × [
 *   p_crit × Atk_roll × M_crit × (1 + p_aff × (M_aff - 1))
 *   + (1 - p_crit) × p_aff × Atk_max × M_aff
 *   + (1 - p_crit) × (1 - p_aff) × Atk_roll
 * ]
 * + (1 - p_prec) × [
 *   p_aff × Atk_max × M_aff
 *   + (1 - p_aff) × (p_conv × Atk_roll + (1 - p_conv) × Atk_min × 0.5)
 * ]
 */
export function calcExpectedValue(
  baseDamage: number,
  maxDamage: number,
  minDamage: number,
  precisionRate: number,
  critRate: number,
  affinityRate: number,
  bonusMultiplier: number,
  abrasionConversionRate: number = 0
): number {
  const M_crit = HIT_MULTIPLIERS.critical;
  const M_aff = HIT_MULTIPLIERS.affinity;
  const M_abr = HIT_MULTIPLIERS.abrasion;
  
  // Précision hit branch
  const critWithAff = critRate * baseDamage * M_crit * (1 + affinityRate * (M_aff - 1));
  const affOnly = (1 - critRate) * affinityRate * maxDamage * M_aff;
  const normalHit = (1 - critRate) * (1 - affinityRate) * baseDamage;
  const precisionBranch = critWithAff + affOnly + normalHit;
  
  // Non-precision hit branch
  const nonPrecAff = affinityRate * maxDamage * M_aff;
  const converted = (1 - affinityRate) * abrasionConversionRate * baseDamage;
  const abrasion = (1 - affinityRate) * (1 - abrasionConversionRate) * minDamage * M_abr;
  const nonPrecisionBranch = nonPrecAff + converted + abrasion;
  
  // Combine
  const ev = precisionRate * precisionBranch + (1 - precisionRate) * nonPrecisionBranch;
  
  return ev * bonusMultiplier;
}

/**
 * Formule EV simplifiée pour calculateur rapide
 * EV_Mult = 1 + (p_crit × Bonus_Crit) + (p_aff × Bonus_Aff)
 */
export function calcSimpleEVMultiplier(
  critRate: number,
  critBonus: number,
  affinityRate: number,
  affinityBonus: number
): number {
  return 1 + (critRate * critBonus) + (affinityRate * affinityBonus);
}

// ============================================
// DPS CALCULATION
// ============================================

/**
 * Calcule le DPS sur une rotation
 * DPS = Σ(EV_Skill_i × N_Hits_i) / Durée_Rotation
 */
export function calcRotationDPS(
  stats: CharacterStats,
  target: TargetStats,
  rotation: Array<{ skill: Skill; count: number }>,
  buffs: Buff[],
  totalDuration: number
): number {
  let totalDamage = 0;
  
  for (const { skill, count } of rotation) {
    const result = calcDeterministicDamage(stats, target, skill, buffs);
    totalDamage += result.expectedValue * count;
  }
  
  return totalDamage / totalDuration;
}

/**
 * Calcule le Graduation Rate
 * Graduation_Rate = (Votre_DPS / DPS_Référence) × 100%
 */
export function calcGraduationRate(
  yourDPS: number,
  referenceDPS: number
): number {
  return (yourDPS / referenceDPS) * 100;
}
