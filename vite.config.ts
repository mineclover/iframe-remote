import { defineConfig } from 'vite'
import { resolve } from 'path'

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
