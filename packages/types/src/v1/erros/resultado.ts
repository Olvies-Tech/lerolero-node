import type { FamiliaDoErro } from './catalogo.gerado.js'
import type { CodigoDeErro } from './codigos.js'
import type { TipoDoErroDaApi } from './entrada.js'

/** Um erro como a API manda em `errors`, com o código `EX` (ex.: `EXM-0002`) e o campo, quando o erro é de um campo. */
export interface ErroDaApi {
  code: CodigoDeErro
  description: string
  type: TipoDoErroDaApi
  field?: string | null
}

/** Categorias de erro que a API devolve, decididas pelo status HTTP da resposta. */
export type CategoriaDoErroDaApi =
  | 'validacao'
  | 'autenticacao'
  | 'permissao'
  | 'nao_encontrado'
  | 'conflito'
  | 'limite'
  | 'indisponivel'
  | 'inesperado'

/**
 * A API respondeu com erro. `code`, `description`, `type` e `field` são os do primeiro erro; `erros` traz todos.
 * `familia`, `significado`, `comoResolver` e `repetivel` vêm do catálogo do SDK e ficam `null` para um código que o SDK
 * ainda não conhece.
 */
export interface FalhaDaApi {
  categoria: CategoriaDoErroDaApi
  status: number
  code: CodigoDeErro
  description: string
  type: TipoDoErroDaApi | null
  field: string | null
  familia: FamiliaDoErro | null
  significado: string | null
  comoResolver: string | null
  /** Repetir o mesmo pedido mais tarde resolve. O SDK já repete sozinho quando é seguro. */
  repetivel: boolean | null
  erros: readonly ErroDaApi[]
}

/** A requisição não chegou à API (DNS, conexão recusada ou derrubada). */
export interface FalhaDeRede {
  categoria: 'rede'
  description: string
}

/**
 * A API não respondeu dentro do tempo limite. Quando `possivelmenteProcessada`, o pedido pode ter sido feito: no envio de
 * mensagem, repita com a mesma `chaveDeIdempotencia` (está em `detalhes`) e a API devolve a mesma mensagem em vez de
 * enviar outra; nos outros, confira antes de tentar de novo.
 */
export interface FalhaPorTempo {
  categoria: 'timeout'
  description: string
  /** Falso só em consulta (GET), que não muda nada. */
  possivelmenteProcessada: boolean
}

/** O SDK recusou antes de chamar a API, por configuração (ex.: chave que não começa com `lero_test_` ou `lero_live_`). */
export interface FalhaDeConfiguracao {
  categoria: 'configuracao'
  description: string
}

/** Por que a verificação de um webhook recusou a entrega. */
export type MotivoDaRecusaDoWebhook =
  | 'sem_cabecalhos'
  | 'timestamp_invalido'
  | 'timestamp_fora_da_tolerancia'
  | 'assinatura_invalida'
  | 'corpo_invalido'

/** O webhook recebido não passou na verificação: não processe o corpo. */
export interface FalhaNaVerificacaoDoWebhook {
  categoria: 'webhook'
  motivo: MotivoDaRecusaDoWebhook
  description: string
}

/** Os erros de uma chamada à API. Use `categoria` para decidir o que fazer. */
export type ErroDaChamada = FalhaDaApi | FalhaDeRede | FalhaPorTempo | FalhaDeConfiguracao

/** Todo erro que um método do SDK pode devolver. */
export type ErroDoLeroLero = ErroDaChamada | FalhaNaVerificacaoDoWebhook

/** O que aconteceu na chamada à API, com sucesso ou não. */
export interface DetalhesDaChamada {
  /** Status HTTP da última tentativa; `null` quando a API não respondeu. */
  status: number | null
  /** Quantas vezes a requisição saiu (1 quando não houve retentativa). */
  tentativas: number
  /** A `Idempotency-Key` usada em todas as tentativas, quando a chamada tem uma. */
  chaveDeIdempotencia: string | null
  /** A API reconheceu a `Idempotency-Key` e devolveu o resultado do pedido anterior, sem fazer de novo. */
  repetida: boolean
}

export interface Sucesso<T> {
  sucesso: true
  dados: T
  erro: null
}

export interface Falha<E extends ErroDoLeroLero> {
  sucesso: false
  dados: null
  erro: E
}

/** Sucesso com os dados ou falha com o erro: nenhum método do SDK lança exceção. */
export type Resultado<T, E extends ErroDoLeroLero = ErroDoLeroLero> = Sucesso<T> | Falha<E>

/**
 * O retorno de toda chamada à API, com os detalhes da requisição (status, tentativas e idempotência).
 *
 * @example
 * const resultado = await lero.mensagens.obter('msg_4kd8s2m9x7q3w5e1r6t2y8u4')
 * if (!resultado.sucesso) return console.error(resultado.erro.categoria, resultado.erro.description)
 * console.log(resultado.dados.status)
 */
export type RespostaDaApi<T> = Resultado<T, ErroDaChamada> & { detalhes: DetalhesDaChamada }
