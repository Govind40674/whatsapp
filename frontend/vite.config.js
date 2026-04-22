import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // 🔥 allows mobile access
    port: 5174      // optional (use the port you're getting)
  }
})