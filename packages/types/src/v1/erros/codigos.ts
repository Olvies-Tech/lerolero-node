import { CATALOGO_DE_ERROS, type CodigoConhecido } from './catalogo.gerado.js'
import type { EntradaDoCatalogo } from './entrada.js'

/**
 * Um código de erro da API. O editor completa os conhecidos; um código novo, que a API mande antes de o SDK conhecer,
 * também cabe aqui sem quebrar o seu código.
 */
export type CodigoDeErro = CodigoConhecido | (string & {})

export function ehCodigoConhecido(codigo: string): codigo is CodigoConhecido {
  return Object.hasOwn(CATALOGO_DE_ERROS, codigo)
}

/** O que o catálogo sabe do código, ou `null` para um código que o SDK ainda não conhece. */
export function entradaDoCatalogo(codigo: CodigoDeErro): EntradaDoCatalogo | null {
  return ehCodigoConhecido(codigo) ? CATALOGO_DE_ERROS[codigo] : null
}
