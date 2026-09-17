import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import type { User as DbUser } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const USER_ROLES = new Set(['ADMIN', 'AHASS'] as const);

type UserRole = 'ADMIN' | 'AHASS';

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.has(value as UserRole);
}

function normalizeUserRole(value: unknown): UserRole {
  return isUserRole(value) ? value : 'AHASS';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const email = String(credentials?.email || '').trim().toLowerCase();
          const password = String(credentials?.password || '');
          if (!email || !password) return null;

          const user: DbUser | null = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.active) return null;

          const validPassword = await bcrypt.compare(password, user.passwordHash);
          if (!validPassword) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: normalizeUserRole(user.role),
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user === 'object' && 'role' in user) {
        token.role = normalizeUserRole(user.role);
      }
      if (!token.role || !isUserRole(token.role)) {
        token.role = 'AHASS';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || session.user.id || '';
        session.user.role = normalizeUserRole(token.role);
      }
      return session;
    },
  },
});
