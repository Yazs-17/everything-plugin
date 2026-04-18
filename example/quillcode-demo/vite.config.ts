import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@yazs/everything-plugin': path.resolve(__dirname, '../../src/index.ts')
    }
  }
})
