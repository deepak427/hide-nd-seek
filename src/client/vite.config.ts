import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: '../../dist/client',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Optimize for Reddit deployment - create fewer, larger chunks
          manualChunks: (id) => {
            // Bundle all node_modules into vendor chunk
            if (id.includes('node_modules')) {
              if (id.includes('phaser')) {
                return 'phaser';
              }
              return 'vendor';
            }
            // Bundle all game code into main chunk
            return 'main';
          },
          // Use consistent naming for better caching
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
      },
      // Optimize for production deployment
      ...(mode === 'production' && {
        minify: 'terser',
        terserOptions: {
          compress: {
            passes: 2,
            drop_console: true, // Remove console logs in production
            drop_debugger: true,
          },
          mangle: true,
          format: {
            comments: false,
          },
        },
      }),
    },
    // Ensure proper module resolution for Reddit environment
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };
});
