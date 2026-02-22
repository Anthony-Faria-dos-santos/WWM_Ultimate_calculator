/**
 * Calculateur d'affinité (会意).
 * Gère le taux d'affinité avec cap à 60% et le multiplicateur ×1.35.
 * L'affinité est un stat direct sans formule de scaling.
 */

import type { CharacterBaseStats } from '@/lib/types';
import { STAT_LIMITS, DAMAGE_MULTIPLIERS } from '@/lib/constants';

/**
 * Résultat détaillé du calcul d'affinité.
 *
 * Contient le taux calculé et les informations contextuelles
 * pour le debug et l'affichage UI.
 */
export interface AffinityResult {
 /**
 * Taux d'affinité final (0-0.60).
 *
 * Valeur après application du cap de 60%.
 * Représente la probabilité qu'une attaque déclenche l'affinité.
 *
 */
 readonly affinityRate: number;

 /**
 * Taux d'affinité brut (avant cap).
 *
 * Valeur directe depuis les stats du personnage, avant cap.
 * Permet de voir si le personnage a dépassé le cap.
 */
 readonly rawAffinityRate: number;

 /**
 * Multiplicateur de dégâts d'affinité (1.35x).
 *
 * Les attaques avec affinité infligent 135% des dégâts de base.
 * Ce multiplicateur peut être augmenté par les bonus d'affinity damage.
 *
 */
 readonly affinityMultiplier: number;

 /**
 * Indique si le cap de 60% est atteint.
 *
 * true si le taux d'affinité brut dépasse le cap de 60%.
 */
 readonly isCapped: boolean;
}

/**
 * Calculateur de taux d'affinité.
 *
 * L'affinité (会意) est une statistique directe du personnage, sans formule
 * de scaling complexe. Le taux est utilisé tel quel avec un cap à 60%.
 *
 * Contrairement à la précision et au critique, l'affinité :
 * - N'a pas de formule de scaling (pas de constantes ni courbe hyperbolique)
 * - N'a pas de résistance cible (ne peut pas être réduite)
 * - Est plus simple à calculer et à optimiser
 *
 * L'affinité peut se combiner avec le critique pour des dégâts maximum :
 * - Normal : ×1.0 (100% dégâts)
 * - Critique seul : ×1.5 (150% dégâts, +50%)
 * - Affinité seul : ×1.35 (135% dégâts, +35%)
 * - Critique + Affinité : ×1.85 (185% dégâts, ADDITIF : +50% +35%)
 *
 */
export class AffinityCalculator {
 /**
 * Cap de taux d'affinité maximum (60%).
 */
 private readonly MAX_AFFINITY_RATE = STAT_LIMITS.MAX_AFFINITY_RATE;

 /**
 * Multiplicateur de dégâts d'affinité (1.35x = 135% de dégâts).
 */
 private readonly AFFINITY_DAMAGE_MULTIPLIER = DAMAGE_MULTIPLIERS.AFFINITY;

 /**
 * Multiplicateur de dégâts critique (pour calculs combinés).
 */
 private readonly CRITICAL_DAMAGE_MULTIPLIER = DAMAGE_MULTIPLIERS.CRITICAL;

 /**
 * Calcule le taux d'affinité.
 *
 * Méthode principale qui applique le cap de 60% au taux d'affinité brut.
 * Contrairement à la précision et au critique, il n'y a pas de formule
 * de scaling : le taux est utilisé directement.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @returns Résultat détaillé du calcul d'affinité
 *
 */
 public calculateAffinity(
 attacker: Readonly<CharacterBaseStats>
 ): AffinityResult {
 const rawAffinityRate = attacker.affinityRate || 0;

 // Application du cap à 60%
 const affinityRate = Math.min(rawAffinityRate, this.MAX_AFFINITY_RATE);

 // Vérifier si le cap est atteint
 const isCapped = rawAffinityRate > this.MAX_AFFINITY_RATE;

 return {
 affinityRate,
 rawAffinityRate,
 affinityMultiplier: this.AFFINITY_DAMAGE_MULTIPLIER,
 isCapped,
 };
 }

