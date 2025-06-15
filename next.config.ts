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
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://6000-firebase-studio-1749945109424.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
      'https://6000-firebase-studio-1749945109424.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev:6000',
    ],
  },
};

export default nextConfig;
