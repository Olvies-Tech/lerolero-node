/** Uma ida à API: a resposta que voltou, ou por que não voltou. */
export type Tentativa =
  | { tipo: 'resposta'; status: number; texto: string; retryAfter: string | null; repetida: boolean }
  | { tipo: 'grande_demais'; status: number }
  | { tipo: 'rede'; descricao: string }
  | { tipo: 'timeout' }

export interface RequisicaoHttp {
  readonly url: string
  readonly metodo: string
  readonly cabecalhos: Headers
  readonly corpo: string | FormData | undefined
  readonly tempoLimiteMs: number
  readonly limiteDaRespostaBytes: number
}

const CABECALHO_DA_REPETICAO = 'idempotent-replayed'

/** Faz a requisição uma vez e traduz exceção do `fetch` (rede, tempo esgotado) em valor. */
export async function tentarUmaVez(buscar: typeof fetch, requisicao: RequisicaoHttp): Promise<Tentativa> {
  try {
    const resposta = await buscar(requisicao.url, {
      method: requisicao.metodo,
      headers: requisicao.cabecalhos,
      body: requisicao.corpo ?? null,
      signal: AbortSignal.timeout(requisicao.tempoLimiteMs),
      redirect: 'error',
    })
    const texto = await lerAteOLimite(resposta, requisicao.limiteDaRespostaBytes)
    if (texto === null) return { tipo: 'grande_demais', status: resposta.status }
    return {
      tipo: 'resposta',
      status: resposta.status,
      texto,
      retryAfter: resposta.headers.get('retry-after'),
      repetida: resposta.headers.get(CABECALHO_DA_REPETICAO) === 'true',
    }
  } catch (erro: unknown) {
    return esgotouOTempo(erro) ? { tipo: 'timeout' } : { tipo: 'rede', descricao: descricaoDaFalhaDeRede(erro) }
  }
}

/**
 * O corpo em texto, ou `null` quando passa do limite: um servidor no caminho que responda sem parar não enche a
 * memória de quem chama. Confere o `Content-Length` antes e conta os bytes enquanto lê.
 */
async function lerAteOLimite(resposta: Response, limite: number): Promise<string | null> {
  const declarado = Number(resposta.headers.get('content-length') ?? Number.NaN)
  if (Number.isFinite(declarado) && declarado > limite) {
    await resposta.body?.cancel()
    return null
  }
  if (!resposta.body) return ''
  const leitor = resposta.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    if (!(value instanceof Uint8Array)) continue
    total += value.byteLength
    if (total > limite) {
      await leitor.cancel()
      return null
    }
    partes.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(partes))
}

function esgotouOTempo(erro: unknown): boolean {
  return erro instanceof Error && (erro.name === 'TimeoutError' || erro.name === 'AbortError')
}

function descricaoDaFalhaDeRede(erro: unknown): string {
  if (!(erro instanceof Error)) return 'A requisição não chegou à API.'
  const causa = erro.cause instanceof Error ? `: ${erro.cause.message}` : ''
  return `A requisição não chegou à API (${erro.message}${causa}).`
}
