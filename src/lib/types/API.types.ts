/**
 * Types du contrat API (frontend ↔ backend).
 *
 * Payloads de création/modification, réponses, pagination, erreurs.
 */

import type {
  CharacterBaseStats,
  Target,
  GraduationResult,
  DamageDistribution,
} from '@/lib/types';
import type {
  EquipmentSlot,
  EquipmentPiece,
  SetStatModifier,
} from '@/lib/types/EquipmentSet.types';
import type { MarginalGainResult } from '@/lib/services/ComparisonService';

/** Payload de création de build (POST /api/builds) */
export interface CreateBuildPayload {
  name: string;
  description?: string;
  isPublic?: boolean;
  character: {
    level: number;
    weaponId: string;
    innerWayId?: string;
    objective: 'pve' | 'pvp';
  };
  stats: CharacterBaseStats;
  target?: Target;
  equipment?: BuildEquipmentPayload;
  rotation?: Array<{ skillId: string; order: number }>;
  activeBuffs?: string[];
}

/** Équipement sérialisé en JSON dans Prisma */
export interface BuildEquipmentPayload {
  slots: Partial<Record<EquipmentSlot, EquipmentPiece | null>>;
  enhanceLevels: Partial<Record<EquipmentSlot, number>>;
  harmonisation: Partial<Record<EquipmentSlot, SetStatModifier[]>>;
}

/** Snapshot des résultats (stocké en JSON) */
export interface BuildResultsSnapshot {
  dps: number;
  graduation: GraduationResult | null;
  damageDistribution: DamageDistribution | null;
  marginalGains: MarginalGainResult[];
}

/** Réponse API build (GET /api/builds/[id]) */
export interface BuildResponse {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  level: number;
  weaponId: string;
  innerWayId: string | null;
  objective: string;
  stats: CharacterBaseStats;
  target: Target | null;
  equipment: BuildEquipmentPayload | null;
  rotation: Array<{ skillId: string; order: number }> | null;
  buffs: string[] | null;
  results: BuildResultsSnapshot | null;
  views: number;
  likes: number;
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { name: string | null; image: string | null };
}

/** Réponse paginée (GET /api/builds) */
export interface PaginatedBuildsResponse {
  builds: BuildResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Erreur API standardisée */
export interface APIError {
  error: string;
  details?: unknown;
}
