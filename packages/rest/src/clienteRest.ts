import type { Ambiente, DetalhesDaChamada, ErroDaChamada, RespostaDaApi } from '@lerolero/types/v1'
import { type ChaveDaApi, lerChave } from './chave.js'
import {
  finitoNaoNegativo,
  primeiroProblema,
  problemaNaRetentativa,
  problemaNaUrlBase,
  problemaNoPositivo,
} from './configuracao.js'
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
import { type Consulta, montarUrl, problemaNoCaminho } from './url.js'
import { VERSAO_DO_SDK } from './versao.js'

export interface OpcoesDoClienteRest {
  /**
   * A chave da API: `lero_test_...` (teste, no Simulador) ou `lero_live_...` (produção). Sem ela, o cliente lê a
   * variável de ambiente `LERO_API_KEY`. Nunca deixe a chave no código.
   */
  chave?: string | undefined
  /** Padrão: `https://api.lerolero.tech`. Precisa ser https; http só para localhost, 127.0.0.1 e ::1. */
  urlBase?: string
  /** A versão da API no caminho. Padrão: 1 (`/v1`). */
  versao?: number
  /** Tempo limite de cada tentativa. Padrão: 30 segundos. */
  tempoLimiteMs?: number
  /** Tamanho máximo da resposta lida; acima disso, a chamada falha como `resposta_grande`. Padrão: 10 MB. */
  limiteDaRespostaBytes?: number
  /** Cabeçalhos a mais em todas as requisições. `Authorization` e `Idempotency-Key` são sempre os do cliente. */
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
   * Manda `Idempotency-Key`, a mesma em todas as tentativas, gerada quando `chave` fica de fora, e passa a repetir também
   * em 5xx, rede e tempo esgotado, como no GET. Hoje a API só deduplica por essa chave no `POST /v1/messages` (o
   * `mensagens.enviar` já usa). Em outra rota, a API pode fazer o pedido duas vezes: peça só se a repetição for segura ali.
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
  /** Por que as opções do cliente não valem; cada chamada devolve isto sem ir à API. */
  readonly problema: string | null
  readonly urlBase: string
  readonly versao: number
  readonly tempoLimiteMs: number
  readonly limiteDaRespostaBytes: number
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
const LIMITE_DA_RESPOSTA_PADRAO_BYTES = 10 * 1024 * 1024
const SEM_CHAMADA: DetalhesDaChamada = { status: null, tentativas: 0, chaveDeIdempotencia: null, repetida: false }

export function criarClienteRest(opcoes: OpcoesDoClienteRest = {}): ClienteRest {
  const configuracao: Configuracao = Object.freeze({
    chave: lerChave(opcoes.chave ?? variavelDeAmbiente('LERO_API_KEY')),
    problema: problemaNasOpcoes(opcoes),
    urlBase: opcoes.urlBase ?? URL_DA_API,
    versao: opcoes.versao ?? VERSAO_DA_API,
    tempoLimiteMs: opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS,
    limiteDaRespostaBytes: opcoes.limiteDaRespostaBytes ?? LIMITE_DA_RESPOSTA_PADRAO_BYTES,
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

/**
 * A falha de uma chamada que o SDK recusou antes de ir à API (opção ou parâmetro que não vale). Para os módulos do SDK
 * devolverem a mesma forma de resultado sem fazer a requisição.
 */
export function recusaAntesDaChamada<T>(description: string): RespostaDaApi<T> {
  return falha({ categoria: 'configuracao', description }, SEM_CHAMADA)
}

function problemaNasOpcoes(opcoes: OpcoesDoClienteRest): string | null {
  return primeiroProblema(
    problemaNaUrlBase(opcoes.urlBase ?? URL_DA_API),
    problemaNoPositivo('tempoLimiteMs', opcoes.tempoLimiteMs),
    problemaNoPositivo('limiteDaRespostaBytes', opcoes.limiteDaRespostaBytes),
    problemaNaRetentativa(opcoes.retentativa),
  )
}

function problemaNoPedido(pedido: Pedido): string | null {
  return primeiroProblema(
    problemaNoCaminho(pedido.caminho),
    problemaNoPositivo('tempoLimiteMs', pedido.opcoes.tempoLimiteMs),
    problemaNaRetentativa(pedido.opcoes.retentativa),
  )
}

async function requisitar<T>(configuracao: Configuracao, pedido: Pedido): Promise<RespostaDaApi<T>> {
  const { chave, efeitos } = configuracao
  if (!chave) return falhaDeChave()
  const problema = primeiroProblema(configuracao.problema, problemaNoPedido(pedido))
  if (problema) return recusaAntesDaChamada(problema)

  const chaveDeIdempotencia = chaveDeIdempotenciaDoPedido(pedido, efeitos)
  const plano = planoDeRetentativa(configuracao, pedido, chaveDeIdempotencia)
  const requisicao = montarRequisicao(configuracao, chave, pedido, chaveDeIdempotencia)
  if (!requisicao) return recusaAntesDaChamada('Um dos cabeçalhos tem nome ou valor inválido (ex.: quebra de linha).')

  for (let repeticao = 1; ; repeticao++) {
    const tentativa = await tentarUmaVez(efeitos.buscar, requisicao)
    await avisarDoLimite(configuracao, pedido, tentativa)
    const espera = esperaAntesDeRepetir(tentativa, repeticao, plano, efeitos.agora())
    if (espera === null)
      return concluir<T>(tentativa, { tentativas: repeticao, chaveDeIdempotencia }, pedido, requisicao)
    await chamarSemLancar(plano.aoTentarDeNovo, {
      metodo: pedido.metodo,
      caminho: pedido.caminho,
      repeticao,
      motivo: tentativa.tipo === 'resposta' ? 'status' : tentativa.tipo === 'rede' ? 'rede' : 'timeout',
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
  const padrao = esperaExponencial(configuracao.efeitos.aleatorio, esperaMaximaMs)
  return {
    maximo: opcoes.maximo ?? RETENTATIVA_PADRAO.maximo,
    espera: opcoes.espera ? esperaDeQuemChama(opcoes.espera, padrao) : padrao,
    esperaMaximaMs,
    aoTentarDeNovo: opcoes.aoTentarDeNovo,
    segura: ehSeguraParaRepetir(pedido.metodo, chaveDeIdempotencia),
  }
}

/** A espera de quem chama, com a padrão no lugar quando ela lança ou devolve negativo, `NaN` ou `Infinity`. */
function esperaDeQuemChama(
  espera: (repeticao: number) => number,
  padrao: (repeticao: number) => number,
): (repeticao: number) => number {
  return (repeticao) => {
    try {
      const pedida = espera(repeticao)
      return finitoNaoNegativo(pedida) ? pedida : padrao(repeticao)
    } catch {
      return padrao(repeticao)
    }
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

/** A requisição pronta, ou `null` quando um cabeçalho de quem chama não é válido em HTTP. */
function montarRequisicao(
  configuracao: Configuracao,
  chave: ChaveDaApi,
  pedido: Pedido,
  chaveDeIdempotencia: string | null,
): RequisicaoHttp | null {
  const multipart = pedido.corpo instanceof FormData
  const json = pedido.corpo !== undefined && !multipart
  const cabecalhos = montarCabecalhos(configuracao, chave, pedido, { json, multipart, chaveDeIdempotencia })
  if (!cabecalhos) return null
  return {
    url: montarUrl(configuracao.urlBase, configuracao.versao, pedido.caminho, pedido.opcoes.consulta),
    metodo: pedido.metodo,
    corpo: json ? JSON.stringify(pedido.corpo) : pedido.corpo,
    tempoLimiteMs: pedido.opcoes.tempoLimiteMs ?? configuracao.tempoLimiteMs,
    limiteDaRespostaBytes: configuracao.limiteDaRespostaBytes,
    cabecalhos,
  }
}

interface FormaDoCorpo {
  readonly json: boolean
  readonly multipart: boolean
  readonly chaveDeIdempotencia: string | null
}

/**
 * Os cabeçalhos extras entram primeiro e o que é do cliente vem por cima, sem diferença de maiúsculas: `Authorization`
 * (em qualquer grafia) e `Idempotency-Key` não podem ser trocados por quem chama. No multipart, o `Content-Type` fica
 * com o `fetch`, que põe o `boundary` do `FormData`.
 */
function montarCabecalhos(
  configuracao: Configuracao,
  chave: ChaveDaApi,
  pedido: Pedido,
  forma: FormaDoCorpo,
): Headers | null {
  try {
    const cabecalhos = new Headers({ Accept: 'application/json', 'User-Agent': agenteDoUsuario() })
    for (const extras of [configuracao.cabecalhos, pedido.opcoes.cabecalhos ?? {}]) {
      for (const [nome, valor] of Object.entries(extras)) cabecalhos.set(nome, valor)
    }
    cabecalhos.delete('Idempotency-Key')
    if (forma.multipart) cabecalhos.delete('Content-Type')
    if (forma.json) cabecalhos.set('Content-Type', 'application/json')
    if (forma.chaveDeIdempotencia) cabecalhos.set('Idempotency-Key', forma.chaveDeIdempotencia)
    cabecalhos.set('Authorization', `Bearer ${chave.valor}`)
    return cabecalhos
  } catch {
    return null
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
  requisicao: RequisicaoHttp,
): RespostaDaApi<T> {
  const semResposta = { ...parcial, status: null, repetida: false }
  if (tentativa.tipo === 'rede') return falha({ categoria: 'rede', description: tentativa.descricao }, semResposta)
  if (tentativa.tipo === 'timeout') {
    return falha(falhaPorTempo(pedido.metodo, parcial.chaveDeIdempotencia, requisicao.tempoLimiteMs), semResposta)
  }
  if (tentativa.tipo === 'grande_demais') {
    const erro = falhaPorTamanho(requisicao.limiteDaRespostaBytes)
    return falha(erro, { ...parcial, status: tentativa.status, repetida: false })
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
    ? `${semResposta} O pedido pode ter sido processado: repita com a mesma chaveDeIdempotencia (no envio de mensagem, a API não o faz duas vezes).`
    : `${semResposta} O pedido pode ter sido processado: confira antes de tentar de novo.`
  return { categoria: 'timeout', possivelmenteProcessada: true, description }
}

function falhaPorTamanho(limiteBytes: number): ErroDaChamada {
  const description = `A resposta passou de ${limiteBytes} bytes e não foi lida. Aumente limiteDaRespostaBytes se ela for esperada.`
  return { categoria: 'resposta_grande', description, limiteBytes }
}

function falhaDeChave<T>(): RespostaDaApi<T> {
  return recusaAntesDaChamada(
    'Falta a chave da API, ou ela está fora do formato: passe { chave } ou defina LERO_API_KEY, com lero_test_ (teste) ou lero_live_ (produção) e só letras, números, _ e -.',
  )
}

function falha<T>(erro: ErroDaChamada, detalhes: DetalhesDaChamada): RespostaDaApi<T> {
  return { sucesso: false, dados: null, erro, detalhes }
}
