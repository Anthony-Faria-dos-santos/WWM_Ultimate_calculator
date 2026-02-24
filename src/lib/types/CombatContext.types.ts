/**
 * Contexte de combat dynamique pour résolution conditionnelle des talents/sets.
 */

/**
 * État de combat à un instant T de la simulation
 *
 * Immutable — un nouveau CombatContext est créé à chaque step.
 * Le RotationDPSCalculator met à jour ce contexte.
 */
export interface CombatContext {
 /** Timestamp dans la simulation (en secondes) */
 readonly currentTime: number;
 /** Qi actuel de la cible (0-1, ex: 0.35 = 35%) */
 readonly targetQiPercent: number;
 /** La cible est-elle en état "Exhausted" ? */
 readonly isTargetExhausted: boolean;
 /** HP actuel du personnage (0-1) */
 readonly playerHpPercent: number;
 /** Compétence actuellement exécutée (null si idle) */
 readonly currentSkillId: string | null;
 /** La compétence actuelle est-elle chargée ? */
 readonly isChargedSkill: boolean;
 /** Ressource Fighting Spirit (0-5 barres) */
 readonly fightingSpiritBars: number;
 /** Ressource Blossom (0-100) */
 readonly blossomCount: number;
 /** Ressource Dewdrops (0-100) */
 readonly dewdropsCount: number;
 /** Debuffs actifs sur la cible (ids) */
 readonly activeTargetDebuffs: readonly string[];
 /** Buffs actifs sur le joueur (ids) */
 readonly activePlayerBuffs: readonly string[];
}

/**
 * Contexte de combat par défaut (hors simulation / calcul simple)
 *
 * Utilisé pour les calculs déterministes simples où on ne simule
 * pas une rotation complète. Tous les conditionnels sont désactivés
 * sauf ceux marqués "always".
 */
export const DEFAULT_COMBAT_CONTEXT: Readonly<CombatContext> = {
 currentTime: 0,
 targetQiPercent: 1.0, // Cible à plein Qi → pas de bonus "low Qi"
 isTargetExhausted: false,
 playerHpPercent: 1.0,
 currentSkillId: null,
 isChargedSkill: false,
 fightingSpiritBars: 0,
 blossomCount: 0,
 dewdropsCount: 0,
 activeTargetDebuffs: [],
 activePlayerBuffs: [],
} as const;
