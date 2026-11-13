/** Telefone em E.164, com o `+` e o código do país (ex.: `+5511993185520`). */
export type Telefone = `+${string}`

/** Data e hora em ISO 8601 com fuso, como a API devolve (ex.: `2026-10-22T10:15:03-03:00`). */
export type DataHora = string

/** Id público de um cliente da revenda (`cli_...`). */
export type IdDoCliente = `cli_${string}`

/**
 * Como a API aceita um cliente nos envios e filtros: o id (`cli_...`) ou o id externo do cadastro (ex.: `clinica-sorriso`).
 * Na conta direta, ou com a chave de um cliente só, pode ficar de fora.
 */
export type ReferenciaDoCliente = IdDoCliente | (string & {})

/** Ambiente na API: `1` teste (Simulador, chave `lero_test_`) e `2` produção (chave `lero_live_`). */
export type CodigoDoAmbiente = 1 | 2

/** Ambiente da chave, derivado do prefixo: `lero_test_` é teste e `lero_live_` é produção. */
export type Ambiente = 'teste' | 'producao'

/** O que a API guarda junto do envio e devolve em todo evento da mensagem. */
export type Metadata = Readonly<Record<string, unknown>>

/** Uma página de uma listagem: o total de itens no filtro e os itens da página. */
export interface Pagina<T> {
  total: number
  dados: T[]
}

/** Paginação das listagens. */
export interface FiltroDePagina {
  /** A primeira página é a `0`. */
  pagina?: number
  /** Itens por página: padrão 10, máximo 100. */
  limite?: number
}

/** O cliente como aparece dentro de mensagens, templates, opt-outs e webhooks. */
export interface ClienteResumido {
  id: IdDoCliente
  idExterno: string | null
  nome: string
}

/** Erro de um item (mensagem, telefone da janela, evento da linha do tempo), com o código `EX` da API. */
export interface ErroDoItem {
  code: string
  description: string | null
}
