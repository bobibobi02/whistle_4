// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function normalizeEmail(email: string | null | undefined) {
  return (email || '').trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const emailRaw = String(credentials?.email || '');
        const pass = String(credentials?.password || '');
        if (!emailRaw || !pass) return null;

        const email = normalizeEmail(emailRaw);

        // IMPORTANT: NO mode: 'insensitive' for SQLite
        const user = await prisma.user.findFirst({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true },
        });

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(pass, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name || undefined };
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(p) {
              const email = normalizeEmail((p as any).email);
              return { id: (p as any).sub, name: (p as any).name, email, image: (p as any).picture };
            },
          }),
        ]
      : []),

    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
            profile(p: any) {
              const email = normalizeEmail(p.email);
              return { id: String(p.id), name: p.name || p.login, email: email || undefined, image: p.avatar_url };
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.uid) (session.user as any).id = token.uid as string;
      if (session.user?.email) session.user.email = normalizeEmail(session.user.email);
      return session;
    },
    async signIn({ user }) {
      if (user?.email) {
        const email = normalizeEmail(user.email);
        if (email !== user.email) {
          try {
            await prisma.user.update({ where: { id: user.id as string }, data: { email } });
            user.email = email;
          } catch {}
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
