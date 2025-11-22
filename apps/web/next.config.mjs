/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    // Do not fail the build on ESLint errors (we'll clean them up over time)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;