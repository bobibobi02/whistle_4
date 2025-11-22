// pages/admin/analytics.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

//  Recharts + DOM APIs must be client-side. We dynamically import the dashboard with SSR disabled.
const AnalyticsDashboard = dynamic(
  () => import("../../src/components/AnalyticsDashboard"),
  { ssr: false, loading: () => <p>Loading analytics</p> }
);

export const getServerSideProps: GetServerSideProps = async () => {
  // Exporting GSSP makes the page dynamic (prevents static prerender during build)
  // and avoids the Minified React error #31 you were hitting.
  return { props: {} };
};

export default function AdminAnalyticsPage() {
  return (
    <>
      <Head>
        <title>Admin  Analytics</title>
      </Head>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Community Analytics</h1>
        <AnalyticsDashboard />
      </div>
    </>
  );
}

