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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Added for placeholder images
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      { // Added for Supabase Storage
        protocol: 'https',
        hostname: 'llsifflkfjogjagmbmpi.supabase.co', // Replace with your Supabase project ID hostname
        port: '',
        pathname: '/storage/v1/object/public/**', // Allow access to public storage objects
      },
    ],
  },
};

export default nextConfig;
