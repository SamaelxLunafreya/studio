import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  devIndicators: {
    buildActivity: false, // Disable the build activity indicator
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev', // Keep existing wildcard
      'https://6000-firebase-studio-1749945109424.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev', // Specific origin without port
      'https://6000-firebase-studio-1749945109424.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev:6000', // Specific origin with port 6000
    ],
  },
};

export default nextConfig;
