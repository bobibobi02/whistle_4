// pages/api/auth/reset/request.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== "POST") return res.status(405).end();
  const { email="" } = (req.body||{}) as { email?: string };
  if (!email) return res.status(200).json({ ok:true });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 1000*60*30);

  try{
    await prisma.passwordResetToken.deleteMany({ where:{ email } }).catch(()=>{});
    const rows = (await prisma.$queryRawUnsafe(
  `PRAGMA table_info('PasswordResetToken')`
)) as Array<{ name?: string }> | unknown;

const hasTokenHash =
  Array.isArray(rows) && rows.some((c: any) => c?.name === "tokenHash");
    if (hasTokenHash){
      await prisma.passwordResetToken.create({ data:{ email, tokenHash, expiresAt } as any });
    } else {
      await prisma.passwordResetToken.create({ data:{ email, token, expiresAt } as any });
    }
  }catch(e){ console.warn("[reset/request] store warn:", e); }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "no-reply@whistle.local";
  if (!apiKey) return res.status(500).json({ error:"RESEND_API_KEY missing" });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${base}/reset?token=${token}&email=${encodeURIComponent(email)}`;

  try{
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to: email, subject: "Reset your Whistle password", html:`<p><a href="${link}">${link}</a></p>` });
  }catch(e:any){ console.error("Email send failed:", e); return res.status(500).json({ error:"email send failed" }); }

  return res.status(200).json({ ok:true });
}

