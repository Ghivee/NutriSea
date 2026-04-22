import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: '/NutriSea-WebApp/'
// Vercel / Local: '/'
export default defineConfig(({ mode }) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  const base = (mode === 'production' && !isVercel) ? '/NutriSea-WebApp/' : '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5174,
      strictPort: false
    }
  }
})
