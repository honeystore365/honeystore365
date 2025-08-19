/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuration des images
  images: {
    domains: [
      'llsifflkfjogjagmbmpi.supabase.co',
      'images.unsplash.com',
      'via.placeholder.com',
      'res.cloudinary.com',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configuration du build
  poweredByHeader: false,

  // Optimisation des bundles
  webpack: (config, { isServer, dev }) => {
    // Gestion de Puppeteer/Chromium pour Vercel
    if (!isServer && !dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Optimisation pour Vercel
    if (process.env.VERCEL === '1') {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: false,
        concatenateModules: true,
      };
    }

    return config;
  },

  // Configuration expérimentale
  experimental: {
    // Optimisation des builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Configuration des environnements
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
