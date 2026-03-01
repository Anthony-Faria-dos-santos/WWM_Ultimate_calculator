import { NextResponse, type NextRequest } from 'next/server';
import { ComparisonService, type BuildConfig } from '@/lib/services/ComparisonService';
import { calculateCompareSchema } from '@/lib/validation/schemas';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';

/**
 * POST /api/calculate/compare — Comparaison de deux builds.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = calculateCompareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { build1, build2, target, duration } = parsed.data;
    const comparisonService = new ComparisonService();

    const config1: BuildConfig = {
      name: build1.name,
      stats: build1.stats as CharacterBaseStats,
      skills: build1.skills as unknown as Skill[],
      bonuses: (build1.bonuses ?? []) as readonly DamageBonus[],
    };

    const config2: BuildConfig = {
      name: build2.name,
      stats: build2.stats as CharacterBaseStats,
      skills: build2.skills as unknown as Skill[],
      bonuses: (build2.bonuses ?? []) as readonly DamageBonus[],
    };

    const result = comparisonService.compareTwoBuilds(
      config1,
      config2,
      target as Target,
      duration ?? 60
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/calculate/compare error:', error);
    return NextResponse.json(
      { error: 'Erreur de calcul' },
      { status: 500 }
    );
  }
}
