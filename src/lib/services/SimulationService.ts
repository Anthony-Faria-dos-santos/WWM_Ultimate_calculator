/**
 * Service de simulation Monte Carlo.
 * Lance N itérations du calcul de dégâts pour analyser la variance.
 */

import type { CharacterBaseStats, Target, Skill } from '@/lib/types';
import { CombatOutcome } from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';
import { CombatService, type FullBuildInput } from './CombatService';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Configuration d'une simulation Monte Carlo.
 */
export interface SimulationConfig {
  readonly attacker: CharacterBaseStats;
  readonly skill: Skill;
  readonly target: Target;
  readonly bonuses?: readonly DamageBonus[];
  readonly iterations: number;
}

/**
 * Configuration pour simulation avec pipeline complet (talents + sets).
 */
export interface FullBuildSimulationConfig {
  readonly buildInput: FullBuildInput;
  readonly iterations: number;
}

/**
 * Résultat statistique d'une simulation Monte Carlo.
 */
export interface SimulationResult {
  readonly mean: number;
  readonly median: number;
  readonly stdDev: number;
  readonly min: number;
  readonly max: number;
  readonly distribution: OutcomeDistribution;
  readonly sortedSamples: readonly number[];
  readonly iterations: number;
}

/**
 * Distribution des outcomes sur N itérations.
 */
export interface OutcomeDistribution {
  readonly miss: number;
  readonly normal: number;
  readonly critical: number;
  readonly affinity: number;
  readonly criticalAffinity: number;
}

/**
 * Intervalle de confiance [borne basse, borne haute].
 */
export type ConfidenceInterval = readonly [lower: number, upper: number];

// ─── Mapping CombatOutcome → clé distribution ──────────────────────

const OUTCOME_KEY_MAP: ReadonlyMap<CombatOutcome, keyof OutcomeDistribution> = new Map([
  [CombatOutcome.Miss, 'miss'],
  [CombatOutcome.Normal, 'normal'],
  [CombatOutcome.Critical, 'critical'],
  [CombatOutcome.Affinity, 'affinity'],
  [CombatOutcome.CriticalAffinity, 'criticalAffinity'],
]);

// ─── Classe principale ─────────────────────────────────────────────

export class SimulationService {
  private readonly combatService: CombatService;

  constructor() {
    this.combatService = new CombatService();
  }

  /**
   * Lance une simulation Monte Carlo (mode simple, sans pipeline build).
   *
   * @param config - Configuration de la simulation
   * @returns Résultat statistique complet
   * @throws Error si iterations <= 0
   */
  public simulate(config: Readonly<SimulationConfig>): SimulationResult {
    if (config.iterations <= 0) {
      throw new Error("Le nombre d'itérations doit être positif");
    }

    const samples: number[] = [];
    const dist = this.emptyDistribution();

    for (let i = 0; i < config.iterations; i++) {
      const result = this.combatService.calculateSkillDamage(
        config.attacker,
        config.skill,
        config.target,
        config.bonuses ?? []
      );
      samples.push(result.finalDamage);
      this.incrementDistribution(dist, result.outcome);
    }

    return this.computeStatistics(samples, dist, config.iterations);
  }

  /**
   * Lance une simulation Monte Carlo avec pipeline complet (talents + sets).
   *
   * @param config - Configuration avec build complet
   * @returns Résultat statistique complet
   * @throws Error si iterations <= 0
   */
  public simulateFullBuild(config: Readonly<FullBuildSimulationConfig>): SimulationResult {
    if (config.iterations <= 0) {
      throw new Error("Le nombre d'itérations doit être positif");
    }

    const samples: number[] = [];
    const dist = this.emptyDistribution();

    for (let i = 0; i < config.iterations; i++) {
      const result = this.combatService.calculateWithFullBuild(config.buildInput);
      samples.push(result.damage.finalDamage);
      this.incrementDistribution(dist, result.damage.outcome);
    }

    return this.computeStatistics(samples, dist, config.iterations);
  }

  /**
   * Calcule l'intervalle de confiance pour un résultat de simulation.
   *
   * @param result - Résultat de simulation
   * @param confidence - Niveau de confiance (0.90, 0.95 ou 0.99)
   * @returns Intervalle [borne basse, borne haute]
   */
  public calculateConfidenceInterval(
    result: Readonly<SimulationResult>,
    confidence: number = 0.95
  ): ConfidenceInterval {
    const zScore = confidence >= 0.99 ? 2.576 : confidence >= 0.95 ? 1.96 : 1.645;
    const margin = zScore * (result.stdDev / Math.sqrt(result.iterations));
    return [result.mean - margin, result.mean + margin] as const;
  }

  /**
   * Calcule un percentile à partir des échantillons triés.
   *
   * @param result - Résultat de simulation
   * @param percentile - Percentile souhaité (0-100)
   * @returns Valeur au percentile donné
   */
  public getPercentile(
    result: Readonly<SimulationResult>,
    percentile: number
  ): number {
    if (percentile < 0 || percentile > 100) {
      throw new Error('Le percentile doit être entre 0 et 100');
    }
    const index = Math.min(
      Math.floor((percentile / 100) * result.sortedSamples.length),
      result.sortedSamples.length - 1
    );
    return result.sortedSamples[index];
  }

  // ─── Méthodes privées ───────────────────────────────────────────

  private emptyDistribution(): Record<keyof OutcomeDistribution, number> {
    return { miss: 0, normal: 0, critical: 0, affinity: 0, criticalAffinity: 0 };
  }

  private incrementDistribution(
    dist: Record<keyof OutcomeDistribution, number>,
    outcome: CombatOutcome
  ): void {
    const key = OUTCOME_KEY_MAP.get(outcome);
    if (key) {
      dist[key]++;
    }
  }

  private computeStatistics(
    samples: number[],
    distribution: OutcomeDistribution,
    iterations: number
  ): SimulationResult {
    const sorted = [...samples].sort((a, b) => a - b);
    const mean = samples.reduce((sum, v) => sum + v, 0) / iterations;
    const median = sorted[Math.floor(iterations / 2)];
    const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / iterations;

    return {
      mean,
      median,
      stdDev: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      distribution,
      sortedSamples: sorted,
      iterations,
    };
  }
}
