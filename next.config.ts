import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark native Node.js modules as external for server builds
  serverExternalPackages: ['@napi-rs/canvas'],
  // Increase body size limit for file uploads (default is 1MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jnaibnwxpweahpawxycf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ndskcbuzsmrzgnvdbofd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Wikimedia Commons images (from Wikidata imports)
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
