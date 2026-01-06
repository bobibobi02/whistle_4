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

function SitemapXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const siteUrl = getSiteUrl(context.req);

  const pages: string[] = [
    "",
    "/feed",
    "/popular",
    "/create",
    "/login",
    "/register",
    "/profile",
    "/saved",
    "/settings",
    "/about",
    "/terms",
    "/privacy",
    "/moderation",
    "/appeals",
    "/search",
  ];

  const urls = pages
    .map((path) => {
      const loc = path ? `${siteUrl}${path}` : siteUrl;
      return `<url><loc>${loc}</loc></url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  context.res.setHeader("Content-Type", "application/xml; charset=utf-8");
  context.res.write(xml);
  context.res.end();

  return { props: {} };
};

export default SitemapXml;