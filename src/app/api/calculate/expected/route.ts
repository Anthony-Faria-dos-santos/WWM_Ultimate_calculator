import { NextResponse, type NextRequest } from 'next/server';
import { CombatService } from '@/lib/services/CombatService';
import { calculateExpectedSchema } from '@/lib/validation/schemas';
import type { CharacterBaseStats, Skill, Target } from '@/lib/types';
import type { DamageBonus } from '@/lib/calculators';

/**
 * POST /api/calculate/expected — Expected Value complet (distribution + variance).
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = calculateExpectedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { stats, skill, target, bonuses } = parsed.data;
    const service = new CombatService();

    const result = service.calculateExpectedValue(
      stats as CharacterBaseStats,
      skill as unknown as Skill,
      target as Target,
      (bonuses ?? []) as readonly DamageBonus[]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/calculate/expected error:', error);
    return NextResponse.json(
      { error: 'Erreur de calcul' },
      { status: 500 }
    );
  }
}
