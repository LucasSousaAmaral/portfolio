/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // 👈 força Next a gerar build estático em /out

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },
};

export default nextConfig;