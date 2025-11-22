// pages/api/dev/health.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    message: "Next.js API is running",
    port: process.env.PORT || 3000,
    provider: (process.env.MAIL_PROVIDER || "resend").toLowerCase(),
  });
}
