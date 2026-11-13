import type { Ambiente, DetalhesDaChamada, ErroDaChamada, RespostaDaApi } from '@lerolero/types/v1'
import { type ChaveDaApi, lerChave } from './chave.js'
import { EFEITOS_DO_NODE, type Efeitos, variavelDeAmbiente, versaoDoNode } from './efeitos.js'
import { interpretarResposta } from './envelope.js'
import {
  type ContextoDoLimite,
  type OpcoesDeRetentativa,
  RETENTATIVA_PADRAO,
  deveRepetir,
  ehSeguraParaRepetir,
  esperaExponencial,
  esperaPedidaPelaApi,
} from './retentativa.js'
import { type RequisicaoHttp, type Tentativa, tentarUmaVez } from './tentativa.js'
import { type Consulta, montarUrl } from './url.js'
import { VERSAO_DO_SDK } from './versao.js'

export interface OpcoesDoClienteRest {
  /**
   * A chave da API: `lero_test_...` (teste, no Simulador) ou `lero_live_...` (produção). Sem ela, o cliente lê a
   * variável de ambiente `LERO_API_KEY`. Nunca deixe a chave no código.
   */
  chave?: string | undefined
  /** Padrão: `https://api.lerolero.tech`. */
  urlBase?: string
  /** A versão da API no caminho. Padrão: 1 (`/v1`). */
  versao?: number
  /** Tempo limite de cada tentativa. Padrão: 30 segundos. */
  tempoLimiteMs?: number
  /** Cabeçalhos a mais em todas as requisições. */
  cabecalhos?: Readonly<Record<string, string>>
  retentativa?: OpcoesDeRetentativa
  /** Chamado quando a API responde 429 (muitas requisições). Um erro lançado aqui é ignorado. */
  aoBaterLimite?: (contexto: ContextoDoLimite) => void | Promise<void>
  /** Troca o `fetch`, a espera, o relógio, o sorteio ou o gerador de `Idempotency-Key` (útil em testes). */
  efeitos?: Partial<Efeitos>
}

/** Opções de uma requisição; as que também existem no cliente valem só para esta chamada. */
export interface OpcoesDaRequisicao {
  consulta?: Consulta
  cabecalhos?: Readonly<Record<string, string>>
  tempoLimiteMs?: number
  retentativa?: OpcoesDeRetentativa
  /**
   * Manda `Idempotency-Key`, a mesma em todas as tentativas, gerada quando `chave` fica de fora. Com ela a API não faz o
   * pedido duas vezes, então o cliente repete também em 5xx e tempo esgotado, como faz com GET.
   */
  idempotencia?: { chave?: string }
}

/** O corpo da requisição: um objeto vai como JSON; `FormData` vai como multipart. */
export type CorpoDaRequisicao = FormData | object

/**
 * Cliente HTTP da API do LeroLero, para qualquer rota. `T` é o tipo de `data` que a rota devolve. Nenhum método lança:
 * todos devolvem `RespostaDaApi<T>`.
 *
 * @example
 * const contatos = await lero.rest.get<Pagina<Contato>>('/contatos', { consulta: { limite: 20 } })
 */
