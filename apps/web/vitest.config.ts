import { defineConfig } from 'vitest/config';

// Sem o plugin do React: o esbuild já compila o JSX (jsx: react-jsx no tsconfig).
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
