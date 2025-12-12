import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Use esbuild for minification (default, fast)
        minify: 'esbuild',
        // Code splitting configuration
        rollupOptions: {
          output: {
            // Manual chunk splitting for better caching
            manualChunks: {
              // Vendor chunks - rarely change, can be cached long-term
              'vendor-react': ['react', 'react-dom'],
              'vendor-animation': ['framer-motion'],
              'vendor-icons': ['lucide-react'],
            },
            // Chunk file naming for better caching
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          },
        },
        // Target modern browsers for smaller output
        target: 'es2020',
        // Generate source maps for debugging
        sourcemap: false,
        // Chunk size warnings threshold
        chunkSizeWarningLimit: 500,
      },
    };
});
