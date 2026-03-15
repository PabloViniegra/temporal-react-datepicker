import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: { presets: [reactCompilerPreset()] }
    }),
    dts({ insertTypesEntry: true, include: ['src/lib'] })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'TemporalDatePicker',
      fileName: 'index',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@js-temporal/polyfill'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@js-temporal/polyfill': 'Temporal'
        }
      }
    }
  }
})
