/**
 * Types de combat — cible, bonus, résultats de calcul.
 */

/**
 * Résultat possible d'une attaque
 *
 * Détermine l'issue d'une attaque après tous les calculs de rates.
 * L'ordre de vérification dans l'arbre de décision est :
 * 1. Précision → Miss ou Hit
 * 2. Si Hit → Critique → Crit ou No Crit
 * 3. Si No Crit → Affinité → Affinity ou Normal
 *
 * Note : Crit et Affinity peuvent se cumuler dans certains cas.
 *
 * @enum {string}
 */
export enum CombatOutcome {
 /**
 * Attaque manquée (échec de précision)
 * - Dégâts = 0
 * - Probabilité = (1 - Precision Rate)
 *
 */
 Miss = 'miss',

 /**
 * Attaque normale (hit sans bonus)
 * - Dégâts = Base Damage × Bonus Multipliers
 * - Probabilité = Hit × (1 - Crit) × (1 - Affinity)
 *
 */
 Normal = 'normal',

 /**
 * Attaque critique
 * - Dégâts = Base Damage × Crit Multiplier (×1.5 base) × Bonus
 * - Probabilité = Hit × Crit × (1 - Affinity)
 *
 */
 Critical = 'critical',

 /**
 * Attaque avec affinité (触发亲和)
 * - Dégâts = Base Damage × Affinity Multiplier (×1.35 base, +35%) × Bonus
 * - Probabilité = Hit × (1 - Crit) × Affinity
 *
 */
 Affinity = 'affinity',

 /**
 * Attaque critique + affinité (les deux déclenchés)
 * - Dégâts = Base Damage × (1 + Bonus_Crit + Bonus_Affinity) × Bonus
 * - Les bonus s'additionnent : 1 + 0.5 + 0.35 = 1.85 (185% dégâts)
 * - Probabilité = Hit × Crit × Affinity
 *
 */
 CriticalAffinity = 'critical_affinity',

 /**
 * Attaque "gratignée" (擦伤)
 * - Dégâts = Base Damage × 0.5 × Bonus (pénalité -50%)
 * - Se produit quand précision échoue mais affinité trigger
 * - Cas rare et situationnel
 *
 */
 Abrasion = 'abrasion',
}

/**
 * Cible (ennemi ou dummy d'entraînement)
 *
 * Représente une cible avec ses statistiques défensives.
 * Ces stats réduisent les dégâts entrants via des formules hyperboliques.
 *
 * Formules de réduction :
 * - Défense : Defense / (Defense + 2860)
 * - Résistance : Resistance / (Resistance + 530)
 * - Bouclier : Réduction linéaire (ex: 20% shield = -20% dégâts)
 *
 */
export interface Target {
 /**
 * Identifiant unique de la cible
 *
 */
 readonly id: string;

 /**
 * Nom de la cible
 *
 */
 readonly name: string;

 /**
 * Niveau de la cible
 * Affecte les constantes des formules de réduction
 *
 */
 readonly level: number;

 /**
 * Défense physique de la cible
 *
 * Réduit les dégâts physiques via formule hyperbolique :
 * Réduction% = Defense / (Defense + 2860)
 *
 * Exemple :
 * - Defense 0 → 0% de réduction
 * - Defense 500 → 14.9% de réduction
 * - Defense 1000 → 25.9% de réduction
 * - Defense 2860 → 50% de réduction
 *
 */
 readonly defense: number;

 /**
 * Résistance élémentaire de la cible
 *
 * Réduit les dégâts élémentaires via formule hyperbolique :
 * Réduction% = Resistance / (Resistance + 530)
 *
 * Note importante (PVE) :
 * - La plupart des boss ont 0 résistance élémentaire
 * - Certains boss ont résistance NÉGATIVE pour leurs faiblesses
 * (ex: -353 résistance feu → ×3 multiplicateur de dégâts feu)
 *
 * Exemple :
 * - Resistance 0 → 0% de réduction
 * - Resistance 100 → 15.9% de réduction
 * - Resistance 530 → 50% de réduction
 * - Resistance -353 → ~-200% (×3 dégâts, faiblesse élémentaire)
 *
 */
 readonly resistance: number;

