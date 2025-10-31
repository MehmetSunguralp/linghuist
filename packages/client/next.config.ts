import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow cross-origin requests from mobile devices on the local network
  allowedDevOrigins: ['http://192.168.1.7:3001', 'http://localhost:3001'],
};

export default nextConfig;
