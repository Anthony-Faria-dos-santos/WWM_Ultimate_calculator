/**
 * Calculateur de graduation de stats.
 * Évalue la qualité d'un build selon les seuils de performance.
 */

import type { GraduationResult } from '@/lib/types';

/**
 * Calculateur de Graduation Rate pour évaluer un build par rapport à une référence.
 *
 * Le Graduation Rate permet de mesurer objectivement la qualité d'un build
 * en le comparant à un build de référence optimal (généralement un build théorique
 * ou le meilleur build connu pour une classe/arme donnée).
 *
 * Formule principale :
 * ```
 * Graduation Rate = (DPS joueur / DPS référence) × 100
 * ```
 *
 */
export class GraduationCalculator {
 /**
 * Calcule le Graduation Rate (taux de graduation).
 *
 * Compare votre DPS à un DPS de référence et produit un résultat complet
 * avec rating qualitatif, recommandations et métriques d'amélioration.
 *
 * Formule : graduationRate = (yourDPS / referenceDPS) × 100
 *
 * Échelle d'évaluation :
 * - < 70% : 'beginner' — Build débutant, beaucoup d'améliorations possibles
 * - 70-80% : 'progressing' — En progression, optimiser stats secondaires
 * - 80-90% : 'competitive' — Compétitif, focus sur gains marginaux
 * - 90-100% : 'optimized' — Optimisé, prêt pour endgame
 * - > 100% : 'exceptional' — Exceptionnel ou nouvelle méta
 *
 * @param yourDPS - Votre DPS calculé (doit être >= 0)
 * @param referenceDPS - DPS de référence (doit être > 0)
 * @returns GraduationResult complet avec rating et recommandations
 *
 * @throws {Error} Si referenceDPS <= 0 (impossible de calculer un ratio)
 *
 */
 public calculateGraduation(yourDPS: number, referenceDPS: number): GraduationResult {
 // Validation : referenceDPS doit être > 0
 if (referenceDPS <= 0) {
 throw new Error('Reference DPS must be > 0');
 }

 // Edge case : clamper yourDPS à 0 si négatif
 const clampedYourDPS = Math.max(0, yourDPS);

 // Calcul du graduation rate
 const graduationRate = (clampedYourDPS / referenceDPS) * 100;

 // Calcul du DPS gap (positif = il manque du DPS, négatif = DPS en excès)
 const dpsGap = referenceDPS - clampedYourDPS;

 // Calcul de l'amélioration nécessaire (en pourcentage du DPS actuel)
 // Si yourDPS = 0 ou dpsGap <= 0, improvementNeeded = 0
 const improvementNeeded =
 clampedYourDPS > 0 && dpsGap > 0 ? dpsGap / clampedYourDPS : 0;

 // Déterminer le rating qualitatif
 const rating = this.getRating(graduationRate);

 // Générer la recommandation
 const recommendation = this.getRecommendation(rating);

 return {
 yourDPS: clampedYourDPS,
 referenceDPS,
 graduationRate,
 rating,
 recommendation,
 dpsGap,
 improvementNeeded,
 };
 }

 /**
 * Détermine le rating qualificatif basé sur le graduation rate.
 *
 * Échelle de rating :
 * - < 70% : 'beginner'
 * - 70-80% : 'progressing'
 * - 80-90% : 'competitive'
 * - 90-100% : 'optimized'
 * - > 100% : 'exceptional'
 *
 * @param graduationRate - Taux de graduation (en pourcentage, 0-∞)
 * @returns Rating qualitatif
 *
 * @private
 */
 private getRating(
 graduationRate: number
 ): GraduationResult['rating'] {
 if (graduationRate < 70) {
 return 'beginner';
 } else if (graduationRate < 80) {
 return 'progressing';
 } else if (graduationRate < 90) {
 return 'competitive';
 } else if (graduationRate <= 100) {
 return 'optimized';
 } else {
 return 'exceptional';
 }
 }

 /**
 * Génère une recommandation basée sur le rating.
 *
 * Les recommandations sont personnalisées selon le niveau du build :
 * - **Beginner** : Revoir les bases (équipement, skills)
 * - **Progressing** : Optimiser les stats secondaires
 * - **Competitive** : Focus sur les gains marginaux
 * - **Optimized** : Affiner la rotation et les timings
 * - **Exceptional** : Build de référence
 *
 * @param rating - Rating qualitatif du build
 * @returns Recommandation textuelle
 *
 * @private
 */
 private getRecommendation(rating: GraduationResult['rating']): string {
 switch (rating) {
 case 'beginner':
 return "Revoir l'équipement de base et les ratios de compétences";

 case 'progressing':
 return 'Optimiser les stats secondaires (critique, affinité, pénétration)';

 case 'competitive':
 return 'Focus sur les gains marginaux (sets, talents, rotation)';

 case 'optimized':
 return 'Build quasi-optimal, affiner la rotation et les timings';

 case 'exceptional':
 return 'Build exceptionnel ! Référence possible pour les autres joueurs';

 default:
 return 'Continuer à optimiser le build';
 }
 }
}
