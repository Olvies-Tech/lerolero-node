import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const READMES = ['README.md', 'packages/sdk/README.md', 'packages/rest/README.md', 'packages/types/README.md']

interface Exemplo {
  nome: string
  caminho: string
  codigo: string
}

function exemplosDos(readmes: readonly string[]): Exemplo[] {
  return readmes.flatMap((readme) => {
    const texto = readFileSync(join(RAIZ, readme), 'utf8')
    return [...texto.matchAll(/```ts\r?\n([\s\S]*?)```/g)].map(([, codigo = ''], indice) => ({
      nome: `${readme} #${indice + 1}`,
      caminho: join(RAIZ, 'test', 'readme', `exemplo-${readme.replace(/\W/g, '-')}-${indice + 1}.ts`),
      codigo,
    }))
  })
}

/**
 * Compila os exemplos em TypeScript em memória, como o projeto de quem integra: estrito, com
 * `exactOptionalPropertyTypes`. Os exemplos com `require` são conferidos no pacote empacotado, em `pnpm test:consumo`.
 */
function errosDeCompilacao(exemplos: readonly Exemplo[]): string[] {
  const opcoes: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    noEmit: true,
    skipLibCheck: true,
    types: ['node'],
    baseUrl: RAIZ,
    paths: {
      '@lerolero/sdk': ['packages/sdk/src/v1/index.ts'],
      '@lerolero/sdk/v1': ['packages/sdk/src/v1/index.ts'],
      '@lerolero/rest': ['packages/rest/src/index.ts'],
      '@lerolero/types/v1': ['packages/types/src/v1/index.ts'],
    },
  }
  const virtuais = new Map(exemplos.map((exemplo) => [exemplo.caminho, exemplo.codigo]))
  const anfitriao = ts.createCompilerHost(opcoes)
  const lerOriginal = anfitriao.readFile.bind(anfitriao)
  const existeOriginal = anfitriao.fileExists.bind(anfitriao)
  anfitriao.readFile = (arquivo) => virtuais.get(ts.sys.resolvePath(arquivo)) ?? lerOriginal(arquivo)
  anfitriao.fileExists = (arquivo) => virtuais.has(ts.sys.resolvePath(arquivo)) || existeOriginal(arquivo)

  const raizes = [...virtuais.keys(), join(RAIZ, 'test', 'readme', 'ambiente.d.ts')]
  const programa = ts.createProgram(raizes, opcoes, anfitriao)
  return ts
    .getPreEmitDiagnostics(programa)
    .filter((diagnostico) => diagnostico.file && virtuais.has(ts.sys.resolvePath(diagnostico.file.fileName)))
    .map((diagnostico) => {
      const exemplo = exemplos.find(
        (e) => ts.sys.resolvePath(e.caminho) === ts.sys.resolvePath(diagnostico.file?.fileName ?? ''),
      )
      const linha = diagnostico.file?.getLineAndCharacterOfPosition(diagnostico.start ?? 0).line ?? 0
      return `${exemplo?.nome} linha ${linha + 1}: ${ts.flattenDiagnosticMessageText(diagnostico.messageText, '\n')}`
    })
}

describe('exemplos dos READMEs', () => {
  const exemplos = exemplosDos(READMES)

  it('há exemplos em todos os READMEs', () => {
    for (const readme of READMES) expect(exemplos.some((exemplo) => exemplo.nome.startsWith(readme))).toBe(true)
  })

  it('todo exemplo compila contra os tipos do SDK', () => {
    expect(errosDeCompilacao(exemplos)).toEqual([])
  }, 60_000)
})
