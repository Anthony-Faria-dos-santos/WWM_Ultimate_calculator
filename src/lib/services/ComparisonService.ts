/**
 * Service de comparaison de builds.
 * Compare deux configurations et produit un rapport détaillé des différences.
 */

import type {
 CharacterBaseStats,
 Target,
 Skill,
 BuildComparison,
} from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';
import { CombatService } from './CombatService';

/**
 * Configuration d'un build pour la comparaison.
 *
 * Regroupe toutes les informations nécessaires pour calculer le DPS d'un build:
 * stats finales du personnage, rotation de skills, et bonus de dégâts actifs.
 *
 */
export interface BuildConfig {
 /**
 * Nom descriptif du build
 *
 */
 readonly name: string;

 /**
 * Stats finales du personnage
 * Inclut tous les bonus d'équipement, voies intérieures, etc.
 */
 readonly stats: Readonly<CharacterBaseStats>;

 /**
 * Skills de la rotation (ordre d'exécution)
 * Utilisées pour calculer le DPS sur la durée de simulation
 */
 readonly skills: readonly Skill[];

 /**
 * Bonus de dégâts appliqués
 * Sets d'équipement, buffs temporaires, etc.
 */
 readonly bonuses: readonly DamageBonus[];
}

/**
 * Résultat d'analyse de gain marginal par stat.
 *
 * Mesure l'impact d'une augmentation d'une stat spécifique sur le DPS.
 * Permet d'identifier les stats les plus efficaces à optimiser.
 *
 */
export interface MarginalGainResult {
 /**
 * Nom de la stat modifiée
 *
 */
 readonly statName: string;

 /**
 * Valeur originale de la stat
 *
 */
 readonly originalValue: number;

 /**
 * Valeur après modification
 *
 */
 readonly newValue: number;

 /**
 * DPS original (avant modification)
 *
 */
 readonly originalDPS: number;

 /**
 * DPS après modification
 *
 */
 readonly newDPS: number;

 /**
 * Gain absolu de DPS
 *
 * Formule: DPS Gain = New DPS - Original DPS
 *
 */
 readonly dpsGain: number;

 /**
 * Gain relatif en pourcentage
 *
 * Formule: DPS Gain % = (DPS Gain / Original DPS) × 100
 *
 */
 readonly dpsGainPercent: number;

 /**
 * Efficacité : gain DPS par point de stat investi
 *
 * Formule: Efficiency = DPS Gain / Stat Delta
 *
 * Permet de comparer l'efficacité de différentes stats.
 * Plus l'efficacité est élevée, plus la stat est rentable à optimiser.
 *
 */
 readonly efficiency: number;
}

/**
 * Service de comparaison de builds et d'analyse de gains marginaux.
 *
 * Fournit des outils pour:
 * - Comparer deux builds complets avec breakdown détaillé
 * - Analyser l'impact marginal de chaque stat sur le DPS
 * - Identifier la meilleure stat à optimiser
 *
 * Utilise CombatService en interne pour tous les calculs de DPS.
 * Tous les calculs utilisent simulateExpectedRotation pour garantir
 * des résultats stables et reproductibles.
 */
export class ComparisonService {
 private readonly combatService: CombatService;

 constructor() {
 this.combatService = new CombatService();
 }

