/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isTest = mode === 'test';
    return {
      base: './',
      server: {
        port: 3001,
        host: isTest ? '127.0.0.1' : '0.0.0.0',
      },
      plugins: [react()],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
