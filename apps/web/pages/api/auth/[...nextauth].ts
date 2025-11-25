import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const emailRaw =
          (credentials as any)?.email ??
          (credentials as any)?.username ??
          (credentials as any)?.identifier;

        const passwordRaw = (credentials as any)?.password;

        if (!emailRaw || !passwordRaw) {
          throw new Error("Missing email or password");
        }

        const email = String(emailRaw).trim().toLowerCase();
        const password = String(passwordRaw);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const stored =
          (user as any).passwordHash ??
          (user as any).password ??
          null;

        if (!stored) {
          return null;
        }

        const looksHashed =
          stored.startsWith("$2a$") ||
          stored.startsWith("$2b$") ||
          stored.startsWith("$2y$");

        let ok = false;
        if (looksHashed) {
          ok = await bcrypt.compare(password, stored);
        } else {
          ok = password === stored;
        }

        if (!ok) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: (user as any).image ?? null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as any).id) {
        (session.user as any).id = (token as any).id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);