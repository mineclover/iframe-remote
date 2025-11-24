import { defineConfig } from 'vite'

export default defineConfig({
  root: './examples',
  server: {
    port: 4500,
    open: '/',
  },
  build: {
    outDir: '../dist-examples',
    emptyOutDir: true,
  },
})
