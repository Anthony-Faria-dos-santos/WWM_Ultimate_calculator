import { NextResponse, type NextRequest } from 'next/server';
import { CombatService } from '@/lib/services/CombatService';
import { calculateGraduationSchema } from '@/lib/validation/schemas';

/**
 * POST /api/calculate/graduation — Graduation Rate (comparaison DPS).
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = calculateGraduationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { yourDPS, referenceDPS } = parsed.data;
    const service = new CombatService();

    const result = service.calculateGraduation(yourDPS, referenceDPS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/calculate/graduation error:', error);
    return NextResponse.json(
      { error: 'Erreur de calcul' },
      { status: 500 }
    );
  }
}
