/**
 * Calculateur de soins.
 * Formule : healPool × skillHealRatio × (1 + healBonus%).
 */

import type { CharacterBaseStats, Skill } from '@/lib/types';
import { DAMAGE_MULTIPLIERS } from '@/lib/constants';
import { CriticalCalculator } from './CriticalCalculator';

/**
 * Résultat du calcul de soin.
 *
 * Contient toutes les informations du calcul de soin,
 * y compris les valeurs intermédiaires pour le debug et l'UI.
 */
export interface HealCalculation {
 /** Soin de base = attack × skill.physicalRatio */
 readonly baseHeal: number;
 
 /** Multiplicateur critique appliqué (1.0 ou 1.5 + critDamage) */
 readonly critMultiplier: number;
 
 /** Bonus de soin appliqué (ex: 0.20 = +20%) */
 readonly healBonus: number;
 
 /** Soin final = baseHeal × critMultiplier × (1 + healBonus) */
 readonly finalHeal: number;
 
 /** true si le soin a critiqué (false en mode Expected Value) */
 readonly isCritical: boolean;
 
 /** Taux de critique utilisé (pour info) */
 readonly critRate: number;
}

/**
 * Calculateur de soins avec support des critiques.
 *
 * Implémente le calcul de soin en mode déterministe (avec roll aléatoire)
 * et en mode Expected Value (probabiliste).
 *
 * Les soins peuvent critiquer avec la même mécanique que les dégâts,
 * mais n'ont pas de test de précision ni d'affinité.
 *
 */
export class HealCalculator {
 /**
 * Calculateur de critique pour déterminer le taux de crit
 */
 private readonly criticalCalc: CriticalCalculator;

 /**
 * Initialise le calculateur avec ses dépendances.
 */
 constructor() {
 this.criticalCalc = new CriticalCalculator();
 }

 /**
 * Calcule un soin en mode déterministe (avec roll crit aléatoire).
 *
 * Pipeline :
 * 1. baseHeal = attacker.attack × skill.physicalRatio
 * 2. Calculer critRate via CriticalCalculator (sans résistance crit)
 * 3. Roll critique : isCrit = Math.random() < critRate
 * 4. critMultiplier = isCrit ? (1.5 + attacker.critDamage) : 1.0
 * 5. finalHeal = baseHeal × critMultiplier × (1 + healBonus)
 *
 * Note : On passe targetCritResistance = 0 au CriticalCalculator
 * car les soins ne sont pas affectés par la résistance critique.
 *
 * @param attacker - Stats du soigneur (CharacterBaseStats readonly)
 * @param skill - Compétence de soin (Skill readonly, seul physicalRatio utilisé)
 * @param healBonus - Bonus de soin en décimal (0.20 = +20%), défaut 0
 * @returns HealCalculation avec toutes les informations du calcul
 *
 */
 public calculateHeal(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 healBonus: number = 0
 ): HealCalculation {
 // 1. Calcul du soin de base (attack × physicalRatio)
 const baseHeal = attacker.attack * skill.physicalRatio;

 // 2. Calcul du taux critique (sans résistance critique)
 const critResult = this.criticalCalc.calculateCritical(attacker, {
 targetCritResistance: 0,
 });

 const critRate = critResult.criticalRate;

 // 3. Test de critique (roll aléatoire)
 const critRoll = Math.random();
 const isCritical = critRoll < critRate;

 // 4. Calcul du multiplicateur critique
 const critMultiplier = isCritical
 ? DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage
 : 1.0;

 // 5. Calcul du soin final
 const finalHeal = Math.max(0, baseHeal * critMultiplier * (1 + healBonus));

 return {
 baseHeal,
 critMultiplier,
 healBonus,
 finalHeal,
 isCritical,
 critRate,
 };
 }

 /**
 * Calcule le soin en mode Expected Value (probabiliste).
 *
 * Au lieu de tirer un roll aléatoire, calcule le soin moyen pondéré
 * par les probabilités de critique et de non-critique.
 *
 * Formule :
 * ```
 * E[heal] = baseHeal × (1 + healBonus) × (
 * (1 - critRate) × 1.0 +
 * critRate × critDamageMultiplier
 * )
 * ```
 *
 * Simplifié :
 * ```
 * E[heal] = baseHeal × (1 + healBonus) × (1 + critRate × (critMult - 1))
 * ```
 *
 * @param attacker - Stats du soigneur
 * @param skill - Compétence de soin
 * @param healBonus - Bonus de soin en décimal (0.20 = +20%), défaut 0
 * @returns HealCalculation avec finalHeal = E[heal] et isCritical = false
 *
 * Le champ `isCritical` est mis à false par convention en mode EV
 * (pas de roll réel).
 *
 */
 public calculateExpectedHeal(
 attacker: Readonly<CharacterBaseStats>,
 skill: Readonly<Skill>,
 healBonus: number = 0
 ): HealCalculation {
 // 1. Calcul du soin de base (identique au mode déterministe)
 const baseHeal = attacker.attack * skill.physicalRatio;

 // 2. Calcul du taux critique (sans résistance critique)
 const critResult = this.criticalCalc.calculateCritical(attacker, {
 targetCritResistance: 0,
 });

 const critRate = critResult.criticalRate;

 // 3. Calcul du multiplicateur critique
 const critDamageMult = DAMAGE_MULTIPLIERS.CRITICAL + attacker.critDamage;

 // 4. Calcul de l'Expected Value
 // E[heal] = baseHeal × (1 + healBonus) × (1 + critRate × (critMult - 1))
 const expectedMultiplier = 1 + critRate * (critDamageMult - 1);

 // 5. Soin final
 const finalHeal = Math.max(0, baseHeal * (1 + healBonus) * expectedMultiplier);

 return {
 baseHeal,
 critMultiplier: critDamageMult,
 healBonus,
 finalHeal,
 isCritical: false, // Pas de roll réel en mode Expected Value
 critRate,
 };
 }
}
