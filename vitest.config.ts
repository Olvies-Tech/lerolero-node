import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const caminho = (relativo: string) => fileURLToPath(new URL(relativo, import.meta.url))

export const ALIASES = {
  '@lerolero/types/v1': caminho('./packages/types/src/v1/index.ts'),
  '@lerolero/rest': caminho('./packages/rest/src/index.ts'),
  '@lerolero/sdk/v1': caminho('./packages/sdk/src/v1/index.ts'),
  '@lerolero/sdk': caminho('./packages/sdk/src/v1/index.ts'),
}

export default defineConfig({
  resolve: { alias: ALIASES },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'test/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
})
