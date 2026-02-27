import type { SubscriptionTier } from '@prisma/client';
import 'next-auth';
import '@auth/core/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tier: SubscriptionTier;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    tier: SubscriptionTier;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    tier: SubscriptionTier;
  }
}
