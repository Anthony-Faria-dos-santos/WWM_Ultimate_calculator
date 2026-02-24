/**
 * Utilitaires de formatage — dégâts, pourcentages, durées, noms de stats.
 */

/**
 * Map statique des noms de stats vers leurs labels français
 *
 * Utilisée par formatStatName pour convertir les clés camelCase
 * en labels lisibles pour l'interface utilisateur.
 */
const STAT_LABELS: Readonly<Record<string, string>> = {
 // Stats de combat
 attack: 'Attaque',
 attackMin: 'Attaque Min',
 attackMax: 'Attaque Max',
 elementalAttack: 'Attaque Élémentaire',
 defense: 'Défense',
 resistance: 'Résistance',
 
 // Stats de critique
 critRate: 'Taux Critique',
 critDamage: 'Dégâts Critiques',
 
 // Stats d'affinité
 affinityRate: 'Taux Affinité',
 affinityDamage: 'Dégâts Affinité',
 
 // Stats de précision
 precision: 'Précision',
 parry: 'Parade',
 
 // Stats de pénétration
 armorPenetration: 'Pénétration Armure',
 elementalPenetration: 'Pénétration Élémentaire',
 
 // Autres
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
 */
export function formatStatName(key: string): string {
 // Retourne le label français si trouvé, sinon retourne la clé telle quelle
 return STAT_LABELS[key] ?? key;
}
