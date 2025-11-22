// apps/web/src/auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = String((user as any).id ?? token.sub ?? "");
        token.email = (user as any).email ?? token.email;
        token.name = (user as any).name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session?.user) {
        (session.user as any) = {
          id: token.sub as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