 /**
 * Bouclier Qi (护盾) en pourcentage (0-1)
 *
 * Réduction linéaire appliquée AVANT la défense.
 * Cap maximum : 100% (1.0)
 *
 * Formule : After Shield = Base Attack × (1 - shield%)
 *
 * @default 0
 */
 readonly shield: number;

 /**
 * Parade (esquive partielle)
 *
 * Réduit la précision de l'attaquant.
 * Formule précision v1.3+ : 95% × (1.43 × Precision / (Precision + Parry + 150))
 *
 * Plus la parade est élevée, plus il est difficile de toucher.
 *
 * @default 0
 */
 readonly parry: number;

 /**
 * Résistance aux critiques (optionnel)
 *
 * Réduit le taux de critique de l'attaquant.
 * Net Crit = max(0, Attacker Crit - Crit Resistance)
 *
 * Utilisé principalement en PVP.
 * En PVE, la plupart des boss n'ont pas de résistance critique.
 *
 * @default 0
 */
 readonly critResistance?: number;
}

/**
 * Pool d'attaque physique (3 étapes de réduction)
 *
 * Le pool physique subit 3 réductions successives :
 * 1. Base Attack = Character Attack × Skill Physical Ratio
 * 2. After Shield = Base Attack × (1 - Shield%)
 * 3. After Defense = After Shield × (1 - Defense Reduction%)
 *
 * La valeur finale (afterDefense) est utilisée pour le calcul des dégâts.
 *
 */
export interface PhysicalPool {
 /**
 * Attaque physique de base (Étape 1)
 *
 * Formule : Base Attack = Character Attack × Skill Physical Ratio
 *
 */
 readonly baseAttack: number;

 /**
 * Attaque après réduction du bouclier (Étape 2)
 *
 * Formule : After Shield = Base Attack × (1 - Shield%)
 *
 * Le bouclier est une réduction linéaire appliquée en premier.
 *
 */
 readonly afterShield: number;

 /**
 * Attaque après réduction de la défense (Étape 3 - FINAL)
 *
 * Formule : After Defense = After Shield × (1 - Defense Reduction%)
 * où Defense Reduction% = Net Defense / (Net Defense + 2860)
 * et Net Defense = max(0, Target Defense - Armor Penetration)
 *
 * Cette valeur est le pool physique final utilisé pour les dégâts.
 *
 */
 readonly afterDefense: number;

 /**
 * Pourcentage réduit par le bouclier (0-1)
 *
 * Stocké pour affichage et debug.
 *
 */
 readonly shieldReduction: number;

 /**
 * Pourcentage réduit par la défense (0-1)
 *
 * Calculé via formule hyperbolique : Defense / (Defense + 2860)
 * Stocké pour affichage et debug.
 *
 */
 readonly defenseReduction: number;
}

/**
 * Pool d'attaque élémentaire (2 étapes)
 *
 * Le pool élémentaire subit 2 étapes :
 * 1. Base Elemental = Character Elemental Attack × Skill Elemental Ratio
 * 2. After Resistance = Base Elemental × (1 - Resistance Reduction%)
 *
 * Note : Pas de bouclier pour les dégâts élémentaires, seulement la résistance.
 *
 */
export interface ElementalPool {
 /**
 * Attaque élémentaire de base (Étape 1)
 *
 * Formule : Base Elemental = Character Elemental Attack × Skill Elemental Ratio
 *
 * Si la skill est physique pure (elementalRatio = 0), cette valeur est 0.
 *
 */
 readonly baseElemental: number;