 /**
 * Compare deux builds complets et retourne un BuildComparison.
 *
 * Utilise simulateExpectedRotation (mode Expected Value, pas de random)
 * sur une durée donnée pour obtenir un DPS stable et comparable.
 *
 * Calcule automatiquement le winner, l'avantage DPS, et le breakdown
 * des différences de stats entre les deux builds.
 *
 * @param build1 - Premier build à comparer
 * @param build2 - Deuxième build à comparer
 * @param target - Cible commune (même boss pour les deux)
 * @param duration - Durée de simulation en secondes (défaut: 60)
 * @returns BuildComparison avec winner, DPS, avantage, breakdown
 *
 */
 public compareTwoBuilds(
 build1: Readonly<BuildConfig>,
 build2: Readonly<BuildConfig>,
 target: Readonly<Target>,
 duration: number = 60
 ): BuildComparison {
 // Calculer le DPS des deux builds
 const dps1 = this.calculateBuildDPS(
 build1.stats,
 build1.skills,
 target,
 build1.bonuses,
 duration
 );

 const dps2 = this.calculateBuildDPS(
 build2.stats,
 build2.skills,
 target,
 build2.bonuses,
 duration
 );

 // Calculer l'avantage DPS (signé: positif si build1 meilleur, négatif si build2 meilleur)
 const dpsAdvantage = dps1 - dps2;

 // Calculer l'avantage en pourcentage
 // Formula: (dpsAdvantage / build2DPS) × 100
 // Si build2DPS = 0, on utilise 0 comme pourcentage
 const percentageAdvantage = dps2 > 0 ? (dpsAdvantage / dps2) * 100 : 0;

 // Déterminer le winner (tie si différence absolue < 1 DPS)
 let winner: 'build1' | 'build2' | 'tie';
 const absDpsAdvantage = Math.abs(dpsAdvantage);
 if (absDpsAdvantage < 1) {
 winner = 'tie';
 } else if (dps1 > dps2) {
 winner = 'build1';
 } else {
 winner = 'build2';
 }

 // Calculer le breakdown des différences de stats
 const breakdown = this.calculateStatsBreakdown(build1.stats, build2.stats);

 // Construire le résultat BuildComparison
 const comparison: BuildComparison = {
 build1Name: build1.name,
 build2Name: build2.name,
 build1DPS: dps1,
 build2DPS: dps2,
 dpsAdvantage,
 percentageAdvantage,
 winner,
 breakdown: Object.keys(breakdown).length > 0 ? breakdown : undefined,
 };

 return comparison;
 }

 /**
 * Calcule le gain marginal de chaque stat clé (+100 points ou +1%).
 *
 * Pour chaque stat dans la liste, crée une copie des stats avec la stat
 * augmentée, recalcule le DPS, et mesure le gain.
 *
 * Stats testées avec leur delta par défaut:
 * - attack: +100
 * - elementalAttack: +100
 * - critRate: +500 (points de stat, pas % directement)
 * - critDamage: +0.1 (+10% bonus crit damage)
 * - affinityRate: +0.05 (+5%)
 * - affinityDamage: +0.05 (+5%)
 * - precision: +500
 * - armorPenetration: +100
 * - elementalPenetration: +100
 *
 * Les résultats sont triés par efficiency décroissante (meilleur ROI en premier).
 *
 * @param stats - Stats de base du personnage
 * @param skills - Rotation pour le calcul DPS
 * @param target - Cible ennemie
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @param duration - Durée simulation en secondes (défaut: 60)
 * @returns MarginalGainResult[] trié par efficiency décroissante
 *
 */
 public calculateMarginalGains(
 stats: Readonly<CharacterBaseStats>,
 skills: readonly Skill[],
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[] = [],
 duration: number = 60
 ): MarginalGainResult[] {
 // Calculer le DPS original
 const originalDPS = this.calculateBuildDPS(stats, skills, target, bonuses, duration);

 // Définir les stats à tester avec leur delta
 const statsToTest: Array<{ name: keyof CharacterBaseStats; delta: number }> = [
 { name: 'attack', delta: 100 },
 { name: 'elementalAttack', delta: 100 },
 { name: 'critRate', delta: 500 },
 { name: 'critDamage', delta: 0.1 },
 { name: 'affinityRate', delta: 0.05 },
 { name: 'affinityDamage', delta: 0.05 },
 { name: 'precision', delta: 500 },
 { name: 'armorPenetration', delta: 100 },
 { name: 'elementalPenetration', delta: 100 },
 ];

 const results: MarginalGainResult[] = [];

 for (const { name, delta } of statsToTest) {
 // Créer une copie des stats avec la stat modifiée
 const modifiedStats = this.modifyStat(stats, name, delta);

 // Calculer le nouveau DPS
 const newDPS = this.calculateBuildDPS(modifiedStats, skills, target, bonuses, duration);

 // Calculer les gains
 const dpsGain = newDPS - originalDPS;
 const dpsGainPercent = originalDPS > 0 ? (dpsGain / originalDPS) * 100 : 0;
 const efficiency = dpsGain / delta;

 // Créer le résultat
 const result: MarginalGainResult = {
 statName: name,
 originalValue: stats[name] as number,
 newValue: modifiedStats[name] as number,
 originalDPS,
 newDPS,
 dpsGain,
 dpsGainPercent,
 efficiency,
 };

 results.push(result);
 }

 // Trier par efficiency décroissante (meilleure stat en premier)
 results.sort((a, b) => b.efficiency - a.efficiency);

 return results;
 }

