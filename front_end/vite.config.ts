import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['dldrlddl.jp.ngrok.io', 'dmddo.ngrok.app']
  }
})