/** Uma ida à API: a resposta que voltou, ou por que não voltou. */
export type Tentativa =
  | { tipo: 'resposta'; status: number; texto: string; retryAfter: string | null; repetida: boolean }
  | { tipo: 'rede'; descricao: string }
  | { tipo: 'timeout' }

export interface RequisicaoHttp {
  readonly url: string
  readonly metodo: string
  readonly cabecalhos: Readonly<Record<string, string>>
  readonly corpo: string | FormData | undefined
  readonly tempoLimiteMs: number
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
    return {
      tipo: 'resposta',
      status: resposta.status,
      texto: await resposta.text(),
      retryAfter: resposta.headers.get('retry-after'),
      repetida: resposta.headers.get(CABECALHO_DA_REPETICAO) === 'true',
    }
  } catch (erro: unknown) {
    return esgotouOTempo(erro) ? { tipo: 'timeout' } : { tipo: 'rede', descricao: descricaoDaFalhaDeRede(erro) }
  }
}

function esgotouOTempo(erro: unknown): boolean {
  return erro instanceof Error && (erro.name === 'TimeoutError' || erro.name === 'AbortError')
}

function descricaoDaFalhaDeRede(erro: unknown): string {
  if (!(erro instanceof Error)) return 'A requisição não chegou à API.'
  const causa = erro.cause instanceof Error ? `: ${erro.cause.message}` : ''
  return `A requisição não chegou à API (${erro.message}${causa}).`
}
