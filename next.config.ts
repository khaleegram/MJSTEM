
import type {NextConfig} from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});


const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/ethics-policies',
        permanent: true,
      },
      {
        source: '/aims-scope',
        destination: '/about-journal',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
