import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    middlewareClientMaxBodySize: "100mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default withNextIntl(nextConfig);
