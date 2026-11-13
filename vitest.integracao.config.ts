import { defineConfig } from 'vitest/config'
import { ALIASES } from './vitest.config.js'

// Roteiro de integração contra a API LOCAL com uma chave lero_test_ (Simulador). Nunca roda no CI.
export default defineConfig({
  resolve: { alias: ALIASES },
  test: {
    include: ['integracao/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    sequence: { concurrent: false },
  },
})
