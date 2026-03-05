import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import type { SubscriptionTier } from '@prisma/client';
import '@/lib/auth/types';

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Mot de passe', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email as string;
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        tier: user.tier,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }));
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(Discord({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  }));
}

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig['adapter'],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.tier = (user as { tier: SubscriptionTier }).tier;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tier = token.tier as SubscriptionTier;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
