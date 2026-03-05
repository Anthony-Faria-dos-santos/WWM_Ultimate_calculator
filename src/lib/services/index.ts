/**
 * Barrel export des services.
 */

// Service de combat
export { CombatService } from './CombatService';
export type { FullBuildInput, FullPipelineResult } from './CombatService';

// Service de comparaison
export { ComparisonService } from './ComparisonService';
export type { BuildConfig, MarginalGainResult } from './ComparisonService';

// Service de simulation Monte Carlo
export { SimulationService } from './SimulationService';
export type {
  SimulationConfig,
  FullBuildSimulationConfig,
  SimulationResult,
  OutcomeDistribution,
  ConfidenceInterval,
} from './SimulationService';
