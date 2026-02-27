/**
 * Barrel export des types.
 */

// Types personnage
/**
 * Types de personnage :
 * - CharacterBaseStats: Base combat statistics
 * - PlayerCharacter: Personnage complet avec équipement
 * - Equipment: Arme, armure et accessoires
 * - WeaponType, MartialArtStyle: Enums for character classification
 */
export * from './Character.types';

// Types compétence
/**
 * Types de compétences :
 * - Skill: Définition complète avec ratios et timings
 * - SkillTalent: Modificateurs de talents
 * - DamageType: Physical, Elemental, or Hybrid
 * - SkillCategory: Active, Passive, Ultimate, etc.
 * - SkillElement: Fire, Ice, Lightning, Wind, Earth, Poison
 */
export * from './Skill.types';

// Types combat
/**
 * Types de combat :
 * - Target: Ennemi avec stats défensives
 * - PhysicalPool, ElementalPool: Damage pools with reduction stages
 * - CombatRates: Precision, Critical, Affinity rates
 * - DamageCalculation: Complete damage calculation result
 * - CombatOutcome: Miss, Normal, Critical, Affinity, etc.
 * - PrecisionResult, CriticalResult, AffinityResult: Intermediate results
 */
export * from './Combat.types';

// Types DPS
/**
 * Types DPS et rotation :
 * - RotationResult: Complete rotation simulation result
 * - SkillUsage : Statistiques d'utilisation par compétence
 * - TimelineEvent: Combat timeline events
 * - ExpectedValueResult: Probabilistic damage calculation
 * - DamageDistribution: Probability distribution across outcomes
 * - GraduationResult: Build comparison to optimal reference
 * - BuildComparison: Detailed comparison between two builds
 */
export * from './DPS.types';

// Types de contexte de combat (conditions dynamiques talents/sets)
export * from './CombatContext.types';

// Types d'arts martiaux (armes, talents, résolution)
export * from './MartialArts.types';

// Types d'équipement et sets (slots, pièces, bonus par palier)
export * from './EquipmentSet.types';
