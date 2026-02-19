/**
 * Formatting Utilities for WWM Calculator
 * 
 * Fournit des fonctions pure de formatage pour l'affichage des résultats
 * de calcul. Toutes les fonctions retournent des strings formatées pour
 * l'interface utilisateur (locale FR).
 * 
 * Toutes les fonctions sont pure (pas de side-effect, readonly).
 * 
 * @module formatting.utils
 * @version 1.0.0
 */

/**
 * Map statique des noms de stats vers leurs labels français
 * 
 * Utilisée par formatStatName pour convertir les clés camelCase
 * en labels lisibles pour l'interface utilisateur.
 */
const STAT_LABELS: Readonly<Record<string, string>> = {
  // Combat stats
  attack: 'Attaque',
  attackMin: 'Attaque Min',
  attackMax: 'Attaque Max',
  elementalAttack: 'Attaque Élémentaire',
  defense: 'Défense',
  resistance: 'Résistance',
  
  // Crit stats
  critRate: 'Taux Critique',
  critDamage: 'Dégâts Critiques',
  
  // Affinity stats
  affinityRate: 'Taux Affinité',
  affinityDamage: 'Dégâts Affinité',
  
  // Precision stats
  precision: 'Précision',
  parry: 'Parade',
  
  // Penetration stats
  armorPenetration: 'Pénétration Armure',
  elementalPenetration: 'Pénétration Élémentaire',
  
  // Other
  level: 'Niveau',
  shield: 'Bouclier',
} as const;

/**
 * Formate une valeur de dégâts
 * 
 * Arrondit à l'entier et ajoute des séparateurs de milliers (espace).
 * Les valeurs négatives sont clampées à 0.
 * 
 * @param value - Valeur de dégâts à formater
 * @returns Dégâts formatés avec séparateurs
 * 
 * @example
 * ```typescript
 * formatDamage(12345.6);  // "12 346"
 * formatDamage(0);        // "0"
 * formatDamage(-100);     // "0"
 * formatDamage(1234567);  // "1 234 567"
 * ```
 */
export function formatDamage(value: number): string {
  // Clampe les valeurs négatives à 0
  const clamped = Math.max(0, value);
  
  // Arrondit à l'entier
  const rounded = Math.round(clamped);
  
  // Ajoute séparateurs de milliers (espace)
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formate un taux en pourcentage
 * 
 * Multiplie la valeur par 100 et ajoute le symbole %.
 * La valeur est clampée entre 0 et 1 avant formatage.
 * 
 * @param value - Valeur décimale (0-1) à formater en pourcentage
 * @param decimals - Nombre de décimales (défaut: 1)
 * @returns Pourcentage formaté avec %
 * 
 * @example
 * ```typescript
 * formatPercentage(0.3542);       // "35.4%"
 * formatPercentage(0.3542, 2);    // "35.42%"
 * formatPercentage(0.3542, 0);    // "35%"
 * formatPercentage(1.5);          // "100.0%" (clampé)
 * formatPercentage(-0.2);         // "0.0%" (clampé)
 * ```
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  // Clampe entre 0 et 1
  const clamped = Math.max(0, Math.min(1, value));
  
  // Multiplie par 100 et formate avec le nombre de décimales demandé
  const percentage = clamped * 100;
  
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formate une valeur de DPS (Dégâts Par Seconde)
 * 
 * Formate avec séparateurs de milliers et 1 décimale, ajoute le suffixe " DPS".
 * 
 * @param value - Valeur de DPS à formater
 * @returns DPS formaté avec 1 décimale et suffixe " DPS"
 * 
 * @example
 * ```typescript
 * formatDPS(1234.56);    // "1 234.6 DPS"
 * formatDPS(45678.123);  // "45 678.1 DPS"
 * formatDPS(0);          // "0.0 DPS"
 * formatDPS(999.99);     // "1 000.0 DPS" (arrondi)
 * ```
 */
export function formatDPS(value: number): string {
  // Clampe à 0 minimum
  const clamped = Math.max(0, value);
  
  // Arrondit à 1 décimale
  const rounded = Math.round(clamped * 10) / 10;
  
  // Sépare partie entière et décimale
  const integerPart = Math.floor(rounded);
  const decimalPart = (rounded % 1).toFixed(1).substring(2); // Récupère juste le chiffre après la virgule
  
  // Formate la partie entière avec séparateurs
  const formattedInteger = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formattedInteger}.${decimalPart} DPS`;
}

/**
 * Formate une durée en secondes
 * 
 * Convertit les secondes en format lisible :
 * - Moins de 60s : "Xs"
 * - Entre 60s et 3600s : "Xm Ys"
 * - Plus de 3600s : "Xh Ym Zs"
 * 
 * Les secondes sont arrondies à l'entier.
 * 
 * @param seconds - Durée en secondes à formater
 * @returns Durée formatée en string lisible
 * 
 * @example
 * ```typescript
 * formatDuration(45);      // "45s"
 * formatDuration(90);      // "1m 30s"
 * formatDuration(150);     // "2m 30s"
 * formatDuration(3661);    // "1h 1m 1s"
 * formatDuration(7265);    // "2h 1m 5s"
 * formatDuration(0);       // "0s"
 * ```
 */
export function formatDuration(seconds: number): string {
  // Arrondit à l'entier
  const totalSeconds = Math.round(Math.max(0, seconds));
  
  // Cas simple : moins de 60 secondes
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  // Entre 60 et 3600 secondes (moins d'une heure)
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}m ${secs}s`;
  }
  
  // Plus d'une heure
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Formate un nom de stat en label lisible français
 * 
 * Convertit les clés camelCase en labels français lisibles.
 * Utilise une map statique pour les conversions connues.
 * Si la clé n'est pas trouvée, retourne la clé telle quelle.
 * 
 * @param key - Nom de la stat en camelCase
 * @returns Label français lisible
 * 
 * @example
 * ```typescript
 * formatStatName('critRate');       // "Taux Critique"
 * formatStatName('critDamage');     // "Dégâts Critiques"
 * formatStatName('affinityRate');   // "Taux Affinité"
 * formatStatName('attack');         // "Attaque"
 * formatStatName('precision');      // "Précision"
 * formatStatName('defense');        // "Défense"
 * formatStatName('unknownStat');    // "unknownStat" (fallback)
 * ```
 */
export function formatStatName(key: string): string {
  // Retourne le label français si trouvé, sinon retourne la clé telle quelle
  return STAT_LABELS[key] ?? key;
}
