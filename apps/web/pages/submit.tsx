// pages/submit.tsx
// Reuse the exact same UI from /create-subforum but keep the auth gate here.

import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";

// IMPORTANT: keep this import path exactly how it works in your project.
// Your current submit page used "@/lib/auth", so we keep it to avoid path issues.
// If your authOptions actually live in pages/api/auth/[...nextauth].ts, you can switch to:
//   import { authOptions } from "./api/auth/[...nextauth]";
import { authOptions } from "@/lib/auth";

// Re-export the styled form component from /create-subforum
export { default } from "./create-subforum";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    return {
      redirect: { destination: "/api/auth/signin", permanent: false },
    };
  }
  return { props: {} };
};
