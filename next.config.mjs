/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // tldraw and react-force-graph ship ESM that benefits from transpilation
  transpilePackages: ["react-force-graph-2d", "force-graph"],
};

export default nextConfig;
