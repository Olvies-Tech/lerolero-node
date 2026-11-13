import type { Options } from 'tsup'

/**
 * O build de todos os pacotes: ESM e CommonJS lado a lado, com os tipos para os dois (`.d.ts` e `.d.cts`), para quem usa
 * `import` (TypeScript, ESM) e quem usa `require` (JavaScript em CommonJS, comum em ERPs e backends Express antigos).
 */
export function buildDoPacote(entradas: Record<string, string>): Options {
  return {
    entry: entradas,
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'node18',
    platform: 'node',
    splitting: false,
    treeshake: true,
  }
}
