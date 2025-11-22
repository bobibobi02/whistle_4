// pages/appeals.tsx
import Head from 'next/head';
import AppealForm from '@/components/AppealForm';
import ModActionReviewer from '@/components/ModActionReviewer';
import RoleControls from '@/components/RoleControls';
import ModeratorControls from '@/components/ModeratorControls';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function AppealsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Safe, no-UI-change defaults
  const subforumName =
    (router.query.subforum as string) || 'General';
  const currentRole =
    (router.query.role as string) || 'member';
  const isNew =
    router.query.isNew === '1' || router.query.isNew === 'true';

  // Prefer a stable identifier; fall back to email
  const userId =
    // if your NextAuth session exposes an id on the user object:
    (session?.user as any)?.id ??
    // otherwise use the email your app already relies on:
    session?.user?.email ??
    null;

  return (
    <>
      <Head><title>Appeals  Whistle</title></Head>
      <div className="container">
        <AppealForm />
        <ModActionReviewer />
        <RoleControls
          subforumName={subforumName as any}
          userId={userId as any}
          currentRole={currentRole as any}
          isNew={!!isNew}
        />
        <ModeratorControls />
      </div>
    </>
  );
}

