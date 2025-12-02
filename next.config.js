/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    // Prevent firebase-admin from being bundled on the client side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

module.exports = nextConfig;
