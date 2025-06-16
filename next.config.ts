
import type {NextConfig} from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Explicitly disable reactStrictMode
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
  webpack: (
    config: WebpackConfiguration,
    { isServer }
  ) => {
    if (isServer) {
      // Add handlebars to externals to prevent webpack processing errors
      // for server-side bundles.
      config.externals = [...(config.externals || []), "handlebars"];
    }
    return config;
  },
};

export default nextConfig;
