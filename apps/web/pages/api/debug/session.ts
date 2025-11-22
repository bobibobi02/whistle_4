// apps/web/pages/api/debug/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookieHeader = req.headers.cookie || "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);

  const session = await getServerSession(req, res, authOptions).catch(() => null);

  let token: any = null;
  try {
    // With v4 Pages Router, NextAuth's default cookie name is "next-auth.session-token" (HTTP) or "__Secure-next-auth.session-token" (HTTPS)
    // getToken({ req }) will auto-detect
    token = await getToken({ req });
  } catch {}

  res.status(200).json({
    ok: true,
    method: req.method,
    cookieNames,
    hasCookieHeader: Boolean(cookieHeader),
    session: session ?? null,
    hasToken: Boolean(token),
    tokenPreview: token
      ? {
          sub: token.sub ?? null,
          email: token.email ?? null,
          name: token.name ?? null,
          iat: token.iat ?? null,
          exp: token.exp ?? null,
        }
      : null,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
      has_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    },
  });
}
