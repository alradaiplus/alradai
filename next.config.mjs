/** @type {import('next').NextConfig} */

// When building for GitHub Pages we produce a fully static export served from
// a project sub-path (https://<org>.github.io/<repo>/). Everything below is
// gated on NEXT_PUBLIC_STATIC_EXPORT so normal `next build` / Vercel keeps the
// server features (the /api/ai/chat route, image optimization, SSR).
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Static export can't run the optimizer; emit plain <img> instead.
    unoptimized: isStatic,
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // tldraw and react-force-graph ship ESM that benefits from transpilation
  transpilePackages: ["react-force-graph-2d", "force-graph"],
  ...(isStatic
    ? {
        output: "export",
        basePath,
        assetPrefix: basePath || undefined,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
