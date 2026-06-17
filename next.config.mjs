/** @type {import('next').NextConfig} */
const basePath = process.env.NOTER_BASE_PATH ?? '';

const nextConfig = {
  reactStrictMode: true,
  // When wrapped by Tauri or hosted on GitHub Pages, produce a static
  // export. Web/Vercel builds leave NOTER_STATIC unset and keep SSR.
  ...(process.env.NOTER_STATIC === '1'
    ? { output: 'export', images: { unoptimized: true } }
    : {}),
  ...(basePath
    ? { basePath, assetPrefix: basePath, trailingSlash: true }
    : {}),
};

export default nextConfig;
