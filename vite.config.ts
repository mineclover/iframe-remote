import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './examples',
  server: {
    port: 3000,
    open: '/iframe-previewer.html',
  },
  build: {
    outDir: '../dist-examples',
    emptyOutDir: true,
  },
})
