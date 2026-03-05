import { prisma } from '@/lib/db/client';
import { getAuthenticatedUser, isOwner } from '@/lib/auth/helpers';
import { NextResponse, type NextRequest } from 'next/server';
import { updateBuildSchema } from '@/lib/validation/schemas';
import type { BuildResponse } from '@/lib/types';
import type { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/builds/[id] — Détail d'un build.
 *
 * Les builds publics sont accessibles sans auth (incrémente les views).
 * Les builds privés nécessitent auth + ownership.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const build = await prisma.build.findUnique({
      where: { id },
      include: { user: { select: { name: true, image: true } } },
    });

    if (!build) {
      return NextResponse.json(
        { error: 'Build introuvable' },
        { status: 404 }
      );
    }

    if (build.isPublic) {
      await prisma.build.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    } else {
      const { user, error } = await getAuthenticatedUser();
      if (error) return error;

      if (!isOwner(build.userId, user.id)) {
        return NextResponse.json(
          { error: 'Accès refusé' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(formatBuildResponse(build));
  } catch (error) {
    console.error('[API] GET /api/builds/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/builds/[id] — Mettre à jour un build.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const existing = await prisma.build.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Build introuvable' },
        { status: 404 }
      );
    }

    if (!isOwner(existing.userId, user.id)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateBuildSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    if (data.character) {
      if (data.character.level !== undefined) updateData.level = data.character.level;
      if (data.character.weaponId !== undefined) updateData.weaponId = data.character.weaponId;
      if (data.character.innerWayId !== undefined) updateData.innerWayId = data.character.innerWayId;
      if (data.character.objective !== undefined) updateData.objective = data.character.objective;
    }

    if (data.stats !== undefined) updateData.stats = data.stats as unknown as Prisma.InputJsonValue;
    if (data.target !== undefined) updateData.target = data.target as unknown as Prisma.InputJsonValue;
    if (data.equipment !== undefined) updateData.equipment = data.equipment as unknown as Prisma.InputJsonValue;
    if (data.rotation !== undefined) updateData.rotation = data.rotation as unknown as Prisma.InputJsonValue;
    if (data.activeBuffs !== undefined) updateData.buffs = data.activeBuffs as unknown as Prisma.InputJsonValue;

    const updated = await prisma.build.update({
      where: { id },
      data: updateData,
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json(formatBuildResponse(updated));
  } catch (error) {
    console.error('[API] PUT /api/builds/[id] error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/builds/[id] — Supprimer un build.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const existing = await prisma.build.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Build introuvable' },
        { status: 404 }
      );
    }

    if (!isOwner(existing.userId, user.id)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    await prisma.build.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API] DELETE /api/builds/[id] error:', error);
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
