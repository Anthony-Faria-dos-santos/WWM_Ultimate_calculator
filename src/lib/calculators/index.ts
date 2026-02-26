/**
 * Barrel export des calculateurs.
 */

// Calculateur de stats de base
export { BaseStatsCalculator, type ActiveBuff } from './BaseStatsCalculator';

// Calculateurs de pool (physique et élémentaire)
export { PhysicalPoolCalculator } from './PhysicalPoolCalculator';
export { ElementalPoolCalculator } from './ElementalPoolCalculator';

// Calculateurs de taux (précision, critique, affinité)
export { CombatRatesCalculator } from './CombatRatesCalculator';
export { PrecisionCalculator } from './PrecisionCalculator';
export type { PrecisionResult, PrecisionCalculationOptions } from './PrecisionCalculator';
export { CriticalCalculator } from './CriticalCalculator';
export type { CriticalResult, CriticalCalculationOptions } from './CriticalCalculator';
export { AffinityCalculator } from './AffinityCalculator';
export type { AffinityResult } from './AffinityCalculator';
export { normalizeCombinedRates } from './normalizeCombinedRates';
export type { NormalizedRates } from './normalizeCombinedRates';

// Calculateur de résultat de dégâts (pipeline complet)
export { DamageOutcomeCalculator } from './DamageOutcomeCalculator';

// Bonus multiplicatifs et soins
export { BonusMultiplierCalculator, DamageZone, BonusCategory } from './BonusMultiplierCalculator';
export type { DamageBonus, ZoneBreakdown, BonusSubGroup } from './BonusMultiplierCalculator';
export { HealCalculator } from './HealCalculator';
export type { HealCalculation } from './HealCalculator';

// Calculateurs DPS (rotation, valeur espérée, graduation)
export { RotationDPSCalculator } from './RotationDPSCalculator';
export { ExpectedValueCalculator } from './ExpectedValueCalculator';
export { GraduationCalculator } from './GraduationCalculator';

// Résolveurs de talents et sets (Phase 1.10)
export { TalentBonusResolver } from './TalentBonusResolver';
export { SetBonusResolver } from './SetBonusResolver';
export { PreCombatStatsModifier } from './PreCombatStatsModifier';
