import { vi } from 'vitest';

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

import { getAuthenticatedUser, isOwner } from '@/lib/auth/helpers';
import { auth } from '@/lib/auth/config';

const mockAuth = vi.mocked(auth);

// ─── getAuthenticatedUser ───────────────────────────────────────────

describe('getAuthenticatedUser', () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it('retourne user quand la session est valide', async () => {
    const fakeUser = { id: 'user1', tier: 'FREE', email: 'test@test.com' };
    mockAuth.mockResolvedValue({ user: fakeUser } as never);

    const { user, error } = await getAuthenticatedUser();

    expect(error).toBeNull();
    expect(user).toEqual(fakeUser);
  });

  it('retourne erreur 401 quand auth() retourne null', async () => {
    mockAuth.mockResolvedValue(null as never);

    const { user, error } = await getAuthenticatedUser();

    expect(user).toBeNull();
    expect(error).not.toBeNull();
    expect(error!.status).toBe(401);
  });

  it('retourne erreur 401 quand session.user.id est undefined', async () => {
    mockAuth.mockResolvedValue({
      user: { id: undefined, email: 'test@test.com' },
    } as never);

    const { user, error } = await getAuthenticatedUser();

    expect(user).toBeNull();
    expect(error).not.toBeNull();
    expect(error!.status).toBe(401);
  });
});

// ─── isOwner ────────────────────────────────────────────────────────

describe('isOwner', () => {
  it('retourne true si les IDs correspondent', () => {
    expect(isOwner('user-abc', 'user-abc')).toBe(true);
  });

  it('retourne false si les IDs diffèrent', () => {
    expect(isOwner('user-abc', 'user-xyz')).toBe(false);
  });

  it('retourne true si les deux strings sont vides (égalité stricte)', () => {
    expect(isOwner('', '')).toBe(true);
  });
});