 /**
 * Détermine si une attaque déclenche l'affinité (test aléatoire).
 *
 * Méthode utilitaire qui effectue un test aléatoire pour déterminer
 * si une attaque déclenche l'affinité en fonction du taux calculé.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @param randomRoll - Valeur aléatoire entre 0 et 1 (Math.random())
 * @returns true si l'attaque déclenche l'affinité, false sinon
 *
 */
 public isAffinity(
 attacker: Readonly<CharacterBaseStats>,
 randomRoll: number
 ): boolean {
 const result = this.calculateAffinity(attacker);
 return randomRoll <= result.affinityRate;
 }

 /**
 * Retourne le multiplicateur de dégâts d'affinité.
 *
 * Les attaques avec affinité infligent 135% des dégâts de base (1.35x).
 * Ce multiplicateur peut être augmenté par les bonus d'affinity damage
 * provenant de l'équipement et des talents.
 *
 * @returns Multiplicateur de dégâts d'affinité (1.35)
 *
 */
 public getAffinityMultiplier(): number {
 return this.AFFINITY_DAMAGE_MULTIPLIER;
 }

 /**
 * Retourne le taux d'affinité requis pour atteindre le cap.
 *
 * Simple car l'affinité n'a pas de scaling : le cap est directement 60%.
 *
 * @returns Taux d'affinité requis pour le cap (0.60)
 *
 */
 public getAffinityRequiredForCap(): number {
 return this.MAX_AFFINITY_RATE;
 }

 /**
 * Vérifie si le personnage a atteint le cap d'affinité de 60%.
 *
 * @param attacker - Statistiques finales de l'attaquant
 * @returns true si le cap de 60% est atteint
 *
 */
 public isAtCap(attacker: Readonly<CharacterBaseStats>): boolean {
 const result = this.calculateAffinity(attacker);
 return result.isCapped;
 }

 /**
 * Calcule le multiplicateur total en combinant critique et affinité.
 *
 * Les bonus de dégâts critiques et d'affinité s'additionnent (pas de multiplication).
 * Cette méthode est utile pour calculer rapidement les dégâts finaux
 * en fonction des procs de critique et affinité.
 *
 * @param isCritical - Si l'attaque est critique
 * @param hasAffinity - Si l'attaque déclenche l'affinité
 * @returns Multiplicateur total de dégâts
 *
 * Les bonus s'additionnent (pas de multiplication) :
 * - Critique de base : +50% (0.5)
 * - Affinité de base : +35% (0.35)
 * - Combiné : 1 + 0.5 + 0.35 = 1.85 (185% de dégâts)
 *
 * Combinaisons possibles :
 * - Normal (ni crit ni aff) : ×1.0 (100% dégâts)
 * - Critique seul : ×1.5 (150% dégâts, base +50%)
 * - Affinité seul : ×1.35 (135% dégâts, base +35%)
 * - Critique + Affinité : ×1.85 (185% dégâts, ADDITIF : +50% +35%)
 *
 */
 public getCombinedMultiplier(isCritical: boolean, hasAffinity: boolean): number {
 // Les bonus s'additionnent (pas de multiplication)
 // Formule : 1 + bonus_crit + bonus_affinity
 let bonusTotal = 0;

 if (isCritical) {
 // Critique : +50% (1.5 - 1.0 = 0.5)
 bonusTotal += (this.CRITICAL_DAMAGE_MULTIPLIER - 1.0);
 }

 if (hasAffinity) {
 // Affinité : +35% (1.35 - 1.0 = 0.35)
 bonusTotal += (this.AFFINITY_DAMAGE_MULTIPLIER - 1.0);
 }

 // Multiplicateur final : 1 + total des bonus
 return 1.0 + bonusTotal;
 }
}