 /**
 * Attaque après réduction de la résistance (Étape 2 - FINAL)
 *
 * Formule : After Resistance = Base Elemental × (1 - Resistance Reduction%)
 * où Resistance Reduction% = Net Resistance / (Net Resistance + 530)
 * et Net Resistance = max(0, Target Resistance - Elemental Penetration)
 *
 * Note : Si résistance négative (faiblesse), le multiplicateur est > 1 (bonus dégâts)
 *
 * Cette valeur est le pool élémentaire final utilisé pour les dégâts.
 *
 */
 readonly afterResistance: number;

 /**
 * Pourcentage réduit par la résistance (0-1)
 *
 * Calculé via formule hyperbolique : Resistance / (Resistance + 530)
 * Stocké pour affichage et debug.
 *
 * Note : Peut être négatif si résistance négative (faiblesse élémentaire)
 *
 */
 readonly resistanceReduction: number;
}

/**
 * Taux de combat calculés (précision, critique, affinité)
 *
 * Ces taux sont calculés à partir des stats du personnage et de la cible.
 * Ils déterminent les probabilités des différents résultats de combat.
 *
 * Important : Si critRate + affinityRate > 100%, une normalisation
 * proportionnelle est appliquée pour ramener le total à 100%.
 *
 */
export interface CombatRates {
 /**
 * Taux de précision (chance de toucher) (0-0.95)
 *
 * Formule v1.3+ : Precision Rate = 95% × (1.43 × Precision / (Precision + Parry + 150))
 *
 * Cap maximum : 95% (impossible d'avoir 100% de précision)
 *
 */
 readonly precisionRate: number;

 /**
 * Taux de critique brut (0-1)
 *
 * Formule : Crit Rate = 1.15 × (Net Crit / (Net Crit + 938))
 * où Net Crit = max(0, Character Crit - Target Crit Resistance)
 *
 * Cap recommandé : 80% (0.8)
 *
 */
 readonly critRate: number;

 /**
 * Taux d'affinité brut (0-1)
 *
 * L'affinité est une stat directe du personnage (pas de formule complexe).
 * Cap maximum : 40% (0.4)
 *
 */
 readonly affinityRate: number;

 /**
 * Taux de critique normalisé (après ajustement si crit+aff > 100%)
 *
 * Si critRate + affinityRate <= 1.0 :
 * normalizedCritRate = critRate
 *
 * Si critRate + affinityRate > 1.0 :
 * normalizedCritRate = (critRate / total) × 1.0
 *
 * Exemple : Crit 70% + Aff 50% = 120% (> 100%)
 * → normalizedCritRate = (0.7 / 1.2) × 1.0 = 58.33%
 * → normalizedAffinityRate = (0.5 / 1.2) × 1.0 = 41.67%
 *
 */
 readonly normalizedCritRate: number;

 /**
 * Taux d'affinité normalisé (après ajustement si crit+aff > 100%)
 *
 * Voir normalizedCritRate pour la logique de normalisation.
 *
 */
 readonly normalizedAffinityRate: number;
}

/**
 * Résultat du calcul de précision
 *
 * Utilisé par les calculateurs pour déterminer si une attaque touche.
 *
 */
export interface PrecisionResult {
 /**
 * Taux de précision calculé (0-0.95)
 *
 */
 readonly hitChance: number;

 /**
 * Résultat du roll aléatoire (pour mode déterministe)
 *
 * true = l'attaque touche
 * false = l'attaque rate (Miss)
 *
 * Calculé via Math.random() < hitChance
 *
 */
 readonly willHit: boolean;
}

/**
 * Résultat du calcul de critique
 *
 * Utilisé par les calculateurs pour déterminer si une attaque critique.
 *
 */
export interface CriticalResult {
 /**
 * Taux de critique calculé (0-0.8)
 *
 */
 readonly critRate: number;

 /**
 * Multiplicateur de dégâts critiques
 *
 * Formule : Crit Damage Multiplier = 1.5 + Character Crit Damage Bonus
 *
 */
 readonly critDamageMultiplier: number;

