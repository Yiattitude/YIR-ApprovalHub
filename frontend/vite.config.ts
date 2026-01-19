import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('scheduler')) {
                            return 'react-vendor'
                        }
                        if (id.includes('zustand') || id.includes('immer')) {
                            return 'state-vendor'
                        }
                        if (id.includes('lucide-react')) {
                            return 'icons'
                        }
                        if (id.includes('date-fns') || id.includes('chart.js')) {
                            return 'visualization'
                        }
                    }
                }
            }
        }
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true
            }
        }
    }
})
