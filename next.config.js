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
    
    // Fix for pdfjs-dist compatibility with Next.js
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
        'encoding': false,
      };
      
      // Handle pdfjs-dist worker files
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/worker/[hash][ext][query]'
        }
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
