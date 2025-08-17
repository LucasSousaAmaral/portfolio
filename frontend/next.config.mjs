/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH ?? '';
const assetPrefix = process.env.ASSET_PREFIX ?? '';
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },
};
export default nextConfig;