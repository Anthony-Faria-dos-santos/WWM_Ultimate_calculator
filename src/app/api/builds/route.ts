import { prisma } from '@/lib/db/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { NextResponse, type NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { paginationSchema, createBuildSchema } from '@/lib/validation/schemas';
import type { BuildResponse, PaginatedBuildsResponse } from '@/lib/types';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/builds — Liste paginée des builds de l'utilisateur.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paginationSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const page = parsed.data.page ?? 1;
    const limit = parsed.data.limit ?? 20;
    const sort = parsed.data.sort ?? 'newest';

    const orderBy = sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : { updatedAt: 'desc' as const };

    const [builds, total] = await Promise.all([
      prisma.build.findMany({
        where: { userId: user.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.build.count({ where: { userId: user.id } }),
    ]);

    const response: PaginatedBuildsResponse = {
      builds: builds.map(formatBuildResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] GET /api/builds error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builds — Créer un build.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const body: unknown = await request.json();
    const parsed = createBuildSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { character, stats, target, equipment, rotation, activeBuffs, ...rest } = parsed.data;

    const build = await prisma.build.create({
      data: {
        userId: user.id,
        name: rest.name,
        description: rest.description ?? null,
        isPublic: rest.isPublic ?? false,
        level: character.level,
        weaponId: character.weaponId,
        innerWayId: character.innerWayId ?? null,
        objective: character.objective,
        stats: stats as unknown as Prisma.InputJsonValue,
        target: target as unknown as Prisma.InputJsonValue ?? undefined,
        equipment: equipment as unknown as Prisma.InputJsonValue ?? undefined,
        rotation: rotation as unknown as Prisma.InputJsonValue ?? undefined,
        buffs: activeBuffs as unknown as Prisma.InputJsonValue ?? undefined,
        shareSlug: nanoid(8),
      },
    });

    return NextResponse.json(formatBuildResponse(build), { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/builds error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// ─── Utilitaire de formatage ───────────────────────────────────────

interface PrismaBuild {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  level: number;
  weaponId: string;
  innerWayId: string | null;
  objective: string;
  stats: unknown;
  target: unknown;
  equipment: unknown;
  rotation: unknown;
  buffs: unknown;
  results: unknown;
  views: number;
  likes: number;
  shareSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string | null; image: string | null };
}

function formatBuildResponse(build: PrismaBuild): BuildResponse {
  return {
    id: build.id,
    name: build.name,
    description: build.description,
    isPublic: build.isPublic,
    level: build.level,
    weaponId: build.weaponId,
    innerWayId: build.innerWayId,
    objective: build.objective,
    stats: build.stats as BuildResponse['stats'],
    target: (build.target as BuildResponse['target']) ?? null,
    equipment: (build.equipment as BuildResponse['equipment']) ?? null,
    rotation: (build.rotation as BuildResponse['rotation']) ?? null,
    buffs: (build.buffs as BuildResponse['buffs']) ?? null,
    results: (build.results as BuildResponse['results']) ?? null,
    views: build.views,
    likes: build.likes,
    shareSlug: build.shareSlug,
    createdAt: build.createdAt.toISOString(),
    updatedAt: build.updatedAt.toISOString(),
    ...(build.user ? { user: build.user } : {}),
  };
}
