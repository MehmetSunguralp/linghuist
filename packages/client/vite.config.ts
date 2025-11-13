import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@apollo/client',
      '@apollo/client/link/context',
      '@apollo/client/link/http',
      'graphql',
      '@reduxjs/toolkit',
      'react-redux',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  resolve: {
    dedupe: ['@apollo/client', 'graphql'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
