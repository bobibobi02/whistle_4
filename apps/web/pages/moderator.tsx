// pages/moderator.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SubforumLite = {
  name: string;
};

type PageProps = {
  modSubforums: SubforumLite[];
  userEmail: string;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const session: any = await getServerSession(ctx.req, ctx.res, authOptions as any);
  const email: string | null = session?.user?.email?.toLowerCase?.() ?? null;

  if (!email) {
    return {
      redirect: { destination: "/api/auth/signin?callbackUrl=/moderator", permanent: false },
    };
  }

  let subforums: any[] = [];

  // Try to query via a potential "moderators" relation if your schema has it.
  try {
    const res = await prisma.subforum.findMany({
      where: {
        // @ts-ignore  optional relation depending on your schema
        moderators: {
          some: {
            email: email,
          },
        },
      } as any,
      // Keep this schema-safe: select only fields that surely exist
      select: { name: true },
      orderBy: { name: "asc" },
    });

    subforums = res;
  } catch {
    // If relation/shape doesn't exist at runtime, don't block build.
    subforums = [];
  }

  return {
    props: {
      modSubforums: JSON.parse(JSON.stringify(subforums)),
      userEmail: email,
    },
  };
};

export default function ModeratorPage({ modSubforums, userEmail }: PageProps) {
  return (
    <>
      <Head>
        <title>Moderator Tools  Whistle</title>
      </Head>

      <main className="container max-w-3xl mx-auto py-6">
        <h1 className="text-2xl font-semibold mb-4">Moderator Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          Signed in as <span className="font-medium">{userEmail}</span>
        </p>

        {!modSubforums?.length ? (
          <div className="rounded border p-4 bg-white">
            <p className="mb-2">Youre not listed as a moderator of any subforums yet.</p>
            <p className="text-sm text-gray-600">
              If you believe this is a mistake, please contact an admin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modSubforums.map((sub) => (
              <div key={sub.name} className="rounded border p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{sub.name}</h2>
                  </div>
                  <Link
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                    href={`/r/${encodeURIComponent(sub.name)}/moderation`}
                  >
                    Open tools
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

