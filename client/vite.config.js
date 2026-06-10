import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data fetching & state
          'vendor-query': ['@tanstack/react-query'],
          // UI utilities
          'vendor-ui':    ['lucide-react', 'react-hot-toast', 'clsx'],
          // Form & dates
          'vendor-form':  ['react-hook-form', 'date-fns'],
          // Networking & security
          'vendor-net':   ['axios', 'socket.io-client', 'dompurify'],
        }
      }
    }
  }
})