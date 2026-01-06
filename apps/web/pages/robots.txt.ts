import type { GetServerSideProps } from "next";

type Req = Parameters<GetServerSideProps>[0]["req"];

function getSiteUrl(req?: Req): string {
  const host = req?.headers?.host as string | undefined;

  if (host) {
    const protocol = host.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }

  // Ultimate fallback (should almost never be used)
  return "https://example.com";
}

function RobotsTxt() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const siteUrl = getSiteUrl(context.req);

  const content = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  context.res.setHeader("Content-Type", "text/plain; charset=utf-8");
  context.res.write(content);
  context.res.end();

  return { props: {} };
};

export default RobotsTxt;