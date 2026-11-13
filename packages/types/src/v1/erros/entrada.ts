import type { FamiliaDoErro } from './catalogo.gerado.js'

/** O tipo do erro na API: 0 falha, 1 inesperado, 2 validação, 3 conflito, 4 não encontrado, 5 não autorizado, 6 proibido. */
export type TipoDoErroDaApi = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** O que o catálogo sabe de um código de erro. */
export interface EntradaDoCatalogo {
  readonly familia: FamiliaDoErro
  /** O status HTTP com que a API devolve o código. */
  readonly status: number
  readonly type: TipoDoErroDaApi
  /** Quando acontece. */
  readonly significado: string
  /** O que fazer. */
  readonly comoResolver: string
  /** Repetir o mesmo pedido mais tarde resolve (instabilidade ou limite de velocidade). */
  readonly repetivel: boolean
}