export interface ClienteRest {
  /** O ambiente da chave, ou `null` quando a chave não é do LeroLero. */
  readonly ambiente: Ambiente | null
  /** Um cliente novo, com as mesmas opções e outra chave. Este continua como está. */
  comAChave(chave: string): ClienteRest
  get<T>(caminho: string, opcoes?: OpcoesDaRequisicao): Promise<RespostaDaApi<T>>
  post<T>(caminho: string, corpo?: CorpoDaRequisicao, opcoes?: OpcoesDaRequisicao): Promise<RespostaDaApi<T>>
  put<T>(caminho: string, corpo?: CorpoDaRequisicao, opcoes?: OpcoesDaRequisicao): Promise<RespostaDaApi<T>>
  patch<T>(caminho: string, corpo?: CorpoDaRequisicao, opcoes?: OpcoesDaRequisicao): Promise<RespostaDaApi<T>>
  delete<T>(caminho: string, opcoes?: OpcoesDaRequisicao): Promise<RespostaDaApi<T>>
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface Configuracao {
  readonly chave: ChaveDaApi | null
  readonly urlBase: string
  readonly versao: number
  readonly tempoLimiteMs: number
  readonly cabecalhos: Readonly<Record<string, string>>
  readonly retentativa: OpcoesDeRetentativa
  readonly aoBaterLimite: OpcoesDoClienteRest['aoBaterLimite']
  readonly efeitos: Efeitos
}

interface Pedido {
  readonly metodo: Metodo
  readonly caminho: string
  readonly corpo: CorpoDaRequisicao | undefined
  readonly opcoes: OpcoesDaRequisicao
}

/** A retentativa já decidida para um pedido: as opções do cliente com as da requisição por cima. */
interface PlanoDeRetentativa {
  readonly maximo: number
  readonly espera: (repeticao: number) => number
  readonly esperaMaximaMs: number
  readonly aoTentarDeNovo: OpcoesDeRetentativa['aoTentarDeNovo']
  readonly segura: boolean
}

const URL_DA_API = 'https://api.lerolero.tech'
const VERSAO_DA_API = 1
const TEMPO_LIMITE_PADRAO_MS = 30_000

export function criarClienteRest(opcoes: OpcoesDoClienteRest = {}): ClienteRest {
  const configuracao: Configuracao = Object.freeze({
    chave: lerChave(opcoes.chave ?? variavelDeAmbiente('LERO_API_KEY')),
    urlBase: opcoes.urlBase ?? URL_DA_API,
    versao: opcoes.versao ?? VERSAO_DA_API,
    tempoLimiteMs: opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS,
    cabecalhos: { ...opcoes.cabecalhos },
    retentativa: { ...opcoes.retentativa },
    aoBaterLimite: opcoes.aoBaterLimite,
    efeitos: { ...EFEITOS_DO_NODE, ...opcoes.efeitos },
  })
  const chamar = <T>(metodo: Metodo, caminho: string, corpo?: CorpoDaRequisicao, extras: OpcoesDaRequisicao = {}) =>
    requisitar<T>(configuracao, { metodo, caminho, corpo, opcoes: extras })

  return Object.freeze({
    ambiente: configuracao.chave?.ambiente ?? null,
    comAChave: (chave: string) => criarClienteRest({ ...opcoes, chave }),
    get: <T>(caminho: string, extras?: OpcoesDaRequisicao) => chamar<T>('GET', caminho, undefined, extras),
    post: <T>(caminho: string, corpo?: CorpoDaRequisicao, extras?: OpcoesDaRequisicao) =>
      chamar<T>('POST', caminho, corpo, extras),
    put: <T>(caminho: string, corpo?: CorpoDaRequisicao, extras?: OpcoesDaRequisicao) =>
      chamar<T>('PUT', caminho, corpo, extras),
    patch: <T>(caminho: string, corpo?: CorpoDaRequisicao, extras?: OpcoesDaRequisicao) =>
      chamar<T>('PATCH', caminho, corpo, extras),
    delete: <T>(caminho: string, extras?: OpcoesDaRequisicao) => chamar<T>('DELETE', caminho, undefined, extras),
  })
}

async function requisitar<T>(configuracao: Configuracao, pedido: Pedido): Promise<RespostaDaApi<T>> {
  const { chave, efeitos } = configuracao
  if (!chave) return falhaDeChave()

  const chaveDeIdempotencia = chaveDeIdempotenciaDoPedido(pedido, efeitos)
  const plano = planoDeRetentativa(configuracao, pedido, chaveDeIdempotencia)
  const requisicao = montarRequisicao(configuracao, chave, pedido, chaveDeIdempotencia)

  for (let repeticao = 1; ; repeticao++) {
    const tentativa = await tentarUmaVez(efeitos.buscar, requisicao)
    await avisarDoLimite(configuracao, pedido, tentativa)
    const espera = esperaAntesDeRepetir(tentativa, repeticao, plano, efeitos.agora())
    if (espera === null) {
      return concluir<T>(tentativa, { tentativas: repeticao, chaveDeIdempotencia }, pedido, requisicao.tempoLimiteMs)
    }
    await chamarSemLancar(plano.aoTentarDeNovo, {
      metodo: pedido.metodo,
      caminho: pedido.caminho,
      repeticao,
      motivo: tentativa.tipo === 'resposta' ? 'status' : tentativa.tipo,
      status: tentativa.tipo === 'resposta' ? tentativa.status : null,
      esperaMs: espera,
    })
    await efeitos.esperar(espera)
  }
}

function chaveDeIdempotenciaDoPedido(pedido: Pedido, efeitos: Efeitos): string | null {
  const { idempotencia } = pedido.opcoes
  if (!idempotencia) return null
  return idempotencia.chave ?? efeitos.gerarChaveDeIdempotencia()
}

function planoDeRetentativa(
  configuracao: Configuracao,
  pedido: Pedido,
  chaveDeIdempotencia: string | null,
): PlanoDeRetentativa {
  const opcoes = { ...configuracao.retentativa, ...pedido.opcoes.retentativa }
  const esperaMaximaMs = opcoes.esperaMaximaMs ?? RETENTATIVA_PADRAO.esperaMaximaMs
  return {
    maximo: opcoes.maximo ?? RETENTATIVA_PADRAO.maximo,
    espera: opcoes.espera ?? esperaExponencial(configuracao.efeitos.aleatorio, esperaMaximaMs),
    esperaMaximaMs,
    aoTentarDeNovo: opcoes.aoTentarDeNovo,
    segura: ehSeguraParaRepetir(pedido.metodo, chaveDeIdempotencia),
  }
}

/**
 * A espera antes da próxima tentativa, ou `null` para parar: acabaram as repetições, o erro não se resolve repetindo,
 * ou a API pediu (`Retry-After`) para esperar mais que o teto, e aí é melhor devolver o erro que segurar quem chamou.
 */
function esperaAntesDeRepetir(
  tentativa: Tentativa,
  repeticao: number,
  plano: PlanoDeRetentativa,
  agora: number,
): number | null {
  if (repeticao > plano.maximo || !deveRepetir(tentativa, plano.segura)) return null
  const pedida = esperaPedidaPelaApi(tentativa, agora)
  if (pedida === null) return Math.min(plano.espera(repeticao), plano.esperaMaximaMs)
  return pedida <= plano.esperaMaximaMs ? pedida : null
}

async function avisarDoLimite(configuracao: Configuracao, pedido: Pedido, tentativa: Tentativa): Promise<void> {
  if (tentativa.tipo !== 'resposta' || tentativa.status !== 429) return
  await chamarSemLancar(configuracao.aoBaterLimite, {
    metodo: pedido.metodo,
    caminho: pedido.caminho,
    retryAfterMs: esperaPedidaPelaApi(tentativa, configuracao.efeitos.agora()),
  })
}

/** Os ganchos de quem usa o SDK não podem derrubar a chamada: o SDK promete nunca lançar. */
async function chamarSemLancar<Contexto>(
  gancho: ((contexto: Contexto) => void | Promise<void>) | undefined,
  contexto: Contexto,
): Promise<void> {
  try {
    await gancho?.(contexto)
  } catch {
    // Ignorado de propósito: ver o JSDoc de aoTentarDeNovo e aoBaterLimite.
  }
}

function montarRequisicao(
  configuracao: Configuracao,
  chave: ChaveDaApi,
  pedido: Pedido,
  chaveDeIdempotencia: string | null,
): RequisicaoHttp {
  const multipart = pedido.corpo instanceof FormData
  const json = pedido.corpo !== undefined && !multipart
  return {
    url: montarUrl(configuracao.urlBase, configuracao.versao, pedido.caminho, pedido.opcoes.consulta),
    metodo: pedido.metodo,
    corpo: json ? JSON.stringify(pedido.corpo) : pedido.corpo,
    tempoLimiteMs: pedido.opcoes.tempoLimiteMs ?? configuracao.tempoLimiteMs,
    cabecalhos: {
      Accept: 'application/json',
      'User-Agent': agenteDoUsuario(),
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(chaveDeIdempotencia ? { 'Idempotency-Key': chaveDeIdempotencia } : {}),
      ...configuracao.cabecalhos,
      ...pedido.opcoes.cabecalhos,
      Authorization: `Bearer ${chave.valor}`,
    },
  }
}

function agenteDoUsuario(): string {
  const node = versaoDoNode()
  return `lerolero-node/${VERSAO_DO_SDK}${node ? ` node/${node}` : ''}`
}

function concluir<T>(
  tentativa: Tentativa,
  parcial: Pick<DetalhesDaChamada, 'tentativas' | 'chaveDeIdempotencia'>,
  pedido: Pedido,
  tempoLimiteMs: number,
): RespostaDaApi<T> {
  if (tentativa.tipo === 'rede') {
    return falha({ categoria: 'rede', description: tentativa.descricao }, { ...parcial, status: null, repetida: false })
  }
  if (tentativa.tipo === 'timeout') {
    const erro = falhaPorTempo(pedido.metodo, parcial.chaveDeIdempotencia, tempoLimiteMs)
    return falha(erro, { ...parcial, status: null, repetida: false })
  }
  const detalhes = { ...parcial, status: tentativa.status, repetida: tentativa.repetida }
  const interpretada = interpretarResposta(tentativa.status, tentativa.texto)
  if (!interpretada.sucesso) return falha(interpretada.erro, detalhes)
  // Fronteira de confiança: `data` tem o formato que a rota documenta no OpenAPI. É a única afirmação de tipo do SDK.
  return { sucesso: true, dados: interpretada.dados as T, erro: null, detalhes }
}

function falhaPorTempo(metodo: Metodo, chaveDeIdempotencia: string | null, tempoLimiteMs: number): ErroDaChamada {
  const semResposta = `A API não respondeu em ${tempoLimiteMs} ms.`
  if (metodo === 'GET') return { categoria: 'timeout', possivelmenteProcessada: false, description: semResposta }
  const description = chaveDeIdempotencia
    ? `${semResposta} O pedido pode ter sido processado: repita com a mesma chaveDeIdempotencia e a API não o faz duas vezes.`
    : `${semResposta} O pedido pode ter sido processado: confira antes de tentar de novo.`
  return { categoria: 'timeout', possivelmenteProcessada: true, description }
}

function falhaDeChave<T>(): RespostaDaApi<T> {
  const description =
    'Falta a chave da API: passe { chave } ou defina LERO_API_KEY. Ela começa com lero_test_ (teste) ou lero_live_ (produção).'
  return falha({ categoria: 'configuracao', description }, SEM_CHAMADA)
}

const SEM_CHAMADA: DetalhesDaChamada = { status: null, tentativas: 0, chaveDeIdempotencia: null, repetida: false }

function falha<T>(erro: ErroDaChamada, detalhes: DetalhesDaChamada): RespostaDaApi<T> {
  return { sucesso: false, dados: null, erro, detalhes }
}