 /**
 * Résultat du roll aléatoire (pour mode déterministe)
 *
 * true = critique déclenché
 * false = pas de critique
 *
 */
 readonly willCrit: boolean;
}

/**
 * Résultat du calcul d'affinité
 *
 * Utilisé par les calculateurs pour déterminer si l'affinité se déclenche.
 *
 */
export interface AffinityResult {
 /**
 * Taux d'affinité (0-0.4)
 *
 */
 readonly affinityRate: number;

 /**
 * Multiplicateur de dégâts d'affinité
 *
 * Formule : Affinity Damage Multiplier = 1.2 + Character Affinity Damage Bonus
 *
 */
 readonly affinityDamageMultiplier: number;

 /**
 * Résultat du roll aléatoire (pour mode déterministe)
 *
 * true = affinité déclenchée
 * false = pas d'affinité
 *
 */
 readonly willTrigger: boolean;
}

/**
 * Résultat complet du calcul de dégâts
 *
 * Contient tous les détails du calcul de dégâts, du pool de base
 * jusqu'aux dégâts finaux après tous les multiplicateurs.
 *
 * Ce type est le résultat final de la fonction calculateDamage()
 * et contient toutes les informations nécessaires pour afficher
 * un breakdown détaillé à l'utilisateur.
 *
 */
export interface DamageCalculation {
 /**
 * Pool de dégâts physiques (détail des 3 étapes)
 *
 * Contient le breakdown complet :
 * - baseAttack : Attaque de base
 * - afterShield : Après bouclier
 * - afterDefense : Valeur finale (utilisée pour dégâts)
 */
 readonly physicalPool: PhysicalPool;

 /**
 * Pool de dégâts élémentaires (détail des 2 étapes)
 *
 * Contient le breakdown complet :
 * - baseElemental : Attaque élémentaire de base
 * - afterResistance : Valeur finale (utilisée pour dégâts)
 */
 readonly elementalPool: ElementalPool;

 /**
 * Taux de combat calculés
 *
 * Contient les taux de précision, critique, affinité
 * (bruts et normalisés si nécessaire)
 */
 readonly combatRates: CombatRates;

 /**
 * Dégâts de base (avant multiplicateurs)
 *
 * Formule : Base Damage = Physical Pool (final) + Elemental Pool (final)
 *
 */
 readonly baseDamage: number;

 /**
 * Multiplicateur de critique appliqué (1.0 ou 1.5+)
 *
 * - 1.0 : Pas de critique
 * - 1.5+ : Critique déclenché (1.5 + bonus crit damage)
 *
 */
 readonly critMultiplier: number;

 /**
 * Multiplicateur d'affinité appliqué (1.0 ou 1.2+)
 *
 * - 1.0 : Pas d'affinité
 * - 1.2+ : Affinité déclenchée (1.2 + bonus affinity damage)
 *
 */
 readonly affinityMultiplier: number;

 /**
 * Multiplicateur de bonus total (同类相加，异类相乘)
 *
 * Calculé via la règle chinoise :
 * - Bonus de même catégorie s'additionnent
 * - Bonus de catégories différentes se multiplient
 *
 * Exemple :
 * - Damage +30%, Skill +15% → (1 + 0.30) × (1 + 0.15) = 1.495
 *
 */
 readonly bonusMultipliers: number;

 /**
 * Dégâts finaux (résultat final du calcul)
 *
 * Formule complète :
 * Final Damage = Base Damage × (1 + Bonus_Crit + Bonus_Affinity) × Bonus_Mult
 *
 * Les bonus critiques et d'affinité s'additionnent (pas de multiplication).
 *
 */
 readonly finalDamage: number;

 /**
 * Résultat de l'attaque (Miss, Normal, Critical, etc.)
 *
 * Détermine quel outcome s'est produit lors de cette attaque.
 */
 readonly outcome: CombatOutcome;
}