 /**
 * Trouve la meilleure stat à investir parmi les stats testées.
 *
 * Raccourci pour calculateMarginalGains()[0].
 * Retourne la stat avec la meilleure efficiency (gain DPS par point investi).
 *
 * @param stats - Stats de base du personnage
 * @param skills - Rotation pour le calcul DPS
 * @param target - Cible ennemie
 * @param bonuses - Bonus de dégâts (défaut: [])
 * @param duration - Durée simulation en secondes (défaut: 60)
 * @returns La MarginalGainResult avec la meilleure efficiency, ou null si vide
 *
 */
 public findBestStat(
 stats: Readonly<CharacterBaseStats>,
 skills: readonly Skill[],
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[] = [],
 duration: number = 60
 ): MarginalGainResult | null {
 const gains = this.calculateMarginalGains(stats, skills, target, bonuses, duration);
 return gains.length > 0 ? gains[0] : null;
 }

 // Méthodes privées

 /**
 * Calcule le DPS d'un build via simulateExpectedRotation.
 *
 * Utilise toujours le mode Expected Value pour garantir un résultat
 * stable et reproductible (pas de variance aléatoire).
 *
 * @param stats - Stats du personnage
 * @param skills - Rotation de skills
 * @param target - Cible ennemie
 * @param bonuses - Bonus de dégâts
 * @param duration - Durée de simulation en secondes
 * @returns DPS calculé, ou 0 si skills vide
 *
 * @private
 */
 private calculateBuildDPS(
 stats: Readonly<CharacterBaseStats>,
 skills: readonly Skill[],
 target: Readonly<Target>,
 bonuses: readonly DamageBonus[],
 duration: number
 ): number {
 // Edge case: skills vide → DPS = 0
 if (skills.length === 0) {
 return 0;
 }

 const result = this.combatService.simulateExpectedRotation(
 stats,
 skills,
 target,
 duration,
 bonuses
 );

 return result.dps;
 }

 /**
 * Calcule le breakdown des différences de stats entre deux builds.
 *
 * Compare les stats numériques de CharacterBaseStats.
 * Ne retourne que les stats qui diffèrent entre les deux builds.
 *
 * Format: Record<statName, difference>
 * Exemple: { attack: 200, critRate: -500 } → build1 a +200 attack, -500 critRate vs build2
 *
 * @param stats1 - Stats du build 1
 * @param stats2 - Stats du build 2
 * @returns Record<statName, difference> pour les stats différentes
 *
 * @private
 */
 private calculateStatsBreakdown(
 stats1: Readonly<CharacterBaseStats>,
 stats2: Readonly<CharacterBaseStats>
 ): Record<string, number> {
 const breakdown: Record<string, number> = {};

 // Liste des stats à comparer (toutes les stats numériques)
 const statsToCompare: Array<keyof CharacterBaseStats> = [
 'level',
 'attack',
 'attackMin',
 'attackMax',
 'elementalAttack',
 'defense',
 'resistance',
 'critRate',
 'critDamage',
 'affinityRate',
 'affinityDamage',
 'precision',
 'armorPenetration',
 'elementalPenetration',
 ];

 for (const statName of statsToCompare) {
 const value1 = stats1[statName] as number;
 const value2 = stats2[statName] as number;
 const difference = value1 - value2;

 // Ne retourner que les stats qui diffèrent
 if (difference !== 0) {
 breakdown[statName] = difference;
 }
 }

 return breakdown;
 }

 /**
 * Crée une copie des stats avec une stat modifiée.
 *
 * Utilise le spread operator pour garantir l'immutabilité.
 *
 * @param stats - Stats originales
 * @param statName - Nom de la stat à modifier
 * @param delta - Valeur à ajouter (peut être négative)
 * @returns Nouvelle instance de CharacterBaseStats avec la stat modifiée
 *
 * @private
 */
 private modifyStat(
 stats: Readonly<CharacterBaseStats>,
 statName: string,
 delta: number
 ): CharacterBaseStats {
 // Edge case: stat inexistante → retourner stats inchangées
 if (!(statName in stats)) {
 return { ...stats };
 }

 const currentValue = stats[statName as keyof CharacterBaseStats] as number;
 const newValue = currentValue + delta;

 return {
 ...stats,
 [statName]: newValue,
 };
 }
}
