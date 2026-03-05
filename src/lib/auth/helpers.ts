import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

/**
 * Récupère l'utilisateur authentifié depuis la session.
 *
 * @returns Objet avec `user` (ou null) et `error` (NextResponse 401 si non authentifié)
 */
export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      ),
    };
  }

  return { user: session.user, error: null };
}

/**
 * Vérifie que l'utilisateur est propriétaire de la ressource.
 *
 * @param resourceUserId - ID du propriétaire de la ressource
 * @param sessionUserId - ID de l'utilisateur en session
 * @returns true si les IDs correspondent
 */
export function isOwner(resourceUserId: string, sessionUserId: string): boolean {
  return resourceUserId === sessionUserId;
}
