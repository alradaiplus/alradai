/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When wrapped by Tauri, produce a static export. Web/Vercel builds leave
  // this unset and keep server-side rendering for /not-found etc.
  ...(process.env.NOTER_STATIC === '1'
    ? { output: 'export', images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
