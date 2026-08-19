import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const pagesBase = process.env.GITHUB_ACTIONS === 'true' ? '/jurrassic-test/' : '/'
const useHttps = process.env.VITE_HTTPS !== '0'

export default defineConfig({
  base: pagesBase,
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
  },
  preview: {
    host: true,
  },
})
