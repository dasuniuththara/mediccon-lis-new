import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { join } from 'path';

export default defineConfig({
    plugins: [react()],
    root: join(process.cwd(), 'src/renderer'),
    base: './',
    server: {
        port: 5173,
        strictPort: true,
    },
    build: {
        outDir: join(process.cwd(), 'dist'),
        emptyOutDir: true,
    }
});
